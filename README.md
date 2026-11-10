# 🐢 터틀리 (Turtley)

> 느린학습자(경계선 지능) 아동을 위한 **맞춤형 1:1 교육 플랫폼** — 데모 버전
>
> 느려도 끝까지, 세상의 모든 거북이들을 위해.

경력단절여성 튜터와 느린학습자 가정을 **직접 선택형 1:1 매칭**으로 연결하고,
**안전거래(에스크로) 결제**, **전국 단위 연합 커뮤니티**, **시청각 e-도서관**을 한 곳에 모은 ALL-IN-ONE 플랫폼입니다.

## 주요 기능

| 기능 | 설명 |
|---|---|
| 🧑‍🏫 튜터 찾기 | 과목·지역·비대면 여부·키워드로 필터, 튜터 프로필/후기 확인 후 **직접 선택** |
| 💳 안전거래 수업 신청 | 월 8회 24만원 / 1회 체험 3.5만원. 결제금은 플랫폼이 보관 → 수업 완료 시 튜터에게 **80%** 정산, 플랫폼 **20%** 중개수수료 |
| 📋 예약 상태 관리 | `신청됨 → 수업 진행중 → 수업 완료` (튜터 수락/거절, 학부모 취소, 완료 후 후기·별점) |
| 💰 튜터 정산 대시보드 | 정산 완료 / 정산 예정 금액, 새 신청 건수 |
| 🤝 전국 연합 커뮤니티 | `#한걸음 #질문 #정보 #모임` 태그, 지역 표시, 공감·댓글 |
| 📚 e-도서관 | 그림카드·영상·워크북 등 시청각 학습 자료 (무료/유료) |
| 🔐 회원 | 학부모 / 튜터 역할 분리 가입, 토큰 기반 인증 (scrypt 해시) |

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

Node.js 18 이상이면 됩니다. 첫 실행 시 `data/db.json`에 데모 데이터가 자동으로 들어갑니다.

| 데모 계정 | 이메일 | 비밀번호 |
|---|---|---|
| 학부모 | `parent@turtley.dev` | `demo1234` |
| 학부모2 | `parent2@turtley.dev` | `demo1234` |
| 튜터 | `tutor@turtley.dev` (~ `tutor5@`) | `demo1234` |

```bash
npm run dev     # 파일 변경 시 자동 재시작
npm run seed    # 데모 데이터 초기화
npm test        # API 테스트 (node:test)
```

## 프로젝트 구조

```
turtley/
├─ server/
│  ├─ index.js      # 서버 진입점 (PORT, DB_FILE 환경변수)
│  ├─ app.js        # Express 앱 + REST API 전체
│  ├─ db.js         # JSON 파일 DB (나중에 PostgreSQL 등으로 교체)
│  ├─ auth.js       # 비밀번호 해시, 토큰 인증 미들웨어
│  ├─ pricing.js    # 요금제 · 수수료(20%) 계산
│  └─ seed.js       # 데모 데이터
├─ public/          # 프론트엔드 (바닐라 JS SPA, 모바일 UI)
│  ├─ index.html
│  ├─ app.js
│  ├─ style.css
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
| GET / POST | `/posts` | - / 로그인 | 커뮤니티 목록·작성 (`?tag=&region=`) |
| POST | `/posts/:id/like` | 로그인 | 공감 토글 |
| POST | `/posts/:id/comments` | 로그인 | 댓글 |
| DELETE | `/posts/:id` | 작성자 | 삭제 |
| GET | `/library?category=&free=` | - | e-도서관 |

## 배포 팁

- **Render / Railway / Fly.io**: Start command `npm start`, 환경변수 `PORT`는 플랫폼이 자동 지정.
  단, 이 데모의 JSON DB는 파일이라 재배포 시 초기화될 수 있으니 영구 디스크를 붙이거나 DB를 교체하세요.
- GitHub Pages는 정적 호스팅이라 백엔드가 돌지 않습니다.

## 다음 단계 (로드맵)

- [ ] PostgreSQL + 마이그레이션 (`server/db.js` 인터페이스 교체)
- [ ] 실제 PG 결제 연동 (토스페이먼츠 등) 및 에스크로 정산 배치
- [ ] 튜터 자격 검증(서류 업로드), 신원 확인
- [ ] 튜터-학부모 1:1 채팅, 수업 일정 캘린더
- [ ] e-도서관 콘텐츠 뷰어 / 업로드
- [ ] 모바일 앱 (PWA → React Native)

## 라이선스

MIT
