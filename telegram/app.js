'use strict';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
tg?.setHeaderColor?.('#0a0806');
tg?.setBackgroundColor?.('#0a0806');

const CATS = {
  main: { title: 'Основные', emoji: '🍚' },
  grill: { title: 'Гриль', emoji: '🍢' },
  bakery: { title: 'Выпечка', emoji: '🥟' },
  soup: { title: 'Супы', emoji: '🍲' },
  dessert: { title: 'Десерты', emoji: '🍰' },
  drink: { title: 'Напитки', emoji: '🍵' }
};
const TILES = [
  { id: 'plov', emoji: '🍚' },
  { id: 'manti', emoji: '🥟' },
  { id: 'shashlik', emoji: '🍢' },
  { id: 'kurutob', emoji: '🥣' },
  { id: 'samsa', emoji: '🥟' },
  { id: 'oshi-tugrama', emoji: '🍲' },
  { id: 'lagman', emoji: '🍜' },
  { id: 'jiz', emoji: '🔥' }
];

const state = {
  dishes: [],
  cart: JSON.parse(localStorage.getItem('plovtg_tg_cart') || '[]'),
  screen: 'home',
  listCat: null,
  dish: null,
  geo: null,
  sessionId: localStorage.getItem('plovtg_tg_reward') || crypto.randomUUID(),
  claim: null
};
localStorage.setItem('plovtg_tg_reward', state.sessionId);

function saveCart() {
  localStorage.setItem('plovtg_tg_cart', JSON.stringify(state.cart));
  const n = state.cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cartBadge').textContent = n;
}

function toast(text) {
  const el = document.getElementById('toast');
  el.textContent = text;
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 1600);
}

function initData() {
  return tg?.initData || '';
}

async function api(path, body, method = 'GET') {
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData()
    },
    body: body !== undefined ? JSON.stringify({ ...body, initData: initData() }) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

function go(name) {
  state.screen = name;
  document.querySelectorAll('.screen').forEach((el) => el.classList.toggle('is-on', el.id === `screen-${name}`));
  if (name === 'cart') renderCart();
  if (name === 'checkout') renderCheckoutSummary();
  if (name === 'orders') loadOrders();
  if (name === 'gifts') loadGifts();
}

function receiptRows() {
  return state.cart.map((row) => {
    const d = dishById(row.id);
    const sum = (d?.price || 0) * row.qty;
    return `<div class="receipt-row">
      <img src="${d?.img || ''}" alt="">
      <div><strong>${d?.name.ru || row.id}</strong><p>× ${row.qty} · ${d?.price || 0} TJS</p></div>
      <span>${sum} TJS</span>
    </div>`;
  }).join('');
}

function dishById(id) {
  return state.dishes.find((d) => d.id === id);
}

function total() {
  return state.cart.reduce((s, row) => s + (dishById(row.id)?.price || 0) * row.qty, 0);
}

function renderHome() {
  const grid = document.getElementById('homeGrid');
  const tiles = TILES.map((t) => {
    const d = dishById(t.id);
    if (!d) return '';
    return `<button class="tg-tile" data-dish="${d.id}">${t.emoji} ${d.name.ru}</button>`;
  }).join('');
  const cats = [...new Set(state.dishes.map((d) => d.cat))].map((cat) => {
    const meta = CATS[cat] || { title: cat, emoji: '🍽' };
    return `<button class="tg-tile" data-cat="${cat}">${meta.emoji} ${meta.title}</button>`;
  }).join('');
  grid.innerHTML = tiles + cats;
}

function renderList(cat, onlyId) {
  state.listCat = cat;
  const meta = CATS[cat] || { title: 'Меню', emoji: '🍽' };
  document.getElementById('listTitle').textContent = onlyId ? (dishById(onlyId)?.name.ru || meta.title) : meta.title;
  const list = onlyId ? state.dishes.filter((d) => d.id === onlyId) : state.dishes.filter((d) => !cat || d.cat === cat);
  document.getElementById('dishList').innerHTML = list.map((d) => `
    <button class="tg-card" data-dish="${d.id}">
      <img src="${d.img}" alt="${d.name.ru}" width="320" height="140">
      <strong>${d.name.ru}</strong>
      <p>${d.price} TJS</p>
    </button>
  `).join('') || '<p>Нет блюд</p>';
  go('list');
}

