'use strict';

async function prepareItems(store, items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 40) {
    const err = new Error('Корзина пуста');
    err.status = 400;
    throw err;
  }
  const prepared = [];
  let total = 0;
  for (const item of items) {
    const qty = Number(item?.qty);
    if (!item?.id || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      const err = new Error('Некорректный состав заказа');
      err.status = 400;
      throw err;
    }
    const dish = await store.getDish(item.id, true);
    if (!dish) {
      const err = new Error(`Блюдо «${item.id}» недоступно`);
      err.status = 400;
      throw err;
    }
    total += dish.price * qty;
    prepared.push({
      dish_id: dish.id,
      name_snapshot: dish.name.ru,
      price: dish.price,
      qty
    });
  }
  return { prepared, total };
}

function todayStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: d.toISOString().slice(0, 10),
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

module.exports = { prepareItems, todayStamp };
