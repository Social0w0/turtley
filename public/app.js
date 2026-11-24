// 터틀리 프론트엔드 (프레임워크 없는 해시 라우팅 SPA)
// 주소는 #home, #tutors 처럼 단순한 해시만 사용합니다.
(() => {
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const won = n => n.toLocaleString('ko-KR') + '원';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ago = iso => {
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return '방금'; if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
};
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
};

// ───────────── 아이콘 ─────────────
const ICON = {
  home: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  talk: '<path d="M4 5.5h16v10.5h-9l-4.5 3.5V16H4z"/>',
  book: '<path d="M12 6.5C9.5 4.8 6.5 4.6 3.5 5.3v13.2c3-.7 6-.5 8.5 1.2 2.5-1.7 5.5-1.9 8.5-1.2V5.3c-3-.7-6-.5-8.5 1.2zM12 6.5v13.2"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.3-3.8 4.2-5.6 7.5-5.6s6.2 1.8 7.5 5.6"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
  check: '<path d="m4.5 12.5 4.5 4.5L19.5 6.5"/>',
  chev: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const chev = icon('chev', 'i chev');
const KIND = {
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>',
  card: '<rect x="7" y="3.5" width="12" height="15" rx="2"/><path d="M5 6.5v13.5a.5.5 0 0 0 .5.5H16"/>',
  worksheet: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M9 10h6.5M9 13.5h6.5M9 17h4"/>',
};
const TYPE_NAME = { video: '영상', card: '그림카드', worksheet: '워크북' };
const avatar = (name, size = '') => `<span class="avatar ${size}" aria-hidden="true">${esc(String(name || '?')[0])}</span>`;
const shortName = n => String(n).split('(')[0];

const TABS = { home: ['home', '홈'], tutors: ['search', '튜터 찾기'], community: ['talk', '커뮤니티'], library: ['book', 'e-도서관'], me: ['user', '마이'] };
document.querySelectorAll('.tabbar a').forEach(a => { const [ic, label] = TABS[a.dataset.tab]; a.innerHTML = icon(ic) + label; });

// ───────────── 상태 / API ─────────────
const state = { token: store.get('turtley_token'), user: null, groups: null };
try { state.user = JSON.parse(store.get('turtley_user') || 'null'); } catch { /* ignore */ }
const doFetch = (...a) => (window.__turtleyFetch || fetch)(...a); // 미리보기에서는 가짜 API로 바꿔 끼움

async function api(path, { method = 'GET', body } = {}) {
  const res = await doFetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && state.token && !path.startsWith('/auth')) setAuth(null);
  if (!res.ok) throw new Error(data.error || '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
  return data;
}
function setAuth(data) {
  state.token = data?.token ?? (data === null ? null : state.token);
  state.user = data?.user || null;
  store.set('turtley_token', state.token);
  store.set('turtley_user', state.user ? JSON.stringify(state.user) : null);
}
async function groups() {
  if (!state.groups) state.groups = await api('/community/groups');
  return state.groups;
}
const levelName = (g, k) => g.levels.find(l => l.key === k)?.name || '';
const ageName = (g, k) => g.ages.find(a => a.key === k)?.name || '';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function openSheet(title, html, onMount) {
  $('#sheetBody').innerHTML = `<div class="sheet-head"><h2 id="sheetTitle">${title}</h2><button class="close" data-close aria-label="닫기">${icon('close')}</button></div>${html}`;
  $('#sheet').hidden = false;
  onMount?.($('#sheetBody'));
}
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
function ask(title, text, okLabel, onOk, danger = false) {
  openSheet(title, `<p style="margin:0 0 20px;font-size:17px">${text}</p><div class="cta" style="margin:0"><button class="btn gray" data-close>그대로 두기</button><button class="btn ${danger ? 'danger' : ''}" id="okBtn">${okLabel}</button></div>`,
    root => { $('#okBtn', root).onclick = () => { closeSheet(); onOk(); }; });
}
function needLogin(msg = '로그인하면 이용할 수 있어요.') { toast(msg); go('me'); }
const go = name => { if (location.hash === '#' + name) router(); else location.hash = name; };
const emptyState = (text, btn = '') => `<div class="empty"><img src="/turtle.svg" alt=""/>${text}${btn}</div>`;

// ───────────── 라우터 / 상단바 ─────────────
const TITLES = { home: '홈', tutors: '튜터 찾기', community: '커뮤니티', library: 'e-도서관', me: '마이' };
const routes = { home: renderHome, tutors: renderTutors, community: renderCommunity, library: renderLibrary, me: renderMe };
let firstLoad = true;

function setTop(name, action = '') {
  $('#topLeft').innerHTML = name === 'home' ? `<a class="logo" href="#home"><img src="/turtle.svg" alt="" /><span>터틀리</span></a>` : '';
  $('#topTitle').textContent = name === 'home' ? '' : TITLES[name];
  $('#topAction').innerHTML = action;
}
view.addEventListener('scroll', () => $('#topbar').classList.toggle('scrolled', view.scrollTop > 30), { passive: true });
const large = (text, lead = '') => `<h1 class="large">${text}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}`;

async function router() {
  let name = location.hash.replace(/^#\/?/, '') || 'home';
  if (!routes[name]) name = 'home';
  document.querySelectorAll('.tabbar a').forEach(a => {
    const on = a.dataset.tab === name;
    a.classList.toggle('on', on);
    on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  setTop(name);
  closeSheet();
  try { await routes[name](); }
  catch (e) { view.innerHTML = emptyState(esc(e.message)); }
  view.scrollTop = 0;
  $('#topbar').classList.remove('scrolled');
  firstLoad = false;
}
window.addEventListener('hashchange', router);

// ───────────── 홈 ─────────────
function notebook() {
  const lines = ['오늘도 우리는', '한 걸음!'];
  let n = 0;
  const cells = lines.map((l, li) => {
    const chars = [...l];
    while (chars.length < 7) chars.push('');
    return chars.map((c, i) => {
      const last = li === 1 && i === 6;
      const inner = last ? `<i>${icon('check')}</i>` : `<i>${c === ' ' ? '' : esc(c)}</i>`;
      return `<span class="${last ? 'check' : ''}" style="--n:${n++}">${inner}</span>`;
    }).join('');
  }).join('');
  return `<span class="sr">오늘도 우리는 한 걸음!</span><div class="cells ${firstLoad ? 'write' : ''}" aria-hidden="true">${cells}</div>`;
}

async function renderHome() {
  const u = state.user;
  const isTutor = u?.role === 'tutor';
  const g = await groups();
  const level = u?.childLevel;
  const [{ posts }, { tutors }, mine] = await Promise.all([
    api('/posts' + (level ? `?level=${level}` : '')), api('/tutors'),
    u ? api('/bookings').catch(() => ({ bookings: [] })) : { bookings: [] },
  ]);
  const active = mine.bookings.filter(b => b.status === 'requested' || b.status === 'accepted');
  const popular = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3);

  view.innerHTML = `
    <div class="hero" style="margin-top:10px">
      <h1 class="greet">${u ? `${esc(shortName(u.name))}님, 안녕하세요` : '터틀리에 오신 걸 환영해요'}</h1>
      ${notebook()}
      <div class="cta">
        ${isTutor ? `<a class="btn" href="#me">받은 신청${active.length ? ` ${active.length}건` : ''}</a>` : `<a class="btn" href="#tutors">튜터 찾기</a>`}
        <a class="btn tint" href="#community">커뮤니티</a>
      </div>
    </div>

    ${active.length ? `
      <div class="sec"><h2>${isTutor ? '진행 중인 신청' : '진행 중인 수업'}</h2><a href="#me">전체 보기</a></div>
      <div class="group">${active.slice(0, 2).map(b => `<div class="cell"><div class="grow">${bookingSummary(b, isTutor)}</div></div>`).join('')}</div>` : ''}

    <div class="sec"><h2>추천 튜터</h2><a href="#tutors">전체 보기</a></div>
    <div class="group">${tutors.slice(0, 3).map(tutorCell).join('')}</div>

    <div class="sec"><h2>${level ? `${esc(levelName(g, level))} 부모님 이야기` : '부모님들 이야기'}</h2><a href="#community">전체 보기</a></div>
    <div class="group">${popular.map(p => `
      <a class="cell tap" href="#community"><div class="grow">
        <div class="clamp" style="font-weight:500">${esc(p.content)}</div>
        <div class="sub" style="margin-top:4px">${esc(shortName(p.authorName))}, ${esc(ageName(g, p.age) || p.region)}, 공감 ${p.likeCount}</div>
      </div>${chev}</a>`).join('') || '<div class="cell"><span class="sub">아직 글이 없어요.</span></div>'}</div>

    ${!u ? `
    <div class="sec"><h2>이렇게 이용해요</h2></div>
    <div class="group">
      <div class="cell"><div class="grow"><b>1. 튜터 고르기</b><div class="body2">과목, 지역, 후기를 보고 아이와 맞을 분을 골라요.</div></div></div>
      <div class="cell"><div class="grow"><b>2. 1회 체험 수업</b><div class="body2">35,000원으로 먼저 만나 보고, 맞으면 월 8회 정기 수업으로 이어 가요.</div></div></div>
      <div class="cell"><div class="grow"><b>3. 수업 후 정산</b><div class="body2">수업료는 터틀리가 보관하다가 수업이 끝나면 튜터에게 전달해요. 거절되면 전액 환불돼요.</div></div></div>
    </div>` : ''}`;
  bindTutorCells();
}

// ───────────── 튜터 ─────────────
function tutorCell(t) {
  return `<div class="cell tap" data-tutor="${t.id}" role="button" tabindex="0" aria-label="${esc(t.name)} 튜터 자세히 보기">
    ${avatar(t.name)}
    <div class="grow">
      <div class="row between" style="gap:8px;align-items:baseline"><span class="name">${esc(t.name)} 튜터</span>
        <span class="sub stat" style="white-space:nowrap">${t.reviewCount ? `평점 <b>${t.rating}</b>` : '새로 온 튜터'}</span></div>
      <div class="sub">${esc(t.regions[0] || '')}${t.online ? ', 비대면 가능' : ''}${t.reviewCount ? `, 후기 ${t.reviewCount}개` : ''}</div>
      <div class="body2 clamp" style="margin-top:6px">${esc(t.intro)}</div>
      <div class="tags">${t.subjects.map(s => `<span>${esc(s)}</span>`).join('')}</div>
    </div>${chev}</div>`;
}
function bindTutorCells() {
  view.querySelectorAll('[data-tutor]').forEach(el => {
    el.onclick = () => showTutor(el.dataset.tutor);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTutor(el.dataset.tutor); } };
  });
}

const tutorFilter = { subject: '', online: false, q: '' };
async function renderTutors() {
  const qs = new URLSearchParams({ ...(tutorFilter.subject && { subject: tutorFilter.subject }), ...(tutorFilter.online && { online: 'true' }), ...(tutorFilter.q && { q: tutorFilter.q }) });
  const { tutors } = await api('/tutors?' + qs);
  const filtered = tutorFilter.subject || tutorFilter.online || tutorFilter.q;
  view.innerHTML = `
    ${large('튜터 찾기')}
    <form class="search" id="sf" role="search">${icon('search')}<input id="tq" type="search" placeholder="이름이나 키워드 (예: 반복학습)" aria-label="튜터 검색" value="${esc(tutorFilter.q)}"/></form>
    <div class="chips" aria-label="과목">
      ${['', '국어', '수학', '사회성', '생활습관'].map(s => `<button data-s="${s}" class="${tutorFilter.subject === s ? 'on' : ''}" aria-pressed="${tutorFilter.subject === s}">${s || '전체 과목'}</button>`).join('')}
      <button data-online class="${tutorFilter.online ? 'on' : ''}" aria-pressed="${tutorFilter.online}">비대면만</button>
    </div>
    <div class="sec" style="margin-top:20px"><h2>튜터 ${tutors.length}명</h2>${filtered ? '<button id="clearF">조건 지우기</button>' : ''}</div>
    ${tutors.length ? `<div class="group">${tutors.map(tutorCell).join('')}</div>` : emptyState('조건에 맞는 튜터가 없어요.', '<br/><button class="btn tint sm" id="clearF2">조건 지우기</button>')}`;
  view.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => { tutorFilter.subject = b.dataset.s; renderTutors(); }));
  $('[data-online]', view).onclick = () => { tutorFilter.online = !tutorFilter.online; renderTutors(); };
  $('#sf').onsubmit = e => { e.preventDefault(); tutorFilter.q = $('#tq').value.trim(); renderTutors(); };
  $('#tq').onchange = () => { tutorFilter.q = $('#tq').value.trim(); renderTutors(); };
  const clear = () => { Object.assign(tutorFilter, { subject: '', online: false, q: '' }); renderTutors(); };
  $('#clearF')?.addEventListener('click', clear);
  $('#clearF2')?.addEventListener('click', clear);
  bindTutorCells();
}

