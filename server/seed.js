// 데모 데이터. `npm run seed` 로 초기화할 수 있습니다.
// 선생님·아이·게시글은 프로토타입용 가상 예시입니다.
const { hashPassword } = require('./auth');

const PW = 'demo1234';

const TUTORS = [
  { id: 't1', name: '지은', hue: '#2272EB', region: '서울', dist: '마포구', modes: ['visit', 'online'], subj: ['read', 'kor'], tg: ['초등 저학년', '초등 고학년'], yrs: 9, gap: '육아로 4년 쉬고 복귀', certs: ['독서지도사', '보육교사 2급'], price: 30000,
    fit: '글자를 읽어도 뜻을 놓치는 아이', how: '10분씩 끊어 읽고 그림카드로 다시 말해요',
    intro: '방과후 독서 강사로 6년 일했고, 두 아이를 키우며 4년 쉬었어요. 한 문장을 끝까지 읽어낸 날을 아이와 같이 기록합니다.',
    approach: ['한 번에 한 문장, 10분 단위로 끊어 읽어요', '읽은 내용을 그림카드로 다시 말하게 해요', '맞힌 순간 바로, 짧게 칭찬해요'], slots: ['월 16', '수 16', '금 15', '토 10'], trial: true },
  { id: 't2', name: '미정', hue: '#3F78B5', region: '경기', dist: '수원시 영통구', modes: ['visit'], subj: ['num', 'math'], tg: ['초등 저학년'], yrs: 12, gap: '학습지 교사 8년 후 3년 공백', certs: ['수학지도사 1급'], price: 28000,
    fit: '10이 넘는 수에서 자주 멈추는 아이', how: '구슬과 동전으로 손에 잡히는 셈을 먼저 해요',
    intro: '학습지 방문교사로 8년을 일했어요. 수를 눈으로 보고 손으로 세는 단계부터 다시 쌓습니다.',
    approach: ['구체물(구슬·동전) → 그림 → 숫자 순서로 가요', '같은 문제를 세 가지 방법으로 반복해요', '틀린 문제는 다음 수업 첫 5분에 다시 풀어요'], slots: ['화 15', '목 15', '토 13'], trial: true },
  { id: 't3', name: '혜원', hue: '#C27A1A', region: '서울', dist: '노원구', modes: ['visit', 'center'], subj: ['social', 'art'], tg: ['유아', '초등 저학년'], yrs: 8, gap: '어린이집 교사 5년 후 3년 공백', certs: ['놀이심리상담사 1급', '보육교사 1급'], price: 35000,
    fit: '속상하면 말 대신 울음이 먼저 나오는 아이', how: '감정 카드와 역할놀이로 마음에 이름을 붙여요',
    intro: '어린이집 교사로 5년 일했어요. 놀이 안에서 기다리기, 부탁하기, 거절하기를 연습합니다.',
    approach: ['수업 시작마다 오늘 기분 카드 고르기', '친구와 있었던 일을 인형극으로 다시 해보기', '부모님께 가정 연습 과제 한 가지만 드려요'], slots: ['월 15', '화 15', '목 16'], trial: true },
  { id: 't4', name: '선영', hue: '#4E5968', region: '인천', dist: '연수구', modes: ['online'], subj: ['kor', 'read'], tg: ['중학생'], yrs: 15, gap: '중등 기간제 교사 후 5년 공백', certs: ['중등 정교사 2급(국어)'], price: 35000,
    fit: '교과서 지문이 길면 손을 놓는 중학생', how: '지문을 세 덩어리로 나누고 핵심어에 색을 칠해요',
    intro: '중학교 국어 기간제 교사로 10년 가르쳤어요. 화상 수업에서도 화면을 같이 보며 밑줄을 긋습니다.',
    approach: ['긴 지문은 세 덩어리로 나눠요', '핵심어 3개만 찾게 해요', '시험 직전 2주는 교과서 지문만 반복해요'], slots: ['월 19', '수 19', '금 19'], trial: false },
  { id: 't5', name: '은주', hue: '#A2463A', region: '부산', dist: '해운대구', modes: ['visit'], subj: ['life', 'num'], tg: ['초등 고학년', '중학생'], yrs: 7, gap: '사회복지관 근무 후 4년 공백', certs: ['사회복지사 2급'], price: 27000,
    fit: '돈 계산과 버스 타기가 아직 어려운 아이', how: '동네 마트와 정류장에서 실제로 연습해요',
    intro: '지역 사회복지관에서 아동 프로그램을 맡았어요. 교실 밖에서 쓰는 셈과 생활 규칙을 함께 익힙니다.',
    approach: ['영수증으로 덧셈·거스름돈 연습', '버스 노선도 보고 순서 말하기', '다음 주에 혼자 해볼 한 가지 정하기'], slots: ['화 16', '목 16', '토 10'], trial: true },
  { id: 't6', name: '수현', hue: '#A33461', region: '대구', dist: '수성구', modes: ['visit', 'online'], subj: ['eng'], tg: ['초등 저학년', '초등 고학년'], yrs: 10, gap: '영어학원 강사 후 6년 공백', certs: ['TESOL'], price: 30000,
    fit: '알파벳 소리와 모양이 자꾸 섞이는 아이', how: '노래와 손동작으로 소리부터 익혀요',
    intro: '영어학원에서 6년 가르쳤어요. 쓰기보다 듣고 따라 하기를 먼저 하고, 한 수업에 단어 5개만 다룹니다.',
    approach: ['한 수업 단어 5개', '노래·손동작으로 소리 먼저', '지난 수업 단어로 시작해요'], slots: ['월 17', '수 17', '토 13'], trial: true },
  { id: 't7', name: '경희', hue: '#B36A1F', region: '대전', dist: '유성구', modes: ['center', 'visit'], subj: ['art', 'social'], tg: ['유아', '초등 저학년'], yrs: 11, gap: '미술학원 운영 후 3년 공백', certs: ['미술심리상담사 2급'], price: 28000,
    fit: '말보다 그림으로 마음을 보여주는 아이', how: '그림을 그리며 오늘 있었던 일을 이야기해요',
    intro: '미술학원을 6년 운영했어요. 손으로 만드는 시간 동안 순서 지키기와 마무리하기를 연습합니다.',
    approach: ['작업 순서를 그림 카드로 붙여둬요', '끝까지 마친 작품은 사진으로 남겨요', '완성 대신 과정에 칭찬해요'], slots: ['화 13', '목 13', '금 15'], trial: true },
  { id: 't8', name: '나래', hue: '#08739A', region: '광주', dist: '북구', modes: ['online'], subj: ['math'], tg: ['중학생', '고등학생'], yrs: 9, gap: '중등 기간제 교사 후 4년 공백', certs: ['중등 정교사 2급(수학)'], price: 33000,
    fit: '문장제에서 무엇을 묻는지 놓치는 학생', how: '문제를 그림으로 바꿔 그리고 식을 세워요',
    intro: '중학교 수학 기간제 교사로 5년 일했어요. 공식보다 문제를 그림으로 옮기는 연습을 먼저 합니다.',
    approach: ['문제 속 숫자에 동그라미', '상황을 그림 한 장으로', '풀이를 말로 설명해 보기'], slots: ['월 19', '목 19', '토 15'], trial: false },
  { id: 't9', name: '정민', hue: '#2F67A3', region: '경기', dist: '성남시 분당구', modes: ['visit'], subj: ['read', 'social'], tg: ['유아', '초등 저학년'], yrs: 6, gap: '언어치료실 근무 후 2년 공백', certs: ['언어재활사 2급'], price: 38000,
    fit: '말소리가 또렷하지 않아 자신감이 낮은 아이', how: '짧은 말놀이로 소리와 낱말을 함께 다져요',
    intro: '언어치료실에서 4년 일했어요. 읽기와 말하기를 함께 다루고, 수업 뒤에 가정 연습을 3분짜리로 드립니다.',
    approach: ['말놀이로 시작하는 5분', '낱말 카드 → 짧은 문장', '가정 연습 하루 3분'], slots: ['화 16', '금 16'], trial: true },
  { id: 't10', name: '소연', hue: '#2B4A7E', region: '서울', dist: '송파구', modes: ['visit', 'online'], subj: ['social', 'life'], tg: ['초등 고학년', '중학생'], yrs: 13, gap: '청소년상담센터 후 5년 공백', certs: ['청소년상담사 3급'], price: 32000,
    fit: '단체 생활에서 자주 지치는 아이', how: '학교에서 생길 장면을 미리 연습해요',
    intro: '청소년상담센터에서 8년 일했어요. 학교에서 자주 생기는 열 가지 장면을 미리 말로 연습합니다.',
    approach: ['학교 장면 대본으로 역할 연습', '힘든 순간 쓰는 한 문장 정하기', '한 달에 한 번 부모 상담 15분'], slots: ['월 17', '수 17', '토 10'], trial: true },
  { id: 't11', name: '현주', hue: '#6B7684', region: '경기', dist: '고양시 일산동구', modes: ['online'], subj: ['life'], tg: ['성인'], yrs: 14, gap: '은행 창구 10년 후 4년 공백', certs: ['금융교육 강사 과정 수료'], price: 30000,
    fit: '통장·계약서 앞에서 막막한 성인 느린학습자', how: '실제 서류 견본으로 확인할 칸부터 짚어요',
    intro: '은행 창구에서 10년 일했어요. 계좌, 카드, 휴대폰 요금처럼 생활에서 바로 쓰는 금융을 천천히 다룹니다.',
    approach: ['서류 견본에서 확인할 칸 3개', '모르는 말은 쉬운 말로 다시 적기', '혼자 결정하기 전에 물어볼 사람 정하기'], slots: ['화 19', '목 19', '토 10'], trial: true },
  { id: 't12', name: '윤희', hue: '#8A6200', region: '제주', dist: '제주시', modes: ['visit', 'online'], subj: ['kor', 'math'], tg: ['초등 저학년', '초등 고학년'], yrs: 8, gap: '초등 기간제 교사 후 3년 공백', certs: ['초등 정교사 2급'], price: 25000,
    fit: '학교 진도를 따라가기 버거운 초등학생', how: '교과서 한 단원을 일주일에 나눠 다시 배워요',
    intro: '초등학교 기간제 교사로 5년 일했어요. 학교 진도와 같은 단원을 집에서 한 번 더 천천히 봅니다.',
    approach: ['교과서 단원을 4조각으로', '한 조각에 문제 3개', '금요일엔 한 주 복습'], slots: ['월 15', '수 15', '금 15'], trial: true },
];

