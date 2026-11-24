// 커뮤니티 단락: 아이의 지능 발달 단계 × 나이대
// 진단명이 없어도 부모가 가장 가까운 곳을 고르는 방식. IQ 범위는 참고용 안내입니다.
const LEVELS = [
  { key: 'observing',  name: '아직 잘 모르겠어요', range: '진단 전, 관찰 중', desc: '검사 전이거나 결과를 기다리는 가정, 느리다고 느끼기 시작한 가정이 모여요.' },
  { key: 'borderline', name: '경계선 지능',       range: 'IQ 약 71~84',     desc: '또래보다 조금 느리지만 일상 대화는 잘 되는 아이들. 학습과 친구 관계 고민이 많아요.' },
  { key: 'mild',       name: '경도 지적장애',     range: 'IQ 약 50~70',     desc: '특수교육, 통합학급, 복지 지원 정보를 함께 나눠요.' },
  { key: 'moderate',   name: '중등도 이상',       range: 'IQ 약 49 이하',   desc: '생활 자립, 치료 기관, 보호자 돌봄 이야기를 나눠요.' },
];

const AGES = [
  { key: 'preschool', name: '미취학' },
  { key: 'lower',     name: '초등 저학년' },
  { key: 'upper',     name: '초등 고학년' },
  { key: 'teen',      name: '중학생 이상' },
];

const isLevel = k => LEVELS.some(l => l.key === k);
const isAge = k => AGES.some(a => a.key === k);

module.exports = { LEVELS, AGES, isLevel, isAge };
