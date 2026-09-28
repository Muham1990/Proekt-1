# Telegram: BotFather и переменные PLOV TG

Токен бота хранится только в `.env` / Railway Variables. Его нельзя вставлять в HTML, JS браузера или Mini App.

## 1. Создать бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram.
2. `/newbot`
3. Имя: `PLOV TG`
4. Username: например `PlovTGBot` (должен заканчиваться на `bot`).
5. Скопируйте токен → `TELEGRAM_BOT_TOKEN` (локально `.env`, на сервере Railway Variables).
6. Username без `@` → `TELEGRAM_BOT_USERNAME`.

## 2. Описание

В BotFather:

- `/setdescription` — «PLOV TG — таджикская кухня в Душанбе. Меню, доставка, бонусный барабан.»
- `/setabouttext` — «Заказ плова, мантов и курутоба. Mini App внутри Telegram.»
- `/setuserpic` — логотип ресторана.
- `/setcommands`:

```
start - Приветствие и меню
menu - Блюда
cart - Корзина
orders - Мои заказы
rewards - Подарки
help - Связаться с нами
```

## 3. Mini App и кнопка меню

Production URL Mini App: `https://resstaurant.pp.ua/telegram`

1. `/newapp` или `/myapps` → привяжите бота.
2. Web App URL: `https://resstaurant.pp.ua/telegram`
3. `/setmenubutton` → текст «Открыть меню», URL тот же.

`TELEGRAM_MINI_APP_URL=https://resstaurant.pp.ua/telegram`

Локально Mini App из Telegram не откроется: нужен HTTPS. Сайт и API на `http://localhost:3000` работают, бот — через long polling.

## 4. Админ-чат

1. Напишите боту `/start` со своего Telegram.
2. Узнайте свой chat id (например через `@userinfobot`).
3. `TELEGRAM_ADMIN_CHAT_ID=123456789`

На новые заказы придут кнопки: Принять / Готовится / Готов / Курьер / Завершить.

## 5. Оплата Alif

Не храните данные карт. Задайте публичный Paylink:

`PAYMENT_PROVIDER_URL=https://example-alif-paylink`

К заказу добавятся `order`, `amount`, `currency=TJS`. Пока URL пуст, заказ с картой создаётся со статусом `PENDING_PAYMENT`, но страница Alif не открывается.

## 6. Запуск локально

```
npm start
```

Без токена сайт живёт как раньше, в логе: «токен не задан».

С токеном: напишите боту `/start`.

## 7. Проверки

- `/start` — приветствие и кнопки.
- Меню → блюдо → в корзину → оформить заказ (доставка / самовывоз / геолокация).
- Карта: статус `PENDING_PAYMENT`; кнопка Alif, если задан Paylink.
- Наличные: `PENDING_CONFIRMATION`, уведомление админу.
- Админ меняет статус → клиент получает сообщение.
- Заказ ≥ 100 TJS → подарок, один spin на сессию.
- Mini App: BotFather menu button → каталог тех же блюд `/api/dishes`.

## 8. Production

1. Закоммитьте код (без `.env`).
2. Railway Variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_MINI_APP_URL`, `PUBLIC_SITE_URL=https://resstaurant.pp.ua`, при необходимости `PAYMENT_PROVIDER_URL`.
3. Проверьте `/api/health` → `"telegram": true`.
4. В BotFather URL Mini App должен быть именно production HTTPS.