function renderDish(id) {
  const d = dishById(id);
  if (!d) return;
  state.dish = d;
  document.getElementById('dishCard').innerHTML = `
    <img src="${d.img}" alt="${d.name.ru}" style="width:100%;border-radius:16px;height:200px;object-fit:cover">
    <h2>${d.name.ru}</h2>
    <p>${d.desc.ru}</p>
    <p class="tg-lead">${d.price} TJS</p>
    <div class="qty">
      <button type="button" id="qtyMinus">−</button>
      <strong id="qtyVal">1</strong>
      <button type="button" id="qtyPlus">+</button>
    </div>
    <button class="btn btn-gold" id="addBtn">Добавить в корзину</button>
  `;
  let qty = 1;
  document.getElementById('qtyMinus').onclick = () => { qty = Math.max(1, qty - 1); document.getElementById('qtyVal').textContent = qty; };
  document.getElementById('qtyPlus').onclick = () => { qty = Math.min(20, qty + 1); document.getElementById('qtyVal').textContent = qty; };
  document.getElementById('addBtn').onclick = () => {
    const row = state.cart.find((i) => i.id === d.id);
    if (row) row.qty += qty; else state.cart.push({ id: d.id, qty });
    saveCart();
    tg?.HapticFeedback?.impactOccurred?.('medium');
    toast(`${d.name.ru} в корзине`);
  };
  go('dish');
}

function renderCart() {
  const box = document.getElementById('cartBox');
  if (!state.cart.length) {
    box.innerHTML = '<p class="hint">Корзина пуста. Выберите плов, манты или шашлык — и соберите дастархан.</p>';
    document.getElementById('giftHint').textContent = '';
    document.getElementById('giftBtn').hidden = true;
    return;
  }
  const sum = total();
  box.innerHTML = `${receiptRows()}<div class="receipt-total"><span>Итого</span><strong>${sum} TJS</strong></div>`;
  const hint = document.getElementById('giftHint');
  const giftBtn = document.getElementById('giftBtn');
  if (sum < 100) {
    hint.textContent = `Добавьте ещё ${100 - sum} TJS, чтобы получить подарок 🎁`;
    giftBtn.hidden = true;
  } else {
    hint.textContent = '🎁 Вам доступен подарок!';
    giftBtn.hidden = false;
  }
}

function renderCheckoutSummary() {
  const sum = total();
  const box = document.getElementById('checkSummary');
  const totalEl = document.getElementById('checkTotal');
  if (totalEl) totalEl.textContent = `${sum} TJS`;
  if (!box) return;
  if (!state.cart.length) {
    box.innerHTML = '<p class="hint">Сначала добавьте блюда в корзину.</p>';
    return;
  }
  box.innerHTML = `${receiptRows()}<div class="receipt-total"><span>Итого</span><strong>${sum} TJS</strong></div>`;
}

async function loadOrders() {
  const box = document.getElementById('ordersBox');
  box.innerHTML = '<div class="skel"></div>';
  try {
    const rows = await api('/api/telegram/orders');
    box.innerHTML = rows.length ? rows.map((o) => `
      <article class="tg-card">
        <strong>Заказ №${o.orderNumber}</strong>
        <p>${o.total} TJS</p>
        <p>${o.statusLabel}</p>
      </article>
    `).join('') : '<p>Заказов пока нет</p>';
  } catch (err) {
    box.innerHTML = `<p>${err.message}</p>`;
  }
}

async function loadGifts() {
  const box = document.getElementById('giftsBox');
  box.innerHTML = '<div class="skel"></div>';
  try {
    const rows = await api('/api/telegram/rewards');
    box.innerHTML = rows.length ? rows.map((g) => `
      <article class="tg-card">
        <strong>🎁 ${g.rewardName}</strong>
        <p>Заказ ${g.orderNumber || '—'}</p>
        <p>Статус: ${g.status === 'claimed' ? 'использован' : 'доступен'}</p>
      </article>
    `).join('') : '<p>Подарков пока нет</p>';
  } catch (err) {
    box.innerHTML = `<p>${err.message}</p>`;
  }
}

document.getElementById('app').addEventListener('click', (e) => {
  const goBtn = e.target.closest('[data-go]');
  if (goBtn) go(goBtn.dataset.go);
  const cat = e.target.closest('[data-cat]');
  if (cat) renderList(cat.dataset.cat);
  const dish = e.target.closest('[data-dish]');
  if (dish) renderDish(dish.dataset.dish);
});

document.getElementById('giftBtn').addEventListener('click', () => go('gift'));

document.getElementById('spinBtn').addEventListener('click', async () => {
  const btn = document.getElementById('spinBtn');
  const out = document.getElementById('spinResult');
  btn.disabled = true;
  document.getElementById('miniWheel').style.transform = `rotate(${720 + Math.random() * 360}deg)`;
  try {
    const data = await api('/api/telegram/rewards/spin', {
      sessionId: state.sessionId,
      items: state.cart
    }, 'POST');
    state.claim = data;
    out.hidden = false;
    out.textContent = `🎉 Поздравляем!\nВы выиграли: ${data.rewardName}`;
  } catch (err) {
    out.hidden = false;
    out.textContent = err.message || 'Не удалось открыть подарок';
  } finally {
    btn.disabled = false;
  }
});