async function showTutor(id) {
  const [{ tutor: t }, { plans, feeRate }] = await Promise.all([api('/tutors/' + id), api('/plans')]);
  let plan = 'single';
  const role = state.user?.role;
  openSheet(`${esc(t.name)} 튜터`, `
    <div class="row" style="gap:14px;margin-bottom:14px">${avatar(t.name, 'lg')}
      <div class="sub stat"><div>${t.reviewCount ? `평점 <b>${t.rating}</b>, 후기 ${t.reviewCount}개` : '새로 온 튜터'}</div>
      <div>${esc(t.regions.join(', '))}${t.online ? ', 비대면 가능' : ''}</div></div></div>
    <p style="margin:0 0 8px">${esc(t.intro)}</p>
    ${t.career ? `<p class="sub" style="margin:0">${esc(t.career)}</p>` : ''}
    <div class="tags">${[...t.subjects, ...t.tags].map(s => `<span>${esc(s)}</span>`).join('')}</div>

    <div class="sec" style="margin:26px 0 10px"><h2>수업 선택</h2></div>
    <div class="stack" role="radiogroup" aria-label="수업 선택">${plans.map(p => `
      <button type="button" class="plan" data-plan="${p.plan}" role="radio"><span class="dot"></span>
        <span><b>${p.label}</b><br/><span class="sub">${p.sessions}회, 회당 ${won(Math.round(p.price / p.sessions))}</span></span>
        <span class="price">${won(p.price)}</span></button>`).join('')}</div>
    <form id="bookForm" class="stack" style="margin-top:18px">
      <div class="row" style="align-items:flex-end"><label class="field" style="flex:2">아이 이름 또는 별명<input name="childName" required maxlength="20" placeholder="하준"/></label>
        <label class="field" style="flex:1">나이<input name="childAge" type="number" inputmode="numeric" min="3" max="19" placeholder="9"/></label></div>
      <label class="field"><span>튜터에게 미리 알려 줄 것 <span class="hint">선택</span></span><textarea name="message" maxlength="500" placeholder="어려워하는 부분, 집중이 잘 되는 시간대, 좋아하는 것"></textarea></label>
      <div class="receipt" id="receipt"></div>
      <div class="sheet-foot">
        ${role === 'tutor' ? '<p class="sub" style="margin:0 0 8px">튜터 계정으로는 신청할 수 없어요. 학부모 계정으로 로그인해 주세요.</p>' : ''}
        <button class="btn" id="bookBtn" ${role === 'tutor' ? 'disabled' : ''}></button>
      </div>
    </form>`, root => {
    const draw = () => {
      const p = plans.find(x => x.plan === plan);
      $('#receipt', root).innerHTML = `<div><span>결제 금액</span><span>${won(p.amount)}</span></div>
        <div><span>튜터에게 전달 (${100 - feeRate * 100}%)</span><span>${won(p.tutorPayout)}</span></div>
        <div><span>안전거래 수수료 (${feeRate * 100}%)</span><span>${won(p.platformFee)}</span></div>
        <p>결제금은 터틀리가 보관하다가 수업이 끝나면 튜터에게 전달해요. 튜터가 거절하면 전액 환불돼요.</p>`;
      root.querySelectorAll('[data-plan]').forEach(el => { const on = el.dataset.plan === plan; el.classList.toggle('on', on); el.setAttribute('aria-checked', on); });
      $('#bookBtn', root).textContent = state.user ? `${won(p.amount)} 결제하고 신청` : '로그인하고 신청';
    };
    root.querySelectorAll('[data-plan]').forEach(el => (el.onclick = () => { plan = el.dataset.plan; draw(); }));
    draw();
    $('#bookForm', root).onsubmit = async e => {
      e.preventDefault();
      if (!state.user) { closeSheet(); return needLogin('로그인하고 다시 신청해 주세요.'); }
      const f = Object.fromEntries(new FormData(e.target));
      try {
        await api('/bookings', { method: 'POST', body: { tutorId: t.id, plan, ...f } });
        closeSheet(); toast('신청했어요. 튜터가 수락하면 수업이 시작돼요.');
        go('me');
      } catch (err) { toast(err.message); }
    };
  });
}

