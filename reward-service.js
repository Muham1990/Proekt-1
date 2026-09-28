import { rewardConfig, findPrize, prizeName, selectRewardLocal } from './rewards-config.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(rewardConfig.storageKey) || 'null') || {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(rewardConfig.storageKey, JSON.stringify(data));
}

export function getRewardSessionId() {
  const store = readStore();
  if (store.sessionId && UUID_RE.test(store.sessionId)) return store.sessionId;
  const sessionId = crypto.randomUUID();
  writeStore({ ...store, sessionId });
  return sessionId;
}

export function getLocalClaim() {
  return readStore().claim || null;
}

export function saveLocalClaim(claim) {
  const store = readStore();
  writeStore({ ...store, sessionId: store.sessionId || getRewardSessionId(), claim });
}

export function startNewRewardSession() {
  writeStore({ sessionId: crypto.randomUUID(), claim: null });
}

export function cartHash(items) {
  return (items || [])
    .map((item) => `${item.id}:${item.qty}`)
    .sort()
    .join('|');
}

function toClaim(payload, fallbackPrize) {
  const prize = findPrize(payload.rewardId) || fallbackPrize;
  const lang = window.currentLang || 'ru';
  return {
    orderId: payload.orderId || null,
    rewardId: payload.rewardId,
    rewardName: payload.rewardName || prizeName(prize, lang),
    image: payload.image || prize?.image || '',
    rewardType: payload.rewardType || prize?.type || 'food',
    claimId: payload.claimId,
    status: payload.status || 'won',
    createdAt: payload.createdAt || new Date().toISOString(),
    mode: payload.mode || 'api'
  };
}

async function apiSpin(sessionId, items) {
  const data = await apiPost('/api/rewards/spin', { sessionId, items });
  return toClaim(data);
}

function demoSpin() {
  const prize = selectRewardLocal();
  const lang = window.currentLang || 'ru';
  return toClaim({
    rewardId: prize.id,
    rewardName: prizeName(prize, lang),
    rewardType: prize.type,
    image: prize.image || null,
    claimId: `demo-${crypto.randomUUID()}`,
    status: 'won',
    createdAt: new Date().toISOString(),
    mode: 'demo'
  }, prize);
}

export async function spinReward({ items }) {
  const sessionId = getRewardSessionId();
  const existing = getLocalClaim();
  if (existing && (existing.status === 'won' || existing.status === 'claimed')) {
    const err = new Error('already_claimed');
    err.code = 'already_claimed';
    err.claim = existing;
    throw err;
  }
  try {
    const claim = await apiSpin(sessionId, items);
    saveLocalClaim(claim);
    return { claim, mode: 'api' };
  } catch (err) {
    if (err.code === 'already_claimed') throw err;
    if (err.status === 409) {
      const raw = err.data?.claim || err.claim;
      if (raw) {
        const claim = toClaim(raw);
        saveLocalClaim(claim);
        const next = new Error(err.message || 'already_claimed');
        next.code = 'already_claimed';
        next.status = 409;
        next.claim = claim;
        throw next;
      }
    }
    if (err.status === 404 || err.status === 501) {
      const claim = demoSpin();
      saveLocalClaim(claim);
      return { claim, mode: 'demo' };
    }
    throw err;
  }
}

export async function fetchRewardStatus() {
  const sessionId = getRewardSessionId();
  try {
    const data = await apiGet(`/api/rewards/status?sessionId=${encodeURIComponent(sessionId)}`);
    if (data?.claim) {
      const claim = toClaim(data.claim);
      saveLocalClaim(claim);
      return claim;
    }
  } catch {
    /* keep local */
  }
  return getLocalClaim();
}

export async function attachRewardToOrder(orderId) {
  const claim = getLocalClaim();
  const sessionId = getRewardSessionId();
  if (!claim?.claimId || String(claim.claimId).startsWith('demo-')) return claim;
  try {
    const data = await apiPost('/api/rewards/attach', {
      sessionId,
      claimId: claim.claimId,
      orderId
    });
    const next = toClaim({ ...claim, ...data, status: data.status || 'claimed', orderId: String(orderId) });
    saveLocalClaim(next);
    return next;
  } catch {
    return claim;
  }
}

export { rewardConfig };
