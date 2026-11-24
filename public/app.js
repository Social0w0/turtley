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
  video: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m10 9 5 3-5 3z"/>',
  card: '<rect x="7" y="3.5" width="12" height="15" rx="1.5"/><path d="M5 6.5v13.5a.5.5 0 0 0 .5.5H16"/>',
  worksheet: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M9 10h6.5M9 13.5h6.5M9 17h4"/>',
};
const TYPE_NAME = { video: '영상', card: '그림카드', worksheet: '워크북' };

function avatar(name, size = '') {
  const s = String(name || '?');
  return `<span class="avatar ${size}" aria-hidden="true">${esc(s[0])}</span>`;
}
const shortName = n => String(n).split('(')[0];

const TABS = { home: ['home', '홈'], tutors: ['search', '튜터 찾기'], community: ['talk', '커뮤니티'], library: ['book', 'e-도서관'], me: ['user', '마이'] };
document.querySelectorAll('.tabbar a').forEach(a => { const [ic, label] = TABS[a.dataset.tab]; a.innerHTML = icon(ic) + label; });

// ───────────── 상태 / API ─────────────
const state = { token: store.get('turtley_token'), user: null };
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
  state.token = data?.token || null;
  state.user = data?.user || null;
  store.set('turtley_token', state.token);
  store.set('turtley_user', state.user ? JSON.stringify(state.user) : null);
}

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

// confirm() 대신 쓰는 확인 시트
function ask(title, text, okLabel, onOk) {
  openSheet(title, `<p style="margin:4px 0 18px">${text}</p><div class="row"><button class="btn line" data-close>그대로 두기</button><button class="btn" id="okBtn">${okLabel}</button></div>`,
    root => { $('#okBtn', root).onclick = () => { closeSheet(); onOk(); }; });
}

function needLogin(msg = '로그인하면 이용할 수 있어요.') { toast(msg); go('me'); }
const go = name => { if (location.hash === '#' + name) router(); else location.hash = name; };
const emptyState = (text, btn = '') => `<div class="empty"><img src="/turtle.svg" alt=""/>${text}${btn}</div>`;

// ───────────── 라우터 / 상단바 ─────────────
const TITLES = { tutors: '튜터 찾기', community: '커뮤니티', library: 'e-도서관', me: '마이' };
const routes = { home: renderHome, tutors: renderTutors, community: renderCommunity, library: renderLibrary, me: renderMe };
let firstLoad = true;

function setTop(name, action = '') {
  $('#topLeft').innerHTML = name === 'home'
    ? `<a class="logo" href="#home"><img src="/turtle.svg" alt="" /><span>터틀리</span></a>`
    : `<h1 class="page-title">${TITLES[name]}</h1>`;
  $('#topAction').innerHTML = action;
}

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
  return `<h2 class="notebook"><span class="sr">오늘도 우리는 한 걸음!</span><div class="cells ${firstLoad ? 'write' : ''}" aria-hidden="true">${cells}</div></h2>`;
}

