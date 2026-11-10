// 기획서 BM 기준: 학부모 → 플랫폼 수업료 지불, 플랫폼 20% 안전거래 중개수수료, 튜터 80% 지급
const PLATFORM_FEE_RATE = 0.2;

const PLANS = {
  monthly8: { label: '월 8회 정기 수업', sessions: 8, price: 240000 },
  single:   { label: '1회 체험 수업',    sessions: 1, price: 35000 },
};

function quote(planKey) {
  const plan = PLANS[planKey];
  if (!plan) return null;
  const platformFee = Math.round(plan.price * PLATFORM_FEE_RATE);
  return { plan: planKey, ...plan, amount: plan.price, platformFee, tutorPayout: plan.price - platformFee };
}

module.exports = { PLANS, PLATFORM_FEE_RATE, quote };
