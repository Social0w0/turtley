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
  if (!res.ok) throw new Error(data.error || '요청에 실패했어요.');
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
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

function openSheet(html, onMount) {
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false;
  onMount?.($('#sheetBody'));
}
function closeSheet() { $('#sheet').hidden = true; }
$('#sheet').addEventListener('click', e => { if (e.target.dataset.close !== undefined) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
$('#menuBtn').onclick = () => (location.hash = '#/me');
$('#backBtn').onclick = () => history.back();

function needLogin(msg = '로그인이 필요해요') {
  toast(msg);
  location.hash = '#/me';
}

// ───────────── 라우터 ─────────────
const routes = {
  '': renderHome,
  tutors: renderTutors,
  community: renderCommunity,
  library: renderLibrary,
  me: renderMe,
};
async function router() {
  const [, name = '', param] = location.hash.split('/');
  document.querySelectorAll('.tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === (name || 'home')));
  $('#backBtn').style.visibility = param ? 'visible' : 'hidden';
  closeSheet();
  view.innerHTML = '<div class="empty">불러오는 중…</div>';
  try { await (routes[name] || renderHome)(param); }
  catch (e) { view.innerHTML = `<div class="empty">⚠️ ${esc(e.message)}</div>`; }
  view.scrollTop = 0;
}
window.addEventListener('hashchange', router);

// ───────────── 홈 ─────────────
async function renderHome() {
  const [{ posts }, { tutors }] = await Promise.all([api('/posts'), api('/tutors')]);
  const top = posts.find(p => p.tag === '한걸음') || posts[0];
  const hi = state.user ? `${esc(state.user.name.split('(')[0])}님,<br/>` : '';
  view.innerHTML = `
    <div class="hero">
      <h2>${hi}오늘도 우리는<br/>한 걸음 !</h2>
      <img src="/turtle.svg" alt="터틀리 마스코트" />
    </div>
    ${top ? `
    <div class="shared"><div class="avatar">👩</div><div class="avatar">👨</div><div class="avatar">🧑</div>
      <span class="small muted" style="margin-left:6px">공유된 사람들</span></div>
    <div class="feature" onclick="location.hash='#/community'">
      <div class="board">· 천천히 가도 괜찮아<br/>· 한 번 더, 또 한 번 더<br/>· 오늘의 한 걸음 ✏️</div>
      <div>
        <div class="quote">“${esc(top.content.slice(0, 70))}${top.content.length > 70 ? '…' : ''}”</div>
        <div class="meta" style="margin-top:12px"><span>❤️ ${top.likeCount} likes</span><span>📍 ${esc(top.region)}</span><span>${esc(top.authorName)}</span></div>
      </div>
    </div>` : ''}
    <div class="quick">
      <a href="#/tutors"><span>🧑‍🏫</span>1:1 튜터 찾기</a>
      <a href="#/community"><span>🤝</span>전국 커뮤니티</a>
      <a href="#/library"><span>📚</span>e-도서관</a>
    </div>

    <h3>추천 튜터 <a href="#/tutors">전체보기 ›</a></h3>
    <div class="stack">${tutors.slice(0, 3).map(tutorCard).join('')}</div>

    <h3>터틀리는 이렇게 달라요</h3>
    <div class="value">
      <div><b>직접 선택</b>배정이 아니라 부모님이 튜터를 직접 골라요</div>
      <div><b>월 8회 24만원</b>부담 없는 가격의 정기 수업</div>
      <div><b>안전거래</b>수업 완료 후 정산되는 에스크로 결제</div>
      <div><b>전국 연합</b>지역에 묶이지 않는 부모 커뮤니티</div>
    </div>`;
  bindTutorCards();
}

// ───────────── 튜터 ─────────────
function tutorCard(t) {
  return `<div class="card click row" data-tutor="${t.id}" style="align-items:flex-start">
    <div class="avatar">${esc(t.avatar)}</div>
    <div style="flex:1;min-width:0">
      <div class="row between"><b>${esc(t.name)} 튜터</b><span class="small"><span class="star">★ ${t.rating || '-'}</span> <span class="muted">(${t.reviewCount})</span></span></div>
      <div class="small muted" style="margin:4px 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(t.intro)}</div>
      <div class="chips">${t.subjects.map(s => `<span class="chip">${esc(s)}</span>`).join('')}
        <span class="chip sand">📍 ${esc(t.regions[0] || '')}</span>${t.online ? '<span class="chip indigo">비대면 가능</span>' : ''}</div>
    </div></div>`;
}
function bindTutorCards() {
  view.querySelectorAll('[data-tutor]').forEach(el => (el.onclick = () => showTutor(el.dataset.tutor)));
}

const tutorFilter = { subject: '', online: false, q: '' };
async function renderTutors() {
  const qs = new URLSearchParams({ ...(tutorFilter.subject && { subject: tutorFilter.subject }), ...(tutorFilter.online && { online: 'true' }), ...(tutorFilter.q && { q: tutorFilter.q }) });
  const { tutors } = await api('/tutors?' + qs);
  const subjects = ['', '국어', '수학', '사회성', '생활습관'];
  view.innerHTML = `
    <h2>우리 아이에게 맞는<br/>튜터를 직접 골라요</h2>
    <input id="tq" placeholder="키워드 검색 (예: 반복학습, 놀이수학)" value="${esc(tutorFilter.q)}" style="margin-bottom:10px"/>
    <div class="filter">
      ${subjects.map(s => `<button data-s="${s}" class="${tutorFilter.subject === s ? 'on' : ''}">${s || '전체'}</button>`).join('')}
      <button data-online class="${tutorFilter.online ? 'on' : ''}">💻 비대면</button>
    </div>
    <div class="stack">${tutors.map(tutorCard).join('') || '<div class="empty"><img src="/turtle.svg" alt=""/><br/>조건에 맞는 튜터가 없어요</div>'}</div>`;
  view.querySelectorAll('[data-s]').forEach(b => (b.onclick = () => { tutorFilter.subject = b.dataset.s; renderTutors(); }));
  $('[data-online]', view).onclick = () => { tutorFilter.online = !tutorFilter.online; renderTutors(); };
  const tq = $('#tq');
  tq.onchange = () => { tutorFilter.q = tq.value.trim(); renderTutors(); };
  bindTutorCards();
}

async function showTutor(id) {
  const [{ tutor: t }, { plans, feeRate }] = await Promise.all([api('/tutors/' + id), api('/plans')]);
  let plan = 'monthly8';
  const isParent = state.user?.role === 'parent';
  openSheet(`
    <div class="row" style="gap:14px"><div class="avatar lg">${esc(t.avatar)}</div>
      <div><b style="font-size:20px">${esc(t.name)} 튜터</b>
      <div class="small"><span class="star">★ ${t.rating || '-'}</span> <span class="muted">후기 ${t.reviewCount}개 · 📍 ${esc(t.regions.join(', '))}</span></div></div></div>
    <p style="line-height:1.6">${esc(t.intro)}</p>
    ${t.career ? `<div class="small muted">🎓 ${esc(t.career)}</div>` : ''}
    <div class="chips" style="margin:10px 0 4px">${[...t.subjects, ...t.tags].map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>

    <h3>수업 신청</h3>
    <div class="stack" id="plans">${plans.map(p => `
      <div class="plan ${p.plan === plan ? 'on' : ''}" data-plan="${p.plan}"><div><b>${p.label}</b><div class="small muted">${p.sessions}회 · 회당 ${won(Math.round(p.price / p.sessions))}</div></div><b>${won(p.price)}</b></div>`).join('')}</div>
    <form id="bookForm" class="stack" style="margin-top:12px">
      <div class="row"><label class="field" style="flex:2">아이 이름(별명)<input name="childName" required maxlength="20" placeholder="예: 하준"/></label>
        <label class="field" style="flex:1">나이<input name="childAge" type="number" min="3" max="19" placeholder="9"/></label></div>
      <label class="field">튜터에게 전할 말<textarea name="message" maxlength="500" placeholder="아이가 어려워하는 부분, 선호하는 방식 등을 적어주세요"></textarea></label>
      <div class="receipt" id="receipt"></div>
      <button class="btn" ${isParent ? '' : 'disabled'}>${isParent ? '안전결제로 신청하기' : state.user ? '학부모 계정만 신청할 수 있어요' : '로그인 후 신청할 수 있어요'}</button>
      ${state.user ? '' : '<button type="button" class="btn ghost" id="goLogin">로그인하기</button>'}
    </form>`, root => {
    const draw = () => {
      const p = plans.find(x => x.plan === plan);
      $('#receipt', root).innerHTML = `<div><span>결제 금액</span><b>${won(p.amount)}</b></div>
        <div class="muted"><span>└ 튜터 정산 (${100 - feeRate * 100}%)</span><span>${won(p.tutorPayout)}</span></div>
        <div class="muted"><span>└ 안전거래 중개수수료 (${feeRate * 100}%)</span><span>${won(p.platformFee)}</span></div>
        <div class="muted small" style="display:block;margin-top:4px">💡 결제금은 터틀리가 보관하고, 수업이 완료되면 튜터에게 지급돼요.</div>`;
      root.querySelectorAll('[data-plan]').forEach(el => el.classList.toggle('on', el.dataset.plan === plan));
    };
    root.querySelectorAll('[data-plan]').forEach(el => (el.onclick = () => { plan = el.dataset.plan; draw(); }));
    draw();
    $('#goLogin', root)?.addEventListener('click', () => needLogin('로그인 후 신청해 주세요'));
    $('#bookForm', root).onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      try {
        await api('/bookings', { method: 'POST', body: { tutorId: t.id, plan, ...f } });
        closeSheet(); toast('신청 완료! 튜터가 수락하면 알려드릴게요 🐢');
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
    <h2>전국 느린학습자<br/>연합 커뮤니티</h2>
    <div class="card" style="margin-bottom:12px">
      ${state.user ? `<form id="postForm" class="stack">
        <textarea name="content" maxlength="1000" placeholder="오늘 우리 아이의 한 걸음을 나눠주세요" required></textarea>
        <div class="row"><select name="tag" style="flex:1">${tags.slice(1).map(t => `<option>${t}</option>`).join('')}</select>
          <input name="region" placeholder="지역" value="${esc(state.user.region || '')}" style="flex:1"/>
          <button class="btn sm">올리기</button></div></form>`
      : `<div class="row between"><span class="small muted">로그인하면 글을 쓰고 공감할 수 있어요</span><button class="btn sm" onclick="location.hash='#/me'">로그인</button></div>`}
    </div>
    <div class="filter">${tags.map(t => `<button data-t="${t}" class="${communityTag === t ? 'on' : ''}">${t ? '#' + t : '전체'}</button>`).join('')}</div>
    <div class="stack" id="posts">${posts.map(postCard).join('') || '<div class="empty">아직 글이 없어요</div>'}</div>`;
  view.querySelectorAll('[data-t]').forEach(b => (b.onclick = () => { communityTag = b.dataset.t; renderCommunity(); }));
  $('#postForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try { await api('/posts', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); toast('글을 올렸어요'); renderCommunity(); }
    catch (err) { toast(err.message); }
  });
  bindPosts();
}

function postCard(p) {
  return `<article class="card post" data-post="${p.id}">
    <div class="row between"><div class="row"><div class="avatar" style="width:36px;height:36px;font-size:18px">${p.authorRole === 'tutor' ? '🧑‍🏫' : '🙂'}</div>
      <div><b class="small">${esc(p.authorName)}</b><div class="small muted">📍 ${esc(p.region)} · ${ago(p.createdAt)}</div></div></div>
      <span class="chip">#${esc(p.tag)}</span></div>
    <p>${esc(p.content)}</p>
    ${p.comments.length ? `<div class="stack" style="gap:6px;margin-bottom:8px">${p.comments.map(c => `<div class="comment"><b>${esc(c.authorName)}</b>${esc(c.content)}</div>`).join('')}</div>` : ''}
    <div class="actions">
      <button data-like class="${p.liked ? 'on' : ''}">${p.liked ? '❤️' : '🤍'} 공감 ${p.likeCount}</button>
      <button data-cmt>💬 댓글 ${p.comments.length}</button>
      ${state.user?.id === p.userId ? '<button data-del style="margin-left:auto">삭제</button>' : ''}
    </div></article>`;
}
function bindPosts() {
  view.querySelectorAll('[data-post]').forEach(el => {
    const id = el.dataset.post;
    const replace = post => { el.outerHTML = postCard(post); bindPosts(); };
    $('[data-like]', el).onclick = async () => {
      if (!state.user) return needLogin();
      try { replace((await api(`/posts/${id}/like`, { method: 'POST' })).post); } catch (e) { toast(e.message); }
    };
    $('[data-cmt]', el).onclick = () => {
      if (!state.user) return needLogin();
      openSheet(`<h3 style="margin-top:0">댓글 달기</h3><form id="cf" class="stack"><textarea name="content" maxlength="300" required placeholder="따뜻한 한마디를 남겨주세요"></textarea><button class="btn">등록</button></form>`, root => {
        $('textarea', root).focus();
        $('#cf', root).onsubmit = async e => {
          e.preventDefault();
          try { const { post } = await api(`/posts/${id}/comments`, { method: 'POST', body: Object.fromEntries(new FormData(e.target)) }); closeSheet(); replace(post); }
          catch (err) { toast(err.message); }
        };
      });
    };
    $('[data-del]', el)?.addEventListener('click', async () => {
      if (!confirm('이 글을 삭제할까요?')) return;
      try { await api('/posts/' + id, { method: 'DELETE' }); el.remove(); toast('삭제했어요'); } catch (e) { toast(e.message); }
    });
  });
}

// ───────────── e-도서관 ─────────────
let libCat = '';
async function renderLibrary() {
  const { items } = await api('/library' + (libCat ? '?category=' + encodeURIComponent(libCat) : ''));
  const cats = ['', '국어', '수학', '사회성', '생활습관'];
  const typeName = { video: '🎬 영상', card: '🃏 그림카드', worksheet: '📝 워크북' };
  view.innerHTML = `
    <h2>보고, 듣고, 따라하는<br/>e-도서관</h2>
    <div class="filter">${cats.map(c => `<button data-c="${c}" class="${libCat === c ? 'on' : ''}">${c || '전체'}</button>`).join('')}</div>
    <div class="lib">${items.map(it => `
      <div class="card click" data-item="${it.id}">
        <div class="thumb">${esc(it.emoji)}</div>
        <div class="title">${esc(it.title)}</div>
        <div class="row between small"><span class="muted">${typeName[it.type] || ''}</span><b style="color:var(--green-d)">${it.free ? '무료' : won(it.price)}</b></div>
      </div>`).join('')}</div>`;
  view.querySelectorAll('[data-c]').forEach(b => (b.onclick = () => { libCat = b.dataset.c; renderLibrary(); }));
  view.querySelectorAll('[data-item]').forEach(el => (el.onclick = () => {
    const it = items.find(x => x.id === el.dataset.item);
    openSheet(`<div class="lib" style="grid-template-columns:1fr"><div class="thumb" style="height:160px;font-size:72px">${esc(it.emoji)}</div></div>
      <h3 style="margin-top:12px">${esc(it.title)}</h3>
      <div class="chips" style="margin-bottom:10px"><span class="chip">${esc(it.category)}</span><span class="chip indigo">${typeName[it.type]}</span><span class="chip sand">${esc(it.level)}</span></div>
      <p style="line-height:1.6">${esc(it.description)}</p>
      <button class="btn" id="open">${it.free ? '바로 보기' : won(it.price) + ' 구매하기'}</button>`, root => {
      $('#open', root).onclick = () => { closeSheet(); toast(it.free ? '데모에서는 콘텐츠 뷰어가 준비 중이에요' : '데모에서는 결제가 비활성화돼 있어요'); };
    });
  }));
}

// ───────────── 마이 (로그인 / 대시보드) ─────────────
async function renderMe() {
  if (!state.user) return renderAuth();
  const { user, tutor } = await api('/me');
  const { bookings } = await api('/bookings');
  const statusName = { requested: '신청됨', accepted: '수업 진행중', completed: '수업 완료', rejected: '거절됨', cancelled: '취소됨' };
  const isTutor = user.role === 'tutor';
  const earn = isTutor ? await api('/tutor/earnings') : null;

  view.innerHTML = `
    <div class="row" style="gap:14px;margin-bottom:16px"><div class="avatar lg">${isTutor ? esc(tutor?.avatar || '🧑‍🏫') : '🙂'}</div>
      <div><b style="font-size:20px">${esc(user.name)}</b><div class="small muted">${isTutor ? '튜터' : '학부모'} · ${esc(user.email)}</div></div></div>
    ${isTutor ? `
      <div class="split"><div><span class="small muted">정산 완료</span><b>${won(earn.paid)}</b></div><div><span class="small muted">정산 예정</span><b>${won(earn.pending)}</b></div></div>
      <p class="small muted">수업료의 80%가 수업 완료 시 정산돼요. 새 신청 ${earn.requests}건</p>
      <button class="btn ghost" id="editProfile">튜터 프로필 수정</button>` : ''}
    <h3>${isTutor ? '받은 수업 신청' : '내 수업 신청'}</h3>
    <div class="stack">${bookings.map(b => `
      <div class="card" data-b="${b.id}">
        <div class="row between"><b>${isTutor ? `${esc(b.parentName)} · ${esc(b.childName)}${b.childAge ? ` (${b.childAge}세)` : ''}` : `${esc(b.tutorName)} 튜터 · ${esc(b.childName)}`}</b><span class="status ${b.status}">${statusName[b.status]}</span></div>
        <div class="small muted" style="margin:6px 0">${esc(b.label)} · ${won(b.amount)}${isTutor ? ` → 정산 ${won(b.tutorPayout)}` : ''}</div>
        ${b.message ? `<div class="comment" style="margin-bottom:8px">${esc(b.message)}</div>` : ''}
        ${b.review ? `<div class="small"><span class="star">${'★'.repeat(b.review.rating)}</span> ${esc(b.review.text)}</div>` : ''}
        <div class="row" style="justify-content:flex-end">${bookingActions(b, isTutor)}</div>
      </div>`).join('') || '<div class="empty"><img src="/turtle.svg" alt=""/><br/>아직 신청 내역이 없어요</div>'}</div>
    <button class="btn ghost" id="logout" style="margin-top:24px">로그아웃</button>`;

  view.querySelectorAll('[data-act]').forEach(btn => (btn.onclick = async () => {
    const id = btn.closest('[data-b]').dataset.b;
    const act = btn.dataset.act;
    if (act === 'review') return reviewSheet(id);
    try { await api('/bookings/' + id, { method: 'PATCH', body: { status: act } }); toast('상태를 변경했어요'); renderMe(); }
    catch (e) { toast(e.message); }
  }));
  $('#logout').onclick = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} setAuth(null); toast('로그아웃했어요'); renderMe(); };
  $('#editProfile')?.addEventListener('click', () => editTutorSheet(tutor));
}

function bookingActions(b, isTutor) {
  const btn = (act, label, cls = 'ghost') => `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  if (isTutor && b.status === 'requested') return btn('rejected', '거절', 'danger') + btn('accepted', '수락하기', '');
  if (isTutor && b.status === 'accepted') return btn('completed', '수업 완료 처리', '');
  if (!isTutor && b.status === 'requested') return btn('cancelled', '신청 취소', 'danger');
  if (!isTutor && b.status === 'completed' && !b.review) return btn('review', '후기 남기기', '');
  return '';
}

function reviewSheet(id) {
  let rating = 5;
  openSheet(`<h3 style="margin-top:0">수업은 어떠셨나요?</h3>
    <div id="stars" style="font-size:34px;letter-spacing:4px;cursor:pointer;margin-bottom:10px"></div>
    <form id="rf" class="stack"><textarea name="text" maxlength="300" placeholder="다른 부모님께 도움이 되는 후기를 남겨주세요"></textarea><button class="btn">후기 등록</button></form>`, root => {
    const draw = () => ($('#stars', root).innerHTML = [1, 2, 3, 4, 5].map(i => `<span data-r="${i}" style="color:${i <= rating ? '#e8a317' : '#ddd'}">★</span>`).join(''));
    $('#stars', root).onclick = e => { if (e.target.dataset.r) { rating = +e.target.dataset.r; draw(); } };
    draw();
    $('#rf', root).onsubmit = async e => {
      e.preventDefault();
      try { await api(`/bookings/${id}/review`, { method: 'POST', body: { rating, text: e.target.text.value } }); closeSheet(); toast('후기 고마워요 🐢'); renderMe(); }
      catch (err) { toast(err.message); }
    };
  });
}

function editTutorSheet(t) {
  openSheet(`<h3 style="margin-top:0">튜터 프로필</h3>
    <form id="tf" class="stack">
      <label class="field">소개<textarea name="intro" maxlength="300">${esc(t.intro)}</textarea></label>
      <label class="field">경력<input name="career" maxlength="200" value="${esc(t.career)}"/></label>
      <label class="field">과목 (쉼표로 구분)<input name="subjects" value="${esc(t.subjects.join(', '))}"/></label>
      <label class="field">활동 지역 (쉼표로 구분)<input name="regions" value="${esc(t.regions.join(', '))}"/></label>
      <label class="row small"><input type="checkbox" name="online" style="width:auto" ${t.online ? 'checked' : ''}/> 비대면 수업 가능</label>
      <button class="btn">저장</button></form>`, root => {
    $('#tf', root).onsubmit = async e => {
      e.preventDefault();
      const f = e.target;
      const split = v => v.split(',').map(s => s.trim()).filter(Boolean);
      try {
        await api('/tutors/me', { method: 'PATCH', body: { intro: f.intro.value, career: f.career.value, subjects: split(f.subjects.value), regions: split(f.regions.value), online: f.online.checked } });
        closeSheet(); toast('프로필을 저장했어요'); renderMe();
      } catch (err) { toast(err.message); }
    };
  });
}

function renderAuth(mode = 'login') {
  const signup = mode === 'signup';
  view.innerHTML = `
    <div style="text-align:center;margin:12px 0 20px"><img src="/turtle.svg" alt="" style="width:90px"/>
      <h2 style="margin-top:8px">${signup ? '터틀리와 함께<br/>천천히 시작해요' : '다시 만나서 반가워요'}</h2></div>
    <form id="af" class="stack">
      ${signup ? `
        <div class="filter" style="justify-content:center"><button type="button" data-role="parent" class="on">학부모로 가입</button><button type="button" data-role="tutor">튜터로 가입</button></div>
        <label class="field">이름<input name="name" required maxlength="30"/></label>
        <label class="field">지역<input name="region" placeholder="예: 광진구" maxlength="30"/></label>` : ''}
      <label class="field">이메일<input name="email" type="email" required autocomplete="email" value="${signup ? '' : 'parent@turtley.dev'}"/></label>
      <label class="field">비밀번호<input name="password" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}" value="${signup ? '' : 'demo1234'}"/></label>
      <button class="btn">${signup ? '가입하기' : '로그인'}</button>
      <button type="button" class="btn ghost" id="swap">${signup ? '이미 계정이 있어요' : '처음이에요 · 회원가입'}</button>
      ${signup ? '' : `<div class="small muted" style="text-align:center">데모: <a href="#" id="asTutor">튜터 계정으로 채우기</a></div>`}
    </form>`;
  let role = 'parent';
  view.querySelectorAll('[data-role]').forEach(b => (b.onclick = () => {
    role = b.dataset.role;
    view.querySelectorAll('[data-role]').forEach(x => x.classList.toggle('on', x === b));
  }));
  $('#swap').onclick = () => renderAuth(signup ? 'login' : 'signup');
  $('#asTutor')?.addEventListener('click', e => { e.preventDefault(); $('#af').email.value = 'tutor@turtley.dev'; });
  $('#af').onsubmit = async e => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      setAuth(await api(signup ? '/auth/signup' : '/auth/login', { method: 'POST', body: signup ? { ...body, role } : body }));
      toast(`${state.user.name}님 환영해요 🐢`);
      renderMe();
    } catch (err) { toast(err.message); }
  };
}

router();
