// TEST_DATABASE_URL 이 있을 때만 실행 (CI 에서는 Postgres 서비스로 실행)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const url = process.env.TEST_DATABASE_URL;

test('PgStore: 재시작해도 데이터가 남는다', { skip: !url && 'TEST_DATABASE_URL 없음' }, async () => {
  const { PgStore } = require('../server/pg-store');

  const a = await new PgStore(url).load();
  a.reset();
  a.insert('posts', { content: '첫 번째', likes: [], comments: [] });
  for (let i = 0; i < 20; i++) a.insert('posts', { content: `연속 ${i}`, likes: [], comments: [] }); // 쓰기 몰림
  await a.close();

  const b = await new PgStore(url).load();
  assert.equal(b.all('posts').length, 21);
  assert.equal(b.all('posts')[20].content, '연속 19');
  b.reset();
  await b.close();
});
