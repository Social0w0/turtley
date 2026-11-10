// 데모 데이터. `npm run seed` 로 초기화할 수 있습니다.
const { hashPassword } = require('./auth');
const { quote } = require('./pricing');

function seed(db) {
  const mkUser = (name, email, role, region) => {
    const { salt, hash } = hashPassword('demo1234');
    return db.insert('users', { name, email, role, region, salt, passwordHash: hash });
  };

  const parent = mkUser('김하늘(하준맘)', 'parent@turtley.dev', 'parent', '광진구');
  const parent2 = mkUser('박서연(지우아빠)', 'parent2@turtley.dev', 'parent', '수원시');

  const tutorDefs = [
    { name: '이은정', email: 'tutor@turtley.dev', region: '광진구', subjects: ['국어', '사회성'], online: true,
      intro: '초등교사 8년 경력, 육아로 쉬었다가 다시 시작해요. 아이 속도에 맞춰 반복하고 기다리는 수업을 합니다.',
      career: '前 초등학교 교사 8년 · 특수교육 연수 이수', rating: 4.9, reviewCount: 27, tags: ['반복학습', '그림카드', '경계선지능 경험'], avatar: '👩‍🏫' },
    { name: '최민지', email: 'tutor2@turtley.dev', region: '성동구', subjects: ['수학'], online: true,
      intro: '구체물과 놀이로 수 개념부터 차근차근. 한 번에 하나씩, 칭찬은 자주!',
      career: '前 학원 수학강사 6년 · 놀이수학 지도사', rating: 4.8, reviewCount: 19, tags: ['놀이수학', '구체물'], avatar: '👩‍💼' },
    { name: '정수아', email: 'tutor3@turtley.dev', region: '수원시', subjects: ['국어', '생활습관'], online: false,
      intro: '언어치료 보조 경력이 있어요. 짧은 문장 읽기와 말하기 연습을 함께 합니다.',
      career: '언어재활 보조 3년 · 독서지도사', rating: 4.7, reviewCount: 11, tags: ['읽기', '말하기'], avatar: '👩' },
    { name: '한지영', email: 'tutor4@turtley.dev', region: '부산 해운대구', subjects: ['사회성', '생활습관'], online: true,
      intro: '역할놀이로 친구 사귀기, 감정 표현하기를 연습해요. 비대면 수업도 가능합니다.',
      career: '아동상담 센터 근무 4년', rating: 4.9, reviewCount: 8, tags: ['역할놀이', '감정표현'], avatar: '🧑‍🏫' },
    { name: '오미래', email: 'tutor5@turtley.dev', region: '대전 서구', subjects: ['수학', '국어'], online: true,
      intro: '두 아이 엄마예요. 집중 시간이 짧은 아이를 위해 15분 단위로 쪼개서 수업해요.',
      career: '前 방과후 강사 5년', rating: 4.6, reviewCount: 14, tags: ['짧은수업', '집중력'], avatar: '👩‍🦰' },
  ];

  const tutors = tutorDefs.map(d => {
    const u = mkUser(d.name, d.email, 'tutor', d.region);
    const { email, region, ...rest } = d;
    return db.insert('tutors', { userId: u.id, regions: [region], ...rest });
  });

  // 예약 샘플
  db.insert('bookings', {
    parentId: parent.id, parentName: parent.name, tutorId: tutors[0].id, tutorName: tutors[0].name,
    childName: '하준', childAge: 9, message: '받아쓰기를 특히 어려워해요.', ...quote('monthly8'),
    status: 'accepted', payment: 'escrow_held',
  });
  db.insert('bookings', {
    parentId: parent2.id, parentName: parent2.name, tutorId: tutors[0].id, tutorName: tutors[0].name,
    childName: '지우', childAge: 8, message: '체험 먼저 해보고 싶어요.', ...quote('single'),
    status: 'requested', payment: 'escrow_held',
  });

  // 커뮤니티 샘플
  const posts = [
    [parent2, '수원시', '한걸음', '지우가 오늘 처음으로 혼자 버스 카드를 찍었어요! 3주 동안 연습한 보람이 있네요 🐢'],
    [parent, '광진구', '질문', '9살 아이 받아쓰기, 하루에 몇 문장 정도가 적당할까요? 다들 어떻게 하시는지 궁금해요.'],
    [parent, '광진구', '모임', '광진구 느린학습자 부모 모임 이번 달 토요일 오전에 어린이대공원 근처에서 해요. 편하게 오세요!'],
    [parent2, '수원시', '정보', '교육청 경계선지능 학생 지원 사업 신청 기간 공지 떴어요. 학교 상담 선생님께 문의해 보세요.'],
  ];
  posts.forEach(([u, region, tag, content], i) => {
    const p = db.insert('posts', { userId: u.id, authorName: u.name, authorRole: 'parent', region, tag, content, likes: [], comments: [] });
    p.createdAt = new Date(Date.now() - (posts.length - i) * 3600e3).toISOString();
  });
  const first = db.all('posts')[0];
  first.likes = [parent.id];
  first.comments.push({ id: db.id(), userId: parent.id, authorName: parent.name, content: '와 대단해요! 저희도 연습 중이에요 👏', createdAt: new Date().toISOString() });

  // e-도서관 샘플
  const lib = [
    ['그림으로 배우는 감정카드 24장', '사회성', 'card', true, 0, '😊', '기쁨·슬픔·화남·속상함… 표정 그림과 짧은 문장으로 감정 이름을 익혀요.'],
    ['10까지 수 세기 애니메이션', '수학', 'video', true, 0, '🔢', '거북이와 함께 사과를 하나씩 세는 5분짜리 영상.'],
    ['받아쓰기 한 문장 워크북 (1단계)', '국어', 'worksheet', false, 3000, '✏️', '짧은 문장 30개를 그림 힌트와 함께 단계별로 연습해요.'],
    ['버스 타기 순서 그림책', '생활습관', 'card', true, 0, '🚌', '정류장에서 기다리기부터 내리기까지 8단계를 그림으로.'],
    ['시계 보기 놀이 영상', '수학', 'video', false, 2000, '🕒', '정각과 30분부터 천천히, 반복 퀴즈 포함.'],
    ['친구에게 말 걸기 역할놀이 대본', '사회성', 'worksheet', true, 0, '🗣️', '튜터·부모가 아이와 함께 읽고 연습할 수 있는 짧은 대본 6편.'],
  ];
  lib.forEach(([title, category, type, free, price, emoji, description]) =>
    db.insert('library', { title, category, type, free, price, emoji, description, level: '기초' }));

  db.save();
}

module.exports = { seed };

if (require.main === module) {
  const path = require('path');
  const fs = require('fs');
  const { Store } = require('./db');
  const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
  if (process.argv.includes('--reset') && fs.existsSync(file)) fs.unlinkSync(file);
  const db = new Store(file);
  seed(db);
  console.log('✅ 데모 데이터 생성 완료 →', file);
}