// ───────────── 커뮤니티 (단계 × 나이대) ─────────────
// 처음에는 우리 아이 단계로 열리고, 단계 카드와 나이대 칩으로 좁혀 볼 수 있어요.
const cf = { level: undefined, age: '' };
const TOPICS = ['한걸음', '질문', '정보', '모임'];

async function renderCommunity() {
  setTop('community', `<button class="btn sm" id="writeBtn">${icon('pen')}글쓰기</button>`);
  $('#writeBtn').onclick = () => (state.user ? composeSheet() : needLogin('글을 쓰려면 로그인해 주세요.'));
  state.groups = null; // 글 수 새로 고침
  const g = await groups();
  if (cf.level === undefined) cf.level = state.user?.childLevel || '';
  const qs = new URLSearchParams({ ...(cf.level && { level: cf.level }), ...(cf.age && { age: cf.age }) });
  const { posts } = await api('/posts?' + qs);
  const mine = state.user?.childLevel;
  const sel = g.levels.find(l => l.key === cf.level);

  view.innerHTML = `
    ${large('커뮤니티', '아이의 발달 단계와 나이가 비슷한 부모님끼리 이야기해요.')}
    <div class="levels" role="radiogroup" aria-label="발달 단계">
      <button class="level ${!cf.level ? 'on' : ''}" data-level="" role="radio" aria-checked="${!cf.level}">
        <span class="lname">모든 단계</span><span class="lrange">전체 글 보기</span><span class="lcount">글 ${g.total}개</span></button>
      ${g.levels.map(l => `
      <button class="level ${cf.level === l.key ? 'on' : ''}" data-level="${l.key}" role="radio" aria-checked="${cf.level === l.key}">
        ${mine === l.key ? '<span class="mine">우리 아이</span>' : ''}
        <span class="lname">${esc(l.name)}</span><span class="lrange">${esc(l.range)}</span><span class="lcount">글 ${l.postCount}개</span></button>`).join('')}
    </div>
    <div class="chips" style="margin-top:10px" aria-label="나이대">
      ${[{ key: '', name: '모든 나이' }, ...g.ages].map(a => `<button data-age="${a.key}" class="${cf.age === a.key ? 'on' : ''}" aria-pressed="${cf.age === a.key}">${esc(a.name)}</button>`).join('')}
    </div>
    ${sel ? `<div class="about">
      <h3>${esc(sel.name)} <span class="sub" style="font-weight:500">${esc(sel.range)}</span></h3>
      <p>${esc(sel.desc)}</p>
      ${state.user?.role === 'parent' && mine !== sel.key ? `<div class="row"><button class="btn tint sm" id="setMine">우리 아이 단계로 설정</button></div>` : ''}
    </div>` : ''}
    <div class="posts">${posts.map(p => postCard(p, g)).join('') || emptyState('이 단락에는 아직 글이 없어요.<br/>첫 이야기를 남겨 주세요.', '<br/><button class="btn sm" id="firstPost">글쓰기</button>')}</div>
    <p class="sub" style="margin:16px 4px 0">단계는 진단명이 없어도 가장 가까운 곳을 고르면 돼요. 지능지수 범위는 참고용이에요.</p>`;

  view.querySelectorAll('[data-level]').forEach(b => (b.onclick = () => { cf.level = b.dataset.level; renderCommunity(); }));
  view.querySelectorAll('[data-age]').forEach(b => (b.onclick = () => { cf.age = b.dataset.age; renderCommunity(); }));
  $('#firstPost')?.addEventListener('click', () => $('#writeBtn').click());
  $('#setMine')?.addEventListener('click', async () => {
    try { await saveChild({ childLevel: sel.key }); toast(`우리 아이 단계를 ${sel.name}(으)로 설정했어요.`); renderCommunity(); }
    catch (e) { toast(e.message); }
  });
  { const on = view.querySelector('.level.on'), box = view.querySelector('.levels'); if (on && box) box.scrollLeft = Math.max(0, on.offsetLeft - 16 - (box.clientWidth - on.offsetWidth - 32) / 2); }
  bindPosts(g);
}

