// 서버 없이 열어 볼 수 있는 단일 HTML 미리보기를 만듭니다.
//   node scripts/build-preview.js  →  preview/index.html
// 같은 app.js / style.css 를 그대로 쓰고, API 만 브라우저 메모리의 가짜 API 로 바꿉니다.
// (GitHub Pages 에 올리면 백엔드 없이 UI 데모로 쓸 수 있어요. 새로고침하면 데이터는 처음으로 돌아갑니다.)
const fs = require('fs');
const path = require('path');
const { Store } = require('../server/db');
const { seed } = require('../server/seed');
const { LEVELS, AGES } = require('../server/groups');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

// 시드 데이터 (비밀번호 해시는 빼고)
const db = new Store(null);
seed(db);
const data = db.data;
data.users = data.users.map(({ salt, passwordHash, ...u }) => u);
data.sessions = [];

const svgUri = 'data:image/svg+xml;base64,' + Buffer.from(read('public/turtle.svg')).toString('base64');
const css = read('public/style.css').replace(/^@import url\('\/fonts\/[^']+'\);\n/gm, '');
// Pretendard 는 구글 폰트에 없어서 파일 안에 넣습니다.
// fonttools(pyftsubset)가 있으면 자주 쓰는 한글 2,350자로 줄이고(약 0.4MB), 없으면 전체 파일(약 2MB)을 넣어요.
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
    chars += '…–—‘’“”₩×→';
    fs.writeFileSync(path.join(dir, 'chars.txt'), chars);
    const out = path.join(dir, 'p.woff2');
    execFileSync('pyftsubset', [full, '--text-file=' + path.join(dir, 'chars.txt'), '--flavor=woff2', "--layout-features=*", '--output-file=' + out], { stdio: 'ignore' });
    buf = fs.readFileSync(out);
  } catch { console.log('pyftsubset 이 없어 Pretendard 전체 파일을 넣습니다.'); }
  return 'data:font/woff2;base64,' + buf.toString('base64');
}
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap">'
  + `<style>@font-face{font-family:'Pretendard Variable';font-weight:45 920;font-style:normal;font-display:swap;src:url(${pretendardDataUri()}) format('woff2-variations')}</style>`;
const safe = s => s.replace(/<\/script/gi, '<\\/script');

let html = read('public/index.html')
  .replace('<link rel="stylesheet" href="/style.css" />', `${fonts}\n<style>\n${css}</style>`)
  .replace('<link rel="icon" href="/turtle.svg" type="image/svg+xml" />', `<link rel="icon" href="${svgUri}" type="image/svg+xml" />`)
  .replace('<script src="/app.js"></script>',
    `<script>window.__SEED = ${safe(JSON.stringify(data))};\nwindow.__GROUPS = ${safe(JSON.stringify({ levels: LEVELS, ages: AGES }))};</script>\n`
    + `<script>\n${safe(read('scripts/preview-mock.js'))}\n</script>\n`
    + `<script>\n${safe(read('public/app.js').replaceAll('/turtle.svg', svgUri))}\n</script>`)
  .replaceAll('/turtle.svg', svgUri)
  .replace('<title>터틀리 · 느린학습자 맞춤형 1:1 교육 플랫폼</title>', '<title>터틀리 미리보기</title>')
  .replace('<p class="pitch-demo">', '<p class="pitch-demo">서버 없이 도는 미리보기예요. 새로고침하면 처음 상태로 돌아가요.<br/>');

if (!html.startsWith('<!DOCTYPE')) html = html.replace(/^<!doctype html>/i, '<!DOCTYPE html>');
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'index.html'), html);
console.log(`preview/index.html (${(html.length / 1024).toFixed(0)} KB)`);
