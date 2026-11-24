// 터틀리 API 핵심 로직.
// Express(server/app.js)와 서버 없는 미리보기(scripts/build-preview.js)가 이 파일을 똑같이 씁니다.
// 입력: { method, path, query, body, token } → 출력: { status, body }
const C = require('../shared/constants');
const { SUBJECTS, TARGETS, MODES, REGIONS, TRAITS, TRAIT_ADJ, DOCS, PRICE_MIN, PRICE_MAX, TUTOR_SHARE, BOARDS, LEVELS, AGES, VOUCHERS, refundRate } = C;

const SUBJ_IDS = SUBJECTS.map(s => s.id);
const str = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, allowed, max = 10) => (Array.isArray(v) ? [...new Set(v.filter(x => allowed.includes(x)))].slice(0, max) : []);
const isLevel = k => LEVELS.some(l => l.key === k);
const isAge = k => AGES.some(a => a.key === k);
const SLOT_RE = /^[월화수목금토] (10|13|15|16|17|19)$/;
const maskPhone = s => s.replace(/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g, '(연락처 가림)');

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };

const CENTER_REPLY = '접수했어요. 운영팀이 순서대로 연락드릴게요. 급한 안전 문제는 112에 먼저 알려 주세요.';
const AUTO_REPLIES = ['네, 확인했어요. 수업 때 같이 해볼게요.', '좋아요! 그 시간 괜찮아요.', '집에서는 하루 3분만 해도 충분해요.', '오늘 기록 올려드릴게요.'];

