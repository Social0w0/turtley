// 터틀리 프론트엔드 (프레임워크 없는 해시 라우팅 SPA)
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

// ───────────── 아이콘 (직접 그린 라인 아이콘) ─────────────
const ICON = {
  home: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
  talk: '<path d="M4 5.5h16v10.5h-9l-4.5 3.5V16H4z"/>',
  book: '<path d="M12 6.5C9.5 4.8 6.5 4.6 3.5 5.3v13.2c3-.7 6-.5 8.5 1.2 2.5-1.7 5.5-1.9 8.5-1.2V5.3c-3-.7-6-.5-8.5 1.2zM12 6.5v13.2"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.3-3.8 4.2-5.6 7.5-5.6s6.2 1.8 7.5 5.6"/>',
  heart: '<path d="M12 19.5s-7.5-4.4-7.5-10A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7.5 2.5c0 5.6-7.5 10-7.5 10z"/>',
  reply: '<path d="M4 5.5h16v10.5h-9l-4.5 3.5V16H4z"/>',
  check: '<path d="m4.5 12.5 4.5 4.5L19.5 6.5"/>',
};
const icon = (name, cls = 'i') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[name]}</svg>`;
const THUMB = {
  video: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="m10 9 5 3-5 3z"/>',
  card: '<rect x="7" y="3.5" width="12" height="15" rx="1.5"/><path d="M5 6.5v13.5a.5.5 0 0 0 .5.5H16"/>',
  worksheet: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M9 10h6.5M9 13.5h6.5M9 17h4"/>',
};
const TYPE_NAME = { video: '영상', card: '그림카드', worksheet: '워크북' };

// 이름 첫 글자 아바타 (색은 이름으로 고정)
function avatar(name, size = '') {
  const s = String(name || '?');
  const n = [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 5 + 1;
  return `<span class="avatar ${size} c${n}" aria-hidden="true">${esc(s[0])}</span>`;
}
const shortName = n => String(n).split('(')[0];

// 탭바 / 상단 아이콘
const TABS = { home: ['home', '홈'], tutors: ['search', '튜터 찾기'], community: ['talk', '커뮤니티'], library: ['book', 'e-도서관'], me: ['user', '마이'] };
document.querySelectorAll('.tabbar a').forEach(a => { const [ic, label] = TABS[a.dataset.tab]; a.innerHTML = icon(ic) + label; });
$('#meBtn').innerHTML = icon('user');

// ───────────── 상태 / API ─────────────
const state = {
  token: localStorage.getItem('turtley_token'),
  user: JSON.parse(localStorage.getItem('turtley_user') || 'null'),
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
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
  if (state.token) {
    localStorage.setItem('turtley_token', state.token);
    localStorage.setItem('turtley_user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('turtley_token');
    localStorage.removeItem('turtley_user');
  }
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2400);
}

function openSheet(html, onMount) {
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  onMount?.($('#sheetBody'));
}
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('click', e => { if (e.target.dataset.close !== undefined) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function needLogin(msg = '로그인하면 이용할 수 있어요.') {
  toast(msg);
  location.hash = '#/me';
}

const emptyState = (text) => `<div class="empty"><img src="/turtle.svg" alt=""/>${text}</div>`;

// ───────────── 라우터 ─────────────
const routes = { '': renderHome, tutors: renderTutors, community: renderCommunity, library: renderLibrary, me: renderMe };
let firstLoad = true;
async function router() {
  const [, name = ''] = location.hash.split('/');
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (name || 'home')));
  closeSheet();
  try { await (routes[name] || renderHome)(); }
  catch (e) { view.innerHTML = emptyState(esc(e.message)); }
  view.scrollTop = 0;
  firstLoad = false;
}
window.addEventListener('hashchange', router);

// ───────────── 홈 ─────────────
function notebook() {
  // 깍두기 공책 한 줄 = 7칸. 마지막 빈칸에는 빨간펜 체크.
  const lines = ['오늘도 우리는', '한 걸음!'];
  let n = 0;
  const cells = lines.map(l => {
    const chars = [...l];
    while (chars.length < 7) chars.push('');
    return chars.map((c, i) => {
      const last = l === lines[1] && i === 6;
      const inner = last ? `<i>${icon('check')}</i>` : `<i>${c === ' ' ? '' : esc(c)}</i>`;
      return `<span class="${last ? 'check' : ''}" style="--n:${n++}">${inner}</span>`;
    }).join('');
  }).join('');
  return `<h2 class="notebook" aria-label="오늘도 우리는 한 걸음!"><div class="cells ${firstLoad ? 'write' : ''}" aria-hidden="true">${cells}</div></h2>`;
}

async function renderHome() {
  const [{ posts }, { tutors }] = await Promise.all([api('/posts'), api('/tutors')]);
  const top = posts.find(p => p.tag === '한걸음') || posts[0];
  view.innerHTML = `
    ${state.user ? `<div class="greet">${esc(shortName(state.user.name))}님, 안녕하세요.</div>` : ''}
    ${notebook()}

    ${top ? `
    <a class="today" href="#/community" style="display:block;text-decoration:none;color:inherit">
      <div class="label">이번 주의 한 걸음</div>
      <blockquote>${esc(top.content.length > 80 ? top.content.slice(0, 80) + '…' : top.content)}</blockquote>
      <div class="by"><span>${esc(top.authorName)}, ${esc(top.region)}</span><span class="heart">공감 ${top.likeCount}</span></div>
    </a>` : ''}

    <h3>추천 튜터 <a href="#/tutors">모두 보기</a></h3>
    <div class="list">${tutors.slice(0, 3).map(tutorRow).join('')}</div>

    <h3>처음 오셨다면</h3>
    <ol class="steps">
      <li><div><b>튜터를 직접 고르세요</b>과목과 지역, 후기를 보고 아이와 맞을 것 같은 분을 찾아요.</div></li>
      <li><div><b>1회 체험 수업부터</b>3만 5천원으로 먼저 만나 보고, 잘 맞으면 월 8회 정기 수업으로 이어 가요.</div></li>
      <li><div><b>수업이 끝나면 정산</b>수업료는 터틀리가 보관하다가 수업 완료 후 튜터에게 전달돼요.</div></li>
    </ol>`;
  bindTutorRows();
}

// ───────────── 튜터 ─────────────
function tutorRow(t) {
  return `<div class="click row" data-tutor="${t.id}" style="align-items:flex-start" role="button" tabindex="0">
    ${avatar(t.name)}
    <div style="flex:1;min-width:0">
      <div class="row between" style="gap:8px"><span class="name">${esc(t.name)} 튜터</span>
        <span class="rating">${t.reviewCount ? `<b>${t.rating}</b> / 5 후기 ${t.reviewCount}` : '새로 온 튜터'}</span></div>
      <div class="small muted clamp" style="margin:4px 0 8px">${esc(t.intro)}</div>
      <div class="tags">${t.subjects.map(s => `<span>${esc(s)}</span>`).join('')}
        <span class="plain">${esc(t.regions[0] || '')}${t.online ? ', 비대면 가능' : ''}</span></div>
    </div></div>`;
}
function bindTutorRows() {
  view.querySelectorAll('[data-tutor]').forEach(el => {
    el.onclick = () => showTutor(el.dataset.tutor);
    el.onkeydown = e => { if (e.key === 'Enter') showTutor(el.dataset.tutor); };
  });
}

const tutorFilter = { subject: '', online: false, q: '' };
async function renderTutors() {
  const qs = new URLSearchParams({ ...(tutorFilter.subject && { subject: tutorFilter.subject }), ...(tutorFilter.online && { online: 'true' }), ...(tutorFilter.q && { q: tutorFilter.q }) });
  const { tutors } = await api('/tutors?' + qs);
  const subjects = ['', '국어', '수학', '사회성', '생활습관'];
  view.innerHTML = `
    <h2>아이와 맞는 튜터를<br/>직접 골라 보세요</h2>
    <div class="search">${icon('search')}<input id="tq" type="search" placeholder="반복학습, 놀이수학처럼 검색" value="${esc(tutorFilter.q)}"/></div>
    <div class="seg">
      ${subjects.map(s => `<button data-s="${s}" class="${tutorFilter.subject === s ? 'on' : ''}">${s || '전체'}</button>`).join('')}
      <button data-online class="toggle ${tutorFilter.online ? 'on' : ''}">비대면</button>
    </div>
    <div class="list" style="border-top:0">${tutors.map(tutorRow).join('') || `<div style="border:0">${emptyState('조건에 맞는 튜터가 없어요.<br/>필터를 줄여서 다시 찾아보세요.')}</div>`}</div>`;
  view.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => { tutorFilter.subject = b.dataset.s; renderTutors(); }));
  $('[data-online]', view).onclick = () => { tutorFilter.online = !tutorFilter.online; renderTutors(); };
  const tq = $('#tq');
  tq.onchange = () => { tutorFilter.q = tq.value.trim(); renderTutors(); };
  bindTutorRows();
}

async function showTutor(id) {
  const [{ tutor: t }, { plans, feeRate }] = await Promise.all([api('/tutors/' + id), api('/plans')]);
  let plan = 'single';
  const isParent = state.user?.role === 'parent';
  const cta = isParent ? '수업 신청하기' : state.user ? '학부모 계정으로 신청할 수 있어요' : '로그인하고 신청하기';
  openSheet(`
    <div class="row" style="gap:14px">${avatar(t.name, 'lg')}
      <div><div class="name" style="font-size:19px">${esc(t.name)} 튜터</div>
      <div class="small muted">${t.reviewCount ? `평점 ${t.rating}, 후기 ${t.reviewCount}개` : '새로 온 튜터'}</div>
      <div class="small muted">${esc(t.regions.join(', '))}${t.online ? ', 비대면 가능' : ''}</div></div></div>
    <p style="margin:16px 0 8px">${esc(t.intro)}</p>
    ${t.career ? `<p class="small muted" style="margin:0 0 10px">${esc(t.career)}</p>` : ''}
    <div class="tags">${[...t.subjects, ...t.tags].map(s => `<span>${esc(s)}</span>`).join('')}</div>

    <h3 style="margin-top:26px">수업 신청</h3>
    <div class="stack" style="margin-top:10px">${plans.map(p => `
      <button type="button" class="plan" data-plan="${p.plan}"><span><b>${p.label}</b><br/><span class="small muted">${p.sessions}회, 회당 ${won(Math.round(p.price / p.sessions))}</span></span><b>${won(p.price)}</b></button>`).join('')}</div>
    <form id="bookForm" class="stack" style="margin-top:16px">
      <div class="row" style="align-items:flex-end"><label class="field" style="flex:2">아이 이름 또는 별명<input name="childName" required maxlength="20" placeholder="하준"/></label>
        <label class="field" style="flex:1">나이<input name="childAge" type="number" min="3" max="19" placeholder="9"/></label></div>
      <label class="field">튜터에게 미리 알려 줄 것<textarea name="message" maxlength="500" placeholder="어려워하는 부분, 집중이 잘 되는 시간대, 좋아하는 것"></textarea></label>
      <div class="receipt" id="receipt"></div>
      <button class="btn" ${isParent || !state.user ? '' : 'disabled'}>${cta}</button>
    </form>`, root => {
    const draw = () => {
      const p = plans.find(x => x.plan === plan);
      $('#receipt', root).innerHTML = `<div><span>결제 금액</span><span>${won(p.amount)}</span></div>
        <div><span>튜터에게 전달 (${100 - feeRate * 100}%)</span><span>${won(p.tutorPayout)}</span></div>
        <div><span>터틀리 안전거래 수수료 (${feeRate * 100}%)</span><span>${won(p.platformFee)}</span></div>
        <p>결제한 금액은 터틀리가 보관하고, 수업이 끝난 뒤 튜터에게 전달돼요. 튜터가 거절하면 전액 환불돼요.</p>`;
      root.querySelectorAll('[data-plan]').forEach(el => el.classList.toggle('on', el.dataset.plan === plan));
    };
    root.querySelectorAll('[data-plan]').forEach(el => (el.onclick = () => { plan = el.dataset.plan; draw(); }));
    draw();
    $('#bookForm', root).onsubmit = async e => {
      e.preventDefault();
      if (!state.user) return needLogin('로그인하고 다시 신청해 주세요.');
      const f = Object.fromEntries(new FormData(e.target));
      try {
        await api('/bookings', { method: 'POST', body: { tutorId: t.id, plan, ...f } });
        closeSheet(); toast('수업을 신청했어요. 튜터가 수락하면 마이에서 확인할 수 있어요.');
        location.hash = '#/me';
      } catch (err) { toast(err.message); }
    };
  });
}

// ───────────── 커뮤니티 ─────────────
let communityTag = '';
async function renderCommunity() {
  const { posts } = await api('/posts' + (communityTag ? '?tag=' + encodeURIComponent(communityTag) : ''));
  const tags = ['', '한걸음', '질문', '정보', '모임'];
  view.innerHTML = `
    <h2>전국의 부모님과<br/>이야기 나눠요</h2>
    ${state.user ? `<form id="postForm" class="composer">
        <textarea name="content" maxlength="1000" placeholder="오늘 아이가 해낸 일, 궁금한 점을 적어 주세요" required></textarea>
        <div class="row"><select name="tag" style="flex:1" aria-label="주제">${tags.slice(1).map(t => `<option>${t}</option>`).join('')}</select>
          <input name="region" placeholder="지역" aria-label="지역" value="${esc(state.user.region || '')}" style="flex:1"/>
          <button class="btn sm">올리기</button></div></form>`
      : `<p class="note row between">글을 쓰고 공감하려면 로그인하세요. <button class="link" onclick="location.hash='#/me'">로그인</button></p>`}
    <div class="seg">${tags.map(t => `<button data-t="${t}" class="${communityTag === t ? 'on' : ''}">${t || '전체'}</button>`).join('')}</div>
    <div class="list" style="border-top:0" id="posts">${posts.map(postRow).join('') || `<div style="border:0">${emptyState('아직 올라온 글이 없어요. 첫 글을 남겨 보세요.')}</div>`}</div>`;
  view.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { communityTag = b.dataset.t; renderCommunity(); }));
  $('#postForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try { await api('/posts', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); toast('글을 올렸어요.'); renderCommunity(); }
    catch (err) { toast(err.message); }
  });
  bindPosts();
}

function postRow(p) {
  return `<article class="post" data-post="${p.id}">
    <div class="head">${avatar(p.authorName, 'sm')}
      <div class="who"><div class="small"><b>${esc(p.authorName)}</b>${p.authorRole === 'tutor' ? ' <span class="tag">튜터</span>' : ''}</div>
        <div class="small muted">${esc(p.region)}, ${ago(p.createdAt)}</div></div>
      <span class="tag">${esc(p.tag)}</span></div>
    <p>${esc(p.content)}</p>
    ${p.comments.length ? `<div class="comments">${p.comments.map(c => `<div><b>${esc(c.authorName)}</b>${esc(c.content)}</div>`).join('')}</div>` : ''}
    <div class="actions">
      <button data-like class="${p.liked ? 'on' : ''}" aria-pressed="${p.liked}">${icon('heart')}공감 ${p.likeCount}</button>
      <button data-cmt>${icon('reply')}댓글 ${p.comments.length}</button>
      ${state.user?.id === p.userId ? '<button data-del class="del">삭제</button>' : ''}
    </div></article>`;
}
function bindPosts() {
  view.querySelectorAll('[data-post]').forEach(el => {
    const id = el.dataset.post;
    const replace = post => { el.outerHTML = postRow(post); bindPosts(); };
    $('[data-like]', el).onclick = async () => {
      if (!state.user) return needLogin();
      try { replace((await api(`/posts/${id}/like`, { method: 'POST' })).post); } catch (e) { toast(e.message); }
    };
    $('[data-cmt]', el).onclick = () => {
      if (!state.user) return needLogin();
      openSheet(`<h3 style="margin-top:0">댓글 쓰기</h3><form id="cf" class="stack" style="margin-top:12px"><textarea name="content" maxlength="300" required placeholder="응원이나 경험을 나눠 주세요"></textarea><button class="btn">댓글 올리기</button></form>`, root => {
        $('textarea', root).focus();
        $('#cf', root).onsubmit = async e => {
          e.preventDefault();
          try { const { post } = await api(`/posts/${id}/comments`, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); closeSheet(); replace(post); toast('댓글을 올렸어요.'); }
          catch (err) { toast(err.message); }
        };
      });
    };
    $('[data-del]', el)?.addEventListener('click', async () => {
      if (!confirm('이 글을 삭제할까요?')) return;
      try { await api('/posts/' + id, { method: 'DELETE' }); el.remove(); toast('글을 삭제했어요.'); } catch (e) { toast(e.message); }
    });
  });
}

// ───────────── e-도서관 ─────────────
let libCat = '';
async function renderLibrary() {
  const { items } = await api('/library' + (libCat ? '?category=' + encodeURIComponent(libCat) : ''));
  const cats = ['', '국어', '수학', '사회성', '생활습관'];
  const thumb = it => `<div class="thumb ${esc(it.category)}"><svg viewBox="0 0 24 24" aria-hidden="true">${THUMB[it.type] || THUMB.card}</svg></div>`;
  view.innerHTML = `
    <h2>보고, 듣고,<br/>따라 하는 자료</h2>
    <div class="seg">${cats.map(c => `<button data-c="${c}" class="${libCat === c ? 'on' : ''}">${c || '전체'}</button>`).join('')}</div>
    <div class="lib">${items.map(it => `
      <div class="item" data-item="${it.id}" role="button" tabindex="0">
        ${thumb(it)}
        <div class="title">${esc(it.title)}</div>
        <div class="meta"><span>${it.category} ${TYPE_NAME[it.type] || ''}</span><span class="price">${it.free ? '무료' : won(it.price)}</span></div>
      </div>`).join('')}</div>`;
  view.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { libCat = b.dataset.c; renderLibrary(); }));
  view.querySelectorAll('[data-item]').forEach(el => {
    const open = () => {
      const it = items.find(x => x.id === el.dataset.item);
      openSheet(`${thumb(it).replace('class="thumb', 'style="aspect-ratio:16/9" class="thumb')}
        <h3 style="margin-top:16px">${esc(it.title)}</h3>
        <div class="small muted">${esc(it.category)} ${TYPE_NAME[it.type]}, ${esc(it.level)} 단계</div>
        <p>${esc(it.description)}</p>
        <button class="btn" id="open">${it.free ? '자료 열기' : won(it.price) + '에 구매하기'}</button>`, root => {
        $('#open', root).onclick = () => { closeSheet(); toast(it.free ? '자료 보기 화면은 다음 버전에서 열려요.' : '데모에서는 결제를 할 수 없어요.'); };
      });
    };
    el.onclick = open;
    el.onkeydown = e => { if (e.key === 'Enter') open(); };
  });
}

// ───────────── 마이 (로그인 / 대시보드) ─────────────
const STATUS = { requested: '수락 대기', accepted: '수업 중', completed: '수업 완료', rejected: '거절됨', cancelled: '취소함' };

async function renderMe() {
  if (!state.user) return renderAuth();
  const { user, tutor } = await api('/me');
  const { bookings } = await api('/bookings');
  const isTutor = user.role === 'tutor';
  const earn = isTutor ? await api('/tutor/earnings') : null;

  view.innerHTML = `
    <div class="row" style="gap:14px;margin-bottom:24px">${avatar(user.name, 'lg')}
      <div><div class="name" style="font-size:19px">${esc(user.name)}</div><div class="small muted">${isTutor ? '튜터' : '학부모'} 계정, ${esc(user.email)}</div></div></div>
    ${isTutor ? `
      <div class="ledger"><div><span class="small muted">정산 완료</span><b>${won(earn.paid)}</b></div><div><span class="small muted">정산 예정</span><b>${won(earn.pending)}</b></div></div>
      <p class="small muted" style="margin:0 0 14px">수업을 완료 처리하면 수업료의 80%가 정산돼요. 새 신청 ${earn.requests}건이 있어요.</p>
      <button class="btn line" id="editProfile">튜터 프로필 수정</button>` : ''}
    <h3>${isTutor ? '받은 수업 신청' : '신청한 수업'}</h3>
    <div class="list" style="margin-top:8px">${bookings.map(b => `
      <div data-b="${b.id}">
        <div class="row between" style="gap:8px"><span class="name">${isTutor ? `${esc(b.childName)}${b.childAge ? ` (${b.childAge}세)` : ''}, ${esc(shortName(b.parentName))} 님` : `${esc(b.tutorName)} 튜터와 ${esc(b.childName)}`}</span><span class="status ${b.status}">${STATUS[b.status]}</span></div>
        <div class="small muted" style="margin-top:2px">${esc(b.label)} ${won(b.amount)}${isTutor ? `, 정산 예정 ${won(b.tutorPayout)}` : ''}</div>
        ${b.message ? `<p class="note">${esc(b.message)}</p>` : ''}
        ${b.review ? `<p class="small" style="margin:8px 0 0">후기 ${b.review.rating}/5 ${esc(b.review.text)}</p>` : ''}
        <div class="row" style="justify-content:flex-end;gap:6px;margin-top:6px">${bookingActions(b, isTutor)}</div>
      </div>`).join('') || `<div style="border:0">${emptyState(isTutor ? '아직 받은 신청이 없어요.<br/>프로필을 채우면 부모님들이 찾기 쉬워져요.' : '아직 신청한 수업이 없어요.<br/><a href="#/tutors">튜터 찾기</a>에서 시작해 보세요.')}</div>`}</div>
    <button class="btn quiet" id="logout" style="margin-top:24px">로그아웃</button>`;

  view.querySelectorAll('[data-act]').forEach(btn => (btn.onclick = async () => {
    const id = btn.closest('[data-b]').dataset.b;
    const act = btn.dataset.act;
    if (act === 'review') return reviewSheet(id);
    const done = { accepted: '신청을 수락했어요.', rejected: '신청을 거절했어요. 수업료는 환불돼요.', completed: '수업을 완료 처리했어요.', cancelled: '신청을 취소했어요.' };
    try { await api('/bookings/' + id, { method: 'PATCH', body: { status: act } }); toast(done[act]); renderMe(); }
    catch (e) { toast(e.message); }
  }));
  $('#logout').onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} setAuth(null); toast('로그아웃했어요.'); renderMe(); };
  $('#editProfile')?.addEventListener('click', () => editTutorSheet(tutor));
}

function bookingActions(b, isTutor) {
  const btn = (act, label, cls = 'line') => `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  if (isTutor && b.status === 'requested') return btn('rejected', '거절', 'quiet') + btn('accepted', '수락', '');
  if (isTutor && b.status === 'accepted') return btn('completed', '수업 완료 처리');
  if (!isTutor && b.status === 'requested') return btn('cancelled', '신청 취소', 'quiet');
  if (!isTutor && b.status === 'completed' && !b.review) return btn('review', '후기 쓰기');
  return '';
}