async function renderHome() {
  const isParent = state.user?.role === 'parent';
  const isTutor = state.user?.role === 'tutor';
  const [{ posts }, { tutors }, mine] = await Promise.all([
    api('/posts'), api('/tutors'), state.user ? api('/bookings').catch(() => ({ bookings: [] })) : { bookings: [] },
  ]);
  const active = mine.bookings.filter(b => b.status === 'requested' || b.status === 'accepted');
  const popular = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 2);

  view.innerHTML = `
    ${state.user ? `<div class="greet">${esc(shortName(state.user.name))}님, 안녕하세요.</div>` : ''}
    ${notebook()}
    <div class="cta">
      ${isTutor ? `<a class="btn" href="#me">받은 신청 보기${active.length ? ` ${active.length}건` : ''}</a>` : `<a class="btn" href="#tutors">우리 아이 튜터 찾기</a>`}
      <a class="btn line" href="#community">커뮤니티</a>
    </div>

    ${active.length ? `
      <h3>${isTutor ? '진행 중인 신청' : '진행 중인 수업'} <a href="#me">전체</a></h3>
      <div class="list">${active.slice(0, 2).map(b => `<div>${bookingSummary(b, isTutor)}</div>`).join('')}</div>` : ''}

    <h3>추천 튜터 <a href="#tutors">전체</a></h3>
    <div class="list">${tutors.slice(0, 3).map(tutorRow).join('')}</div>

    <h3>부모님들 이야기 <a href="#community">전체</a></h3>
    <div class="list">${popular.map(p => `
      <a class="tap" href="#community"><div class="grow">
        <div class="clamp" style="font-weight:500">${esc(p.content)}</div>
        <div class="sub" style="margin-top:4px">${esc(p.region)} ${esc(shortName(p.authorName))}, 공감 ${p.likeCount}</div>
      </div>${chev}</a>`).join('')}</div>

    ${!isParent && !isTutor ? `
    <h3>이용 순서</h3>
    <ol class="list" style="list-style:none;padding:0;margin:8px 0 0">
      <li><b>1. 튜터 고르기</b><div class="sub">과목, 지역, 후기를 보고 아이와 맞을 분을 골라요.</div></li>
      <li><b>2. 1회 체험 수업</b><div class="sub">35,000원으로 먼저 만나 보고, 맞으면 월 8회 정기 수업으로 이어 가요.</div></li>
      <li><b>3. 수업 후 정산</b><div class="sub">수업료는 터틀리가 보관하다가 수업이 끝나면 튜터에게 전달해요. 거절되면 전액 환불돼요.</div></li>
    </ol>` : ''}`;
  bindTutorRows();
}

// ───────────── 튜터 ─────────────
function tutorRow(t) {
  return `<div class="tap" data-tutor="${t.id}" role="button" tabindex="0" aria-label="${esc(t.name)} 튜터 자세히 보기">
    ${avatar(t.name)}
    <div class="grow">
      <div class="row between" style="gap:8px"><span class="name">${esc(t.name)} 튜터</span>
        <span class="sub" style="white-space:nowrap">${t.reviewCount ? `평점 <b style="color:var(--ink)">${t.rating}</b>, 후기 ${t.reviewCount}` : '새로 온 튜터'}</span></div>
      <div class="sub">${esc(t.regions[0] || '')}${t.online ? ', 비대면 가능' : ''}</div>
      <div class="body2 clamp" style="margin-top:6px">${esc(t.intro)}</div>
      <div class="tags">${t.subjects.map(s => `<span>${esc(s)}</span>`).join('')}</div>
    </div>${chev}</div>`;
}
function bindTutorRows() {
  view.querySelectorAll('[data-tutor]').forEach(el => {
    el.onclick = () => showTutor(el.dataset.tutor);
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTutor(el.dataset.tutor); } };
  });
}

const tutorFilter = { subject: '', online: false, q: '' };
async function renderTutors() {
  const qs = new URLSearchParams({ ...(tutorFilter.subject && { subject: tutorFilter.subject }), ...(tutorFilter.online && { online: 'true' }), ...(tutorFilter.q && { q: tutorFilter.q }) });
  const { tutors } = await api('/tutors?' + qs);
  const subjects = ['', '국어', '수학', '사회성', '생활습관'];
  const filtered = tutorFilter.subject || tutorFilter.online || tutorFilter.q;
  view.innerHTML = `
    <form class="search" id="sf" role="search">${icon('search')}<input id="tq" type="search" placeholder="이름이나 키워드 (예: 반복학습)" aria-label="튜터 검색" value="${esc(tutorFilter.q)}"/></form>
    <div class="seg" aria-label="과목">
      ${subjects.map(s => `<button data-s="${s}" class="${tutorFilter.subject === s ? 'on' : ''}" aria-pressed="${tutorFilter.subject === s}">${s || '전체 과목'}</button>`).join('')}
      <button data-online class="toggle ${tutorFilter.online ? 'on' : ''}" aria-pressed="${tutorFilter.online}">비대면만</button>
    </div>
    <p class="count">튜터 ${tutors.length}명${filtered ? ` <button class="link" id="clearF">조건 지우기</button>` : ''}</p>
    <div class="list flush">${tutors.map(t => `<div>${tutorRow(t)}</div>`).join('') || `<div style="border:0">${emptyState('조건에 맞는 튜터가 없어요.', '<br/><button class="btn line sm" id="clearF2">조건 지우기</button>')}</div>`}</div>`;
  view.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => { tutorFilter.subject = b.dataset.s; renderTutors(); }));
  $('[data-online]', view).onclick = () => { tutorFilter.online = !tutorFilter.online; renderTutors(); };
  $('#sf').onsubmit = e => { e.preventDefault(); tutorFilter.q = $('#tq').value.trim(); renderTutors(); };
  $('#tq').onchange = () => { tutorFilter.q = $('#tq').value.trim(); renderTutors(); };
  const clear = () => { Object.assign(tutorFilter, { subject: '', online: false, q: '' }); renderTutors(); };
  $('#clearF')?.addEventListener('click', clear);
  $('#clearF2')?.addEventListener('click', clear);
  bindTutorRows();
}

