const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Store } = require('../server/db');
const { createApp } = require('../server/app');
const { seed, PW } = require('../server/seed');

let server, base;
before(async () => {
  const db = new Store(null); // 메모리 DB
  seed(db);
  server = createApp(db).listen(0);
  await new Promise(r => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

async function call(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}
const login = async email => (await call('/auth/login', { method: 'POST', body: { email, password: PW } })).data.token;
const demo = async role => (await call('/auth/demo', { method: 'POST', body: { role } })).data.token;
const state = async token => (await call('/state', { token })).data;

test('health / 로그인', async () => {
  assert.equal((await call('/health')).data.ok, true);
  assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'parent@turtley.dev', password: 'nope1234' } })).status, 401);
  const s = await state(await login('parent@turtley.dev'));
  assert.equal(s.user.role, 'parent');
  assert.equal(s.kids[0].name, '하늘');
});

test('둘러보기: 인증 완료 선생님만 공개', async () => {
  const s = await state();
  assert.equal(s.user, null);
  assert.equal(s.tutors.length, 12);
  assert.ok(s.tutors.every(t => t.userId === undefined && t.docs === undefined));
  assert.equal((await call('/tutors/tp3')).status, 404); // 심사 대기
});

test('회원가입: 비밀번호 규칙, 만 14세 미만 보호자 동의, 민감정보 동의', async () => {
  const baseBody = { type: 'parent', name: '새보호자', email: 'np@t.dev', password: 'abcd1234', consents: { service: true, privacy: true } };
  assert.equal((await call('/auth/signup', { method: 'POST', body: { ...baseBody, password: '12345678' } })).status, 400);
  const kid = { name: '별', birth: 2018, traits: ['집중 시간이 짧아요'], subj: ['read'], region: '서울', level: 'observing' };
  const r1 = await call('/auth/signup', { method: 'POST', body: { ...baseBody, kid } });
  assert.equal(r1.status, 400);
  assert.match(r1.data.error, /14세/);
  const r2 = await call('/auth/signup', { method: 'POST', body: { ...baseBody, kid: { ...kid, diag: '검사 결과' }, consents: { service: true, privacy: true, guardian: true, phoneOk: true } } });
  assert.match(r2.data.error, /민감정보/);
  const ok = await call('/auth/signup', { method: 'POST', body: { ...baseBody, kid, consents: { service: true, privacy: true, guardian: true, phoneOk: true } } });
  assert.equal(ok.status, 200);
  const s = await state(ok.data.token);
  assert.equal(s.kids[0].level, 'observing');
  assert.equal((await call('/auth/signup', { method: 'POST', body: { ...baseBody, kid, consents: { service: true, privacy: true, guardian: true, phoneOk: true } } })).status, 409);
});

test('선생님 가입 → 심사 대기 → 서류 4종 확인 후 승인되면 공개', async () => {
  const r = await call('/auth/signup', { method: 'POST', body: { type: 'tutor', name: '새선생', email: 'nt@t.dev', password: 'abcd1234', tutor: { region: '서울', subj: ['read'], price: 31000, files: { id: 'id.pdf' } }, consents: { service: true, privacy: true, crime: true, policy: true } } });
  assert.equal(r.status, 200);
  const mine = (await state(r.data.token)).myTutor;
  assert.equal(mine.status, 'pending');
  assert.equal((await state()).tutors.some(t => t.id === mine.id), false);
  const req = (await state(r.data.token)).requests[0];
  assert.equal((await call(`/requests/${req.id}/apply`, { method: 'POST', token: r.data.token, body: {} })).status, 403);

  const admin = await demo('admin');
  assert.ok((await state(admin)).queue.some(q => q.id === mine.id));
  assert.equal((await call(`/admin/tutors/${mine.id}/approve`, { method: 'POST', token: admin })).status, 400);
  for (const doc of ['id', 'crime', 'report', 'cert']) await call(`/admin/tutors/${mine.id}/docs`, { method: 'PATCH', token: admin, body: { doc, ok: true } });
  assert.equal((await call(`/admin/tutors/${mine.id}/approve`, { method: 'POST', token: admin })).status, 200);
  assert.ok((await state()).tutors.some(t => t.id === mine.id));
});