document.querySelectorAll('input[name="fulfillment"]').forEach((el) => {
  el.addEventListener('change', () => {
    const pickup = document.querySelector('input[name="fulfillment"]:checked')?.value === 'pickup';
    document.getElementById('addrWrap').hidden = pickup;
  });
});

document.getElementById('geoBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    toast('Геолокация недоступна');
    return;
  }
  navigator.geolocation.getCurrentPosition((pos) => {
    state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    toast('Геолокация получена');
  }, () => toast('Не удалось получить геолокацию'));
});

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = document.getElementById('checkoutErr');
  err.textContent = '';
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/telegram/order', {
      name: fd.get('name'),
      phone: fd.get('phone'),
      fulfillment: fd.get('fulfillment'),
      payment_method: fd.get('payment'),
      address: fd.get('address'),
      apartment: fd.get('apartment'),
      comment: fd.get('comment'),
      items: state.cart,
      claimId: state.claim?.claimId,
      sessionId: state.sessionId,
      lat: state.geo?.lat,
      lng: state.geo?.lng
    }, 'POST');
    const rows = receiptRows();
    const sum = data.total || total();
    document.getElementById('doneTitle').textContent = `Заказ №${data.orderNumber}`;
    document.getElementById('doneLead').textContent = data.needsReceipt
      ? 'Оплатите перевод, сфотографируйте чек и отправьте его ниже.'
      : 'Ресторан получил заказ. Мы напишем в Telegram, когда начнём готовить.';
    document.getElementById('doneBox').innerHTML = `${rows}<div class="receipt-total"><span>Сумма</span><strong>${sum} TJS</strong></div>`;
    state.lastOrderNumber = data.orderNumber;
    state.receiptImage = null;
    const receiptBox = document.getElementById('receiptBox');
    if (receiptBox) receiptBox.hidden = !data.needsReceipt;
    toast(`Заказ №${data.orderNumber}`);
    state.cart = [];
    saveCart();
    state.sessionId = crypto.randomUUID();
    localStorage.setItem('plovtg_tg_reward', state.sessionId);
    state.claim = null;
    go('done');
  } catch (ex) {
    err.textContent = ex.message || 'Не удалось оформить заказ. Попробуйте ещё раз.';
  }
});

document.getElementById('receiptFile')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  const preview = document.getElementById('receiptPreview');
  const send = document.getElementById('receiptSend');
  if (!file || !file.type.startsWith('image/')) {
    toast('Выберите фото чека');
    return;
  }
  if (file.size > 2_400_000) {
    toast('Фото слишком большое');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.receiptImage = reader.result;
    if (preview) {
      preview.src = reader.result;
      preview.hidden = false;
    }
    if (send) send.hidden = false;
  };
  reader.readAsDataURL(file);
});

document.getElementById('receiptSend')?.addEventListener('click', async () => {
  const msg = document.getElementById('receiptMsg');
  if (!state.receiptImage || !state.lastOrderNumber) {
    toast('Сначала сделайте фото чека');
    return;
  }
  try {
    const data = await api('/api/telegram/receipt', {
      orderNumber: state.lastOrderNumber,
      image: state.receiptImage
    }, 'POST');
    if (msg) msg.textContent = data.message || 'Чек отправлен.';
    toast('Чек отправлен');
    document.getElementById('receiptSend').hidden = true;
  } catch (err) {
    if (msg) msg.textContent = err.message || 'Не удалось отправить чек';
  }
});

(async function boot() {
  document.getElementById('homeGrid').innerHTML = '<div class="skel"></div><div class="skel"></div>';
  try {
    state.dishes = await fetch('/api/dishes').then((r) => r.json());
    renderHome();
    saveCart();
  } catch {
    document.getElementById('homeGrid').innerHTML = '<p>Не удалось загрузить меню</p>';
  }
  if (initData()) {
    api('/api/telegram/session', {}, 'POST').catch(() => {});
  }
})();

function openHttp(url) {
  if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

async function copyPhone() {
  const num = '+992301155445';
  try {
    await navigator.clipboard.writeText(num);
    toast('Номер скопирован: +992 30 11 55 45');
  } catch {
    toast('+992 30 11 55 45');
  }
}

document.getElementById('tgWriteBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (tg?.close) tg.close();
  else openHttp('https://t.me/resstaurantbot');
});

document.getElementById('tgMapBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  openHttp('https://maps.google.com/?q=Dushanbe,+Rudaki+Avenue+25');
});

document.getElementById('tgPhoneBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  copyPhone();
});

document.getElementById('tgCallBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  copyPhone();
});

document.getElementById('tgSiteBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  openHttp('https://resstaurant.pp.ua/#contacts');
});
