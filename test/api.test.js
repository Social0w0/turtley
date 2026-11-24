const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { Store } = require('../server/db');
const { createApp } = require('../server/app');
const { seed } = require('../server/seed');

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
const login = async email => (await call('/auth/login', { method: 'POST', body: { email, password: 'demo1234' } })).data.token;

test('health', async () => {
  const { status, data } = await call('/health');
  assert.equal(status, 200);
  assert.equal(data.ok, true);
});

test('login fails with wrong password', async () => {
  const { status } = await call('/auth/login', { method: 'POST', body: { email: 'parent@turtley.dev', password: 'nope' } });
  assert.equal(status, 401);
});

test('tutor list filters by subject', async () => {
  const { data } = await call('/tutors?subject=' + encodeURIComponent('수학'));
  assert.ok(data.tutors.length > 0);
  assert.ok(data.tutors.every(t => t.subjects.includes('수학')));
});

test('plans apply 20% platform fee', async () => {
  const { data } = await call('/plans');
  const m = data.plans.find(p => p.plan === 'monthly8');
  assert.equal(m.amount, 240000);
  assert.equal(m.platformFee, 48000);
  assert.equal(m.tutorPayout, 192000);
});

test('full booking flow: request → accept → complete → review', async () => {
  const parent = await login('parent@turtley.dev');
  const tutor = await login('tutor2@turtley.dev');
  const tutors = (await call('/tutors')).data.tutors;
  const target = tutors.find(t => t.name === '최민지');

  // 튜터는 신청할 수 없음
  assert.equal((await call('/bookings', { method: 'POST', token: tutor, body: { tutorId: target.id, plan: 'single', childName: 'x' } })).status, 403);

  const created = await call('/bookings', { method: 'POST', token: parent, body: { tutorId: target.id, plan: 'monthly8', childName: '하준', childAge: 9 } });
  assert.equal(created.status, 201);
  const id = created.data.booking.id;

  // 학부모가 수락할 수는 없음
  assert.equal((await call('/bookings/' + id, { method: 'PATCH', token: parent, body: { status: 'accepted' } })).status, 400);
  // 수업 전 후기 불가
  assert.equal((await call(`/bookings/${id}/review`, { method: 'POST', token: parent, body: { rating: 5 } })).status, 400);

  assert.equal((await call('/bookings/' + id, { method: 'PATCH', token: tutor, body: { status: 'accepted' } })).data.booking.status, 'accepted');
  let earn = (await call('/tutor/earnings', { token: tutor })).data;
  assert.equal(earn.pending, 192000);

  const done = await call('/bookings/' + id, { method: 'PATCH', token: tutor, body: { status: 'completed' } });
  assert.equal(done.data.booking.payment, 'paid_out');
  earn = (await call('/tutor/earnings', { token: tutor })).data;
  assert.equal(earn.paid, 192000);

  assert.equal((await call(`/bookings/${id}/review`, { method: 'POST', token: parent, body: { rating: 5, text: '좋아요' } })).status, 200);
  const after = (await call('/tutors/' + target.id)).data.tutor;
  assert.equal(after.reviewCount, target.reviewCount + 1);
});

test('community: post, like toggle, comment, delete', async () => {
  const token = await login('parent2@turtley.dev');
  const { data: { post } } = await call('/posts', { method: 'POST', token, body: { content: '오늘 처음 혼자 신발 신었어요', tag: '한걸음' } });
  assert.equal(post.likeCount, 0);
  let r = await call(`/posts/${post.id}/like`, { method: 'POST', token });
  assert.equal(r.data.post.likeCount, 1);
  r = await call(`/posts/${post.id}/like`, { method: 'POST', token });
  assert.equal(r.data.post.likeCount, 0);
  r = await call(`/posts/${post.id}/comments`, { method: 'POST', token, body: { content: '축하해요!' } });
  assert.equal(r.data.post.comments.length, 1);
  const other = await login('parent@turtley.dev');
  assert.equal((await call('/posts/' + post.id, { method: 'DELETE', token: other })).status, 403);
  assert.equal((await call('/posts/' + post.id, { method: 'DELETE', token })).status, 200);
});

test('signup as tutor creates a tutor profile', async () => {
  const { status, data } = await call('/auth/signup', { method: 'POST', body: { name: '새튜터', email: 'new@turtley.dev', password: 'secret1', role: 'tutor' } });
  assert.equal(status, 201);
  const me = await call('/me', { token: data.token });
  assert.equal(me.data.tutor.name, '새튜터');
  assert.equal((await call('/auth/signup', { method: 'POST', body: { name: 'x', email: 'new@turtley.dev', password: 'secret1' } })).status, 409);
});

test('community: 단계별 단락 목록과 글 수', async () => {
  const { data } = await call('/community/groups');
  assert.deepEqual(data.levels.map(l => l.key), ['observing', 'borderline', 'mild', 'moderate']);
  const borderline = data.levels.find(l => l.key === 'borderline');
  const { data: list } = await call('/posts?level=borderline');
  assert.equal(borderline.postCount, list.posts.length);
  assert.ok(list.posts.every(p => p.level === 'borderline'));
  assert.ok(data.ages.length >= 4);
});

test('community: 단계 + 나이대 필터', async () => {
  const { data } = await call('/posts?level=borderline&age=lower');
  assert.ok(data.posts.length > 0);
  assert.ok(data.posts.every(p => p.level === 'borderline' && p.age === 'lower'));
  const none = await call('/posts?level=moderate&age=preschool');
  assert.equal(none.data.posts.length, 0);
});

test('아이 단계 설정 → 글 기본 단락으로 사용', async () => {
  const token = await login('parent3@turtley.dev');
  assert.equal((await call('/me', { method: 'PATCH', token, body: { childLevel: 'nope' } })).status, 400);
  const r = await call('/me', { method: 'PATCH', token, body: { childLevel: 'mild', childAge: 'lower' } });
  assert.equal(r.data.user.childLevel, 'mild');
  const { data } = await call('/posts', { method: 'POST', token, body: { content: '기본 단락 테스트' } });
  assert.equal(data.post.level, 'mild');
  assert.equal(data.post.age, 'lower');
  const picked = await call('/posts', { method: 'POST', token, body: { content: '직접 고른 단락', level: 'observing', age: 'preschool' } });
  assert.equal(picked.data.post.level, 'observing');
  // 튜터는 아이 정보를 바꿀 수 없음 (무시)
  const tutor = await login('tutor@turtley.dev');
  const t = await call('/me', { method: 'PATCH', token: tutor, body: { childLevel: 'mild' } });
  assert.equal(t.data.user.childLevel, undefined);
});