const PENDING = [
  { name: '민지', region: '서울', dist: '강서구', subj: ['read'], docs: { id: true, crime: true, report: false, cert: true }, ago: 0 },
  { name: '은혜', region: '경기', dist: '안양시', subj: ['num'], docs: { id: true, crime: false, report: true, cert: true }, ago: 1 },
  { name: '다희', region: '부산', dist: '수영구', subj: ['social'], docs: { id: true, crime: true, report: true, cert: true }, ago: 2 },
];

const LESSONS = [
  { d: '2026-11-20', title: '한 쪽 끝까지 읽기', note: '처음으로 한 쪽을 쉬지 않고 읽었어요.', step: '한 쪽을 끝까지 읽었어요!', focus: 16, mood: 'good' },
  { d: '2026-11-18', title: '이야기 순서 카드', note: '카드 4장 중 3장을 순서대로 놓았어요.', step: '세 장면 순서를 기억했어요', focus: 15, mood: 'good' },
  { d: '2026-11-13', title: '문장 두 개 이어 읽기', note: '두 번째 문장에서 쉬었다가 다시 읽었어요.', step: '다시 시작하는 법을 배웠어요', focus: 13, mood: 'ok' },
  { d: '2026-11-11', title: '그림으로 다시 말하기', note: '읽은 내용을 그림카드로 설명했어요.', step: '자기 말로 설명했어요', focus: 13, mood: 'good' },
  { d: '2026-11-06', title: '짧은 문장 소리 내어 읽기', note: '피곤해해서 10분 쉬고 이어 갔어요.', step: '힘들 때 "쉬고 싶어요"라고 말했어요', focus: 10, mood: 'hard' },
  { d: '2026-11-04', title: '받침 없는 낱말 읽기', note: '낱말 20개 중 16개를 읽었어요.', step: '낱말 16개 성공', focus: 12, mood: 'good' },
  { d: '2026-10-30', title: '그림책 고르기', note: '좋아하는 공룡 책을 직접 골랐어요.', step: '스스로 책을 골랐어요', focus: 11, mood: 'good' },
  { d: '2026-10-28', title: '첫 만남', note: '선생님 이름을 기억하고 인사했어요.', step: '처음 만난 선생님께 인사했어요', focus: 8, mood: 'ok' },
];

