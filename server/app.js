const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { hashPassword, verifyPassword } = require('./auth');
const { createCore } = require('./core');

const nodeAuth = {
  hash: pw => hashPassword(pw),
  verify: (pw, salt, hash) => !!salt && !!hash && verifyPassword(pw, salt, hash),
  token: () => crypto.randomBytes(24).toString('hex'),
};

function createApp(db) {
  const app = express();
  const core = createCore(db, nodeAuth);
  app.use(express.json({ limit: '100kb' }));

  // 모든 API 는 core 가 처리 (미리보기와 같은 코드)
  app.use('/api', async (req, res) => {
    const h = req.headers.authorization || '';
    const out = await core.handle({
      method: req.method, path: req.path, query: req.query, body: req.body,
      token: h.startsWith('Bearer ') ? h.slice(7) : null,
    });
    res.status(out.status).json(out.body);
  });

  // 정적 파일
  const root = path.join(__dirname, '..');
  const fontDir = (pkg, sub = '') => path.join(path.dirname(require.resolve(pkg + '/package.json')), sub);
  app.use('/fonts/pretendard', express.static(fontDir('pretendard', 'dist/web/variable'), { maxAge: '30d' }));
  app.use('/fonts/pen', express.static(fontDir('@fontsource/nanum-pen-script'), { maxAge: '30d' }));
  app.use('/shared', express.static(path.join(root, 'shared')));
  app.use(express.static(path.join(root, 'public')));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(root, 'public', 'index.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status === 400 ? '잘못된 요청이에요.' : '서버 오류가 발생했어요.' });
  });
  return app;
}

module.exports = { createApp };