function reviewSheet(id) {
  let rating = 5;
  openSheet(`<h3 style="margin-top:0">수업은 어땠나요?</h3>
    <div id="stars" class="row" style="gap:6px;margin:14px 0" role="radiogroup" aria-label="평점"></div>
    <form id="rf" class="stack"><textarea name="text" maxlength="300" placeholder="다른 부모님께 도움이 될 이야기를 남겨 주세요"></textarea><button class="btn">후기 올리기</button></form>`, root => {
    const draw = () => ($('#stars', root).innerHTML = [1, 2, 3, 4, 5].map(i =>
      `<button type="button" class="btn sm ${i === rating ? '' : 'line'}" data-r="${i}" role="radio" aria-checked="${i === rating}" style="min-width:44px">${i}</button>`).join('') + '<span class="small muted">점</span>');
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
  openSheet(`<h3 style="margin-top:0">튜터 프로필</h3>
    <form id="tf" class="stack" style="margin-top:12px">
      <label class="field">소개<textarea name="intro" maxlength="300">${esc(t.intro)}</textarea></label>
      <label class="field">경력<input name="career" maxlength="200" value="${esc(t.career)}"/></label>
      <label class="field">과목 (쉼표로 구분)<input name="subjects" value="${esc(t.subjects.join(', '))}"/></label>
      <label class="field">활동 지역 (쉼표로 구분)<input name="regions" value="${esc(t.regions.join(', '))}"/></label>
      <label class="row small"><input type="checkbox" name="online" style="width:auto" ${t.online ? 'checked' : ''}/> 비대면 수업 가능</label>
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
  view.innerHTML = `
    <h2>${signup ? '터틀리에<br/>가입하기' : '터틀리에<br/>로그인하기'}</h2>
    <form id="af" class="stack">
      ${signup ? `
        <div class="seg" role="radiogroup" aria-label="가입 유형"><button type="button" data-role="parent" class="on">학부모</button><button type="button" data-role="tutor">튜터</button></div>
        <label class="field">이름<input name="name" required maxlength="30"/></label>
        <label class="field">사는 지역<input name="region" placeholder="광진구" maxlength="30"/></label>` : ''}
      <label class="field">이메일<input name="email" type="email" required autocomplete="email" value="${signup ? '' : 'parent@turtley.dev'}"/></label>
      <label class="field">비밀번호<input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" value="${signup ? '' : 'demo1234'}"/></label>
      <button class="btn">${signup ? '가입하기' : '로그인'}</button>
      <button type="button" class="btn line" id="swap">${signup ? '이미 계정이 있어요' : '새로 가입하기'}</button>
      ${signup ? '' : `<p class="small muted" style="text-align:center;margin:4px 0 0">데모용으로 학부모 계정이 채워져 있어요. <button type="button" class="link" id="asTutor">튜터 계정으로 바꾸기</button></p>`}
    </form>`;
  let role = 'parent';
  view.querySelectorAll('[data-role]').forEach(b => (b.onclick = () => {
    role = b.dataset.role;
    view.querySelectorAll('[data-role]').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#swap').onclick = () => renderAuth(signup ? 'login' : 'signup');
  $('#asTutor')?.addEventListener('click', () => { $('#af').email.value = 'tutor@turtley.dev'; });
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      setAuth(await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body: signup ? { ...body, role } : body }));
      toast(signup ? '가입을 마쳤어요.' : `${shortName(state.user.name)}님, 로그인했어요.`);
      renderMe();
    } catch (err) { toast(err.message); }
  };
}

router();
