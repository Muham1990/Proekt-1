import gsap from 'gsap';
import { rewardConfig, findPrize, prizeName, prizeLabel } from './rewards-config.js';
import {
  spinReward,
  fetchRewardStatus,
  getLocalClaim,
  saveLocalClaim,
  startNewRewardSession,
  getRewardSessionId,
  attachRewardToOrder
} from './reward-service.js';

const STATES = {
  LOCKED: 'LOCKED',
  ELIGIBLE: 'ELIGIBLE',
  OPENING: 'OPENING',
  READY: 'READY',
  SPINNING: 'SPINNING',
  SELECTED: 'SELECTED',
  REVEAL: 'REWARD_REVEAL',
  CLAIMED: 'CLAIMED'
};

let state = STATES.LOCKED;
let busy = false;
let lastTotal = 0;
let wasEligible = false;
let reduceMotion = false;
let wheelRotation = 0;
let selectedIndex = -1;
let audioCtx = null;
let lastTickSector = -1;
let resizeObserver = null;
const prizeImages = new Map();

function dict() {
  return (window.I18N && window.I18N[window.currentLang || 'ru']) || {};
}

function lang() {
  return window.currentLang || 'ru';
}

function snapshot() {
  return typeof window.getCartSnapshot === 'function'
    ? window.getCartSnapshot()
    : { total: 0, count: 0, items: [] };
}

function $(id) {
  return document.getElementById(id);
}

function prizes() {
  return rewardConfig.prizes;
}

function sliceDeg() {
  return 360 / prizes().length;
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function setState(next) {
  state = next;
  document.querySelectorAll('[data-reward-root]').forEach((el) => {
    el.dataset.rewardState = next;
  });
}

function localizeStatic() {
  const t = dict();
  document.querySelectorAll('[data-reward-i18n]').forEach((el) => {
    const key = el.getAttribute('data-reward-i18n');
    if (t[key] !== undefined) el.innerHTML = t[key];
  });
  document.querySelectorAll('[data-reward-aria]').forEach((el) => {
    const key = el.getAttribute('data-reward-aria');
    if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
  });
}

function updateProgress(total) {
  const min = rewardConfig.minOrderAmount;
  const remaining = Math.max(0, min - total);
  const pct = Math.max(0, Math.min(100, (total / min) * 100));
  const fill = $('rewardProgressFill');
  const nums = $('rewardProgressNums');
  const hint = $('rewardProgressHint');
  const openBtn = $('rewardOpenBtn');
  const live = $('rewardLive');
  const card = $('rewardProgress');
  const t = dict();
  const unit = t.unit || 'сомони';
  const claim = getLocalClaim();
  const alreadyWon = claim && (claim.status === 'won' || claim.status === 'claimed');

  if (nums) nums.textContent = `${total} / ${min} ${unit}`;
  if (fill) fill.style.width = `${pct}%`;
  const bar = $('rewardProgressBar');
  if (bar) {
    bar.setAttribute('aria-valuenow', String(Math.min(total, min)));
    bar.setAttribute('aria-valuemax', String(min));
  }

  if (alreadyWon) {
    setState(STATES.CLAIMED);
    if (hint) hint.textContent = t.reward_claimed_hint || '';
    if (openBtn) {
      openBtn.hidden = false;
      openBtn.disabled = false;
      openBtn.querySelector('span').textContent = t.reward_view || t.reward_open;
    }
    card?.classList.add('is-unlocked');
    card?.classList.remove('is-locked');
    return;
  }

  if (total < min) {
    setState(STATES.LOCKED);
    card?.classList.add('is-locked');
    card?.classList.remove('is-unlocked');
    if (hint) hint.textContent = (t.reward_need_more || '').replace('{n}', String(remaining));
    if (openBtn) {
      openBtn.hidden = true;
      openBtn.disabled = true;
    }
    wasEligible = false;
  } else {
    const justUnlocked = !wasEligible && lastTotal < min;
    setState(STATES.ELIGIBLE);
    card?.classList.remove('is-locked');
    card?.classList.add('is-unlocked');
    if (hint) hint.textContent = t.reward_unlocked || '';
    if (openBtn) {
      openBtn.hidden = false;
      openBtn.disabled = false;
      openBtn.querySelector('span').textContent = t.reward_open;
    }
    if (justUnlocked) playUnlock(card, live, t);
    wasEligible = true;
  }
  lastTotal = total;
}

function playUnlock(card, live, t) {
  if (live) live.textContent = t.reward_unlocked || '';
  if (!card) return;
  card.classList.add('is-unlocking');
  if (reduceMotion) {
    card.classList.remove('is-unlocking');
    return;
  }
  gsap.fromTo(card, { scale: 1 }, {
    scale: 1.03,
    duration: 0.45,
    yoyo: true,
    repeat: 1,
    ease: 'power2.out',
    onComplete() { card.classList.remove('is-unlocking'); }
  });
}

function unlockAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
}

