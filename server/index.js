const { openStore } = require('./db');
const { createApp } = require('./app');
const { seed } = require('./seed');

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  const db = await openStore();
  const where = { postgres: 'PostgreSQL (DATABASE_URL)', file: `파일 ${db.file}` }[db.kind];
  console.log(`[db] 저장소: ${where}`);
  if (db.kind === 'file' && process.env.RENDER) {
    console.warn('[db] 주의: Render 에서 DATABASE_URL 없이 실행 중이라 재시작하면 데이터가 초기화됩니다.');
  }
  // 데이터 구조 버전이 바뀌면(예: v1 → v2) 데모 데이터를 새 구조로 다시 넣습니다.
  const SCHEMA = 2;
  if (db.isEmpty() || db.data.meta?.schema !== SCHEMA) {
    if (!db.isEmpty()) console.warn(`[db] 데이터 구조가 바뀌어(v${db.data.meta?.schema || 1} → v${SCHEMA}) 데모 데이터를 새로 넣어요.`);
    db.reset();
    seed(db);
    db.data.meta = { schema: SCHEMA, seededAt: new Date().toISOString() };
    db.save();
    console.log('[db] 데모 데이터를 넣었어요.');
  }

  const server = createApp(db).listen(PORT, () => {
    console.log(`터틀리 데모 서버: http://localhost:${PORT}`);
    console.log('   데모 계정  학부모 parent@turtley.dev / 튜터 tutor@turtley.dev  (비밀번호 demo1234)');
  });

  // Render 는 재배포/재시작 전에 SIGTERM 을 보냅니다. 남은 쓰기를 끝내고 종료.
  const shutdown = async sig => {
    console.log(`${sig} 받음, 저장 마무리 후 종료합니다.`);
    server.close();
    await db.close();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch(err => {
  console.error('[db] 저장소를 열지 못했어요:', err.message);
  console.error('     DATABASE_URL 이 맞는지, DB 가 같은 리전에 있는지 확인하세요.');
  process.exit(1);
});
