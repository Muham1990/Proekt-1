'use strict';

const loginView = document.getElementById('loginView');
const dashView = document.getElementById('dashView');
const loginError = document.getElementById('loginError');

function showDash() {
  loginView.classList.add('hidden');
  dashView.classList.remove('hidden');
}

function showLogin() {
  dashView.classList.add('hidden');
  loginView.classList.remove('hidden');
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

async function boot() {
  try {
    await apiGet('/api/admin/me');
    showDash();
    await loadAll();
  } catch {
    showLogin();
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  try {
    await apiPost('/api/admin/login', {
      username: document.getElementById('loginUser').value.trim(),
      password: document.getElementById('loginPass').value
    });
    showDash();
    await loadAll();
  } catch (err) {
    loginError.textContent = err.message;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  try { await apiPost('/api/admin/logout', {}); } catch { /* ignore */ }
  showLogin();
});

document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-tab]');
  if (!btn) return;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b === btn));
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('active', p.dataset.panel === btn.dataset.tab);
  });
});

async function loadAll() {
  const [stats, orders, reservations, reviews, dishes, guests] = await Promise.all([
    apiGet('/api/admin/stats'),
    apiGet('/api/admin/orders'),
    apiGet('/api/admin/reservations'),
    apiGet('/api/admin/reviews'),
    apiGet('/api/admin/dishes'),
    apiGet('/api/admin/guests')
  ]);
  renderStats(stats);
  renderOrders(orders);
  renderReservations(reservations);
  renderReviews(reviews);
  renderMenu(dishes);
  renderGuests(guests);
}

function renderStats(s) {
  document.getElementById('stats').innerHTML = [
    ['Новые заказы', s.ordersNew],
    ['Заказы сегодня', s.ordersToday],
    ['Ожидают бронь', s.reservations],
    ['Выручка, сомони', s.revenue],
    ['Отзывы на проверке', s.reviewsPending],
    ['Гости', s.guests],
    ['Блюд в базе', s.dishes]
  ].map(([label, value]) => `<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`).join('');
}

function renderOrders(rows) {
  document.getElementById('ordersTable').innerHTML = table(rows, [
    ['№', (r) => r.order_number],
    ['Гость', (r) => `${esc(r.name)}<br><span class="muted">${esc(r.phone)} · ${esc(r.email)}</span>`],
    ['Адрес / время', (r) => `${esc(r.address)}<br><span class="muted">${esc(r.date)} ${esc(r.time)}</span>`],
    ['Состав', (r) => (r.items || []).map((i) => `${esc(i.name_snapshot)} × ${i.qty}`).join('<br>')],
    ['Сумма', (r) => `${r.total} с.`],
    ['Статус', (r) => select('order', r.id, r.status, ['new', 'preparing', 'delivering', 'done', 'cancelled'])]
  ]);
}

function renderReservations(rows) {
  document.getElementById('reservationsTable').innerHTML = table(rows, [
    ['ID', (r) => r.id],
    ['Гость', (r) => `${esc(r.name)}<br><span class="muted">${esc(r.phone)}</span>`],
    ['Когда', (r) => `${esc(r.date)} ${esc(r.time)}`],
    ['Гостей', (r) => r.guests],
    ['Комментарий', (r) => esc(r.comment || '—')],
    ['Статус', (r) => select('reservation', r.id, r.status, ['pending', 'confirmed', 'cancelled', 'completed'])]
  ]);
}

function renderReviews(rows) {
  document.getElementById('reviewsTable').innerHTML = table(rows, [
    ['Имя', (r) => `${esc(r.name)}<br><span class="muted">${esc(r.city || '')}</span>`],
    ['Оценка', (r) => '★'.repeat(r.rating)],
    ['Текст', (r) => esc(r.text)],
    ['Статус', (r) => select('review', r.id, r.status, ['pending', 'approved', 'hidden'])]
  ]);
}

function renderMenu(rows) {
  document.getElementById('menuTable').innerHTML = table(rows, [
    ['Блюдо', (r) => esc(r.name.ru)],
    ['Категория', (r) => esc(r.cat)],
    ['Цена', (r) => `<input class="price-input" data-dish="${esc(r.id)}" type="number" min="1" max="10000" value="${r.price}">`],
    ['Наличие', (r) => `<select class="status-select" data-avail="${esc(r.id)}"><option value="1"${r.available ? ' selected' : ''}>В меню</option><option value="0"${r.available ? '' : ' selected'}>Скрыто</option></select>`]
  ]);
}

function renderGuests(rows) {
  document.getElementById('guestsTable').innerHTML = table(rows, [
    ['ID', (r) => r.id],
    ['Имя', (r) => esc(r.name)],
    ['Email', (r) => esc(r.email)],
    ['Дата', (r) => esc(r.created_at)]
  ]);
}

function table(rows, cols) {
  if (!rows.length) return '<p class="muted">Пока пусто.</p>';
  return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${c[0]}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${cols.map((c) => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')
  }</tbody></table></div>`;
}

function select(kind, id, value, options) {
  return `<select class="status-select" data-kind="${kind}" data-id="${id}">${
    options.map((o) => `<option value="${o}"${o === value ? ' selected' : ''}>${o}</option>`).join('')
  }</select>`;
}

document.body.addEventListener('change', async (e) => {
  const statusEl = e.target.closest('[data-kind]');
  if (statusEl) {
    const map = {
      order: `/api/admin/orders/${statusEl.dataset.id}`,
      reservation: `/api/admin/reservations/${statusEl.dataset.id}`,
      review: `/api/admin/reviews/${statusEl.dataset.id}`
    };
    await apiPatch(map[statusEl.dataset.kind], { status: statusEl.value });
    await loadAll();
    return;
  }
  const avail = e.target.closest('[data-avail]');
  if (avail) {
    await apiPatch(`/api/admin/dishes/${avail.dataset.avail}`, { available: avail.value === '1' });
    await loadAll();
  }
});

document.body.addEventListener('change', async (e) => {
  const price = e.target.closest('.price-input');
  if (!price) return;
  await apiPatch(`/api/admin/dishes/${price.dataset.dish}`, { price: Number(price.value) });
  await loadAll();
});

boot();
