// PostgreSQL 저장소.
// DATABASE_URL 이 있으면 이걸 씁니다. Render 무료 웹서비스는 파일시스템이 재시작마다 지워지기 때문에
// 데이터를 남기려면 DB 가 필요합니다.
//
// 데모 단계라 전체 상태를 jsonb 한 행(turtley_state)에 저장합니다.
// - 시작할 때 한 번 읽어 메모리에 올리고
// - 변경될 때마다 최신 상태를 DB 에 덮어씁니다 (쓰기는 순서대로 하나씩, 밀린 건 최신본으로 합쳐서).
// 라우트 코드는 그대로 두고 저장 위치만 바꾸는 방식이라, 사용자가 많아지면 테이블 분리로 넘어가세요.
const { Pool } = require('pg');
const { Store, EMPTY } = require('./db');

function sslFor(url) {
  if (process.env.PGSSL === 'disable') return false;
  if (process.env.PGSSL === 'require') return { rejectUnauthorized: false };
  let host = '';
  try { host = new URL(url).hostname; } catch { /* ignore */ }
  if (/sslmode=disable/.test(url)) return false;
  // Render 내부 URL(dpg-xxxx-a 처럼 점이 없는 호스트)과 로컬은 SSL 없이, 외부 주소는 SSL 로 접속
  if (!host || host === 'localhost' || host === '127.0.0.1' || !host.includes('.')) return false;
  return { rejectUnauthorized: false };
}

class PgStore extends Store {
  constructor(url) {
    super(null);
    this.kind = 'postgres';
    this.pool = new Pool({ connectionString: url, ssl: sslFor(url), max: 3 });
    this.pool.on('error', err => console.error('[db] 연결 오류:', err.message));
    this._writing = null;
    this._dirty = false;
  }

  async load() {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS turtley_state (
      id int PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
    const { rows } = await this.pool.query('SELECT data FROM turtley_state WHERE id = 1');
    this.data = rows[0] ? { ...EMPTY(), ...rows[0].data } : EMPTY();
    return this;
  }

  save() {
    this._dirty = true;
    if (!this._writing) this._writing = this._drain();
  }

  async _drain() {
    try {
      while (this._dirty) {
        this._dirty = false;
        const json = JSON.stringify(this.data);
        await this.pool.query(
          `INSERT INTO turtley_state (id, data, updated_at) VALUES (1, $1::jsonb, now())
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
          [json]
        );
      }
    } catch (err) {
      console.error('[db] 저장 실패:', err.message);
      this._dirty = true;
      setTimeout(() => { this._writing = null; this.save(); }, 2000); // 잠시 후 재시도
      return;
    }
    this._writing = null;
  }

  // 종료 직전에 남은 쓰기를 마무리
  async flush() {
    while (this._writing) await this._writing;
  }

  async close() {
    await this.flush();
    await this.pool.end();
  }
}

module.exports = { PgStore };
