export const rewardConfig = {
  minOrderAmount: 100,
  currency: 'TJS',
  enabled: true,
  storageKey: 'plovtg_reward',
  prizes: [
    {
      id: 'cash-10',
      name: { ru: '10 сомони', en: '10 TJS', tj: '10 сомонӣ' },
      label: { ru: '10 TJS', en: '10 TJS', tj: '10 TJS' },
      type: 'cash',
      icon: '✦',
      colors: ['#3a2a16', '#c4a574'],
      weight: 20
    },
    {
      id: 'plov',
      name: { ru: 'Плов', en: 'Plov', tj: 'Оши палов' },
      label: { ru: 'ПЛОВ', en: 'PLOV', tj: 'ПАЛОВ' },
      type: 'food',
      image: '/images/rewards/plov.png',
      icon: '◉',
      colors: ['#3a1410', '#8a4a32'],
      weight: 15
    },
    {
      id: 'manti',
      name: { ru: 'Манты', en: 'Manti', tj: 'Манту' },
      label: { ru: 'МАНТЫ', en: 'MANTI', tj: 'МАНТУ' },
      type: 'food',
      image: '/images/rewards/manti.png',
      icon: '◉',
      colors: ['#1e2a1a', '#6a7a52'],
      weight: 15
    },
    {
      id: 'sambusa',
      name: { ru: 'Самбуса', en: 'Sambusa', tj: 'Самбӯса' },
      label: { ru: 'САМБУСА', en: 'SAMBUSA', tj: 'САМБӮСА' },
      type: 'food',
      image: '/images/rewards/sambusa.png',
      icon: '◉',
      colors: ['#2c1c10', '#a07040'],
      weight: 15
    },
    {
      id: 'dessert',
      name: { ru: 'Десерт', en: 'Dessert', tj: 'Ширинӣ' },
      label: { ru: 'ДЕСЕРТ', en: 'DESSERT', tj: 'ШИРИНӢ' },
      type: 'food',
      image: '/images/rewards/dessert.png',
      icon: '◉',
      colors: ['#2a1820', '#8a5a68'],
      weight: 10
    },
    {
      id: 'tea',
      name: { ru: 'Бесплатный чай', en: 'Free tea', tj: 'Чой ройгон' },
      label: { ru: 'ЧАЙ', en: 'TEA', tj: 'ЧОЙ' },
      type: 'drink',
      image: '/images/rewards/tea.png',
      icon: '✧',
      colors: ['#1a2228', '#6a7884'],
      weight: 10
    },
    {
      id: 'dugob',
      name: { ru: 'Дугоб', en: 'Dugob', tj: 'Дугоб' },
      label: { ru: 'ДУГОБ', en: 'DUGOB', tj: 'ДУГОБ' },
      type: 'drink',
      image: '/images/rewards/dugob.png',
      icon: '✧',
      colors: ['#142420', '#5a7a70'],
      weight: 10
    },
    {
      id: 'discount-15',
      name: { ru: 'Скидка 15%', en: '15% off', tj: 'Тахфиф 15%' },
      label: { ru: '−15%', en: '−15%', tj: '−15%' },
      type: 'discount',
      icon: '✦',
      colors: ['#2a220c', '#d4b46a'],
      weight: 5
    }
  ]
};

export function prizeName(prize, lang = 'ru') {
  if (!prize) return '';
  if (typeof prize.name === 'string') return prize.name;
  return prize.name[lang] || prize.name.ru || '';
}

export function prizeLabel(prize, lang = 'ru') {
  if (!prize) return '';
  if (typeof prize.label === 'string') return prize.label;
  if (prize.label) return prize.label[lang] || prize.label.ru || prizeName(prize, lang);
  return prizeName(prize, lang);
}

export function findPrize(id) {
  return rewardConfig.prizes.find((p) => p.id === id) || null;
}

export function selectRewardLocal(prizes = rewardConfig.prizes) {
  const total = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  let cursor = Math.random() * total;
  for (const prize of prizes) {
    cursor -= prize.weight;
    if (cursor <= 0) return prize;
  }
  return prizes[prizes.length - 1];
}