async function saveChild(patch) {
  const { user } = await api('/me', { method: 'PATCH', body: patch });
  setAuth({ user });
  return user;
}

function choice(name, items, value) {
  return `<div class="options" role="radiogroup" data-choice="${name}">${items.map(it => `
    <button type="button" class="option ${value === it.key ? 'on' : ''}" data-v="${it.key}" role="radio" aria-checked="${value === it.key}">
      <span class="dot"></span><span class="grow"><b>${esc(it.name)}</b>${it.range ? `<span class="sub">${esc(it.range)}</span>` : ''}</span></button>`).join('')}</div>`;
}
function bindChoices(root, values) {
  root.querySelectorAll('[data-choice]').forEach(box => box.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => {
    values[box.dataset.choice] = b.dataset.v;
    box.querySelectorAll('[data-v]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); });
  })));
}

async function composeSheet() {
  const g = await groups();
  const v = { level: cf.level || state.user.childLevel || 'observing', age: cf.age || state.user.childAge || 'lower', tag: '한걸음' };
  openSheet('글쓰기', `<form id="pf" class="stack">
      <label class="field">내용<textarea name="content" maxlength="1000" required placeholder="오늘 아이가 해낸 일, 궁금한 점을 적어 주세요" style="min-height:140px"></textarea></label>
      <div class="field">어느 단락에 올릴까요?${choice('level', g.levels, v.level)}</div>
      <div class="field">아이 나이대<div class="chips" data-chips="age" style="margin:0;padding:0">${g.ages.map(a => `<button type="button" data-v="${a.key}" class="${v.age === a.key ? 'on' : ''}">${esc(a.name)}</button>`).join('')}</div></div>
      <div class="field">주제<div class="segmented" data-seg="tag">${TOPICS.map(t => `<button type="button" data-v="${t}" class="${v.tag === t ? 'on' : ''}">${t}</button>`).join('')}</div></div>
      <div class="sheet-foot"><button class="btn">올리기</button></div></form>`, root => {
    bindChoices(root, v);
    root.querySelectorAll('[data-chips],[data-seg]').forEach(box => box.querySelectorAll('[data-v]').forEach(b => (b.onclick = () => {
      v[box.dataset.chips || box.dataset.seg] = b.dataset.v;
      box.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b));
    })));
    $('textarea', root).focus();
    $('#pf', root).onsubmit = async e => {
      e.preventDefault();
      try {
        await api('/posts', { method: 'POST', body: { content: e.target.content.value, ...v } });
        closeSheet(); toast(`${levelName(g, v.level)} 단락에 글을 올렸어요.`);
        cf.level = v.level; cf.age = '';
        renderCommunity();
      } catch (err) { toast(err.message); }
    };
  });
}