function createCore(db, auth) {
  const now = () => new Date().toISOString();
  const pubUser = u => u && { id: u.id, role: u.role, name: u.name, email: u.email, region: u.region };
  const tutorOf = u => u && db.find('tutors', t => t.userId === u.id);
  const pubTutor = t => {
    const { userId, docs, demoAuto, ...rest } = t;
    return rest;
  };
  const need = (u, ...roles) => {
    if (!u) fail(401, '로그인이 필요해요.');
    if (roles.length && !roles.includes(u.role)) fail(403, '이 계정으로는 할 수 없어요.');
  };
  const issue = u => {
    const token = auth.token();
    db.insert('sessions', { userId: u.id, token });
    return { token, user: pubUser(u) };
  };

  // ── 스레드(채팅) ──
  function threadFor(a, b, tutorId) {
    let th = db.find('threads', x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (!th) th = db.insert('threads', { a, b, tutorId: tutorId || null, msgs: [{ from: 'sys', t: '연락처는 서로 공개되지 않아요. 대화는 터틀리 안에서만 이어져요.', at: now() }] });
    return th;
  }
  function pushMsg(th, from, t) {
    th.msgs.push({ from, t, at: now() });
    db.update('threads', th.id, { msgs: th.msgs });
  }
  function viewThread(th, me) {
    const otherId = th.a === me.id ? th.b : th.a;
    const other = otherId ? db.find('users', u => u.id === otherId) : null;
    const otherTutor = other && db.find('tutors', t => t.userId === other.id);
    const name = !other ? '터틀리 안심센터' : other.role === 'tutor' ? `${other.name} 선생님` : `${other.name} 보호자`;
    return {
      id: th.id, name, center: !other, tutorId: otherTutor?.id || null, hue: otherTutor?.hue || null,
      msgs: th.msgs.map(m => ({ me: m.from === me.id, sys: m.from === 'sys', t: m.t, at: m.at })),
    };
  }

  // ── 정산 ──
  function earnings(t) {
    const bks = db.filter('bookings', b => b.tutorId === t.id && b.status === 'active');
    const done = db.filter('lessons', l => l.tutorId === t.id && l.confirmed && bks.some(b => b.id === l.bookingId)).length;
    const pending = db.filter('lessons', l => l.tutorId === t.id && !l.confirmed).length;
    const planned = bks.reduce((s, b) => s + b.pkg, 0) - done;
    const per = t.price * TUTOR_SHARE;
    return { done, planned: Math.max(0, planned), pending, perSession: per, paid: done * per, expected: (done + Math.max(0, planned)) * per };
  }

  // ── 화면이 처음 받는 상태 ──
  function state(me) {
    const posts = db.all('posts');
    const groups = {
      levels: LEVELS.map(l => ({ ...l, postCount: posts.filter(p => p.level === l.key).length })),
      ages: AGES, total: posts.length,
    };
    const tutors = db.filter('tutors', t => t.status === 'approved').map(pubTutor);
    const library = db.all('library');
    const base = { user: null, groups, tutors, library, kids: [], bookings: [], lessons: [], threads: [], requests: [], saved: { tutor: [], lib: [] } };
    if (!me) return base;

    const saved = db.filter('saved', s => s.userId === me.id);
    const out = { ...base, user: pubUser(me), saved: { tutor: saved.filter(s => s.kind === 'tutor').map(s => s.ref), lib: saved.filter(s => s.kind === 'lib').map(s => s.ref) } };
    out.threads = db.filter('threads', th => th.a === me.id || th.b === me.id).map(th => viewThread(th, me))
      .sort((x, y) => (y.msgs.at(-1)?.at || '').localeCompare(x.msgs.at(-1)?.at || ''));

    if (me.role === 'parent' || me.role === 'admin') {
      out.kids = db.filter('kids', k => k.parentId === me.id);
      out.bookings = db.filter('bookings', b => b.parentId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      out.lessons = db.filter('lessons', l => out.kids.some(k => k.id === l.kidId)).sort((a, b) => b.d.localeCompare(a.d));
      out.requests = db.filter('requests', r => r.parentId === me.id).map(r => ({
        ...r, apps: db.filter('applications', a => a.requestId === r.id).map(a => ({ ...a, tutor: pubTutor(db.find('tutors', t => t.id === a.tutorId)) })),
      }));
    }
    if (me.role === 'tutor') {
      const t = tutorOf(me);
      out.myTutor = t ? { ...pubTutor(t), docs: t.docs } : null;
      if (t) {
        out.bookings = db.filter('bookings', b => b.tutorId === t.id).map(b => {
          const k = db.find('kids', x => x.id === b.kidId);
          return { ...b, kid: k ? { name: k.name, grade: k.grade, traits: k.traits } : null };
        });
        out.lessons = db.filter('lessons', l => l.tutorId === t.id).sort((a, b) => b.d.localeCompare(a.d));
        out.earnings = earnings(t);
        const mine = db.filter('applications', a => a.tutorId === t.id);
        out.requests = db.all('requests').map(r => ({
          id: r.id, childLabel: r.childLabel, subj: r.subj, traits: r.traits, memo: r.memo, mode: r.mode, region: r.region, dist: r.dist,
          slots: r.slots, days: r.days, budget: r.budget, createdAt: r.createdAt,
          apps: db.filter('applications', a => a.requestId === r.id).length + (r.appsBase || 0),
          applied: mine.some(a => a.requestId === r.id),
        })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    }
    if (me.role === 'admin') {
      out.queue = db.filter('tutors', t => t.status === 'pending').map(t => ({ id: t.id, name: t.name, region: `${t.region} ${t.dist || ''}`.trim(), subj: (SUBJECTS.find(s => s.id === t.subj[0]) || {}).name || '', docs: t.docs, createdAt: t.createdAt }));
      out.reports = posts.filter(p => (p.reports || []).length).map(p => ({ id: p.id, title: p.title, count: p.reports.length }));
    }
    return out;
  }

  // ── 라우트 ──
  const R = [];
  const on = (method, pattern, fn) => R.push([method, pattern, fn]);

  on('GET', /^\/health$/, () => ({ ok: true, name: 'turtley', storage: db.kind, time: now() }));
  on('GET', /^\/state$/, ({ me }) => state(me));

  // 인증
  on('POST', /^\/auth\/login$/, ({ body }) => {
    const email = str(body.email, 100).toLowerCase();
    const u = db.find('users', x => x.email === email);
    if (!u || !auth.verify(String(body.password || ''), u.salt, u.passwordHash)) fail(401, '이메일 또는 비밀번호가 맞지 않아요.');
    return issue(u);
  });
  on('POST', /^\/auth\/demo$/, ({ body }) => {
    const email = { parent: 'parent@turtley.dev', tutor: 'tutor@turtley.dev', admin: 'admin@turtley.dev' }[body.role];
    const u = email && db.find('users', x => x.email === email);
    if (!u) fail(404, '데모 계정을 찾을 수 없어요.');
    return issue(u);
  });
  on('POST', /^\/auth\/logout$/, ({ token }) => { db.remove('sessions', s => s.token === token); return { ok: true }; });
  on('POST', /^\/auth\/signup$/, ({ body }) => {
    const type = ['parent', 'tutor', 'adult'].includes(body.type) ? body.type : fail(400, '회원 유형을 골라 주세요.');
    const name = str(body.name, 30), email = str(body.email, 100).toLowerCase(), pw = typeof body.password === 'string' ? body.password : '';
    if (!name) fail(400, '이름을 적어 주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, '이메일 모양을 다시 확인해 주세요.');
    if (!(pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw))) fail(400, '비밀번호는 영문과 숫자를 섞어 8자 이상이에요.');
    if (db.find('users', u => u.email === email)) fail(409, '이미 가입된 이메일이에요.');
    const c = body.consents || {};
    if (!c.service || !c.privacy) fail(400, '필수 항목에 모두 동의해 주세요.');
    const k = body.kid || {};
    if (type === 'parent') {
      if (!str(k.name, 20)) fail(400, '아이를 부르는 이름을 적어 주세요.');
      const age = new Date().getFullYear() - (+k.birth || 0);
      if (age < 14 && !(c.guardian && c.phoneOk)) fail(400, '만 14세 미만 아이는 보호자 동의와 휴대폰 확인이 필요해요.');
      if (str(k.diag, 500) && !c.sensitive) fail(400, '검사·상담 결과를 적었다면 민감정보 처리에 동의해 주세요.');
    }
    const ti = body.tutor || {};
    if (type === 'tutor') {
      if (!arr(ti.subj, SUBJ_IDS).length) fail(400, '과목을 하나 이상 골라 주세요.');
      if (!c.crime || !c.policy) fail(400, '필수 항목에 모두 동의해 주세요.');
    }
    const { salt, hash } = auth.hash(pw);
    const role = type === 'tutor' ? 'tutor' : 'parent';
    const region = REGIONS.includes(k.region || ti.region) ? (k.region || ti.region) : '서울';
    const u = db.insert('users', { role, adult: type === 'adult', name, email, salt, passwordHash: hash, region, consents: { ...c, at: now() } });
    if (type === 'parent') {
      db.insert('kids', {
        parentId: u.id, name: str(k.name, 20), birth: +k.birth || null, grade: str(k.grade, 20),
        traits: arr(k.traits, TRAITS), subj: arr(k.subj, SUBJ_IDS), goal: '', region, dist: str(k.dist, 30),
        level: isLevel(k.level) ? k.level : null, age: isAge(k.age) ? k.age : null,
        diag: c.sensitive ? str(k.diag, 500) : '',
      });
    }
    if (type === 'adult') {
      db.insert('kids', { parentId: u.id, self: true, name, birth: +body.adult?.birth || null, grade: '성인', traits: [], subj: [], learn: arr(body.adult?.learn, ['생활기술', '돈·통장 관리', '계약서 읽기', '직업 준비', '한글·읽기', '수 개념']), notifyGuardian: !!body.adult?.notify, region, dist: '', level: null, age: null });
    }
    if (type === 'tutor') {
      const price = Math.min(PRICE_MAX, Math.max(PRICE_MIN, Math.round((+ti.price || 30000) / 1000) * 1000));
      const files = ti.files || {};
      db.insert('tutors', {
        id: 't' + Date.now().toString(36), userId: u.id, name, hue: '#2272EB', region, dist: str(ti.dist, 30),
        modes: arr(ti.modes, Object.keys(MODES)).length ? arr(ti.modes, Object.keys(MODES)) : ['visit'],
        subj: arr(ti.subj, SUBJ_IDS), tg: arr(ti.tg, TARGETS), yrs: Math.max(0, Math.min(40, +ti.yrs || 0)), gap: str(ti.gap, 60), certs: [],
        price, fit: '', how: '', intro: '', approach: [], slots: [], trial: true,
        status: 'pending', docs: Object.fromEntries(DOCS.map(([d]) => [d, false])), files: Object.fromEntries(DOCS.map(([d]) => [d, str(files[d], 120)])),
      });
    }
    return issue(u);
  });

  on('PATCH', /^\/me$/, ({ me, body }) => {
    need(me);
    const patch = {};
    if (body.region !== undefined && REGIONS.includes(body.region)) patch.region = body.region;
    if (body.name !== undefined && str(body.name, 30)) patch.name = str(body.name, 30);
    return { user: pubUser(db.update('users', me.id, patch)) };
  });

  // 아이
  on('POST', /^\/kids$/, ({ me, body }) => {
    need(me, 'parent', 'admin');
    const name = str(body.name, 20); if (!name) fail(400, '부르는 이름을 적어 주세요.');
    const kid = db.insert('kids', {
      parentId: me.id, name, birth: +body.birth || null, grade: str(body.grade, 20), traits: arr(body.traits, TRAITS), subj: arr(body.subj, SUBJ_IDS),
      goal: str(body.goal, 100), region: REGIONS.includes(body.region) ? body.region : me.region, dist: str(body.dist, 30),
      level: isLevel(body.level) ? body.level : null, age: isAge(body.age) ? body.age : null,
    });
    return { kid };
  });
  on('PATCH', /^\/kids\/([^/]+)$/, ({ me, body, m }) => {
    need(me, 'parent', 'admin');
    const k = db.find('kids', x => x.id === m[1] && x.parentId === me.id) || fail(404, '아이를 찾을 수 없어요.');
    const patch = {};
    if (body.level !== undefined) { if (body.level !== null && !isLevel(body.level)) fail(400, '단계를 다시 골라 주세요.'); patch.level = body.level; }
    if (body.age !== undefined) { if (body.age !== null && !isAge(body.age)) fail(400, '나이대를 다시 골라 주세요.'); patch.age = body.age; }
    if (body.goal !== undefined) patch.goal = str(body.goal, 100);
    if (body.traits !== undefined) patch.traits = arr(body.traits, TRAITS);
    if (body.subj !== undefined) patch.subj = arr(body.subj, SUBJ_IDS);
    return { kid: db.update('kids', k.id, patch) };
  });

  // 튜터
  on('GET', /^\/tutors$/, () => ({ tutors: db.filter('tutors', t => t.status === 'approved').map(pubTutor) }));
  on('GET', /^\/tutors\/([^/]+)$/, ({ m }) => {
    const t = db.find('tutors', x => x.id === m[1] && x.status === 'approved') || fail(404, '선생님을 찾을 수 없어요.');
    const reviews = db.filter('bookings', b => b.tutorId === t.id && b.review).map(b => b.review);
    return { tutor: pubTutor(t), reviews };
  });
  on('PATCH', /^\/tutor\/avail$/, ({ me, body }) => {
    need(me, 'tutor');
    const t = tutorOf(me) || fail(404, '선생님 프로필이 없어요.');
    if (!SLOT_RE.test(body.slot || '')) fail(400, '시간 칸을 다시 골라 주세요.');
    const slots = t.slots.includes(body.slot) ? t.slots.filter(s => s !== body.slot) : [...t.slots, body.slot];
    return { slots: db.update('tutors', t.id, { slots }).slots };
  });

  // 저장(관심)
  on('POST', /^\/saved\/(tutor|lib)\/([^/]+)$/, ({ me, m }) => {
    need(me);
    const ex = db.find('saved', s => s.userId === me.id && s.kind === m[1] && s.ref === m[2]);
    if (ex) db.remove('saved', s => s.id === ex.id); else db.insert('saved', { userId: me.id, kind: m[1], ref: m[2] });
    return { saved: !ex };
  });

  // 수업 신청서 → 선생님 지원
  on('POST', /^\/requests$/, ({ me, body }) => {
    need(me, 'parent', 'admin');
    const k = db.find('kids', x => x.id === body.kidId && x.parentId === me.id) || fail(400, '아이를 골라 주세요.');
    const subj = arr(body.subj, SUBJ_IDS, 2); if (!subj.length) fail(400, '도움이 필요한 과목을 하나 골라 주세요.');
    const slots = (Array.isArray(body.slots) ? body.slots : []).filter(s => SLOT_RE.test(s)).slice(0, 36);
    if (!slots.length) fail(400, '가능한 시간을 한 칸 이상 골라 주세요.');
    const mode = MODES[body.mode] ? body.mode : 'visit';
    const budget = Math.min(PRICE_MAX, Math.max(PRICE_MIN, +body.budget || 30000));
    const childLabel = `${k.grade || '학년 미입력'}`;
    const r = db.insert('requests', {
      parentId: me.id, kidId: k.id, childLabel, subj, traits: arr(body.traits, TRAITS), memo: maskPhone(str(body.memo, 300)),
      mode, region: REGIONS.includes(body.region) ? body.region : k.region, dist: str(body.dist, 30), slots,
      days: slots.slice(0, 3).join(', ') + (slots.length > 3 ? ` 외 ${slots.length - 3}칸` : ''), budget,
    });
    // 데모: 과목이 맞는 선생님(데모 계정 제외)이 자동으로 지원
    db.filter('tutors', t => t.status === 'approved' && t.demoAuto && t.subj.some(s => subj.includes(s))).slice(0, 3).forEach(t => {
      const adj = r.traits[0] ? TRAIT_ADJ[r.traits[0]] + ' 아이와 여러 번 수업했어요.' : '';
      db.insert('applications', { requestId: r.id, tutorId: t.id, message: `${t.how}. ${adj}`.trim(), price: t.price });
    });
    return { request: r };
  });
  on('POST', /^\/requests\/([^/]+)\/apply$/, ({ me, body, m }) => {
    need(me, 'tutor');
    const t = tutorOf(me) || fail(404, '선생님 프로필이 없어요.');
    if (t.status !== 'approved') fail(403, '안심 인증이 끝난 뒤에 지원할 수 있어요.');
    const r = db.find('requests', x => x.id === m[1]) || fail(404, '신청서를 찾을 수 없어요.');
    if (db.find('applications', a => a.requestId === r.id && a.tutorId === t.id)) fail(409, '이미 지원했어요.');
    const price = Math.min(PRICE_MAX, Math.max(PRICE_MIN, +body.price || t.price));
    const msg = str(body.message, 300) || `${t.name} 선생님이 지원했어요.`;
    const a = db.insert('applications', { requestId: r.id, tutorId: t.id, message: maskPhone(msg), price });
    if (r.parentId && db.find('users', u => u.id === r.parentId)) {
      const th = threadFor(r.parentId, me.id, t.id);
      pushMsg(th, me.id, `[신청서 지원] ${a.message} (제안 수업료 회당 ${price.toLocaleString('ko-KR')}원)`);
    }
    return { application: a };
  });

  // 예약 + 결제(안전거래 보관)
  on('POST', /^\/bookings$/, ({ me, body }) => {
    need(me, 'parent', 'admin');
    const t = db.find('tutors', x => x.id === body.tutorId && x.status === 'approved') || fail(404, '선생님을 찾을 수 없어요.');
    const k = db.find('kids', x => x.id === body.kidId && x.parentId === me.id) || fail(400, '아이를 골라 주세요.');
    const pkg = [4, 8, 12].includes(+body.pkg) ? +body.pkg : fail(400, '수업 횟수를 골라 주세요.');
    const mode = t.modes.includes(body.mode) ? body.mode : fail(400, '이 선생님이 할 수 있는 수업 방식이 아니에요.');
    const per = pkg / 4;
    const slots = [...new Set(Array.isArray(body.slots) ? body.slots : [])];
    if (slots.length !== per || !slots.every(s => t.slots.includes(s))) fail(400, `선생님이 가능한 시간에서 주 ${per}회를 골라 주세요.`);
    const c = body.consents || {};
    if (!(c.refund && c.share && c.escrow)) fail(400, '필수 항목에 모두 동의해 주세요.');
    const code = str(body.voucher, 20).toUpperCase();
    if (code && !VOUCHERS[code]) fail(400, '확인되지 않은 바우처 코드예요.');
    const base = t.price * pkg, discount = code ? Math.round(base * VOUCHERS[code]) : 0, amount = base - discount;
    const method = { card: '카드', bank: '계좌이체', easy: '간편결제' }[body.method] || '카드';
    const payId = 'TT' + Date.now().toString(36).toUpperCase().slice(-6);
    const b = db.insert('bookings', {
      parentId: me.id, kidId: k.id, tutorId: t.id, tutorName: t.name, pkg, mode, slots, memo: str(body.memo, 300),
      price: t.price, base, discount, voucher: code, amount, method, payId, status: 'active', payment: 'escrow_held',
    });
    const th = threadFor(me.id, t.userId, t.id);
    pushMsg(th, 'sys', `${k.name} · 월 ${pkg}회 수업이 결제됐어요. 결제금은 터틀리가 보관하고 회차마다 정산돼요.`);
    return { booking: b };
  });
  on('POST', /^\/bookings\/([^/]+)\/refund$/, ({ me, m }) => {
    need(me, 'parent', 'admin');
    const b = db.find('bookings', x => x.id === m[1] && x.parentId === me.id) || fail(404, '결제를 찾을 수 없어요.');
    if (b.status !== 'active') fail(400, '이미 환불을 신청했거나 끝난 수업이에요.');
    const done = db.filter('lessons', l => l.bookingId === b.id && l.confirmed).length;
    const refund = Math.round(b.amount * refundRate(done, b.pkg));
    return { booking: db.update('bookings', b.id, { status: 'refund_requested', refund, refundDone: done }) };
  });
  on('POST', /^\/bookings\/([^/]+)\/review$/, ({ me, body, m }) => {
    need(me, 'parent', 'admin');
    const b = db.find('bookings', x => x.id === m[1] && x.parentId === me.id) || fail(404, '결제를 찾을 수 없어요.');
    const done = db.filter('lessons', l => l.bookingId === b.id && l.confirmed).length;
    if (!done) fail(400, '수업을 한 번 이상 마친 뒤에 후기를 쓸 수 있어요.');
    if (b.review) fail(409, '이미 후기를 남겼어요.');
    const text = str(body.text, 300); if (!text) fail(400, '후기를 적어 주세요.');
    return { booking: db.update('bookings', b.id, { review: { text: maskPhone(text), at: now(), by: me.name[0] + '○○ 보호자' } }) };
  });

  // 수업 기록: 선생님이 올리고 → 보호자가 확인하면 정산 대상
  on('POST', /^\/bookings\/([^/]+)\/lessons$/, ({ me, body, m }) => {
    need(me, 'tutor');
    const t = tutorOf(me);
    const b = db.find('bookings', x => x.id === m[1] && x.tutorId === t?.id) || fail(404, '수업을 찾을 수 없어요.');
    if (b.status !== 'active') fail(400, '진행 중인 수업이 아니에요.');
    const n = db.filter('lessons', l => l.bookingId === b.id).length;
    if (n >= b.pkg) fail(400, '이번 달 수업을 모두 기록했어요.');
    const step = str(body.step, 80); if (!step) fail(400, '오늘의 한 걸음을 적어 주세요.');
    const mood = ['good', 'ok', 'hard'].includes(body.mood) ? body.mood : 'good';
    const focus = Math.max(1, Math.min(60, +body.focus || 15));
    const cur = C.CURRICULUM[t.subj[0]] || [];
    const l = db.insert('lessons', {
      bookingId: b.id, kidId: b.kidId, tutorId: t.id, d: now().slice(0, 10), sub: t.subj[0],
      title: str(body.title, 60) || cur[n] || `${n + 1}회차 수업`, note: str(body.note, 300), step, focus, mood, confirmed: false, heart: false,
    });
    const th = threadFor(b.parentId, me.id, t.id);
    pushMsg(th, me.id, `오늘 수업 기록을 올렸어요: ${step}`);
    return { lesson: l };
  });
  on('POST', /^\/lessons\/([^/]+)\/confirm$/, ({ me, m }) => {
    need(me, 'parent', 'admin');
    const l = db.find('lessons', x => x.id === m[1]) || fail(404, '기록을 찾을 수 없어요.');
    if (!db.find('kids', k => k.id === l.kidId && k.parentId === me.id)) fail(403, '내 아이 기록만 확인할 수 있어요.');
    return { lesson: db.update('lessons', l.id, { confirmed: true, confirmedAt: now() }) };
  });
  on('POST', /^\/lessons\/([^/]+)\/heart$/, ({ me, m }) => {
    need(me, 'parent', 'admin');
    const l = db.find('lessons', x => x.id === m[1]) || fail(404, '기록을 찾을 수 없어요.');
    if (!db.find('kids', k => k.id === l.kidId && k.parentId === me.id)) fail(403, '내 아이 기록만 바꿀 수 있어요.');
    return { lesson: db.update('lessons', l.id, { heart: !l.heart }) };
  });

  // 채팅
  on('POST', /^\/threads$/, ({ me, body }) => {
    need(me);
    let th;
    if (body.center) th = threadFor(me.id, null);
    else {
      const t = db.find('tutors', x => x.id === body.tutorId && x.status === 'approved') || fail(404, '선생님을 찾을 수 없어요.');
      if (t.userId === me.id) fail(400, '나와의 대화는 열 수 없어요.');
      th = threadFor(me.id, t.userId, t.id);
    }
    if (str(body.first, 300)) sendMsg(th, me, str(body.first, 300));
    return { thread: viewThread(db.find('threads', x => x.id === th.id), me) };
  });
  function sendMsg(th, me, text) {
    pushMsg(th, me.id, maskPhone(text));
    const otherId = th.a === me.id ? th.b : th.a;
    if (!otherId) { pushMsg(th, 'center', CENTER_REPLY); return; }
    const ot = db.find('tutors', t => t.userId === otherId);
    if (ot && ot.demoAuto) pushMsg(th, otherId, AUTO_REPLIES[th.msgs.length % AUTO_REPLIES.length]);
  }
  on('GET', /^\/threads\/([^/]+)$/, ({ me, m }) => {
    need(me);
    const th = db.find('threads', x => x.id === m[1] && (x.a === me.id || x.b === me.id)) || fail(404, '대화를 찾을 수 없어요.');
    return { thread: viewThread(th, me) };
  });
  on('POST', /^\/threads\/([^/]+)\/messages$/, ({ me, body, m }) => {
    need(me);
    const th = db.find('threads', x => x.id === m[1] && (x.a === me.id || x.b === me.id)) || fail(404, '대화를 찾을 수 없어요.');
    const text = str(body.text, 500); if (!text) fail(400, '메시지를 적어 주세요.');
    sendMsg(th, me, text);
    return { thread: viewThread(db.find('threads', x => x.id === th.id), me) };
  });

  // 커뮤니티 닉네임: 보호자 실명은 공개하지 않아요 (선생님은 공개 프로필 이름)
  const nickOf = me => me.role === 'tutor' ? `${me.name} 선생님` : me.role === 'admin' ? '터틀리 운영팀' : `${me.name[0]}○○ 보호자`;
  // 커뮤니티: 지역 채널(전국+17) × 게시판 × 아이 단계/나이대
  const viewPost = (p, me, full) => {
    const out = {
      id: p.id, region: p.region, board: p.board, title: p.title, body: p.body, nick: p.nick, level: p.level, age: p.age,
      createdAt: p.createdAt, ans: !!p.ans, mine: !!me && p.userId === me.id,
      likeCount: (p.likeBase || 0) + p.likes.length, liked: !!me && p.likes.includes(me.id),
      cmtCount: (p.cmtBase || 0) + p.comments.length, reported: !!me && (p.reports || []).includes(me.id),
    };
    if (full) out.comments = [...p.comments].sort((a, b) => (b.tutor ? 1 : 0) - (a.tutor ? 1 : 0)).map(c => ({ n: c.n, t: c.t, tutor: !!c.tutor, at: c.at }));
    return out;
  };
  on('GET', /^\/posts$/, ({ me, query }) => {
    let L = db.all('posts');
    const region = str(query.region, 10), board = str(query.board, 10), level = str(query.level, 20), age = str(query.age, 20);
    if (region && region !== '전국') L = L.filter(p => p.region === region || p.region === '전국');
    if (board && board !== '전체') L = L.filter(p => p.board === board);
    if (level) L = L.filter(p => p.level === level);
    if (age) L = L.filter(p => p.age === age);
    if (me) L = L.filter(p => !(p.reports || []).includes(me.id)); // 신고한 글은 내 화면에서 숨김
    return { posts: [...L].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(p => viewPost(p, me)) };
  });
  on('GET', /^\/posts\/([^/]+)$/, ({ me, m }) => {
    const p = db.find('posts', x => x.id === m[1]) || fail(404, '글을 찾을 수 없어요.');
    return { post: viewPost(p, me, true) };
  });
  on('POST', /^\/posts$/, ({ me, body }) => {
    need(me);
    const title = str(body.title, 40), text = str(body.body, 1000);
    if (!title) fail(400, '제목을 적어 주세요.');
    if (!text) fail(400, '내용을 적어 주세요.');
    const board = BOARDS.slice(1).includes(body.board) ? body.board : '질문';
    const region = body.region === '전국' || REGIONS.includes(body.region) ? body.region : '전국';
    const kid = db.find('kids', k => k.parentId === me.id);
    const masked = maskPhone(text);
    const p = db.insert('posts', {
      userId: me.id, nick: nickOf(me), region, board, title: maskPhone(title), body: masked,
      level: isLevel(body.level) ? body.level : (kid?.level || null), age: isAge(body.age) ? body.age : (kid?.age || null),
      likes: [], likeBase: 0, comments: [], cmtBase: 0, reports: [], ans: me.role === 'tutor',
    });
    return { post: viewPost(p, me), masked: masked !== text };
  });
  on('POST', /^\/posts\/([^/]+)\/like$/, ({ me, m }) => {
    need(me);
    const p = db.find('posts', x => x.id === m[1]) || fail(404, '글을 찾을 수 없어요.');
    const likes = p.likes.includes(me.id) ? p.likes.filter(x => x !== me.id) : [...p.likes, me.id];
    return { post: viewPost(db.update('posts', p.id, { likes }), me, true) };
  });
  on('POST', /^\/posts\/([^/]+)\/comments$/, ({ me, body, m }) => {
    need(me);
    const p = db.find('posts', x => x.id === m[1]) || fail(404, '글을 찾을 수 없어요.');
    const t = str(body.text, 300); if (!t) fail(400, '댓글을 적어 주세요.');
    const comments = [...p.comments, { id: db.id(), userId: me.id, n: nickOf(me), t: maskPhone(t), tutor: me.role === 'tutor', at: now() }];
    return { post: viewPost(db.update('posts', p.id, { comments }), me, true) };
  });
  on('POST', /^\/posts\/([^/]+)\/report$/, ({ me, m }) => {
    need(me);
    const p = db.find('posts', x => x.id === m[1]) || fail(404, '글을 찾을 수 없어요.');
    const reports = [...new Set([...(p.reports || []), me.id])];
    db.update('posts', p.id, { reports });
    return { ok: true };
  });
  on('DELETE', /^\/posts\/([^/]+)$/, ({ me, m }) => {
    need(me);
    const p = db.find('posts', x => x.id === m[1]) || fail(404, '글을 찾을 수 없어요.');
    if (p.userId !== me.id && me.role !== 'admin') fail(403, '내 글만 지울 수 있어요.');
    db.remove('posts', x => x.id === p.id);
    return { ok: true };
  });

  // e-도서관
  on('GET', /^\/library$/, () => ({ items: db.all('library') }));

  // 관리자: 서류 4종이 모두 확인돼야 공개
  on('PATCH', /^\/admin\/tutors\/([^/]+)\/docs$/, ({ me, body, m }) => {
    need(me, 'admin');
    const t = db.find('tutors', x => x.id === m[1] && x.status === 'pending') || fail(404, '심사 대기 중인 선생님이 아니에요.');
    if (!DOCS.some(([d]) => d === body.doc)) fail(400, '서류 종류를 다시 확인해 주세요.');
    return { docs: db.update('tutors', t.id, { docs: { ...t.docs, [body.doc]: !!body.ok } }).docs };
  });
  on('POST', /^\/admin\/tutors\/([^/]+)\/(approve|reject)$/, ({ me, m, body }) => {
    need(me, 'admin');
    const t = db.find('tutors', x => x.id === m[1] && x.status === 'pending') || fail(404, '심사 대기 중인 선생님이 아니에요.');
    if (m[2] === 'approve') {
      if (!DOCS.every(([d]) => t.docs[d])) fail(400, '서류 4종이 모두 확인돼야 승인할 수 있어요.');
      db.update('tutors', t.id, { status: 'approved', approvedAt: now() });
    } else db.update('tutors', t.id, { status: 'rejected', rejectReason: str(body.reason, 200) || '빠진 서류를 다시 내 주세요.' });
    return { ok: true };
  });

  async function handle({ method, path, query = {}, body = {}, token = null }) {
    const s = token && db.find('sessions', x => x.token === token);
    const me = s ? db.find('users', u => u.id === s.userId) : null;
    try {
      for (const [mt, re, fn] of R) {
        if (mt !== method) continue;
        const m = path.match(re);
        if (m) return { status: 200, body: await fn({ me, body: body || {}, query, m, token }) };
      }
      return { status: 404, body: { error: 'Not found' } };
    } catch (e) {
      if (e instanceof HttpError) return { status: e.status, body: { error: e.message } };
      console.error(e);
      return { status: 500, body: { error: '서버 오류가 발생했어요.' } };
    }
  }
  return { handle, state };
}

module.exports = { createCore };
