'use strict';

const { MIN_ORDER_AMOUNT, selectReward } = require('./reward-config');
const { prepareItems, todayStamp } = require('./place-order');
const statusLib = require('./order-status');
const { miniAppUrl, publicSiteUrl, botLink } = require('./telegram-auth');
const crypto = require('node:crypto');

const PHONE = '+992301155445';
const ADDRESS = 'г. Душанбе, проспект Рудаки, 25';
const HOURS = '10:00 — 24:00, ежедневно';

function token() {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

function adminChatId() {
  return String(process.env.TELEGRAM_ADMIN_CHAT_ID || '');
}

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(28000)
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) {
    const err = new Error(data.description || `Telegram ${method} failed`);
    err.code = data.error_code;
    throw err;
  }
  return data.result;
}

function esc(s) {
  return String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

function contactKeyboard() {
  const write = botLink() || 'https://t.me/resstaurantbot';
  const site = publicSiteUrl();
  return {
    inline_keyboard: [
      [{ text: '✍️ Написать нам', url: write }],
      [{ text: '🌐 Сайт ресторана', url: site }],
      [{ text: '📍 Открыть карту', url: 'https://maps.google.com/?q=Dushanbe,+Rudaki+Avenue+25' }]
    ]
  };
}

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: '🍽 Меню' }, { text: '🛒 Моя корзина' }],
      [{ text: '📦 Мои заказы' }, { text: '🎁 Мои подарки' }],
      [{ text: '📍 Доставка' }, { text: '📞 Связаться с нами' }],
      [{ text: '🖥 Открыть приложение' }]
    ],
    resize_keyboard: true
  };
}