function postCard(p, g) {
  return `<article class="post" data-post="${p.id}">
    <div class="head">${avatar(p.authorName, 'sm')}
      <div class="who"><b>${esc(p.authorName)}</b>${p.authorRole === 'tutor' ? ' <span class="sub">튜터</span>' : ''}
        <div class="meta">${esc(p.region)}, ${ago(p.createdAt)}</div></div>
      <span class="badge">${esc(p.tag)}</span></div>
    <p>${esc(p.content)}</p>
    ${!cf.level && p.level ? `<div class="where">${esc(levelName(g, p.level))}${p.age ? `, ${esc(ageName(g, p.age))}` : ''}</div>` : p.age && !cf.age ? `<div class="where">${esc(ageName(g, p.age))}</div>` : ''}
    ${p.comments.length ? `<div class="comments">${p.comments.map(c => `<div><b>${esc(c.authorName)}</b>${esc(c.content)}</div>`).join('')}</div>` : ''}
    <div class="actions">
      <button data-like class="${p.liked ? 'on' : ''}" aria-pressed="${p.liked}">${icon('heart')}공감 ${p.likeCount}</button>
      <button data-cmt>${icon('talk')}댓글 ${p.comments.length}</button>
      ${state.user?.id === p.userId ? '<button data-del class="del">삭제</button>' : ''}
    </div></article>`;
}
function bindPosts(g) {
  view.querySelectorAll('[data-post]').forEach(el => {
    const id = el.dataset.post;
    const replace = post => { el.outerHTML = postCard(post, g); bindPosts(g); };
    $('[data-like]', el).onclick = async () => {
      if (!state.user) return needLogin('공감하려면 로그인해 주세요.');
      try { replace((await api(`/posts/${id}/like`, { method: 'POST' })).post); } catch (e) { toast(e.message); }
    };
    $('[data-cmt]', el).onclick = () => {
      if (!state.user) return needLogin('댓글을 쓰려면 로그인해 주세요.');
      openSheet('댓글 쓰기', `<form id="cf" class="stack"><textarea name="content" maxlength="300" required placeholder="응원이나 경험을 나눠 주세요" aria-label="댓글"></textarea><button class="btn">댓글 올리기</button></form>`, root => {
        $('textarea', root).focus();
        $('#cf', root).onsubmit = async e => {
          e.preventDefault();
          try { const { post } = await api(`/posts/${id}/comments`, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); closeSheet(); replace(post); toast('댓글을 올렸어요.'); }
          catch (err) { toast(err.message); }
        };
      });
    };
    $('[data-del]', el)?.addEventListener('click', () => ask('글 삭제', '이 글을 삭제할까요? 댓글도 함께 지워져요.', '삭제', async () => {
      try { await api('/posts/' + id, { method: 'DELETE' }); el.remove(); toast('글을 삭제했어요.'); } catch (e) { toast(e.message); }
    }, true));
  });
}

