const path = require('path');
const { Store } = require('./db');
const { createApp } = require('./app');
const { seed } = require('./seed');

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

const db = new Store(DB_FILE);
if (db.isEmpty()) {
  seed(db);
  console.log('첫 실행이라 데모 데이터를 넣었어요.');
}

createApp(db).listen(PORT, () => {
  console.log(`터틀리 데모 서버: http://localhost:${PORT}`);
  console.log('   데모 계정  학부모 parent@turtley.dev / 튜터 tutor@turtley.dev  (비밀번호 demo1234)');
});
