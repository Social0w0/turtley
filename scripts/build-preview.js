// 서버 없이 열어 볼 수 있는 단일 HTML 미리보기를 만듭니다.
//   node scripts/build-preview.js  →  preview/index.html
// 화면(app.js·style.css)도, API(server/core.js)도 서버와 같은 파일을 그대로 씁니다.
// 다른 점은 저장소뿐이에요: 브라우저 메모리(+가능하면 localStorage)에 저장합니다.
const fs = require('fs');
const path = require('path');
const { Store } = require('../server/db');
const { seed } = require('../server/seed');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// 시드 데이터: 미리보기는 비밀번호를 평문 비교합니다 (데모 계정 전용, 실제 서버는 scrypt)
const db = new Store(null);
seed(db, { hash: pw => ({ salt: 'plain', hash: pw }) });
db.data.meta.schema = 3;
db.data.sessions = [];

const css = read('public/style.css').replace(/^@import url\('\/fonts\/[^']+'\);\n/gm, '');
// Pretendard 는 구글 폰트에 없어서 파일 안에 넣습니다 (pyftsubset 이 있으면 한글 2,350자로 줄여서).
function pretendardDataUri() {
  const full = require.resolve('pretendard/dist/web/variable/woff2/PretendardVariable.woff2');
  let buf = fs.readFileSync(full);
  try {
    const os = require('os');
    const { execFileSync } = require('child_process');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'turtley-'));
    let chars = '';
    for (let a = 0xb0; a <= 0xc8; a++) for (let b = 0xa1; b <= 0xfe; b++) chars += new TextDecoder('euc-kr').decode(Uint8Array.of(a, b));
    for (let c = 0x20; c < 0x7f; c++) chars += String.fromCharCode(c);
    chars += '…–—‘’“”₩×→○·';
    fs.writeFileSync(path.join(dir, 'chars.txt'), chars);
    const out = path.join(dir, 'p.woff2');
    execFileSync('pyftsubset', [full, '--text-file=' + path.join(dir, 'chars.txt'), '--flavor=woff2', '--layout-features=*', '--output-file=' + out], { stdio: 'ignore' });
    buf = fs.readFileSync(out);
  } catch { console.log('pyftsubset 이 없어 Pretendard 전체 파일을 넣습니다.'); }
  return 'data:font/woff2;base64,' + buf.toString('base64');
}
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap">'
  + `<style>@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;src:url(${pretendardDataUri()}) format('woff2-variations')}</style>`;
const safe = s => s.replace(/<\/script/gi, '<\\/script');

// 브라우저용 API: 같은 core.js 를 메모리 저장소 위에서 실행
const runtime = `
(function(){
  var mods = {};
  var define = function(name, fn){ mods[name] = { fn: fn, m: null }; };
  var req = function(name){ var d = mods[name]; if (!d.m) { d.m = { exports: {} }; d.fn(d.m, d.m.exports, req); } return d.m.exports; };
  define('../shared/constants', function(module, exports, require){ ${read('shared/constants.js')} });
  define('core', function(module, exports, require){ ${read('server/core.js')} });
  var KEY = 'turtley-preview-db-v2', SEED = window.__SEED, data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
  if (!data || !data.meta || data.meta.seedAt !== SEED.meta.seedAt) data = JSON.parse(JSON.stringify(SEED));
  var save = function(){ try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} };
  var uid = function(){ return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); };
  var db = {
    kind: 'browser',
    get data(){ return data; },
    id: uid,
    all: function(t){ return data[t]; }, find: function(t, f){ return data[t].find(f); }, filter: function(t, f){ return data[t].filter(f); },
    insert: function(t, row){ var r = Object.assign({ id: uid(), createdAt: new Date().toISOString() }, row); data[t].push(r); save(); return r; },
    update: function(t, id, p){ var r = data[t].find(function(x){ return x.id === id; }); if (!r) return null; Object.assign(r, p, { updatedAt: new Date().toISOString() }); save(); return r; },
    remove: function(t, f){ data[t] = data[t].filter(function(r){ return !f(r); }); save(); },
    isEmpty: function(){ return data.users.length === 0; }, save: save,
  };
  var auth = { hash: function(pw){ return { salt: 'plain', hash: pw }; }, verify: function(pw, s, h){ return s === 'plain' && pw === h; }, token: uid };
  var core = req('core').createCore(db, auth, { autoReply: true });
  window.__turtleyReset = function(){ try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); };
  window.__turtleyFetch = async function(url, opt){
    opt = opt || {};
    var u = new URL(url, 'http://x'); var h = (opt.headers && opt.headers.Authorization) || '';
    var out = await core.handle({ method: opt.method || 'GET', path: u.pathname.replace(/^\\/api/, ''), query: Object.fromEntries(u.searchParams),
      body: opt.body ? JSON.parse(opt.body) : {}, token: h.indexOf('Bearer ') === 0 ? h.slice(7) : null });
    var body = JSON.parse(JSON.stringify(out.body));
    return { ok: out.status < 400, status: out.status, json: async function(){ return body; } };
  };
})();`;
db.data.meta.seedAt = new Date().toISOString();

let html = read('public/index.html')
  .replace('<link rel="stylesheet" href="/style.css" />', () => `${fonts}\n<style>\n${css}</style>`)
  .replace('<script src="/shared/constants.js"></script>', () => `<script>\n${safe(read('shared/constants.js'))}\n</script>\n<script>window.__SEED = ${safe(JSON.stringify(db.data))};</script>\n<script>${safe(runtime)}</script>`)
  .replace('<script src="/app.js"></script>', () => `<script>\n${safe(read('public/app.js'))}\n</script>`)
  .replace('<title>터틀리 · 느린학습자 맞춤형 1:1 교육 플랫폼</title>', '<title>터틀리 미리보기</title>')
  .replace('서버 연결됨', '서버 없는 미리보기')
  .replace('입력한 내용은 서버에 저장돼요.', '미리보기라 입력한 내용은 이 브라우저에만 저장돼요. <button class="linkbtn" onclick="__turtleyReset()" style="padding:0;min-height:0">처음으로<\/button>');

const svgUri = 'data:image/svg+xml;base64,' + Buffer.from(read('public/turtle.svg')).toString('base64');
html = html.replaceAll('/turtle.svg', svgUri);
for (const f of fs.readdirSync(path.join(root, 'public/img'))) {
  const uri = 'data:image/webp;base64,' + fs.readFileSync(path.join(root, 'public/img', f)).toString('base64');
  html = html.replaceAll('/img/' + f, uri);
}
html = html.replace(/^<!doctype html>/i, '<!DOCTYPE html>');
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'index.html'), html);
console.log(`preview/index.html (${(html.length / 1024).toFixed(0)} KB)`);