// ───────────── e-도서관 ─────────────
let libCat = '';
async function renderLibrary() {
  const { items } = await api('/library' + (libCat ? '?category=' + encodeURIComponent(libCat) : ''));
  const kind = it => `<span class="avatar" style="border-radius:14px;background:var(--bg);color:var(--accent-press)"><svg class="i" viewBox="0 0 24 24" aria-hidden="true">${KIND[it.type] || KIND.card}</svg></span>`;
  view.innerHTML = `
    ${large('e-도서관', '보고, 듣고, 따라 하는 학습 자료예요.')}
    <div class="chips" aria-label="과목">${['', '국어', '수학', '사회성', '생활습관'].map(c => `<button data-c="${c}" class="${libCat === c ? 'on' : ''}" aria-pressed="${libCat === c}">${c || '전체'}</button>`).join('')}</div>
    <div class="group" style="margin-top:14px">${items.map(it => `
      <div class="cell tap" data-item="${it.id}" role="button" tabindex="0">
        ${kind(it)}
        <div class="grow"><div class="name" style="font-size:17px">${esc(it.title)}</div>
          <div class="sub">${esc(it.category)} ${TYPE_NAME[it.type] || ''}, <b style="color:${it.free ? 'var(--accent-press)' : 'var(--ink)'}">${it.free ? '무료' : won(it.price)}</b></div></div>
        ${chev}</div>`).join('')}</div>`;
  view.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { libCat = b.dataset.c; renderLibrary(); }));
  view.querySelectorAll('[data-item]').forEach(el => {
    const open = () => {
      const it = items.find(x => x.id === el.dataset.item);
      openSheet(esc(it.title), `
        <div class="row" style="margin-bottom:12px">${kind(it)}<div class="sub">${esc(it.category)} ${TYPE_NAME[it.type]}<br/>${esc(it.level)} 단계, <b style="color:var(--ink)">${it.free ? '무료' : won(it.price)}</b></div></div>
        <p style="margin:0 0 20px">${esc(it.description)}</p>
        <button class="btn" id="open">${it.free ? '자료 열기' : `${won(it.price)}에 구매`}</button>`, root => {
        $('#open', root).onclick = () => { closeSheet(); toast(it.free ? '자료 보기 화면은 다음 버전에서 열려요.' : '데모에서는 결제를 할 수 없어요.'); };
      });
    };
    el.onclick = open;
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  });
}

// ───────────── 마이 ─────────────
const STATUS = { requested: '수락 기다리는 중', accepted: '수업 중', completed: '수업 완료', rejected: '튜터가 거절함', cancelled: '취소함' };
const STEP = { requested: 0, accepted: 1, completed: 2 };

function bookingSummary(b, isTutor) {
  const who = isTutor
    ? `${esc(b.childName)}${b.childAge ? ` (${b.childAge}세)` : ''}, ${esc(shortName(b.parentName))} 님`
    : `${esc(b.tutorName)} 튜터, ${esc(b.childName)}`;
  const step = STEP[b.status];
  const track = step === undefined
    ? `<div class="ended">${b.status === 'rejected' ? '결제금은 전액 환불됐어요.' : '신청을 취소했어요.'}</div>`
    : `<ol class="track" aria-label="진행 단계">${['신청', '수업 중', '완료'].map((s, i) =>
        `<li class="${i < step || step === 2 ? 'done' : i === step ? 'now' : ''}"${i === step ? ' aria-current="step"' : ''}>${s}</li>`).join('')}</ol>`;
  return `<div class="row between" style="gap:8px;align-items:baseline"><span class="name" style="font-size:17px">${who}</span><span class="status ${b.status}">${STATUS[b.status]}</span></div>
    <div class="sub">${esc(b.label)}, ${won(b.amount)}${isTutor ? ` (정산 ${won(b.tutorPayout)})` : ''}</div>${track}`;
}