async function showTutor(id) {
  const [{ tutor: t }, { plans, feeRate }] = await Promise.all([api('/tutors/' + id), api('/plans')]);
  let plan = 'single';
  const role = state.user?.role;
  openSheet(`${esc(t.name)} 튜터`, `
    <div class="row" style="gap:14px;margin-bottom:12px">${avatar(t.name, 'lg')}
      <div class="sub"><div>${t.reviewCount ? `평점 <b style="color:var(--ink)">${t.rating}</b>, 후기 ${t.reviewCount}개` : '새로 온 튜터'}</div>
      <div>${esc(t.regions.join(', '))}${t.online ? ', 비대면 가능' : ''}</div></div></div>
    <p style="margin:0 0 8px;font-size:17px">${esc(t.intro)}</p>
    ${t.career ? `<p class="sub" style="margin:0">${esc(t.career)}</p>` : ''}
    <div class="tags">${[...t.subjects, ...t.tags].map(s => `<span>${esc(s)}</span>`).join('')}</div>

    <h3 style="margin-top:26px">수업 선택</h3>
    <div class="stack" style="margin-top:10px" role="radiogroup" aria-label="수업 선택">${plans.map(p => `
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
      $('#bookBtn', root).textContent = state.user ? `${won(p.amount)} 결제하고 신청하기` : '로그인하고 신청하기';
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

// ───────────── 커뮤니티 ─────────────
let communityTag = '';
const TOPICS = ['한걸음', '질문', '정보', '모임'];
async function renderCommunity() {
  setTop('community', `<button class="btn sm" id="writeBtn">${icon('pen')}글쓰기</button>`);
  $('#writeBtn').onclick = () => (state.user ? composeSheet() : needLogin('글을 쓰려면 로그인해 주세요.'));
  const { posts } = await api('/posts' + (communityTag ? '?tag=' + encodeURIComponent(communityTag) : ''));
  view.innerHTML = `
    <div class="seg" aria-label="주제">${['', ...TOPICS].map(t => `<button data-t="${t}" class="${communityTag === t ? 'on' : ''}" aria-pressed="${communityTag === t}">${t || '전체'}</button>`).join('')}</div>
    <div class="list flush" id="posts">${posts.map(postRow).join('') || `<div style="border:0">${emptyState('아직 글이 없어요.', '<br/><button class="btn sm" id="firstPost">첫 글 쓰기</button>')}</div>`}</div>`;
  view.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { communityTag = b.dataset.t; renderCommunity(); }));
  $('#firstPost')?.addEventListener('click', () => $('#writeBtn').click());
  bindPosts();
}

