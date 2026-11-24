# 터틀리 (Turtley)

> 느린학습자(경계선 지능) 아동을 위한 **맞춤형 1:1 교육 플랫폼** — 데모 버전
>
> 느려도 끝까지, 세상의 모든 거북이들을 위해.

경력단절여성 튜터와 느린학습자 가정을 **직접 선택형 1:1 매칭**으로 연결하고,
**안전거래(에스크로) 결제**, **전국 단위 연합 커뮤니티**, **시청각 e-도서관**을 한 곳에 모은 ALL-IN-ONE 플랫폼입니다.

## 주요 기능 (화면 23개, 모두 서버 API에 연결)

| 영역 | 화면 · 기능 |
|---|---|
| 시작 | 첫 화면 · 로그인(데모 계정 바로 보기) · 4단계 회원가입 (보호자/선생님/성인 학습자, 만 14세 미만 법정대리인 동의, 민감정보 별도 동의, 선생님 서류 4종) |
| 매칭 | 홈 · 튜터 찾기(과목·대상·방식·지역·수업료·정렬 6필터 + 체험 가능) · 선생님 상세(인증 4종, 가능 시간표, 8회 커리큘럼, 후기) · **수업 신청서** 6단계 → 선생님이 먼저 지원 |
| 예약 · 결제 | 월 4/8/12회 패키지, 선생님 가능 시간 안에서만 선택 · 바우처(`TURTLE10`) · **안전거래**(보관 → 보호자 확인 → 선생님 80% 정산) · 학원법 기준 환불 계산 · 결제 내역/환불 신청/후기 |
| 배움 | 수업 기록(오늘의 한 걸음, 기분, 집중 시간 추이, 보호자 확인 후 정산, 하트) · e-도서관 12종(단계별, 읽어주기, 저장) |
| 소통 | 앱 내 채팅(전화번호 자동 가림, 빠른 답장, 안심센터) · **커뮤니티**: 전국+17개 시·도 채널 × 게시판 6종 × **아이 발달 단계 4 × 나이대 4**, 선생님 답변 배지, 공감·댓글·신고·삭제, 보호자는 닉네임으로만 표시 |
| 선생님 | 선생님 홈(이번 달 예상 정산, 다가오는 수업, 수업 기록 올리기, 가능 시간 켜고 끄기, 수익 계산기, 인증 진행) · 학생 찾기(신청서에 지원) |
| 운영 | 관리자: 서류 4종 확인 → 승인해야 목록 공개, 반려, 신고 글 현황 |
| 접근성 | 쉬운 화면: 글자 3단계, 읽어주기, 움직임 줄이기, 44px 이상 버튼 |

넓은 화면에서는 가운데 iPad 프레임에 앱이, 왼쪽에 화면 목록·역할 전환, 오른쪽에 화면별 설계 노트, 그리고 **플랫폼 분석 리포트**(필수 요건 18, 경쟁 비교, 가격·수익 산출)가 함께 보입니다.

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

Node.js 18 이상이면 됩니다. 웹폰트(Pretendard, 나눔손글씨 펜)는 npm 패키지에서 서버가 직접 제공해서 CDN 없이도 동작합니다. `DATABASE_URL`이 없으면 `data/db.json` 파일에 저장하고, 비어 있으면 데모 데이터가 자동으로 들어갑니다.

| 데모 계정 | 이메일 | 비밀번호 |
|---|---|---|
| 학부모 | `parent@turtley.dev` | `demo1234` |
| 학부모2 | `parent2@turtley.dev` | `demo1234` |
| 선생님 | `tutor@turtley.dev` (~ `tutor12@`) | `demo1234` |
| 관리자 | `admin@turtley.dev` | `demo1234` |
| 심사 대기 선생님 | `pending1@turtley.dev` (~ `pending3@`) | `demo1234` |

```bash
npm run dev     # 파일 변경 시 자동 재시작
npm run seed    # 데모 데이터 초기화
npm test        # API 테스트 (node:test)
npm run preview # 서버 없이 도는 미리보기 → preview/index.html (server/core.js 를 브라우저에서 그대로 실행)
```