const REQUESTS = [
  { child: '초2 · 여', sub: ['read'], traits: ['집중 시간이 짧아요'], region: '서울', dist: '마포구', mode: 'visit', slots: ['월 16', '수 16'], budget: 30000, memo: '받침 있는 글자에서 자주 멈춰요. 칭찬에 반응이 좋아요.', apps: 2, ago: 0 },
  { child: '초4 · 남', sub: ['num', 'life'], traits: ['배우는 데 시간이 오래 걸려요'], region: '서울', dist: '은평구', mode: 'visit', slots: ['화 15', '목 15'], budget: 28000, memo: '돈 계산과 시계 보기를 같이 배우고 싶어요.', apps: 1, ago: 1 },
  { child: '중1 · 여', sub: ['kor'], traits: ['상황 이해가 어려워요'], region: '경기', dist: '고양시', mode: 'online', slots: ['월 19', '금 19'], budget: 35000, memo: '교과서 지문이 길면 힘들어해요. 화상 수업 원해요.', apps: 4, ago: 2 },
  { child: '초1 · 남', sub: ['social', 'art'], traits: ['감정 표현이 서툴러요', '친구 관계가 힘들어요'], region: '서울', dist: '서대문구', mode: 'center', slots: ['토 10'], budget: 30000, memo: '화가 나면 말보다 행동이 먼저 나와요.', apps: 0, ago: 3 },
  { child: '성인 · 23세', sub: ['life'], traits: ['배우는 데 시간이 오래 걸려요'], region: '경기', dist: '부천시', mode: 'online', slots: ['화 19'], budget: 30000, memo: '첫 월급 관리와 휴대폰 요금제 이해가 필요해요.', apps: 1, ago: 4 },
];