async function renderMe() {
  if (!state.user) return renderAuth();
  const [{ user, tutor }, { bookings }, g] = await Promise.all([api('/me'), api('/bookings'), groups()]);
  setAuth({ user });
  const isTutor = user.role === 'tutor';
  const earn = isTutor ? await api('/tutor/earnings') : null;
  setTop('me', `<button class="btn sm gray" id="logout">로그아웃</button>`);

  view.innerHTML = `
    ${large('마이')}
    <div class="group"><div class="cell" style="align-items:center">${avatar(user.name, 'lg')}
      <div class="grow"><div class="name" style="font-size:20px">${esc(user.name)}</div><div class="sub">${isTutor ? '튜터' : '학부모'}, ${esc(user.email)}</div></div></div></div>

    ${isTutor ? `
      <div class="group"><div class="ledger"><div><span>정산 완료</span><b>${won(earn.paid)}</b></div><div><span>정산 예정</span><b>${won(earn.pending)}</b></div></div></div>
      <p class="sub" style="margin:10px 4px 0">수업 완료를 누르면 수업료의 80%가 정산돼요.</p>
      <div class="group" style="margin-top:12px"><a class="cell tap" id="editProfile"><div class="grow"><b>튜터 프로필 수정</b><div class="sub">소개, 과목, 지역, 비대면 여부</div></div>${chev}</a></div>`
    : `
      <div class="sec"><h2>우리 아이</h2></div>
      <div class="group"><a class="cell tap" id="editChild"><div class="grow">
        <b>${user.childLevel ? esc(levelName(g, user.childLevel)) : '발달 단계를 골라 주세요'}</b>
        <div class="sub">${user.childAge ? esc(ageName(g, user.childAge)) : '나이대 미설정'}. 커뮤니티가 이 단락으로 먼저 열려요.</div></div>${chev}</a></div>`}

    <div class="sec"><h2>${isTutor ? '받은 신청' : '신청한 수업'}</h2>${isTutor && earn.requests ? `<span class="status requested">새 신청 ${earn.requests}건</span>` : ''}</div>
    ${bookings.length ? `<div class="group">${bookings.map(b => `
      <div class="cell" data-b="${b.id}"><div class="grow">
        ${bookingSummary(b, isTutor)}
        ${b.message ? `<p class="quote">${esc(b.message)}</p>` : ''}
        ${b.review ? `<p style="margin:10px 0 0;font-size:16px">남긴 후기 <b>${b.review.rating}점</b>${b.review.text ? `, ${esc(b.review.text)}` : ''}</p>` : ''}
        ${bookingActions(b, isTutor)}
      </div></div>`).join('')}</div>`
    : isTutor ? emptyState('아직 받은 신청이 없어요.<br/>소개와 과목을 채워 두면 부모님이 찾기 쉬워져요.')
      : emptyState('아직 신청한 수업이 없어요.', '<br/><a class="btn sm" href="#tutors">튜터 찾기</a>')}`;

  view.querySelectorAll('[data-act]').forEach(btn => (btn.onclick = () => {
    const id = btn.closest('[data-b]').dataset.b;
    const act = btn.dataset.act;
    if (act === 'review') return reviewSheet(id);
    const done = { accepted: '신청을 수락했어요. 수업을 시작해 주세요.', rejected: '신청을 거절했어요. 결제금은 환불돼요.', completed: '수업을 완료했어요. 정산에 반영됐어요.', cancelled: '신청을 취소했어요.' };
    const run = async () => {
      try { await api('/bookings/' + id, { method: 'PATCH', body: { status: act } }); toast(done[act]); renderMe(); }
      catch (e) { toast(e.message); }
    };
    if (act === 'rejected') return ask('신청 거절', '이 신청을 거절할까요? 부모님께 전액 환불돼요.', '거절', run, true);
    if (act === 'cancelled') return ask('신청 취소', '이 신청을 취소할까요? 결제금은 전액 환불돼요.', '신청 취소', run, true);
    if (act === 'completed') return ask('수업 완료', '모든 수업을 마쳤나요? 완료하면 정산이 진행돼요.', '수업 완료', run);
    run();
  }));
  $('#logout').onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setAuth(null); cf.level = undefined; toast('로그아웃했어요.'); renderMe(); };
  $('#editProfile')?.addEventListener('click', () => editTutorSheet(tutor));
  $('#editChild')?.addEventListener('click', () => childSheet(g, user));
}

function childSheet(g, user) {
  const v = { level: user.childLevel || '', age: user.childAge || '' };
  openSheet('우리 아이', `<div class="stack">
      <div class="field">발달 단계 <span class="hint">진단명이 없어도 가장 가까운 곳을 골라 주세요</span>${choice('level', g.levels, v.level)}</div>
      <div class="field">나이대${choice('age', g.ages, v.age)}</div>
      <div class="sheet-foot"><button class="btn" id="saveChild">저장</button></div></div>`, root => {
    bindChoices(root, v);
    $('#saveChild', root).onclick = async () => {
      try {
        await saveChild({ childLevel: v.level || null, childAge: v.age || null });
        cf.level = v.level || ''; closeSheet(); toast('우리 아이 정보를 저장했어요.'); renderMe();
      } catch (e) { toast(e.message); }
    };
  });
}

function bookingActions(b, isTutor) {
  const btn = (act, label, cls = 'tint') => `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  let html = '';
  if (isTutor && b.status === 'requested') html = btn('rejected', '거절', 'gray') + btn('accepted', '수락', '');
  if (isTutor && b.status === 'accepted') html = btn('completed', '수업 완료');
  if (!isTutor && b.status === 'requested') html = btn('cancelled', '신청 취소', 'gray');
  if (!isTutor && b.status === 'completed' && !b.review) html = btn('review', '후기 쓰기', '');
  return html ? `<div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px">${html}</div>` : '';
}