test('수업 신청서 → 선생님 지원 → 보호자에게 채팅', async () => {
  const p = await login('parent2@turtley.dev');
  const kid = (await state(p)).kids[0];
  assert.equal((await call('/requests', { method: 'POST', token: p, body: { kidId: kid.id, subj: ['read'], slots: [] } })).status, 400);
  const r = await call('/requests', { method: 'POST', token: p, body: { kidId: kid.id, subj: ['read'], traits: ['집중 시간이 짧아요'], mode: 'visit', region: '서울', slots: ['월 16', '수 16'], budget: 30000, memo: '연락은 010-1234-5678' } });
  assert.equal(r.status, 200);
  assert.match(r.data.request.memo, /연락처 가림/);
  let mine = (await state(p)).requests.find(x => x.id === r.data.request.id);
  const autoApps = mine.apps.length;
  assert.ok(autoApps >= 1);

  const t = await demo('tutor');
  assert.equal((await call(`/requests/${r.data.request.id}/apply`, { method: 'POST', token: t, body: { message: '지원합니다', price: 30000 } })).status, 200);
  assert.equal((await call(`/requests/${r.data.request.id}/apply`, { method: 'POST', token: t, body: {} })).status, 409);
  mine = (await state(p)).requests.find(x => x.id === r.data.request.id);
  assert.equal(mine.apps.length, autoApps + 1);
  const th = (await state(p)).threads.find(x => x.name === '지은 선생님');
  assert.match(th.msgs.at(-1).t, /신청서 지원/);
});

