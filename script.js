'use strict';
/* =========================================================
   PLOV TG — main script (vanilla JS, ES6+)
   Sections: i18n, loader/intro, registration, canvases,
   table showcase, menu (search/filter/sort), cart, forms,
   misc UI (theme, music, header, reveal, counters, ripple)
========================================================= */

/* ---------------------------------------------------------
   1. DISH DATA — real Tajik dishes with verified photographs
--------------------------------------------------------- */
const IMG = (file) => `/images/${file}`;

const DISHES = [
  {
    id: 'plov', cat: 'main', angle: -160,
    name: { ru: 'Плов', en: 'Plov', tj: 'Оши палов' },
    desc: { ru: 'Классический таджикский плов с бараниной, морковью и нутом, томлённый в казане.', en: 'Classic Tajik pilaf with lamb, carrots and chickpeas, slow-cooked in a kazan.', tj: 'Оши палави суннатии тоҷикӣ бо гӯшти гӯсфанд.' },
    price: 120, cal: 480, ingredients: { ru: 'рис девзира, баранина, морковь, нут, лук, зира', en: 'devzira rice, lamb, carrot, chickpeas, onion, cumin', tj: 'биринҷ, гӯшт, сабзӣ, нахуд, пиёз, зира' },
    img: IMG('plov.jpg')
  },
  {
    id: 'manti', cat: 'main', angle: -128,
    name: { ru: 'Манты', en: 'Manti', tj: 'Манту' },
    desc: { ru: 'Нежные манты с сочной бараниной и ароматным луком, подаются со сметаной.', en: 'Tender steamed dumplings with juicy lamb and onion, served with sour cream.', tj: 'Манти нарм бо гӯшти гӯсфанд ва пиёз.' },
    price: 85, cal: 420, ingredients: { ru: 'тесто, баранина, лук, чёрный перец, сметана', en: 'dough, lamb, onion, black pepper, sour cream', tj: 'хамир, гӯшт, пиёз, қаламфур' },
    img: IMG('manti.jpg')
  },
  {
    id: 'kurutob', cat: 'main', angle: -96,
    name: { ru: 'Курутоб', en: 'Qurutob', tj: 'Қурутоб' },
    desc: { ru: 'Национальное блюдо из слоёного хлеба фатир с курутом, помидорами и луком.', en: 'National dish of layered fatir bread with qurut (dried yoghurt), tomatoes and onion.', tj: 'Хӯроки миллӣ аз фатир бо қурут ва помидор.' },
    price: 65, cal: 390, ingredients: { ru: 'фатир, курут, помидоры, лук, зелень, льняное масло', en: 'fatir bread, qurut, tomato, onion, herbs, linseed oil', tj: 'фатир, қурут, помидор, пиёз, сабзавот' },
    img: IMG('kurutob.jpg')
  },
  {
    id: 'shashlik', cat: 'grill', angle: -64,
    name: { ru: 'Шашлык', en: 'Shashlik', tj: 'Шашлик' },
    desc: { ru: 'Сочные кусочки баранины, маринованные в специях и обжаренные на углях.', en: 'Juicy lamb chunks marinated in spices, grilled over charcoal.', tj: 'Порчаҳои гӯшти гӯсфанд, дар ангишт бирён карда шуда.' },
    price: 140, cal: 520, ingredients: { ru: 'баранина, лук, зира, красный перец, уксус', en: 'lamb, onion, cumin, red pepper, vinegar', tj: 'гӯшт, пиёз, зира, қаламфури сурх' },
    img: IMG('shashlik.jpg')
  },
  {
    id: 'kabob', cat: 'grill', angle: -32,
    name: { ru: 'Кабоб', en: 'Kabob', tj: 'Кабоб' },
    desc: { ru: 'Рубленое мясо на шампуре с луком и специями, обжаренное на открытом огне.', en: 'Minced meat skewers with onion and spices, grilled over open fire.', tj: 'Гӯшти қима дар сих бо пиёз ва ҳанут.' },
    price: 110, cal: 470, ingredients: { ru: 'говядина, баранина, лук, кориандр, зира', en: 'beef, lamb, onion, coriander, cumin', tj: 'гӯшти гов, пиёз, кашнич, зира' },
    img: IMG('kabob.jpg')
  },
  {
    id: 'samsa', cat: 'bakery', angle: 0,
    name: { ru: 'Самбуса', en: 'Sambusa', tj: 'Самбӯса' },
    desc: { ru: 'Слоёные пирожки с бараниной и луком, запечённые в тандыре.', en: 'Flaky pastry filled with lamb and onion, baked in a tandoor.', tj: 'Самбӯсаи қабатнок бо гӯшт ва пиёз аз танӯр.' },
    price: 25, cal: 310, ingredients: { ru: 'слоёное тесто, баранина, лук, зира', en: 'puff pastry, lamb, onion, cumin', tj: 'хамир, гӯшт, пиёз, зира' },
    img: IMG('samsa.jpg')
  },
  {
    id: 'oshi-tugrama', cat: 'soup', angle: 32,
    name: { ru: 'Оши Туграма', en: 'Oshi Tugrama', tj: 'Оши туграма' },
    desc: { ru: 'Наваристый суп с домашней лапшой, говядиной и овощами.', en: 'Rich soup with hand-cut noodles, beef and vegetables.', tj: 'Шӯрбои бой бо равған, гӯшт ва сабзавот.' },
    price: 70, cal: 340, ingredients: { ru: 'лапша, говядина, нут, картофель, зелень', en: 'noodles, beef, chickpeas, potato, herbs', tj: 'ресмон, гӯшт, нахуд, картошка' },
    img: IMG('oshi-tugrama.jpg')
  },
  {
    id: 'fatir', cat: 'bakery', angle: 64,
    name: { ru: 'Фатир', en: 'Fatir', tj: 'Фатир' },
    desc: { ru: 'Слоёная лепёшка из тандыра — основа для курутоба и самостоятельная закуска.', en: 'Layered tandoor flatbread — the base for qurutob and a snack on its own.', tj: 'Нони қабатноки танӯрӣ.' },
    price: 20, cal: 260, ingredients: { ru: 'мука, вода, масло, соль', en: 'flour, water, oil, salt', tj: 'орд, об, равған, намак' },
    img: IMG('fatir.jpg')
  },
  {
    id: 'halisa', cat: 'dessert', angle: 96,
    name: { ru: 'Халиса', en: 'Halisa', tj: 'Ҳалиса' },
    desc: { ru: 'Тягучий десерт из муки и топлёного масла с сахарным сиропом.', en: 'A silky flour-and-ghee dessert finished with sugar syrup.', tj: 'Ширинии орд бо равған ва шарбати шакар.' },
    price: 35, cal: 410, ingredients: { ru: 'мука, топлёное масло, сахарный сироп, орехи', en: 'flour, ghee, sugar syrup, nuts', tj: 'орд, равған, шарбат, чормағз' },
    img: IMG('halisa.jpg'), icon: 'dessert'
  },
  {
    id: 'chakka', cat: 'drink', angle: 128,
    name: { ru: 'Чакка', en: 'Chakka', tj: 'Чакка' },
    desc: { ru: 'Густой кисломолочный продукт — таджикская версия густого йогурта.', en: 'Thick strained yoghurt — the Tajik take on cultured dairy.', tj: 'Маҳсули ширии ғафс.' },
    price: 18, cal: 90, ingredients: { ru: 'молоко, закваска, соль', en: 'milk, culture, salt', tj: 'шир, хамиртуруш, намак' },
    img: IMG('chakka.jpg')
  },
  {
    id: 'shirchoy', cat: 'drink', angle: 160,
    name: { ru: 'Ширчой', en: 'Shirchoy', tj: 'Ширчой' },
    desc: { ru: 'Традиционный чай с молоком, маслом и щепоткой соли — тёплый завтрак Памира.', en: 'Traditional milk tea with butter and a pinch of salt — a warm Pamir breakfast.', tj: 'Чойи анъанавӣ бо шир ва равған.' },
    price: 22, cal: 140, ingredients: { ru: 'чёрный чай, молоко, масло, соль', en: 'black tea, milk, butter, salt', tj: 'чойи сиёҳ, шир, равған, намак' },
    img: IMG('shirchoy.jpg'), icon: 'tea'
  },
  {
    id: 'dugob', cat: 'drink', angle: 192,
    name: { ru: 'Дугоб', en: 'Dugob', tj: 'Дугоб' },
    desc: { ru: 'Освежающий йогуртовый напиток с холодной водой и мятой.', en: 'Refreshing chilled yoghurt drink with mint.', tj: 'Нӯшокии хунуки чакка бо об ва наъно.' },
    price: 15, cal: 70, ingredients: { ru: 'йогурт, вода, мята, соль', en: 'yoghurt, water, mint, salt', tj: 'чакка, об, наъно, намак' },
    img: IMG('dugob.jpg')
  }
];

function placeholderDataURI(icon){
  const fill = icon === 'tea' ? '#a9723f' : '#8a5a2c';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect fill="#1d140d" width="400" height="400"/><circle cx="200" cy="200" r="120" fill="${fill}" opacity=".4"/><text x="200" y="215" text-anchor="middle" fill="#f3d99c" font-size="42" font-family="Georgia">PLOV</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
}

async function loadMenuFromApi(){
  try{
    const data = await apiGet('/api/dishes');
    if(!Array.isArray(data) || !data.length) return;
    DISHES.length = 0;
    data.forEach(d => {
      DISHES.push(d);
      if(d.history) DISH_HISTORY[d.id] = d.history;
    });
  }catch(_e){
    console.warn('Меню с сервера недоступно, используем локальные данные');
  }
}

const CATEGORY_LABEL = {
  main:   { ru:'Основные', en:'Main', tj:'Асосӣ' },
  soup:   { ru:'Супы', en:'Soups', tj:'Шӯрбо' },
  grill:  { ru:'Гриль', en:'Grill', tj:'Гриль' },
  bakery: { ru:'Выпечка', en:'Bakery', tj:'Нонворӣ' },
  dessert:{ ru:'Десерты', en:'Desserts', tj:'Ширинӣ' },
  drink:  { ru:'Напитки', en:'Drinks', tj:'Нӯшокӣ' }
};

