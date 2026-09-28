# Оплата Alif для PLOV TG

Карты не хранятся на сайте и в боте. Alif открывается на стороне банка.

Сейчас кнопка «Оплата через Alif» открывает страницу `https://resstaurant.pp.ua/pay/НОМЕР`. Настоящий checkout Alif заработает только после ключей эквайринга.

## Что сделать владельцу ресторана

1. Заявка на онлайн-эквайринг: https://alif.tj/ru/business/acquiring  
   Документы ИП: паспорт, ИНН, свидетельство.
2. Alif выдаёт **key** (логин терминала) и **password**.
3. В Railway → PLOV-TG → web → Variables:

```
ALIF_KEY=ключ_от_алиф
ALIF_PASSWORD=пароль_от_алиф
ALIF_GATE=km
ALIF_ENV=production
```

4. Скажите Alif callback URL:

`https://resstaurant.pp.ua/api/payments/alif/callback`

5. После деплоя `/api/health` должен показать `"payments": { "alif": true }`.

Тестовый стенд (не боевые деньги): `ALIF_ENV=test` — форма уйдёт на `https://test-web.alif.tj/`.

## Пока ключей нет

Заказ сохраняется. На странице оплаты можно нажать **«Оплачу при получении»**. Статус PAID без подтверждения Alif не ставится.

## Paylink без API

Если в кабинете Alif уже есть готовая ссылка:

`PAYMENT_PROVIDER_URL=https://ваша-ссылка-alif`
