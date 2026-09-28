'use strict';

const IMG = (file) => `/images/${file}`;

const DISHES = [
  {
    id: 'plov', cat: 'main', angle: -160, price: 120, cal: 480,
    name: { ru: 'Плов', en: 'Plov', tj: 'Оши палов' },
    desc: {
      ru: 'Классический таджикский плов с бараниной, морковью и нутом, томлённый в казане.',
      en: 'Classic Tajik pilaf with lamb, carrots and chickpeas, slow-cooked in a kazan.',
      tj: 'Оши палави суннатии тоҷикӣ бо гӯшти гӯсфанд.'
    },
    ingredients: {
      ru: 'рис девзира, баранина, морковь, нут, лук, зира',
      en: 'devzira rice, lamb, carrot, chickpeas, onion, cumin',
      tj: 'биринҷ, гӯшт, сабзӣ, нахуд, пиёз, зира'
    },
    history: {
      ru: 'Плов — символ таджикского гостеприимства. По легенде первый плов приготовил Тамерлан, чтобы накормить армию. В Таджикистане его готовят в казане на открытом огне с рисом девзира.',
      en: 'Plov is a symbol of Tajik hospitality. Legend says Tamerlane first cooked it to feed his army. In Tajikistan it is made in a kazan over an open fire with devzira rice.',
      tj: 'Оши палов рамзи меҳмоннавозии тоҷик аст. Мувофиқи афсона Темур онро барои лашкар пухтааст.'
    },
    img: IMG('rewards/plov.png')
  },
  {
    id: 'manti', cat: 'main', angle: -128, price: 85, cal: 420,
    name: { ru: 'Манты', en: 'Manti', tj: 'Манту' },
    desc: {
      ru: 'Нежные манты с сочной бараниной и ароматным луком, подаются со сметаной.',
      en: 'Tender steamed dumplings with juicy lamb and onion, served with sour cream.',
      tj: 'Манти нарм бо гӯшти гӯсфанд ва пиёз.'
    },
    ingredients: {
      ru: 'тесто, баранина, лук, чёрный перец, сметана',
      en: 'dough, lamb, onion, black pepper, sour cream',
      tj: 'хамир, гӯшт, пиёз, қаламфур'
    },
    history: {
      ru: 'Манты пришли по Великому шёлковому пути и считались праздничным блюдом — на свадьбах и Наврузе.',
      en: 'Manti arrived along the Silk Road and were a festive dish for weddings and Navruz.',
      tj: 'Манту тавассути Роҳи Абрешим омада, хӯроки идона ҳисобида мешуд.'
    },
    img: IMG('rewards/manti.png')
  },
  {
    id: 'kurutob', cat: 'main', angle: -96, price: 65, cal: 390,
    name: { ru: 'Курутоб', en: 'Qurutob', tj: 'Қурутоб' },
    desc: {
      ru: 'Национальное блюдо из слоёного хлеба фатир с курутом, помидорами и луком.',
      en: 'National dish of layered fatir bread with qurut, tomatoes and onion.',
      tj: 'Хӯроки миллӣ аз фатир бо қурут ва помидор.'
    },
    ingredients: {
      ru: 'фатир, курут, помидоры, лук, зелень, льняное масло',
      en: 'fatir bread, qurut, tomato, onion, herbs, linseed oil',
      tj: 'фатир, қурут, помидор, пиёз, сабзавот'
    },
    history: {
      ru: 'Курутоб — национальное достояние Таджикистана. Название от «курут» и «об». Когда-то это была еда кочевников.',
      en: 'Qurutob is Tajikistan’s national treasure. The name comes from qurut and ob. It was once nomad food.',
      tj: 'Қурутоб ганҷи миллии Тоҷикистон аст. Ном аз «қурут» ва «об» омадааст.'
    },
    img: IMG('rewards/qurutob.png')
  },
  {
    id: 'shashlik', cat: 'grill', angle: -64, price: 140, cal: 520,
    name: { ru: 'Шашлык', en: 'Shashlik', tj: 'Шашлик' },
    desc: {
      ru: 'Сочные кусочки баранины, маринованные в специях и обжаренные на углях.',
      en: 'Juicy lamb chunks marinated in spices, grilled over charcoal.',
      tj: 'Порчаҳои гӯшти гӯсфанд, дар ангишт бирён карда шуда.'
    },
    ingredients: {
      ru: 'баранина, лук, зира, красный перец, уксус',
      en: 'lamb, onion, cumin, red pepper, vinegar',
      tj: 'гӯшт, пиёз, зира, қаламфури сурх'
    },
    history: {
      ru: 'Секрет таджикского шашлыка — маринад из лука, зиры и гранатового сока. Готовят на углях грецкого ореха или вишни.',
      en: 'The secret is a marinade of onion, cumin and pomegranate juice, grilled on walnut or cherry coals.',
      tj: 'Сирри шашлик дар маринад аз пиёз, зира ва шарбати анор аст.'
    },
    img: IMG('resto-navruz.jpg')
  },
  {
    id: 'kabob', cat: 'grill', angle: -32, price: 110, cal: 470,
    name: { ru: 'Кабоб', en: 'Kabob', tj: 'Кабоб' },
    desc: {
      ru: 'Рубленое мясо на шампуре с луком и специями, обжаренное на открытом огне.',
      en: 'Minced meat skewers with onion and spices, grilled over open fire.',
      tj: 'Гӯшти қима дар сих бо пиёз ва ҳанут.'
    },
    ingredients: {
      ru: 'говядина, баранина, лук, кориандр, зира',
      en: 'beef, lamb, onion, coriander, cumin',
      tj: 'гӯшти гов, пиёз, кашнич, зира'
    },
    history: {
      ru: 'Кабоб родился в горах Таджикистана: мясо рубят и быстро жарят 10–15 минут на углях.',
      en: 'Kabob was born in the Tajik mountains: minced meat grilled quickly for 10–15 minutes.',
      tj: 'Кабоб дар кӯҳҳои Тоҷикистон таваллуд шудааст ва тез дар ангишт пухта мешавад.'
    },
    img: IMG('resto-vip.jpg')
  },
  {
    id: 'samsa', cat: 'bakery', angle: 0, price: 25, cal: 310,
    name: { ru: 'Самбуса', en: 'Sambusa', tj: 'Самбӯса' },
    desc: {
      ru: 'Слоёные пирожки с бараниной и луком, запечённые в тандыре.',
      en: 'Flaky pastry filled with lamb and onion, baked in a tandoor.',
      tj: 'Самбӯсаи қабатнок бо гӯшт ва пиёз аз танӯр.'
    },
    ingredients: {
      ru: 'слоёное тесто, баранина, лук, зира',
      en: 'puff pastry, lamb, onion, cumin',
      tj: 'хамир, гӯшт, пиёз, зира'
    },
    history: {
      ru: 'Самбусу пекут в тандыре при 400°C. Рецепт из Самарканда и Бухары дошёл почти без изменений с X века.',
      en: 'Sambusa is baked in a tandoor at 400°C. The Samarkand–Bukhara recipe dates back to the 10th century.',
      tj: 'Самбӯсаро дар танӯр дар 400°C мепазанд. Рецепт аз асри X омадааст.'
    },
    img: IMG('rewards/sambusa.png')
  },
  {
    id: 'oshi-tugrama', cat: 'soup', angle: 32, price: 70, cal: 340,
    name: { ru: 'Оши Туграма', en: 'Oshi Tugrama', tj: 'Оши туграма' },
    desc: {
      ru: 'Наваристый суп с домашней лапшой, говядиной и овощами.',
      en: 'Rich soup with hand-cut noodles, beef and vegetables.',
      tj: 'Шӯрбои бой бо равған, гӯшт ва сабзавот.'
    },
    ingredients: {
      ru: 'лапша, говядина, нут, картофель, зелень',
      en: 'noodles, beef, chickpeas, potato, herbs',
      tj: 'ресмон, гӯшт, нахуд, картошка'
    },
    history: {
      ru: 'Оши туграма — суп севера Таджикистана. В Худжанде в него кладут щепотку шафрана.',
      en: 'Oshi tugrama is a northern Tajik soup. In Khujand a pinch of saffron is added.',
      tj: 'Оши туграма шӯрбои шимоли Тоҷикистон аст. Дар Хуҷанд заъфарон мегузоранд.'
    },
    img: IMG('resto-interior.jpg')
  },
  {
    id: 'fatir', cat: 'bakery', angle: 64, price: 20, cal: 260,
    name: { ru: 'Фатир', en: 'Fatir', tj: 'Фатир' },
    desc: {
      ru: 'Слоёная лепёшка из тандыра — основа для курутоба и самостоятельная закуска.',
      en: 'Layered tandoor flatbread — the base for qurutob and a snack on its own.',
      tj: 'Нони қабатноки танӯрӣ.'
    },
    ingredients: {
      ru: 'мука, вода, масло, соль',
      en: 'flour, water, oil, salt',
      tj: 'орд, об, равған, намак'
    },
    history: {
      ru: 'Фатир пекли кочевые племена — он долго не черствел. В старину его готовили по пятницам.',
      en: 'Nomadic tribes baked fatir because it stayed fresh. In the old days it was made on Fridays.',
      tj: 'Фатирро қабоилаи кӯчманчӣ мепухт — он дер хушк намешуд.'
    },
    img: IMG('rewards/sambusa.png')
  },
  {
    id: 'halisa', cat: 'dessert', angle: 96, price: 35, cal: 410, icon: 'dessert',
    name: { ru: 'Халиса', en: 'Halisa', tj: 'Ҳалиса' },
    desc: {
      ru: 'Тягучий десерт из муки и топлёного масла с сахарным сиропом.',
      en: 'A silky flour-and-ghee dessert finished with sugar syrup.',
      tj: 'Ширинии орд бо равған ва шарбати шакар.'
    },
    ingredients: {
      ru: 'мука, топлёное масло, сахарный сироп, орехи',
      en: 'flour, ghee, sugar syrup, nuts',
      tj: 'орд, равған, шарбат, чормағз'
    },
    history: {
      ru: 'Халису готовят в ночь перед Наврузом — она символизирует сладость нового года.',
      en: 'Halisa is cooked on the night before Navruz and stands for the sweetness of the new year.',
      tj: 'Ҳалисаро шаб пеш аз Наврӯз омода мекунанд — рамзи ширинии соли нав.'
    },
    img: IMG('rewards/dessert.png')
  },
  {
    id: 'chakka', cat: 'drink', angle: 128, price: 18, cal: 90,
    name: { ru: 'Чакка', en: 'Chakka', tj: 'Чакка' },
    desc: {
      ru: 'Густой кисломолочный продукт — таджикская версия густого йогурта.',
      en: 'Thick strained yoghurt — the Tajik take on cultured dairy.',
      tj: 'Маҳсули ширии ғафс.'
    },
    ingredients: {
      ru: 'молоко, закваска, соль',
      en: 'milk, culture, salt',
      tj: 'шир, хамиртуруш, намак'
    },
    history: {
      ru: 'Чакка — наследие Памира. В ГБАО её делают из молока яков. Старейшины говорят: кто ест чакку каждый день, проживёт сто лет.',
      en: 'Chakka is Pamir heritage. In GBAO it is made from yak milk. Elders say daily chakka brings a hundred years of life.',
      tj: 'Чакка мероси Помир аст. Дар ВМКБ онро аз шири як месозанд.'
    },
    img: IMG('rewards/dugob.png')
  },
  {
    id: 'shirchoy', cat: 'drink', angle: 160, price: 22, cal: 140, icon: 'tea',
    name: { ru: 'Ширчой', en: 'Shirchoy', tj: 'Ширчой' },
    desc: {
      ru: 'Традиционный чай с молоком, маслом и щепоткой соли — тёплый завтрак Памира.',
      en: 'Traditional milk tea with butter and a pinch of salt — a warm Pamir breakfast.',
      tj: 'Чойи анъанавӣ бо шир ва равған.'
    },
    ingredients: {
      ru: 'чёрный чай, молоко, масло, соль',
      en: 'black tea, milk, butter, salt',
      tj: 'чойи сиёҳ, шир, равған, намак'
    },
    history: {
      ru: 'Ширчой придумали пастухи Памира, чтобы согреваться в мороз. Это первый напиток, который хозяин предлагает гостю.',
      en: 'Pamir shepherds invented shirchoy to stay warm. It is the first drink a host offers a guest.',
      tj: 'Ширчойро чӯпонони Помир ихтироъ кардаанд. Ин аввалин нӯшокиест, ки хоҷа ба меҳмон медиҳад.'
    },
    img: IMG('rewards/tea.png')
  },
  {
    id: 'dugob', cat: 'drink', angle: 192, price: 15, cal: 70,
    name: { ru: 'Дугоб', en: 'Dugob', tj: 'Дугоб' },
    desc: {
      ru: 'Освежающий йогуртовый напиток с холодной водой и мятой.',
      en: 'Refreshing chilled yoghurt drink with mint.',
      tj: 'Нӯшокии хунуки чакка бо об ва наъно.'
    },
    ingredients: {
      ru: 'йогурт, вода, мята, соль',
      en: 'yoghurt, water, mint, salt',
      tj: 'чакка, об, наъно, намак'
    },
    history: {
      ru: 'Дугоб — напиток лета. Название значит «пить дважды»: одного стакана мало. Раньше его пили из общей чаши.',
      en: 'Dugob is a summer drink. The name means “drink twice” — one glass is never enough.',
      tj: 'Дугоб нӯшокии тобистон аст. Ном маънои «ду бор нӯшидан»-ро дорад.'
    },
    img: IMG('rewards/dugob.png')
  },
  {
    id: 'shurpa', cat: 'soup', angle: 224, price: 55, cal: 280,
    name: { ru: 'Шурпа', en: 'Shurpa', tj: 'Шӯрбо' },
    desc: {
      ru: 'Наваристый бульон с бараниной, нутом и овощами — первое блюдо дастархана.',
      en: 'Rich lamb broth with chickpeas and vegetables — the first course of the dastarkhan.',
      tj: 'Шӯрбо бо гӯшти гӯсфанд, нахуд ва сабзавот.'
    },
    ingredients: {
      ru: 'баранина, нут, морковь, картофель, лук, зелень',
      en: 'lamb, chickpeas, carrot, potato, onion, herbs',
      tj: 'гӯшт, нахуд, сабзӣ, картошка, пиёз'
    },
    history: {
      ru: 'Шурпу варят часами в казане. В Таджикистане её ставят на стол первой, чтобы гость согрелся перед пловом.',
      en: 'Shurpa simmers for hours in a kazan and is served first so the guest warms up before plov.',
      tj: 'Шӯрбо дар дег соатҳо ҷӯшонида мешавад ва аввал пешкаш мегардад.'
    },
    img: IMG('resto-dastarkhan.jpg')
  },
  {
    id: 'lagman', cat: 'soup', angle: 256, price: 68, cal: 360,
    name: { ru: 'Лагман', en: 'Lagman', tj: 'Лағмон' },
    desc: {
      ru: 'Домашняя лапша в мясном соусе с перцем, редькой и зеленью.',
      en: 'Hand-pulled noodles in a meat sauce with pepper, radish and herbs.',
      tj: 'Ресмони дастӣ бо гӯшт, қаламфур ва сабзавот.'
    },
    ingredients: {
      ru: 'лапша, говядина, перец, редька, лук, чеснок',
      en: 'noodles, beef, pepper, radish, onion, garlic',
      tj: 'ресмон, гӯшт, қаламфур, турб, пиёз'
    },
    history: {
      ru: 'Лагман пришёл по Шёлковому пути. В Худжанде тесто тянут вручную — от этого зависит «душа» блюда.',
      en: 'Lagman travelled the Silk Road. In Khujand the dough is pulled by hand — that is the soul of the dish.',
      tj: 'Лағмон тавассути Роҳи Абрешим омадааст. Дар Хуҷанд хамирро бо даст мекашанд.'
    },
    img: IMG('resto-interior.jpg')
  },
  {
    id: 'mastava', cat: 'soup', angle: 288, price: 58, cal: 310,
    name: { ru: 'Мастава', en: 'Mastava', tj: 'Мастоба' },
    desc: {
      ru: 'Густой рисовый суп с говядиной, морковью и томатами.',
      en: 'Hearty rice soup with beef, carrots and tomatoes.',
      tj: 'Шӯрбои ғафси биринҷ бо гӯшт ва сабзӣ.'
    },
    ingredients: {
      ru: 'рис, говядина, морковь, томаты, зира, зелень',
      en: 'rice, beef, carrot, tomato, cumin, herbs',
      tj: 'биринҷ, гӯшт, сабзӣ, помидор, зира'
    },
    history: {
      ru: 'Мастава — «плов, который стал супом». Её готовили, когда риса было мало, а гостей — много.',
      en: 'Mastava is “plov that became soup”, cooked when rice was scarce and guests were many.',
      tj: 'Мастоба — оши палове, ки шӯрбо шуд. Вақте биринҷ кам ва меҳмон зиёд буд, мепухтанд.'
    },
    img: IMG('resto-ceiling.jpg')
  },
  {
    id: 'dimlama', cat: 'main', angle: 320, price: 95, cal: 430,
    name: { ru: 'Димлама', en: 'Dimlama', tj: 'Димлама' },
    desc: {
      ru: 'Томлёные слои мяса и овощей в казане — сок остаётся в блюде.',
      en: 'Slow-stewed layers of meat and vegetables in a kazan, juices kept in the pot.',
      tj: 'Қабатҳои гӯшт ва сабзавот дар дег оҳиста пухта мешаванд.'
    },
    ingredients: {
      ru: 'баранина, картофель, капуста, морковь, перец, зира',
      en: 'lamb, potato, cabbage, carrot, pepper, cumin',
      tj: 'гӯшт, картошка, карам, сабзӣ, қаламфур'
    },
    history: {
      ru: 'Димламу не мешают: каждый слой отдаёт вкус следующему. Так готовили в кишлаках на весь день.',
      en: 'Dimlama is never stirred: each layer feeds the next. Village cooks left it for the whole day.',
      tj: 'Димламаро намеомезанд: ҳар қабат ба қабати баъдӣ таъм медиҳад.'
    },
    img: IMG('resto-vip.jpg')
  },
  {
    id: 'jiz', cat: 'grill', angle: 352, price: 155, cal: 560,
    name: { ru: 'Жиз', en: 'Jiz', tj: 'Ҷиз' },
    desc: {
      ru: 'Баранина, обжаренная в собственном жире до хрустящей корочки.',
      en: 'Lamb fried in its own fat until the crust is crisp.',
      tj: 'Гӯшти гӯсфанд дар равғани худ то қишри хушк бирён.'
    },
    ingredients: {
      ru: 'баранина, курдюк, лук, зира, соль',
      en: 'lamb, fat tail, onion, cumin, salt',
      tj: 'гӯшт, думба, пиёз, зира, намак'
    },
    history: {
      ru: 'Жиз — блюдо гор и чабанов. Его едят горячим, с луком и свежим ноном — без соусов.',
      en: 'Jiz is mountain shepherds’ food. It is eaten hot with onion and fresh non — no sauces.',
      tj: 'Ҷиз хӯроки кӯҳистон ва чӯпонон аст. Онро гарм бо пиёз ва нони тару тоза мехӯранд.'
    },
    img: IMG('resto-navruz.jpg')
  },
  {
    id: 'naryn', cat: 'main', angle: 384, price: 80, cal: 390,
    name: { ru: 'Нарын', en: 'Naryn', tj: 'Норин' },
    desc: {
      ru: 'Тонкая домашняя лапша с отварной кониной или говядиной и луком.',
      en: 'Fine homemade noodles with boiled beef or horse meat and onion.',
      tj: 'Ресмони тунук бо гӯшти ҷӯшонда ва пиёз.'
    },
    ingredients: {
      ru: 'лапша, говядина, лук, чёрный перец, бульон',
      en: 'noodles, beef, onion, black pepper, broth',
      tj: 'ресмон, гӯшт, пиёз, қаламфур, шӯрбо'
    },
    history: {
      ru: 'Нарын режут очень тонко — мастерство повара видно по ширине ленты. Праздничное блюдо севера.',
      en: 'Naryn is sliced very thin — the cook’s skill shows in the ribbon. A northern feast dish.',
      tj: 'Норинро хеле тунук мебуранд — ҳунари ошпаз аз паҳнои лента дида мешавад.'
    },
    img: IMG('resto-dastarkhan.jpg')
  },
  {
    id: 'nisholda', cat: 'dessert', angle: 416, price: 28, cal: 220, icon: 'dessert',
    name: { ru: 'Нишолда', en: 'Nisholda', tj: 'Нишолда' },
    desc: {
      ru: 'Воздушный белковый десерт с сахаром — сладость Навруза.',
      en: 'An airy egg-white and sugar sweet — the taste of Navruz.',
      tj: 'Ширинии сафеда ва шакар — таъми Наврӯз.'
    },
    ingredients: {
      ru: 'яичный белок, сахар, корень мыльнянки, лимон',
      en: 'egg white, sugar, soapwort root, lemon',
      tj: 'сафеда, шакар, решаи сабун, лимӯ'
    },
    history: {
      ru: 'Нишолду взбивают часами перед Наврузом. Белая шапка на столе — пожелание светлого года.',
      en: 'Nisholda is whisked for hours before Navruz. The white peak on the table wishes a bright year.',
      tj: 'Нишолдаро пеш аз Наврӯз соатҳо мезананд. Куллаи сафед орзуи соли равшан аст.'
    },
    img: IMG('rewards/dessert.png')
  },
  {
    id: 'sumalak', cat: 'dessert', angle: 448, price: 32, cal: 240, icon: 'dessert',
    name: { ru: 'Сумаляк', en: 'Sumalak', tj: 'Сумалак' },
    desc: {
      ru: 'Ритуальное блюдо Навруза из пророщенной пшеницы, томлённое всю ночь.',
      en: 'A Navruz ritual dish of sprouted wheat, simmered through the night.',
      tj: 'Хӯроки маросимии Наврӯз аз гандуми сабзида, шаб то субҳ пухта.'
    },
    ingredients: {
      ru: 'пророщенная пшеница, мука, масло, грецкие орехи',
      en: 'sprouted wheat, flour, oil, walnuts',
      tj: 'гандуми сабзида, орд, равған, чормағз'
    },
    history: {
      ru: 'Сумаляк варят всю ночь хором, с песнями. Кто мешает котёл — тому год будет сладким.',
      en: 'Sumalak is cooked all night together, with songs. Whoever stirs the pot is promised a sweet year.',
      tj: 'Сумалакро шаб то субҳ бо суруд мепазанд. Касе дегро омезад, солаш ширин мешавад.'
    },
    img: IMG('resto-navruz.jpg')
  },
  {
    id: 'non', cat: 'bakery', angle: 480, price: 12, cal: 210,
    name: { ru: 'Нон тандырный', en: 'Tandoor non', tj: 'Нони танӯрӣ' },
    desc: {
      ru: 'Круглая лепёшка из тандыра с узором чекича — хлеб к каждому дастархану.',
      en: 'Round tandoor bread stamped with a chekich pattern — bread for every table.',
      tj: 'Нони гирдаи танӯрӣ бо нақши чекич — нони ҳар дастархон.'
    },
    ingredients: {
      ru: 'мука, вода, дрожжи, кунжут, соль',
      en: 'flour, water, yeast, sesame, salt',
      tj: 'орд, об, хамиртуруш, кунҷит, намак'
    },
    history: {
      ru: 'Нон не режут ножом и не кладут «лицом» вниз — к хлебу в Таджикистане особое почтение.',
      en: 'Non is not cut with a knife and never laid face-down — bread is treated with respect.',
      tj: 'Нони тоҷикиро бо корд намебуранд ва рӯйро поён намегузоранд — эҳтироми нон бузург аст.'
    },
    img: IMG('rewards/sambusa.png')
  },
  {
    id: 'kompot', cat: 'drink', angle: 512, price: 16, cal: 90,
    name: { ru: 'Компот из сухофруктов', en: 'Dried-fruit kompot', tj: 'Компоти меваи хушк' },
    desc: {
      ru: 'Отвар из урюка, изюма и яблок — домашний напиток к плову.',
      en: 'A broth of dried apricot, raisins and apple — the house drink with plov.',
      tj: 'Нӯшокии зардолу, мавиз ва себ — нӯшокии хонагӣ ба оши палов.'
    },
    ingredients: {
      ru: 'урюк, изюм, яблоко, сахар, вода',
      en: 'dried apricot, raisins, apple, sugar, water',
      tj: 'зардолу, мавиз, себ, шакар, об'
    },
    history: {
      ru: 'Компот ставят на дастархан вместо газировки. Сухофрукты Памира и Худжанда отдают сладость без резкости.',
      en: 'Kompot is served instead of soda. Pamir and Khujand dried fruit give sweetness without sharpness.',
      tj: 'Компотро ба ҷои нӯшокии газдор мегузоранд. Меваи хушки Помиру Хуҷанд ширинии нарм медиҳад.'
    },
    img: IMG('rewards/tea.png')
  }
];

const REVIEWS = [
  {
    name: 'Далер',
    city: 'Душанбе',
    rating: 5,
    text: 'Плов точно такой, каким его готовила бабушка в Худжанде. Давно не пробовал ничего настолько настоящего.'
  },
  {
    name: 'Мадина К.',
    city: 'Душанбе',
    rating: 5,
    text: 'Курутоб — просто восторг, а атмосфера зала с резным деревом переносит прямо в чайхану на Рудаки.'
  },
  {
    name: 'Фирдавс',
    city: 'компания «Сомон»',
    rating: 5,
    text: 'Заказывали банкет на 25 человек в VIP-зале — сервис и шашлык на высшем уровне.'
  }
];

module.exports = { DISHES, REVIEWS };