/* ---------------------------------------------------------
   2. I18N DICTIONARY
--------------------------------------------------------- */
const I18N = {
  ru: {
    welcome_title:'ДОБРО ПОЖАЛОВАТЬ<br>В МИР НАСТОЯЩЕЙ<br><span>ТАДЖИКСКОЙ КУХНИ</span>',
    reg_title:'Начните своё путешествие', reg_subtitle:'Узнайте, что значит настоящее таджикское гостеприимство',
    reg_name:'Ваше имя', reg_email:'Email', reg_btn:'Начать путешествие',
    err_name:'Введите имя (мин. 2 символа)', err_email:'Введите корректный email', err_phone:'Введите корректный номер телефона',
    err_guests:'От 1 до 50 гостей', err_date:'Выберите дату не в прошлом', err_time:'Укажите время', err_address:'Укажите адрес доставки',
    nav_home:'Главная', nav_menu:'Меню', nav_about:'О нас', nav_chefs:'Повара', nav_gallery:'Галерея', nav_reviews:'Отзывы', nav_news:'Новости', nav_contacts:'Контакты',
    skip_menu:'Перейти к меню', table_cta:'Смотреть меню', hero_place:'Душанбе, проспект Рудаки, 25', search_label:'Поиск по меню',
    hero_eyebrow:'Ресторан таджикской кухни · Душанбе', hero_title1:'Вкус,', hero_title2:'достойный дастархана',
    hero_desc:'Плов, манты и курутоб, приготовленные так, как их готовили в домах Самарканда и Душанбе поколениями — в атмосфере тёплого золотого света и настоящего дерева.',
    hero_btn_menu:'Посмотреть меню', hero_btn_order:'Заказать', hero_btn_book:'Забронировать столик',
    c_years:'лет традиций', c_dishes:'блюд в меню', c_guests:'гостей в год', c_chefs:'поваров',
    table_eyebrow:'Наш дастархан', table_title:'Стол, за которым собирается вся Таджикская кухня',
    table_hint:'Нажмите клош, чтобы открыть или закрыть. Затем нажмите на блюдо.',
    menu_eyebrow:'Меню ресторана', menu_title:'Настоящая таджикская кухня', search_ph:'Поиск блюд… (плов, манты, курутоб)',
    sort_default:'Сортировка', sort_price_asc:'Цена: по возрастанию', sort_price_desc:'Цена: по убыванию', sort_name:'По названию',
    cat_all:'Все', cat_main:'Основные', cat_soup:'Супы', cat_grill:'Гриль', cat_bakery:'Выпечка', cat_dessert:'Десерты', cat_drink:'Напитки',
    menu_empty:'Ничего не найдено. Попробуйте другой запрос.',
    order_btn:'Заказать', details_btn:'Подробнее', add_cart:'В корзину',
    about_eyebrow:'История ресторана', about_title:'14 лет вкуса, унаследованного от предков',
    about_p1:'PLOV TG родился из семейного рецепта плова, который передавался в нашей семье четыре поколения. Мы открылись в Душанбе с одной целью — сохранить подлинный вкус таджикской кухни и подать его в атмосфере, достойной этих рецептов.',
    about_p2:'Каждое блюдо готовится в казане на открытом огне, тесто для мантов и самбусы раскатывается вручную, а специи привозятся с рынков Пенджикента и Хорога.',
    why1_t:'Огонь и казан', why1_d:'Готовим на открытом огне, как это делали таджикские мастера сотни лет назад.',
    why2_t:'Только свежее', why2_d:'Баранина, рис девзира и специи — только от проверенных фермеров Таджикистана.',
    why3_t:'Гостеприимство', why3_d:'Каждый гость — как член семьи. Настоящий дастархан начинается с чая.',
    chefs_eyebrow:'Наша команда', chefs_title:'Шеф-повара',
    chef1_role:'Главный шеф-повар · 22 года стажа', chef2_role:'Шеф-повар тандыра и гриля', chef3_role:'Кондитер · выпечка и десерты',
    gallery_eyebrow:'Атмосфера', gallery_title:'Фотогалерея ресторана',
    g1:'Резной потолок ручной работы', g2:'Традиционный дастархан', g3:'Праздничный зал Навруз', g4:'Чайхана и VIP-зал', g5:'Главный зал',
    promo_eyebrow:'Акции', promo_title:'Специальные предложения',
    promo1_t:'Семейный дастархан', promo1_d:'Скидка 15% на плов и курутоб при заказе от 4 персон, каждое воскресенье.',
    promo2_badge:'Подарок', promo2_t:'Чакка в подарок', promo2_d:'При заказе шашлыка на мангале — чакка и фатир к столу бесплатно.',
    promo3_badge:'VIP', promo3_t:'VIP-зал для торжеств', promo3_d:'Индивидуальное меню и национальные музыканты для банкетов от 20 гостей.',
    reserve_eyebrow:'Бронирование', reserve_title:'Забронировать столик',
    reserve_desc:'Оставьте заявку — и мы подтвердим бронь в течение 15 минут. Для больших групп рекомендуем бронировать за 2 дня.',
    f_name:'Имя', f_phone:'Телефон', f_guests:'Количество гостей', f_date:'Дата', f_time:'Время', f_comment:'Комментарий', f_address:'Адрес доставки',
    reserve_btn:'Забронировать столик', reserve_success:'Спасибо! Ваша бронь принята, мы свяжемся с вами в ближайшее время.',
    reviews_eyebrow:'Отзывы гостей', reviews_title:'Что говорят о нас',
    rev1:'«Плов точно такой, каким его готовила бабушка в Худжанде. Давно не пробовал ничего настолько настоящего.»',
    rev2:'«Курутоб — просто восторг, а атмосфера зала с резным деревом переносит прямо в чайхану на Рудаки.»',
    rev3:'«Заказывали банкет на 25 человек в VIP-зале — сервис и шашлык на высшем уровне.»',
    news_eyebrow:'Новости', news_title:'Последние события PLOV TG',
    news1_t:'Новое сезонное меню', news1_d:'Мы обновили меню, добавив фатир из тандыра и сезонные травы к курутобу.',
    news2_t:'Мастер-класс по плову', news2_d:'Приглашаем на мастер-класс от шеф-повара Усмона Алиева — научитесь готовить настоящий таджикский плов.',
    news3_t:'Расширение VIP-зала', news3_d:'Открыли новый VIP-зал с резными колоннами для торжеств и переговоров.',
    social_title:'Мы в социальных сетях',
    contacts_eyebrow:'Контакты', contacts_title:'Как нас найти',
    c_phone:'Телефон:', c_email:'Email:', c_address:'Адрес:', c_address_val:'г. Душанбе, проспект Рудаки, 25',
    c_hours:'Часы работы:', c_hours_val:'10:00 — 24:00, ежедневно',
    order_title:'Оформление заказа', order_submit:'Подтвердить заказ', order_success:'Спасибо! Заказ №<span id="orderNum"></span> принят и готовится.',
    cart_title:'Ваша корзина', cart_empty:'Корзина пуста. Добавьте блюда из меню.', cart_total:'Итого:', cart_checkout:'Оформить заказ',
    footer_tag:'Элитный ресторан таджикской кухни в самом сердце Душанбе.', footer_contacts:'Контакты', footer_social:'Соцсети', footer_rights:'Все права защищены.',
    footer_staff:'Для персонала', f_city:'Город', f_review:'Ваш отзыв', err_review:'Напишите отзыв (мин. 8 символов)',
    review_form_title:'Оставить отзыв', review_btn:'Отправить отзыв', review_success:'Спасибо! Отзыв отправлен на модерацию.',
    unit:'сомони'
  },
  en: {
    welcome_title:'WELCOME TO THE WORLD<br>OF AUTHENTIC<br><span>TAJIK CUISINE</span>',
    reg_title:'Begin your journey', reg_subtitle:'Discover what real Tajik hospitality feels like',
    reg_name:'Your name', reg_email:'Email', reg_btn:'Start the journey',
    err_name:'Enter a name (min. 2 characters)', err_email:'Enter a valid email', err_phone:'Enter a valid phone number',
    err_guests:'From 1 to 50 guests', err_date:'Choose a date not in the past', err_time:'Choose a time', err_address:'Enter a delivery address',
    nav_home:'Home', nav_menu:'Menu', nav_about:'About', nav_chefs:'Chefs', nav_gallery:'Gallery', nav_reviews:'Reviews', nav_news:'News', nav_contacts:'Contacts',
    skip_menu:'Skip to menu', table_cta:'View menu', hero_place:'25 Rudaki Avenue, Dushanbe', search_label:'Search the menu',
    hero_eyebrow:'Tajik cuisine restaurant · Dushanbe', hero_title1:'A taste', hero_title2:'worthy of the dastarkhan',
    hero_desc:'Plov, manti and qurutob, prepared the way they were made in the homes of Samarkand and Dushanbe for generations — in an atmosphere of warm golden light and real wood.',
    hero_btn_menu:'View menu', hero_btn_order:'Order now', hero_btn_book:'Book a table',
    c_years:'years of tradition', c_dishes:'dishes on the menu', c_guests:'guests a year', c_chefs:'chefs',
    table_eyebrow:'Our dastarkhan', table_title:'The table where all of Tajik cuisine gathers',
    table_hint:'Tap the cloche to open or close it. Then tap the dish.',
    menu_eyebrow:'Restaurant menu', menu_title:'Authentic Tajik cuisine', search_ph:'Search dishes… (plov, manti, qurutob)',
    sort_default:'Sort', sort_price_asc:'Price: low to high', sort_price_desc:'Price: high to low', sort_name:'By name',
    cat_all:'All', cat_main:'Mains', cat_soup:'Soups', cat_grill:'Grill', cat_bakery:'Bakery', cat_dessert:'Desserts', cat_drink:'Drinks',
    menu_empty:'Nothing found. Try another search.',
    order_btn:'Order', details_btn:'Details', add_cart:'Add to cart',
    about_eyebrow:'Our history', about_title:'14 years of taste inherited from our ancestors',
    about_p1:'PLOV TG was born from a family plov recipe passed down for four generations. We opened in Dushanbe with one goal — to preserve the authentic taste of Tajik cuisine and serve it in an atmosphere worthy of these recipes.',
    about_p2:'Every dish is cooked in a kazan over an open flame, the dough for manti and sambusa is rolled by hand, and spices are brought from the markets of Panjakent and Khorog.',
    why1_t:'Fire and kazan', why1_d:'We cook over an open flame, just as Tajik masters did hundreds of years ago.',
    why2_t:'Only fresh', why2_d:'Lamb, devzira rice and spices — only from trusted Tajik farmers.',
    why3_t:'Hospitality', why3_d:'Every guest is family. A real dastarkhan always starts with tea.',
    chefs_eyebrow:'Our team', chefs_title:'Head chefs',
    chef1_role:'Head chef · 22 years of experience', chef2_role:'Tandoor & grill chef', chef3_role:'Pastry chef · bakery and desserts',
    gallery_eyebrow:'Atmosphere', gallery_title:'Restaurant photo gallery',
    g1:'Hand-carved ceiling', g2:'Traditional dastarkhan', g3:'Navruz festive hall', g4:'Teahouse and VIP hall', g5:'Main hall',
    promo_eyebrow:'Offers', promo_title:'Special offers',
    promo1_t:'Family dastarkhan', promo1_d:'15% off plov and qurutob for groups of 4+, every Sunday.',
    promo2_badge:'Gift', promo2_t:'Free chakka', promo2_d:'Order grilled shashlik and get chakka and fatir on the house.',
    promo3_badge:'VIP', promo3_t:'VIP hall for events', promo3_d:'Custom menu and live national musicians for banquets of 20+ guests.',
    reserve_eyebrow:'Reservation', reserve_title:'Book a table',
    reserve_desc:'Leave a request and we will confirm within 15 minutes. For large groups, please book 2 days ahead.',
    f_name:'Name', f_phone:'Phone', f_guests:'Number of guests', f_date:'Date', f_time:'Time', f_comment:'Comment', f_address:'Delivery address',
    reserve_btn:'Book a table', reserve_success:'Thank you! Your reservation is confirmed, we will contact you shortly.',
    reviews_eyebrow:'Guest reviews', reviews_title:'What people say',
    rev1:"\"The plov tastes exactly like my grandmother's in Khujand. I haven't had anything this authentic in years.\"",
    rev2:'"Qurutob is a delight, and the carved-wood hall feels just like a teahouse on Rudaki Avenue."',
    rev3:'"We booked a banquet for 25 in the VIP hall — the service and shashlik were flawless."',
    news_eyebrow:'News', news_title:'Latest at PLOV TG',
    news1_t:'New seasonal menu', news1_d:'We updated the menu with tandoor fatir and seasonal herbs for qurutob.',
    news2_t:'Plov masterclass', news2_d:'Join a masterclass with head chef Usmon Aliev and learn to cook real Tajik plov.',
    news3_t:'VIP hall expansion', news3_d:'We opened a new VIP hall with carved columns for events and meetings.',
    social_title:'Follow us',
    contacts_eyebrow:'Contacts', contacts_title:'Find us',
    c_phone:'Phone:', c_email:'Email:', c_address:'Address:', c_address_val:'25 Rudaki Avenue, Dushanbe',
    c_hours:'Hours:', c_hours_val:'10:00 AM — midnight, daily',
    order_title:'Checkout', order_submit:'Confirm order', order_success:'Thank you! Order #<span id="orderNum"></span> is confirmed and being prepared.',
    cart_title:'Your cart', cart_empty:'Your cart is empty. Add dishes from the menu.', cart_total:'Total:', cart_checkout:'Checkout',
    footer_tag:'An elite Tajik restaurant in the heart of Dushanbe.', footer_contacts:'Contacts', footer_social:'Social', footer_rights:'All rights reserved.',
    footer_staff:'Staff login', f_city:'City', f_review:'Your review', err_review:'Write a review (min. 8 characters)',
    review_form_title:'Leave a review', review_btn:'Send review', review_success:'Thank you! Your review is awaiting moderation.',
    unit:'TJS'
  },
  tj: {
    welcome_title:'БА ҶАҲОНИ ОШПАЗИИ<br>АСИЛИ ТОҶИКӢ<br><span>ХУШ ОМАДЕД</span>',
    reg_title:'Сафари худро оғоз кунед', reg_subtitle:'Меҳмоннавозии асили тоҷикиро эҳсос кунед',
    reg_name:'Номи шумо', reg_email:'Почтаи электронӣ', reg_btn:'Сафарро оғоз кунед',
    err_name:'Номро ворид кунед (ҳадди ақал 2 ҳарф)', err_email:'Почтаи электронии дурустро ворид кунед', err_phone:'Рақами телефони дурустро ворид кунед',
    err_guests:'Аз 1 то 50 меҳмон', err_date:'Санаи гузаштаро интихоб накунед', err_time:'Вақтро нишон диҳед', err_address:'Суроғаи расониданро ворид кунед',
    nav_home:'Асосӣ', nav_menu:'Меню', nav_about:'Дар бораи мо', nav_chefs:'Ошпазон', nav_gallery:'Галерея', nav_reviews:'Тақризҳо', nav_news:'Ахбор', nav_contacts:'Тамос',
    skip_menu:'Ба меню гузаред', table_cta:'Дидани меню', hero_place:'ш. Душанбе, хиёбони Рӯдакӣ, 25', search_label:'Ҷустуҷӯи меню',
    hero_eyebrow:'Тарабхонаи таомҳои тоҷикӣ · Душанбе', hero_title1:'Таъме,', hero_title2:'сазовори дастархон',
    hero_desc:'Оши палов, манту ва қурутоб — тавре ки дар хонаҳои Самарқанду Душанбе наслҳо пухта мешуданд, дар фазои нури тиллоӣ ва чӯби асил.',
    hero_btn_menu:'Дидани меню', hero_btn_order:'Фармоиш додан', hero_btn_book:'Ҷой брон кардан',
    c_years:'соли анъана', c_dishes:'таом дар меню', c_guests:'меҳмон дар сол', c_chefs:'ошпаз',
    table_eyebrow:'Дастархони мо', table_title:'Дастархоне, ки тамоми таомҳои тоҷикӣ дар он ҷамъ мешаванд',
    table_hint:'Клошро пахш кунед — боз ё пӯшида мешавад. Баъд таомро пахш кунед.',
    menu_eyebrow:'Менюи тарабхона', menu_title:'Таомҳои асили тоҷикӣ', search_ph:'Ҷустуҷӯи таом… (палов, манту, қурутоб)',
    sort_default:'Мураттабсозӣ', sort_price_asc:'Нарх: аз кам ба зиёд', sort_price_desc:'Нарх: аз зиёд ба кам', sort_name:'Аз рӯи ном',
    cat_all:'Ҳама', cat_main:'Асосӣ', cat_soup:'Шӯрбо', cat_grill:'Гриль', cat_bakery:'Нонворӣ', cat_dessert:'Ширинӣ', cat_drink:'Нӯшокӣ',
    menu_empty:'Чизе ёфт нашуд. Дигар калимаро санҷед.',
    order_btn:'Фармоиш', details_btn:'Тафсилот', add_cart:'Ба сабад',
    about_eyebrow:'Таърихи тарабхона', about_title:'14 соли таъми аз ниёгон боқимонда',
    about_p1:'PLOV TG аз рецепти хонаводагии палов, ки чор насл интиқол ёфтааст, ба вуҷуд омад. Мо дар Душанбе бо як ҳадаф кушода шудем — нигоҳ доштани таъми асили таомҳои тоҷикӣ.',
    about_p2:'Ҳар таом дар дег бар оташи кушод пухта мешавад, хамири манту ва самбӯса бо даст омода мешавад.',
    why1_t:'Оташ ва дег', why1_d:'Мо бар оташи кушод мепазем, тавре ки устодони тоҷик садсолаҳо пеш мепухтанд.',
    why2_t:'Танҳо тару тоза', why2_d:'Гӯшти гӯсфанд, биринҷи девзира ва ҳанут — танҳо аз деҳқонони боэътимоди тоҷик.',
    why3_t:'Меҳмоннавозӣ', why3_d:'Ҳар меҳмон — узви оила. Дастархони асил аз чой оғоз мешавад.',
    chefs_eyebrow:'Дастаи мо', chefs_title:'Ошпазони бузург',
    chef1_role:'Ошпази бузург · 22 соли таҷриба', chef2_role:'Ошпази танӯр ва гриль', chef3_role:'Қаннод · нонворӣ ва ширинӣ',
    gallery_eyebrow:'Фазо', gallery_title:'Галереяи расмҳои тарабхона',
    g1:'Шифти кандакории дастӣ', g2:'Дастархони анъанавӣ', g3:'Толори ҷашнии Наврӯз', g4:'Чойхона ва толори VIP', g5:'Толори асосӣ',
    promo_eyebrow:'Аксия', promo_title:'Пешниҳодҳои махсус',
    promo1_t:'Дастархони оилавӣ', promo1_d:'15% тахфиф ба палов ва қурутоб барои 4 нафар ва зиёд, ҳар якшанбе.',
    promo2_badge:'Тӯҳфа', promo2_t:'Чакка ҳамчун тӯҳфа', promo2_d:'Ҳангоми фармоиши шашлик — чакка ва фатир ройгон.',
    promo3_badge:'VIP', promo3_t:'Толори VIP барои маросимҳо', promo3_d:'Менюи фардӣ ва мусиқии миллӣ барои зиёфат аз 20 нафар.',
    reserve_eyebrow:'Брон кардан', reserve_title:'Ҷой брон кардан',
    reserve_desc:'Дархост гузоред — мо дар давоми 15 дақиқа тасдиқ мекунем. Барои гурӯҳҳои калон 2 рӯз пеш брон кунед.',
    f_name:'Ном', f_phone:'Телефон', f_guests:'Шумораи меҳмонон', f_date:'Сана', f_time:'Вақт', f_comment:'Шарҳ', f_address:'Суроғаи расонидан',
    reserve_btn:'Ҷой брон кардан', reserve_success:'Ташаккур! Брони шумо қабул шуд, мо ба зудӣ тамос мегирем.',
    reviews_eyebrow:'Тақризи меҳмонон', reviews_title:'Дар бораи мо чӣ мегӯянд',
    rev1:'«Палов маҳз мисли пловаки модаркалонам дар Хуҷанд аст.»',
    rev2:'«Қурутоб олиҷаноб аст, фазои толор бо кандакорӣ маро ба чойхонаи Рӯдакӣ мебарад.»',
    rev3:'«Барои 25 нафар дар толори VIP фармоиш додем — хизматрасонӣ олӣ буд.»',
    news_eyebrow:'Ахбор', news_title:'Охирин хабарҳои PLOV TG',
    news1_t:'Менюи нави мавсимӣ', news1_d:'Мо менюро бо фатири танӯрӣ ва сабзавоти мавсимӣ барои қурутоб нав кардем.',
    news2_t:'Мастер-класси палов', news2_d:'Ба мастер-класси ошпази бузург Усмон Алиев даъват мекунем.',
    news3_t:'Васеъшавии толори VIP', news3_d:'Толори нави VIP бо сутунҳои кандакорӣ кушода шуд.',
    social_title:'Мо дар шабакаҳои иҷтимоӣ',
    contacts_eyebrow:'Тамос', contacts_title:'Моро чӣ тавр пайдо кунед',
    c_phone:'Телефон:', c_email:'Почта:', c_address:'Суроға:', c_address_val:'ш. Душанбе, хиёбони Рӯдакӣ, 25',
    c_hours:'Соатҳои корӣ:', c_hours_val:'10:00 — 24:00, ҳар рӯз',
    order_title:'Расмиёти фармоиш', order_submit:'Тасдиқи фармоиш', order_success:'Ташаккур! Фармоиши №<span id="orderNum"></span> қабул шуд.',
    cart_title:'Сабади шумо', cart_empty:'Сабад холист. Таом аз меню илова кунед.', cart_total:'Ҳамагӣ:', cart_checkout:'Расмият додани фармоиш',
    footer_tag:'Тарабхонаи баланди таомҳои тоҷикӣ дар маркази Душанбе.', footer_contacts:'Тамос', footer_social:'Шабакаҳо', footer_rights:'Ҳама ҳуқуқҳо ҳифз шудаанд.',
    footer_staff:'Барои кормандон', f_city:'Шаҳр', f_review:'Тақризи шумо', err_review:'Тақриз нависед (ҳадди ақал 8 аломат)',
    review_form_title:'Тақриз гузоштан', review_btn:'Фиристодани тақриз', review_success:'Ташаккур! Тақриз ба санҷиш фиристода шуд.',
    unit:'сомонӣ'
  }
};
let currentLang = localStorage.getItem('plovtg_lang') || 'ru';

