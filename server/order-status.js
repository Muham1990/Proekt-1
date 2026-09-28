'use strict';

const LEGACY = {
  new: 'ACCEPTED',
  preparing: 'COOKING',
  delivering: 'DELIVERING',
  done: 'COMPLETED',
  cancelled: 'CANCELLED'
};

const ALLOWED = [
  'PENDING_PAYMENT',
  'PENDING_CONFIRMATION',
  'PAID',
  'ACCEPTED',
  'COOKING',
  'READY',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
  'new',
  'preparing',
  'delivering',
  'done',
  'cancelled'
];

const LABELS = {
  PENDING_PAYMENT: '🟡 Ожидает оплаты',
  PENDING_CONFIRMATION: '🟡 Ожидает подтверждения',
  PAID: '🟢 Оплачен',
  ACCEPTED: '🔵 Заказ принят',
  COOKING: '👨‍🍳 Готовится',
  READY: '📦 Готов',
  DELIVERING: '🚴 Курьер в пути',
  COMPLETED: '✅ Доставлен',
  CANCELLED: '❌ Отменён'
};

function normalize(status) {
  const raw = String(status || 'ACCEPTED');
  return LEGACY[raw] || raw;
}

function label(status) {
  return LABELS[normalize(status)] || String(status || '');
}

function customerMessage(order) {
  const num = order.order_number;
  switch (normalize(order.status)) {
    case 'PENDING_PAYMENT':
      return `🟡 Заказ №${num} ожидает оплату.\n\nОплатите перевод и пришлите фото чека в этот чат.`;
    case 'PENDING_CONFIRMATION':
      return `🟡 Заказ №${num} принят в обработку. Ресторан скоро подтвердит его.`;
    case 'PAID':
      return `🟢 Оплата по заказу №${num} получена.`;
    case 'ACCEPTED':
      return `🍳 Ваш заказ №${num} принят!\n\nСейчас ресторан готовит ваш заказ.`;
    case 'COOKING':
      return `👨‍🍳 Заказ №${num} готовится на кухне.`;
    case 'READY':
      return `📦 Заказ №${num} готов!`;
    case 'DELIVERING':
      return `🚴 Ваш заказ №${num} уже в пути!`;
    case 'COMPLETED':
      return `❤️ Спасибо за заказ в Plov TG!\nЗаказ №${num} доставлен.`;
    case 'CANCELLED':
      return `❌ Заказ №${num} отменён. Если это ошибка — напишите нам.`;
    default:
      return `Заказ №${num}: ${label(order.status)}`;
  }
}

function adminButtons(status) {
  const s = normalize(status);
  const rows = [];
  if (s === 'PENDING_PAYMENT') {
    rows.push([{ text: '✅ ОПЛАТА ПОЛУЧЕНА', callback_data: 'st:PAID' }, { text: 'ОТКЛОНИТЬ', callback_data: 'st:CANCELLED' }]);
  }
  if (s === 'PENDING_CONFIRMATION' || s === 'PAID') {
    rows.push([{ text: 'ПРИНЯТЬ', callback_data: 'st:ACCEPTED' }, { text: 'ОТКЛОНИТЬ', callback_data: 'st:CANCELLED' }]);
  }
  if (s === 'ACCEPTED') {
    rows.push([{ text: 'ГОТОВИТСЯ', callback_data: 'st:COOKING' }, { text: 'ОТКЛОНИТЬ', callback_data: 'st:CANCELLED' }]);
  }
  if (s === 'COOKING') {
    rows.push([{ text: 'ГОТОВ', callback_data: 'st:READY' }]);
  }
  if (s === 'READY') {
    rows.push([{ text: 'КУРЬЕР ВЫЕХАЛ', callback_data: 'st:DELIVERING' }, { text: 'ЗАВЕРШИТЬ', callback_data: 'st:COMPLETED' }]);
  }
  if (s === 'DELIVERING') {
    rows.push([{ text: 'ЗАВЕРШИТЬ', callback_data: 'st:COMPLETED' }]);
  }
  return rows;
}

function withOrderId(rows, orderId) {
  return rows.map((row) => row.map((btn) => ({
    ...btn,
    callback_data: `${btn.callback_data}:${orderId}`.slice(0, 64)
  })));
}

module.exports = {
  ALLOWED,
  LABELS,
  normalize,
  label,
  customerMessage,
  adminButtons,
  withOrderId
};
