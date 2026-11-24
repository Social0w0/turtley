// 터틀리 앱 (클릭형 프로토타입의 23개 화면을 서버 API에 연결한 버전)
// 화면 구성·문구는 공유받은 시안을 따르고, 데이터는 /api 에서 읽고 저장합니다.
(() => {
'use strict';
const { SUBJECTS, TARGETS, MODES, REGIONS, TRAITS, DAYS, HOURS, PRICE_MIN, PRICE_STD, PRICE_MAX, TUTOR_SHARE, PKGS, BOARDS, DOCS, LEVELS, AGES, LIBCAT, LIBART, CURRICULUM, refundRate } = window.TT;
const SUBJ = Object.fromEntries(SUBJECTS.map(s => [s.id, s]));

/* ===================== 아이콘 ===================== */
const IC = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5h4v5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.2-4.2"/>',
  filter: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M17.5 14.2A6.5 6.5 0 0 1 21.5 20"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  chat: '<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-4.4A8.5 8.5 0 1 1 20.5 12z"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8 2.5 8h-17S6 15.5 6 9"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevR: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  chevL: '<path d="M15 5 8 12l7 7"/>',
  chevD: '<path d="m6 9.5 6 6 6-6"/>',
  video: '<rect x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path d="m15.5 10.5 5-3v9l-5-3"/>',
  door: '<path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21"/><path d="M3 21h18M14.5 12h.01"/>',
  center: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8.5 7.5h2M13.5 7.5h2M8.5 11.5h2M13.5 11.5h2M10 21v-4h4v4"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h4"/>',
  bank: '<path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>',
  zap: '<path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6z"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  vol: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5M9 13h6M9 16.5h4"/>',
  upload: '<path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15v4.5h15V15"/>',
  pen: '<path d="M4 20h4.5L19.5 9 15 4.5 4 15.5z"/><path d="m13.5 6 4.5 4.5"/>',
  chart: '<path d="M4 20h16"/><path d="m5.5 15.5 4-4.5 3.5 3 5.5-6.5"/>',
  sprout: '<path d="M12 21v-8.5"/><path d="M12 12.5C12 8.5 9 6 4.5 6c0 4 3 6.5 7.5 6.5zM12 11c0-3.5 2.6-5.8 6.5-5.8 0 3.5-2.6 5.8-6.5 5.8z"/>',
  flag: '<path d="M5.5 21V4h11l-2.2 4.2L16.5 12.5h-11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M5 12 20 4.5 15 20l-3-6.5z"/><path d="m12 13.5 8-9"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.2 4.2 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  meh: '<circle cx="12" cy="12" r="9"/><path d="M8.5 15h7M9 9.5h.01M15 9.5h.01"/>',
  frown: '<circle cx="12" cy="12" r="9"/><path d="M8.5 16.2a4.2 4.2 0 0 1 7 0M9 9.5h.01M15 9.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h3.5"/>',
  abc: '<path d="M4 18 7.5 7l3.5 11M5.2 14.5h4.6"/><path d="M14 7v11h3a2.6 2.6 0 0 0 0-5.3h-3M14 12.7h2.6a2.8 2.8 0 0 0 0-5.7H14"/>',
  palette: '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 1.8-1 1.3-2-.6-1.1 0-2.3 1.3-2.3H17a4 4 0 0 0 4-4C21 7.1 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7.2" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  bus: '<rect x="4.5" y="3.5" width="15" height="14" rx="3"/><path d="M4.5 11h15M8 17.5V20M16 17.5V20M8 14.5h.01M16 14.5h.01"/>',
  doc: '<path d="M7 3.5h7.5L18.5 7.5V20a.5.5 0 0 1-.5.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M9 11h6.5M9 14.5h6.5M9 18h4"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  text: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  receipt: '<path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.2z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
  apply: '<path d="M15.5 4.5h2A1.5 1.5 0 0 1 19 6v13.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V6a1.5 1.5 0 0 1 1.5-1.5h2"/><rect x="8.5" y="3" width="7" height="3.5" rx="1"/><path d="m9 13.5 2 2 4-4.5"/>',
  wallet: '<path d="M4 7.5V18a2 2 0 0 0 2 2h14V9.5H6a2 2 0 0 1-2-2zM4 7.5A2 2 0 0 1 6 5.5h11V9.5"/><path d="M16.5 14.5h.01"/>',
  star: '<path d="m12 3.5 2.6 5.5 6 .7-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.7l6-.7z"/>',
  report: '<path d="M5 20.5V4.5A1.5 1.5 0 0 1 6.5 3H15l4 4v13.5"/><path d="M8.5 16v-3M12 16V9.5M15.5 16v-5"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.6-4.5L3.5 9M4 13a8 8 0 0 0 14.6 4.5l1.9-2.5"/><path d="M3.5 4v5h5M20.5 20v-5h-5"/>',
};
const ic = (n, s = 22, w = 1.8) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;
const MOOD = { good: { n: '좋았어요', i: 'smile', c: 'var(--tint)' }, ok: { n: '보통이에요', i: 'meh', c: 'var(--orange)' }, hard: { n: '힘들었어요', i: 'frown', c: 'var(--red)' } };
const TURTLE = '/img/turtle.webp', TURTLE_SM = '/img/turtle-sm.webp', WORDMARK = '/img/wordmark.webp';

/* ===================== 화면별 설계 노트 (오른쪽 패널) ===================== */
const NOTES = {
  welcome: { k: '첫 화면', h: '세 개의 버튼, 한 가지 약속', lead: '처음 온 보호자가 3초 안에 무엇을 하는 곳인지 알게 만들어요.', nums: [['13.59%', '경계선지능 추정 비율'], ['약 697만', '전국 추정 인원']], b: ['<b>시작하기 · 로그인 · 둘러보기</b> 세 버튼만 둬요', '둘러보기는 로그인 없이 끝까지 — 예약·채팅 순간에만 로그인 요청', '발표자료 손글씨로 <b>“느려도 끝까지”</b> 응원 문구를 고정'] },
  home: { k: '홈', h: '다음 수업 → 찾기 → 신청', lead: '보호자가 매일 여는 화면이라 “오늘 할 일”을 맨 위에 둬요.', nums: [['2가지', '매칭 방식'], ['8개', '과목 카테고리']], b: ['<b>다음 수업 카드</b>에 진행률까지 한 번에', '<b>직접 찾기</b>(조건 필터) + <b>신청서 쓰기</b>(선생님이 지원) 두 갈래 매칭', '카테고리는 아이콘과 글자를 함께 — 글만 읽기 어려운 사용자 고려', '안심 인증 배너를 홈에 상시 노출', '우리 동네(시·도 일치) 선생님을 가로 스크롤로 추천'], law: '<b>매칭 원칙</b> 배정형 경쟁사와 달리 보호자가 직접 고름' },
  tutors: { k: '튜터 찾기', h: '조건으로 좁히고, 아이로 고른다', lead: '스펙보다 “이런 아이에게 → 이렇게 가르쳐요”를 카드 중앙에 둬요.', nums: [['6종', '필터 (과목·대상·방식·지역·수업료·정렬)'], ['25,000~', '회당 수업료(원)']], b: ['<b>인증 4단계 미완료 선생님은 목록에 노출하지 않아요</b> (서버에서 걸러요)', '결과 수 표시 + 필터 초기화 한 번에', '경력 공백까지 프로필에 표시 — 경력보유여성의 양육 경험을 경력으로', '체험 수업 가능 여부 배지'], law: '<b>노출 기준</b> 본인 확인 · 성범죄·아동학대 경력 조회 · 개인과외교습자 신고 · 자격 증빙' },
  tutor: { k: '선생님 상세', h: '믿을 근거를 먼저, 가격은 마지막에', lead: '인증 → 수업 방식 → 시간표 → 커리큘럼 → 가격 순서로 읽혀요.', nums: [['4종', '안심 인증'], ['8회', '월 커리큘럼']], b: ['하단 고정 버튼: <b>상담하기 · 예약</b>', '가능한 요일·시간을 표로 — 예약 화면과 같은 칸', '후기는 <b>결제·수업 완료된 회차가 있을 때만</b> 작성 가능', '연락처는 비공개, 대화는 앱 채팅으로만'], law: '<b>근거</b> 아동·청소년 성보호법 제56조(개인과외교습자 포함) · 아동복지법 제29조의3 · 학원법 제14조의2' },
  request: { k: '수업 신청서', h: '쓰면, 선생님이 먼저 손을 든다', lead: '찾을 시간이 없는 보호자를 위한 두 번째 매칭 길이에요.', nums: [['6단계', '작성 흐름'], ['0원', '등록 비용']], b: ['아이 특성 칩 5종 — 발표자료 문제 정의 5가지 그대로', '희망 요일·시간·수업료 범위를 함께 받아 지원 정확도 상승', '지원한 선생님을 한 화면에서 비교하고 바로 채팅', '아이 실명·학교·연락처는 선생님에게 공개하지 않아요'] },
  booking: { k: '예약', h: '주 2회를 고르면 월 8회가 된다', lead: '선생님의 가능 시간 안에서만 고를 수 있어요.', nums: [['월 8회', '표준 패키지'], ['240,000원', '회당 30,000원 기준']], b: ['패키지 4·8·12회 — 계산은 회당 단가 × 횟수, 숨은 비용 없음', '주 횟수만큼 시간 칸 선택 강제 (서버에서도 검증)', '수업 방식(방문·화상·센터)은 선생님이 가능한 것만', '하단 바에 합계가 실시간으로 바뀜'] },
  checkout: { k: '결제', h: '돈이 어디로 가는지 보여준다', lead: '수업료의 80%는 선생님, 20%는 안전거래·매칭 운영에 쓰여요.', nums: [['80 : 20', '튜터 : 플랫폼'], ['3단계', '환불 구간']], b: ['<b>안전거래</b>: 결제금은 보관 → 회차별 수업 완료 확인 → 선생님 정산', '환불 계산기: 진행 회차를 움직이면 돌려받을 금액이 바로 계산', '지자체·기관 <b>바우처 코드</b> 입력 칸(공공 연계 대비)', '필수 동의 3개만, 전체 동의 한 번에', '데모 결제창 — 카드 번호를 받지 않아요'], law: '<b>환불 기준</b> 학원법 시행령 별표 4 — 시작 전 전액 · 1/3 경과 전 2/3 · 1/2 경과 전 1/2 · 이후 반환 없음' },
  paid: { k: '결제 완료', h: '다음 행동 하나만 크게', lead: '결제 직후엔 “첫 수업 준비”로 이어지게 해요.', nums: [['1분', '첫 수업 준비 체크'], ['80%', '선생님 정산 몫']], b: ['영수증·일정·선생님 채팅을 한 화면에', '첫 수업 전 보호자 체크리스트(공간·시간·준비물)', '정산 흐름을 다시 한 줄로 보여줘 신뢰 강화'] },
  login: { k: '로그인', h: '틀린 곳은 그 칸 아래에서 알려준다', lead: '오류 메시지를 입력칸 바로 아래에, 쉬운 말로.', nums: [['3개', '데모 계정 역할'], ['2개', '간편 로그인']], b: ['보호자 · 선생님 · 관리자 데모 계정으로 바로 체험', '비밀번호 찾기는 같은 화면 안에서', '로그인 후 원래 하려던 화면으로 돌아가요'] },
  signup: { k: '회원가입', h: '유형마다 다른 질문, 같은 길이', lead: '보호자·선생님·성인 학습자 세 갈래로 4단계 안에 끝나요.', nums: [['3유형', '보호자 · 선생님 · 성인'], ['4단계', '유형 → 계정 → 정보 → 동의']], b: ['아이가 <b>만 14세 미만</b>이면 법정대리인(보호자) 동의를 필수로 (서버에서도 검증)', '진단·검사 정보는 <b>선택 입력 + 별도 동의</b> (민감정보)', '선생님은 서류 4종 업로드 + 희망 수업료 → 예상 정산 즉시 계산', '비밀번호 규칙을 칸 아래에 미리 보여줘요'], law: '<b>근거</b> 개인정보 보호법 제22조의2(아동) · 제23조(민감정보)' },
  community: { k: '커뮤니티', h: '동네를 넘어 전국으로, 아이 단계별로', lead: '지역 채널·게시판에 더해, 아이 발달 단계와 나이대로 한 번 더 나눠요.', nums: [['18개', '지역 채널 (전국 + 17개 시·도)'], ['4단계', '아이 발달 단계 × 나이대 4구간']], b: ['<b>우리 아이 단계</b>를 정해 두면 그 단락으로 먼저 열려요', '<b>선생님께</b> 게시판 — 인증 선생님이 답변 배지를 달고 답해요', '닉네임만 공개, 연락처는 자동으로 가려요', '모든 글에 신고 · 숨기기'], law: '<b>차별점</b> 비교 대상 3곳 모두 커뮤니티 기능 없음' },
  post: { k: '게시글', h: '읽고, 공감하고, 한 줄 답하기', lead: '댓글은 짧게, 신고는 한 번에.', nums: [['1번', '탭으로 공감'], ['1번', '탭으로 신고']], b: ['선생님 답변은 맨 위에 고정', '개인 연락처가 보이면 자동 가림', '댓글 입력칸은 화면 아래 고정'] },
  library: { k: 'e-도서관', h: '보고, 듣고, 따라 하는 자료', lead: '한 자료는 3~5단계, 한 단계는 한 문장이에요.', nums: [['12종', '시작 자료'], ['3단계', '난이도']], b: ['<b>읽어주기</b> 버튼으로 모든 단계를 소리로', '한글·수·감정·생활기술 + 부모 가이드 + 튜터 연수 + 성인 생활', '생활기술 자료를 앞에 — 대중교통·병원 이용 어려움이 일반군보다 최대 4.7배', '선생님은 자료를 수업에 바로 붙일 수 있어요'] },
  my: { k: '마이', h: '아이 중심으로 정리된 내 정보', lead: '보호자 계정 안에 아이 프로필을 여러 명 둘 수 있어요.', nums: [['n명', '아이 프로필'], ['1곳', '쉬운 화면 설정']], b: ['아이 관리 · 수업 기록 · 결제 내역 · 쉬운 화면을 한 목록에', '선생님 역할 전환(데모)', '플랫폼 분석 리포트로 연결'] },
  lessons: { k: '수업 기록', h: '“오늘의 한 걸음”이 쌓이는 곳', lead: '점수가 아니라 해낸 일을 한 줄로 남겨요.', nums: [['8 → 16분', '집중 시간(예시 아이)'], ['월별', '기록 묶음']], b: ['회차마다 선생님이 한 걸음 + 기분 3단계 기록', '<b>보호자가 확인해야</b> 그 회차가 정산돼요', '집중 시간 추이를 막대로 — 늘어난 만큼만 강조', '보호자는 기록에 하트로 답장'] },
  chat: { k: '채팅', h: '번호를 주고받지 않아도 되는 대화', lead: '상담 · 일정 변경 · 기록 공유가 모두 앱 안에서 끝나요.', nums: [['0개', '공개되는 전화번호'], ['3개', '빠른 답장']], b: ['선생님별 대화방 + 터틀리 안심센터', '빠른 답장 칩으로 긴 문장 부담 줄이기', '전화번호를 적으면 자동으로 가려요'] },
  easy: { k: '쉬운 화면', h: '누구나 같은 속도로 쓸 수 있게', lead: '느린학습자 본인과 보호자를 위한 보기 설정이에요.', nums: [['3단계', '글자 크기'], ['1번', '탭으로 읽어주기']], b: ['글자 크기 보통 · 크게 · 아주 크게 — 앱 전체에 적용', '읽어주기 켜면 글을 누를 때마다 소리로', '움직임 줄이기', '모든 버튼 44px 이상'] },
  thome: { k: '선생님 홈', h: '이번 달 정산이 가장 먼저 보인다', lead: '시간을 쪼개 일하는 선생님에게 필요한 건 “얼마, 언제, 누구”예요.', nums: [['24,000원', '회당 정산 (30,000원 × 80%)'], ['주 1회', '정산일']], b: ['다가오는 수업 · 새 신청서 · 인증 진행률을 한 화면에', '가능 시간을 표에서 바로 켜고 끄기 (예약 화면에 바로 반영)', '수익 계산기: 학생 수 × 월 횟수 × 단가 × 80%', '수업 기록을 올리면 보호자 확인 뒤 정산'] },
  students: { k: '학생 찾기', h: '신청서를 보고 먼저 지원한다', lead: '보호자가 쓴 신청서에 선생님이 소개 한 줄과 함께 지원해요.', nums: [['열린', '신청서'], ['1줄', '지원 메시지']], b: ['아이 특성 · 지역 · 요일 · 희망 수업료를 카드 하나에', '지원하면 보호자 채팅으로 바로 전달', '아이 실명·학교는 보이지 않아요'] },
  admin: { k: '관리자', h: '서류 4종이 모두 확인돼야 공개', lead: '심사 대기 → 서류 확인 → 승인 → 목록 공개 순서예요.', nums: [['4종', '필수 서류'], ['대기', '심사 목록']], b: ['서류마다 확인 체크, 하나라도 빠지면 승인 불가 (서버에서도 막아요)', '반려 시 사유를 선생님에게 전달', '신고된 글 현황'], law: '<b>근거</b> 아동·청소년 성보호법 제56조 — 아동·청소년 대상 개인과외교습자는 취업제한 조회 대상' },
};

/* ===================== 분석 리포트 ===================== */
const REQ = [
  ['안전', '선생님 4단계 인증 (본인 · 성범죄·아동학대 경력 · 개인과외교습자 신고 · 자격)', '아청법 제56조, 아동복지법 제29조의3, 학원법 제14조의2', 'P0', 'tutor-t1', '선생님 상세'],
  ['안전', '인증 미완료 선생님 비노출 · 관리자 서류 심사', '운영 정책', 'P0', 'admin', '관리자'],
  ['안전', '안전거래: 결제 보관 → 수업 완료 확인 → 정산', '전자상거래 신뢰', 'P0', 'checkout', '결제'],
  ['안전', '연락처 비공개 · 앱 내 채팅 · 신고', '운영 정책', 'P0', 'chat', '채팅'],
  ['개인정보', '만 14세 미만 법정대리인 동의 · 확인', '개인정보 보호법 제22조의2', 'P0', 'signup', '회원가입'],
  ['개인정보', '진단·검사 정보 선택 입력 + 별도 동의', '개인정보 보호법 제23조', 'P0', 'signup', '회원가입'],
  ['결제', '회당 단가 × 횟수, 수수료 20% 공개', '가격 투명성', 'P0', 'booking-t1', '예약'],
  ['결제', '학원법 기준 환불 자동 계산', '학원법 시행령 별표 4', 'P0', 'checkout', '결제'],
  ['매칭', '직접 찾기: 필터 6종 + 결과 수 + 초기화', '김과외형 검색', 'P0', 'tutors', '튜터 찾기'],
  ['매칭', '신청서 쓰기 → 선생님 지원 → 비교', '자란다형 신청', 'P0', 'request', '신청서'],
  ['매칭', '첫 상담 무료 · 체험 수업', '진입 장벽 낮추기', 'P1', 'tutor-t1', '선생님 상세'],
  ['학습', '오늘의 한 걸음 기록 · 집중 시간 추이', '성장 가시화', 'P1', 'lessons', '수업 기록'],
  ['학습', 'e-도서관 3단계 시청각 자료 · 읽어주기', 'ALL-IN-ONE', 'P1', 'library', 'e-도서관'],
  ['접근성', '글자 3단계 · 읽어주기 · 움직임 줄이기 · 44px 버튼', '느린학습자 본인 사용', 'P0', 'easy', '쉬운 화면'],
  ['커뮤니티', '전국 + 17개 시·도 채널, 선생님께 게시판, 아이 단계별 단락', '경쟁사 전원 미보유', 'P1', 'community', '커뮤니티'],
  ['튜터', '희망 단가 → 예상 정산 즉시 계산, 가능 시간 표', '경력보유여성 유연 근무', 'P1', 'thome', '선생님 홈'],
  ['튜터', '신청서 보고 먼저 지원하기', '공급 측 매칭', 'P1', 'students', '학생 찾기'],
  ['공공', '바우처 코드 입력 · 수익 일부 교육자료 제작 지원', '지자체·교육청 연계', 'P2', 'checkout', '결제'],
];
function reportHTML() {
  const bar = (name, v, max, lab, us) => `<div class="hbar${us ? ' us' : ''}"><span>${name}</span><div class="tr"><i style="width:${Math.round(v / max * 100)}%"></i></div><b>${lab}</b></div>`;
  const li = (arr, i = 'check') => arr.map(x => `<li>${ic(i, 18)}<span>${x}</span></li>`).join('');
  return `
  <div class="rp-top"><img src="${WORDMARK}" alt="터틀리"><span class="t">플랫폼 분석 리포트</span><button class="btn sm line" id="rp-close">${ic('x', 18)}닫기</button></div>
  <nav class="rp-nav" aria-label="리포트 목차">${[['rp1', '한눈에'], ['rp2', '문제'], ['rp3', '사용자 요구'], ['rp4', '필수 요건 18'], ['rp5', '경쟁 비교'], ['rp6', '가격·수익 산출'], ['rp7', '시장'], ['rp8', '성장 전략']].map(([i, n]) => `<button class="chip" data-jump="${i}">${n}</button>`).join('')}</nav>
  <div class="rp">
   <section id="rp1"><p class="k">한눈에</p>
    <h1>느린학습자 가정은 검증된 1:1 선생님을, 경력보유여성은 시간 맞는 일을 찾는다</h1>
    <p class="lede">터틀리는 두 수요를 안전거래로 잇는다. 월 8회 24만 원, 선생님 정산 80%, 전국 단위 커뮤니티가 핵심 숫자다.</p>
    <div class="big4"><div><b>13.59%</b><span>경계선지능 추정 비율 · 약 697만 명</span></div><div><b>약 78만</b><span>학령기 경계선지능 추정 학생</span></div><div><b>5.1%</b><span>아동·청소년 경계선지능 위험집단 (2026 정부 실태조사)</span></div><div><b>96만</b><span>15~54세 기혼 경력보유여성 (2026 상반기)</span></div></div>
   </section>
   <section id="rp2"><p class="k">문제</p><h2>장애도 비장애도 아닌 경계에서, 지원은 비어 있다</h2>
    <p class="lede">IQ 71~84 구간. 법적 정의가 아직 없고, 관련 법안은 2024년부터 여러 건 발의돼 국회에 계류 중이다.</p>
    <div class="big4"><div><b>9.3배</b><span>우울증 비율 — 비장애 아동 1.5% vs 경계선지능 아동 14%</span></div><div><b>6배+</b><span>학업 중단·유예 경험 — 위험집단 20%+ vs 일반 3.3%</span></div><div><b>89.7%</b><span>“경계선 지능을 전혀 모른다”</span></div><div><b>4.7배</b><span>대중교통·병원 이용 어려움 (일반군 대비 최대)</span></div></div>
    <div class="cols3" style="margin-top:12px">${['상황 이해와 대처가 어려워요', '감정 표현·의사소통이 서툴러요', '친구 관계에서 좌절이 반복돼요', '주의 집중 시간이 짧아요', '같은 내용도 익히는 데 오래 걸려요'].map(x => `<div class="box"><h3>${x}</h3></div>`).join('')}<div class="box" style="background:var(--tint-soft)"><h3>터틀리는 이 다섯 가지를 신청서의 “아이 특성” 칩으로 받는다</h3></div></div>
   </section>
   <section id="rp3"><p class="k">사용자 요구</p><h2>보호자 셋, 선생님 셋</h2>
    <div class="cols2">
     <div class="box"><h3>느린학습자 가정이 원하는 것</h3><ul class="bul">${li(['<b>기초 교육</b> — 사회 속에 녹아들 수 있는 기초 학습·생활기술', '<b>느린학습자 커뮤니티</b> — 지역에 흩어진 보호자를 묶을 곳', '<b>비싸지 않은 가격</b> — 부담되지 않는 선의 1:1 교육'])}</ul></div>
     <div class="box"><h3>경력보유여성 선생님이 원하는 것</h3><ul class="bul">${li(['<b>원하는 시간대에</b> — 육아 중 비는 시간에 일하기', '<b>생활비 보충</b> — 부수입으로도 충분한 정산', '<b>재취업의 발판</b> — 끊긴 경력을 다시 잇기, 재취업까지 평균 7.5년'])}</ul></div>
    </div>
    <div class="big4" style="margin-top:12px"><div><b>13.4%</b><span>15~54세 기혼여성 중 경력보유여성</span></div><div><b>51.1%</b><span>그만둔 사유 1위 — 육아</span></div><div><b>43.1%</b><span>단절 기간 10년 이상</span></div><div><b>7.5년</b><span>결혼·출산 후 재취업까지 평균</span></div></div>
   </section>
   <section id="rp4"><p class="k">필수 요건</p><h2>18개 요건, 모두 서비스에 반영</h2>
    <p class="lede">P0는 출시 전 필수, P1은 출시 3개월 안, P2는 공공 연계 단계. 화면 열기를 누르면 앱에서 바로 확인할 수 있다.</p>
    <div style="overflow-x:auto"><table class="rq stack"><thead><tr><th>영역</th><th>요건</th><th>기준</th><th>우선</th><th>반영 화면</th></tr></thead><tbody>
    ${REQ.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td class="p"><span class="tag ${r[3] === 'P0' ? 'g' : r[3] === 'P1' ? 'b' : 'y'}">${r[3]}</span></td><td><button class="go" data-open="${r[4]}">${r[5]} 열기 ›</button></td></tr>`).join('')}
    </tbody></table></div>
   </section>
   <section id="rp5"><p class="k">경쟁 비교</p><h2>커뮤니티를 가진 곳은 터틀리뿐</h2>
    <div style="overflow-x:auto"><table class="rq cmp stack"><thead><tr><th>항목</th><th>터틀리</th><th>자란다</th><th>대교 드림멘토 마이페이스</th><th>느루잉</th></tr></thead><tbody>
     <tr><td>비즈니스 모델</td><td class="us">중개수수료</td><td>중개수수료</td><td>정액제</td><td>중개수수료</td></tr>
     <tr><td>주요 고객</td><td class="us">느린학습자 · 경력보유여성</td><td>영유아 · 어린이</td><td>느린학습자</td><td>느린학습자 · 대학생</td></tr>
     <tr><td>커뮤니티</td><td class="us">전국 단위 연합</td><td>없음</td><td>없음</td><td>없음</td></tr>
     <tr><td>매칭 방식</td><td class="us">직접 선택 + 신청서</td><td>직접 선택</td><td>배정</td><td>배정</td></tr>
     <tr><td>가격</td><td class="us">월 8회 약 24만 원</td><td>시장가</td><td>1회 7만 원</td><td>1회 3.5만 원</td></tr>
     <tr><td>지원 환경</td><td class="us">웹 · 앱</td><td>앱</td><td>웹</td><td>웹</td></tr>
    </tbody></table></div>
   </section>
   <section id="rp6"><p class="k">가격·수익 산출</p><h2>월 8회 기준, 가정은 최대 32만 원 아낀다</h2>
    <div class="cols2">
     <div class="box"><h3>월 8회 수업료</h3>${bar('대교 마이페이스', 560000, 560000, '560,000원')}${bar('느루잉', 280000, 560000, '280,000원')}${bar('터틀리', 240000, 560000, '240,000원', 1)}<p class="cap" style="padding:0">대교 대비 −320,000원(−57.1%) · 느루잉 대비 −40,000원(−14.3%)</p></div>
     <div class="box"><h3>선생님 월 정산 (회당 30,000원 × 80%)</h3>${bar('학생 2명 · 16회', 384000, 768000, '384,000원')}${bar('학생 3명 · 24회', 576000, 768000, '576,000원')}${bar('학생 4명 · 32회', 768000, 768000, '768,000원', 1)}<p class="cap" style="padding:0">회당 50분 기준, 학생 2명이면 주 약 3.3시간</p></div>
    </div>
    <div class="cols3" style="margin-top:12px">
     <div class="box"><p class="q">48,000원</p><h3>매칭 1건 월 플랫폼 매출</h3><p class="para">240,000원 × 20%</p></div>
     <div class="box"><p class="q">22.5억 원</p><h3>연 플랫폼 매출 시나리오</h3><p class="para">학령기 추정 78만 명 중 0.5%(3,900명)가 월 8회 이용</p></div>
     <div class="box"><p class="q">112.3억 원</p><h3>같은 조건 연 거래액</h3><p class="para">3,900명 × 240,000원 × 12개월</p></div>
    </div>
    <div class="box" style="margin-top:12px"><h3>돈의 흐름</h3>
     <div class="flow"><div class="node"><b>느린학습자 가정</b><span class="cap" style="padding:0">수업료 결제</span></div><div class="mid"><img src="${TURTLE}" alt=""><b class="hand" style="font-size:32px;color:var(--brand)">터틀리</b></div><div class="node"><b>경력보유여성 선생님</b><span class="cap" style="padding:0">회차별 정산 80%</span></div></div>
     <div class="split" style="margin-top:14px"><i class="a" style="width:80%">선생님 80%</i><i class="b" style="width:20%">터틀리 20%</i></div>
     <p class="cap" style="padding:0">20%는 안전거래 보관 · 매칭 · e-도서관 · 커뮤니티 운영에 쓰이고, 수익 일부는 느린학습자 교육자료 제작에 기부한다.</p></div>
   </section>
   <section id="rp7"><p class="k">시장</p><h2>에듀테크는 연 12.2%씩 자란다</h2>
    <div class="cols2">
     <div class="box"><h3>시장 규모</h3>${bar('TAM 에듀테크', 56000, 56000, '5조 6,000억')}${bar('SAM 과외 매칭', 7000, 56000, '7,000억')}${bar('SOM 느린학습자 과외', 1500, 56000, '1,000~1,500억', 1)}<p class="cap" style="padding:0">2028년 SOM 3,000억~6,000억 원 전망</p></div>
     <div class="box"><h3>성장</h3>${bar('국내 에듀테크 2020', 48000, 86000, '4조 8천억')}${bar('국내 에듀테크 2025', 86000, 86000, '8조 6천억', 1)}${bar('세계 치료 시장 2020', 175, 305, '175억 달러')}${bar('세계 치료 시장 2029', 305, 305, '305억 달러', 1)}<p class="cap" style="padding:0">국내 연평균 12.2% · 세계 느린학습자 치료 시장 연평균 6.5%</p></div>
    </div>
   </section>
   <section id="rp8"><p class="k">성장 전략</p><h2>법이 생기는 순간, 이미 연결돼 있는 플랫폼</h2>
    <div class="cols2">
     <div class="box"><h3>강점</h3><ul class="bul">${li(['느린학습자 특화 + 경력보유여성 선생님, 양면을 함께 잡은 첫 플랫폼', '매칭 · 시청각 자료 · 커뮤니티 · e-도서관 ALL-IN-ONE', '월 8회 24만 원 — 비교 대상 중 가장 낮은 1:1 가격', '전국 단위 연합 커뮤니티'])}</ul></div>
     <div class="box"><h3>기회</h3><ul class="bul">${li(['경계선지능인 지원 법안이 여러 건 발의 — 5년 기본계획 · 3년 실태조사 · 개인별 지원계획 담김', '2026년 정부 첫 실태조사 공표, 상설 지원 법제화 요구 확대', '서울 경계선지능인 평생교육 지원센터, 온라인 학습 느린학습자 콘텐츠 확대, 지자체 평생학습 사업 신설', '공공기관과 함께 맞춤형 과외 프로그램 개발'])}</ul></div>
    </div>
    <h2 style="margin-top:28px">제안 로드맵</h2>
    <div class="road3">
     <div class="box"><b class="ph">0~6개월</b><h3>웹 파일럿</h3><ul class="bul">${li(['서울·경기 2개 권역', '인증 선생님 50명 · 가정 200곳', '무료 상담 · 체험 수업 전환율 검증'], 'chevR')}</ul></div>
     <div class="box"><b class="ph">6~12개월</b><h3>앱 출시 · 전국 커뮤니티</h3><ul class="bul">${li(['17개 시·도 채널 개설', 'e-도서관 자료 100종', '튜터 연수 정례화'], 'chevR')}</ul></div>
     <div class="box"><b class="ph">12~24개월</b><h3>공공 연계</h3><ul class="bul">${li(['지자체·교육청 바우처 연계', '성인 느린학습자 생활·금융 과정', '수익 일부 교육자료 제작 기부'], 'chevR')}</ul></div>
    </div>
    <div class="cols2" style="margin-top:12px">
     <div class="box"><h3>운영 원칙</h3><ul class="bul">${li(['안전 먼저 — 서류 4종이 모두 확인된 선생님만 공개', '최소 수집 — 진단명은 묻지 않고 아이 특성으로 받기', '낙인 없는 말 — 진단명은 보호자가 고른 커뮤니티 단락에서만', '가격 공개 — 수수료 20%를 결제 화면에 그대로'], 'shield')}</ul></div>
     <div class="box" style="display:grid;place-items:center;text-align:center"><img src="${TURTLE}" alt="" style="width:150px"><p class="hand" style="font-size:40px;color:var(--ink);margin:6px 0 0;line-height:1.2">느려도 끝까지,<br>세상의 모든 거북이들을 위해</p></div>
    </div>
   </section>
  </div>`;
}

/* ===================== 유틸 ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const modeTxt = t => t.modes.map(m => MODES[m].n).join('·');
const DAYIDX = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };
function nextDate(slot, after = new Date()) { const [d, h] = slot.split(' '); const x = new Date(after); x.setHours(+h, 0, 0, 0); let add = (DAYIDX[d] - x.getDay() + 7) % 7; if (add === 0 && x <= after) add = 7; x.setDate(x.getDate() + add); return x; }
const fmtD = x => `${x.getMonth() + 1}월 ${x.getDate()}일(${'일월화수목금토'[x.getDay()]})`;
const fmtH = h => { h = +h; return (h < 12 ? '오전 ' : '오후 ') + (h > 12 ? h - 12 : h) + '시'; };
const slotTxt = s => { const [d, h] = s.split(' '); return `${d} ${fmtH(h)}`; };
const ago = iso => { const m = Math.floor((Date.now() - new Date(iso)) / 60000); if (m < 1) return '방금 전'; if (m < 60) return `${m}분 전`; const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`; const d = Math.floor(h / 24); return d === 1 ? '어제' : `${d}일 전`; };
const atTxt = iso => { const d = new Date(iso), n = new Date(); const h = d.getHours(); const t = (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + ':' + String(d.getMinutes()).padStart(2, '0'); return d.toDateString() === n.toDateString() ? t : `${d.getMonth() + 1}/${d.getDate()} ${t}`; };
const levelName = k => LEVELS.find(l => l.key === k)?.name || '';
const ageName = k => AGES.find(a => a.key === k)?.name || '';
const gradeToAge = g => !g ? null : g === '미취학' ? 'preschool' : /초등 [123]/.test(g) ? 'lower' : /초등 [456]/.test(g) ? 'upper' : /중학생|고등학생/.test(g) ? 'teen' : null;

/* ===================== 상태: 서버 데이터(S) + 화면 설정(UI) ===================== */
const UIKEY = 'turtley-ui-v2', TOKKEY = 'turtley-token-v2';
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } } };
const freshUI = () => ({ fs: 1, read: false, motion: false, seen: false, f: { q: '', subj: '', tg: '', mode: '', region: '', price: PRICE_MAX, trial: false, sort: 'rec' }, lf: { q: '', cat: '', lv: 0 }, cf: { region: '전국', board: '전체', level: null, age: '' }, sf: 'mine', draft: null, lastPaid: null, next: null, loginNote: false });
let UI;
try { UI = Object.assign(freshUI(), JSON.parse(store.get(UIKEY) || '{}')); } catch { UI = freshUI(); }
const saveUI = () => store.set(UIKEY, JSON.stringify(UI));
let token = store.get(TOKKEY);
let S = { user: null, tutors: [], library: [], kids: [], bookings: [], lessons: [], threads: [], requests: [], saved: { tutor: [], lib: [] }, groups: { levels: LEVELS, ages: AGES, total: 0 } };
let T = {};