function composeSheet() {
  openSheet('글쓰기', `<form id="pf" class="stack">
      <label class="field">주제<select name="tag">${TOPICS.map(t => `<option ${t === (communityTag || '한걸음') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="field">내용<textarea name="content" maxlength="1000" required placeholder="오늘 아이가 해낸 일, 궁금한 점을 적어 주세요" style="min-height:140px"></textarea></label>
      <label class="field"><span>지역 <span class="hint">글에 함께 보여요</span></span><input name="region" value="${esc(state.user.region || '')}" maxlength="20"/></label>
      <button class="btn">올리기</button></form>`, root => {
    $('textarea', root).focus();
    $('#pf', root).onsubmit = async e => {
      e.preventDefault();
      try { await api('/posts', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); closeSheet(); toast('글을 올렸어요.'); renderCommunity(); }
      catch (err) { toast(err.message); }
    };
  });
}

function postRow(p) {
  return `<article class="post" data-post="${p.id}">
    <div class="head">${avatar(p.authorName, 'sm')}
      <div class="who"><div class="small"><b>${esc(p.authorName)}</b>${p.authorRole === 'tutor' ? ' <span class="sub">튜터</span>' : ''}</div>
        <div class="sub">${esc(p.region)}, ${ago(p.createdAt)}</div></div>
      <span class="topic">${esc(p.tag)}</span></div>
    <p>${esc(p.content)}</p>
    ${p.comments.length ? `<div class="comments">${p.comments.map(c => `<div><b>${esc(c.authorName)}</b>${esc(c.content)}</div>`).join('')}</div>` : ''}
    <div class="actions">
      <button data-like class="${p.liked ? 'on' : ''}" aria-pressed="${p.liked}">${icon('heart')}공감 ${p.likeCount}</button>
      <button data-cmt>${icon('talk')}댓글 ${p.comments.length}</button>
      ${state.user?.id === p.userId ? '<button data-del class="del">삭제</button>' : ''}
    </div></article>`;
}
function bindPosts() {
  view.querySelectorAll('[data-post]').forEach(el => {
    const id = el.dataset.post;
    const replace = post => { el.outerHTML = postRow(post); bindPosts(); };
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
    }));
  });
}

// ───────────── e-도서관 ─────────────
let libCat = '';
async function renderLibrary() {
  const { items } = await api('/library' + (libCat ? '?category=' + encodeURIComponent(libCat) : ''));
  const kind = it => `<span class="kind ${esc(it.category)}"><svg viewBox="0 0 24 24" aria-hidden="true">${KIND[it.type] || KIND.card}</svg></span>`;
  view.innerHTML = `
    <div class="seg" aria-label="과목">${['', '국어', '수학', '사회성', '생활습관'].map(c => `<button data-c="${c}" class="${libCat === c ? 'on' : ''}" aria-pressed="${libCat === c}">${c || '전체'}</button>`).join('')}</div>
    <div class="list flush">${items.map(it => `
      <div class="tap" data-item="${it.id}" role="button" tabindex="0">
        ${kind(it)}
        <div class="grow"><div class="name">${esc(it.title)}</div>
          <div class="sub">${esc(it.category)} ${TYPE_NAME[it.type] || ''}, ${it.free ? '<span class="free">무료</span>' : `<span class="paid">${won(it.price)}</span>`}</div></div>
        ${chev}</div>`).join('')}</div>`;
  view.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { libCat = b.dataset.c; renderLibrary(); }));
  view.querySelectorAll('[data-item]').forEach(el => {
    const open = () => {
      const it = items.find(x => x.id === el.dataset.item);
      openSheet(esc(it.title), `
        <div class="row" style="margin-bottom:12px">${kind(it)}<div class="sub">${esc(it.category)} ${TYPE_NAME[it.type]}<br/>${esc(it.level)} 단계, ${it.free ? '무료' : won(it.price)}</div></div>
        <p>${esc(it.description)}</p>
        <button class="btn" id="open">${it.free ? '자료 열기' : `${won(it.price)}에 구매하기`}</button>`, root => {
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
  return `<div class="row between" style="gap:8px;align-items:baseline"><span class="name">${who}</span><span class="status ${b.status}">${STATUS[b.status]}</span></div>
    <div class="sub">${esc(b.label)}, ${won(b.amount)}${isTutor ? ` (정산 ${won(b.tutorPayout)})` : ''}</div>${track}`;
}

async function renderMe() {
  if (!state.user) return renderAuth();
  const { user, tutor } = await api('/me');
  const { bookings } = await api('/bookings');
  const isTutor = user.role === 'tutor';
  const earn = isTutor ? await api('/tutor/earnings') : null;
  setTop('me', `<button class="btn sm quiet" id="logout">로그아웃</button>`);

  view.innerHTML = `
    <div class="row" style="gap:14px;margin-bottom:20px">${avatar(user.name, 'lg')}
      <div><div class="name" style="font-size:20px">${esc(user.name)}</div><div class="sub">${isTutor ? '튜터' : '학부모'}, ${esc(user.email)}</div></div></div>
    ${isTutor ? `
      <div class="ledger"><div><span>정산 완료</span><b>${won(earn.paid)}</b></div><div><span>정산 예정</span><b>${won(earn.pending)}</b></div></div>
      <p class="sub" style="margin:0 0 14px">수업 완료를 누르면 수업료의 80%가 정산돼요.</p>
      <button class="btn line" id="editProfile">프로필 수정</button>` : ''}
    <h3>${isTutor ? `받은 신청 ${earn.requests ? `<span class="status requested">새 신청 ${earn.requests}건</span>` : ''}` : '신청한 수업'}</h3>
    <div class="list" style="margin-top:8px">${bookings.map(b => `
      <div data-b="${b.id}">
        ${bookingSummary(b, isTutor)}
        ${b.message ? `<p class="quote">${esc(b.message)}</p>` : ''}
        ${b.review ? `<p class="small" style="margin:8px 0 0">남긴 후기: ${b.review.rating}점${b.review.text ? `, ${esc(b.review.text)}` : ''}</p>` : ''}
        ${bookingActions(b, isTutor)}
      </div>`).join('') || `<div style="border:0">${isTutor
        ? emptyState('아직 받은 신청이 없어요.<br/>소개와 과목을 채워 두면 부모님이 찾기 쉬워져요.')
        : emptyState('아직 신청한 수업이 없어요.', '<br/><a class="btn sm" href="#tutors">튜터 찾기</a>')}</div>`}</div>`;

  view.querySelectorAll('[data-act]').forEach(btn => (btn.onclick = () => {
    const id = btn.closest('[data-b]').dataset.b;
    const act = btn.dataset.act;
    if (act === 'review') return reviewSheet(id);
    const done = { accepted: '신청을 수락했어요. 수업을 시작해 주세요.', rejected: '신청을 거절했어요. 결제금은 환불돼요.', completed: '수업 완료로 바꿨어요. 정산 완료에 반영됐어요.', cancelled: '신청을 취소했어요.' };
    const run = async () => {
      try { await api('/bookings/' + id, { method: 'PATCH', body: { status: act } }); toast(done[act]); renderMe(); }
      catch (e) { toast(e.message); }
    };
    if (act === 'rejected') return ask('신청 거절', '이 신청을 거절할까요? 부모님께 전액 환불돼요.', '거절', run);
    if (act === 'cancelled') return ask('신청 취소', '이 신청을 취소할까요? 결제금은 전액 환불돼요.', '신청 취소', run);
    if (act === 'completed') return ask('수업 완료', '모든 수업을 마쳤나요? 완료하면 정산이 진행돼요.', '수업 완료', run);
    run();
  }));
  $('#logout').onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ } setAuth(null); toast('로그아웃했어요.'); renderMe(); };
  $('#editProfile')?.addEventListener('click', () => editTutorSheet(tutor));
}

function bookingActions(b, isTutor) {
  const btn = (act, label, cls = 'line') => `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  let html = '';
  if (isTutor && b.status === 'requested') html = btn('rejected', '거절', 'quiet') + btn('accepted', '수락', '');
  if (isTutor && b.status === 'accepted') html = btn('completed', '수업 완료');
  if (!isTutor && b.status === 'requested') html = btn('cancelled', '신청 취소', 'quiet');
  if (!isTutor && b.status === 'completed' && !b.review) html = btn('review', '후기 쓰기', '');
  return html ? `<div class="row" style="justify-content:flex-end;gap:6px;margin-top:10px">${html}</div>` : '';
}

function reviewSheet(id) {
  let rating = 5;
  openSheet('수업 후기', `<p class="sub" style="margin:0 0 8px">수업은 어땠나요?</p>
    <div id="stars" class="row" style="gap:6px;margin-bottom:14px" role="radiogroup" aria-label="평점"></div>
    <form id="rf" class="stack"><textarea name="text" maxlength="300" placeholder="다른 부모님께 도움이 될 이야기를 남겨 주세요" aria-label="후기"></textarea><button class="btn">후기 올리기</button></form>`, root => {
    const draw = () => ($('#stars', root).innerHTML = [1, 2, 3, 4, 5].map(i =>
      `<button type="button" class="btn sm ${i === rating ? '' : 'line'}" data-r="${i}" role="radio" aria-checked="${i === rating}" style="min-width:44px">${i}</button>`).join('') + '<span class="sub">점</span>');
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
  openSheet('프로필 수정', `<form id="tf" class="stack">
      <label class="field">소개<textarea name="intro" maxlength="300">${esc(t.intro)}</textarea></label>
      <label class="field">경력<input name="career" maxlength="200" value="${esc(t.career)}"/></label>
      <label class="field"><span>과목 <span class="hint">쉼표로 구분</span></span><input name="subjects" value="${esc(t.subjects.join(', '))}"/></label>
      <label class="field"><span>활동 지역 <span class="hint">쉼표로 구분</span></span><input name="regions" value="${esc(t.regions.join(', '))}"/></label>
      <label class="row small"><input type="checkbox" name="online" style="width:22px;height:22px" ${t.online ? 'checked' : ''}/> 비대면 수업 가능</label>
      <button class="btn">프로필 저장</button></form>`, root => {
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

function renderAuth(mode = 'login') {
  const signup = mode === 'signup';
  setTop('me');
  view.innerHTML = `
    <div class="row" style="margin-bottom:20px"><img src="/turtle.svg" alt="" style="width:44px"/>
      <div><div class="name" style="font-size:18px">${signup ? '터틀리 가입' : '터틀리 로그인'}</div><div class="sub">${signup ? '학부모와 튜터 중 하나를 고르세요.' : '수업 신청과 커뮤니티는 로그인 후 이용할 수 있어요.'}</div></div></div>
    <form id="af" class="stack">
      ${signup ? `
        <div class="seg" role="radiogroup" aria-label="가입 유형" style="margin:0;padding:0"><button type="button" data-role="parent" class="on" role="radio" aria-checked="true">학부모</button><button type="button" data-role="tutor" role="radio" aria-checked="false">튜터</button></div>
        <label class="field">이름<input name="name" required maxlength="30" autocomplete="name"/></label>
        <label class="field">사는 지역<input name="region" placeholder="광진구" maxlength="30"/></label>` : ''}
      <label class="field">이메일<input name="email" type="email" required autocomplete="email" value="${signup ? '' : 'parent@turtley.dev'}"/></label>
      <label class="field">비밀번호 ${signup ? '<span class="hint">6자 이상</span>' : ''}<input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" value="${signup ? '' : 'demo1234'}"/></label>
      <button class="btn">${signup ? '가입하기' : '로그인'}</button>
      <button type="button" class="btn line" id="swap">${signup ? '이미 계정이 있어요' : '처음이에요, 가입하기'}</button>
      ${signup ? '' : `<p class="sub" style="text-align:center;margin:4px 0 0">데모용 학부모 계정이 채워져 있어요.<br/><button type="button" class="link" id="asTutor">튜터 계정으로 바꾸기</button></p>`}
    </form>`;
  let role = 'parent';
  view.querySelectorAll('[data-role]').forEach(b => (b.onclick = () => {
    role = b.dataset.role;
    view.querySelectorAll('[data-role]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
  }));
  $('#swap').onclick = () => renderAuth(signup ? 'login' : 'signup');
  $('#asTutor')?.addEventListener('click', () => { $('#af').email.value = 'tutor@turtley.dev'; toast('튜터 계정으로 바꿨어요. 로그인을 누르세요.'); });
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      setAuth(await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body: signup ? { ...body, role } : body }));
      toast(signup ? '가입했어요.' : `${shortName(state.user.name)}님, 로그인했어요.`);
      renderMe();
    } catch (err) { toast(err.message); }
  };
}

router();
})();
