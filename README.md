# 터틀리 (Turtley)

> 느린학습자(경계선 지능) 아동을 위한 **맞춤형 1:1 교육 플랫폼** — 데모 버전
>
> 느려도 끝까지, 세상의 모든 거북이들을 위해.

경력단절여성 튜터와 느린학습자 가정을 **직접 선택형 1:1 매칭**으로 연결하고,
**안전거래(에스크로) 결제**, **전국 단위 연합 커뮤니티**, **시청각 e-도서관**을 한 곳에 모은 ALL-IN-ONE 플랫폼입니다.

## 주요 기능

| 기능 | 설명 |
|---|---|
| 튜터 찾기 | 과목·지역·비대면 여부·키워드로 필터, 튜터 프로필/후기 확인 후 **직접 선택** |
| 안전거래 수업 신청 | 월 8회 24만원 / 1회 체험 3.5만원. 결제금은 플랫폼이 보관 → 수업 완료 시 튜터에게 **80%** 정산, 플랫폼 **20%** 중개수수료 |
| 예약 상태 관리 | `신청됨 → 수업 진행중 → 수업 완료` (튜터 수락/거절, 학부모 취소, 완료 후 후기·별점) |
| 튜터 정산 대시보드 | 정산 완료 / 정산 예정 금액, 새 신청 건수 |
| 단계별 커뮤니티 | 아이 발달 단계(아직 잘 모르겠어요 / 경계선 지능 / 경도 지적장애 / 중등도 이상) × 나이대(미취학~중학생 이상)로 단락을 나눠 보기. 학부모가 '우리 아이' 단계를 설정하면 그 단락으로 먼저 열림. 주제 태그, 공감·댓글 |
| e-도서관 | 그림카드·영상·워크북 등 시청각 학습 자료 (무료/유료) |
| 회원 | 학부모 / 튜터 역할 분리 가입, 토큰 기반 인증 (scrypt 해시) |

## GitHub에서 바로 실행 (Codespaces)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Social0w0/turtley?quickstart=1)