const doFetch = (...a) => (window.__turtleyFetch || fetch)(...a); // 서버 없는 미리보기에서는 같은 API 코드를 브라우저에서 실행
async function api(path, { method = 'GET', body } = {}) {
  const res = await doFetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !path.startsWith('/auth')) { setToken(null); await sync(); }
  if (!res.ok) { const e = new Error(data.error || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'); e.status = res.status; throw e; }
  return data;
}
function setToken(t) { token = t; store.set(TOKKEY, t); }
async function sync() {
  S = await api('/state');
  T = Object.fromEntries([...S.tutors, ...(S.myTutor ? [S.myTutor] : [])].map(t => [t.id, t]));
  if (UI.cf.level === null && S.kids[0]?.level) UI.cf.level = S.kids[0].level;
}
const me = () => S.user;
const role = () => (S.user ? S.user.role : 'guest');
const GUEST_KID = { id: null, name: '우리 아이', grade: '', region: '서울', dist: '', traits: [], subj: [] };
const kid = () => S.kids[0] || GUEST_KID;
const doneOf = b => S.lessons.filter(l => l.bookingId === b.id && l.confirmed).length;
async function loginAs(r) { const d = await api('/auth/demo', { method: 'POST', body: { role: r } }); setToken(d.token); UI.cf.level = null; await sync(); }
// 누른 버튼은 처리가 끝날 때까지 잠가요 (두 번 눌러도 한 번만 보내기 + 기다리는 중 표시)
const busyEl = e => { const c = e && e.currentTarget; if (!(c instanceof HTMLElement)) return null; return c.tagName === 'FORM' ? $('button[type=submit],button:not([type])', c) || c : c; };
const run = fn => async (...a) => {
  const b = busyEl(a[0]); if (b && b.dataset.lock) return;
  let t = null; if (b) { b.dataset.lock = '1'; t = setTimeout(() => b.setAttribute('aria-busy', 'true'), 150); }
  try { await fn(...a); } catch (e) { toast(e.message); } finally { if (b) { clearTimeout(t); b.removeAttribute('aria-busy'); b.removeAttribute('data-lock'); } }
};

/* ===================== 레이어: 시트 · 대화상자 · 토스트 ===================== */
let layer, view, tabbar;
// 시트는 브라우저 기록에 한 칸 쌓아서, 휴대폰 뒤로가기를 누르면 화면을 떠나지 않고 시트만 닫혀요
let sheetStack = [], backPending = false, goQueue = null;
addEventListener('popstate', () => {
  if (backPending) { backPending = false; if (goQueue) { const h = goQueue; goQueue = null; go(h); } return; }
  const top = sheetStack[sheetStack.length - 1]; if (top) top(true);
});
function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; layer.appendChild(t); requestAnimationFrame(() => t.classList.add('on')); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 2400); }
function sheet({ title, html, mount, label }) {
  const dim = document.createElement('div'); dim.className = 'dim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', label || title || '');
  sh.innerHTML = `<div class="grab"></div><div class="sh-h"><h2>${title || ''}</h2><button class="ib plain" data-x aria-label="닫기">${ic('x', 22)}</button></div><div class="sh-b">${html}</div>`;
  layer.append(dim, sh); const prev = document.activeElement;
  requestAnimationFrame(() => { dim.classList.add('on'); sh.classList.add('on'); });
  history.pushState({ sheet: true }, ''); let closed = false;
  const close = fromPop => { if (closed) return; closed = true; sheetStack = sheetStack.filter(x => x !== close);
    if (fromPop !== true && history.state && history.state.sheet) { backPending = true; history.back(); }
    dim.classList.remove('on'); sh.classList.remove('on'); document.removeEventListener('keydown', k); setTimeout(() => { dim.remove(); sh.remove(); }, 320); prev && prev.focus && prev.focus(); };
  const k = e => { if (e.key === 'Escape') close(); }; document.addEventListener('keydown', k);
  sheetStack.push(close); dim.onclick = () => close(); $('[data-x]', sh).onclick = () => close();
  setTimeout(() => { const f = $('input,button:not([data-x]),select,textarea', $('.sh-b', sh)); f && f.focus({ preventScroll: true }); }, 340);
  mount && mount(sh, close); applyRead(); return { el: sh, close };
}
function ask({ title, body = '', ok = '확인', cancel = '취소', warn = false }) {
  return new Promise(res => {
    const dim = document.createElement('div'); dim.className = 'dim'; const d = document.createElement('div'); d.className = 'dialog'; d.setAttribute('role', 'alertdialog'); d.setAttribute('aria-modal', 'true');
    d.innerHTML = `<h2>${title}</h2>${body ? `<p>${body}</p>` : ''}<div class="dbtns${cancel ? '' : ' one'}">${cancel ? `<button data-n>${cancel}</button>` : ''}<button data-y class="${warn ? 'warn' : ''}">${ok}</button></div>`;
    layer.append(dim, d); requestAnimationFrame(() => { dim.classList.add('on'); d.classList.add('on'); }); $('[data-y]', d).focus();
    const done = v => { dim.classList.remove('on'); d.classList.remove('on'); setTimeout(() => { dim.remove(); d.remove(); }, 250); res(v); };
    $('[data-y]', d).onclick = () => done(true); const n = $('[data-n]', d); if (n) n.onclick = () => done(false); dim.onclick = () => done(false);
  });
}

/* ===================== 읽어주기 · 쉬운 화면 ===================== */
const canSpeak = 'speechSynthesis' in window;
function speak(text, el) {
  if (!canSpeak) { toast('이 브라우저는 읽어주기를 지원하지 않아요'); return; }
  try {
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = .9;
    $$('.speaking').forEach(x => x.classList.remove('speaking')); if (el) { el.classList.add('speaking'); u.onend = () => el.classList.remove('speaking'); }
    speechSynthesis.speak(u);
  } catch { toast('읽어주기를 시작하지 못했어요'); }
}
function stopSpeak() { try { canSpeak && speechSynthesis.cancel(); } catch { /* ignore */ } }
function applyA11y() { document.documentElement.style.setProperty('--fs', UI.fs); document.documentElement.dataset.motion = UI.motion ? 'reduce' : ''; applyRead(); }
function applyRead() { $('.screen') && $('.screen').classList.toggle('reading', !!UI.read); }

