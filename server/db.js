// 아주 단순한 JSON 파일 DB.
// 데모용이라 네이티브 의존성 없이 clone → npm install → npm start 만으로 돌아가게 했습니다.
// 실제 서비스 단계에서는 PostgreSQL 등으로 교체하세요 (이 파일의 인터페이스만 맞추면 됩니다).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EMPTY = () => ({ users: [], sessions: [], tutors: [], bookings: [], posts: [], library: [] });

class Store {
  constructor(file) {
    this.file = file; // null 이면 메모리 전용 (테스트용)
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
}

module.exports = { Store };
