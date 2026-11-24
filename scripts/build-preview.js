// 서버 없이 열어 볼 수 있는 단일 HTML 미리보기를 만듭니다.
//   node scripts/build-preview.js  →  preview/index.html
// 같은 app.js / style.css 를 그대로 쓰고, API 만 브라우저 메모리의 가짜 API 로 바꿉니다.
// (GitHub Pages 에 올리면 백엔드 없이 UI 데모로 쓸 수 있어요. 새로고침하면 데이터는 처음으로 돌아갑니다.)
const fs = require('fs');
const path = require('path');
const { Store } = require('../server/db');
const { seed } = require('../server/seed');

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
const fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=IBM+Plex+Sans+KR:wght@400;600&display=swap">';
const safe = s => s.replace(/<\/script/gi, '<\\/script');

let html = read('public/index.html')
  .replace('<link rel="stylesheet" href="/style.css" />', `${fonts}\n<style>\n${css}</style>`)
  .replace('<link rel="icon" href="/turtle.svg" type="image/svg+xml" />', `<link rel="icon" href="${svgUri}" type="image/svg+xml" />`)
  .replace('<script src="/app.js"></script>',
    `<script>window.__SEED = ${safe(JSON.stringify(data))};</script>\n`
    + `<script>\n${safe(read('scripts/preview-mock.js'))}\n</script>\n`
    + `<script>\n${safe(read('public/app.js').replaceAll('/turtle.svg', svgUri))}\n</script>`)
  .replaceAll('/turtle.svg', svgUri)
  .replace('<title>터틀리 · 느린학습자 맞춤형 1:1 교육 플랫폼</title>', '<title>터틀리 미리보기</title>')
  .replace('<p class="pitch-demo">', '<p class="pitch-demo">서버 없이 도는 미리보기예요. 새로고침하면 처음 상태로 돌아가요.<br/>');

if (!html.startsWith('<!DOCTYPE')) html = html.replace(/^<!doctype html>/i, '<!DOCTYPE html>');
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview', 'index.html'), html);
console.log(`preview/index.html (${(html.length / 1024).toFixed(0)} KB)`);
