// 서버와 화면이 함께 쓰는 기준 데이터. Node(require)와 브라우저(window.TT) 양쪽에서 동작.
(function (root, factory) {
  const C = factory();
  if (typeof module === 'object' && module.exports) module.exports = C;
  else root.TT = C;
})(typeof self !== 'undefined' ? self : this, function () {
  const SUBJECTS = [
    { id: 'read', name: '한글·읽기', icon: 'book', bg: '#E8F3FF', fg: '#1B64DA' },
    { id: 'num', name: '수 개념', icon: 'calc', bg: '#FFF0E0', fg: '#B45500' },
    { id: 'social', name: '사회성·감정', icon: 'smile', bg: '#FFF6D6', fg: '#8F6400' },
    { id: 'life', name: '생활기술', icon: 'bus', bg: '#FFEDE8', fg: '#C9401C' },
    { id: 'kor', name: '국어', icon: 'pen', bg: '#E9EEF7', fg: '#2B4A7E' },
    { id: 'math', name: '수학', icon: 'chart', bg: '#E3F5FA', fg: '#08739A' },
    { id: 'eng', name: '영어 기초', icon: 'abc', bg: '#FCE8EC', fg: '#C02A49' },
    { id: 'art', name: '미술·놀이', icon: 'palette', bg: '#F7EEE3', fg: '#8C5310' },
  ];
  const TARGETS = ['유아', '초등 저학년', '초등 고학년', '중학생', '고등학생', '성인'];
  const MODES = { visit: { n: '방문', i: 'door' }, online: { n: '화상', i: 'video' }, center: { n: '센터', i: 'center' } };
  const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
  const TRAITS = ['상황 이해가 어려워요', '감정 표현이 서툴러요', '친구 관계가 힘들어요', '집중 시간이 짧아요', '배우는 데 시간이 오래 걸려요'];
  const TRAIT_ADJ = { '상황 이해가 어려워요': '상황 이해가 어려운', '감정 표현이 서툴러요': '감정 표현이 서툰', '친구 관계가 힘들어요': '친구 관계가 힘든', '집중 시간이 짧아요': '집중 시간이 짧은', '배우는 데 시간이 오래 걸려요': '배우는 데 오래 걸리는' };
  const DAYS = ['월', '화', '수', '목', '금', '토'];
  const HOURS = ['10', '13', '15', '16', '17', '19'];
  const PRICE_MIN = 25000, PRICE_STD = 30000, PRICE_MAX = 40000, TUTOR_SHARE = 0.8;
  const PKGS = [[4, '월 4회', '주 1회'], [8, '월 8회', '주 2회 · 가장 많이 골라요'], [12, '월 12회', '주 3회']];
  const BOARDS = ['전체', '질문', '정보', '모임', '이야기', '선생님께'];
  const DOCS = [['id', '본인 확인'], ['crime', '성범죄·아동학대 경력 조회'], ['report', '개인과외교습자 신고'], ['cert', '자격·경력 증빙']];
  const MOOD = { good: { n: '좋았어요', i: 'smile' }, ok: { n: '보통이에요', i: 'meh' }, hard: { n: '힘들었어요', i: 'frown' } };
  const VOUCHERS = { TURTLE10: 0.1 };

  // 커뮤니티 단락: 아이의 발달 단계 × 나이대 (진단명이 없어도 가장 가까운 곳을 고름, IQ 범위는 참고용)
  const LEVELS = [
    { key: 'observing', name: '아직 잘 모르겠어요', range: '진단 전, 관찰 중', desc: '검사 전이거나 결과를 기다리는 가정, 느리다고 느끼기 시작한 가정이 모여요.' },
    { key: 'borderline', name: '경계선 지능', range: 'IQ 약 71~84', desc: '또래보다 조금 느리지만 일상 대화는 잘 되는 아이들. 학습과 친구 관계 고민이 많아요.' },
    { key: 'mild', name: '경도 지적장애', range: 'IQ 약 50~70', desc: '특수교육, 통합학급, 복지 지원 정보를 함께 나눠요.' },
    { key: 'moderate', name: '중등도 이상', range: 'IQ 약 49 이하', desc: '생활 자립, 치료 기관, 보호자 돌봄 이야기를 나눠요.' },
  ];
  const AGES = [
    { key: 'preschool', name: '미취학' },
    { key: 'lower', name: '초등 저학년' },
    { key: 'upper', name: '초등 고학년' },
    { key: 'teen', name: '중학생 이상' },
  ];

  const LIBCAT = { read: '한글·읽기', num: '수 개념', social: '사회성·감정', life: '생활기술', guide: '부모 가이드', tutor: '튜터 연수', adult: '성인 생활' };
  const LIBART = { read: ['book', '#E8F3FF', '#1B64DA'], num: ['calc', '#FFF0E0', '#B45500'], social: ['smile', '#FFF6D6', '#8F6400'], life: ['bus', '#FFEDE8', '#C9401C'], guide: ['heart', '#FCE8EC', '#C02A49'], tutor: ['sprout', '#E9EEF7', '#2B4A7E'], adult: ['doc', '#E3F5FA', '#08739A'] };

  const CURRICULUM = {
    read: ['좋아하는 그림책 고르기·첫 만남', '받침 없는 낱말 읽기', '짧은 문장 소리 내어 읽기', '읽은 문장 그림으로 다시 말하기', '문장 두 개 이어 읽기', '이야기 순서 카드 맞추기', '한 쪽 끝까지 읽기', '이번 달 한 걸음 돌아보기'],
    num: ['1~10 구슬 세기', '10 묶음 만들기', '동전으로 더하기', '거스름돈 놀이', '시계 정각 읽기', '시계 30분 읽기', '장보기 역할놀이', '이번 달 한 걸음 돌아보기'],
    social: ['오늘 기분 카드', '기다리기 연습', '부탁하는 말 만들기', '거절하는 말 연습', '친구 장면 인형극', '화날 때 쓰는 한 문장', '가족과 함께하는 미션', '이번 달 한 걸음 돌아보기'],
    life: ['우리 동네 지도 그리기', '버스 번호 읽기', '정류장 순서 말하기', '마트 영수증 읽기', '거스름돈 확인', '병원 접수 연습', '혼자 해보기 계획', '이번 달 한 걸음 돌아보기'],
    kor: ['교과서 지문 세 덩어리', '핵심어 3개 찾기', '문단 요약 한 줄', '중심 생각 고르기', '어휘 카드 만들기', '질문 만들기', '짧은 글쓰기', '이번 달 한 걸음 돌아보기'],
    math: ['문제 속 숫자 동그라미', '상황 그림 그리기', '식 세우기', '풀이 말로 설명', '비슷한 문제 바꾸기', '틀린 문제 다시 보기', '단원 미니 평가', '이번 달 한 걸음 돌아보기'],
    eng: ['소리 노래로 열기', '알파벳 5개 손동작', '낱말 5개 듣고 고르기', '따라 말하기 게임', '그림 보고 말하기', '짧은 문장 듣기', '노래 한 곡 완성', '이번 달 한 걸음 돌아보기'],
    art: ['작업 순서 카드 붙이기', '점토로 오늘 기분 만들기', '색 고르기 연습', '그림으로 하루 이야기', '함께 만들기', '끝까지 마치기', '작품 소개하기', '이번 달 한 걸음 돌아보기'],
  };

  // 학원법 시행령 별표 4 기준 환불 비율 (진행 회차 / 전체)
  function refundRate(done, total) {
    if (done <= 0) return 1;
    const r = done / total;
    if (r < 1 / 3) return 2 / 3;
    if (r < 1 / 2) return 1 / 2;
    return 0;
  }

  return { SUBJECTS, TARGETS, MODES, REGIONS, TRAITS, TRAIT_ADJ, DAYS, HOURS, PRICE_MIN, PRICE_STD, PRICE_MAX, TUTOR_SHARE, PKGS, BOARDS, DOCS, MOOD, VOUCHERS, LEVELS, AGES, LIBCAT, LIBART, CURRICULUM, refundRate };
});