/* ===================== 라우터 ===================== */
const NEED = { booking: 'parent', checkout: 'parent', paid: 'parent', request: 'parent', lessons: 'parent', kids: 'parent', room: 'any', chat: 'any', payments: 'parent', thome: 'tutor', students: 'tutor', admin: 'admin' };
const NOTAB = new Set(['welcome', 'login', 'signup', 'tutor', 'booking', 'checkout', 'paid', 'request', 'post', 'room', 'easy', 'lessons', 'payments', 'kids', 'admin']);
const TABS = {
  guest: [['home', '홈', 'home'], ['tutors', '튜터 찾기', 'search'], ['community', '커뮤니티', 'users'], ['library', 'e-도서관', 'book'], ['my', '마이', 'user']],
  tutor: [['thome', '홈', 'home'], ['students', '학생 찾기', 'apply'], ['community', '커뮤니티', 'users'], ['library', 'e-도서관', 'book'], ['my', '마이', 'user']],
};
const TABOF = { tutor: 'tutors', booking: 'tutors', checkout: 'tutors', paid: 'tutors', request: 'home', post: 'community', lessons: 'my', chat: 'my', room: 'my', easy: 'my', payments: 'my', kids: 'my', admin: 'my' };
function parse() {
  const h = decodeURIComponent(location.hash.slice(1)); let m;
  if (!h) return { r: S.user ? (S.user.role === 'tutor' ? 'thome' : 'home') : (UI.seen ? 'home' : 'welcome') };
  if ((m = h.match(/^tutor-([\w]+)$/))) return { r: 'tutor', id: m[1] };
  if ((m = h.match(/^booking-([\w]+)$/))) return { r: 'booking', id: m[1] };
  if ((m = h.match(/^post-([\w-]+)$/))) return { r: 'post', id: m[1] };
  if ((m = h.match(/^room-([\w-]+)$/))) return { r: 'room', id: m[1] };
  if (ROUTES[h]) return { r: h };
  return { r: 'home' };
}
function go(h) { if (backPending) { goQueue = h; return; } if (location.hash.slice(1) === h) render(); else location.hash = h; }
let curRoute = '', firstRender = true, poll = null;
function tabsHTML(r) {
  const set = role() === 'tutor' ? TABS.tutor : TABS.guest; const active = TABOF[r] || r;
  return set.map(([id, n, i]) => `<button data-go="${id}" ${active === id ? 'aria-current="page"' : ''}>${ic(i, 26, active === id ? 2.1 : 1.7)}<span>${n}</span></button>`).join('');
}
function render() {
  const p = parse(), r = p.r, need = NEED[r]; stopSpeak(); clearInterval(poll);
  $$('.layer > *').forEach(x => x.remove()); sheetStack = [];
  if (need && !S.user) { UI.next = location.hash.slice(1); UI.loginNote = true; saveUI(); location.replace('#login'); return; }
  let v;
  if (need && need !== 'any' && S.user.role !== need && !(need === 'parent' && S.user.role === 'admin')) v = vGate(need);
  else v = ROUTES[r](p);
  curRoute = r;
  const notab = v.notab ?? NOTAB.has(r);
  view.className = 'view' + (notab ? ' notab' : '');
  view.innerHTML = `<div class="vin">${v.html}</div>`; view.scrollTop = 0;
  tabbar.hidden = notab; tabbar.innerHTML = notab ? '' : tabsHTML(r);
  document.title = (v.title ? v.title + ' · ' : '') + '터틀리';
  if (v.mount) Promise.resolve(v.mount(p)).catch(e => toast(e.message));
  renderNote(r); renderNav(); applyRead();
  if (!firstRender) { const h = $('h1', view) || $('.appbar .t', view); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  firstRender = false;
}
function vGate(need) {
  const nm = { parent: '보호자', tutor: '선생님', admin: '관리자' }[need];
  return { title: '계정 전환', notab: false, html: `<div class="empty" style="padding-top:90px"><img src="${TURTLE}" alt=""><b>${nm} 계정에서 볼 수 있는 화면이에요</b><p>지금은 ${({ parent: '보호자', tutor: '선생님', admin: '관리자' })[role()] || '둘러보기'} 상태예요.</p><button class="btn" style="margin-top:14px" data-demo="${need}">${nm} 데모로 보기</button></div>` };
}

/* ===================== 왼쪽 화면 목록 · 오른쪽 설계 노트 ===================== */
const NAV = [
  ['시작', [['welcome', '첫 화면', 'sprout'], ['login', '로그인', 'lock'], ['signup', '회원가입', 'pen']]],
  ['찾기 · 매칭', [['home', '홈', 'home'], ['tutors', '튜터 찾기', 'search'], ['tutor-t1', '선생님 상세', 'user'], ['request', '수업 신청서', 'apply']]],
  ['예약 · 결제', [['booking-t1', '예약', 'calendar'], ['checkout', '결제', 'card'], ['payments', '결제 내역', 'receipt']]],
  ['배움 · 소통', [['lessons', '수업 기록', 'chart'], ['chat', '채팅', 'chat'], ['community', '커뮤니티', 'users'], ['library', 'e-도서관', 'book']]],
  ['마이 · 설정', [['my', '마이', 'user'], ['kids', '아이 관리', 'heart'], ['easy', '쉬운 화면', 'text']]],
  ['선생님 · 운영', [['thome', '선생님 홈', 'wallet'], ['students', '학생 찾기', 'apply'], ['admin', '관리자', 'shield']]],
];
const NAV_ROLE = { 'booking-t1': 'parent', checkout: 'parent', payments: 'parent', request: 'parent', lessons: 'parent', kids: 'parent', chat: 'parent', thome: 'tutor', students: 'tutor', admin: 'admin' };
const navTo = run(async id => {
  const need = NAV_ROLE[id];
  if (need && role() !== need && !(need === 'parent' && role() === 'admin')) { await loginAs(need); toast(({ parent: '보호자', tutor: '선생님', admin: '관리자' })[need] + ' 데모로 들어왔어요'); }
  if (id === 'checkout') ensureDraft();
  if (id === 'welcome') { UI.seen = false; saveUI(); }
  go(id);
});
function renderNav() {
  const L = $('#nav-list'); const cur = location.hash.slice(1) || curRoute;
  if (L) L.innerHTML = NAV.map(([g, items]) => `<div class="nav-g"><h3>${g}</h3>${items.map(([id, n, i]) => `<button data-nav="${id}" ${(cur === id || curRoute === id) ? 'aria-current="page"' : ''}>${ic(i, 18)}${n}</button>`).join('')}</div>`).join('');
  $$('.role-sw button').forEach(b => b.setAttribute('aria-pressed', String(role() === b.dataset.role)));
  const sel = $('#nav-sel'); if (sel) sel.innerHTML = NAV.map(([g, items]) => `<optgroup label="${g}">${items.map(([id, n]) => `<option value="${id}" ${curRoute === id.split('-')[0] || cur === id ? 'selected' : ''}>${n}</option>`).join('')}</optgroup>`).join('');
}
function renderNote(r) {
  const key = r === 'room' ? 'chat' : r === 'payments' || r === 'kids' ? 'my' : r; const n = NOTES[key] || NOTES.home; const box = $('#note'); if (!box) return;
  box.innerHTML = `<p class="k">${n.k} · 설계 포인트</p><h2>${n.h}</h2><p class="lead">${n.lead}</p>
   <div class="nums">${n.nums.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>
   <ul>${n.b.map(x => `<li>${ic('check', 18, 2.2)}<span>${x}</span></li>`).join('')}</ul>${n.law ? `<p class="law">${n.law}</p>` : ''}`;
}
function openReport() {
  const R = $('#report'); R.innerHTML = reportHTML(); R.classList.add('on'); R.scrollTop = 0; document.body.style.overflow = 'hidden';
  $('#rp-close').onclick = closeReport; $('#rp-close').focus();
  $$('[data-jump]', R).forEach(b => b.onclick = () => $('#' + b.dataset.jump).scrollIntoView({ behavior: UI.motion ? 'auto' : 'smooth', block: 'start' }));
  $$('[data-open]', R).forEach(b => b.onclick = () => { closeReport(); navTo(b.dataset.open); });
  $$('.stack', R).forEach(t => { const hs = $$('thead th', t).map(th => th.textContent); $$('tbody tr', t).forEach(tr => $$('td', tr).forEach((td, i) => td.dataset.l = hs[i] || '')); });
}
function closeReport() { const R = $('#report'); R.classList.remove('on'); document.body.style.overflow = ''; R.innerHTML = ''; }
function fit() {
  const d = $('.device'); if (!d) return; if (innerWidth <= 1024) { d.style.removeProperty('--k'); return; }
  const avail = innerWidth - (innerWidth > 1240 ? 780 : 460);
  const k = Math.min(1, (innerHeight - 40) / 1202, avail / 842); d.style.setProperty('--k', Math.max(.45, k).toFixed(3));
}

/* ===================== 공통 조각 ===================== */
// 예전에 저장된 파란 계열 색은 따뜻한 초록·흙색으로 바꿔서 보여줘요
const HUE_WARM = { '#2272EB': '#3D7B35', '#3F78B5': '#4F7A5A', '#4E5968': '#6B6550', '#08739A': '#2F7468', '#2F67A3': '#3A7568', '#2B4A7E': '#566B2C', '#6B7684': '#7A6E58' };
const av = (t, c = '') => `<span class="av ${c}" style="background:${HUE_WARM[t.hue] || t.hue || 'var(--tint)'}" aria-hidden="true">${esc(t.name[0])}<span class="tb"><img src="${TURTLE_SM}" alt=""></span></span>`;
const backBar = (t, back = 'home', right = '') => `<div class="appbar white"><button class="back" data-back="${back}" aria-label="뒤로">${ic('chevL', 26, 2.2)}<span>뒤로</span></button><div class="t">${t}</div>${right || '<span class="sp"></span>'}</div>`;
const secH = (t, more, g) => `<div class="sec-h"><h2>${t}</h2>${more ? `<button class="more" data-go="${g}">${more}</button>` : ''}</div>`;
const tutorCard = t => `<a class="tcard" href="#tutor-${t.id}">${av(t)}<div><div class="nm">${esc(t.name)} 선생님 <span class="verified" title="안심 인증 완료" aria-label="안심 인증 완료">${ic('check', 12, 3)}</span></div><div class="meta">${t.region} ${esc(t.dist)} · 경력 ${t.yrs}년 · ${modeTxt(t)}</div><div class="tags">${t.subj.map(s => `<span class="tag g">${SUBJ[s].name}</span>`).join('')}${t.tg.map(x => `<span class="tag">${x}</span>`).join('')}${t.trial ? '<span class="tag b">체험 가능</span>' : ''}</div></div>
  <div style="grid-column:1/-1"><div class="fit"><div><em>이런 아이에게</em>${esc(t.fit)}</div>${ic('chevR', 16)}<div><em>이렇게 가르쳐요</em>${esc(t.how)}</div></div><div class="bot"><span style="color:var(--muted);font-size:13px">${esc(t.gap)}</span><b>회당 ${won(t.price)}</b></div></div></a>`;
const tutorMini = t => `<a class="tcard-s" href="#tutor-${t.id}"><div class="top">${av(t, 'sm')}<div><b>${esc(t.name)} 선생님</b><small>${esc(t.dist)} · ${modeTxt(t)}</small></div></div><div class="tags">${t.subj.map(s => `<span class="tag g">${SUBJ[s].name}</span>`).join('')}</div><div class="pr">회당 ${won(t.price)}</div></a>`;
const postCard = p => `<a class="post" href="#post-${p.id}"><div class="pm"><span class="tag ${p.board === '선생님께' ? 'b' : 'g'}">${p.board}</span><span class="tag">${p.region}</span>${p.ans ? '<span class="tag b">선생님 답변</span>' : ''}${p.level ? `<span class="pill-lv">${levelName(p.level)}${p.age ? ' · ' + ageName(p.age) : ''}</span>` : ''}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><div class="pf"><span>${esc(p.nick)}</span><span>${ago(p.createdAt)}</span><span>${ic('heart', 14)}${p.likeCount}</span><span>${ic('chat', 14)}${p.cmtCount}</span></div></a>`;
function ensureDraft() {
  if (!UI.draft) { const t = T.t1 || S.tutors[0]; UI.draft = { tid: t.id, kid: kid().id, pkg: 8, mode: t.modes[0], slots: t.slots.slice(0, 2), memo: '', voucher: '' }; saveUI(); }
  return UI.draft;
}
const openThread = run(async (tid, first) => {
  if (!me()) { UI.next = tid ? 'tutor-' + tid : 'chat'; UI.loginNote = true; saveUI(); go('login'); return; }
  const { thread } = await api('/threads', { method: 'POST', body: tid ? { tutorId: tid, first } : { center: true, first } });
  await sync(); go('room-' + thread.id);
});

/* ===================== 첫 화면 ===================== */
function vWelcome() {
  return { title: '시작', html: `<div class="welcome">
  <div class="art"><img class="tt" src="${TURTLE}" alt="가방을 멘 거북이 터틀리"><img class="wm" src="${WORDMARK}" alt="터틀리"><p class="hand">느려도 끝까지</p><p>느린학습자 맞춤형 1:1 교육 플랫폼</p></div>
  <div class="road" aria-hidden="true"></div>
  <div class="acts"><button class="btn block" data-go="signup">시작하기</button><button class="btn block ghost" data-go="login">로그인</button><button class="linkbtn" data-browse>먼저 둘러볼게요</button></div></div>`,
  mount() { $('[data-browse]', view).onclick = () => { UI.seen = true; saveUI(); go('home'); }; } };
}

/* ===================== 로그인 ===================== */
function vLogin() {
  const note = UI.loginNote; UI.loginNote = false; saveUI();
  return { title: '로그인', html: `${backBar('', 'welcome')}
 <div style="padding:6px 20px 30px">
  <p class="hand" style="font-size:34px;color:var(--ink2);margin:0">다시 만나 반가워요</p>
  <h1 style="font-size:30px;margin:2px 0 18px;letter-spacing:-.02em">로그인</h1>
  ${note ? `<div class="notice b">${ic('info', 20)}<span>로그인하면 보던 화면으로 바로 이어가요.</span></div>` : ''}
  <form id="lf" novalidate>
   <div class="field"><label for="le">이메일</label><input class="in" id="le" type="email" autocomplete="username" placeholder="name@example.com"><p class="err" id="lee"></p></div>
   <div class="field"><label for="lp">비밀번호</label><input class="in" id="lp" type="password" autocomplete="current-password" placeholder="8자 이상"><p class="err" id="lpe"></p></div>
   <button class="btn block" type="submit">로그인</button>
  </form>
  <div style="display:flex;justify-content:space-between;margin-top:6px"><button class="linkbtn" id="toReset">비밀번호를 잊었어요</button><button class="linkbtn" data-go="signup">회원가입</button></div>
  <div id="reset" hidden class="card" style="margin-top:6px"><div class="field" style="margin:0 0 10px"><label for="re">가입한 이메일</label><input class="in" id="re" type="email" placeholder="name@example.com"><p class="err" id="ree"></p></div><button class="btn sm" id="resetGo">재설정 메일 보내기</button></div>
  <div class="or">간편 로그인</div>
  <div class="sns"><button class="kk" data-sns>카카오로 계속하기</button><button class="nv" data-sns>네이버로 계속하기</button></div>
  <div class="or">데모 계정으로 바로 보기 (비밀번호 demo1234)</div>
  <div class="demo3"><button data-demo="parent">${ic('heart', 24)}보호자</button><button data-demo="tutor">${ic('sprout', 24)}선생님</button><button data-demo="admin">${ic('shield', 24)}관리자</button></div>
 </div>`,
  mount() {
    $('#lf').onsubmit = async e => {
      e.preventDefault(); const em = $('#le').value.trim(), pw = $('#lp').value; let ok = true;
      $('#lee').textContent = ''; $('#lpe').textContent = ''; $('#le').classList.remove('bad'); $('#lp').classList.remove('bad');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { $('#lee').textContent = '이메일 모양을 다시 확인해 주세요.'; $('#le').classList.add('bad'); ok = false; }
      if (pw.length < 8) { $('#lpe').textContent = '비밀번호는 8자 이상이에요.'; $('#lp').classList.add('bad'); ok = false; }
      if (!ok) return;
      try { const d = await api('/auth/login', { method: 'POST', body: { email: em, password: pw } }); setToken(d.token); UI.cf.level = null; await sync(); afterLogin(); }
      catch (err) { $('#lpe').textContent = err.message + ' 데모 비밀번호는 demo1234예요.'; $('#lp').classList.add('bad'); }
    };
    $('#toReset').onclick = () => { const r = $('#reset'); r.hidden = !r.hidden; if (!r.hidden) $('#re').focus(); };
    $('#resetGo').onclick = () => { const v = $('#re').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { $('#ree').textContent = '이메일 모양을 다시 확인해 주세요.'; return; } $('#ree').textContent = ''; toast('가입된 이메일이면 재설정 링크를 보냈어요'); };
    $$('[data-sns]').forEach(b => b.onclick = () => toast('지금은 이메일·데모 계정 로그인만 열려 있어요'));
  } };
}
function afterLogin() { const nx = UI.next; UI.next = null; UI.seen = true; saveUI(); toast(`${S.user.name}님, 반가워요`); go(nx || (S.user.role === 'tutor' ? 'thome' : S.user.role === 'admin' ? 'admin' : 'home')); }

/* ===================== 회원가입 ===================== */
let SG = null;
function vSignup() {
  if (!SG) SG = { step: 0, type: '', a: {}, i: { subj: [], traits: [], tg: [], modes: [], learn: [], files: {}, level: '' }, t: {} };
  const st = SG.step, ty = SG.type;
  const typeName = { parent: '보호자', tutor: '선생님', adult: '성인 학습자' }[ty] || '';
  const bar = `<div class="stepper" aria-label="4단계 중 ${Math.min(st + 1, 4)}단계">${[0, 1, 2, 3].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`;
  const title = ['어떤 분이세요?', '계정 만들기', `${typeName} 정보`, '약관 동의', '가입 완료'][st];
  let body = '';
  if (st === 0) body = `<div class="typecards" role="radiogroup" aria-label="회원 유형">
  ${[['parent', 'heart', '#FCE6EF', '#A33461', '보호자', '아이에게 맞는 선생님을 찾아요'], ['tutor', 'sprout', '#EAF2DE', '#2E6528', '선생님', '느린학습자 아이를 1:1로 가르쳐요'], ['adult', 'user', '#FFF0E0', '#B45500', '성인 학습자', '내가 직접 생활·금융·읽기를 배워요']].map(([v, i, bg, fg, n, d]) => `<label><span class="ti" style="background:${bg};color:${fg}">${ic(i, 26)}</span><span><b>${n}</b><small>${d}</small></span><input type="radio" name="ty" value="${v}" ${ty === v ? 'checked' : ''} aria-label="${n}"></label>`).join('')}</div>
  <p class="err" id="e0" style="margin-top:8px"></p>`;
  if (st === 1) body = `<div class="field"><label class="req" for="sn">이름</label><input class="in" id="sn" value="${esc(SG.a.name || '')}" autocomplete="name"><p class="err" id="esn"></p></div>
  <div class="field"><label class="req" for="se">이메일</label><input class="in" id="se" type="email" value="${esc(SG.a.email || '')}" autocomplete="email"><p class="err" id="ese"></p></div>
  <div class="field"><label class="req" for="sp">비밀번호</label><input class="in" id="sp" type="password" autocomplete="new-password"><p class="help">영문과 숫자를 섞어 8자 이상</p><p class="err" id="esp"></p></div>
  <div class="field"><label class="req" for="sp2">비밀번호 확인</label><input class="in" id="sp2" type="password" autocomplete="new-password"><p class="err" id="esp2"></p></div>`;
  if (st === 2 && ty === 'parent') {
    const yrs = []; for (let y = 2022; y >= 2006; y--) yrs.push(y);
    body = `<div class="notice b">${ic('info', 20)}<span>아이 실명 대신 부르는 이름을 써도 돼요. 선생님에게는 이름·학교가 공개되지 않아요.</span></div>
  <div class="field"><label class="req" for="kn">아이를 부르는 이름</label><input class="in" id="kn" value="${esc(SG.i.kn || '')}" placeholder="예: 하늘"><p class="err" id="ekn"></p></div>
  <div class="two" style="gap:10px"><div class="field"><label class="req" for="kb">출생연도</label><select class="sel in" id="kb">${yrs.map(y => `<option ${+SG.i.kb === y || (!SG.i.kb && y === 2017) ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
  <div class="field"><label for="kg">학년</label><select class="sel in" id="kg">${['미취학', '초등 1학년', '초등 2학년', '초등 3학년', '초등 4학년', '초등 5학년', '초등 6학년', '중학생', '고등학생', '그 외'].map(g => `<option ${SG.i.kg === g ? 'selected' : ''}>${g}</option>`).join('')}</select></div></div>
  <p class="help" id="kage" style="margin:-6px 0 12px"></p>
  <div class="field"><span class="lab">아이 특성 (여러 개 고를 수 있어요)</span><div class="chips wrap">${TRAITS.map(x => `<button class="chip soft" data-tg="traits" data-v="${x}" aria-pressed="${SG.i.traits.includes(x)}">${x}</button>`).join('')}</div></div>
  <div class="field"><span class="lab">필요한 도움</span><div class="chips wrap">${SUBJECTS.map(s => `<button class="chip soft" data-tg="subj" data-v="${s.id}" aria-pressed="${SG.i.subj.includes(s.id)}">${s.name}</button>`).join('')}</div></div>
  <div class="two" style="gap:10px"><div class="field"><label for="kr">시·도</label><select class="sel in" id="kr">${REGIONS.map(r => `<option ${SG.i.kr === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="field"><label for="kd">구·시·군</label><input class="in" id="kd" value="${esc(SG.i.kd || '')}" placeholder="예: 마포구"></div></div>
  <div class="field"><label for="klv">커뮤니티 단락 (선택)</label><select class="sel in" id="klv"><option value="">나중에 고를게요</option>${LEVELS.map(l => `<option value="${l.key}" ${SG.i.level === l.key ? 'selected' : ''}>${l.name} (${l.range})</option>`).join('')}</select><p class="help">비슷한 아이를 키우는 보호자들의 이야기를 먼저 보여드려요. 진단명이 없어도 가장 가까운 곳을 고르면 돼요.</p></div>
  <div class="field"><label for="kx">검사·상담 결과 (선택)</label><textarea class="in" id="kx" placeholder="적지 않아도 가입할 수 있어요. 적으면 별도 동의를 받아요.">${esc(SG.i.kx || '')}</textarea></div>`;
  }
  if (st === 2 && ty === 'tutor') {
    const pr = SG.i.price || PRICE_STD;
    body = `<div class="two" style="gap:10px"><div class="field"><label for="tr">활동 시·도</label><select class="sel in" id="tr">${REGIONS.map(r => `<option ${SG.i.tr === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="field"><label for="ty2">교육 경력(년)</label><input class="in" id="ty2" type="number" min="0" max="40" value="${esc(SG.i.ty2 || '')}" inputmode="numeric"></div></div>
  <div class="field"><span class="lab req">가르칠 수 있는 과목</span><div class="chips wrap">${SUBJECTS.map(s => `<button class="chip soft" data-tg="subj" data-v="${s.id}" aria-pressed="${SG.i.subj.includes(s.id)}">${s.name}</button>`).join('')}</div><p class="err" id="esubj"></p></div>
  <div class="field"><span class="lab">수업 대상</span><div class="chips wrap">${TARGETS.map(x => `<button class="chip soft" data-tg="tg" data-v="${x}" aria-pressed="${SG.i.tg.includes(x)}">${x}</button>`).join('')}</div></div>
  <div class="field"><span class="lab">수업 방식</span><div class="chips wrap">${Object.entries(MODES).map(([k, m]) => `<button class="chip soft" data-tg="modes" data-v="${k}" aria-pressed="${SG.i.modes.includes(k)}">${m.n}</button>`).join('')}</div></div>
  <div class="field"><label for="tgap">경력 공백 (선택)</label><input class="in" id="tgap" value="${esc(SG.i.tgap || '')}" placeholder="예: 육아로 4년 쉬었어요"><p class="help">양육 경험도 이 일에서는 경력이에요.</p></div>
  <div class="calc" style="margin:0 0 14px"><label for="tp" style="font-weight:600;font-size:14px">희망 수업료 (회당)</label><div class="big" id="tpv">${won(pr)}</div><input id="tp" type="range" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${pr}" aria-label="희망 수업료"><div class="rowc"><span>회당 정산 (80%)</span><b id="tps">${won(pr * TUTOR_SHARE)}</b></div><div class="rowc"><span>학생 2명 · 월 16회면</span><b id="tpm">${won(pr * TUTOR_SHARE * 16)}</b></div></div>
  <div class="field"><span class="lab req">인증 서류 4종</span><div class="upl">${DOCS.map(([k, n]) => `<label class="${SG.i.files[k] ? 'ok' : ''}">${ic('file', 22)}<span class="ut">${n}<small>${SG.i.files[k] ? esc(SG.i.files[k]) : 'PDF·사진 파일'}</small></span><span class="us">${ic(SG.i.files[k] ? 'check' : 'upload', 20)}</span><input type="file" data-doc="${k}" accept=".pdf,image/*" aria-label="${n} 올리기"></label>`).join('')}</div><p class="help">서류가 모두 확인되기 전에는 목록에 공개되지 않아요. (지금은 파일 이름만 저장돼요)</p></div>`;
  }
  if (st === 2 && ty === 'adult') {
    const yrs = []; for (let y = 2007; y >= 1960; y--) yrs.push(y);
    body = `<div class="field"><label class="req" for="ab">출생연도</label><select class="sel in" id="ab">${yrs.map(y => `<option ${+SG.i.ab === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
  <div class="field"><span class="lab">배우고 싶은 것</span><div class="chips wrap">${['생활기술', '돈·통장 관리', '계약서 읽기', '직업 준비', '한글·읽기', '수 개념'].map(x => `<button class="chip soft" data-tg="learn" data-v="${x}" aria-pressed="${SG.i.learn.includes(x)}">${x}</button>`).join('')}</div></div>
  <div class="list"><div class="row noicon"><span class="rt">중요한 결정 전에 보호자에게도 알리기<small>선택 · 언제든 끌 수 있어요</small></span><label class="sw"><input type="checkbox" id="ag" ${SG.i.ag ? 'checked' : ''} aria-label="보호자에게 알리기"><span></span></label></div></div>`;
  }
  if (st === 3) {
    const age = SG.type === 'parent' ? (new Date().getFullYear() - (+SG.i.kb || 2017)) : 99; const minor = age < 14; const diag = !!(SG.i.kx || '').trim();
    const items = [['service', '(필수) 서비스 이용약관', ''], ['privacy', '(필수) 개인정보 수집·이용', '이름·이메일·지역, 회원 탈퇴 시까지']];
    if (SG.type === 'parent' && minor) items.push(['guardian', `(필수) 법정대리인 동의 — 만 ${age}세 아이`, '보호자로서 아이 정보 처리에 동의하고 휴대폰으로 확인해요']);
    if (diag) items.push(['sensitive', '(필수) 민감정보 처리', '적어 주신 검사·상담 결과는 선생님 매칭에만 써요. 동의하지 않으려면 이전 단계에서 지워 주세요.']);
    if (SG.type === 'tutor') { items.push(['crime', '(필수) 성범죄·아동학대 경력 조회 동의', '아동·청소년 대상 수업에 필요한 확인이에요']); items.push(['policy', '(필수) 선생님 운영정책 · 무료 연수 참여', '']); }
    items.push(['mkt', '(선택) 새 선생님·지원 사업 소식 받기', '']);
    body = `<label class="check" style="border-bottom:.5px solid var(--sep);padding-bottom:14px;font-weight:700;font-size:16.5px"><input type="checkbox" id="all">전체 동의</label>
  ${items.map(([k, n, d]) => `<label class="check"><input type="checkbox" data-term="${k}" ${SG.t[k] ? 'checked' : ''}><span>${n}${d ? `<small>${d}</small>` : ''}</span></label>`).join('')}
  ${SG.type === 'parent' && minor ? `<button class="btn sm ghost" id="phone" style="margin:6px 0 0 34px">${SG.t.phoneOk ? ic('check', 16) + '휴대폰 확인 완료' : '휴대폰으로 보호자 확인'}</button>` : ''}
  <p class="err" id="e3" style="margin-top:10px"></p>`;
  }
  if (st === 4) body = `<div class="done"><img src="${TURTLE}" alt=""><p class="hand" style="font-size:40px;color:var(--ink2);margin:0">반가워요!</p><h1>가입이 끝났어요</h1><p>${SG.type === 'tutor' ? '서류 4종을 확인하면 1~3일 안에 목록에 공개돼요. 그동안 무료 연수를 먼저 들어 보세요.' : '이제 아이에게 맞는 선생님을 찾아볼까요?'}</p></div>`;
  return { title: '회원가입', html: `${backBar(st === 0 || st === 4 ? '' : '회원가입', st === 0 ? 'welcome' : '')}
  ${st < 4 ? bar : ''}<div style="padding:0 20px">${st < 4 ? `<h1 style="font-size:28px;margin:0 0 6px;letter-spacing:-.02em">${title}</h1><p class="help" style="margin:0 0 16px">${['가입 후에는 유형을 바꿀 수 없어요.', '로그인할 때 쓸 이메일이에요.', '정보는 마이에서 언제든 고칠 수 있어요.', '필수 항목만 동의하면 가입할 수 있어요.'][st]}</p>` : ''}${body}</div>
  <div class="bottombar">${st < 4 ? `<button class="btn block" id="sgNext">${st === 3 ? '가입하기' : '다음'}</button>` : `<button class="btn block" id="sgDone">${SG.type === 'tutor' ? '선생님 홈으로' : '시작하기'}</button>`}</div>`,
  mount() {
    const bb = $('[data-back]', view); if (bb && st > 0 && st < 4) { bb.removeAttribute('data-back'); bb.onclick = () => { SG.step--; render(); }; }
    $$('input[name=ty]').forEach(r => r.onchange = () => { SG.type = r.value; });
    $$('[data-tg]', view).forEach(b => b.onclick = () => { const a = SG.i[b.dataset.tg], v = b.dataset.v, i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); b.setAttribute('aria-pressed', String(i < 0)); });
    const kb = $('#kb'); if (kb) { const upd = () => { const a = new Date().getFullYear() - (+kb.value); $('#kage').textContent = `만 ${a}세 무렵이에요.` + (a < 14 ? ' 만 14세 미만이라 다음 단계에서 보호자 동의를 받아요.' : ''); }; kb.onchange = upd; upd(); }
    const tp = $('#tp'); if (tp) tp.oninput = () => { const v = +tp.value; SG.i.price = v; $('#tpv').textContent = won(v); $('#tps').textContent = won(v * TUTOR_SHARE); $('#tpm').textContent = won(v * TUTOR_SHARE * 16); };
    $$('[data-doc]').forEach(inp => inp.onchange = () => { const f = inp.files[0]; if (!f) return; SG.i.files[inp.dataset.doc] = f.name; const l = inp.closest('label'); l.classList.add('ok'); $('small', l).textContent = f.name; $('.us', l).innerHTML = ic('check', 20); });
    const all = $('#all'); if (all) { const boxes = $$('[data-term]'); const sync2 = () => { all.checked = boxes.every(b => b.checked); }; boxes.forEach(b => b.onchange = () => { SG.t[b.dataset.term] = b.checked; sync2(); }); all.onchange = () => { boxes.forEach(b => { b.checked = all.checked; SG.t[b.dataset.term] = all.checked; }); }; sync2(); }
    const ph = $('#phone'); if (ph) ph.onclick = () => { SG.t.phoneOk = true; ph.innerHTML = ic('check', 16) + '휴대폰 확인 완료'; toast('보호자 확인이 끝났어요 (데모)'); };
    const nx = $('#sgNext'); if (nx) nx.onclick = async () => {
      if (st === 0 && !SG.type) { $('#e0').textContent = '유형을 하나 골라 주세요.'; return; }
      if (st === 1) {
        const n = $('#sn').value.trim(), e = $('#se').value.trim(), p = $('#sp').value, p2 = $('#sp2').value; let ok = true; $$('.err', view).forEach(x => x.textContent = ''); $$('.in', view).forEach(x => x.classList.remove('bad'));
        const bad = (id, m) => { $('#e' + id).textContent = m; $('#' + id).classList.add('bad'); ok = false; };
        if (!n) bad('sn', '이름을 적어 주세요.'); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) bad('se', '이메일 모양을 다시 확인해 주세요.');
        if (!(p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p))) bad('sp', '영문과 숫자를 섞어 8자 이상으로 만들어 주세요.'); if (p !== p2) bad('sp2', '비밀번호가 서로 달라요.');
        if (!ok) return; SG.a = { name: n, email: e, pw: p };
      }
      if (st === 2) {
        if (SG.type === 'parent') { const kn = $('#kn').value.trim(); if (!kn) { $('#ekn').textContent = '아이를 부르는 이름을 적어 주세요.'; $('#kn').classList.add('bad'); return; } Object.assign(SG.i, { kn, kb: $('#kb').value, kg: $('#kg').value, kr: $('#kr').value, kd: $('#kd').value.trim(), kx: $('#kx').value, level: $('#klv').value }); }
        if (SG.type === 'tutor') { if (!SG.i.subj.length) { $('#esubj').textContent = '과목을 하나 이상 골라 주세요.'; return; } Object.assign(SG.i, { tr: $('#tr').value, ty2: $('#ty2').value, tgap: $('#tgap').value }); }
        if (SG.type === 'adult') Object.assign(SG.i, { ab: $('#ab').value, ag: $('#ag').checked });
      }
      if (st === 3) {
        const req = $$('[data-term]').filter(b => /\(필수\)/.test(b.parentElement.textContent) && !b.checked); if (req.length) { $('#e3').textContent = '필수 항목에 모두 동의해 주세요.'; return; }
        if ($('#phone') && !SG.t.phoneOk) { $('#e3').textContent = '휴대폰으로 보호자 확인을 해 주세요.'; return; }
        const i = SG.i;
        const body = { type: SG.type, name: SG.a.name, email: SG.a.email, password: SG.a.pw, consents: SG.t,
          kid: SG.type === 'parent' ? { name: i.kn, birth: +i.kb, grade: i.kg, traits: i.traits, subj: i.subj, region: i.kr, dist: i.kd, diag: i.kx, level: i.level || null, age: gradeToAge(i.kg) } : undefined,
          tutor: SG.type === 'tutor' ? { region: i.tr, yrs: +i.ty2 || 0, subj: i.subj, tg: i.tg, modes: i.modes, gap: i.tgap, price: i.price || PRICE_STD, files: i.files } : undefined,
          adult: SG.type === 'adult' ? { birth: +i.ab, learn: i.learn, notify: i.ag } : undefined };
        try { const d = await api('/auth/signup', { method: 'POST', body }); setToken(d.token); UI.cf.level = null; await sync(); }
        catch (err) { $('#e3').textContent = err.message; if (/이메일/.test(err.message)) { SG.step = 1; render(); setTimeout(() => { const e1 = $('#ese'); if (e1) e1.textContent = err.message; }, 0); } return; }
      }
      SG.step++; render();
    };
    const dn = $('#sgDone'); if (dn) dn.onclick = () => { const t = SG.type; SG = null; UI.seen = true; saveUI(); go(t === 'tutor' ? 'thome' : 'home'); };
  } };
}

/* ===================== 홈 ===================== */
function vHome() {
  const u = me(), k = kid(), parent = u && (u.role === 'parent' || u.role === 'admin');
  const bk = parent && S.bookings.find(b => b.status === 'active');
  const near = S.tutors.filter(t => t.region === (parent ? k.region : '서울')).concat(S.tutors.filter(t => t.region !== (parent ? k.region : '서울'))).slice(0, 6);
  let nextCard;
  if (bk) { const t = T[bk.tutorId] || { name: bk.tutorName, subj: ['read'] }; const done = doneOf(bk); const nd = bk.slots.map(s => nextDate(s)).sort((a, b) => a - b)[0]; nextCard = `<a class="next" href="#lessons"><div><p class="k">다음 수업</p><b>${fmtD(nd)} ${fmtH(nd.getHours())}</b><span class="m">${esc(t.name)} 선생님 · ${SUBJ[t.subj[0]].name} · ${MODES[bk.mode].n}</span><div class="prog" aria-label="이번 달 ${done}회 진행"><i style="width:${done / bk.pkg * 100}%"></i></div><span class="m">이번 달 ${done} / ${bk.pkg}회</span></div><img src="${TURTLE}" alt=""></a>`; }
  else nextCard = `<a class="next" href="#tutors"><div><p class="k">처음이라면</p><b>첫 상담은 무료예요</b><span class="m">아이 속도를 아는 선생님과 15분 이야기해 보세요</span></div><img src="${TURTLE}" alt=""></a>`;
  const unread = S.threads.length > 0;
  return { title: '홈', html: `
 <div class="hello"><img class="wm" src="${WORDMARK}" alt="터틀리"><div style="display:flex"><button class="ib plain" data-go="${u ? 'chat' : 'login'}" aria-label="채팅">${ic('chat', 24)}${unread ? '<span class="dot"></span>' : ''}</button><button class="ib plain" id="bell" aria-label="알림">${ic('bell', 24)}</button></div></div>
 <div class="lt"><p class="hand cheer">오늘도 우리는 한 걸음!</p><h1>${parent && S.kids[0] ? `${esc(k.name)}이에게 맞는<br>선생님을 찾아요` : '느린학습자 아이에게<br>꼭 맞는 1:1 선생님'}</h1></div>
 <div class="sec">${nextCard}</div>
 <button class="searchbtn" data-go="tutors" data-focus-search>${ic('search', 20)}어떤 도움이 필요하세요?</button>
 <div class="sec"><div class="cats">${SUBJECTS.map(s => `<button class="cat" data-subj="${s.id}"><span class="ci" style="background:${s.bg};color:${s.fg}">${ic(s.icon, 24)}</span>${s.name}</button>`).join('')}</div></div>
 <div class="sec"><div class="two"><a class="entry" href="#tutors"><div><span class="ei" style="background:#fff;color:var(--tint-text)">${ic('search', 22)}</span><b>선생님<br>직접 찾기</b></div><small>조건으로 좁히고 프로필로 골라요</small></a><a class="entry" href="#request"><div><span class="ei" style="background:#fff;color:#B45500">${ic('apply', 22)}</span><b>수업 신청서<br>쓰기</b></div><small>쓰면 선생님이 먼저 지원해요</small></a></div></div>
 <div style="margin:0 0 22px">${secH(parent ? `${k.region} 가까운 선생님` : '이번 주 추천 선생님', '전체', 'tutors').replace('class="sec-h"', 'class="sec-h" style="padding:0 20px"')}<div class="hs">${near.map(tutorMini).join('')}</div></div>
 <div class="sec"><button class="safe" id="safe"><span class="si">${ic('shield', 24)}</span><span><b>안심 인증 4단계를 통과한 선생님만</b><small>본인 확인 · 성범죄·아동학대 경력 조회 · 신고 · 자격</small></span></button></div>
 <div class="sec">${secH('오늘의 e-도서관', '더 보기', 'library')}<div class="list">${S.library.filter(l => ['l5', 'l9'].includes(l.id)).map(l => { const a = LIBART[l.cat]; return `<button class="row" data-lib="${l.id}"><span class="ri" style="background:${a[1]};color:${a[2]}">${ic(a[0], 18)}</span><span class="rt">${l.t}<small>${l.type} · ${l.min}분 · ${l.lv}단계</small></span><span class="chev">${ic('chevR', 18)}</span></button>`; }).join('')}</div></div>
 <div class="sec">${secH(parent && k.level ? `${levelName(k.level)} 단락 인기 글` : '커뮤니티 인기 글', '더 보기', 'community')}<div id="hp"><p class="cap">불러오는 중…</p></div></div>
 <div class="sec"><button class="card tap" id="rpt" style="display:flex;gap:12px;align-items:center">${ic('report', 26)}<span style="flex:1"><b style="display:block">터틀리 플랫폼 분석 리포트</b><span style="color:var(--muted);font-size:13.5px">시장 · 필수 요건 18 · 가격·수익 산출</span></span>${ic('chevR', 18)}</button></div>`,
  async mount() {
    $$('[data-subj]', view).forEach(b => b.onclick = () => { UI.f = { ...freshUI().f, subj: b.dataset.subj }; saveUI(); go('tutors'); });
    $('[data-focus-search]', view).addEventListener('click', () => { UI.focusSearch = true; });
    $('#safe').onclick = safeSheet;
    $('#bell').onclick = () => {
      const items = [];
      S.lessons.filter(l => !l.confirmed).forEach(l => items.push(['sprout', `${T[l.tutorId]?.name || ''} 선생님이 수업 기록을 올렸어요 · 확인해 주세요`, l.d]));
      S.requests.forEach(r => (r.apps || []).length && items.push(['apply', `신청서에 선생님 ${r.apps.length}명이 지원했어요`, ago(r.createdAt)]));
      sheet({ title: '알림', html: items.length ? `<div class="list">${items.map(([i, t, a]) => `<div class="row"><span class="ri" style="background:var(--tint)">${ic(i, 18)}</span><span class="rt">${t}<small>${a}</small></span></div>`).join('')}</div>` : '<p class="cap">새 알림이 없어요.</p>' });
    };
    $$('[data-lib]', view).forEach(b => b.onclick = () => libSheet(b.dataset.lib)); $('#rpt').onclick = openReport;
    const q = parent && k.level ? `?level=${k.level}` : '';
    const { posts } = await api('/posts' + q);
    const box = $('#hp'); if (box) box.innerHTML = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 2).map(postCard).join('') || '<p class="cap">아직 글이 없어요.</p>';
  } };
}
function safeSheet() { sheet({ title: '안심 인증 4단계', html: `<p class="para" style="margin:0 0 12px">네 가지가 모두 확인돼야 목록에 보여요. 하나라도 빠지면 공개되지 않아요.</p><div class="list">${DOCS.map(([k, n], i) => `<div class="row"><span class="ri" style="background:var(--sky)">${ic(['user', 'shield', 'doc', 'star'][i], 18)}</span><span class="rt">${n}<small>${['신분증으로 본인 확인', '경찰서 회신서로 취업제한 여부 확인', '교육청 신고 확인 (대학 재학생 제외)', '자격증·경력 증빙'][i]}</small></span></div>`).join('')}</div><p class="cap">수업료는 결제 후 보관되고, 수업 완료 확인 뒤 선생님께 정산돼요.</p>` }); }

/* ===================== 튜터 찾기 ===================== */
const FLT = [['subj', '과목'], ['tg', '대상'], ['mode', '방식'], ['region', '지역'], ['price', '수업료'], ['sort', '정렬']];
function fLabel(k) {
  const f = UI.f;
  if (k === 'subj') return f.subj ? SUBJ[f.subj].name : '과목'; if (k === 'tg') return f.tg || '대상'; if (k === 'mode') return f.mode ? MODES[f.mode].n : '방식';
  if (k === 'region') return f.region || '지역'; if (k === 'price') return f.price < PRICE_MAX ? `${(f.price / 10000).toFixed(1).replace('.0', '')}만 원 이하` : '수업료';
  return { rec: '추천순', price: '수업료 낮은순', yrs: '경력 많은순' }[f.sort];
}
function filtered() {
  const f = UI.f, q = f.q.trim();
  const L = S.tutors.filter(t => (!f.subj || t.subj.includes(f.subj)) && (!f.tg || t.tg.includes(f.tg)) && (!f.mode || t.modes.includes(f.mode)) && (!f.region || t.region === f.region) && t.price <= f.price && (!f.trial || t.trial) && (!q || [t.name, t.dist, t.region, t.fit, t.how, t.intro, ...t.subj.map(s => SUBJ[s].name), ...t.certs].join(' ').includes(q)));
  if (f.sort === 'price') L.sort((a, b) => a.price - b.price); else if (f.sort === 'yrs') L.sort((a, b) => b.yrs - a.yrs);
  else { const r = me() && me().role !== 'tutor' ? kid().region : ''; L.sort((a, b) => (b.region === r) - (a.region === r)); }
  return L;
}
function vTutors() {
  return { title: '튜터 찾기', html: `<div class="lt"><h1>튜터 찾기</h1></div>
 <div class="search">${ic('search', 20)}<input id="tq" type="search" placeholder="이름·지역·과목·아이 특성" value="${esc(UI.f.q)}" aria-label="선생님 검색"></div>
 <div class="chips" id="fchips"></div>
 <div class="count" style="margin-top:10px"><span id="tcount"></span><button class="linkbtn" id="freset" style="padding:4px 0;min-height:32px">필터 초기화</button></div>
 <div class="sec" id="tlist"></div>`,
  mount() {
    const draw = () => {
      const f = UI.f;
      $('#fchips').innerHTML = FLT.map(([k]) => { const on = k === 'sort' ? f.sort !== 'rec' : k === 'price' ? f.price < PRICE_MAX : !!f[k]; return `<button class="chip" data-f="${k}" aria-pressed="${on}">${fLabel(k)}${ic('chevD', 14, 2.2)}</button>`; }).join('') + `<button class="chip" data-trial aria-pressed="${f.trial}">체험 가능</button>`;
      const L = filtered(); $('#tcount').textContent = `선생님 ${S.tutors.length}명 중 ${L.length}명`;
      $('#tlist').innerHTML = L.length ? L.map(tutorCard).join('') : `<div class="empty"><img src="${TURTLE}" alt=""><b>조건에 맞는 선생님이 아직 없어요</b><p>조건을 하나 줄이거나, 신청서를 쓰면 선생님이 먼저 지원해요.</p><a class="btn sm" href="#request" style="margin-top:10px">수업 신청서 쓰기</a></div>`;
      $$('[data-f]', view).forEach(b => b.onclick = () => filterSheet(b.dataset.f, draw)); $('[data-trial]', view).onclick = () => { UI.f.trial = !UI.f.trial; saveUI(); draw(); }; saveUI();
    };
    $('#tq').oninput = e => { UI.f.q = e.target.value; draw(); }; $('#freset').onclick = () => { UI.f = freshUI().f; $('#tq').value = ''; draw(); }; draw();
    if (UI.focusSearch) { UI.focusSearch = false; setTimeout(() => $('#tq').focus(), 50); }
  } };
}
function filterSheet(k, cb) {
  const f = UI.f; let opts; const cur = f[k];
  if (k === 'subj') opts = [['', '전체'], ...SUBJECTS.map(s => [s.id, s.name])]; if (k === 'tg') opts = [['', '전체'], ...TARGETS.map(x => [x, x])];
  if (k === 'mode') opts = [['', '전체'], ...Object.entries(MODES).map(([a, m]) => [a, m.n])]; if (k === 'region') opts = [['', '전국'], ...REGIONS.map(x => [x, x])];
  if (k === 'sort') opts = [['rec', '추천순'], ['price', '수업료 낮은순'], ['yrs', '경력 많은순']];
  const name = Object.fromEntries(FLT)[k];
  if (k === 'price') { sheet({ title: '회당 수업료', html: `<div class="calc"><div class="big" id="pv">${won(f.price)} 이하</div><input type="range" id="pr" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${f.price}" aria-label="최대 수업료"><div class="rowc"><span>${won(PRICE_MIN)}</span><span>${won(PRICE_MAX)}</span></div><div class="rowc"><span>월 8회로 하면</span><b id="pm">${won(f.price * 8)} 이하</b></div></div><button class="btn block" style="margin-top:14px" id="ap">적용하기</button>`, mount(sh, close) { const r = $('#pr', sh); r.oninput = () => { $('#pv', sh).textContent = won(+r.value) + ' 이하'; $('#pm', sh).textContent = won(+r.value * 8) + ' 이하'; }; $('#ap', sh).onclick = () => { UI.f.price = +r.value; close(); cb(); }; } }); return; }
  sheet({ title: name, html: `<div class="chips wrap" role="radiogroup">${opts.map(([v, n]) => `<button class="chip" role="radio" data-v="${v}" aria-pressed="${String(cur) === v}" aria-checked="${String(cur) === v}">${n}${k === 'subj' && v ? ` <span class="n">${S.tutors.filter(t => t.subj.includes(v)).length}</span>` : ''}</button>`).join('')}</div>`,
    mount(sh, close) { $$('[data-v]', sh).forEach(b => b.onclick = () => { UI.f[k] = b.dataset.v; close(); cb(); }); } });
}

/* ===================== 선생님 상세 ===================== */
function vTutor(p) {
  const t = T[p.id] || S.tutors[0]; if (!t) return { title: '선생님', html: backBar('', 'tutors') + '<div class="empty"><b>선생님을 찾을 수 없어요</b></div>' };
  const saved = S.saved.tutor.includes(t.id); const on = new Set(t.slots); const cur = CURRICULUM[t.subj[0]] || [];
  return { title: `${t.name} 선생님`, html: `${backBar('', 'tutors', `<button class="ib" id="sv" aria-label="${saved ? '관심 선생님에서 빼기' : '관심 선생님으로 저장'}" aria-pressed="${saved}">${ic('heart', 24, saved ? 2.6 : 1.8)}</button>`)}
 <div class="prof">${av(t, 'lg')}<h1>${esc(t.name)} 선생님</h1><p class="meta">${t.region} ${esc(t.dist)} · ${esc(t.gap)}</p><div class="tags">${t.subj.map(s => `<span class="tag g">${SUBJ[s].name}</span>`).join('')}${t.tg.map(x => `<span class="tag">${x}</span>`).join('')}</div></div>
 <div class="stat3"><div><b>${t.yrs}년</b><span>교육 경력</span></div><div><b>${(t.price / 10000).toFixed(1).replace('.0', '')}만</b><span>회당 수업료</span></div><div><b>${modeTxt(t)}</b><span>수업 방식</span></div></div>
 <div class="sec">${secH('안심 인증')}<div class="ver4">${DOCS.map(([, n]) => `<div>${ic('shield', 20)}<span>${n}<br><b style="font-size:12.5px;color:var(--tint-text)">확인 완료</b></span></div>`).join('')}</div></div>
 <div class="sec">${secH('선생님 소개')}<div class="card"><p class="para">${esc(t.intro)}</p></div></div>
 <div class="sec">${secH('이런 아이와 잘 맞아요')}<div class="two"><div class="card"><p style="margin:0 0 4px;font-size:12.5px;font-weight:700;color:var(--muted)">이런 아이에게</p><p class="para" style="font-size:15px">${esc(t.fit)}</p></div><div class="card" style="background:var(--tint-soft)"><p style="margin:0 0 4px;font-size:12.5px;font-weight:700;color:var(--tint-text)">이렇게 가르쳐요</p><p class="para" style="font-size:15px;color:var(--ink)">${esc(t.how)}</p></div></div></div>
 <div class="sec">${secH('수업 원칙')}<div class="card"><ul class="bul">${t.approach.map(a => `<li>${ic('check', 18, 2.2)}<span>${esc(a)}</span></li>`).join('')}</ul></div></div>
 <div class="sec">${secH('가능한 시간')}<div class="card"><div class="week" role="table" aria-label="요일별 가능 시간"><span></span>${DAYS.map(d => `<span class="h">${d}</span>`).join('')}${HOURS.map(h => `<span class="tm">${h}시</span>${DAYS.map(d => `<span class="c ${on.has(d + ' ' + h) ? 'on' : ''}" ${on.has(d + ' ' + h) ? `aria-label="${d} ${h}시 가능"` : ''}></span>`).join('')}`).join('')}</div><p class="cap" style="padding:0;margin-top:8px">초록 칸이 수업 가능한 시간이에요. 회당 50분.</p></div></div>
 <div class="sec">${secH('한 달 커리큘럼 (8회)')}<div class="card"><ol class="cur">${cur.map(c => `<li>${c}</li>`).join('')}</ol></div></div>
 <div class="sec">${secH('자격·경력')}<div class="card"><div class="tags">${t.certs.map(c => `<span class="tag b">${esc(c)}</span>`).join('')}${t.gap ? `<span class="tag">${esc(t.gap)}</span>` : ''}<span class="tag g">터틀리 연수 수료</span></div></div></div>
 <div class="sec">${secH('수업 후기')}<div id="rv"><div class="card" style="text-align:center;color:var(--muted)"><p style="margin:0">불러오는 중…</p></div></div></div>
 <div class="sec"><button class="card tap" id="trial" style="display:flex;align-items:center;gap:12px"><span class="ri" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:#fff;color:var(--tint-text)">${ic('chat', 22)}</span><span style="flex:1"><b style="display:block">${t.trial ? '무료 상담 · 체험 수업 신청' : '무료 상담 신청'}</b><span style="color:var(--muted);font-size:13.5px">15분 상담 뒤 결정해도 돼요</span></span>${ic('chevR', 18)}</button></div>
 <div class="bottombar"><div class="sum"><small>월 8회</small><b>${won(t.price * 8)}</b></div><button class="btn line sm" id="talk" style="min-height:48px">상담하기</button><button class="btn" id="book" style="min-height:48px">수업 예약</button></div>`,
  async mount() {
    $('#sv').onclick = run(async () => { if (!me()) { UI.next = 'tutor-' + t.id; UI.loginNote = true; saveUI(); go('login'); return; } const r = await api(`/saved/tutor/${t.id}`, { method: 'POST' }); await sync(); toast(r.saved ? '관심 선생님으로 저장했어요' : '관심 선생님에서 뺐어요'); render(); });
    const talk = () => openThread(t.id, `안녕하세요 ${t.name} 선생님, 상담을 신청하고 싶어요.`);
    $('#talk').onclick = talk; $('#trial').onclick = talk;
    $('#book').onclick = () => { UI.draft = { tid: t.id, kid: kid().id, pkg: 8, mode: t.modes[0], slots: [], memo: '', voucher: '' }; saveUI(); go('booking-' + t.id); };
    const { reviews } = await api('/tutors/' + t.id);
    const box = $('#rv'); if (box) box.innerHTML = reviews.length ? reviews.map(r => `<div class="card" style="margin:0 0 8px"><p class="para" style="font-size:15px">“${esc(r.text)}”</p><p class="cap" style="padding:0">${esc(r.by)} · 수업을 마친 보호자</p></div>`).join('') : `<div class="card" style="text-align:center;color:var(--muted)"><p style="margin:0">결제하고 수업을 마친 보호자만 후기를 쓸 수 있어요.<br>아직 공개된 후기가 없어요.</p></div>`;
  } };
}

/* ===================== 수업 신청서 ===================== */
let RQ = null;
function vRequest() {
  const k0 = kid();
  if (!RQ) RQ = { step: 0, kid: k0.id, subj: [...(k0.subj || [])].slice(0, 2), traits: [...(k0.traits || [])], memo: '', mode: 'visit', region: k0.region || '서울', dist: k0.dist || '', slots: [], budget: PRICE_STD, sent: null };
  const st = RQ.step, N = 6;
  if (RQ.sent) {
    const id = RQ.sent; RQ = null; const R = S.requests.find(x => x.id === id) || { apps: [], traits: [] };
    return { title: '신청서', html: `${backBar('지원한 선생님', 'home')}<div class="done" style="padding-top:8px"><img src="${TURTLE}" alt="" style="width:110px"><h1 style="font-size:23px">신청서가 올라갔어요</h1><p>조건에 맞는 선생님에게 알렸어요. 지원이 오면 여기와 채팅으로 보여드려요.</p></div>
  <div class="sec">${secH('지원한 선생님')}<div id="apps"></div></div>`,
    mount() {
      const box = $('#apps'); let i = 0; const apps = R.apps || [];
      if (!apps.length) { box.innerHTML = '<p class="cap">아직 지원한 선생님이 없어요. 지원이 오면 채팅으로 알려드려요.</p>'; return; }
      const add = () => { if (i >= apps.length || !$('#apps')) return; const a = apps[i++]; const t = a.tutor; const d = document.createElement('div'); d.className = 'card'; d.style.margin = '0 0 10px';
        d.innerHTML = `<div style="display:flex;gap:12px;align-items:center">${av(t, 'sm')}<div style="flex:1"><b>${esc(t.name)} 선생님</b><div style="color:var(--muted);font-size:13px">${esc(t.dist)} · 경력 ${t.yrs}년 · 회당 ${won(a.price)}</div></div></div><p class="para" style="font-size:14.5px;margin:10px 0">“${esc(a.message)}”</p><div style="display:flex;gap:8px"><a class="btn sm line" href="#tutor-${t.id}">프로필</a><button class="btn sm" data-chat="${t.id}">채팅하기</button></div>`;
        box.appendChild(d); $('[data-chat]', d).onclick = () => openThread(t.id, '신청서 보고 연락드려요. 상담 가능할까요?'); setTimeout(add, 900); };
      setTimeout(add, 500);
    } };
  }
  const titles = ['누구의 수업인가요?', '어떤 도움이 필요하세요?', '아이는 이런 점이 어려워요', '어디서 수업할까요?', '언제가 좋으세요?', '희망 수업료와 확인'];
  let b = '';
  if (st === 0) b = S.kids.length ? `<div class="pkg">${S.kids.map(k => `<label><input type="radio" name="rk" value="${k.id}" ${RQ.kid === k.id ? 'checked' : ''}><span class="pt"><b>${esc(k.name)}</b><small>${esc(k.grade || '')}</small></span></label>`).join('')}</div><a class="linkbtn" href="#kids">아이 추가하기</a>` : `<div class="empty"><b>먼저 아이 프로필을 추가해 주세요</b><a class="btn sm" href="#kids" style="margin-top:10px">아이 추가하기</a></div>`;
  if (st === 1) b = `<p class="help" style="margin:0 0 10px">두 개까지 고를 수 있어요.</p><div class="cats" style="background:none;padding:0">${SUBJECTS.map(s => `<button class="cat" data-rs="${s.id}" aria-pressed="${RQ.subj.includes(s.id)}" style="${RQ.subj.includes(s.id) ? 'color:var(--tint);font-weight:700' : ''}"><span class="ci" style="background:${RQ.subj.includes(s.id) ? 'var(--tint)' : s.bg};color:${RQ.subj.includes(s.id) ? '#fff' : s.fg}">${ic(s.icon, 24)}</span>${s.name}</button>`).join('')}</div>`;
  if (st === 2) b = `<div class="chips wrap" style="margin-bottom:14px">${TRAITS.map(x => `<button class="chip soft" data-rt="${x}" aria-pressed="${RQ.traits.includes(x)}">${x}</button>`).join('')}</div><div class="field"><label for="rm">선생님께 하고 싶은 말 (선택)</label><textarea class="in" id="rm" placeholder="예: 칭찬받으면 오래 집중해요.">${esc(RQ.memo)}</textarea><p class="help">아이 실명·학교·연락처는 적지 말아 주세요. 전화번호는 자동으로 가려요.</p></div>`;
  if (st === 3) b = `<div class="pay3" style="margin-bottom:14px">${Object.entries(MODES).map(([k, m]) => `<button data-rmode="${k}" aria-pressed="${RQ.mode === k}">${ic(m.i, 24)}${m.n}</button>`).join('')}</div><div class="two" style="gap:10px"><div class="field"><label for="rr">시·도</label><select class="sel in" id="rr">${REGIONS.map(r => `<option ${RQ.region === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="field"><label for="rd">구·시·군</label><input class="in" id="rd" value="${esc(RQ.dist)}" placeholder="예: 마포구"></div></div>`;
  if (st === 4) b = `<p class="help" style="margin:0 0 10px">가능한 칸을 모두 눌러 주세요. 많을수록 지원이 빨라요.</p><div class="card"><div class="week">${'<span></span>' + DAYS.map(d => `<span class="h">${d}</span>`).join('')}${HOURS.map(h => `<span class="tm">${h}시</span>${DAYS.map(d => `<button class="c" data-rsl="${d} ${h}" aria-pressed="${RQ.slots.includes(d + ' ' + h)}" aria-label="${d} ${h}시"></button>`).join('')}`).join('')}</div></div><p class="help" id="rslc" style="margin-top:8px">${RQ.slots.length}칸 선택</p>`;
  if (st === 5) b = `<div class="calc"><label for="rb" style="font-weight:600;font-size:14px">회당 희망 수업료</label><div class="big" id="rbv">${won(RQ.budget)} 안팎</div><input id="rb" type="range" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${RQ.budget}"><div class="rowc"><span>월 8회면</span><b id="rbm">${won(RQ.budget * 8)}</b></div></div>
   <div class="list" style="margin-top:14px">${[['아이', esc((S.kids.find(k => k.id === RQ.kid) || k0).name)], ['도움', RQ.subj.map(s => SUBJ[s].name).join(', ') || '-'], ['특성', RQ.traits.join(', ') || '-'], ['장소', `${MODES[RQ.mode].n} · ${RQ.region} ${esc(RQ.dist)}`], ['시간', RQ.slots.map(slotTxt).join(', ') || '-']].map(([a, v]) => `<div class="row noicon"><span class="rt" style="flex:0 0 52px;color:var(--muted);font-size:14px">${a}</span><span style="font-size:15px">${v}</span></div>`).join('')}</div>`;
  return { title: '수업 신청서', html: `${backBar('수업 신청서', st === 0 ? 'home' : '')}<div class="stepper">${Array.from({ length: N }, (_, i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>
  <div style="padding:0 20px"><h1 style="font-size:26px;margin:0 0 14px;letter-spacing:-.02em">${titles[st]}</h1>${b}<p class="err" id="rqe" style="margin-top:8px"></p></div>
  <div class="bottombar"><button class="btn block" id="rqn" ${st === 0 && !S.kids.length ? 'disabled' : ''}>${st === N - 1 ? '신청서 올리기' : '다음'}</button></div>`,
  mount() {
    const bb = $('[data-back]', view); if (bb && st > 0) { bb.removeAttribute('data-back'); bb.onclick = () => { RQ.step--; render(); }; }
    $$('input[name=rk]').forEach(r => r.onchange = () => RQ.kid = r.value);
    $$('[data-rs]').forEach(x => x.onclick = () => { const v = x.dataset.rs, i = RQ.subj.indexOf(v); if (i > -1) RQ.subj.splice(i, 1); else { if (RQ.subj.length >= 2) RQ.subj.shift(); RQ.subj.push(v); } render(); });
    $$('[data-rt]').forEach(x => x.onclick = () => { const v = x.dataset.rt, i = RQ.traits.indexOf(v); if (i > -1) RQ.traits.splice(i, 1); else RQ.traits.push(v); x.setAttribute('aria-pressed', String(i < 0)); });
    $$('[data-rmode]').forEach(x => x.onclick = () => { RQ.mode = x.dataset.rmode; $$('[data-rmode]').forEach(y => y.setAttribute('aria-pressed', String(y === x))); });
    $$('[data-rsl]').forEach(x => x.onclick = () => { const v = x.dataset.rsl, i = RQ.slots.indexOf(v); if (i > -1) RQ.slots.splice(i, 1); else RQ.slots.push(v); x.setAttribute('aria-pressed', String(i < 0)); $('#rslc').textContent = RQ.slots.length + '칸 선택'; });
    const rb = $('#rb'); if (rb) rb.oninput = () => { RQ.budget = +rb.value; $('#rbv').textContent = won(RQ.budget) + ' 안팎'; $('#rbm').textContent = won(RQ.budget * 8); };
    $('#rqn').onclick = async () => {
      const e = $('#rqe');
      if (st === 1 && !RQ.subj.length) { e.textContent = '도움이 필요한 과목을 하나 골라 주세요.'; return; }
      if (st === 2) RQ.memo = $('#rm').value;
      if (st === 3) { RQ.region = $('#rr').value; RQ.dist = $('#rd').value.trim(); }
      if (st === 4 && !RQ.slots.length) { e.textContent = '가능한 시간을 한 칸 이상 골라 주세요.'; return; }
      if (st === N - 1) {
        try { const { request } = await api('/requests', { method: 'POST', body: { kidId: RQ.kid, subj: RQ.subj, traits: RQ.traits, memo: RQ.memo, mode: RQ.mode, region: RQ.region, dist: RQ.dist, slots: RQ.slots, budget: RQ.budget } }); await sync(); RQ.sent = request.id; toast('신청서를 올렸어요'); render(); }
        catch (err) { e.textContent = err.message; }
        return;
      }
      RQ.step++; render();
    };
  } };
}

/* ===================== 예약 ===================== */
function vBooking(p) {
  const t = T[p.id] || S.tutors[0];
  if (!UI.draft || UI.draft.tid !== t.id) UI.draft = { tid: t.id, kid: kid().id, pkg: 8, mode: t.modes[0], slots: [], memo: '', voucher: '' };
  const d = UI.draft; if (!t.modes.includes(d.mode)) d.mode = t.modes[0]; if (!S.kids.some(k => k.id === d.kid)) d.kid = kid().id;
  const per = d.pkg / 4; d.slots = d.slots.filter(s => t.slots.includes(s)).slice(0, per);
  return { title: '수업 예약', html: `${backBar('수업 예약', 'tutor-' + t.id)}
 <div class="sec" style="margin-top:6px"><div class="card" style="display:flex;gap:12px;align-items:center">${av(t)}<div style="flex:1"><b style="font-size:17px">${esc(t.name)} 선생님</b><div style="color:var(--muted);font-size:13.5px">${t.subj.map(s => SUBJ[s].name).join(' · ')} · 회당 ${won(t.price)}</div></div></div></div>
 <div class="sec">${secH('누구의 수업인가요?')}${S.kids.length ? `<div class="pkg">${S.kids.map(k => `<label><input type="radio" name="bk" value="${k.id}" ${d.kid === k.id ? 'checked' : ''}><span class="pt"><b>${esc(k.name)}</b><small>${esc(k.grade || '')} · ${(k.traits || []).slice(0, 1).join('')}</small></span></label>`).join('')}</div>` : '<a class="btn sm ghost" href="#kids">아이 프로필 추가하기</a>'}</div>
 <div class="sec">${secH('한 달 수업 횟수')}<div class="pkg">${PKGS.map(([n, a, b2]) => `<label><input type="radio" name="bp" value="${n}" ${d.pkg === n ? 'checked' : ''}><span class="pt"><b>${a}</b><small>${b2}</small></span><span class="pp">${won(t.price * n)}</span></label>`).join('')}</div></div>
 <div class="sec">${secH('수업 방식')}<div class="pay3" style="grid-template-columns:repeat(${t.modes.length},1fr)">${t.modes.map(m => `<button data-bm="${m}" aria-pressed="${d.mode === m}">${ic(MODES[m].i, 24)}${MODES[m].n}</button>`).join('')}</div>${d.mode === 'visit' ? '<p class="cap">방문 수업은 보호자가 집에 계실 때 진행하길 권해요.</p>' : ''}</div>
 <div class="sec">${secH(`시간 고르기 · 주 ${per}회`)}<div class="card"><div class="slots">${t.slots.map(s => `<button class="chip" data-bs="${s}" aria-pressed="${d.slots.includes(s)}">${slotTxt(s)}</button>`).join('')}</div><p class="help" id="bsc" style="margin-top:10px">${d.slots.length} / ${per}개 선택${t.slots.length < per ? ' · 이 선생님은 가능한 시간이 부족해요. 횟수를 줄여 주세요.' : ''}</p></div></div>
 <div class="sec">${secH('선생님께 전할 말')}<textarea class="in" id="bmemo" placeholder="예: 첫 수업은 좋아하는 공룡 책으로 해주세요.">${esc(d.memo)}</textarea></div>
 <div class="bottombar"><div class="sum"><small id="bsum">${d.pkg}회 · ${won(t.price)} × ${d.pkg}</small><b id="btot">${won(t.price * d.pkg)}</b></div><button class="btn" id="bgo" ${d.slots.length === per && S.kids.length ? '' : 'disabled'}>결제로</button></div>`,
  mount() {
    $$('input[name=bk]').forEach(r => r.onchange = () => { d.kid = r.value; saveUI(); });
    $$('input[name=bp]').forEach(r => r.onchange = () => { d.pkg = +r.value; d.slots = d.slots.slice(0, d.pkg / 4); saveUI(); render(); });
    $$('[data-bm]').forEach(b => b.onclick = () => { d.mode = b.dataset.bm; saveUI(); render(); });
    $$('[data-bs]').forEach(b => b.onclick = () => { const v = b.dataset.bs, i = d.slots.indexOf(v); if (i > -1) d.slots.splice(i, 1); else { if (d.slots.length >= per) { toast(`주 ${per}회라 ${per}개까지 고를 수 있어요`); return; } d.slots.push(v); } saveUI(); b.setAttribute('aria-pressed', String(i < 0)); $('#bsc').textContent = `${d.slots.length} / ${per}개 선택`; $('#bgo').disabled = d.slots.length !== per; });
    $('#bmemo').oninput = e => { d.memo = e.target.value; saveUI(); };
    $('#bgo').onclick = () => go('checkout');
  } };
}

/* ===================== 결제 ===================== */
function vCheckout() {
  const d = ensureDraft(), t = T[d.tid] || S.tutors[0], k = S.kids.find(x => x.id === d.kid) || kid();
  if (d.slots.length !== d.pkg / 4) d.slots = t.slots.slice(0, d.pkg / 4);
  const base = t.price * d.pkg, disc = d.voucher === 'TURTLE10' ? Math.round(base * .1) : 0, total = base - disc; d.method = d.method || 'card';
  const first = d.slots.map(s => nextDate(s)).sort((a, b) => a - b)[0];
  return { title: '결제', html: `${backBar('결제', 'booking-' + t.id)}
 <div class="sec" style="margin-top:6px"><div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">${av(t, 'sm')}<div><b>${esc(t.name)} 선생님 · ${SUBJ[t.subj[0]].name}</b><div style="color:var(--muted);font-size:13.5px">${esc(k.name)} · ${MODES[d.mode].n} 수업</div></div></div>
  <div class="bill"><div><span>수업</span><span>월 ${d.pkg}회 (주 ${d.pkg / 4}회)</span></div><div><span>시간</span><span>${d.slots.map(slotTxt).join(', ')}</span></div><div><span>첫 수업</span><span>${first ? fmtD(first) : '-'}</span></div></div></div></div>
 <div class="sec">${secH('결제 금액')}<div class="card"><div class="bill"><div><span>수업료 ${won(t.price)} × ${d.pkg}회</span><span>${won(base)}</span></div>${disc ? `<div class="minus"><span>바우처 할인</span><span>−${won(disc)}</span></div>` : ''}<div class="tot"><span>총 결제</span><span>${won(total)}</span></div></div>
  <div class="split" aria-label="정산 비율"><i class="a" style="width:80%">선생님 ${won(total * .8)}</i><i class="b" style="width:20%">터틀리</i></div><p class="cap" style="padding:0">터틀리 20%(${won(total * .2)})는 안전거래 보관·매칭·학습자료 운영에 쓰여요.</p></div></div>
 <div class="sec">${secH('지원 바우처')}<div class="card"><div style="display:flex;gap:8px"><input class="in" id="vc" placeholder="지자체·기관 바우처 코드" value="${esc(d.voucher)}" style="min-height:46px" aria-label="바우처 코드"><button class="btn sm" id="vca" style="min-height:46px">적용</button></div><p class="help" style="margin-top:6px">데모 코드 TURTLE10 — 10% 할인</p></div></div>
 <div class="sec">${secH('결제 수단')}<div class="pay3">${[['card', 'card', '카드'], ['bank', 'bank', '계좌이체'], ['easy', 'zap', '간편결제']].map(([v, i, n]) => `<button data-pm="${v}" aria-pressed="${d.method === v}">${ic(i, 24)}${n}</button>`).join('')}</div></div>
 <div class="sec"><div class="notice b">${ic('lock', 20)}<span><b>안전거래</b> — 결제금은 터틀리가 보관하고, 회차마다 수업 완료를 확인한 뒤 선생님께 정산해요.</span></div></div>
 <div class="sec">${secH('환불 기준')}<div class="card"><table class="rf"><thead><tr><th>그만둔 때</th><th>돌려받는 금액</th></tr></thead><tbody>${[['수업 시작 전', '전액'], ['전체의 1/3 지나기 전', '2/3'], ['전체의 1/2 지나기 전', '1/2'], ['1/2 지난 뒤', '없음']].map(([a, b2], i) => `<tr data-rr="${i}"><td>${a}</td><td>${b2}</td></tr>`).join('')}</tbody></table>
  <label for="rfr" style="display:block;font-weight:600;font-size:14px;margin:14px 0 2px">진행한 수업 <span id="rfn">0</span>회일 때</label><input type="range" id="rfr" min="0" max="${d.pkg}" value="0"><div class="rowc" style="display:flex;justify-content:space-between;font-size:15px"><span>돌려받는 금액</span><b id="rfa">${won(total)}</b></div></div></div>
 <div class="sec">${secH('동의')}<div class="card" style="padding:4px 16px"><label class="check" style="font-weight:700;border-bottom:.5px solid var(--sep)"><input type="checkbox" id="call">전체 동의</label>${[['refund', '(필수) 결제·환불 규정 확인'], ['share', '(필수) 선생님에게 아이 학년·특성 제공 (이름·학교 제외)'], ['escrow', '(필수) 안전거래 이용약관']].map(([k2, x]) => `<label class="check"><input type="checkbox" data-ct="${k2}">${x}</label>`).join('')}<p class="err" id="ce" style="padding-bottom:8px"></p></div></div>
 <div class="bottombar"><div class="sum"><small>총 결제</small><b>${won(total)}</b></div><button class="btn" id="pay">${won(total)} 결제하기</button></div>`,
  mount() {
    $('#vca').onclick = () => { const v = $('#vc').value.trim().toUpperCase(); if (v && v !== 'TURTLE10') { toast('확인되지 않은 코드예요'); return; } d.voucher = v; saveUI(); toast(v ? '바우처가 적용됐어요' : '바우처를 뺐어요'); render(); };
    $$('[data-pm]').forEach(b => b.onclick = () => { d.method = b.dataset.pm; saveUI(); $$('[data-pm]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    const rf = $('#rfr'), upd = () => { const n = +rf.value, rate = refundRate(n, d.pkg); $('#rfn').textContent = n; $('#rfa').textContent = won(total * rate); const idx = n === 0 ? 0 : n / d.pkg < 1 / 3 ? 1 : n / d.pkg < 1 / 2 ? 2 : 3; $$('[data-rr]').forEach(tr => tr.classList.toggle('hit', +tr.dataset.rr === idx)); }; rf.oninput = upd; upd();
    const boxes = $$('[data-ct]'), all = $('#call'); boxes.forEach(b => b.onchange = () => all.checked = boxes.every(x => x.checked)); all.onchange = () => boxes.forEach(b => b.checked = all.checked);
    $('#pay').onclick = () => {
      if (!boxes.every(b => b.checked)) { $('#ce').textContent = '필수 항목에 모두 동의해 주세요.'; return; } $('#ce').textContent = '';
      const mname = { card: '카드', bank: '계좌이체', easy: '간편결제' }[d.method];
      sheet({ title: '데모 결제창', html: `<div class="pg" id="pgb"><p style="margin:0;color:var(--muted)">${mname} 결제</p><p style="font-size:30px;font-weight:700;margin:4px 0 2px;letter-spacing:-.02em">${won(total)}</p><p style="margin:0 0 14px;color:var(--muted);font-size:14px">${esc(t.name)} 선생님 · 월 ${d.pkg}회</p><button class="btn block" id="pgo">결제 승인</button><p class="help" style="margin-top:10px">데모라 실제로 결제되지 않아요.</p></div>`,
        mount(sh, close) {
          $('#pgo', sh).onclick = async () => {
            $('#pgb', sh).innerHTML = '<div class="spin" role="status" aria-label="결제 중"></div><p style="margin:0">결제하고 있어요</p>';
            try {
              const consents = Object.fromEntries(boxes.map(b => [b.dataset.ct, b.checked]));
              const { booking } = await api('/bookings', { method: 'POST', body: { tutorId: t.id, kidId: d.kid, pkg: d.pkg, mode: d.mode, slots: d.slots, memo: d.memo, voucher: d.voucher, method: d.method, consents } });
              await sync(); UI.lastPaid = booking.id; UI.draft = null; saveUI(); setTimeout(() => { close(); go('paid'); }, 600);
            } catch (err) { close(); toast(err.message); }
          };
        } });
    };
  } };
}

/* ===================== 결제 완료 ===================== */
function vPaid() {
  const b = S.bookings.find(x => x.id === UI.lastPaid) || S.bookings[0]; if (!b) return vHome();
  const t = T[b.tutorId] || { name: b.tutorName, id: b.tutorId }; const first = b.slots.map(s => nextDate(s)).sort((a, c) => a - c)[0];
  return { title: '결제 완료', html: `<div class="done" style="padding-top:20px"><img src="${TURTLE}" alt=""><p class="hand" style="font-size:38px;color:var(--ink2);margin:0">첫 걸음, 축하해요!</p><h1>결제가 끝났어요</h1><p>${fmtD(first)} ${fmtH(first.getHours())}에 ${esc(t.name)} 선생님과 첫 수업이 있어요.</p></div>
 <div class="sec">${secH('영수증')}<div class="list">${[['결제 번호', b.payId], ['금액', won(b.amount) + (b.discount ? ` (바우처 −${won(b.discount)})` : '')], ['수단', b.method], ['수업', `월 ${b.pkg}회 · ${b.slots.map(slotTxt).join(', ')}`], ['정산', '회차마다 수업 완료 확인 후 선생님께 80%']].map(([a, v]) => `<div class="row noicon"><span class="rt" style="flex:0 0 72px;color:var(--muted);font-size:14px">${a}</span><span style="font-size:15px">${esc(v)}</span></div>`).join('')}</div></div>
 <div class="sec">${secH('첫 수업 준비')}<div class="card" style="padding:4px 16px">${['조용하고 밝은 공간 한 곳', '연필·공책·좋아하는 책 한 권', b.mode === 'visit' ? '방문 수업 시간에 보호자 집에 있기' : '화상 수업 링크 미리 열어보기'].map(x => `<label class="check"><input type="checkbox">${x}</label>`).join('')}</div></div>
 <div class="sec" style="display:grid;gap:8px"><button class="btn block" id="pc">${esc(t.name)} 선생님과 채팅</button><button class="btn block ghost" data-go="home">홈으로</button></div>`,
  mount() { $('#pc').onclick = () => openThread(t.id, '결제했어요! 첫 수업 잘 부탁드려요.'); } };
}

/* ===================== 커뮤니티 (지역 채널 × 게시판 × 아이 단계·나이대) ===================== */
function vCommunity() {
  const cf = UI.cf; if (cf.level === null) cf.level = '';
  const on = [cf.level && ['level', levelName(cf.level)], cf.age && ['age', ageName(cf.age)], cf.region !== '전국' && ['region', cf.region]].filter(Boolean);
  return { title: '커뮤니티', html: `<div class="lt"><h1>커뮤니티</h1><p>전국 · 17개 시·도, 아이 단계별로 보호자와 선생님이 함께해요</p></div>
 <button class="fbar" id="fopen" aria-haspopup="dialog"><span class="fi">${ic('filter', 20, 2)}</span><span class="ft"><b>${on.length ? '내가 고른 조건으로 보는 중' : '우리 아이에 맞는 글만 보기'}</b><small>아이 단계 · 나이 · 지역</small></span>${on.length ? `<span class="fn">${on.length}</span>` : ''}<span class="fgo">${on.length ? '바꾸기' : '고르기'}${ic('chevR', 16, 2.2)}</span></button>
 ${on.length ? `<div class="chips fsel" aria-label="고른 조건">${on.map(([k, n]) => `<button class="chip soft" aria-pressed="true" data-rm="${k}" aria-label="${n} 조건 빼기">${esc(n)}${ic('x', 14, 2.4)}</button>`).join('')}<button class="linkbtn" data-rm="all" style="min-height:38px;padding:0 6px;font-size:14px">모두 지우기</button></div>` : ''}
 <div class="seg" role="group" aria-label="게시판" style="grid-auto-columns:auto;margin-top:12px">${BOARDS.map(b => `<button data-cb="${b}" aria-pressed="${cf.board === b}" style="padding:0 4px">${b}</button>`).join('')}</div>
 <div class="sec" id="plist"><p class="cap">불러오는 중…</p></div><p class="cap" style="padding:0 20px 12px">아이 이름·학교·연락처는 쓰지 않아요. 단계는 진단명이 없어도 가장 가까운 곳을 고르면 돼요.</p>
 <button class="fab" id="wr" aria-label="글쓰기">${ic('pen', 26)}</button>`,
  async mount() {
    const draw = async () => {
      const qs = new URLSearchParams({ region: cf.region, board: cf.board, ...(cf.level && { level: cf.level }), ...(cf.age && { age: cf.age }) });
      const { posts } = await api('/posts?' + qs); const box = $('#plist'); if (!box) return;
      box.innerHTML = posts.length ? posts.map(postCard).join('') : `<div class="empty"><img src="${TURTLE}" alt=""><b>아직 글이 없어요</b><p>${on.length ? '조건을 하나 빼 보거나, ' : ''}이 단락의 첫 글을 남겨 주세요.</p></div>`;
    };
    $('#fopen').onclick = () => commFilterSheet();
    $$('[data-rm]').forEach(b => b.onclick = () => { const k = b.dataset.rm; if (k === 'level' || k === 'all') cf.level = ''; if (k === 'age' || k === 'all') cf.age = ''; if (k === 'region' || k === 'all') cf.region = '전국'; saveUI(); render(); });
    $$('[data-cb]').forEach(b => b.onclick = () => { cf.board = b.dataset.cb; saveUI(); $$('[data-cb]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    $('#wr').onclick = writeSheet; await draw();
  } };
}
// 커뮤니티 조건 고르기: 고르는 동안은 바로 바뀌지 않고, 아래 버튼에 몇 개 글이 나오는지 보여준 뒤 한 번에 적용
function commFilterSheet() {
  const cf = UI.cf; const d = { level: cf.level || '', age: cf.age || '', region: cf.region || '전국' }; const myLv = kid().level; const g = S.groups;
  const lvBtn = (k, n, r, c) => `<button class="lvc" data-lv="${k}" aria-pressed="${d.level === k}">${myLv && myLv === k ? '<span class="mine">우리 아이</span>' : ''}<b>${n}</b><small>${r}</small><span class="n">글 ${c}개</span></button>`;
  sheet({ title: '조건 고르기', html: `<div class="field"><span class="lab">아이 단계</span><div class="lvgrid">${lvBtn('', '모든 단계', '전체 글', g.total)}${g.levels.map(l => lvBtn(l.key, l.name, l.range, l.postCount)).join('')}</div><p class="lvdesc" id="lvd" hidden></p></div>
  <div class="field"><span class="lab">아이 나이</span><div class="chips wrap">${[['', '모든 나이'], ...AGES.map(a => [a.key, a.name])].map(([k, n]) => `<button class="chip" data-ag="${k}" aria-pressed="${d.age === k}">${n}</button>`).join('')}</div></div>
  <div class="field"><span class="lab">지역</span><div class="chips wrap">${['전국', ...REGIONS].map(r => `<button class="chip" data-cr="${r}" aria-pressed="${d.region === r}">${r}</button>`).join('')}</div></div>
  <div class="fact"><button class="btn line" id="freset2">처음으로</button><button class="btn" id="fapply">글 보기</button></div>`, mount(sh, close) {
    const pick = (sel, key, v) => { d[key] = v; $$(sel, sh).forEach(x => x.setAttribute('aria-pressed', String(x.dataset[sel.slice(6, 8)] === v))); upd(); };
    let seq = 0;
    const upd = async () => {
      const lv = LEVELS.find(l => l.key === d.level); const ld = $('#lvd', sh);
      ld.hidden = !lv; if (lv) ld.innerHTML = `<b>${lv.name}</b> · ${lv.desc}${me()?.role === 'parent' && S.kids[0] && myLv !== lv.key ? ` <button class="linkbtn" id="setMine" style="padding:0;min-height:0;color:var(--tint-text);font-weight:600">우리 아이 단계로 설정</button>` : ''}`;
      const sm = $('#setMine', sh); if (sm) sm.onclick = run(async () => { await api(`/kids/${S.kids[0].id}`, { method: 'PATCH', body: { level: d.level } }); await sync(); toast(`우리 아이 단계를 ${levelName(d.level)}(으)로 정했어요`); sm.remove(); });
      const my = ++seq; const qs = new URLSearchParams({ region: d.region, board: cf.board, ...(d.level && { level: d.level }), ...(d.age && { age: d.age }) });
      try { const { posts } = await api('/posts?' + qs); if (my === seq) $('#fapply', sh).textContent = `글 ${posts.length}개 보기`; } catch { /* 개수는 못 세도 적용은 가능 */ }
    };
    $$('[data-lv]', sh).forEach(b => b.onclick = () => pick('[data-lv]', 'level', b.dataset.lv));
    $$('[data-ag]', sh).forEach(b => b.onclick = () => pick('[data-ag]', 'age', b.dataset.ag));
    $$('[data-cr]', sh).forEach(b => b.onclick = () => pick('[data-cr]', 'region', b.dataset.cr));
    $('#freset2', sh).onclick = () => { pick('[data-lv]', 'level', ''); pick('[data-ag]', 'age', ''); pick('[data-cr]', 'region', '전국'); };
    $('#fapply', sh).onclick = () => { Object.assign(cf, d); saveUI(); close(); render(); };
    sh.appendChild($('.fact', sh)); // 버튼은 스크롤과 상관없이 시트 맨 아래에 항상 보이게
    upd();
  } });
}
function writeSheet() {
  if (!me()) { UI.next = 'community'; UI.loginNote = true; saveUI(); go('login'); return; }
  const k = kid(); const lv0 = UI.cf.level || k.level || ''; const ag0 = UI.cf.age || k.age || '';
  sheet({ title: '글쓰기', html: `<div class="field"><span class="lab">게시판</span><div class="chips wrap">${BOARDS.slice(1).map((b, i) => `<button class="chip" data-wb="${b}" aria-pressed="${i === 0}">${b}</button>`).join('')}</div></div>
  <div class="two" style="gap:10px"><div class="field"><label for="wlv">아이 단계</label><select class="sel in" id="wlv"><option value="">단계 없이</option>${LEVELS.map(l => `<option value="${l.key}" ${lv0 === l.key ? 'selected' : ''}>${l.name}</option>`).join('')}</select></div>
  <div class="field"><label for="wag">나이대</label><select class="sel in" id="wag"><option value="">나이 없이</option>${AGES.map(a => `<option value="${a.key}" ${ag0 === a.key ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div></div>
  <div class="field"><label for="wrg">채널</label><select class="sel in" id="wrg">${['전국', ...REGIONS].map(r => `<option ${r === UI.cf.region ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
  <div class="field"><label for="wt">제목</label><input class="in" id="wt" maxlength="40"><p class="err" id="wte"></p></div>
  <div class="field"><label for="wbd">내용</label><textarea class="in" id="wbd" placeholder="아이 이름·학교·연락처는 쓰지 말아 주세요."></textarea><p class="err" id="wbe"></p></div>
  <button class="btn block" id="wsend">올리기</button>`, mount(sh, close) {
    let board = '질문'; $$('[data-wb]', sh).forEach(b => b.onclick = () => { board = b.dataset.wb; $$('[data-wb]', sh).forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('#wsend', sh).onclick = async () => {
      const ti = $('#wt', sh).value.trim(), bd = $('#wbd', sh).value.trim(); $('#wte', sh).textContent = ti ? '' : '제목을 적어 주세요.'; $('#wbe', sh).textContent = bd ? '' : '내용을 적어 주세요.'; if (!ti || !bd) return;
      try {
        const r = await api('/posts', { method: 'POST', body: { board, region: $('#wrg', sh).value, title: ti, body: bd, level: $('#wlv', sh).value || null, age: $('#wag', sh).value || null } });
        await sync(); close(); toast(r.masked ? '연락처는 가려서 올렸어요' : '글을 올렸어요'); render();
      } catch (err) { $('#wbe', sh).textContent = err.message; }
    };
  } });
}
function vPost(p) {
  return { title: '게시글', html: `${backBar('', 'community', `<button class="ib plain" id="rep" aria-label="신고">${ic('flag', 22)}</button>`)}<div id="pbody"><p class="cap" style="padding:20px">불러오는 중…</p></div>
 <form class="compose" id="cf"><textarea id="ct" rows="1" placeholder="${me() ? '따뜻한 한 줄을 남겨 주세요' : '로그인하고 댓글 달기'}" aria-label="댓글"></textarea><button class="send" aria-label="댓글 보내기">${ic('send', 20)}</button></form>`,
  async mount() {
    let P;
    const draw = () => {
      const liked = P.liked;
      $('#pbody').innerHTML = `<div class="sec" style="margin-top:6px"><div class="card"><div class="post" style="padding:0;background:none"><div class="pm"><span class="tag ${P.board === '선생님께' ? 'b' : 'g'}">${P.board}</span><span class="tag">${P.region}</span>${P.level ? `<span class="pill-lv">${levelName(P.level)}${P.age ? ' · ' + ageName(P.age) : ''}</span>` : ''}</div></div><h1 style="font-size:22px;margin:4px 0 6px;letter-spacing:-.02em">${esc(P.title)}</h1><p style="margin:0 0 12px;color:var(--muted);font-size:13.5px">${esc(P.nick)} · ${ago(P.createdAt)}</p><p class="para">${esc(P.body)}</p>
   <div style="display:flex;gap:8px;margin-top:14px"><button class="chip soft" id="lk" aria-pressed="${liked}">${ic('heart', 16, liked ? 2.6 : 1.8)}공감 ${P.likeCount}</button>${P.mine ? '<button class="chip" id="del">삭제</button>' : ''}</div></div></div>
   <div class="sec">${secH(`댓글 ${P.cmtCount}`)}${P.comments.length ? P.comments.map(c => `<div class="card" style="margin:0 0 8px;${c.tutor ? 'background:var(--sky-soft)' : ''}"><p style="margin:0 0 4px;font-size:13.5px;font-weight:700;display:flex;gap:6px;align-items:center">${esc(c.n)}${c.tutor ? '<span class="tag b">인증 선생님 답변</span>' : ''}</p><p class="para" style="font-size:15px">${esc(c.t)}</p></div>`).join('') : '<p class="cap">첫 댓글을 남겨 주세요.</p>'}${P.cmtCount > P.comments.length ? `<p class="cap">이전 댓글 ${P.cmtCount - P.comments.length}개는 예시라 보이지 않아요.</p>` : ''}</div>`;
      $('#lk').onclick = run(async () => { if (!me()) { UI.next = 'post-' + P.id; UI.loginNote = true; saveUI(); go('login'); return; } P = (await api(`/posts/${P.id}/like`, { method: 'POST' })).post; draw(); });
      const del = $('#del'); if (del) del.onclick = run(async () => { if (await ask({ title: '이 글을 지울까요?', ok: '지우기', warn: true })) { await api(`/posts/${P.id}`, { method: 'DELETE' }); await sync(); toast('글을 지웠어요'); go('community'); } });
    };
    P = (await api('/posts/' + p.id)).post; draw();
    $('#rep').onclick = run(async () => { if (!me()) { go('login'); return; } if (await ask({ title: '이 글을 신고할까요?', body: '운영팀이 24시간 안에 확인하고, 그동안 내 화면에서는 숨겨요.', ok: '신고', warn: true })) { await api(`/posts/${P.id}/report`, { method: 'POST' }); toast('신고가 접수됐어요'); go('community'); } });
    $('#cf').onsubmit = run(async e => { e.preventDefault(); if (!me()) { UI.next = 'post-' + P.id; UI.loginNote = true; saveUI(); go('login'); return; } const v = $('#ct').value.trim(); if (!v) return; P = (await api(`/posts/${P.id}/comments`, { method: 'POST', body: { text: v } })).post; $('#ct').value = ''; draw(); setTimeout(() => view.scrollTop = view.scrollHeight, 30); });
  } };
}

/* ===================== e-도서관 ===================== */
function vLibrary() {
  const lf = UI.lf;
  return { title: 'e-도서관', html: `<div class="lt"><h1>e-도서관</h1><p>보고, 듣고, 따라 하는 단계별 자료</p></div>
 <div class="search">${ic('search', 20)}<input id="lq" type="search" placeholder="자료 이름으로 찾기" value="${esc(lf.q)}" aria-label="자료 검색"></div>
 <div class="chips" style="margin-bottom:10px"><button class="chip soft" data-lc="" aria-pressed="${!lf.cat}">전체</button>${Object.entries(LIBCAT).map(([k, n]) => `<button class="chip soft" data-lc="${k}" aria-pressed="${lf.cat === k}">${n}</button>`).join('')}</div>
 <div class="seg" role="group" aria-label="난이도">${[0, 1, 2, 3].map(v => `<button data-lv="${v}" aria-pressed="${lf.lv === v}">${v ? v + '단계' : '모든 단계'}</button>`).join('')}</div>
 <div class="count"><span id="lcount"></span><button class="linkbtn" id="lreset" style="padding:4px 0;min-height:32px">필터 초기화</button></div>
 <div class="lgrid" id="lgrid"></div>`,
  mount() {
    const draw = () => {
      const q = lf.q.trim(); const L = S.library.filter(l => (!lf.cat || l.cat === lf.cat) && (!lf.lv || l.lv === lf.lv) && (!q || (l.t + l.d).includes(q))); $('#lcount').textContent = `자료 ${S.library.length}개 중 ${L.length}개`;
      $('#lgrid').innerHTML = L.length ? L.map(l => { const a = LIBART[l.cat]; return `<button class="litem" data-lib="${l.id}"><span class="art" style="background:${a[1]};color:${a[2]};display:grid"><span class="lv tag" style="background:var(--cell)">${l.lv}단계</span>${ic(a[0], 64, 1.5)}</span><span class="lt2" style="display:block"><b>${l.t}</b><small>${l.type} · ${l.min}분${S.saved.lib.includes(l.id) ? ' · 저장함' : ''}</small></span></button>`; }).join('') : `<div class="empty" style="grid-column:1/-1"><b>조건에 맞는 자료가 없어요</b></div>`;
      $$('[data-lib]', view).forEach(b => b.onclick = () => libSheet(b.dataset.lib, draw)); saveUI();
    };
    $('#lq').oninput = e => { lf.q = e.target.value; draw(); };
    $$('[data-lc]').forEach(b => b.onclick = () => { lf.cat = b.dataset.lc; $$('[data-lc]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    $$('[data-lv]').forEach(b => b.onclick = () => { lf.lv = +b.dataset.lv; $$('[data-lv]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
    $('#lreset').onclick = () => { UI.lf = freshUI().lf; saveUI(); render(); }; draw();
  } };
}
function libSheet(id, cb) {
  const l = S.library.find(x => x.id === id); const a = LIBART[l.cat]; const sv = () => S.saved.lib.includes(l.id);
  sheet({ title: l.t, html: `<div style="background:${a[1]};color:${a[2]};border-radius:18px;aspect-ratio:16/9;display:grid;place-items:center;margin-bottom:12px;position:relative">${ic(a[0], 84, 1.4)}${l.type === '영상' ? `<span style="position:absolute;width:56px;height:56px;border-radius:50%;background:rgba(0,0,0,.55);display:grid;place-items:center;color:#fff">${ic('play', 26, 2)}</span>` : ''}</div>
  <div class="tags" style="margin-bottom:8px"><span class="tag g">${LIBCAT[l.cat]}</span><span class="tag">${l.type}</span><span class="tag">${l.min}분</span><span class="tag b">${l.lv}단계</span></div>
  <p class="para" style="margin:0 0 14px" data-say>${l.d}</p><ol class="steps">${l.steps.map(s => `<li data-say>${s}</li>`).join('')}</ol>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px"><button class="btn ghost" id="lread">${ic('vol', 20)}읽어주기</button><button class="btn line" id="lsave">${sv() ? '저장 취소' : '저장하기'}</button></div>
  ${role() === 'tutor' ? '<button class="btn block" id="luse" style="margin-top:8px">다음 수업에 붙이기</button>' : ''}`,
  mount(sh) {
    $('#lread', sh).onclick = () => speak(l.t + '. ' + l.d + ' ' + l.steps.map((s, i) => (i + 1) + '단계. ' + s).join(' '), $('.steps', sh));
    $('#lsave', sh).onclick = run(async () => { if (!me()) { toast('로그인하면 저장할 수 있어요'); return; } const r = await api(`/saved/lib/${l.id}`, { method: 'POST' }); await sync(); $('#lsave', sh).textContent = r.saved ? '저장 취소' : '저장하기'; toast(r.saved ? '자료를 저장했어요' : '저장을 취소했어요'); cb && cb(); });
    const u = $('#luse', sh); if (u) u.onclick = () => { const b = S.bookings.find(x => x.status === 'active'); toast(b ? `${b.kid?.name || ''} 다음 수업 자료로 붙였어요` : '진행 중인 수업이 없어요'); };
  } });
}

/* ===================== 마이 ===================== */
function vMy() {
  const u = me(), r = role();
  const row = (g, i, bg, t, sub, extra = '') => `<button class="row" ${g.startsWith('#') ? `id="${g.slice(1)}"` : `data-go="${g}"`}><span class="ri" style="background:${bg}">${ic(i, 18)}</span><span class="rt">${t}${sub ? `<small>${sub}</small>` : ''}</span>${extra}<span class="chev">${ic('chevR', 18)}</span></button>`;
  const common = `<div class="sec"><div class="list">${row('easy', 'text', '#5E604F', '쉬운 화면', `글자 ${['보통', '크게', '아주 크게'][[1, 1.15, 1.3].indexOf(UI.fs)] || '보통'} · 읽어주기 ${UI.read ? '켬' : '끔'}`)}${row('#myrpt', 'report', '#2F7468', '플랫폼 분석 리포트', '시장 · 필수 요건 · 가격·수익 산출')}${u ? row('#center', 'shield', '#4F7A5A', '터틀리 안심센터', '신고 · 환불 · 이용 문의') : ''}</div></div>`;
  if (!u) return { title: '마이', html: `<div class="lt"><h1>마이</h1></div><div class="me"><img src="${TURTLE}" alt="" style="width:64px"><div><b>반가워요!</b><small>로그인하면 아이에게 맞는 선생님을 추천해요</small></div></div>
  <div class="sec" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><button class="btn" data-go="login">로그인</button><button class="btn ghost" data-go="signup">회원가입</button></div>${common}`, mount() { $('#myrpt').onclick = openReport; } };
  const lbl = { parent: '보호자', tutor: '선생님', admin: '관리자' }[r]; const bk = S.bookings.find(b => b.status === 'active');
  let mid = '';
  if (r === 'parent' || r === 'admin') mid = `<div class="kpi"><div><b>${bk ? doneOf(bk) + '/' + bk.pkg : '0'}</b><span>이번 달 수업</span></div><div><b>${S.kids.length}명</b><span>아이 프로필</span></div><div><b>${S.bookings.length}건</b><span>결제</span></div></div>
  <div class="sec"><div class="list">${row('kids', 'heart', '#A33461', '아이 관리', S.kids.map(k => esc(k.name) + (k.level ? ` · ${levelName(k.level)}` : '')).join(', ') || '아이를 추가해 주세요')}${row('lessons', 'chart', '#3D7B35', '수업 기록', S.lessons.some(l => !l.confirmed) ? '확인할 기록이 있어요' : '오늘의 한 걸음 · 집중 시간')}${row('chat', 'chat', '#3A7568', '채팅', `${S.threads.length}개 대화`)}${row('payments', 'receipt', '#8A6200', '결제 내역', '환불 신청')}${row('request', 'apply', '#2F7468', '수업 신청서 쓰기', S.requests.length ? `올린 신청서 ${S.requests.length}건` : '선생님이 먼저 지원해요')}</div></div>`;
  if (r === 'tutor') { const e = S.earnings || { done: 0, expected: 0 }; const dc = S.myTutor ? Object.values(S.myTutor.docs || {}).filter(Boolean).length : 0;
    mid = `<div class="kpi"><div><b>${e.done}회</b><span>이번 달 완료</span></div><div><b>${(e.expected / 10000).toFixed(1).replace('.0', '')}만</b><span>예상 정산</span></div><div><b>${dc}/4</b><span>안심 인증</span></div></div>
  <div class="sec"><div class="list">${row('thome', 'wallet', '#3D7B35', '선생님 홈', '정산 · 가능 시간 · 수익 계산')}${row('students', 'apply', '#3A7568', '학생 찾기', '열린 신청서에 지원하기')}${row('chat', 'chat', '#2F7468', '채팅', `${S.threads.length}개 대화`)}${row('#lib-t', 'sprout', '#8A6200', '무료 튜터 연수', 'e-도서관 튜터 연수 자료')}</div></div>`; }
  return { title: '마이', html: `<div class="lt"><h1>마이</h1></div><div class="me"><span class="av" style="background:var(--tint)">${esc(u.name[0])}</span><div style="flex:1"><b>${esc(u.name)}${r === 'tutor' ? ' 선생님' : ' 님'}</b><small>${esc(u.email)}</small></div><span class="tag g">${lbl}</span></div>${mid}${common}
  <div class="sec">${secH('데모 체험')}<div class="list">${r !== 'tutor' ? row('#sw-t', 'sprout', '#3D7B35', '선생님 화면으로 보기', '') : row('#sw-p', 'heart', '#A33461', '보호자 화면으로 보기', '')}${row('#sw-a', 'shield', '#1D1D1F', '관리자 화면', '튜터 서류 심사')}${row('#reset', 'refresh', '#6C6C70', '화면 설정 처음으로', '글자 크기·필터·작성 중인 예약')}</div></div>
  <div class="sec"><button class="btn block danger" id="lo">로그아웃</button></div>`,
  mount() {
    $('#myrpt').onclick = openReport;
    $('#center').onclick = () => openThread(null, '');
    const st = $('#sw-t'); if (st) st.onclick = run(async () => { await loginAs('tutor'); toast('선생님 화면으로 바꿨어요'); go('thome'); });
    const sp = $('#sw-p'); if (sp) sp.onclick = run(async () => { await loginAs('parent'); toast('보호자 화면으로 바꿨어요'); go('home'); });
    $('#sw-a').onclick = run(async () => { await loginAs('admin'); toast('관리자 화면으로 바꿨어요'); go('admin'); });
    const lt = $('#lib-t'); if (lt) lt.onclick = () => { UI.lf = { q: '', cat: 'tutor', lv: 0 }; saveUI(); go('library'); };
    $('#reset').onclick = async () => { if (await ask({ title: '화면 설정을 처음으로 돌릴까요?', body: '글자 크기·필터·작성 중인 예약이 초기화돼요. 저장된 데이터는 그대로예요.', ok: '돌리기', warn: true })) { const seen = UI.seen; UI = freshUI(); UI.seen = seen; saveUI(); applyA11y(); toast('처음 상태로 돌렸어요'); render(); } };
    $('#lo').onclick = async () => { if (await ask({ title: '로그아웃할까요?', ok: '로그아웃', warn: true })) { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setToken(null); UI.cf.level = null; saveUI(); await sync(); go('home'); } };
  } };
}

/* ===================== 수업 기록 ===================== */
function vLessons() {
  const k = kid(); const L = S.lessons.filter(l => l.kidId === k.id);
  if (!L.length) return { title: '수업 기록', html: `${backBar('수업 기록', 'my')}<div class="empty" style="padding-top:60px"><img src="${TURTLE}" alt=""><b>아직 수업 기록이 없어요</b><p>수업이 끝나면 선생님이 오늘의 한 걸음을 남겨요.</p><a class="btn sm" href="#tutors" style="margin-top:10px">튜터 찾기</a></div>` };
  const chron = [...L].reverse(); const mx = Math.max(...L.map(x => x.focus)); const pend = L.filter(l => !l.confirmed);
  const months = {}; L.forEach(x => { const m = x.d.slice(0, 7); (months[m] = months[m] || []).push(x); });
  return { title: '수업 기록', html: `${backBar('수업 기록', 'my')}
 <div class="lt" style="padding-top:4px"><p class="hand cheer">${esc(k.name)}의 한 걸음</p><h1 style="font-size:26px">${L.length}번의 수업, ${L.length}번의 한 걸음</h1></div>
 ${pend.length ? `<div class="sec"><div class="notice b">${ic('info', 20)}<span>선생님이 올린 기록 <b>${pend.length}개</b>를 확인해 주세요. 확인한 회차만 선생님께 정산돼요.</span></div></div>` : ''}
 <div class="sec"><div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline"><b>집중 시간</b><span style="color:var(--muted);font-size:13px">분 · 회차별</span></div>
  <div class="bars" role="img" aria-label="집중 시간이 ${chron[0].focus}분에서 ${chron[chron.length - 1].focus}분으로 바뀌었어요">${chron.slice(-10).map(x => `<div><em>${x.focus}</em><i style="height:${x.focus / mx * 100}%"></i><span>${+x.d.slice(8)}일</span></div>`).join('')}</div>
  <p style="margin:10px 0 0;font-size:15px">첫 수업 <b>${chron[0].focus}분</b> → 최근 <b>${chron[chron.length - 1].focus}분</b>${chron[chron.length - 1].focus >= chron[0].focus * 2 ? ', 두 배로 늘었어요.' : chron[chron.length - 1].focus > chron[0].focus ? ', 조금씩 늘고 있어요.' : '.'}</p></div></div>
 ${Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([m, arr]) => `<p class="mon">${m.slice(0, 4)}년 ${+m.slice(5)}월 · ${arr.length}회</p>${arr.map(x => { const md = MOOD[x.mood]; return `<div class="lesson"><div class="d"><b>${+x.d.slice(8)}</b><small>${'일월화수목금토'[new Date(x.d).getDay()]}요일</small></div><div><h3>${esc(x.title)}</h3>${x.note ? `<p data-say>${esc(x.note)}</p>` : ''}<div style="display:flex;gap:10px;margin-top:6px;font-size:12.5px;color:var(--muted);flex-wrap:wrap"><span class="mood" style="color:${md.c}">${ic(md.i, 16)}${md.n}</span><span>집중 ${x.focus}분</span><span>${esc(T[x.tutorId]?.name || '')} 선생님</span></div><div class="step" data-say>${ic('sprout', 18)}${esc(x.step)}</div>
   <div style="display:flex;gap:8px;margin-top:8px">${x.confirmed ? `<span class="tag g">${ic('check', 12, 3)} 확인함</span>` : `<button class="btn sm" data-cf="${x.id}">수업 확인하기</button>`}<button class="chip soft" data-ht="${x.id}" aria-pressed="${!!x.heart}" style="min-height:34px">${ic('heart', 14, x.heart ? 2.6 : 1.8)}${x.heart ? '하트 보냄' : '하트'}</button></div></div></div>`; }).join('')}`).join('')}`,
  mount() {
    $$('[data-cf]').forEach(b => b.onclick = run(async () => { if (await ask({ title: '이 수업을 확인할까요?', body: '확인하면 이 회차 수업료의 80%가 선생님께 정산돼요.', ok: '확인' })) { await api(`/lessons/${b.dataset.cf}/confirm`, { method: 'POST' }); await sync(); toast('수업을 확인했어요'); render(); } }));
    $$('[data-ht]').forEach(b => b.onclick = run(async () => { await api(`/lessons/${b.dataset.ht}/heart`, { method: 'POST' }); await sync(); render(); }));
  } };
}

/* ===================== 채팅 ===================== */
function vChat() {
  return { title: '채팅', html: `${backBar('채팅', 'my')}<div class="sec" style="margin-top:8px">${S.threads.length ? `<div class="list">${S.threads.map(th => { const last = [...th.msgs].reverse().find(m => !m.sys) || th.msgs[0] || { t: '' };
    return `<a class="row" href="#room-${th.id}" style="min-height:72px">${th.center ? `<span class="av sm" style="background:var(--sky)">${ic('shield', 18)}</span>` : av({ name: th.name, hue: th.hue }, 'sm')}<span class="rt"><b style="font-weight:600">${esc(th.name)}</b><small style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(last.t)}</small></span><span class="rv" style="font-size:12.5px">${last.at ? atTxt(last.at) : ''}</span></a>`; }).join('')}</div>` : `<div class="empty"><img src="${TURTLE}" alt=""><b>아직 대화가 없어요</b><p>선생님 프로필에서 상담하기를 눌러 보세요.</p></div>`}
  <button class="btn block ghost" id="ctr" style="margin-top:12px">${ic('shield', 20)}터틀리 안심센터에 문의</button></div>
 <p class="cap" style="padding:0 20px">전화번호는 서로 공개되지 않아요.</p>`, mount() { $('#ctr').onclick = () => openThread(null, ''); } };
}
function vRoom(p) {
  const th0 = S.threads.find(x => x.id === p.id); if (!th0) return { title: '채팅', html: `${backBar('채팅', 'chat')}<div class="empty"><b>대화를 찾을 수 없어요</b></div>` };
  const quick = th0.center ? ['환불하고 싶어요', '선생님을 신고하고 싶어요', '결제 영수증이 필요해요'] : role() === 'tutor' ? ['오늘 수업 기록 올렸어요', '다음 수업 시간 괜찮으세요?', '감사합니다!'] : ['수업 시간 바꿀 수 있을까요?', '오늘 수업 어땠나요?', '감사합니다!'];
  return { title: th0.name, html: `${backBar(esc(th0.name), 'chat', th0.tutorId && role() !== 'tutor' ? `<a class="ib" href="#tutor-${th0.tutorId}" aria-label="프로필 보기">${ic('user', 22)}</a>` : '')}
 <div class="msgs" id="msgs"></div>
 <div class="quick">${quick.map(q => `<button class="chip" data-q="${q}">${q}</button>`).join('')}</div>
 <form class="compose" id="mf"><textarea id="mt" rows="1" placeholder="메시지" aria-label="메시지"></textarea><button class="send" aria-label="보내기">${ic('send', 20)}</button></form>`,
  mount() {
    let th = th0, n = -1;
    const draw = () => { if (n === th.msgs.length) return; n = th.msgs.length; $('#msgs').innerHTML = th.msgs.map(m => m.sys ? `<div class="bub sys">${esc(m.t)}</div>` : `<div class="bub ${m.me ? 'me' : 'you'}" data-say>${esc(m.t)}</div><span class="tm-s ${m.me ? '' : 'l'}">${atTxt(m.at)}</span>`).join(''); setTimeout(() => view.scrollTop = view.scrollHeight, 10); };
    draw();
    const send = run(async v => { v = v.trim(); if (!v) return; $('#mt').value = ''; th = (await api(`/threads/${th.id}/messages`, { method: 'POST', body: { text: v } })).thread; draw(); });
    $('#mf').onsubmit = e => { e.preventDefault(); send($('#mt').value); };
    $('#mt').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send($('#mt').value); } };
    $$('[data-q]').forEach(b => b.onclick = () => send(b.dataset.q));
    poll = setInterval(async () => { if (curRoute !== 'room') return clearInterval(poll); try { th = (await api(`/threads/${th.id}`)).thread; draw(); } catch { /* ignore */ } }, 4000);
  } };
}

/* ===================== 쉬운 화면 ===================== */
function vEasy() {
  return { title: '쉬운 화면', html: `${backBar('쉬운 화면', 'my')}
 <div class="sec" style="margin-top:8px"><div class="easy-prev"><p class="hand" style="font-size:30px;color:var(--ink2);margin:0 0 4px">미리 보기</p><p style="margin:0;font-size:17px" data-say>오늘은 받침 없는 글자 다섯 개를 읽어요. 다 읽으면 선생님이 박수를 쳐 줄 거예요.</p></div></div>
 <div class="sec">${secH('글자 크기')}<div class="seg" style="margin:0" role="group" aria-label="글자 크기">${[[1, '보통'], [1.15, '크게'], [1.3, '아주 크게']].map(([v, n]) => `<button data-fs="${v}" aria-pressed="${UI.fs === v}">${n}</button>`).join('')}</div></div>
 <div class="sec"><div class="list"><div class="row"><span class="ri" style="background:#3D7B35">${ic('vol', 18)}</span><span class="rt">읽어주기<small>켜면 글을 누를 때 소리로 읽어요</small></span><label class="sw"><input type="checkbox" id="rd" ${UI.read ? 'checked' : ''} aria-label="읽어주기"><span></span></label></div>
  <div class="row"><span class="ri" style="background:#3A7568">${ic('eye', 18)}</span><span class="rt">움직임 줄이기<small>화면 전환 효과를 꺼요</small></span><label class="sw"><input type="checkbox" id="mo" ${UI.motion ? 'checked' : ''} aria-label="움직임 줄이기"><span></span></label></div></div></div>
 <div class="sec"><button class="btn block ghost" id="try">${ic('vol', 20)}미리 보기 읽어주기</button></div>`,
  mount() {
    $$('[data-fs]').forEach(b => b.onclick = () => { UI.fs = +b.dataset.fs; saveUI(); applyA11y(); $$('[data-fs]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('#rd').onchange = e => { UI.read = e.target.checked; saveUI(); applyRead(); toast(UI.read ? '글을 누르면 읽어줘요' : '읽어주기를 껐어요'); };
    $('#mo').onchange = e => { UI.motion = e.target.checked; saveUI(); applyA11y(); }; $('#try').onclick = () => speak($('.easy-prev [data-say]').textContent, $('.easy-prev'));
  } };
}

/* ===================== 선생님 홈 ===================== */
function vTHome() {
  const t = S.myTutor; if (!t) return { title: '선생님 홈', html: '<div class="empty"><b>선생님 프로필이 없어요</b></div>' };
  const e = S.earnings || { done: 0, planned: 0, pending: 0, perSession: t.price * TUTOR_SHARE, expected: 0 }; const ses = e.done + e.planned || 1;
  const open = (S.requests || []).filter(r => r.subj.some(s => t.subj.includes(s)) && !r.applied);
  const active = S.bookings.filter(b => b.status === 'active');
  const upcoming = active.flatMap(b => b.slots.map(s => ({ b, at: nextDate(s) }))).sort((a, b) => a.at - b.at).slice(0, 4);
  const fri = new Date(); fri.setDate(fri.getDate() + ((5 - fri.getDay() + 7) % 7 || 7));
  const avail = new Set(t.slots);
  const pendingTutor = t.status !== 'approved';
  return { title: '선생님 홈', html: `<div class="hello"><img class="wm" src="${WORDMARK}" alt="터틀리"><div style="display:flex"><button class="ib plain" data-go="chat" aria-label="채팅">${ic('chat', 24)}${S.threads.length ? '<span class="dot"></span>' : ''}</button></div></div>
 <div class="lt"><p class="hand cheer">오늘도 한 걸음, 선생님!</p><h1>${esc(t.name)} 선생님,<br>${upcoming.length ? `다가오는 수업 ${upcoming.length}개예요` : '아직 예약된 수업이 없어요'}</h1></div>
 ${pendingTutor ? `<div class="sec"><div class="notice">${ic('info', 20)}<span>안심 인증 서류 4종을 확인하고 있어요. 승인되면 튜터 찾기 목록에 공개되고 신청서에 지원할 수 있어요.</span></div></div>` : ''}
 <div class="sec"><div class="calc"><p style="margin:0;font-size:14px;color:var(--muted)">이번 달 예상 정산</p><div class="big">${won(e.expected)}</div><div class="rowc"><span>완료 ${e.done}회 · 남은 ${e.planned}회 × ${won(t.price)} × 80%</span></div><div class="split" style="margin-top:12px"><i class="a" style="width:${e.done / ses * 100}%">완료 ${e.done}</i><i class="b" style="width:${e.planned / ses * 100}%">예정 ${e.planned}</i></div><p class="cap" style="padding:0">다음 정산일 ${fmtD(fri)} · 보호자가 확인한 회차만${e.pending ? ` · 확인 대기 ${e.pending}회` : ''}</p></div></div>
 <div class="sec">${secH('다가오는 수업')}${upcoming.length ? `<div class="list">${upcoming.map(({ b, at }) => `<div class="row"><span class="ri" style="background:var(--tint)">${ic(MODES[b.mode].i, 18)}</span><span class="rt"><b style="font-weight:600">${fmtD(at)} ${fmtH(at.getHours())} · ${esc(b.kid?.name || '')}</b><small>${esc(b.kid?.grade || '')} · ${MODES[b.mode].n} · ${S.lessons.filter(l => l.bookingId === b.id).length}/${b.pkg}회 기록</small></span><button class="btn sm ghost" data-rec="${b.id}">기록</button></div>`).join('')}</div>` : '<p class="cap">예약이 들어오면 여기에 보여요.</p>'}</div>
 <div class="sec">${secH(`새 신청서 ${open.length}건`, '전체', 'students')}${open.slice(0, 2).map(reqCard).join('') || '<p class="cap">내 과목에 맞는 새 신청서가 없어요.</p>'}</div>
 <div class="sec">${secH('가능한 시간')}<div class="card"><div class="week">${'<span></span>' + DAYS.map(d => `<span class="h">${d}</span>`).join('')}${HOURS.map(h => `<span class="tm">${h}시</span>${DAYS.map(d => `<button class="c" data-av="${d} ${h}" aria-pressed="${avail.has(d + ' ' + h)}" aria-label="${d} ${h}시"></button>`).join('')}`).join('')}</div><p class="help" id="avc" style="margin-top:8px">주 ${avail.size}칸 열림 · 누르면 바로 저장되고 예약 화면에 반영돼요</p></div></div>
 <div class="sec">${secH('수익 계산기')}<div class="calc"><div class="big" id="icv">-</div><p class="help" id="ih" style="margin:2px 0 10px"></p>
  <label class="rowc" for="is"><span>학생 수</span><b id="isv">2명</b></label><input type="range" id="is" min="1" max="6" value="2">
  <label class="rowc" for="ip"><span>회당 수업료</span><b id="ipv">${won(t.price)}</b></label><input type="range" id="ip" min="${PRICE_MIN}" max="${PRICE_MAX}" step="1000" value="${t.price}">
  <div class="seg" style="margin:10px 0 0" role="group" aria-label="학생당 월 횟수">${[4, 8, 12].map(n => `<button data-in="${n}" aria-pressed="${n === 8}">월 ${n}회</button>`).join('')}</div></div></div>
 <div class="sec">${secH('안심 인증 · 연수')}<div class="card"><div class="vsteps">${DOCS.map(([k, n]) => `<div class="${t.docs?.[k] ? 'ok' : ''}"><span class="n">${t.docs?.[k] ? ic('check', 14, 3) : '·'}</span><span>${n}</span><span class="tag ${t.docs?.[k] ? 'g' : 'y'}">${t.docs?.[k] ? '완료' : '확인 중'}</span></div>`).join('')}<div><span class="n">5</span><span>무료 튜터 연수</span><button class="tag y" data-go="library" style="border:0">자료 보기</button></div></div></div></div>`,
  mount() {
    $$('[data-av]').forEach(b => b.onclick = run(async () => { const { slots } = await api('/tutor/avail', { method: 'PATCH', body: { slot: b.dataset.av } }); S.myTutor.slots = slots; b.setAttribute('aria-pressed', String(slots.includes(b.dataset.av))); $('#avc').textContent = `주 ${slots.length}칸 열림 · 누르면 바로 저장되고 예약 화면에 반영돼요`; }));
    let per = 8; const calc = () => { const n = +$('#is').value, p = +$('#ip').value, m = n * per * p * TUTOR_SHARE; $('#isv').textContent = n + '명'; $('#ipv').textContent = won(p); $('#icv').textContent = won(m); $('#ih').textContent = `한 달 ${n * per}회 · 주 약 ${(n * per * 50 / 60 / 4.3).toFixed(1)}시간 · 회당 정산 ${won(p * TUTOR_SHARE)}`; };
    $('#is').oninput = calc; $('#ip').oninput = calc; $$('[data-in]').forEach(b => b.onclick = () => { per = +b.dataset.in; $$('[data-in]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); calc(); }); calc();
    $$('[data-rec]').forEach(b => b.onclick = () => recSheet(b.dataset.rec)); bindReq();
  } };
}
function recSheet(bid) {
  const b = S.bookings.find(x => x.id === bid); const n = S.lessons.filter(l => l.bookingId === bid).length; const t = S.myTutor; const next = (CURRICULUM[t.subj[0]] || [])[n] || `${n + 1}회차`;
  sheet({ title: `${esc(b.kid?.name || '')} 수업 기록`, html: `<p class="cap" style="padding:0;margin:0 0 10px">${n + 1}회차 · 커리큘럼: ${next}</p><div class="field"><label for="rs1">오늘의 한 걸음</label><input class="in" id="rs1" placeholder="예: 한 쪽을 끝까지 읽었어요"></div>
 <div class="field"><label for="rs0">수업 메모 (선택)</label><textarea class="in" id="rs0" placeholder="보호자에게 남길 한두 줄"></textarea></div>
 <div class="field"><span class="lab">아이 기분</span><div class="pay3">${Object.entries(MOOD).map(([k, m], i) => `<button data-md="${k}" aria-pressed="${i === 0}" style="color:${m.c}">${ic(m.i, 24)}${m.n}</button>`).join('')}</div></div>
 <div class="field"><label for="rs2">집중 시간(분)</label><input class="in" id="rs2" type="number" min="1" max="60" value="15" inputmode="numeric"></div>
 <button class="btn block" id="rsg">기록 올리고 수업 완료</button><p class="help" style="margin-top:8px">보호자가 확인하면 이 회차가 정산 대상이 돼요.</p>`,
  mount(sh, close) {
    let mood = 'good'; $$('[data-md]', sh).forEach(x => x.onclick = () => { mood = x.dataset.md; $$('[data-md]', sh).forEach(y => y.setAttribute('aria-pressed', String(y === x))); });
    $('#rsg', sh).onclick = run(async () => { const step = $('#rs1', sh).value.trim(); if (!step) { $('#rs1', sh).classList.add('bad'); $('#rs1', sh).focus(); return; }
      await api(`/bookings/${bid}/lessons`, { method: 'POST', body: { step, note: $('#rs0', sh).value, mood, focus: +$('#rs2', sh).value, title: next } }); await sync(); close(); toast('기록을 올렸어요. 보호자 확인을 기다려요'); render(); });
  } });
}

/* ===================== 학생 찾기 ===================== */
const reqCard = r => `<div class="card" style="margin:0 0 10px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="font-size:16.5px">${esc(r.childLabel)}</b><span style="color:var(--muted);font-size:12.5px">${ago(r.createdAt)} · 지원 ${r.apps}명</span></div>
 <div class="tags" style="margin:8px 0">${r.subj.map(s => `<span class="tag g">${SUBJ[s].name}</span>`).join('')}${r.traits.map(x => `<span class="tag">${x}</span>`).join('')}</div>
 ${r.memo ? `<p class="para" style="font-size:14.5px;margin:0 0 8px">${esc(r.memo)}</p>` : ''}
 <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 10px;font-size:14px;color:var(--ink2)"><span style="color:var(--muted)">장소</span><span>${MODES[r.mode].n} · ${r.region} ${esc(r.dist)}</span><span style="color:var(--muted)">시간</span><span>${r.slots.map(slotTxt).join(', ')}</span><span style="color:var(--muted)">수업료</span><span>회당 ${(r.budget / 10000).toFixed(1).replace('.0', '')}만 원 안팎</span></div>
 <button class="btn sm ${r.applied ? 'ghost' : ''} block" style="margin-top:12px" data-apply="${r.id}" ${r.applied ? 'disabled' : ''}>${r.applied ? '지원했어요' : '지원하기'}</button></div>`;
function bindReq() {
  $$('[data-apply]', view).forEach(b => b.onclick = () => {
    const r = S.requests.find(x => x.id === b.dataset.apply); const t = S.myTutor;
    sheet({ title: '지원하기', html: `<p class="para" style="margin:0 0 10px">${esc(r.childLabel)} · ${r.subj.map(s => SUBJ[s].name).join(', ')} · ${r.slots.map(slotTxt).join(', ')}</p><div class="field"><label for="am">보호자에게 보낼 한 줄</label><textarea class="in" id="am">안녕하세요, ${SUBJ[r.subj[0]].name} 수업 ${t.yrs}년 경력의 ${esc(t.name)} 선생님이에요. ${esc(t.how)}.</textarea></div>
  <div class="field"><label for="ap2">제안 수업료 (회당)</label><input class="in" id="ap2" type="number" step="1000" min="${PRICE_MIN}" max="${PRICE_MAX}" value="${t.price}" inputmode="numeric"></div><button class="btn block" id="ago">지원 보내기</button>`,
      mount(sh, close) { $('#ago', sh).onclick = run(async () => { await api(`/requests/${r.id}/apply`, { method: 'POST', body: { message: $('#am', sh).value, price: +$('#ap2', sh).value } }); await sync(); close(); toast('지원을 보냈어요. 보호자 채팅으로 전달됐어요'); render(); }); } });
  });
}
function vStudents() {
  const t = S.myTutor || { subj: [] }; const fs = UI.sf || 'mine';
  const L = (S.requests || []).filter(r => fs === 'all' || r.subj.some(s => t.subj.includes(s)));
  return { title: '학생 찾기', html: `<div class="lt"><h1>학생 찾기</h1><p>보호자가 올린 수업 신청서예요</p></div>
 <div class="seg" role="group" aria-label="신청서 범위"><button data-sf="mine" aria-pressed="${fs === 'mine'}">내 과목</button><button data-sf="all" aria-pressed="${fs === 'all'}">전체</button></div>
 <div class="sec">${L.map(reqCard).join('') || '<div class="empty"><b>열린 신청서가 없어요</b></div>'}</div><p class="cap" style="padding:0 20px 12px">아이 이름·학교는 공개되지 않아요.</p>`,
  mount() { $$('[data-sf]').forEach(b => b.onclick = () => { UI.sf = b.dataset.sf; saveUI(); render(); }); bindReq(); } };
}

/* ===================== 관리자 ===================== */
function vAdmin() {
  const Q = S.queue || [];
  return { title: '관리자', html: `${backBar('튜터 심사', 'my')}
 <div class="kpi" style="margin-top:8px"><div><b>${Q.length}건</b><span>심사 대기</span></div><div><b>${S.tutors.length}명</b><span>공개 선생님</span></div><div><b>${(S.reports || []).length}건</b><span>신고된 글</span></div></div>
 <div class="sec">${secH('심사 대기')}${Q.length ? Q.map(a => `<div class="card" style="margin:0 0 10px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">${esc(a.name)} 선생님</b><span style="color:var(--muted);font-size:12.5px">${ago(a.createdAt)} 신청</span></div><p style="margin:2px 0 8px;color:var(--muted);font-size:13.5px">${esc(a.region)} · ${esc(a.subj)}</p>
  ${DOCS.map(([k, n]) => `<label class="check" style="padding:7px 0"><input type="checkbox" data-doc="${a.id}:${k}" ${a.docs[k] ? 'checked' : ''}>${n}${a.docs[k] ? '' : ' <span class="tag r">미제출·미확인</span>'}</label>`).join('')}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><button class="btn sm line" data-rej="${a.id}">반려</button><button class="btn sm" data-ok="${a.id}" ${Object.values(a.docs).every(Boolean) ? '' : 'disabled'}>승인 · 공개</button></div></div>`).join('') : `<div class="empty"><img src="${TURTLE}" alt=""><b>심사할 신청이 없어요</b></div>`}</div>
 <div class="sec">${secH('신고')}${(S.reports || []).length ? `<div class="list">${S.reports.map(r => `<a class="row" href="#post-${r.id}"><span class="ri" style="background:var(--red)">${ic('flag', 18)}</span><span class="rt">${esc(r.title)}<small>신고 ${r.count}건 · 신고한 사람 화면에서는 숨김</small></span><span class="tag y">확인 필요</span></a>`).join('')}</div>` : '<p class="cap">신고된 글이 없어요.</p>'}</div>`,
  mount() {
    $$('[data-doc]').forEach(c => c.onchange = run(async () => { const [id, k] = c.dataset.doc.split(':'); await api(`/admin/tutors/${id}/docs`, { method: 'PATCH', body: { doc: k, ok: c.checked } }); await sync(); render(); }));
    $$('[data-ok]').forEach(b => b.onclick = run(async () => { await api(`/admin/tutors/${b.dataset.ok}/approve`, { method: 'POST' }); await sync(); toast('승인했어요. 목록에 공개됐어요'); render(); }));
    $$('[data-rej]').forEach(b => b.onclick = run(async () => { if (await ask({ title: '반려할까요?', body: '빠진 서류를 다시 내도록 선생님에게 알려요.', ok: '반려', warn: true })) { await api(`/admin/tutors/${b.dataset.rej}/reject`, { method: 'POST', body: { reason: '빠진 서류를 다시 내 주세요.' } }); await sync(); toast('반려하고 사유를 보냈어요'); render(); } }));
  } };
}

/* ===================== 결제 내역 · 아이 관리 ===================== */
function vPayments() {
  const label = { active: '결제 완료', refund_requested: '환불 신청', refunded: '환불 완료', completed: '수업 종료' };
  return { title: '결제 내역', html: `${backBar('결제 내역', 'my')}<div class="sec" style="margin-top:8px">${S.bookings.length ? S.bookings.map(b => { const t = T[b.tutorId] || { name: b.tutorName }; const done = doneOf(b); return `<div class="card" style="margin:0 0 10px"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(t.name)} 선생님 · 월 ${b.pkg}회</b><span class="tag ${b.status === 'active' ? 'g' : b.status === 'completed' ? '' : 'r'}">${label[b.status]}</span></div><p style="margin:4px 0 10px;color:var(--muted);font-size:13.5px">${b.payId} · ${new Date(b.createdAt).toLocaleDateString('ko-KR')} · ${b.method} · 진행 ${done}/${b.pkg}회</p><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">${won(b.amount)}</b>${b.status === 'active' ? `<button class="btn sm line" data-rf="${b.id}">환불 신청</button>` : b.status === 'refund_requested' ? `<span style="font-size:14px;color:var(--ink2)">돌려받을 금액 ${won(b.refund)}</span>` : ''}</div>${b.status === 'active' && done && !b.review ? `<button class="btn sm ghost block" data-rv="${b.id}" style="margin-top:10px">후기 쓰기</button>` : ''}${b.review ? `<p class="cap" style="padding:0;margin-top:8px">남긴 후기: “${esc(b.review.text)}”</p>` : ''}</div>`; }).join('') : `<div class="empty"><img src="${TURTLE}" alt=""><b>결제 내역이 없어요</b><p>선생님을 고르고 첫 수업을 예약해 보세요.</p><a class="btn sm" href="#tutors" style="margin-top:10px">튜터 찾기</a></div>`}</div>`,
  mount() {
    $$('[data-rf]').forEach(b => b.onclick = run(async () => { const bk = S.bookings.find(x => x.id === b.dataset.rf); const done = doneOf(bk); const amt = bk.amount * refundRate(done, bk.pkg);
      if (await ask({ title: `${won(amt)} 돌려받아요`, body: `확인된 수업 ${done}회 기준 · 학원법 환불 기준으로 계산했어요.`, ok: '환불 신청' })) { await api(`/bookings/${bk.id}/refund`, { method: 'POST' }); await sync(); toast('환불을 신청했어요. 3영업일 안에 처리돼요'); render(); } }));
    $$('[data-rv]').forEach(b => b.onclick = () => sheet({ title: '수업 후기', html: `<div class="field"><label for="rvt">다른 보호자에게 도움이 될 한두 줄</label><textarea class="in" id="rvt" placeholder="아이 이름·연락처는 쓰지 말아 주세요"></textarea></div><button class="btn block" id="rvs">후기 올리기</button>`,
      mount(sh, close) { $('#rvs', sh).onclick = run(async () => { const v = $('#rvt', sh).value.trim(); if (!v) return; await api(`/bookings/${b.dataset.rv}/review`, { method: 'POST', body: { text: v } }); await sync(); close(); toast('후기를 올렸어요'); render(); }); } }));
  } };
}
function kidSheet(k) {
  const yrs = []; for (let y = 2022; y >= 2006; y--) yrs.push(y);
  const v = { traits: [...(k?.traits || [])], level: k?.level || '', age: k?.age || '' };
  sheet({ title: k ? `${esc(k.name)} 정보` : '아이 추가', html: `${k ? '' : `<div class="field"><label for="an">부르는 이름</label><input class="in" id="an"><p class="err" id="ane"></p></div><div class="two" style="gap:10px"><div class="field"><label for="ay">출생연도</label><select class="sel in" id="ay">${yrs.map(y => `<option ${y === 2018 ? 'selected' : ''}>${y}</option>`).join('')}</select></div><div class="field"><label for="agd">학년</label><select class="sel in" id="agd">${['미취학', '초등 1학년', '초등 2학년', '초등 3학년', '초등 4학년', '초등 5학년', '초등 6학년', '중학생', '고등학생'].map(g => `<option>${g}</option>`).join('')}</select></div></div>`}
  <div class="field"><span class="lab">아이 특성</span><div class="chips wrap">${TRAITS.map(x => `<button class="chip soft" data-at="${x}" aria-pressed="${v.traits.includes(x)}">${x}</button>`).join('')}</div></div>
  <div class="field"><label for="alv">커뮤니티 단락 (선택)</label><select class="sel in" id="alv"><option value="">고르지 않을게요</option>${LEVELS.map(l => `<option value="${l.key}" ${v.level === l.key ? 'selected' : ''}>${l.name} (${l.range})</option>`).join('')}</select><p class="help">진단명이 없어도 가장 가까운 곳을 고르면 돼요. 선생님에게는 보이지 않아요.</p></div>
  ${k ? `<div class="field"><label for="aag">나이대</label><select class="sel in" id="aag"><option value="">고르지 않을게요</option>${AGES.map(a => `<option value="${a.key}" ${v.age === a.key ? 'selected' : ''}>${a.name}</option>`).join('')}</select></div>` : ''}
  <button class="btn block" id="ago">${k ? '저장하기' : '추가하기'}</button>`,
  mount(sh, close) {
    $$('[data-at]', sh).forEach(b => b.onclick = () => { const i = v.traits.indexOf(b.dataset.at); if (i > -1) v.traits.splice(i, 1); else v.traits.push(b.dataset.at); b.setAttribute('aria-pressed', String(i < 0)); });
    $('#ago', sh).onclick = run(async () => {
      if (k) { await api(`/kids/${k.id}`, { method: 'PATCH', body: { traits: v.traits, level: $('#alv', sh).value || null, age: $('#aag', sh).value || null } }); await sync(); close(); toast('저장했어요'); render(); return; }
      const n = $('#an', sh).value.trim(); if (!n) { $('#ane', sh).textContent = '부르는 이름을 적어 주세요.'; return; }
      const grade = $('#agd', sh).value;
      await api('/kids', { method: 'POST', body: { name: n, birth: +$('#ay', sh).value, grade, traits: v.traits, level: $('#alv', sh).value || null, age: gradeToAge(grade), region: kid().region } }); await sync(); close(); toast(`${n} 프로필을 추가했어요`); render();
    });
  } });
}
function vKids() {
  return { title: '아이 관리', html: `${backBar('아이 관리', 'my')}<div class="sec" style="margin-top:8px">${S.kids.map(k => `<div class="card" style="margin:0 0 10px"><div style="display:flex;gap:12px;align-items:center"><span class="av" style="background:var(--tint-soft);color:var(--tint-text)">${esc(k.name[0])}</span><div style="flex:1"><b style="font-size:17px">${esc(k.name)}</b><div style="color:var(--muted);font-size:13.5px">${esc(k.grade || '')} · ${k.region || ''} ${esc(k.dist || '')}</div></div><button class="btn sm line" data-ek="${k.id}">고치기</button></div><div class="tags" style="margin-top:10px">${k.level ? `<span class="tag b">${levelName(k.level)}</span>` : ''}${k.age ? `<span class="tag">${ageName(k.age)}</span>` : ''}${(k.traits || []).map(x => `<span class="tag">${x}</span>`).join('')}${(k.subj || []).map(s => `<span class="tag g">${SUBJ[s].name}</span>`).join('')}</div>${k.goal ? `<p class="para" style="margin-top:10px;font-size:14.5px">목표 · ${esc(k.goal)}</p>` : ''}</div>`).join('')}
 <button class="btn block ghost" id="addk">${ic('plus', 20)}아이 추가</button><p class="cap">선생님에게는 학년·특성만 보여요. 이름·학교·커뮤니티 단락은 보이지 않아요.</p></div>`,
  mount() { $('#addk').onclick = () => kidSheet(null); $$('[data-ek]').forEach(b => b.onclick = () => kidSheet(S.kids.find(k => k.id === b.dataset.ek))); } };
}

const ROUTES = { welcome: vWelcome, login: vLogin, signup: vSignup, home: vHome, tutors: vTutors, tutor: vTutor, request: vRequest, booking: vBooking, checkout: vCheckout, paid: vPaid, community: vCommunity, post: vPost, library: vLibrary, my: vMy, lessons: vLessons, chat: vChat, room: vRoom, easy: vEasy, thome: vTHome, students: vStudents, admin: vAdmin, payments: vPayments, kids: vKids };

/* ===================== 시작 ===================== */
function shell() {
  const sig = `<svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" fill="currentColor" opacity=".45"/></svg>`;
  document.body.insertAdjacentHTML('afterbegin', `<a class="skip" href="#" id="skip">앱 화면으로 건너뛰기</a>
 <div class="stage">
  <aside class="rail rail-l" aria-label="화면 목록">
   <div class="brandrow"><img class="tt" src="${TURTLE_SM}" alt=""><img class="wm" src="${WORDMARK}" alt="터틀리"></div>
   <p class="sub">느린학습자 맞춤형 1:1 교육 플랫폼<br>화면 ${NAV.reduce((a, [, i]) => a + i.length, 0)}개 · 서버 연결됨</p>
   <div class="role-sw" role="group" aria-label="데모 역할 바꾸기"><button data-role="parent">보호자</button><button data-role="tutor">선생님</button><button data-role="admin">관리자</button></div>
   <nav id="nav-list" aria-label="화면 바로가기"></nav>
   <button class="rail-btn" data-report>${ic('report', 20)}플랫폼 분석 리포트</button>
  </aside>
  <div class="device-wrap"><div class="device"><span class="btns" aria-hidden="true"></span>
   <div class="screen" id="screen">
    <div class="status" aria-hidden="true"><span id="clock">9:41</span><span class="island"></span><span class="sig">${sig}</span></div>
    <main class="view" id="view" tabindex="-1" aria-label="터틀리 앱"></main>
    <nav class="tabbar" id="tabbar" aria-label="하단 메뉴"></nav>
    <div class="layer" id="layer"></div><span class="home-ind" aria-hidden="true"></span>
   </div></div></div>
  <aside class="rail rail-r" aria-label="설계 노트">
   <div class="mobnav" style="margin-bottom:12px"><div class="note" style="padding:14px 16px"><label for="nav-sel" style="font-size:13px;font-weight:600;color:var(--muted)">화면 바로가기</label><select id="nav-sel" class="sel in" style="margin:6px 0 10px"></select><div class="role-sw" role="group" aria-label="데모 역할 바꾸기" style="margin:0 0 10px"><button data-role="parent">보호자</button><button data-role="tutor">선생님</button><button data-role="admin">관리자</button></div><button class="rail-btn" data-report>${ic('report', 20)}플랫폼 분석 리포트</button></div></div>
   <div class="note" id="note" aria-live="polite"></div>
   <p class="mini">선생님·아이·게시글은 데모용 예시예요. 입력한 내용은 서버에 저장돼요.</p>
  </aside>
 </div>
 <div class="report" id="report" role="dialog" aria-modal="true" aria-label="플랫폼 분석 리포트"></div>`);
}
async function boot() {
  shell();
  view = $('#view'); tabbar = $('#tabbar'); layer = $('#layer');
  const clk = () => { const d = new Date(); $('#clock').textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; }; clk(); setInterval(clk, 30000);
  document.addEventListener('click', e => {
    const t = e.target;
    if (UI.read && t.closest('#view') && !t.closest('button,a,input,label,select,textarea,.tabbar')) { const el = t.closest('[data-say],p,h1,h2,h3,li,.bub,b'); if (el && el.textContent.trim()) { speak(el.textContent.trim(), el); return; } }
    const g = t.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go); return; }
    const bk = t.closest('[data-back]'); if (bk && bk.dataset.back) { e.preventDefault(); go(bk.dataset.back); return; }
    const dm = t.closest('[data-demo]'); if (dm) { run(async () => { await loginAs(dm.dataset.demo); if (curRoute === 'login') afterLogin(); else { toast(({ parent: '보호자', tutor: '선생님', admin: '관리자' })[dm.dataset.demo] + ' 데모로 들어왔어요'); render(); } })(); return; }
    const nv = t.closest('[data-nav]'); if (nv) { navTo(nv.dataset.nav); return; }
    const rl = t.closest('[data-role]'); if (rl) { const r = rl.dataset.role; run(async () => { await loginAs(r); UI.seen = true; saveUI(); toast(({ parent: '보호자', tutor: '선생님', admin: '관리자' })[r] + ' 데모로 바꿨어요'); go(r === 'tutor' ? 'thome' : r === 'admin' ? 'admin' : 'home'); })(); return; }
    if (t.closest('[data-report]')) { openReport(); return; }
  });
  $('#skip').onclick = e => { e.preventDefault(); view.focus(); };
  $('#nav-sel').onchange = e => navTo(e.target.value);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#report').classList.contains('on')) closeReport(); });
  addEventListener('hashchange', render);
  addEventListener('resize', fit);
  applyA11y(); fit();
  try { await sync(); } catch (e) { view.innerHTML = `<div class="empty" style="padding-top:120px"><img src="${TURTLE}" alt=""><b>서버에 연결하지 못했어요</b><p>${esc(e.message)}</p><button class="btn sm" onclick="location.reload()" style="margin-top:12px">다시 시도</button></div>`; return; }
  render();
}
boot();
})();