function applyI18n(){
  const dict = I18N[currentLang];
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(dict[key] !== undefined) el.innerHTML = dict[key];
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el=>{
    const key = el.getAttribute('data-i18n-ph');
    if(dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });
  document.getElementById('langLabel').textContent = currentLang.toUpperCase();
  window.currentLang = currentLang;
  renderMenu();
  updateCartUI();
  if (typeof window.updateDastarkhanLabels === 'function') window.updateDastarkhanLabels();
}

/* ---------------------------------------------------------
   3. LOADER + WELCOME + REGISTRATION
--------------------------------------------------------- */
function initLoader(){
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  if (fill) fill.style.width = '100%';
  if (pct) pct.textContent = '100%';
  setTimeout(() => {
    loader?.classList.add('hide');
    showWelcome();
  }, 180);
}

function showWelcome(){
  const welcome = document.getElementById('welcome');
  welcome.classList.add('show');
  document.body.classList.add('no-scroll');
  setTimeout(()=>{
    welcome.classList.remove('show');
    welcome.classList.add('hide');
    document.body.classList.remove('no-scroll');
    openRegistrationOrGreet();
  }, 1000);
}

function openRegModal(){
  const modal = document.getElementById('regModal');
  if(!modal) return;
  modal.classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeRegModal(){
  const modal = document.getElementById('regModal');
  if(!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function openRegistrationOrGreet(){
  const saved = localStorage.getItem('plovtg_user');
  if(saved){
    return;
  }
  openRegModal();
}

function initRegistration(){
  document.getElementById('regBtn')?.addEventListener('click', openRegModal);
  document.getElementById('regClose')?.addEventListener('click', closeRegModal);
  document.getElementById('regModal')?.addEventListener('click', (e)=>{
    if(e.target.id === 'regModal') closeRegModal();
  });
  const form = document.getElementById('regForm');
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const nameField = form.querySelector('#regName').closest('.field');
    const emailField = form.querySelector('#regEmail').closest('.field');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const err = document.getElementById('regError');
    err.classList.remove('show', 'form-ok');
    let ok = true;
    if(name.length < 2){ nameField.classList.add('invalid'); ok = false; } else nameField.classList.remove('invalid');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ emailField.classList.add('invalid'); ok = false; } else emailField.classList.remove('invalid');
    if(!ok) return;
    try{
      const result = await apiPost('/api/guests', { name, email });
      localStorage.setItem('plovtg_user', JSON.stringify({ name, email }));
      if (result?.emailSent) {
        err.textContent = 'Письмо отправлено на почту. Проверьте inbox.';
        err.classList.add('show', 'form-ok');
        await new Promise((resolve) => setTimeout(resolve, 900));
      } else {
        err.textContent = 'Регистрация прошла. Письмо не отправилось — нужен RESEND_API_KEY.';
        err.classList.add('show');
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      closeRegModal();
    }catch(ex){
      err.textContent = ex.message;
      err.classList.add('show');
    }
  });
}

/* ---------------------------------------------------------
   4. HERO AMBIENT CANVAS (embers / warm glow instead of a
      hotlinked video file, so it always renders reliably)
--------------------------------------------------------- */
function initHeroCanvas(){
  const canvas = document.getElementById('heroCanvas');
  const ctx = canvas.getContext('2d');
  let w,h, embers = [];
  function resize(){ w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
  resize(); addEventListener('resize', resize);
  for(let i=0;i<60;i++){
    embers.push({ x:Math.random()*w, y:Math.random()*h, r:Math.random()*2+.5, vy:-(Math.random()*.4+.08), vx:(Math.random()-.5)*.2, a:Math.random()*.5+.1, hue: Math.random()>.5 });
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    const grad = ctx.createRadialGradient(w*.5,h*.35,0,w*.5,h*.35,w*.6);
    grad.addColorStop(0,'rgba(120,70,20,.16)'); grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
    embers.forEach(p=>{
      p.y += p.vy; p.x += p.vx;
      if(p.y < -10){ p.y = h + 10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.fillStyle = p.hue ? `rgba(255,154,82,${p.a})` : `rgba(217,181,106,${p.a})`;
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------------------------------------------------------
   5. TABLE SHOWCASE — mouse parallax tilt + slow scroll
      rotation + progressive dish reveal (dishes never fall
      off, they stay pinned to the wheel and rotate with it)
--------------------------------------------------------- */
/* ---------------------------------------------------------
   5. TABLE SHOWCASE — Dishes arranged ON the table surface
      with history/legend on click, smooth auto-rotation
--------------------------------------------------------- */

/* ---------------------------------------------------------
   5. TABLE SHOWCASE — Dishes arranged ON the table surface
      with history/legend on click, smooth auto-rotation
--------------------------------------------------------- */

// Dish history/story data
const DISH_HISTORY = {
  plov: {
    ru: 'Плов — это не просто блюдо, это символ таджикского гостеприимства. Согласно легенде, первый плов приготовил великий завоеватель Тамерлан, чтобы накормить свою армию. Рецепт передавался из поколения в поколение, и каждая семья хранит свои секреты приготовления. В Таджикистане плов готовят в особом казане на открытом огне, добавляя баранину, морковь, нут и зиру. Особый сорт риса "девзира" придаёт блюду неповторимый вкус.',
    en: 'Plov is not just a dish — it is a symbol of Tajik hospitality. According to legend, the great conqueror Tamerlane first prepared plov to feed his army. The recipe has been passed down through generations, and each family keeps its own cooking secrets. In Tajikistan, plov is cooked in a special kazan over an open fire, adding lamb, carrots, chickpeas and cumin. The special "devzira" rice gives the dish its unique flavor.',
    tj: 'Оши палов на танҳо хӯрок нест — ин рамзи меҳмоннавозии тоҷикист. Мувофиқи афсона, завоқбузурги Темур аввалин оши паловро барои ғизодиҳии лашкари худ пухтааст. Рецепт аз насл ба насл мегузарад ва ҳар оила асли худро нигоҳ медорад. Дар Тоҷикистон оши палов дар деги махсус бар оташи кушод пухта мешавад, бо илова кардани гӯшти гӯсфанд, сабзӣ, нахуд ва зира. Биринҷи махсуси "девзира" ба хӯрок таъми беҳамто мебахшад.'
  },
  manti: {
    ru: 'Манты пришли в таджикскую кухню из глубины веков, перекочёвывая через Великий Шёлковый путь. Эти нежные паровые пельмени с сочной бараниной считались блюдом праздничным — их готовили на свадьбах, днях рождения и во время Навруза. Секрет идеальных мантов — в тонко раскатанном тесте и правильно выбранном мясе. В старину тесто для мантов замешивали только женщины, передавая мастерство из матери в дочь.',
    en: 'Manti came to Tajik cuisine from the depths of centuries, migrating along the Great Silk Road. These delicate steamed dumplings with juicy lamb were considered a festive dish — prepared at weddings, birthdays and during Navruz. The secret of perfect manti lies in thinly rolled dough and properly selected meat. In ancient times, only women kneaded manti dough, passing the skill from mother to daughter.',
    tj: 'Манту ба ошпазии тоҷик аз умқи асрҳо омада, тавассути Роҳи Абрешим мегузашт. Ин мантиҳои нарми буғпаз бо гӯшти гӯсфанд хӯроки идона ҳисобида мешуд — дар тӯйҳо, зодрӯзҳо ва дар ҷашни Наврӯз пухта мешуданд. Сирри мантиҳои комил дар хамири тунук ва гӯшти дуруст интихобшуда аст. Дар гузашта танҳо занон хамири мантуро меомехтанд ва ҳунарро аз модар ба духтар мегузаронданд.'
  },
  kurutob: {
    ru: 'Курутоб — национальное достояние Таджикистана, блюдо с тысячелетней историей. Его название происходит от двух слов: "курут" (сушёный йогурт) и "об" (вода/хлеб). В древности курутоб был едой кочевников: сухой курут легко перевозили в мешках, а фатир пекли прямо в пути. Сегодня курутоб подают на важнейших торжествах — он символизирует единство и достаток. Каждый регион Таджикистана имеет свой вариант: в Гиссаре добавляют больше помидоров, в Хатлоне — обильную зелень.',
    en: 'Qurutob is the national treasure of Tajikistan, a dish with a thousand-year history. Its name comes from two words: "qurut" (dried yogurt) and "ob" (water/bread). In ancient times, qurutob was the food of nomads: dry qurut was easily transported in bags, and fatir was baked right on the way. Today, qurutob is served at the most important celebrations — it symbolizes unity and prosperity. Each region of Tajikistan has its own version: in Hisor more tomatoes are added, in Khatlon — abundant herbs.',
    tj: 'Қурутоб ганҷи миллии Тоҷикистон аст, хӯроки бо таърихи ҳазорсола. Номи он аз ду калима иборат аст: "қурут" (йогурти хушк) ва "об" (об/нон). Дар замонҳои қадим қурутоб ғизои кӯчманчиён буд: қурути хушкро осонтар ба халта мебурданд ва фатирро рост дар роҳ мепухтанд. Имрӯз қурутоб дар муҳимтарин ҷашнҳо пешкаш мешавад — он ягонагӣ ва фаровониро рамз мекунад. Ҳар минтақаи Тоҷикистон варианти худро дорад: дар Ҳисор помидор зиёдтар мерезанд, дар Хатлон — сабзавоти фаровон.'
  },
  shashlik: {
    ru: 'Таджикский шашлык — это искусство, доведённое до совершенства. Секрет в маринаде: мясо вымачивают в смеси лука, зиры, кориандра и гранатового сока минимум 4 часа. По преданию, рецепт шашлыка принёс в Среднюю Азию Александр Македонский, а местные мастера довели его до непревзойдённого совершенства. Настоящий таджикский шашлык готовят только на углях из грецкого ореха или вишни — они придают мясу особый аромат.',
    en: 'Tajik shashlik is an art brought to perfection. The secret is in the marinade: the meat is soaked in a mixture of onion, cumin, coriander and pomegranate juice for at least 4 hours. According to legend, Alexander the Great brought the shashlik recipe to Central Asia, and local masters brought it to unsurpassed perfection. Real Tajik shashlik is cooked only on coals from walnut or cherry — they give the meat a special aroma.',
    tj: 'Шашлики тоҷикӣ ҳунарест, ки ба комилият расидааст. Сирр дар маринад аст: гӯштро дар омехтаи пиёз, зира, кашнич ва шарбати анор ҳадди ақал 4 соат мехӯрдор мекунанд. Мувофиқи ривоят, Искандари Мақдунӣ рецепти шашликро ба Осиёи Марказӣ овардааст ва устодони маҳаллӣ онро ба комилияти бебаҳо расонданд. Шашлики асили тоҷикиро танҳо дар ангишти чинор ё гелос мепазанд — онҳо ба гӯшт хушбӯйии махсус мебахшанд.'
  },
  kabob: {
    ru: 'Кабоб — младший брат шашлыка, но не менее почётный. В отличие от шашлыка, где мясо нарезается кусками, для кабоба его мелко рубят и смешивают с луком и зеленью. Это блюдо родилось в горах Таджикистана, где кочевники не имели времени на долгую нарезку мяса. Кабоб на шампуре готовят быстро — 10-15 минут на раскалённых углях. В Памире кабоб подают с особым соусом из дикой мяты и чеснока.',
    en: 'Kabob is the younger brother of shashlik, but no less honorable. Unlike shashlik, where meat is cut into pieces, for kabob it is finely chopped and mixed with onion and herbs. This dish was born in the mountains of Tajikistan, where nomads had no time for long meat cutting. Kabob on skewers is cooked quickly — 10-15 minutes on hot coals. In Pamir, kabob is served with a special sauce of wild mint and garlic.',
    tj: 'Кабоб бародари хурдии шашлик аст, аммо камтар арзанда нест. Баръакси шашлик, ки дар он гӯштро ба қисмҳо мебуранд, барои кабоб онро майда мебуранд ва бо пиёз ва сабзавот омехта мекунанд. Ин хӯрок дар кӯҳҳои Тоҷикистон таваллуд шудааст, ки дар он кӯчманчиён вақт барои буридани дарози гӯшт надоштанд. Кабоб дар сих тез пухта мешавад — 10-15 дақиқа дар ангишти гарм. Дар Помир кабобро бо чакки махсус аз наънои ваҳшӣ ва сир пешкаш мекунанд.'
  },
  samsa: {
    ru: 'Самбуса — гордость таджикской выпечки. Эти хрустящие пирожки с бараниной пекут в тандыре — глиняной печи, которая нагревается до 400°C. Слово "самбуса" происходит от персидского и означает "треугольный". В Самарканде и Бухаре самбусу готовили ещё в X веке, и рецепт дошёл до нас почти без изменений. Настоящий мастер может раскатать тесто так тонко, что через него виден текст газеты.',
    en: 'Sambusa is the pride of Tajik baking. These crispy pastries with lamb are baked in a tandoor — a clay oven heated to 400°C. The word "sambusa" comes from Persian and means "triangular". In Samarkand and Bukhara, sambusa was prepared back in the 10th century, and the recipe has reached us almost unchanged. A real master can roll the dough so thin that newspaper text is visible through it.',
    tj: 'Самбӯса ифтихори нонпазии тоҷик аст. Ин пирожкиҳои хурӯшон бо гӯшти гӯсфанд дар танӯр — танӯри хокистар, ки то 400°C гарм мешавад, пухта мешаванд. Калимаи "самбӯса" аз форсӣ омада ва маънои "секунҷа" дорад. Дар Самарқанду Бухоро самбӯсаро ҳанӯз дар асри X омода мекарданд ва рецепт то мо қариб бе тағйир расид. Устоди асил метавонад хамирро чунон тунук омода кунад, ки матни рӯзнома аз он дида шавад.'
  },
  'oshi-tugrama': {
    ru: 'Оши туграма — суп, который согревает душу. Его название переводится как "суп с кусками" — в него добавляют крупно нарезанную домашнюю лапшу и кусочки нежной говядины. Это блюдо родом из северных районов Таджикистана, где холодные зимы требовали сытной и согревающей еды. В каждом доме рецепт туграмы свой: кто-то добавляет нут, кто-то — репчатый лук, а в Худжанде — обязательно кладут щепотку шафрана.',
    en: 'Oshi tugrama is a soup that warms the soul. Its name translates as "soup with pieces" — it contains coarsely chopped homemade noodles and pieces of tender beef. This dish comes from the northern regions of Tajikistan, where cold winters required hearty and warming food. Every home has its own tugrama recipe: some add chickpeas, some add onion, and in Khujand they always add a pinch of saffron.',
    tj: 'Оши туграма — шӯрбое, ки ҷонро гарм мекунад. Номи он ҳамчун "шӯрбо бо қисмҳо" тарҷума мешавад — дар он ресмони хонагии майда буридашуда ва порчаҳои гӯшти гови нарм илова карда мешавад. Ин хӯрок аз минтақаҳои шимолии Тоҷикистон аст, ки зимистонҳои сард ғизои серғизо ва гармро талаб мекарданд. Дар ҳар хона рецепти туграмаи худро доранд: касе нахуд мерезад, касе пиёз, а дар Хуҷанд ҳатман каме заъфарон мегузоранд.'
  },
  fatir: {
    ru: 'Фатир — хлеб, который стал легендой. Это слоёная лепёшка из тандыра, и её история насчитывает более тысячи лет. В древности фатир пекли кочевые племена — он долго не черствел и легко перевозился. Фатир — основа курутоба, но и сам по себе он прекрасен: хрустящие слои, пропитанные топлёным маслом, тают во рту. В старину фатир пекли только по пятницам — к священному дню.',
    en: 'Fatir is bread that has become a legend. This layered flatbread from the tandoor has a history of more than a thousand years. In ancient times, fatir was baked by nomadic tribes — it stayed fresh for a long time and was easy to transport. Fatir is the base for qurutob, but it is wonderful on its own: crispy layers soaked in ghee melt in your mouth. In the old days, fatir was baked only on Fridays — for the holy day.',
    tj: 'Фатир — нонест, ки ба афсона табдил ёфтааст. Ин нони қабатноки танӯрӣ таърихи зиёда аз ҳазорсола дорад. Дар замонҳои қадим фатирро қабоилаи кӯчманчи меомохтанд — он дер хушк намешуд ва осонтар интиқол дода мешуд. Фатир асоси қурутоб аст, аммо худ ба худ аҷоиб аст: қабатҳои хурӯшон, ки бо равғани обкарда шудаанд, дар даҳон об мешаванд. Дар гузашта фатирро танҳо дар ҷумъаҳо — рӯзи муқаддас, мепухтанд.'
  },
  halisa: {
    ru: 'Халиса — сладкая молитва. Этот тягучий десерт из муки и топлёного масла готовят в ночь перед Наврузом — он символизирует сладость грядущего года. Легенда гласит, что халису впервые приготовили в честь рождения сына правителя, и с тех пор она стала обязательным блюдом праздника. Готовить халису — дело долгое: масло томят 3-4 часа, постоянно помешивая, чтобы достичь идеальной консистенции.',
    en: 'Halisa is a sweet prayer. This stretchy dessert of flour and ghee is prepared on the night before Navruz — it symbolizes the sweetness of the coming year. Legend says that halisa was first prepared in honor of the birth of a ruler\'s son, and since then it has become a mandatory holiday dish. Cooking halisa is a long process: the butter is simmered for 3-4 hours, constantly stirring to achieve the perfect consistency.',
    tj: 'Ҳалиса — дуои ширин. Ин ширинии ғафси орд ва равғанро шаб пеш аз Наврӯз омода мекунанд — он ширинии соли ояндаро рамз мекунад. Мувофиқи афсона, ҳалисаро аввалин бор ба ифтихори таваллуди писари ҳоким пухтаанд ва аз он вақт ин хӯроки ҷашнӣ шуд. Ҳалиса пухтан кори дароз аст: равғанро 3-4 соат мепазанд, пайваста омехта мекунанд, то ба консистенсияи комил расанд.'
  },
  chakka: {
    ru: 'Чакка — живое наследие Памира. Этот густой кисломолочный продукт готовят в глиняных сосудах, которые передаются в семье из поколения в поколение. Чакка — не просто еда, это пробиотик, который помогал горцам выживать в суровых условиях высокогорья. В Горно-Бадахшанской автономной области чакку готовят из молока яков — оно особенно жирное и питательное. Старейшины говорят: "Кто ест чакку каждый день, тот проживёт сто лет".',
    en: 'Chakka is the living heritage of Pamir. This thick fermented milk product is prepared in clay vessels that are passed down in the family from generation to generation. Chakka is not just food, it is a probiotic that helped mountaineers survive in the harsh conditions of the highlands. In the Gorno-Badakhshan Autonomous Region, chakka is made from yak milk — it is especially fatty and nutritious. The elders say: "Whoever eats chakka every day will live a hundred years".',
    tj: 'Чакка — мероси зиндаи Помир. Ин маҳсули ширии ғафс дар зарфҳои хокистар омода карда мешавад, ки дар оила аз насл ба насл мегузаранд. Чакка на танҳо ғизо аст, ин пробиотикест, ки ба кӯҳистонҳо барои зинда мондан дар шароити сахти кӯҳистон кумак кард. Дар ВМКБ чаккаро аз шири яков месозанд — он махсусан равған ва ғизоист. Пиронсолон мегӯянд: "Касе, ки ҳар рӯз чакка мехӯрад, сад сол зиндагӣ мекунад".'
  },
  shirchoy: {
    ru: 'Ширчой — напиток, который согревает сердце. Этот традиционный чай с молоком, маслом и солью придумали пастухи Памира, чтобы согреваться в лютые морозы. Рецепт прост, но в нём есть магия: чёрный чай заваривают крепко, добавляют свежего молока, кусочек сливочного масла и щепотку соли. Пастухи пили ширчой на рассвете, перед долгим днём в горах. Сегодня он — символ таджикского гостеприимства: первым делом хозяин предлагает гостю чашку ширчоя.',
    en: 'Shirchoy is a drink that warms the heart. This traditional tea with milk, butter and salt was invented by Pamir shepherds to keep warm in severe frosts. The recipe is simple but magical: strong black tea is brewed, fresh milk is added, a piece of butter and a pinch of salt. Shepherds drank shirchoy at dawn, before a long day in the mountains. Today it is a symbol of Tajik hospitality: the first thing the host offers a guest is a cup of shirchoy.',
    tj: 'Ширчой — нӯшокие, ки дилро гарм мекунад. Ин чойи анъанавӣ бо шир, равған ва намакро чӯпонони Помир барои гарм шудан дар сармои сахт ихтироъ кардаанд. Рецепт осост, аммо дар он ҷодуест: чойи сиёҳи қавӣ омода мекунанд, шири тару тоза, порчаи равғани зард ва каме намак илова мекунанд. Чӯпонон ширчойро дар субҳ, пеш аз рӯзи дарози кӯҳистон менӯшиданд. Имрӯз он рамзи меҳмоннавозии тоҷикист: аввалин чизе, ки хоҷа ба меҳмон пешниҳод мекунад, ҷомаи ширчой аст.'
  },
  dugob: {
    ru: 'Дугоб — напиток лета и дружбы. Этот освежающий йогуртовый напиток готовят в каждом таджикском доме в знойные летние дни. Название происходит от слов "ду" (два) и "гоб" (пить) — "дважды пить", потому что один стакана мало. Дугоб не только утоляет жажду, но и восстанавливает силы после тяжёлой работы в поле. В старину дугоб разливали в общую чашу — и все гости пили по очереди, что символизировало единство и доверие.',
    en: 'Dugob is the drink of summer and friendship. This refreshing yoghurt drink is prepared in every Tajik home on hot summer days. The name comes from the words "du" (two) and "gob" (drink) — "drink twice", because one glass is not enough. Dugob not only quenches thirst, but also restores strength after hard work in the field. In ancient times, dugob was poured into a common bowl — and all guests drank in turn, symbolizing unity and trust.',
    tj: 'Дугоб — нӯшокии тобистон ва дӯстӣ. Ин нӯшокии хунуки чаккаро дар ҳар хонаи тоҷикӣ дар рӯзҳои гарми тобистон омода мекунанд. Ном аз калимаҳои "ду" (ду) ва "гоб" (нӯшидан) омадааст — "ду маротиба нӯшидан", зеро як стакан кам аст. Дугоб на танҳо ташнагиро мебардорад, балки пас аз кори вазнини саҳро қувват бармегардонад. Дар замонҳои қадим дугобро дар ҷомаи умумӣ мерехтанд — ва ҳамаи меҳмонон навбат менӯшиданд, ки ягонагӣ ва бовариро рамз мекард.'
  }
};

function buildDishRing(){
  const ring = document.getElementById('dishRing');
  if(!ring) return;
  ring.innerHTML = '';
  
  const count = DISHES.length;
  const radiusPercent = 30; // radius from center - dishes stay ON table surface
  
  DISHES.forEach((dish, i) => {
    const angle = (360 / count) * i - 90; // start from top, evenly distributed
    const rad = (angle * Math.PI) / 180;
    
    // Position on table surface using polar coordinates
    const x = 50 + radiusPercent * Math.cos(rad);
    const y = 50 + radiusPercent * Math.sin(rad);
    
    const node = document.createElement('div');
    node.className = 'dish-node';
    node.style.left = '50%';
    node.style.top = '50%';
    
    const inner = document.createElement('div');
    inner.className = 'dish-node__inner';
    inner.dataset.index = i;
    inner.dataset.dishId = dish.id;
    
    // Position using left/top percentages relative to table center
    inner.style.left = x + '%';
    inner.style.top = y + '%';
    inner.style.transform = 'translate(-50%, -50%)';
    
    const imgSrc = dish.img || placeholderDataURI(dish.icon);
    const dishName = dish.name[currentLang] || dish.name.ru;
    
    inner.innerHTML = `
      <div class="dish-plate"><img src="${imgSrc}" alt="${dishName}" loading="lazy"></div>
      <div class="dish-label">${dishName}</div>
    `;
    
    node.appendChild(inner);
    ring.appendChild(node);
  });
  
  // Click handler for dish history
  ring.addEventListener('click', e => {
    const inner = e.target.closest('.dish-node__inner');
    if(inner) {
      openDishHistoryModal(DISHES[+inner.dataset.index].id);
    }
  });
}

function openDishHistoryModal(id) {
  const d = DISHES.find(x => x.id === id);
  if(!d) return;
  
  const dict = I18N[currentLang];
  const history = DISH_HISTORY[id];
  const storyText = history ? (history[currentLang] || history.ru) : (d.desc[currentLang] || d.desc.ru);
  const imgSrc = d.img || placeholderDataURI(d.icon);
  const dishName = d.name[currentLang] || d.name.ru;
  
  const modalBody = document.getElementById('dishModalBody');
  const modal = document.getElementById('dishModal');
  
  modalBody.innerHTML = `
    <div class="dish-history__img">
      <img src="${imgSrc}" alt="${dishName}">
    </div>
    <h2 class="dish-history__title">${dishName}</h2>
    <p class="dish-history__subtitle">${d.price} ${dict.unit} · ${d.cal} ${currentLang === 'en' ? 'kcal' : 'ккал'}</p>
    <div class="dish-history__story">
      <strong>${currentLang === 'en' ? 'The Story' : currentLang === 'tj' ? 'Ҳикоя' : 'История блюда'}</strong><br><br>
      ${storyText}
    </div>
    <div class="dish-history__meta">
      <span>🌿 ${currentLang === 'en' ? 'Ingredients' : currentLang === 'tj' ? 'Маводҳо' : 'Ингредиенты'}: ${d.ingredients[currentLang] || d.ingredients.ru}</span>
    </div>
    <div class="dish-history__actions">
      <button class="btn btn--gold" data-add="${d.id}">${dict.add_cart}</button>
      <button class="btn btn--ghost" data-close="dishModal">${currentLang === 'en' ? 'Close' : currentLang === 'tj' ? 'Пӯшидан' : 'Закрыть'}</button>
    </div>
  `;
  
  // Re-attach add to cart handler
  const addBtn = modalBody.querySelector('[data-add]');
  if(addBtn) {
    addBtn.addEventListener('click', () => {
      addToCart(d.id);
      addBtn.textContent = currentLang === 'en' ? 'Added!' : currentLang === 'tj' ? 'Илова шуд!' : 'Добавлено!';
      addBtn.style.background = 'linear-gradient(135deg, #5a8a3c, #7ab84a)';
      setTimeout(() => {
        addBtn.textContent = dict.add_cart;
        addBtn.style.background = '';
      }, 1500);
    });
  }
  
  // Re-attach close handler
  const closeBtn = modalBody.querySelector('[data-close]');
  if(closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }
  
  modal.classList.add('open');
}

function initTableInteraction(){
  const wrapper = document.getElementById('tableScroll');
  const wheel = document.getElementById('tableWheel');
  const perspective = document.getElementById('tablePerspective');
  
  if(!wrapper || !wheel || !perspective) return;
  
  let mouseX = 0, mouseY = 0, curRotX = 0, curRotY = 0;
  let autoRotation = 0;
  let isAutoRotating = true;
  
  // Mouse tilt effect
  perspective.addEventListener('mousemove', e => {
    const rect = perspective.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width - .5;
    mouseY = (e.clientY - rect.top) / rect.height - .5;
    isAutoRotating = false;
  });
  
  perspective.addEventListener('mouseleave', () => {
    mouseX = 0; 
    mouseY = 0;
    setTimeout(() => { isAutoRotating = true; }, 2000);
  });
  
  // Scroll-based rotation
  let scrollRotation = 0;
  function onScroll(){
    const rect = wrapper.getBoundingClientRect();
    const total = wrapper.offsetHeight - innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const progress = total > 0 ? scrolled / total : 0;
    scrollRotation = progress * 180;
    
    // Progressive reveal
    const nodes = document.querySelectorAll('.dish-node__inner');
    const shown = Math.min(DISHES.length, 2 + Math.floor(progress * (DISHES.length + 2)));
    nodes.forEach((n, i) => n.classList.toggle('show', i < shown));
  }
  
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  
  // Animation loop
  let lastTime = performance.now();
  function raf(now){
    const dt = now - lastTime;
    lastTime = now;
    
    if(isAutoRotating) {
      autoRotation += dt * 0.012;
    }
    
    curRotX += (mouseY * -12 - curRotX) * .05;
    curRotY += (mouseX * 16 - curRotY) * .05;
    
    const totalRot = scrollRotation + autoRotation;
    wheel.style.transform = `rotateX(${curRotX}deg) rotateY(${curRotY}deg) rotateZ(${totalRot}deg)`;
    
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

function rebuildDishLabels(){
  document.querySelectorAll('.dish-node__inner').forEach(inner => {
    const d = DISHES[+inner.dataset.index];
    if(!d) return;
    const label = inner.querySelector('.dish-label');
    if(label) label.textContent = d.name[currentLang] || d.name.ru;
  });
}
/* ---------------------------------------------------------
   6. MENU — render, search, filter, sort
--------------------------------------------------------- */
let activeCat = 'all';
let searchTerm = '';
let sortMode = 'default';

function matchesSearch(dish, term){
  if(!term) return true;
  const hay = [dish.name.ru, dish.name.en, dish.name.tj, dish.id].join(' ').toLowerCase();
  return hay.includes(term.toLowerCase());
}

function renderMenu(){
  const grid = document.getElementById('menuGrid');
  const empty = document.getElementById('menuEmpty');
  if(!grid) return;
  let list = DISHES.filter(d => (activeCat === 'all' || d.cat === activeCat) && matchesSearch(d, searchTerm));
  if(sortMode === 'price-asc') list = list.slice().sort((a,b)=>a.price-b.price);
  if(sortMode === 'price-desc') list = list.slice().sort((a,b)=>b.price-a.price);
  if(sortMode === 'name') list = list.slice().sort((a,b)=> (a.name[currentLang]||a.name.ru).localeCompare(b.name[currentLang]||b.name.ru, 'ru'));

  grid.innerHTML = list.map((d,i)=>{
    const imgSrc = d.img || placeholderDataURI(d.icon);
    const dict = I18N[currentLang];
    return `
    <article class="dish-card" style="animation-delay:${(i%6)*0.06}s">
      <div class="dish-card__img">
        <span class="dish-card__cat">${CATEGORY_LABEL[d.cat][currentLang]}</span>
        <img src="${imgSrc}" alt="${d.name[currentLang]||d.name.ru}" loading="lazy">
      </div>
      <div class="dish-card__body">
        <div class="dish-card__head"><h3>${d.name[currentLang]||d.name.ru}</h3><span class="dish-card__price">${d.price} ${dict.unit}</span></div>
        <p class="dish-card__desc">${d.desc[currentLang]||d.desc.ru}</p>
        <div class="dish-card__meta"><span>🔥 ${d.cal} ${currentLang==='en'?'kcal':'ккал'}</span></div>
        <div class="dish-card__actions">
          <button class="btn btn--gold" data-add="${d.id}">${dict.add_cart}</button>
          <button class="btn btn--ghost" data-details="${d.id}">${dict.details_btn}</button>
        </div>
      </div>
    </article>`;
  }).join('');

  empty.classList.toggle('show', list.length === 0);
}

function initMenuControls(){
  document.getElementById('menuTabs').addEventListener('click', e=>{
    const btn = e.target.closest('.menu-tab');
    if(!btn) return;
    document.querySelectorAll('.menu-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    activeCat = btn.dataset.cat;
    renderMenu();
  });
  document.getElementById('menuSearch').addEventListener('input', e=>{
    searchTerm = e.target.value.trim();
    renderMenu();
  });
  document.getElementById('menuSort').addEventListener('change', e=>{
    sortMode = e.target.value;
    renderMenu();
  });
  document.getElementById('menuGrid').addEventListener('click', e=>{
    const add = e.target.closest('[data-add]');
    const det = e.target.closest('[data-details]');
    if(add) addToCart(add.dataset.add);
    if(det) openDishModal(det.dataset.details);
  });
}

/* ---------------------------------------------------------
   7. DISH DETAIL MODAL
--------------------------------------------------------- */
function openDishModal(id){
  const d = DISHES.find(x=>x.id===id);
  if(!d) return;
  const dict = I18N[currentLang];
  const imgSrc = d.img || placeholderDataURI(d.icon);
  document.getElementById('dishModalBody').innerHTML = `
    <img src="${imgSrc}" alt="${d.name[currentLang]||d.name.ru}" style="width:100%;border-radius:16px;margin-bottom:18px;aspect-ratio:16/10;object-fit:cover;">
    <h2 style="margin-bottom:6px;">${d.name[currentLang]||d.name.ru}</h2>
    <p style="color:var(--gold-light);font-family:var(--font-display);font-size:1.2rem;margin-bottom:14px;">${d.price} ${dict.unit} · 🔥 ${d.cal} ${currentLang==='en'?'kcal':'ккал'}</p>
    <p style="margin-bottom:12px;">${d.desc[currentLang]||d.desc.ru}</p>
    <p style="font-size:.82rem;color:var(--ink-faint);margin-bottom:20px;"><strong style="color:var(--gold);">${currentLang==='en'?'Ingredients':'Ингредиенты'}:</strong> ${d.ingredients[currentLang]||d.ingredients.ru}</p>
    <button class="btn btn--gold btn--wide" data-add="${d.id}">${dict.add_cart}</button>
  `;
  document.getElementById('dishModalBody').querySelector('[data-add]').addEventListener('click', ()=> addToCart(d.id));
  document.getElementById('dishModal').classList.add('open');
}

/* ---------------------------------------------------------
   8. CART (persisted in localStorage)
--------------------------------------------------------- */
let cart = JSON.parse(localStorage.getItem('plovtg_cart') || '[]');

function saveCart(){ localStorage.setItem('plovtg_cart', JSON.stringify(cart)); }

function addToCart(id){
  const existing = cart.find(c=>c.id===id);
  if(existing) existing.qty++;
  else cart.push({ id, qty:1 });
  saveCart(); updateCartUI();
  const btn = document.getElementById('cartBtn');
  btn.animate([{ transform:'scale(1)' },{ transform:'scale(1.25)' },{ transform:'scale(1)' }], { duration:400, easing:'ease-out' });
}
function changeQty(id, delta){
  const item = cart.find(c=>c.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(c=>c.id!==id);
  saveCart(); updateCartUI();
}
function removeFromCart(id){ cart = cart.filter(c=>c.id!==id); saveCart(); updateCartUI(); }

function updateCartUI(){
  const dict = I18N[currentLang];
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmptyMsg');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  let total = 0, count = 0;
  itemsEl.innerHTML = cart.map(c=>{
    const d = DISHES.find(x=>x.id===c.id);
    if(!d) return '';
    total += d.price * c.qty; count += c.qty;
    const imgSrc = d.img || placeholderDataURI(d.icon);
    return `
    <div class="cart-item">
      <img src="${imgSrc}" alt="${d.name[currentLang]||d.name.ru}">
      <div class="cart-item__info">
        <h4>${d.name[currentLang]||d.name.ru}</h4>
        <span class="cart-item__price">${d.price} ${dict.unit}</span>
        <div class="cart-item__qty">
          <button data-dec="${d.id}">−</button><span>${c.qty}</span><button data-inc="${d.id}">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-remove="${d.id}">&times;</button>
    </div>`;
  }).join('');
  emptyEl.classList.toggle('show', cart.length===0);
  countEl.textContent = count;
  totalEl.textContent = `${total} ${dict.unit}`;
}

function initCart(){
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  document.getElementById('cartBtn').addEventListener('click', ()=>{ drawer.classList.add('open'); overlay.classList.add('open'); });
  document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  function closeCart(){ drawer.classList.remove('open'); overlay.classList.remove('open'); }

  document.getElementById('cartItems').addEventListener('click', e=>{
    const inc = e.target.closest('[data-inc]'); const dec = e.target.closest('[data-dec]'); const rm = e.target.closest('[data-remove]');
    if(inc) changeQty(inc.dataset.inc, 1);
    if(dec) changeQty(dec.dataset.dec, -1);
    if(rm) removeFromCart(rm.dataset.remove);
  });

  document.getElementById('checkoutBtn').addEventListener('click', ()=>{
    if(cart.length===0) return;
    closeCart();
    renderOrderSummary();
    document.getElementById('orderModal').classList.add('open');
  });
  updateCartUI();
}

function renderOrderSummary(){
  const dict = I18N[currentLang];
  const el = document.getElementById('orderSummary');
  let total = 0;
  el.innerHTML = cart.map(c=>{
    const d = DISHES.find(x=>x.id===c.id); if(!d) return '';
    total += d.price*c.qty;
    return `<div><span>${d.name[currentLang]||d.name.ru} × ${c.qty}</span><span>${d.price*c.qty} ${dict.unit}</span></div>`;
  }).join('') + `<div style="border-top:1px solid var(--line);margin-top:6px;padding-top:8px;font-weight:700;color:var(--gold-light);"><span>${dict.cart_total}</span><span>${total} ${dict.unit}</span></div>`;
}

/* ---------------------------------------------------------
   9. FORM VALIDATION (order + reservation)
--------------------------------------------------------- */
function validateField(input, testFn){
  const field = input.closest('.field');
  const ok = testFn(input.value.trim());
  field.classList.toggle('invalid', !ok);
  return ok;
}
const isName = v => v.length >= 2;
const isPhone = v => /^[+\d][\d\s\-()]{6,}$/.test(v);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const notEmpty = v => v.length > 0;
const isAddress = v => v.length >= 4;
const isFutureDate = v => { if(!v) return false; const d = new Date(v+'T00:00:00'); const today = new Date(); today.setHours(0,0,0,0); return d >= today; };
const isGuests = v => { const n = Number(v); return n>=1 && n<=50; };

function initReviewForm(){
  const form = document.getElementById('reviewForm');
  if(!form) return;
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const err = document.getElementById('reviewError');
    err.classList.remove('show');
    const okName = validateField(document.getElementById('revName'), isName);
    const okText = validateField(document.getElementById('revText'), v => v.length >= 8);
    if(!(okName && okText)) return;
    try{
      await apiPost('/api/reviews', {
        name: document.getElementById('revName').value.trim(),
        city: document.getElementById('revCity').value.trim(),
        rating: Number(document.getElementById('revRating').value),
        text: document.getElementById('revText').value.trim()
      });
      document.getElementById('reviewSuccess').classList.add('show');
      form.reset();
      setTimeout(()=> document.getElementById('reviewSuccess').classList.remove('show'), 5000);
    }catch(ex){
      err.textContent = ex.message;
      err.classList.add('show');
    }
  });
}

async function loadReviewsFromApi(){
  try{
    const rows = await apiGet('/api/reviews');
    const track = document.getElementById('reviewsTrack');
    if(!track || !rows.length) return;
    track.innerHTML = rows.map(r => `
      <div class="review-card" data-reveal>
        <div class="review-card__stars">${'★'.repeat(r.rating || 5)}</div>
        <p>«${escapeHtml(r.text)}»</p>
        <span>— ${escapeHtml(r.name)}${r.city ? ', ' + escapeHtml(r.city) : ''}</span>
      </div>
    `).join('');
  }catch(_e){
    /* keep static reviews */
  }
}

function initReserveForm(){
  const form = document.getElementById('reserveForm');
  const dateInput = document.getElementById('resDate');
  dateInput.min = new Date().toISOString().split('T')[0];
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const err = document.getElementById('reserveError');
    err.classList.remove('show');
    const okName = validateField(document.getElementById('resName'), isName);
    const okPhone = validateField(document.getElementById('resPhone'), isPhone);
    const okGuests = validateField(document.getElementById('resGuests'), isGuests);
    const okDate = validateField(document.getElementById('resDate'), isFutureDate);
    const okTime = validateField(document.getElementById('resTime'), notEmpty);
    if(!(okName && okPhone && okGuests && okDate && okTime)) return;
    try{
      await apiPost('/api/reservations', {
        name: document.getElementById('resName').value.trim(),
        phone: document.getElementById('resPhone').value.trim(),
        guests: Number(document.getElementById('resGuests').value),
        date: document.getElementById('resDate').value,
        time: document.getElementById('resTime').value,
        comment: document.getElementById('resComment').value.trim()
      });
      document.getElementById('reserveSuccess').classList.add('show');
      form.reset();
      setTimeout(()=> document.getElementById('reserveSuccess').classList.remove('show'), 6000);
    }catch(ex){
      err.textContent = ex.message;
      err.classList.add('show');
    }
  });
}

function initOrderForm(){
  const form = document.getElementById('orderForm');
  const dateInput = document.getElementById('orderDate');
  dateInput.min = new Date().toISOString().split('T')[0];
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const err = document.getElementById('orderError');
    err.classList.remove('show');
    const okName = validateField(document.getElementById('orderName'), isName);
    const okPhone = validateField(document.getElementById('orderPhone'), isPhone);
    const okEmail = validateField(document.getElementById('orderEmail'), isEmail);
    const okAddress = validateField(document.getElementById('orderAddress'), isAddress);
    const okDate = validateField(document.getElementById('orderDate'), isFutureDate);
    const okTime = validateField(document.getElementById('orderTime'), notEmpty);
    if(!(okName && okPhone && okEmail && okAddress && okDate && okTime)) return;
    try{
      const created = await apiPost('/api/orders', {
        name: document.getElementById('orderName').value.trim(),
        phone: document.getElementById('orderPhone').value.trim(),
        email: document.getElementById('orderEmail').value.trim(),
        address: document.getElementById('orderAddress').value.trim(),
        date: document.getElementById('orderDate').value,
        time: document.getElementById('orderTime').value,
        comment: document.getElementById('orderComment').value.trim(),
        items: cart.map(c => ({ id: c.id, qty: c.qty }))
      });
      document.getElementById('orderNum').textContent = created.orderNumber;
      document.getElementById('orderSuccess').classList.add('show');
      cart = []; saveCart(); updateCartUI();
      setTimeout(()=>{
        document.getElementById('orderModal').classList.remove('open');
        document.getElementById('orderSuccess').classList.remove('show');
        form.reset();
      }, 3200);
    }catch(ex){
      err.textContent = ex.message;
      err.classList.add('show');
    }
  });
}

/* ---------------------------------------------------------
   10. MODALS generic close (overlay click / close buttons)
--------------------------------------------------------- */
function initModals(){
  document.querySelectorAll('.modal-close').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.close || btn.closest('.modal-overlay').id;
      document.getElementById(id).classList.remove('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(ov=>{
    ov.addEventListener('click', e=>{ if(e.target === ov) ov.classList.remove('open'); });
  });
}

/* ---------------------------------------------------------
   11. THEME / LANGUAGE / MUSIC / HEADER / NAV / TO-TOP
--------------------------------------------------------- */
function initTheme(){
  const btn = document.getElementById('themeBtn');
  const saved = localStorage.getItem('plovtg_theme');
  if(saved === 'light') document.documentElement.classList.add('theme-light');
  btn.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('theme-light');
    localStorage.setItem('plovtg_theme', document.documentElement.classList.contains('theme-light') ? 'light' : 'dark');
    window.dispatchEvent(new Event('plovtg-theme'));
  });
}

function initLanguage(){
  const btn = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  btn.addEventListener('click', ()=> menu.classList.toggle('open'));
  document.addEventListener('click', e=>{ if(!menu.contains(e.target) && e.target!==btn) menu.classList.remove('open'); });
  menu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      currentLang = b.dataset.lang;
      localStorage.setItem('plovtg_lang', currentLang);
      menu.classList.remove('open');
      applyI18n();
      rebuildDishLabels();
    });
  });
}
function rebuildDishTips(){
  document.querySelectorAll('.dish-node__inner').forEach(inner=>{
    const d = DISHES[+inner.dataset.index];
    const tip = inner.querySelector('.dish-tip');
    tip.innerHTML = `<strong>${d.name[currentLang]||d.name.ru}</strong><span>${d.price} ${I18N[currentLang].unit}</span><p>${(d.desc[currentLang]||d.desc.ru).slice(0,70)}…</p><button class="btn btn--gold" data-add="${d.id}">${I18N[currentLang].add_cart}</button>`;
  });
}