function playTone(freq, duration, gainValue) {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    /* autoplay / closed context */
  }
}

function playTick() {
  playTone(720, 0.045, 0.035);
}

function playWinSound() {
  playTone(392, 0.18, 0.05);
  setTimeout(() => playTone(523, 0.28, 0.045), 90);
}

function sectorAtRotation(rot) {
  const n = prizes().length;
  const slice = 360 / n;
  const local = (360 - ((rot % 360) + 360) % 360) % 360;
  return Math.floor(local / slice) % n;
}

function landingRotation(index, extraTurns, jitter) {
  const slice = sliceDeg();
  const base = (360 - (index + 0.5) * slice + jitter + 360) % 360;
  return extraTurns * 360 + base;
}

function applyWheelTransform() {
  const el = $('bonusWheelSpin');
  if (el) el.style.transform = `rotate(${wheelRotation}deg)`;
}

function canvasSize() {
  const canvas = $('bonusWheelCanvas');
  const spin = $('bonusWheelSpin');
  if (!canvas) return 320;
  const css = Math.max(220, Math.round(spin?.clientWidth || canvas.clientWidth || 320));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${css}px`;
  canvas.style.height = `${css}px`;
  canvas.width = Math.max(1, Math.round(css * dpr));
  canvas.height = Math.max(1, Math.round(css * dpr));
  return css;
}

function drawWheel() {
  const canvas = $('bonusWheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const css = canvasSize();
  const dpr = canvas.width / css;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = css / 2;
  const cy = css / 2;
  const radius = css / 2 - 8;
  const list = prizes();
  const slice = (Math.PI * 2) / list.length;

  ctx.clearRect(0, 0, css, css);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);

  list.forEach((prize, i) => {
    const start = i * slice;
    const end = start + slice;
    const dim = selectedIndex >= 0 && i !== selectedIndex;
    const hot = selectedIndex === i;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    const grad = ctx.createRadialGradient(0, 0, radius * 0.12, 0, 0, radius);
    grad.addColorStop(0, prize.colors[1]);
    grad.addColorStop(1, prize.colors[0]);
    ctx.globalAlpha = dim ? 0.38 : 1;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = hot ? 'rgba(243,217,156,.95)' : 'rgba(217,181,106,.28)';
    ctx.lineWidth = hot ? 3 : 1.2;
    ctx.stroke();

    ctx.save();
    ctx.rotate(start + slice / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = hot ? '#fff6dc' : '#f3ead9';
    ctx.shadowColor = 'rgba(0,0,0,.45)';
    ctx.shadowBlur = 6;
    ctx.font = `600 ${Math.max(11, css * 0.028)}px Manrope, sans-serif`;
    ctx.fillText(prize.icon || '✦', 0, -radius * 0.72);
    ctx.font = `600 ${Math.max(10, css * 0.034)}px Marcellus, Cormorant Garamond, serif`;
    ctx.fillText(prizeLabel(prize, lang()), 0, -radius * 0.52);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12,8,5,.55)';
  ctx.fill();
  ctx.restore();
}

function preloadPrizeImages() {
  prizes().forEach((prize) => {
    if (!prize.image || prizeImages.has(prize.id)) return;
    const img = new Image();
    img.src = prize.image;
    prizeImages.set(prize.id, img);
  });
}

function resetScene() {
  selectedIndex = -1;
  wheelRotation = 0;
  applyWheelTransform();
  drawWheel();
  if ($('rewardWin')) $('rewardWin').hidden = true;
  if ($('rewardError')) $('rewardError').hidden = true;
  const spin = $('rewardSpinBtn');
  if (spin) {
    spin.disabled = false;
    spin.hidden = false;
    const t = dict();
    spin.querySelector('span').textContent = t.reward_spin || '';
  }
  $('rewardConfetti') && ($('rewardConfetti').hidden = true);
}

function openScene() {
  const overlay = $('rewardModal');
  if (!overlay) return;
  const claim = getLocalClaim();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  $('cartDrawer')?.classList.remove('open');
  $('cartOverlay')?.classList.remove('open');
  localizeStatic();
  resetScene();
  requestAnimationFrame(drawWheel);
  if (claim && (claim.status === 'won' || claim.status === 'claimed')) {
    showExistingWin(claim);
  } else {
    setState(STATES.OPENING);
    const stage = $('bonusWheel');
    if (!reduceMotion && stage) {
      gsap.fromTo(stage, { opacity: 0, scale: 0.92 }, {
        opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out',
        onComplete() { setState(STATES.READY); }
      });
    } else {
      setState(STATES.READY);
    }
    $('rewardSpinBtn')?.focus();
  }
}

function closeScene() {
  $('rewardModal')?.classList.remove('open');
  $('rewardModal')?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
  busy = false;
  updateProgress(snapshot().total);
}

function showError() {
  const t = dict();
  if ($('rewardWin')) $('rewardWin').hidden = true;
  const box = $('rewardError');
  if (box) {
    box.hidden = false;
    box.querySelector('[data-reward-error-title]').textContent = t.reward_fail_title || '';
  }
  const spin = $('rewardSpinBtn');
  if (spin) {
    spin.disabled = false;
    spin.hidden = false;
    spin.querySelector('span').textContent = t.reward_spin || '';
  }
  busy = false;
  setState(STATES.READY);
}

function showExistingWin(claim) {
  const prize = findPrize(claim.rewardId);
  const index = Math.max(0, prizes().findIndex((p) => p.id === claim.rewardId));
  selectedIndex = index;
  wheelRotation = landingRotation(index, 0, 0);
  applyWheelTransform();
  drawWheel();
  revealCopy(claim, prize);
  const spin = $('rewardSpinBtn');
  if (spin) {
    spin.disabled = true;
    spin.hidden = true;
  }
  setState(STATES.CLAIMED);
}

function resultCopy(claim, prize) {
  const t = dict();
  const type = claim.rewardType || prize?.type || 'food';
  if (type === 'cash') return t.reward_sub_cash || '';
  if (type === 'discount') return t.reward_sub_discount || '';
  if (type === 'drink') return t.reward_sub_drink || '';
  return t.reward_sub_food || t.reward_win_sub || '';
}

function revealCopy(claim, prize) {
  const t = dict();
  const win = $('rewardWin');
  if (!win) return;
  win.hidden = false;
  const name = claim.rewardName || prizeName(prize, lang());
  $('rewardWinName').textContent = name;
  $('rewardWinSub').textContent = resultCopy(claim, prize);
  const photo = $('rewardWinPhoto');
  const badge = $('rewardWinBadge');
  const type = claim.rewardType || prize?.type || 'food';
  const image = claim.image || prize?.image;
  if (photo) {
    if (image && (type === 'food' || type === 'drink')) {
      photo.hidden = false;
      photo.src = image;
      photo.alt = name;
    } else {
      photo.hidden = true;
      photo.removeAttribute('src');
    }
  }
  if (badge) {
    const showBadge = type === 'cash' || type === 'discount';
    badge.hidden = !showBadge;
    badge.textContent = showBadge ? (type === 'cash' ? `+${name}` : name) : '';
  }
  const claimBtn = $('rewardClaimBtn');
  if (claimBtn) {
    const already = claim.status === 'claimed';
    claimBtn.hidden = already;
    claimBtn.disabled = already;
    const label = type === 'food' || type === 'drink' ? t.reward_claim : t.reward_claim_bonus;
    if (claimBtn.querySelector('span')) claimBtn.querySelector('span').textContent = label || t.reward_claim;
  }
  $('rewardLive').textContent = `${t.reward_win_title || ''} ${name}`;
  if ($('rewardSpinBtn')) $('rewardSpinBtn').hidden = true;
  requestAnimationFrame(() => {
    win.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
  });
}

function burstConfetti() {
  const canvas = $('rewardConfetti');
  if (!canvas || reduceMotion) return;
  const scene = document.querySelector('.reward-scene');
  if (!scene) return;
  const rect = scene.getBoundingClientRect();
  canvas.hidden = false;
  canvas.width = Math.round(rect.width);
  canvas.height = Math.round(rect.height);
  const ctx = canvas.getContext('2d');
  const bits = Array.from({ length: 18 }, () => ({
    x: canvas.width * 0.5 + (Math.random() - 0.5) * 80,
    y: canvas.height * 0.28,
    vx: (Math.random() - 0.5) * 3.2,
    vy: Math.random() * -2.4 - 0.6,
    s: 3 + Math.random() * 4,
    a: 1,
    c: Math.random() > 0.5 ? '#d9b56a' : '#f3d99c'
  }));
  const start = performance.now();
  function frame(now) {
    const t = (now - start) / 1100;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bits.forEach((b) => {
      b.vy += 0.05;
      b.x += b.vx;
      b.y += b.vy;
      b.a = Math.max(0, 1 - t);
      ctx.globalAlpha = b.a;
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, b.y, b.s, b.s * 0.45);
    });
    ctx.globalAlpha = 1;
    if (t < 1) requestAnimationFrame(frame);
    else canvas.hidden = true;
  }
  requestAnimationFrame(frame);
}

function spinToIndex(index) {
  const slice = sliceDeg();
  const jitter = reduceMotion ? 0 : (Math.random() - 0.5) * slice * 0.4;
  const turns = reduceMotion ? 1 : 5 + Math.floor(Math.random() * 3);
  const currentMod = ((wheelRotation % 360) + 360) % 360;
  const landing = landingRotation(index, 0, jitter);
  const extra = (landing - currentMod + 360) % 360;
  const target = wheelRotation + turns * 360 + extra;
  const duration = reduceMotion ? 0.7 : 5.1;
  lastTickSector = sectorAtRotation(wheelRotation);
  const pointer = $('bonusWheelPointer');
  const proxy = { rot: wheelRotation };

  return new Promise((resolve) => {
    gsap.to(proxy, {
      rot: target,
      duration,
      ease: reduceMotion ? 'power2.out' : 'expo.out',
      onUpdate() {
        wheelRotation = proxy.rot;
        applyWheelTransform();
        const sector = sectorAtRotation(wheelRotation);
        if (sector !== lastTickSector) {
          lastTickSector = sector;
          playTick();
          if (pointer && !reduceMotion) {
            gsap.fromTo(pointer, { scale: 1 }, { scale: 1.08, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' });
          }
        }
      },
      onComplete() {
        wheelRotation = target;
        applyWheelTransform();
        resolve();
      }
    });
  });
}

async function onSpin() {
  if (busy || state === STATES.SPINNING || state === STATES.CLAIMED) return;
  const cart = snapshot();
  if (cart.total < rewardConfig.minOrderAmount) return;
  const existing = getLocalClaim();
  if (existing && (existing.status === 'won' || existing.status === 'claimed')) {
    showExistingWin(existing);
    return;
  }

  unlockAudio();
  busy = true;
  setState(STATES.SPINNING);
  const t = dict();
  const spinBtn = $('rewardSpinBtn');
  if (spinBtn) {
    spinBtn.disabled = true;
    spinBtn.querySelector('span').textContent = t.reward_spinning || '';
  }
  if ($('rewardError')) $('rewardError').hidden = true;

  let claim;
  try {
    const result = await spinReward({ items: cart.items });
    claim = result.claim;
  } catch (err) {
    if (err.code === 'already_claimed' || err.status === 409) {
      claim = err.claim || getLocalClaim();
      if (claim) {
        showExistingWin(claim);
        busy = false;
        return;
      }
    }
    showError();
    return;
  }

  const prize = findPrize(claim.rewardId);
  const targetIndex = Math.max(0, prizes().findIndex((p) => p.id === claim.rewardId));
  try {
    await spinToIndex(targetIndex);
    if (!$('rewardModal')?.classList.contains('open')) {
      busy = false;
      return;
    }
    selectedIndex = targetIndex;
    drawWheel();
    setState(STATES.SELECTED);
    playWinSound();
    try { navigator.vibrate?.(50); } catch { /* optional */ }
    if (!reduceMotion && $('bonusWheelPointer')) {
      gsap.fromTo($('bonusWheelPointer'), { scale: 1 }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1 });
    }
    setState(STATES.REVEAL);
    revealCopy(claim, prize);
    burstConfetti();
  } catch {
    showError();
    return;
  }
  busy = false;
}

function onClaim() {
  const claim = getLocalClaim();
  if (!claim) return;
  saveLocalClaim({ ...claim, status: 'claimed' });
  const t = dict();
  if (typeof window.showToast === 'function') {
    window.showToast(t.reward_claim_toast || '');
  }
  setState(STATES.CLAIMED);
  if ($('rewardClaimBtn')) $('rewardClaimBtn').hidden = true;
  closeScene();
}

function trapFocus(e) {
  const overlay = $('rewardModal');
  if (!overlay?.classList.contains('open') || e.key !== 'Tab') return;
  const nodes = [...overlay.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.offsetParent !== null);
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

export async function initRewards() {
  if (!rewardConfig.enabled) return;
  reduceMotion = prefersReducedMotion();
  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    reduceMotion = e.matches;
  });
  localizeStatic();
  preloadPrizeImages();
  drawWheel();
  const frame = document.querySelector('.bonus-wheel__frame');
  if (frame && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => drawWheel());
    resizeObserver.observe(frame);
  }
  window.addEventListener('resize', drawWheel);
  await fetchRewardStatus();
  updateProgress(snapshot().total);

  $('rewardOpenBtn')?.addEventListener('click', openScene);
  $('rewardSpinBtn')?.addEventListener('click', onSpin);
  $('rewardClaimBtn')?.addEventListener('click', onClaim);
  $('rewardRetryBtn')?.addEventListener('click', () => {
    $('rewardError').hidden = true;
    resetScene();
    setState(STATES.READY);
  });
  $('rewardCloseBtn')?.addEventListener('click', closeScene);
  $('rewardModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'rewardModal') closeScene();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('rewardModal')?.classList.contains('open')) closeScene();
    trapFocus(e);
  });

  window.addEventListener('plovtg-cart-updated', (e) => {
    updateProgress(e.detail?.total ?? snapshot().total);
  });
  window.addEventListener('plovtg-order-complete', async (e) => {
    const orderId = e.detail?.orderId || e.detail?.id;
    if (orderId) await attachRewardToOrder(orderId);
    startNewRewardSession();
    wasEligible = false;
    lastTotal = 0;
    updateProgress(0);
  });
  window.updateRewardI18n = () => {
    localizeStatic();
    drawWheel();
    updateProgress(snapshot().total);
  };
  window.getRewardClaimId = () => getLocalClaim()?.claimId || null;
  window.getRewardSessionId = getRewardSessionId;
}

initRewards();