const LIB = [
  { id: 'l1', t: '받침 없는 글자 읽기', cat: 'read', lv: 1, type: '영상', min: 6, d: '가, 나, 다처럼 받침 없는 글자를 소리와 그림으로 익혀요.', steps: ['화면 속 글자를 손가락으로 짚어요', '선생님 소리를 듣고 따라 말해요', '같은 글자가 들어간 그림을 골라요'] },
  { id: 'l2', t: '그림 카드로 문장 만들기', cat: 'read', lv: 2, type: '카드', min: 10, d: '누가·어디서·무엇을 카드 세 장으로 한 문장을 만들어요.', steps: ['누가 카드를 한 장 골라요', '어디서 카드를 옆에 놓아요', '무엇을 카드를 붙이고 소리 내어 읽어요'] },
  { id: 'l3', t: '10까지 세기 놀이', cat: 'num', lv: 1, type: '활동지', min: 8, d: '구슬을 옮기며 1부터 10까지 세어요.', steps: ['구슬 10개를 한 줄로 놓아요', '하나씩 옮기며 숫자를 말해요', '다 옮기면 처음부터 거꾸로 세어요'] },
  { id: 'l4', t: '동전으로 물건 사기', cat: 'life', lv: 2, type: '영상', min: 7, d: '500원과 100원 동전으로 간식 사기를 연습해요.', steps: ['가격표를 읽어요', '필요한 동전을 골라요', '거스름돈이 맞는지 세어 봐요'] },
  { id: 'l5', t: '버스 타는 순서', cat: 'life', lv: 2, type: '카드', min: 5, d: '정류장 확인부터 내리기 벨까지 다섯 장면을 순서대로 익혀요.', steps: ['버스 번호를 확인해요', '카드를 찍고 자리에 앉아요', '내릴 정류장 이름이 나오면 벨을 눌러요'] },
  { id: 'l6', t: '감정에 이름 붙이기', cat: 'social', lv: 1, type: '카드', min: 6, d: '기쁨·슬픔·화남·무서움 얼굴 카드로 지금 마음을 골라요.', steps: ['얼굴 카드 네 장을 펼쳐요', '지금 내 마음과 닮은 카드를 골라요', '왜 그런지 한 문장으로 말해요'] },
  { id: 'l7', t: '친구에게 부탁하는 말', cat: 'social', lv: 2, type: '영상', min: 6, d: '"같이 해도 돼?"처럼 부탁하는 말을 장면으로 연습해요.', steps: ['영상 속 장면을 봐요', '친구 대사를 따라 해요', '우리 집에서 써볼 말을 하나 정해요'] },
  { id: 'l8', t: '시계 보기: 정각과 30분', cat: 'num', lv: 2, type: '활동지', min: 9, d: '긴바늘이 12와 6에 있을 때를 먼저 익혀요.', steps: ['긴바늘이 어디 있는지 봐요', '짧은바늘이 가리키는 숫자를 읽어요', '정각인지 30분인지 말해요'] },
  { id: 'l9', t: '칭찬은 바로, 짧게', cat: 'guide', lv: 1, type: '부모 가이드', min: 4, d: '느린학습자에게 잘 닿는 칭찬의 타이밍과 말투를 정리했어요.', steps: ['잘한 행동 직후 3초 안에 말해요', '무엇을 잘했는지 구체적으로 짚어요', '결과보다 끝까지 한 과정을 칭찬해요'] },
  { id: 'l10', t: '검사·상담 기관 찾는 법', cat: 'guide', lv: 1, type: '부모 가이드', min: 5, d: '아이가 느리다고 느낄 때 처음 연락할 곳과 준비할 것을 정리했어요.', steps: ['학교 담임·상담 선생님과 먼저 이야기해요', '지역 교육청·지자체 지원 센터를 확인해요', '관찰 기록을 2주 정도 적어 가요'] },
  { id: 'l11', t: '느린학습자 수업 설계 5원칙', cat: 'tutor', lv: 1, type: '튜터 연수', min: 15, d: '짧게 나누기, 반복, 시각자료, 즉시 칭찬, 가정 연계를 수업에 넣는 법.', steps: ['수업을 10~15분 단위로 나눠요', '같은 내용을 세 가지 방식으로 반복해요', '수업 끝에 오늘의 한 걸음을 기록해요'] },
  { id: 'l12', t: '계약서에서 꼭 볼 3가지', cat: 'adult', lv: 2, type: '카드', min: 6, d: '휴대폰·월세 계약서에서 금액, 기간, 해지 조건을 찾아요.', steps: ['금액이 적힌 칸을 찾아 동그라미 해요', '언제까지인지 기간을 확인해요', '그만둘 때 돈을 내야 하는지 물어봐요'] },
];