let audioCtx, musicNodes, musicPlaying = false;
function initMusic(){
  const btn = document.getElementById('musicBtn');
  btn.addEventListener('click', ()=>{
    if(!musicPlaying) startAmbientMusic(); else stopAmbientMusic();
    musicPlaying = !musicPlaying;
    btn.classList.toggle('active', musicPlaying);
  });
}
function startAmbientMusic(){
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const master = audioCtx.createGain(); master.gain.value = 0.05; master.connect(audioCtx.destination);
  const notes = [220, 277.18, 329.63]; // warm A minor-ish drone, oud-like
  const oscs = notes.map((f,i)=>{
    const o = audioCtx.createOscillator(); o.type = i===0?'sine':'triangle'; o.frequency.value = f;
    const g = audioCtx.createGain(); g.gain.value = 0;
    o.connect(g); g.connect(master); o.start();
    g.gain.linearRampToValueAtTime(0.5/(i+1), audioCtx.currentTime + 1.4);
    return { o, g };
  });
  musicNodes = { master, oscs };
}
function stopAmbientMusic(){
  if(!musicNodes) return;
  musicNodes.oscs.forEach(({o,g})=>{
    g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + .6);
    setTimeout(()=>o.stop(), 700);
  });
  musicNodes = null;
}

function initHeaderAndNav(){
  const header = document.getElementById('siteHeader');
  addEventListener('scroll', ()=> header.classList.toggle('scrolled', scrollY > 40), { passive:true });
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('mainNav');
  hamburger.addEventListener('click', ()=>{ nav.classList.toggle('open'); hamburger.classList.toggle('open'); });
  nav.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> nav.classList.remove('open')));

  const toTop = document.getElementById('toTopBtn');
  addEventListener('scroll', ()=> toTop.classList.toggle('show', scrollY > 700), { passive:true });
  toTop.addEventListener('click', ()=> scrollTo({ top:0, behavior:'smooth' }));
}

