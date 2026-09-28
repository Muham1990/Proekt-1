'use strict';

const MIN_ORDER_AMOUNT = 100;
const CURRENCY = 'TJS';

const PRIZES = [
  { id: 'cash-10', name: '10 сомони', type: 'cash', weight: 20 },
  { id: 'plov', name: 'Плов', type: 'food', image: '/images/rewards/plov.png', weight: 15 },
  { id: 'manti', name: 'Манты', type: 'food', image: '/images/rewards/manti.png', weight: 15 },
  { id: 'sambusa', name: 'Самбуса', type: 'food', image: '/images/rewards/sambusa.png', weight: 15 },
  { id: 'dessert', name: 'Десерт', type: 'food', image: '/images/rewards/dessert.png', weight: 10 },
  { id: 'tea', name: 'Бесплатный чай', type: 'drink', image: '/images/rewards/tea.png', weight: 10 },
  { id: 'dugob', name: 'Дугоб', type: 'drink', image: '/images/rewards/dugob.png', weight: 10 },
  { id: 'discount-15', name: 'Скидка 15%', type: 'discount', weight: 5 }
];

function getPrize(id) {
  return PRIZES.find((p) => p.id === id) || null;
}

function selectReward(randomInt) {
  const total = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let cursor = typeof randomInt === 'function' ? randomInt(total) : Math.floor(Math.random() * total);
  for (const prize of PRIZES) {
    cursor -= prize.weight;
    if (cursor < 0) return prize;
  }
  return PRIZES[PRIZES.length - 1];
}

function publicPrizes() {
  return PRIZES.map(({ id, name, type, image }) => ({ id, name, type, image: image || null }));
}

function publicClaim(row) {
  if (!row) return null;
  const prize = getPrize(row.reward_id);
  return {
    orderId: row.order_id ? String(row.order_id) : null,
    rewardId: row.reward_id,
    rewardName: row.reward_name,
    rewardType: prize?.type || 'food',
    image: prize?.image || null,
    claimId: row.id,
    status: row.status,
    createdAt: row.created_at
  };
}

module.exports = {
  MIN_ORDER_AMOUNT,
  CURRENCY,
  PRIZES,
  getPrize,
  selectReward,
  publicPrizes,
  publicClaim
};