function webAppKeyboard() {
  const url = miniAppUrl();
  if (!/^https:\/\//i.test(url)) return undefined;
  return {
    inline_keyboard: [[{ text: '🖥 Открыть Mini App', web_app: { url } }]]
  };
}

const carts = new Map();
const checkout = new Map();

function cartOf(chatId) {
  if (!carts.has(chatId)) carts.set(chatId, { items: [], rewardSessionId: crypto.randomUUID() });
  return carts.get(chatId);
}

function resetRewardSession(chatId) {
  const cart = cartOf(chatId);
  cart.rewardSessionId = crypto.randomUUID();
}

function formatCart(items, dishes) {
  if (!items.length) return 'Корзина пуста. Откройте меню и соберите дастархан.';
  let total = 0;
  const lines = items.map((row) => {
    const dish = dishes.find((d) => d.id === row.id);
    const name = dish?.name?.ru || row.id;
    const price = dish ? dish.price * row.qty : 0;
    total += price;
    return `${esc(name)} × ${row.qty}  ·  ${price} TJS`;
  });
  let extra = total < MIN_ORDER_AMOUNT
    ? `\n🎁 Добавьте ещё ${MIN_ORDER_AMOUNT - total} TJS — и откроется подарок.`
    : '\n🎁 Вам доступен подарок!';
  const text = `<b>Ваш заказ · PLOV TG</b>\n\n${lines.join('\n')}\n————————————\n<b>Итого  ${total} TJS</b>${extra}`;
  return { text, total };
}

function dishByQuery(dishes, q) {
  const s = q.toLowerCase();
  return dishes.find((d) => d.id === s || d.name.ru.toLowerCase() === s || d.name.tj.toLowerCase() === s);
}

async function notifyCustomer(order) {
  const chatId = order.telegram_user_id;
  if (!chatId || !token()) return;
  try {
    await api('sendMessage', {
      chat_id: chatId,
      text: statusLib.customerMessage(order),
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.warn('Telegram customer notify:', err.message);
  }
}

function orderSummaryText(order, title) {
  const items = (order.items || []).map((i) => `• ${esc(i.name_snapshot)} × ${i.qty}`).join('\n');
  const pay = order.payment_method === 'card' ? '💳 Перевод — фото чека' : '💵 При получении';
  const type = order.fulfillment === 'pickup' ? '🏠 Самовывоз' : '📍 Доставка';
  return `<b>${esc(title)}</b>\n\n№${esc(order.order_number)}\n\n👤 ${esc(order.name)}\n📞 ${esc(order.phone)}\n\n${items}\n\n💰 <b>${order.total} TJS</b>\n${pay}\n${type}\n${esc(order.address || '')}\n\n${statusLib.label(order.status)}`;
}

async function sendReceiptToAdmin(order, { fileId, buffer, filename } = {}) {
  const chatId = adminChatId();
  if (!chatId || !token()) return false;
  const caption = `🧾 Чек по заказу №${order.order_number}\n👤 ${order.name}\n📞 ${order.phone}\n💰 ${order.total} TJS`;
  const reply_markup = {
    inline_keyboard: statusLib.withOrderId([
      [{ text: '✅ ОПЛАТА ПОЛУЧЕНА', callback_data: 'st:PAID' }, { text: 'ОТКЛОНИТЬ', callback_data: 'st:CANCELLED' }]
    ], order.id)
  };
  try {
    if (fileId) {
      await api('sendPhoto', { chat_id: chatId, photo: fileId, caption, reply_markup });
      return true;
    }
    if (buffer && buffer.length) {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('caption', caption);
      form.append('reply_markup', JSON.stringify(reply_markup));
      form.append('photo', new Blob([buffer], { type: 'image/jpeg' }), filename || 'receipt.jpg');
      const res = await fetch(`https://api.telegram.org/bot${token()}/sendPhoto`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(28000)
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.description || 'sendPhoto failed');
      return true;
    }
  } catch (err) {
    console.warn('Telegram receipt:', err.message);
  }
  return false;
}

async function notifyAdmin(order) {
  const chatId = adminChatId();
  if (!chatId || !token()) return;
  try {
    await api('sendMessage', {
      chat_id: chatId,
      text: orderSummaryText(order, '🔔 НОВЫЙ ЗАКАЗ'),
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: statusLib.withOrderId(statusLib.adminButtons(order.status), order.id)
      }
    });
  } catch (err) {
    console.warn('Telegram admin notify:', err.message);
  }
}

async function sendDishCard(chatId, dish) {
  const caption = `*${dish.name.ru}*\n${dish.desc.ru}\n\n💰 ${dish.price} TJS`;
  const buttons = {
    inline_keyboard: [[
      { text: '➕ В заказ', callback_data: `add:${dish.id}` },
      { text: '🛒 Корзина', callback_data: 'cart' }
    ]]
  };
  const photo = dish.img?.startsWith('http') ? dish.img : `${publicSiteUrl()}${dish.img}`;
  try {
    await api('sendPhoto', { chat_id: chatId, photo, caption, parse_mode: 'Markdown', reply_markup: buttons });
  } catch {
    await api('sendMessage', { chat_id: chatId, text: caption.replace(/\*/g, ''), reply_markup: buttons });
  }
}

function faqReply(text, dishes) {
  const q = text.toLowerCase();
  if (/посовет|рекоменд|лучш/.test(q)) {
    const plov = dishes.find((d) => d.id === 'plov');
    const manti = dishes.find((d) => d.id === 'manti');
    return `На двоих советуем ${plov?.name.ru || 'плов'} и ${manti?.name.ru || 'манты'}. Это основа дастархана PLOV TG.`;
  }
  if (/остр/.test(q)) {
    return 'Острее всего шашлык и кабоб — мясо с зирой и перцем. Плов и манты мягче по вкусу.';
  }
  if (/двоих|на двоих|двоем/.test(q)) {
    return 'На двоих: плов + манты + чай. Если хотите гриль — шашлык вместо мантов.';
  }
  const hit = dishes.find((d) => q.includes(d.name.ru.toLowerCase()) || q.includes(d.id));
  if (hit && /вход|из чег|состав|ингред/.test(q)) {
    return `${hit.name.ru}: ${hit.ingredients.ru}. ${hit.price} TJS.`;
  }
  if (hit) return `${hit.name.ru} — ${hit.desc.ru} Цена ${hit.price} TJS.`;
  return null;
}

async function startBot(store) {
  if (!token()) {
    console.log('Telegram-бот: токен не задан, сайт работает без бота.');
    return { notifyCustomer, notifyAdmin, sendReceiptToAdmin, enabled: false };
  }

  try {
    await api('deleteWebhook', { drop_pending_updates: false });
  } catch (err) {
    console.warn('Telegram deleteWebhook:', err.message);
  }

  try {
    await api('setMyName', { name: 'PLOV TG' });
    await api('setMyDescription', { description: 'PLOV TG — таджикская кухня в Душанбе. Меню, доставка, бонусный барабан.' });
    await api('setMyShortDescription', { description: 'Заказ плова, мантов и курутоба внутри Telegram.' });
    await api('setMyCommands', {
      commands: [
        { command: 'start', description: 'Приветствие и меню' },
        { command: 'menu', description: 'Блюда' },
        { command: 'cart', description: 'Корзина' },
        { command: 'orders', description: 'Мои заказы' },
        { command: 'rewards', description: 'Подарки' },
        { command: 'help', description: 'Связаться с нами' }
      ]
    });
    const appUrl = miniAppUrl();
    if (/^https:\/\//i.test(appUrl)) {
      await api('setChatMenuButton', {
        menu_button: { type: 'web_app', text: 'Открыть меню', web_app: { url: appUrl } }
      });
    }
  } catch (err) {
    console.warn('Telegram profile:', err.message);
  }

  let offset = 0;
  let running = true;

  async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const text = String(msg.text || '').trim();
    const from = msg.from || {};
    await store.upsertTelegramCustomer({
      telegramUserId: String(from.id),
      chatId: String(chatId),
      name: [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Гость',
      username: from.username || ''
    });

    const flow = checkout.get(chatId);
    const dishes = await store.listDishes(true);

    const photoId = msg.photo?.[msg.photo.length - 1]?.file_id
      || (msg.document && /^image\//.test(String(msg.document.mime_type || '')) ? msg.document.file_id : '');
    if (photoId) {
      const pending = await store.getLatestPendingPaymentByTelegram(String(from.id));
      if (pending) {
        const ok = await sendReceiptToAdmin(pending, { fileId: photoId });
        if (ok) {
          try { await store.saveOrderReceipt(pending.id, photoId); } catch (err) {
            console.warn('save receipt:', err.message);
          }
          await api('sendMessage', {
            chat_id: chatId,
            text: `Чек по заказу №${pending.order_number} отправлен. Ресторан проверит оплату.`,
            reply_markup: mainKeyboard()
          });
        } else {
          await api('sendMessage', { chat_id: chatId, text: 'Не удалось отправить чек. Попробуйте ещё раз.' });
        }
        return;
      }
    }

    if (msg.location && flow) {
      flow.lat = msg.location.latitude;
      flow.lng = msg.location.longitude;
      flow.address = flow.address || `${msg.location.latitude.toFixed(5)}, ${msg.location.longitude.toFixed(5)}`;
      checkout.set(chatId, flow);
      await api('sendMessage', { chat_id: chatId, text: 'Геолокация получена. Напишите адрес текстом или нажмите «Продолжить».', reply_markup: {
        keyboard: [[{ text: 'Продолжить' }], [{ text: 'Отмена' }]], resize_keyboard: true
      } });
      return;
    }

    if (text === '/start' || text === '◀️ Назад') {
      checkout.delete(chatId);
      await api('sendMessage', {
        chat_id: chatId,
        text: '<b>PLOV TG</b>\n<i>Дастархан в Душанбе</i>\n\nПлов · манты · курутоб\nДоставка и самовывоз · 10:00–24:00\n\nСоберите стол ниже или откройте приложение.',
        parse_mode: 'HTML',
        reply_markup: mainKeyboard()
      });
      const web = webAppKeyboard();
      if (web) {
        await api('sendMessage', {
          chat_id: chatId,
          text: 'Полное меню, заказ и барабан подарков — в приложении.',
          reply_markup: web
        });
      }
      return;
    }

    if (text === '/help' || text === '📞 Связаться с нами') {
      await api('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text: `<b>Связаться с нами</b>\n\n📞 ${PHONE}\n📍 ${esc(ADDRESS)}\n🕰 ${esc(HOURS)}\n\nНажмите номер, чтобы позвонить. Написать или открыть карту — кнопки ниже.`,
        reply_markup: contactKeyboard()
      });
      return;
    }

    if (text === '/menu' || text === '🍽 Меню') {
      const cats = [...new Set(dishes.map((d) => d.cat))];
      await api('sendMessage', {
        chat_id: chatId,
        text: 'Выберите категорию или блюдо:',
        reply_markup: {
          inline_keyboard: [
            ...cats.map((cat) => [{ text: catLabel(cat), callback_data: `cat:${cat}` }]),
            dishes.slice(0, 6).map((d) => ({ text: d.name.ru, callback_data: `dish:${d.id}` }))
          ].concat([[{ text: '🖥 Открыть приложение', callback_data: 'app' }]])
        }
      });
      return;
    }

    if (text === '/cart' || text === '🛒 Моя корзина') {
      await sendCart(chatId, dishes);
      return;
    }

    if (text === '/orders' || text === '📦 Мои заказы') {
      const orders = await store.listOrdersByTelegram(String(from.id));
      if (!orders.length) {
        await api('sendMessage', { chat_id: chatId, text: 'Пока нет заказов. Откройте меню и соберите дастархан.' });
        return;
      }
      for (const order of orders.slice(0, 5)) {
        await api('sendMessage', {
          chat_id: chatId,
          text: `Заказ №${order.order_number}\n${order.total} TJS\n${statusLib.label(order.status)}`,
          reply_markup: { inline_keyboard: [[{ text: 'ПОДРОБНЕЕ', callback_data: `ord:${order.id}` }]] }
        });
      }
      return;
    }

    if (text === '/rewards' || text === '🎁 Мои подарки') {
      const gifts = await store.listRewardsByTelegram(String(from.id));
      if (!gifts.length) {
        await api('sendMessage', { chat_id: chatId, text: 'Подарков пока нет. Заказ от 100 сомони открывает бонусный барабан.' });
        return;
      }
      const lines = gifts.map((g) => `🎁 ${g.reward_name}\nЗаказ: ${g.order_number || '—'}\nСтатус: ${g.status === 'claimed' ? 'использован' : 'доступен'}\n${g.created_at}`).join('\n\n');
      await api('sendMessage', { chat_id: chatId, text: `🎁 Мои подарки\n\n${lines}` });
      return;
    }

    if (text === '📍 Доставка') {
      await api('sendMessage', {
        chat_id: chatId,
        parse_mode: 'HTML',
        text: `<b>Доставка PLOV TG</b>\n\nПо Душанбе.\nСамовывоз: ${esc(ADDRESS)}\n${esc(HOURS)}\n\nВ приложении можно отправить геолокацию.`
      });
      return;
    }

    if (text === '🖥 Открыть приложение' || text === '/app') {
      const web = webAppKeyboard();
      if (!web) {
        await api('sendMessage', { chat_id: chatId, text: 'Telegram временно недоступен. Mini App нужен HTTPS-адрес. Попробуйте позже.' });
        return;
      }
      await api('sendMessage', { chat_id: chatId, text: 'Откройте меню PLOV TG внутри Telegram.', reply_markup: web });
      return;
    }

    if (flow) {
      await handleCheckoutStep(chatId, text, flow, from, dishes);
      return;
    }

    const found = dishByQuery(dishes, text);
    if (found) {
      await sendDishCard(chatId, found);
      return;
    }

    const faq = faqReply(text, dishes);
    if (faq) {
      await api('sendMessage', { chat_id: chatId, text: faq });
      return;
    }

    await api('sendMessage', {
      chat_id: chatId,
      text: 'Напишите название блюда или откройте меню кнопками.',
      reply_markup: mainKeyboard()
    });
  }

  async function sendCart(chatId, dishes) {
    const cart = cartOf(chatId);
    const view = formatCart(cart.items, dishes);
    if (typeof view === 'string') {
      await api('sendMessage', { chat_id: chatId, text: view, reply_markup: mainKeyboard() });
      return;
    }
    const buttons = [[{ text: 'ОФОРМИТЬ ЗАКАЗ', callback_data: 'checkout' }]];
    if (view.total >= MIN_ORDER_AMOUNT) {
      buttons.unshift([{ text: '🎁 ОТКРЫТЬ ПОДАРОК', callback_data: 'gift' }]);
    }
    await api('sendMessage', { chat_id: chatId, text: view.text, parse_mode: 'HTML', reply_markup: { inline_keyboard: buttons } });
  }

  async function handleCheckoutStep(chatId, text, flow, from, dishes) {
    if (text === 'Отмена') {
      checkout.delete(chatId);
      await api('sendMessage', { chat_id: chatId, text: 'Оформление отменено.', reply_markup: mainKeyboard() });
      return;
    }
    if (flow.step === 'name') {
      if (text.length < 2) {
        await api('sendMessage', { chat_id: chatId, text: 'Введите имя (мин. 2 символа).' });
        return;
      }
      flow.name = text;
      flow.step = 'phone';
      checkout.set(chatId, flow);
      await api('sendMessage', { chat_id: chatId, text: 'Телефон:', reply_markup: {
        keyboard: [[{ text: 'Отмена' }]], resize_keyboard: true
      } });
      return;
    }
    if (flow.step === 'phone') {
      if (!/^[+\d][\d\s\-()]{6,20}$/.test(text)) {
        await api('sendMessage', { chat_id: chatId, text: 'Введите корректный номер, например +992...' });
        return;
      }
      flow.phone = text;
      flow.step = 'fulfillment';
      checkout.set(chatId, flow);
      await api('sendMessage', { chat_id: chatId, text: 'Способ получения:', reply_markup: {
        keyboard: [[{ text: '🚚 Доставка' }, { text: '🏠 Самовывоз' }], [{ text: 'Отмена' }]], resize_keyboard: true
      } });
      return;
    }
    if (flow.step === 'fulfillment') {
      if (text.includes('Самовывоз')) {
        flow.fulfillment = 'pickup';
        flow.address = ADDRESS;
        flow.step = 'pay';
        checkout.set(chatId, flow);
        await askPay(chatId);
        return;
      }
      flow.fulfillment = 'delivery';
      flow.step = 'address';
      checkout.set(chatId, flow);
      await api('sendMessage', {
        chat_id: chatId,
        text: 'Адрес доставки. Можно отправить геолокацию.',
        reply_markup: {
          keyboard: [[{ text: '📍 Отправить геолокацию', request_location: true }], [{ text: 'Отмена' }]],
          resize_keyboard: true
        }
      });
      return;
    }
    if (flow.step === 'address') {
      if (text !== 'Продолжить' && text.length < 4) {
        await api('sendMessage', { chat_id: chatId, text: 'Укажите адрес или отправьте геолокацию.' });
        return;
      }
      if (text !== 'Продолжить') flow.address = text;
      flow.step = 'comment';
      checkout.set(chatId, flow);
      await api('sendMessage', {
        chat_id: chatId,
        text: 'Квартира/офис и комментарий — одной строкой. Или «Пропустить».',
        reply_markup: { keyboard: [[{ text: 'Пропустить' }, { text: 'Отмена' }]], resize_keyboard: true }
      });
      return;
    }
    if (flow.step === 'comment') {
      if (text !== 'Пропустить') {
        flow.apartment = text.slice(0, 80);
        flow.comment = text.slice(0, 400);
      }
      flow.step = 'pay';
      checkout.set(chatId, flow);
      await askPay(chatId);
      return;
    }
    if (flow.step === 'pay') {
      const card = /карт|alif|visa|перевод|чек/i.test(text);
      const cash = /получен|налич/i.test(text);
      if (!card && !cash) {
        await askPay(chatId);
        return;
      }
      flow.payment = card ? 'card' : 'cash';
      await finishOrder(chatId, flow, from, dishes);
    }
  }

  async function askPay(chatId) {
    await api('sendMessage', {
      chat_id: chatId,
      text: 'Способ оплаты:',
      reply_markup: {
        keyboard: [[{ text: '💵 Оплата при получении' }, { text: '💳 Перевод — фото чека' }], [{ text: 'Отмена' }]],
        resize_keyboard: true
      }
    });
  }

  async function finishOrder(chatId, flow, from, dishes) {
    const cart = cartOf(chatId);
    try {
      const { prepared, total } = await prepareItems(store, cart.items);
      const stamp = todayStamp();
      const status = flow.payment === 'card' ? 'PENDING_PAYMENT' : 'PENDING_CONFIRMATION';
      const orderNumber = await store.nextOrderNumber();
      const address = [flow.address, flow.apartment].filter(Boolean).join(', ');
      const orderId = await store.createOrder({
        orderNumber,
        name: flow.name,
        phone: flow.phone,
        email: `tg${from.id}@guest.plovtg`,
        address: address || ADDRESS,
        date: stamp.date,
        time: stamp.time,
        comment: flow.comment || null,
        total,
        status,
        channel: 'telegram',
        fulfillment: flow.fulfillment || 'delivery',
        payment_method: flow.payment,
        telegram_user_id: String(from.id),
        lat: flow.lat || null,
        lng: flow.lng || null,
        apartment: flow.apartment || null
      }, prepared);
      if (cart.claimId && total >= MIN_ORDER_AMOUNT) {
        try {
          await store.attachRewardToOrder({ claimId: cart.claimId, sessionId: cart.rewardSessionId, orderId });
        } catch (err) {
          console.warn('Telegram reward attach:', err.message);
        }
      }
      const order = await store.getOrder(orderId);
      checkout.delete(chatId);
      carts.set(chatId, { items: [], rewardSessionId: crypto.randomUUID() });
      let extra = '';
      if (flow.payment === 'card') {
        extra = '\n\nОплатите перевод, затем <b>сфотографируйте чек</b> и отправьте фото в этот чат.';
      }
      await api('sendMessage', {
        chat_id: chatId,
        text: `Заказ <b>№${esc(orderNumber)}</b>\n\n👤 ${esc(flow.name)}\n📞 ${esc(flow.phone)}\n${flow.fulfillment === 'pickup' ? '🏠 Самовывоз' : '📍 Доставка'}\n\n${prepared.map((i) => `• ${esc(i.name_snapshot)} × ${i.qty}`).join('\n')}\n\n💰 <b>${total} TJS</b>\n${statusLib.label(status)}${extra}`,
        parse_mode: 'HTML',
        reply_markup: mainKeyboard()
      });
      await notifyAdmin(order);
    } catch (err) {
      await api('sendMessage', {
        chat_id: chatId,
        text: err.message || 'Не удалось оформить заказ. Попробуйте ещё раз.',
        reply_markup: mainKeyboard()
      });
    }
  }

  async function handleCallback(cq) {
    const chatId = cq.message.chat.id;
    const data = String(cq.data || '');
    const from = cq.from || {};
    const dishes = await store.listDishes(true);
    await api('answerCallbackQuery', { callback_query_id: cq.id }).catch(() => {});

    if (data === 'app') {
      const web = webAppKeyboard();
      if (!web) {
        await api('sendMessage', { chat_id: chatId, text: 'Telegram временно недоступен. Попробуйте позже.' });
        return;
      }
      await api('sendMessage', { chat_id: chatId, text: 'Приложение PLOV TG', reply_markup: web });
      return;
    }

    if (data === 'cart') {
      await sendCart(chatId, dishes);
      return;
    }

    if (data.startsWith('cat:')) {
      const cat = data.slice(4);
      const list = dishes.filter((d) => d.cat === cat);
      await api('sendMessage', {
        chat_id: chatId,
        text: catLabel(cat),
        reply_markup: { inline_keyboard: list.map((d) => [{ text: `${d.name.ru} · ${d.price} TJS`, callback_data: `dish:${d.id}` }]) }
      });
      return;
    }

    if (data.startsWith('dish:')) {
      const dish = dishes.find((d) => d.id === data.slice(5));
      if (dish) await sendDishCard(chatId, dish);
      return;
    }

    if (data.startsWith('add:')) {
      const id = data.slice(4);
      const cart = cartOf(chatId);
      const row = cart.items.find((i) => i.id === id);
      if (row) row.qty += 1;
      else cart.items.push({ id, qty: 1 });
      const dish = dishes.find((d) => d.id === id);
      await api('sendMessage', { chat_id: chatId, text: `${dish?.name.ru || id} добавлен в заказ.` });
      return;
    }

    if (data === 'checkout') {
      const cart = cartOf(chatId);
      if (!cart.items.length) {
        await api('sendMessage', { chat_id: chatId, text: 'Корзина пуста.' });
        return;
      }
      checkout.set(chatId, { step: 'name' });
      await api('sendMessage', {
        chat_id: chatId,
        text: 'Имя для заказа:',
        reply_markup: { keyboard: [[{ text: from.first_name || 'Гость' }], [{ text: 'Отмена' }]], resize_keyboard: true }
      });
      return;
    }

    if (data === 'gift') {
      const cart = cartOf(chatId);
      try {
        const { total } = await prepareItems(store, cart.items);
        if (total < MIN_ORDER_AMOUNT) {
          await api('sendMessage', { chat_id: chatId, text: `Добавьте ещё ${MIN_ORDER_AMOUNT - total} TJS, чтобы получить подарок 🎁` });
          return;
        }
        const existing = await store.findRewardClaimBySession(cart.rewardSessionId);
        if (existing) {
          await api('sendMessage', { chat_id: chatId, text: `Подарок уже открыт: ${existing.reward_name}` });
          return;
        }
        const prize = selectReward((max) => crypto.randomInt(max));
        const claimId = crypto.randomUUID();
        await store.createRewardClaim({
          id: claimId,
          sessionId: cart.rewardSessionId,
          rewardId: prize.id,
          rewardName: prize.name,
          cartTotal: total,
          cartHash: cart.items.map((i) => `${i.id}:${i.qty}`).sort().join('|'),
          status: 'won',
          telegramUserId: String(from.id)
        });
        cart.claimId = claimId;
        await api('sendMessage', { chat_id: chatId, text: `🎉 Поздравляем!\n\nВы выиграли:\n${prize.name}\n\nОдин заказ — один spin.` });
      } catch (err) {
        await api('sendMessage', { chat_id: chatId, text: 'Не удалось открыть подарок. Попробуйте позже.' });
        console.warn('Telegram gift:', err.message);
      }
      return;
    }

    if (data.startsWith('ord:')) {
      const order = await store.getOrder(Number(data.slice(4)));
      if (!order || String(order.telegram_user_id) !== String(from.id)) {
        await api('sendMessage', { chat_id: chatId, text: 'Заказ не найден.' });
        return;
      }
      await api('sendMessage', { chat_id: chatId, text: orderSummaryText(order, `Заказ №${order.order_number}`), parse_mode: 'HTML' });
      return;
    }

    if (data.startsWith('st:')) {
      const parts = data.split(':');
      const next = parts[1];
      const orderId = Number(parts[2]);
      if (String(chatId) !== adminChatId()) {
        await api('sendMessage', { chat_id: chatId, text: 'Только администратор может менять статус.' });
        return;
      }
      if (!statusLib.ALLOWED.includes(next)) return;
      const prev = await store.getOrder(orderId);
      if (!prev) return;
      await store.updateOrderStatus(orderId, next);
      const order = await store.getOrder(orderId);
      await api('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: cq.message.message_id,
        reply_markup: { inline_keyboard: statusLib.withOrderId(statusLib.adminButtons(next), orderId) }
      }).catch(() => {});
      await api('sendMessage', { chat_id: chatId, text: `Статус №${order.order_number}: ${statusLib.label(next)}` });
      if (statusLib.normalize(prev.status) !== statusLib.normalize(next)) {
        await notifyCustomer(order);
      }
    }
  }

  async function loop() {
    while (running) {
      try {
        const updates = await api('getUpdates', {
          offset,
          timeout: 25,
          allowed_updates: ['message', 'callback_query']
        });
        for (const update of updates) {
          offset = update.update_id + 1;
          try {
            if (update.message) await handleMessage(update.message);
            else if (update.callback_query) await handleCallback(update.callback_query);
          } catch (err) {
            console.warn('Telegram update:', err.message);
          }
        }
      } catch (err) {
        console.warn('Telegram poll:', err.message);
        await new Promise((r) => setTimeout(r, 4000));
      }
    }
  }

  loop().catch((err) => console.warn('Telegram loop stopped:', err.message));
  console.log('Telegram-бот: long polling getUpdates');
  return { notifyCustomer, notifyAdmin, sendReceiptToAdmin, enabled: true, stop() { running = false; } };
}

function catLabel(cat) {
  return ({
    main: '🍚 Основные',
    grill: '🍢 Гриль',
    bakery: '🥟 Выпечка',
    soup: '🍲 Супы',
    dessert: '🍰 Десерты',
    drink: '🍵 Напитки'
  })[cat] || cat;
}

module.exports = { startBot, notifyCustomer, notifyAdmin, sendReceiptToAdmin };