// [지역, 게시판, 제목, 내용, 닉네임, 몇 시간 전, 공감, 댓글 수, 선생님 답변, 단계, 나이대]
const POSTS = [
  ['p1', '전국', '질문', '경계선 지능 검사는 어디서 받으셨어요?', '초2 아이인데 담임 선생님이 한번 알아보라고 하셨어요. 처음이라 어디부터 가야 할지 모르겠어요.', '초2맘', 2, 14, 9, false, 'observing', 'lower'],
  ['p2', '서울', '모임', '마포구 토요일 오전 놀이 모임 같이 해요', '7~9세 아이들 4명 정도로 공원에서 1시간 놀아요. 보호자 한 분씩 꼭 함께해요.', '하늘보호자', 5, 22, 11, false, 'borderline', 'lower'],
  ['p3', '전국', '정보', '우리 구 느린학습자 지원 사업 모아봤어요', '구청·교육청 프로그램 신청 기간이 대부분 연초예요. 지역 채널에 날짜 정리해 둘게요.', '정보담당', 26, 58, 20, false, 'borderline', 'upper'],
  ['p4', '경기', '이야기', '오늘 처음으로 혼자 버스 탔어요', '석 달 동안 같은 노선만 연습했어요. 정류장 이름 듣고 벨 누르는 걸 보니 눈물이 났네요.', '천천히가도돼', 30, 131, 42, false, 'mild', 'upper'],
  ['p5', '부산', '질문', '화상 수업 집중 잘 되나요?', '방문 수업 선생님이 근처에 없어서 화상으로 해볼까 해요. 몇 분 정도 집중하는지 궁금해요.', '해운대거북', 50, 8, 13, false, 'borderline', 'lower'],
  ['p6', '전국', '선생님께', '받아쓰기 틀리면 울어요. 어떻게 말해줘야 할까요?', '틀린 걸 고쳐주면 바로 울음이 터져요. 선생님들은 어떻게 하시는지 궁금해요.', '초1보호자', 74, 37, 16, true, 'borderline', 'lower'],
  ['p7', '대구', '모임', '수성구 보호자 저녁 수다 모임', '한 달에 한 번, 아이 이야기 편하게 나눠요. 카페 장소는 신청하신 분들께 앱 채팅으로 알려드려요.', '대구한걸음', 98, 19, 6, false, 'mild', 'upper'],
  ['p8', '전국', '정보', '시계 보기 연습에 쓴 활동지 공유해요', 'e-도서관 활동지에 우리 집 시간표를 붙여서 썼더니 훨씬 잘 따라와요.', '시계박사엄마', 122, 44, 8, false, 'observing', 'lower'],
  ['p9', '인천', '정보', '고등학교 졸업 후 갈 수 있는 곳 정리했어요', '주간보호센터와 직업훈련 과정을 지역별로 모았어요. 대기 기간이 길어서 미리 알아보시는 게 좋아요.', '예린맘', 140, 27, 5, false, 'moderate', 'teen'],
];
const SAMPLE_CMTS = {
  p1: [{ n: '윤희 선생님', t: '학교 상담실이나 지역 교육청 학습지원센터에 먼저 문의해 보세요. 관찰 기록을 2주쯤 적어 가면 좋아요.', tutor: true }, { n: '늘봄맘', t: '저희는 구청 연계 센터에서 받았어요. 대기가 있으니 빨리 신청하세요!' }],
  p6: [{ n: '혜원 선생님', t: '틀린 걸 바로 고치기보다 “여기까지 맞았네”를 먼저 말해 주세요. 고칠 건 다음 날 첫 문제로 다시 내면 덜 속상해해요.', tutor: true }],
};

