const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { hashPassword, verifyPassword, publicUser, attachUser, requireAuth } = require('./auth');
const { PLANS, PLATFORM_FEE_RATE, quote } = require('./pricing');

function createApp(db) {
  const app = express();
  app.use(express.json({ limit: '100kb' }));
  app.use(attachUser(db));

  const api = express.Router();
  const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
  const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

  api.get('/health', (_req, res) => res.json({ ok: true, name: 'turtley', storage: db.kind, time: new Date().toISOString() }));

  // ───────────── 인증 ─────────────
  api.post('/auth/signup', (req, res) => {
    const name = str(req.body.name, 30);
    const email = str(req.body.email, 100).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const role = req.body.role === 'tutor' ? 'tutor' : 'parent';
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) return bad(res, '이름과 올바른 이메일을 입력해 주세요.');
    if (password.length < 6) return bad(res, '비밀번호는 6자 이상이어야 해요.');
    if (db.find('users', u => u.email === email)) return bad(res, '이미 가입된 이메일이에요.', 409);

    const { salt, hash } = hashPassword(password);
    const user = db.insert('users', { name, email, role, salt, passwordHash: hash, region: str(req.body.region, 30) || '서울' });
    if (role === 'tutor') {
      db.insert('tutors', {
        userId: user.id, name, intro: '안녕하세요! 천천히, 함께 가는 튜터입니다.',
        subjects: ['국어'], regions: [user.region], online: true, career: '', rating: 0, reviewCount: 0,
        tags: [],
      });
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.insert('sessions', { userId: user.id, token });
    res.status(201).json({ token, user: publicUser(user) });
  });

  api.post('/auth/login', (req, res) => {
    const email = str(req.body.email, 100).toLowerCase();
    const user = db.find('users', u => u.email === email);
    if (!user || !verifyPassword(String(req.body.password || ''), user.salt, user.passwordHash)) {
      return bad(res, '이메일 또는 비밀번호가 맞지 않아요.', 401);
    }
    const token = crypto.randomBytes(24).toString('hex');
    db.insert('sessions', { userId: user.id, token });
    res.json({ token, user: publicUser(user) });
  });

  api.post('/auth/logout', requireAuth(), (req, res) => {
    const token = req.headers.authorization.slice(7);
    db.remove('sessions', s => s.token === token);
    res.json({ ok: true });
  });

  api.get('/me', requireAuth(), (req, res) => {
    const tutor = db.find('tutors', t => t.userId === req.user.id);
    res.json({ user: publicUser(req.user), tutor: tutor || null });
  });

  // ───────────── 튜터 (직접 선택형 매칭) ─────────────
  api.get('/tutors', (req, res) => {
    const subject = str(req.query.subject, 20);
    const region = str(req.query.region, 20);
    const q = str(req.query.q, 50);
    const online = req.query.online === 'true';
    let list = db.all('tutors');
    if (subject) list = list.filter(t => t.subjects.includes(subject));
    if (region) list = list.filter(t => t.regions.includes(region) || t.online);
    if (online) list = list.filter(t => t.online);
    if (q) list = list.filter(t => (t.name + t.intro + t.tags.join(' ')).includes(q));
    list = [...list].sort((a, b) => b.rating - a.rating);
    res.json({ tutors: list });
  });

  api.get('/tutors/:id', (req, res) => {
    const t = db.find('tutors', x => x.id === req.params.id);
    if (!t) return bad(res, '튜터를 찾을 수 없어요.', 404);
    res.json({ tutor: t });
  });

  api.patch('/tutors/me', requireAuth('tutor'), (req, res) => {
    const t = db.find('tutors', x => x.userId === req.user.id);
    const patch = {};
    if (req.body.intro !== undefined) patch.intro = str(req.body.intro, 300);
    if (req.body.career !== undefined) patch.career = str(req.body.career, 200);
    if (Array.isArray(req.body.subjects)) patch.subjects = req.body.subjects.map(s => str(s, 20)).filter(Boolean).slice(0, 6);
    if (Array.isArray(req.body.regions)) patch.regions = req.body.regions.map(s => str(s, 20)).filter(Boolean).slice(0, 6);
    if (typeof req.body.online === 'boolean') patch.online = req.body.online;
    res.json({ tutor: db.update('tutors', t.id, patch) });
  });

  // ───────────── 요금 / 예약 (안전거래 중개) ─────────────
  api.get('/plans', (_req, res) => {
    res.json({ feeRate: PLATFORM_FEE_RATE, plans: Object.keys(PLANS).map(quote) });
  });

  api.post('/bookings', requireAuth('parent'), (req, res) => {
    const tutor = db.find('tutors', t => t.id === req.body.tutorId);
    if (!tutor) return bad(res, '튜터를 찾을 수 없어요.', 404);
    const q = quote(req.body.plan);
    if (!q) return bad(res, '요금제를 선택해 주세요.');
    const childName = str(req.body.childName, 20);
    if (!childName) return bad(res, '아이 이름(또는 별명)을 입력해 주세요.');
    const booking = db.insert('bookings', {
      parentId: req.user.id, parentName: req.user.name,
      tutorId: tutor.id, tutorName: tutor.name,
      childName, childAge: Number(req.body.childAge) || null,
      message: str(req.body.message, 500),
      ...q,
      status: 'requested',   // requested → accepted → completed (or rejected)
      payment: 'escrow_held' // 데모: 플랫폼이 결제금을 보관(에스크로)했다고 가정
    });
    res.status(201).json({ booking });
  });

  api.get('/bookings', requireAuth(), (req, res) => {
    let list;
    if (req.user.role === 'parent') list = db.filter('bookings', b => b.parentId === req.user.id);
    else {
      const t = db.find('tutors', x => x.userId === req.user.id);
      list = db.filter('bookings', b => b.tutorId === t?.id);
    }
    res.json({ bookings: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
  });

  const TRANSITIONS = {
    tutor:  { requested: ['accepted', 'rejected'], accepted: ['completed'] },
    parent: { requested: ['cancelled'] },
  };
  api.patch('/bookings/:id', requireAuth(), (req, res) => {
    const b = db.find('bookings', x => x.id === req.params.id);
    if (!b) return bad(res, '예약을 찾을 수 없어요.', 404);
    const myTutor = db.find('tutors', x => x.userId === req.user.id);
    const mine = req.user.role === 'parent' ? b.parentId === req.user.id : b.tutorId === myTutor?.id;
    if (!mine) return bad(res, '권한이 없어요.', 403);
    const next = req.body.status;
    const allowed = TRANSITIONS[req.user.role][b.status] || [];
    if (!allowed.includes(next)) return bad(res, `'${b.status}' 상태에서 '${next}'(으)로 바꿀 수 없어요.`);
    const payment = next === 'completed' ? 'paid_out' : (next === 'rejected' || next === 'cancelled') ? 'refunded' : b.payment;
    res.json({ booking: db.update('bookings', b.id, { status: next, payment }) });
  });

  api.post('/bookings/:id/review', requireAuth('parent'), (req, res) => {
    const b = db.find('bookings', x => x.id === req.params.id && x.parentId === req.user.id);
    if (!b) return bad(res, '예약을 찾을 수 없어요.', 404);
    if (b.status !== 'completed') return bad(res, '수업이 끝난 뒤에 후기를 남길 수 있어요.');
    if (b.review) return bad(res, '이미 후기를 남겼어요.');
    const rating = Math.max(1, Math.min(5, Math.round(Number(req.body.rating) || 5)));
    db.update('bookings', b.id, { review: { rating, text: str(req.body.text, 300) } });
    const t = db.find('tutors', x => x.id === b.tutorId);
    const total = t.rating * t.reviewCount + rating;
    db.update('tutors', t.id, { reviewCount: t.reviewCount + 1, rating: Math.round((total / (t.reviewCount + 1)) * 10) / 10 });
    res.json({ ok: true });
  });

  // 튜터 정산 요약 (80% 지급)
  api.get('/tutor/earnings', requireAuth('tutor'), (req, res) => {
    const t = db.find('tutors', x => x.userId === req.user.id);
    const list = db.filter('bookings', b => b.tutorId === t.id);
    const sum = (st) => list.filter(b => st.includes(b.status)).reduce((s, b) => s + b.tutorPayout, 0);
    res.json({ paid: sum(['completed']), pending: sum(['accepted']), requests: list.filter(b => b.status === 'requested').length });
  });

  // ───────────── 커뮤니티 (전국 단위 연합) ─────────────
  const viewPost = (p, user) => ({
    ...p, likeCount: p.likes.length, liked: !!user && p.likes.includes(user.id), likes: undefined,
  });

  api.get('/posts', (req, res) => {
    const tag = str(req.query.tag, 20);
    const region = str(req.query.region, 20);
    let list = db.all('posts');
    if (tag) list = list.filter(p => p.tag === tag);
    if (region) list = list.filter(p => p.region === region);
    list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    res.json({ posts: list.map(p => viewPost(p, req.user)) });
  });

  api.post('/posts', requireAuth(), (req, res) => {
    const content = str(req.body.content, 1000);
    if (!content) return bad(res, '내용을 입력해 주세요.');
    const TAGS = ['한걸음', '질문', '정보', '모임'];
    const post = db.insert('posts', {
      userId: req.user.id, authorName: req.user.name, authorRole: req.user.role,
      region: str(req.body.region, 20) || req.user.region || '전국',
      tag: TAGS.includes(req.body.tag) ? req.body.tag : '한걸음',
      content, likes: [], comments: [],
    });
    res.status(201).json({ post: viewPost(post, req.user) });
  });

  api.post('/posts/:id/like', requireAuth(), (req, res) => {
    const p = db.find('posts', x => x.id === req.params.id);
    if (!p) return bad(res, '글을 찾을 수 없어요.', 404);
    const likes = p.likes.includes(req.user.id) ? p.likes.filter(x => x !== req.user.id) : [...p.likes, req.user.id];
    res.json({ post: viewPost(db.update('posts', p.id, { likes }), req.user) });
  });

  api.post('/posts/:id/comments', requireAuth(), (req, res) => {
    const p = db.find('posts', x => x.id === req.params.id);
    if (!p) return bad(res, '글을 찾을 수 없어요.', 404);
    const content = str(req.body.content, 300);
    if (!content) return bad(res, '댓글을 입력해 주세요.');
    const comments = [...p.comments, { id: db.id(), userId: req.user.id, authorName: req.user.name, content, createdAt: new Date().toISOString() }];
    res.status(201).json({ post: viewPost(db.update('posts', p.id, { comments }), req.user) });
  });

  api.delete('/posts/:id', requireAuth(), (req, res) => {
    const p = db.find('posts', x => x.id === req.params.id);
    if (!p) return bad(res, '글을 찾을 수 없어요.', 404);
    if (p.userId !== req.user.id) return bad(res, '내 글만 지울 수 있어요.', 403);
    db.remove('posts', x => x.id === p.id);
    res.json({ ok: true });
  });

  // ───────────── e-도서관 (시청각 자료) ─────────────
  api.get('/library', (req, res) => {
    const category = str(req.query.category, 20);
    const free = req.query.free;
    let list = db.all('library');
    if (category) list = list.filter(x => x.category === category);
    if (free === 'true') list = list.filter(x => x.free);
    res.json({ items: list });
  });

  api.get('/library/:id', (req, res) => {
    const item = db.find('library', x => x.id === req.params.id);
    if (!item) return bad(res, '자료를 찾을 수 없어요.', 404);
    res.json({ item });
  });

  app.use('/api', api);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

  // 프론트엔드 (정적 SPA)
  const pub = path.join(__dirname, '..', 'public');
  // 웹폰트는 npm 패키지에서 바로 서빙 (CDN 의존 없음)
  const fontDir = (pkg, sub = '') => path.join(path.dirname(require.resolve(pkg + '/package.json')), sub);
  app.use('/fonts/pretendard', express.static(fontDir('pretendard', 'dist/web/variable'), { maxAge: '30d' }));
  app.use('/fonts/gowun', express.static(fontDir('@fontsource/gowun-dodum'), { maxAge: '30d' }));
  app.use(express.static(pub));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(pub, 'index.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.status === 400 ? '잘못된 요청이에요.' : '서버 오류가 발생했어요.' });
  });

  return app;
}

module.exports = { createApp };