## 프로젝트 구조

```
turtley/
├─ shared/constants.js  # 과목·지역·단계·가격·환불 기준 (서버와 화면이 함께 씀)
├─ server/
│  ├─ core.js       # API 전체 로직 (Express와 미리보기가 같은 코드를 씀)
│  ├─ app.js        # Express 연결 + 정적 파일
│  ├─ index.js      # 서버 진입점 (데이터 구조가 바뀌면 데모 데이터로 자동 재설정)
│  ├─ db.js         # 저장소 선택 (DATABASE_URL → Postgres, 없으면 JSON 파일)
│  ├─ pg-store.js   # PostgreSQL 저장소
│  ├─ auth.js       # scrypt 비밀번호 해시
│  └─ seed.js       # 데모 데이터 (선생님 12 + 심사 대기 3, 아이 2, 수업 기록, 게시글, 자료 12)
├─ public/          # 프론트엔드 (바닐라 JS SPA)
├─ scripts/build-preview.js   # 단일 HTML 미리보기 빌드
├─ test/api.test.js
└─ .github/workflows/ci.yml
```

## API 요약

모든 경로는 `/api` 아래. 인증이 필요한 요청은 `Authorization: Bearer <token>` 헤더.

| Method | Path | 권한 | 설명 |
|---|---|---|---|
| GET | `/state` | - | 화면에 필요한 상태 한 번에 (역할별: 아이·예약·수업 기록·채팅·신청서·정산·심사 대기) |
| POST | `/auth/signup` · `/auth/login` · `/auth/logout` · `/auth/demo` | - | 가입(유형별 정보·동의 검증) / 로그인 / 데모 역할 로그인 |
| PATCH | `/me` | 로그인 | 내 정보 |
| POST · PATCH | `/kids` · `/kids/:id` | 보호자 | 아이 추가·수정 (특성, 커뮤니티 단계, 나이대) |
| GET | `/tutors` · `/tutors/:id` | - | 승인된 선생님만, 상세는 후기 포함 |
| PATCH | `/tutor/avail` | 선생님 | 가능 시간 칸 켜고 끄기 |
| POST | `/saved/(tutor\|lib)/:id` | 로그인 | 관심 선생님·자료 저장 토글 |
| POST | `/requests` · `/requests/:id/apply` | 보호자 · 선생님 | 수업 신청서 / 지원 (채팅으로 전달) |
| POST | `/bookings` | 보호자 | 예약·결제 (패키지, 시간 검증, 바우처, 안전거래 보관) |
| POST | `/bookings/:id/refund` · `/review` · `/lessons` | 보호자 · 선생님 | 환불 신청 / 후기 / 수업 기록 올리기 |
| POST | `/lessons/:id/confirm` · `/heart` | 보호자 | 수업 확인(정산 대상) / 하트 |
| POST · GET | `/threads` · `/threads/:id` · `/threads/:id/messages` | 로그인 | 채팅 (전화번호 자동 가림) |
| GET · POST | `/posts?region=&board=&level=&age=` | - / 로그인 | 커뮤니티 목록·작성 |
| GET · POST · DELETE | `/posts/:id` · `/like` · `/comments` · `/report` | 로그인 | 상세 / 공감 / 댓글 / 신고 / 삭제 |
| GET | `/library` | - | e-도서관 |
| PATCH · POST | `/admin/tutors/:id/docs` · `/approve` · `/reject` | 관리자 | 서류 확인 → 승인(4종 모두 필요) / 반려 |

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
- [x] 튜터 서류 4종 심사 흐름 (지금은 파일 이름만 저장)
- [x] 앱 내 1:1 채팅
- [ ] 서류 파일 실제 업로드 · 본인 확인 연동
- [ ] e-도서관 콘텐츠 뷰어 / 업로드
- [ ] 모바일 앱 (PWA → React Native)

## 라이선스

MIT