function reviewSheet(id) {
  let rating = 5;
  openSheet('수업 후기', `<p class="sub" style="margin:0 0 10px">수업은 어땠나요?</p>
    <div class="segmented" id="stars" role="radiogroup" aria-label="평점" style="margin-bottom:14px"></div>
    <form id="rf" class="stack"><textarea name="text" maxlength="300" placeholder="다른 부모님께 도움이 될 이야기를 남겨 주세요" aria-label="후기"></textarea><button class="btn">후기 올리기</button></form>`, root => {
    const draw = () => ($('#stars', root).innerHTML = [1, 2, 3, 4, 5].map(i =>
      `<button type="button" class="${i === rating ? 'on' : ''}" data-r="${i}" role="radio" aria-checked="${i === rating}">${i}점</button>`).join(''));
    $('#stars', root).onclick = e => { const r = e.target.closest('[data-r]'); if (r) { rating = +r.dataset.r; draw(); } };
    draw();
    $('#rf', root).onsubmit = async e => {
      e.preventDefault();
      try { await api(`/bookings/${id}/review`, { method: 'POST', body: { rating, text: e.target.text.value } }); closeSheet(); toast('후기를 올렸어요.'); renderMe(); }
      catch (err) { toast(err.message); }
    };
  });
}

function editTutorSheet(t) {
  openSheet('튜터 프로필', `<form id="tf" class="stack">
      <label class="field">소개<textarea name="intro" maxlength="300">${esc(t.intro)}</textarea></label>
      <label class="field">경력<input name="career" maxlength="200" value="${esc(t.career)}"/></label>
      <label class="field"><span>과목 <span class="hint">쉼표로 구분</span></span><input name="subjects" value="${esc(t.subjects.join(', '))}"/></label>
      <label class="field"><span>활동 지역 <span class="hint">쉼표로 구분</span></span><input name="regions" value="${esc(t.regions.join(', '))}"/></label>
      <label class="row" style="font-weight:600"><input type="checkbox" name="online" style="width:24px;height:24px;accent-color:var(--accent);box-shadow:none" ${t.online ? 'checked' : ''}/> 비대면 수업 가능</label>
      <div class="sheet-foot"><button class="btn">저장</button></div></form>`, root => {
    $('#tf', root).onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      const split = v => v.split(',').map(s => s.trim()).filter(Boolean);
      try {
        await api('/tutors/me', { method: 'PATCH', body: { intro: f.intro.value, career: f.career.value, subjects: split(f.subjects.value), regions: split(f.regions.value), online: f.online.checked } });
        closeSheet(); toast('프로필을 저장했어요.'); renderMe();
      } catch (err) { toast(err.message); }
    };
  });
}

async function renderAuth(mode = 'login') {
  const signup = mode === 'signup';
  setTop('me');
  const g = signup ? await groups() : null;
  view.innerHTML = `
    ${large(signup ? '가입하기' : '로그인', signup ? '학부모와 튜터 중 하나를 골라 주세요.' : '수업 신청과 커뮤니티는 로그인 후 이용할 수 있어요.')}
    <form id="af" class="stack">
      ${signup ? `
        <div class="segmented" role="radiogroup" aria-label="가입 유형"><button type="button" data-role="parent" class="on" role="radio" aria-checked="true">학부모</button><button type="button" data-role="tutor" role="radio" aria-checked="false">튜터</button></div>
        <label class="field">이름<input name="name" required maxlength="30" autocomplete="name"/></label>
        <label class="field">사는 지역<input name="region" placeholder="광진구" maxlength="30"/></label>
        <label class="field" id="childField"><span>아이 발달 단계 <span class="hint">선택, 나중에 바꿀 수 있어요</span></span>
          <select name="childLevel"><option value="">나중에 고를게요</option>${g.levels.map(l => `<option value="${l.key}">${esc(l.name)} (${esc(l.range)})</option>`).join('')}</select></label>` : ''}
      <label class="field">이메일<input name="email" type="email" required autocomplete="email" value="${signup ? '' : 'parent@turtley.dev'}"/></label>
      <label class="field"><span>비밀번호 ${signup ? '<span class="hint">6자 이상</span>' : ''}</span><input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" value="${signup ? '' : 'demo1234'}"/></label>
      <button class="btn" style="margin-top:6px">${signup ? '가입하기' : '로그인'}</button>
      <button type="button" class="btn tint" id="swap">${signup ? '이미 계정이 있어요' : '처음이에요, 가입하기'}</button>
      ${signup ? '' : `<p class="sub" style="text-align:center;margin:6px 0 0">데모용 학부모 계정이 채워져 있어요.<br/><button type="button" class="link" id="asTutor">튜터 계정으로 바꾸기</button></p>`}
    </form>`;
  let role = 'parent';
  view.querySelectorAll('[data-role]').forEach(b => (b.onclick = () => {
    role = b.dataset.role;
    view.querySelectorAll('[data-role]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
    $('#childField').hidden = role === 'tutor';
  }));
  $('#swap').onclick = () => renderAuth(signup ? 'login' : 'signup');
  $('#asTutor')?.addEventListener('click', () => { $('#af').email.value = 'tutor@turtley.dev'; toast('튜터 계정으로 바꿨어요. 로그인을 누르세요.'); });
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      setAuth(await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body: signup ? { ...body, role } : body }));
      cf.level = undefined;
      toast(signup ? '가입했어요.' : `${shortName(state.user.name)}님, 로그인했어요.`);
      renderMe();
    } catch (err) { toast(err.message); }
  };
}

router();
})();