/* ---------------------------------------------------------
   12. SCROLL REVEALS + COUNTERS + BUTTON RIPPLE
--------------------------------------------------------- */
function initReveal(){
  const els = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold:.18 });
  els.forEach(el=> io.observe(el));
}

function initCounters(){
  const counters = document.querySelectorAll('.counter__num');
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target; const target = +el.dataset.count; const dur = 1600; const start = performance.now();
      function tick(now){
        const p = Math.min((now-start)/dur, 1);
        const eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.floor(eased*target).toLocaleString('ru-RU');
        if(p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '80px 0px' });
  counters.forEach(c=> io.observe(c));
}

function initRipple(){
  document.addEventListener('click', e=>{
    const btn = e.target.closest('.btn');
    if(!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = (e.clientX-rect.left)+'px';
    ripple.style.top = (e.clientY-rect.top)+'px';
    ripple.style.width = ripple.style.height = Math.max(rect.width,rect.height)+'px';
    btn.appendChild(ripple);
    setTimeout(()=>ripple.remove(), 650);
  });
}

function initMagnetic(){
  document.querySelectorAll('.magnetic').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) * .18;
      const y = (e.clientY - r.top - r.height/2) * .3;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', ()=> el.style.transform = '');
  });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  await loadMenuFromApi();
  await loadReviewsFromApi();
  window.DISHES = DISHES;
  window.currentLang = currentLang;
  window.openDishHistoryModal = openDishHistoryModal;
  window.addToCart = addToCart;
  initLoader();
  initRegistration();
  initHeroCanvas();
  initMenuControls();
  initCart();
  initReserveForm();
  initOrderForm();
  initReviewForm();
  initModals();
  initTheme();
  initLanguage();
  initMusic();
  initHeaderAndNav();
  initCounters();
  initRipple();
  initMagnetic();
  applyI18n();
  try {
    const tableMod = await import('./table3d.js?v=suzani2');
    await tableMod.initDastarkhan();
    const animMod = await import('./animations.js');
    animMod.initGsapAnimations();
  } catch (err) {
    console.warn('3D / GSAP не загрузились', err);
    initReveal();
  }
});