1. 위 버튼 → **Create codespace**
2. 1~2분 뒤 자동으로 `npm install` → `npm start` 가 실행되고, 3000번 포트 미리보기가 열립니다.
3. 다른 사람에게 보여주려면 하단 **PORTS** 탭 → 3000 우클릭 → **Port Visibility → Public** 후 주소 공유.
4. 다 쓰면 [github.com/codespaces](https://github.com/codespaces)에서 **Stop** (무료 사용 시간 절약).

## 로컬에서 실행하기

```bash
git clone https://github.com/<your-id>/turtley.git
cd turtley
npm install
npm start          # → http://localhost:3000
```

Node.js 18 이상이면 됩니다. 웹폰트(Pretendard, 고운돋움)는 npm 패키지에서 서버가 직접 제공해서 CDN 없이도 동작합니다. `DATABASE_URL`이 없으면 `data/db.json` 파일에 저장하고, 비어 있으면 데모 데이터가 자동으로 들어갑니다.

| 데모 계정 | 이메일 | 비밀번호 |
|---|---|---|
| 학부모 | `parent@turtley.dev` | `demo1234` |
| 학부모2 | `parent2@turtley.dev` | `demo1234` |
| 튜터 | `tutor@turtley.dev` (~ `tutor5@`) | `demo1234` |

```bash
npm run dev     # 파일 변경 시 자동 재시작
npm run seed    # 데모 데이터 초기화
npm test        # API 테스트 (node:test)
npm run preview # 서버 없이 도는 UI 미리보기 → preview/index.html (가짜 API, 새로고침하면 초기화)
```

## 프로젝트 구조

```
turtley/
├─ server/
│  ├─ index.js      # 서버 진입점 (PORT, DB_FILE 환경변수)
│  ├─ app.js        # Express 앱 + REST API 전체
│  ├─ db.js         # 저장소 선택 (DATABASE_URL → Postgres, 없으면 JSON 파일)
│  ├─ pg-store.js   # PostgreSQL 저장소
│  ├─ auth.js       # 비밀번호 해시, 토큰 인증 미들웨어
│  ├─ pricing.js    # 요금제 · 수수료(20%) 계산
│  └─ seed.js       # 데모 데이터
├─ public/          # 프론트엔드 (바닐라 JS SPA, 모바일 UI)
│  ├─ index.html
│  ├─ app.js
│  ├─ style.css     # 디자인 토큰 (깍두기 공책 모티프)
│  └─ turtle.svg
├─ test/api.test.js
└─ .github/workflows/ci.yml   # push/PR 시 Node 20·22에서 테스트
```

## API 요약

모든 경로는 `/api` 아래. 인증이 필요한 요청은 `Authorization: Bearer <token>` 헤더.

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| POST | `/auth/signup` | - | `{name,email,password,role:'parent'\|'tutor',region}` |
| POST | `/auth/login` | - | `{email,password}` → `{token,user}` |
| POST | `/auth/logout` | 로그인 | |
| GET | `/me` | 로그인 | 내 정보 (+튜터 프로필) |
| GET | `/tutors?subject=&region=&online=&q=` | - | 튜터 목록 |
| GET | `/tutors/:id` | - | 튜터 상세 |
| PATCH | `/tutors/me` | 튜터 | 프로필 수정 |
| GET | `/plans` | - | 요금제 + 수수료 내역 |
| POST | `/bookings` | 학부모 | `{tutorId,plan,childName,childAge,message}` |
| GET | `/bookings` | 로그인 | 내 예약 (학부모: 신청한 것 / 튜터: 받은 것) |
| PATCH | `/bookings/:id` | 로그인 | `{status}` — 튜터: accepted/rejected/completed, 학부모: cancelled |
| POST | `/bookings/:id/review` | 학부모 | 수업 완료 후 `{rating,text}` |
| GET | `/tutor/earnings` | 튜터 | 정산 요약 |
| GET | `/community/groups` | - | 단계 목록(글 수 포함)과 나이대 |
| GET / POST | `/posts` | - / 로그인 | 커뮤니티 목록·작성 (`?level=&age=&tag=`), 작성 시 `{content, level, age, tag}` |
| PATCH | `/me` | 로그인 | 지역, (학부모) `childLevel`, `childAge` |
| POST | `/posts/:id/like` | 로그인 | 공감 토글 |
| POST | `/posts/:id/comments` | 로그인 | 댓글 |
| DELETE | `/posts/:id` | 작성자 | 삭제 |
| GET | `/library?category=&free=` | - | e-도서관 |

## Render 배포

Render 무료 웹서비스는 디스크가 재시작마다 지워지므로 **반드시 Postgres를 연결**하세요. 연결하지 않으면 서버를 껐다 켤 때마다 데이터가 초기화됩니다.

1. Render 대시보드 → **New → Postgres** 생성 (웹서비스와 **같은 리전**)
2. 생성된 DB 페이지에서 **Internal Database URL** 복사
3. 웹서비스 → **Environment** → `DATABASE_URL` 에 붙여 넣기 → 저장 (자동 재배포)
4. 확인: `https://<서비스주소>/api/health` 응답에 `"storage":"postgres"` 가 보이면 성공
   (로그에도 `[db] 저장소: PostgreSQL (DATABASE_URL)` 출력)

| 항목 | 값 |
|---|---|
| Build Command | `npm install` |
| Start Command | `npm start` |
| `DATABASE_URL` | Internal Database URL |
| `PORT` | 비워 두기 (Render가 지정) |

- 데이터 초기화가 필요하면 Render 웹서비스 **Shell**에서 `npm run seed`
- Render **무료 Postgres는 생성 후 30일이 지나면 만료**됩니다. 오래 쓸 데모라면 유료 플랜이나 외부 Postgres(Neon, Supabase 등)의 URL을 `DATABASE_URL`에 넣으면 그대로 동작합니다.
- 현재는 전체 상태를 `turtley_state` 테이블의 jsonb 한 행에 저장하는 데모용 구조입니다. 사용자가 늘면 테이블 분리가 필요합니다.
- GitHub Pages는 정적 호스팅이라 백엔드가 돌지 않습니다.

## 다음 단계 (로드맵)

- [x] PostgreSQL 저장 (`DATABASE_URL`)
- [ ] 테이블 분리 + 마이그레이션 (현재는 jsonb 한 행)
- [ ] 실제 PG 결제 연동 (토스페이먼츠 등) 및 에스크로 정산 배치
- [ ] 튜터 자격 검증(서류 업로드), 신원 확인
- [ ] 튜터-학부모 1:1 채팅, 수업 일정 캘린더
- [ ] e-도서관 콘텐츠 뷰어 / 업로드
- [ ] 모바일 앱 (PWA → React Native)

## 라이선스

MIT
