// 미리보기용 가짜 API. 서버(server/app.js)와 같은 응답 형태를 브라우저 메모리에서 흉내 냅니다.
// build-preview.js 가 시드 데이터를 window.__SEED 로 넣고 이 파일을 app.js 앞에 붙입니다.
(() => {
  const db = JSON.parse(JSON.stringify(window.__SEED));
  const pw = {}; // 새로 가입한 계정 비밀번호 (시드 계정은 demo1234)
  const sessions = {};
  const FEE = 0.2;
  const PLANS = { monthly8: { label: '월 8회 정기 수업', sessions: 8, price: 240000 }, single: { label: '1회 체험 수업', sessions: 1, price: 35000 } };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2));
  const now = () => new Date().toISOString();
  const quote = k => { const p = PLANS[k]; if (!p) return null; const fee = Math.round(p.price * FEE); return { plan: k, ...p, amount: p.price, platformFee: fee, tutorPayout: p.price - fee }; };
  const pub = u => u && { id: u.id, name: u.name, email: u.email, role: u.role, region: u.region, childLevel: u.childLevel, childAge: u.childAge };
  const G = window.__GROUPS;
  const isLevel = k => G.levels.some(l => l.key === k);
  const isAge = k => G.ages.some(a => a.key === k);
  const viewPost = (p, u) => ({ ...p, likeCount: p.likes.length, liked: !!u && p.likes.includes(u.id), likes: undefined });
  const myTutor = u => db.tutors.find(t => t.userId === u?.id);

  class E extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  const need = (u, role) => { if (!u) throw new E(401, '로그인이 필요해요.'); if (role && u.role !== role) throw new E(403, '권한이 없어요.'); };

  const routes = [
    ['GET', /^\/health$/, () => ({ ok: true, storage: 'preview' })],
    ['POST', /^\/auth\/login$/, (_m, b) => {
      const u = db.users.find(x => x.email === String(b.email || '').toLowerCase());
      if (!u || (pw[u.id] ?? 'demo1234') !== b.password) throw new E(401, '이메일 또는 비밀번호가 맞지 않아요.');
      const token = uid(); sessions[token] = u.id; return { token, user: pub(u) };
    }],
    ['POST', /^\/auth\/signup$/, (_m, b) => {
      const email = String(b.email || '').trim().toLowerCase();
      if (!b.name || !/^\S+@\S+\.\S+$/.test(email)) throw new E(400, '이름과 올바른 이메일을 입력해 주세요.');
      if (String(b.password || '').length < 6) throw new E(400, '비밀번호는 6자 이상이어야 해요.');
      if (db.users.find(x => x.email === email)) throw new E(409, '이미 가입된 이메일이에요.');
      const role = b.role === 'tutor' ? 'tutor' : 'parent';
      const u = { id: uid(), name: b.name.trim(), email, role, region: (b.region || '서울').trim(), createdAt: now(),
        ...(role === 'parent' ? { childLevel: isLevel(b.childLevel) ? b.childLevel : null, childAge: isAge(b.childAge) ? b.childAge : null } : {}) };
      db.users.push(u); pw[u.id] = b.password;
      if (u.role === 'tutor') db.tutors.push({ id: uid(), userId: u.id, name: u.name, intro: '안녕하세요! 천천히, 함께 가는 튜터입니다.', subjects: ['국어'], regions: [u.region], online: true, career: '', rating: 0, reviewCount: 0, tags: [] });
      const token = uid(); sessions[token] = u.id; return { token, user: pub(u) };
    }],
    ['POST', /^\/auth\/logout$/, () => ({ ok: true })],
    ['GET', /^\/me$/, (_m, _b, u) => { need(u); return { user: pub(u), tutor: myTutor(u) || null }; }],
    ['PATCH', /^\/me$/, (_m, b, u) => {
      need(u);
      if (b.region !== undefined) u.region = String(b.region).trim() || u.region;
      if (u.role === 'parent') {
        if (b.childLevel !== undefined) { if (b.childLevel !== null && !isLevel(b.childLevel)) throw new E(400, '아이 단계를 다시 골라 주세요.'); u.childLevel = b.childLevel; }
        if (b.childAge !== undefined) { if (b.childAge !== null && !isAge(b.childAge)) throw new E(400, '아이 나이대를 다시 골라 주세요.'); u.childAge = b.childAge; }
      }
      return { user: pub(u) };
    }],
    ['GET', /^\/community\/groups$/, () => ({ levels: G.levels.map(l => ({ ...l, postCount: db.posts.filter(p => p.level === l.key).length })), ages: G.ages, total: db.posts.length })],
    ['GET', /^\/tutors$/, (_m, _b, _u, q) => {
      let l = db.tutors;
      if (q.get('subject')) l = l.filter(t => t.subjects.includes(q.get('subject')));
      if (q.get('online') === 'true') l = l.filter(t => t.online);
      if (q.get('q')) l = l.filter(t => (t.name + t.intro + t.tags.join(' ')).includes(q.get('q')));
      return { tutors: [...l].sort((a, b) => b.rating - a.rating) };
    }],
    ['PATCH', /^\/tutors\/me$/, (_m, b, u) => { need(u, 'tutor'); return { tutor: Object.assign(myTutor(u), b) }; }],
    ['GET', /^\/tutors\/([^/]+)$/, m => { const t = db.tutors.find(x => x.id === m[1]); if (!t) throw new E(404, '튜터를 찾을 수 없어요.'); return { tutor: t }; }],
    ['GET', /^\/plans$/, () => ({ feeRate: FEE, plans: Object.keys(PLANS).map(quote) })],
    ['POST', /^\/bookings$/, (_m, b, u) => {
      need(u, 'parent');
      const t = db.tutors.find(x => x.id === b.tutorId); if (!t) throw new E(404, '튜터를 찾을 수 없어요.');
      const q = quote(b.plan); if (!q) throw new E(400, '요금제를 선택해 주세요.');
      if (!String(b.childName || '').trim()) throw new E(400, '아이 이름(또는 별명)을 입력해 주세요.');
      const bk = { id: uid(), createdAt: now(), parentId: u.id, parentName: u.name, tutorId: t.id, tutorName: t.name, childName: b.childName.trim(), childAge: Number(b.childAge) || null, message: (b.message || '').trim(), ...q, status: 'requested', payment: 'escrow_held' };
      db.bookings.push(bk); return { booking: bk };
    }],
    ['GET', /^\/bookings$/, (_m, _b, u) => {
      need(u);
      const l = u.role === 'parent' ? db.bookings.filter(b => b.parentId === u.id) : db.bookings.filter(b => b.tutorId === myTutor(u)?.id);
      return { bookings: [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
    }],
    ['PATCH', /^\/bookings\/([^/]+)$/, (m, b, u) => {
      need(u);
      const bk = db.bookings.find(x => x.id === m[1]); if (!bk) throw new E(404, '예약을 찾을 수 없어요.');
      const T = { tutor: { requested: ['accepted', 'rejected'], accepted: ['completed'] }, parent: { requested: ['cancelled'] } };
      if (!(T[u.role][bk.status] || []).includes(b.status)) throw new E(400, '지금 상태에서는 바꿀 수 없어요.');
      bk.status = b.status; bk.payment = b.status === 'completed' ? 'paid_out' : ['rejected', 'cancelled'].includes(b.status) ? 'refunded' : bk.payment;
      return { booking: bk };
    }],
    ['POST', /^\/bookings\/([^/]+)\/review$/, (m, b, u) => {
      need(u, 'parent');
      const bk = db.bookings.find(x => x.id === m[1] && x.parentId === u.id);
      if (!bk || bk.status !== 'completed') throw new E(400, '수업이 끝난 뒤에 후기를 남길 수 있어요.');
      const r = Math.max(1, Math.min(5, Number(b.rating) || 5)); bk.review = { rating: r, text: (b.text || '').trim() };
      const t = db.tutors.find(x => x.id === bk.tutorId); t.rating = Math.round(((t.rating * t.reviewCount + r) / (t.reviewCount + 1)) * 10) / 10; t.reviewCount++;
      return { ok: true };
    }],
    ['GET', /^\/tutor\/earnings$/, (_m, _b, u) => {
      need(u, 'tutor'); const l = db.bookings.filter(b => b.tutorId === myTutor(u).id);
      const sum = s => l.filter(b => s.includes(b.status)).reduce((a, b) => a + b.tutorPayout, 0);
      return { paid: sum(['completed']), pending: sum(['accepted']), requests: l.filter(b => b.status === 'requested').length };
    }],
    ['GET', /^\/posts$/, (_m, _b, u, q) => {
      let l = db.posts;
      if (q.get('level')) l = l.filter(p => p.level === q.get('level'));
      if (q.get('age')) l = l.filter(p => p.age === q.get('age'));
      if (q.get('tag')) l = l.filter(p => p.tag === q.get('tag'));
      return { posts: [...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(p => viewPost(p, u)) };
    }],
    ['POST', /^\/posts$/, (_m, b, u) => {
      need(u); if (!String(b.content || '').trim()) throw new E(400, '내용을 입력해 주세요.');
      const p = { id: uid(), createdAt: now(), userId: u.id, authorName: u.name, authorRole: u.role, region: (b.region || u.region || '전국').trim(), tag: b.tag || '한걸음', level: isLevel(b.level) ? b.level : (u.childLevel || 'observing'), age: isAge(b.age) ? b.age : (u.childAge || null), content: b.content.trim(), likes: [], comments: [] };
      db.posts.push(p); return { post: viewPost(p, u) };
    }],
    ['POST', /^\/posts\/([^/]+)\/like$/, (m, _b, u) => {
      need(u); const p = db.posts.find(x => x.id === m[1]);
      p.likes = p.likes.includes(u.id) ? p.likes.filter(x => x !== u.id) : [...p.likes, u.id]; return { post: viewPost(p, u) };
    }],
    ['POST', /^\/posts\/([^/]+)\/comments$/, (m, b, u) => {
      need(u); const p = db.posts.find(x => x.id === m[1]);
      if (!String(b.content || '').trim()) throw new E(400, '댓글을 입력해 주세요.');
      p.comments.push({ id: uid(), userId: u.id, authorName: u.name, content: b.content.trim(), createdAt: now() }); return { post: viewPost(p, u) };
    }],
    ['DELETE', /^\/posts\/([^/]+)$/, (m, _b, u) => {
      need(u); const p = db.posts.find(x => x.id === m[1]); if (p.userId !== u.id) throw new E(403, '내 글만 지울 수 있어요.');
      db.posts = db.posts.filter(x => x !== p); return { ok: true };
    }],
    ['GET', /^\/library$/, (_m, _b, _u, q) => ({ items: q.get('category') ? db.library.filter(x => x.category === q.get('category')) : db.library })],
  ];

  window.__turtleyFetch = async (url, opt = {}) => {
    const u0 = new URL(url, 'http://x');
    const path = u0.pathname.replace(/^\/api/, '');
    const tok = (opt.headers?.Authorization || '').replace('Bearer ', '');
    const user = db.users.find(x => x.id === sessions[tok]) || null;
    const body = opt.body ? JSON.parse(opt.body) : {};
    let status = 200, data;
    try {
      const r = routes.find(([m, re]) => m === (opt.method || 'GET') && re.test(path));
      if (!r) throw new E(404, 'Not found');
      data = r[2](path.match(r[1]), body, user, u0.searchParams);
    } catch (e) { status = e.code || 500; data = { error: e.message }; }
    await new Promise(r => setTimeout(r, 60));
    return { ok: status < 400, status, json: async () => JSON.parse(JSON.stringify(data)) };
  };
})();