function seed(db, { hash } = {}) {
  const cred = (hash || hashPassword)(PW); // 데모 계정은 모두 같은 비밀번호
  const hoursAgo = h => new Date(Date.now() - h * 3600e3).toISOString();
  const mkUser = (row) => db.insert('users', { ...row, salt: cred.salt, passwordHash: cred.hash });

  const parent = mkUser({ role: 'parent', name: '이수진', email: 'parent@turtley.dev', region: '서울' });
  const parent2 = mkUser({ role: 'parent', name: '박서연', email: 'parent2@turtley.dev', region: '서울' });
  mkUser({ role: 'admin', name: '운영 관리자', email: 'admin@turtley.dev', region: '서울' });

  const haneul = db.insert('kids', { id: 'k1', parentId: parent.id, name: '하늘', grade: '초등 3학년', birth: 2017, traits: ['집중 시간이 짧아요', '배우는 데 시간이 오래 걸려요'], subj: ['read', 'num'], goal: '한 쪽 끝까지 소리 내어 읽기', region: '서울', dist: '마포구', level: 'borderline', age: 'lower' });
  const doyun = db.insert('kids', { id: 'k2', parentId: parent2.id, name: '도윤', grade: '초등 5학년', birth: 2015, traits: ['상황 이해가 어려워요'], subj: ['kor'], goal: '', region: '서울', dist: '은평구', level: 'borderline', age: 'upper' });

  TUTORS.forEach((t, i) => {
    const u = mkUser({ role: 'tutor', name: t.name, email: i === 0 ? 'tutor@turtley.dev' : `tutor${i + 1}@turtley.dev`, region: t.region });
    db.insert('tutors', { ...t, userId: u.id, status: 'approved', docs: { id: true, crime: true, report: true, cert: true }, demoAuto: i !== 0 });
  });
  PENDING.forEach((p, i) => {
    const u = mkUser({ role: 'tutor', name: p.name, email: `pending${i + 1}@turtley.dev`, region: p.region });
    const row = db.insert('tutors', { id: 'tp' + (i + 1), userId: u.id, name: p.name, hue: '#2272EB', region: p.region, dist: p.dist, modes: ['visit'], subj: p.subj, tg: [], yrs: 5, gap: '', certs: [], price: 30000, fit: '', how: '', intro: '', approach: [], slots: [], trial: true, status: 'pending', docs: p.docs });
    row.createdAt = hoursAgo(p.ago * 24 + 1);
  });

  // 하늘이: 지은 선생님과 월 8회(진행 중). 10월 기록 2개는 지난달 4회 수업.
  const prev = db.insert('bookings', { id: 'b-oct', parentId: parent.id, kidId: haneul.id, tutorId: 't1', tutorName: '지은', pkg: 4, mode: 'visit', slots: ['수 16'], memo: '', price: 30000, base: 120000, discount: 0, voucher: '', amount: 120000, method: '카드', payId: 'TT8K2Q1A', status: 'completed', payment: 'paid_out' });
  prev.createdAt = '2026-10-26T10:00:00.000Z';
  const cur = db.insert('bookings', { id: 'b-nov', parentId: parent.id, kidId: haneul.id, tutorId: 't1', tutorName: '지은', pkg: 8, mode: 'visit', slots: ['월 16', '수 16'], memo: '좋아하는 공룡 책으로 시작해 주세요.', price: 30000, base: 240000, discount: 0, voucher: '', amount: 240000, method: '카드', payId: 'TT9M4X7C', status: 'active', payment: 'escrow_held' });
  cur.createdAt = '2026-11-01T09:00:00.000Z';
  LESSONS.forEach(l => db.insert('lessons', { ...l, bookingId: l.d < '2026-11' ? prev.id : cur.id, kidId: haneul.id, tutorId: 't1', sub: 'read', confirmed: true, heart: l.mood === 'good' }));
  // 도윤이: 지은 선생님과 화상 월 8회, 기록 1개는 아직 보호자 확인 전
  const dy = db.insert('bookings', { id: 'b-dy', parentId: parent2.id, kidId: doyun.id, tutorId: 't1', tutorName: '지은', pkg: 8, mode: 'online', slots: ['금 15', '토 10'], memo: '', price: 30000, base: 240000, discount: 0, voucher: '', amount: 240000, method: '간편결제', payId: 'TT7P2R5D', status: 'active', payment: 'escrow_held' });
  dy.createdAt = '2026-11-02T09:00:00.000Z';
  [['2026-11-14', '교과서 지문 세 덩어리', '지문을 세 부분으로 나눠 읽었어요.', '세 덩어리로 나눠 읽었어요', 12, 'good', true], ['2026-11-15', '핵심어 3개 찾기', '핵심어 두 개를 스스로 찾았어요.', '핵심어 2개를 찾았어요', 14, 'good', true], ['2026-11-21', '문단 요약 한 줄', '요약을 말로 먼저 해 봤어요.', '한 문단을 한 줄로 말했어요', 15, 'ok', false]]
    .forEach(([d, title, note, step, focus, mood, confirmed]) => db.insert('lessons', { d, title, note, step, focus, mood, confirmed, heart: false, bookingId: dy.id, kidId: doyun.id, tutorId: 't1', sub: 'kor' }));

  // 채팅
  const t1user = db.find('users', u => u.email === 'tutor@turtley.dev');
  const c1 = db.insert('threads', { id: 'c1', a: parent.id, b: t1user.id, tutorId: 't1', msgs: [
    { from: 'sys', t: '연락처는 서로 공개되지 않아요. 대화는 터틀리 안에서만 이어져요.', at: '2026-10-25T08:00:00.000Z' },
    { from: t1user.id, t: '하늘이 보호자님, 오늘 수업 기록 올렸어요. 한 쪽을 쉬지 않고 읽었어요!', at: '2026-11-20T08:12:00.000Z' },
    { from: parent.id, t: '우와, 집에서도 칭찬해 줄게요. 다음 주는 어떤 책으로 할까요?', at: '2026-11-20T08:20:00.000Z' },
    { from: t1user.id, t: '공룡 책 2권째로 가요. 집에서는 하루 3분만 소리 내어 읽어 주세요.', at: '2026-11-20T08:24:00.000Z' },
  ] });
  db.insert('threads', { id: 'c2', a: parent.id, b: null, tutorId: null, msgs: [{ from: 'center', t: '수업료는 수업 완료 확인 후 선생님께 정산돼요. 문제가 생기면 이 채팅으로 바로 알려주세요.', at: '2026-11-17T01:00:00.000Z' }] });
  db.insert('threads', { id: 'c3', a: parent2.id, b: t1user.id, tutorId: 't1', msgs: [{ from: 'sys', t: '연락처는 서로 공개되지 않아요. 대화는 터틀리 안에서만 이어져요.', at: '2026-11-02T09:00:00.000Z' }, { from: parent2.id, t: '도윤이가 지난 수업 재밌었대요. 이번 주도 잘 부탁드려요.', at: '2026-11-21T10:00:00.000Z' }] });
  void c1;

  // 수업 신청서 (보호자 익명)
  REQUESTS.forEach((r, i) => {
    const row = db.insert('requests', { parentId: null, kidId: null, childLabel: r.child, subj: r.sub, traits: r.traits, memo: r.memo, mode: r.mode, region: r.region, dist: r.dist, slots: r.slots, days: r.slots.join(', '), budget: r.budget, appsBase: r.apps });
    row.createdAt = hoursAgo(r.ago * 24 + i);
  });

  LIB.forEach(l => db.insert('library', l));

  POSTS.forEach(([id, region, board, title, body, nick, h, like, cmt, ans, level, age]) => {
    const comments = (SAMPLE_CMTS[id] || []).map(c => ({ id: db.id(), userId: null, at: hoursAgo(h - 1), ...c }));
    const row = db.insert('posts', { id, userId: null, nick, region, board, title, body, level, age, likes: [], likeBase: like, comments, cmtBase: Math.max(0, cmt - comments.length), reports: [], ans });
    row.createdAt = hoursAgo(h);
  });
  db.update('posts', 'p2', { userId: parent.id, nick: '하늘보호자' });

  db.save();
}

module.exports = { seed, PW };

if (require.main === module) {
  // npm run seed : 저장소를 비우고 데모 데이터를 다시 넣습니다 (DATABASE_URL 이 있으면 Postgres 대상).
  const { openStore } = require('./db');
  (async () => {
    const db = await openStore();
    db.reset();
    seed(db);
    db.data.meta = { schema: 2, seededAt: new Date().toISOString() };
    db.save();
    await db.close();
    console.log(`데모 데이터를 다시 넣었어요 (${db.kind}).`);
  })().catch(err => { console.error(err); process.exit(1); });
}
