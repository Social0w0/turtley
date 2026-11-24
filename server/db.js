// 저장소.
// - DATABASE_URL 이 있으면 PostgreSQL (server/pg-store.js)
// - 없으면 JSON 파일 (로컬 개발, Codespaces 용). 클라우드 무료 플랜에서는 재시작 시 지워집니다.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMPTY = () => ({
  users: [], sessions: [], kids: [], tutors: [], requests: [], applications: [], bookings: [], lessons: [],
  threads: [], posts: [], library: [], saved: [], meta: {},
});

class Store {
  constructor(file) {
    this.file = file; // null 이면 메모리 전용 (테스트용)
    this.kind = file ? 'file' : 'memory';
    this.data = EMPTY();
    if (file && fs.existsSync(file)) {
      this.data = { ...EMPTY(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
  }

  save() {
    if (!this.file) return;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file); // 원자적 교체
  }

  id() { return crypto.randomUUID(); }

  all(table) { return this.data[table]; }
  find(table, fn) { return this.data[table].find(fn); }
  filter(table, fn) { return this.data[table].filter(fn); }

  insert(table, row) {
    const rec = { id: this.id(), createdAt: new Date().toISOString(), ...row };
    this.data[table].push(rec);
    this.save();
    return rec;
  }

  update(table, id, patch) {
    const rec = this.find(table, r => r.id === id);
    if (!rec) return null;
    Object.assign(rec, patch, { updatedAt: new Date().toISOString() });
    this.save();
    return rec;
  }

  remove(table, fn) {
    const before = this.data[table].length;
    this.data[table] = this.data[table].filter(r => !fn(r));
    if (this.data[table].length !== before) this.save();
  }

  isEmpty() { return this.data.users.length === 0; }

  reset() { this.data = EMPTY(); this.save(); }
  async load() { return this; }
  async flush() {}
  async close() {}
}

// 환경변수를 보고 알맞은 저장소를 열어 줍니다.
async function openStore() {
  if (process.env.DATABASE_URL) {
    const { PgStore } = require('./pg-store');
    return new PgStore(process.env.DATABASE_URL).load();
  }
  const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
  return new Store(file);
}

module.exports = { Store, EMPTY, openStore };