test('예약·결제: 시간 검증, 바우처, 동의, 환불', async () => {
  const p = await demo('parent');
  const kidId = (await state(p)).kids[0].id;
  const body = { tutorId: 't2', kidId, pkg: 8, mode: 'visit', slots: ['화 15', '목 15'], method: 'card', consents: { refund: true, share: true, escrow: true } };
  assert.equal((await call('/bookings', { method: 'POST', token: p, body: { ...body, slots: ['화 15'] } })).status, 400);
  assert.equal((await call('/bookings', { method: 'POST', token: p, body: { ...body, slots: ['월 10', '화 15'] } })).status, 400);
  assert.equal((await call('/bookings', { method: 'POST', token: p, body: { ...body, mode: 'online' } })).status, 400);
  assert.equal((await call('/bookings', { method: 'POST', token: p, body: { ...body, consents: {} } })).status, 400);
  assert.equal((await call('/bookings', { method: 'POST', token: p, body: { ...body, voucher: 'FAKE' } })).status, 400);
  const r = await call('/bookings', { method: 'POST', token: p, body: { ...body, voucher: 'turtle10' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.booking.base, 28000 * 8);
  assert.equal(r.data.booking.amount, 28000 * 8 * 0.9);
  assert.equal((await call('/bookings', { method: 'POST', token: await demo('tutor'), body })).status, 403);
  const rf = await call(`/bookings/${r.data.booking.id}/refund`, { method: 'POST', token: p });
  assert.equal(rf.data.booking.refund, r.data.booking.amount); // 시작 전 = 전액
  assert.equal((await call(`/bookings/${r.data.booking.id}/refund`, { method: 'POST', token: p })).status, 400);
});

test('수업 기록 → 보호자 확인 → 정산, 환불 비율', async () => {
  const t = await demo('tutor');
  const p2 = await login('parent2@turtley.dev');
  const before = (await state(t)).earnings;
  const l = await call('/bookings/b-dy/lessons', { method: 'POST', token: t, body: { step: '혼자 문단을 끝까지 읽었어요', mood: 'good', focus: 17 } });
  assert.equal(l.status, 200);
  assert.equal(l.data.lesson.confirmed, false);
  assert.equal((await call(`/lessons/${l.data.lesson.id}/confirm`, { method: 'POST', token: await demo('parent') })).status, 403);
  assert.equal((await call(`/lessons/${l.data.lesson.id}/confirm`, { method: 'POST', token: p2 })).status, 200);
  const after = (await state(t)).earnings;
  assert.equal(after.done, before.done + 1);
  assert.equal(after.paid, before.paid + 24000);
  const rf = await call('/bookings/b-dy/refund', { method: 'POST', token: p2 }); // 8회 중 3회 → 1/2 환불
  assert.equal(rf.data.booking.refundDone, 3);
  assert.equal(rf.data.booking.refund, 120000);
});

test('채팅: 안심센터 자동 응답, 연락처 가림, 남의 대화 차단', async () => {
  const p = await demo('parent');
  const c = await call('/threads', { method: 'POST', token: p, body: { center: true } });
  const r = await call(`/threads/${c.data.thread.id}/messages`, { method: 'POST', token: p, body: { text: '환불하고 싶어요 010 1111 2222' } });
  const msgs = r.data.thread.msgs;
  assert.match(msgs.at(-2).t, /연락처 가림/);
  assert.equal(msgs.at(-1).me, false);
  const t = await call('/threads', { method: 'POST', token: p, body: { tutorId: 't3', first: '상담 가능할까요?' } });
  assert.equal(t.data.thread.name, '혜원 선생님');
  assert.equal(t.data.thread.msgs.at(-1).me, false);
  assert.equal((await call('/threads/c3', { token: p })).status, 404);
});

test('커뮤니티: 지역·게시판·단계·나이대, 공감, 댓글, 신고, 삭제', async () => {
  const seoul = (await call('/posts?region=' + encodeURIComponent('서울'))).data.posts;
  assert.ok(seoul.length && seoul.every(p => p.region === '서울' || p.region === '전국'));
  const ask = (await call('/posts?board=' + encodeURIComponent('선생님께'))).data.posts;
  assert.ok(ask.length && ask.every(p => p.board === '선생님께'));
  const lv = (await call('/posts?level=borderline&age=lower')).data.posts;
  assert.ok(lv.length && lv.every(p => p.level === 'borderline' && p.age === 'lower'));
  const g = (await state()).groups;
  assert.equal(g.levels.find(l => l.key === 'moderate').postCount, (await call('/posts?level=moderate')).data.posts.length);

  const p = await demo('parent');
  const w = await call('/posts', { method: 'POST', token: p, body: { title: '안녕하세요', body: '번호 01012345678 로 연락 주세요', board: '모임', region: '서울' } });
  assert.equal(w.data.masked, true);
  assert.equal(w.data.post.level, 'borderline');
  const id = w.data.post.id;
  assert.equal((await call(`/posts/${id}/like`, { method: 'POST', token: p })).data.post.likeCount, 1);
  assert.equal((await call(`/posts/${id}/like`, { method: 'POST', token: p })).data.post.likeCount, 0);
  const t = await demo('tutor');
  const c = await call(`/posts/${id}/comments`, { method: 'POST', token: t, body: { text: '도움이 될 거예요' } });
  assert.equal(c.data.post.comments[0].tutor, true);
  assert.equal((await call(`/posts/${id}`, { method: 'DELETE', token: t })).status, 403);
  await call('/posts/p5/report', { method: 'POST', token: t });
  assert.equal((await call('/posts', { token: t })).data.posts.some(x => x.id === 'p5'), false);
  assert.equal((await call(`/posts/${id}`, { method: 'DELETE', token: p })).status, 200);
});

test('아이 단계 수정, 관심 저장', async () => {
  const p = await demo('parent');
  assert.equal((await call('/kids/k1', { method: 'PATCH', token: p, body: { level: 'nope' } })).status, 400);
  assert.equal((await call('/kids/k1', { method: 'PATCH', token: p, body: { level: 'mild', age: 'upper' } })).data.kid.level, 'mild');
  await call('/kids/k1', { method: 'PATCH', token: p, body: { level: 'borderline', age: 'lower' } });
  assert.equal((await call('/kids/k2', { method: 'PATCH', token: p, body: { level: 'mild' } })).status, 404);
  assert.equal((await call('/saved/tutor/t4', { method: 'POST', token: p })).data.saved, true);
  assert.deepEqual((await state(p)).saved.tutor, ['t4']);
  assert.equal((await call('/saved/tutor/t4', { method: 'POST', token: p })).data.saved, false);
});
