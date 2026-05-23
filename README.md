# 집수리 클라쓰 웹사이트

집수리, 누수 복구, 부분수리 상담 전환을 목표로 만든 React + Vite 웹앱입니다.
이 프로젝트의 핵심 설계 기준은 **간편한 유지보수, 쉬운 기능 추가, 확장성**입니다.

## Design Principle

- 기능은 역할별로 분리합니다. 화면, 데이터, 타입, 외부 연동을 한 파일에 섞지 않습니다.
- 운영자가 자주 바꿀 내용은 `src/data.ts`에 모읍니다.
- 네이버 블로그처럼 외부 형식에 의존하는 로직은 `src/services/`에 둡니다.
- 화면 섹션은 `src/App.tsx` 안에서 `HeroSection`, `ServicesSection`, `BlogSection`처럼 이름으로 바로 찾을 수 있게 나눕니다.
- 타입은 `src/types.ts`에 모아 데이터 구조가 바뀔 때 영향 범위를 빠르게 파악합니다.

## Quick Start

```bash
npm install
npm run dev -- --port 5173
npm run build
```

로컬 확인 주소:

```text
http://localhost:5173
```

## Deployment

Recommended production stack:

- Frontend hosting: Vercel
- Serverless API: Vercel Functions
- Database/Auth/Storage: Supabase
- Domain: `jipsuriclass.kr`

Deployment settings are committed in `vercel.json`.

```text
Build Command: npm run build
Output Directory: dist
Framework: Vite
```

### Vercel Environment Variables

Add these in Vercel Project Settings -> Environment Variables:

```text
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_BLOG_ID=it77khy
GEMINI_API_KEY=
GEMINI_BLOG_SUMMARY_MODEL=gemini-2.5-flash-lite
VITE_NAVER_MAP_CLIENT_ID=
VITE_NAVER_MAP_LAT=
VITE_NAVER_MAP_LNG=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=
```

Notes:

- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` are required for blog and map APIs.
- `GEMINI_API_KEY` is optional. If it is missing, blog summary cards fall back to the base Naver content.
- `VITE_NAVER_MAP_CLIENT_ID`, `VITE_NAVER_MAP_LAT`, and `VITE_NAVER_MAP_LNG` improve the interactive office map. If they are missing, the static Naver map embed still stays available.
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are required for inquiry storage and account/admin flows.
- `ADMIN_EMAIL` / `RESEND_API_KEY` are only needed if you want email alerts to actually send.

### Domain DNS

After adding `jipsuriclass.kr` in Vercel Project Settings -> Domains, set the DNS records in Hosting.kr.
Use the exact values shown by Vercel. The usual Vercel values are:

```text
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

Set `www.jipsuriclass.kr` to redirect to `jipsuriclass.kr` in Vercel.

## Project Map

```text
src/
  App.tsx                         # 페이지 조립과 섹션 컴포넌트
  data.ts                         # 운영 정보, 서비스, 사례, fallback 블로그 글
  types.ts                        # 공통 타입 정의
  styles.css                      # 전체 디자인 토큰과 반응형 스타일
  main.tsx                        # React/PWA 진입점
  lib/
    supabaseClient.ts             # 브라우저 Supabase 클라이언트
  services/
    BlogPortfolioService.ts       # 네이버 블로그 API 정제와 fallback 처리
    InquiryService.ts             # 문의 저장 로직
supabase/
  schema.sql                      # 초기 DB/RLS 스키마
public/
  manifest.webmanifest            # PWA 설치 정보
  service-worker.js               # 앱 셸 캐시
  icons/                          # PWA 아이콘
vite.config.ts                    # Vite 설정과 /api/naver-blog 프록시
api/
  naver-blog.ts                   # Vercel 프로덕션 서버리스 API
vercel.json                       # Vercel 배포 설정
```

## How To Find And Change Things

- 전화번호, 카카오톡, 사업자 정보 변경:
  - `src/data.ts`의 `business`
- 서비스 카드 추가/수정:
  - `src/data.ts`의 `services`
- 증상별 진입 버튼 수정:
  - `src/data.ts`의 `symptoms`
- 대표 현장사례 수정:
  - `src/data.ts`의 `cases`
- 네이버 API 실패 시 보여줄 대표 블로그 글 수정:
  - `src/data.ts`의 `pinnedPosts`
- 네이버 블로그 API 호출/정제 방식 수정:
  - `src/services/BlogPortfolioService.ts`
  - `vite.config.ts`의 `/api/naver-blog`
  - `api/naver-blog.ts`의 프로덕션 서버리스 API
- 문의 저장 방식 수정:
  - `src/services/InquiryService.ts`
  - `supabase/schema.sql`
- 화면 섹션 순서나 배치 수정:
  - `src/App.tsx`
- 색상, 여백, 모바일 반응형 수정:
  - `src/styles.css`
- 웹앱 설치 이름, 아이콘, 테마색 수정:
  - `public/manifest.webmanifest`
  - `public/icons/`

## Feature Boundaries

### UI Sections

`src/App.tsx`는 기능별 섹션 컴포넌트로 구성됩니다.

- `SiteHeader`: 상단 메뉴와 모바일 메뉴
- `HeroSection`: 첫 화면 메시지와 상담 CTA
- `SymptomsSection`: 고객 증상 기준 진입
- `ServicesSection`: 서비스 카테고리
- `CasesSection`: 수동 대표 시공사례
- `BlogSection`: 네이버 블로그 포트폴리오
- `ProcessSection`: 작업 절차
- `ContactSection`: 문의/사업자 정보/견적 폼
- `MobileQuickCta`: 모바일 하단 고정 CTA

새 섹션을 추가할 때는 `App`의 `<main>` 안에 섹션 컴포넌트를 추가하고, 필요한 데이터는 `data.ts`에 둡니다.

### Data

운영자가 자주 바꾸는 텍스트와 링크는 `src/data.ts`에 둡니다.
컴포넌트 안에 직접 박아 넣는 텍스트는 섹션 제목, 안내 문구처럼 디자인 구조와 강하게 묶인 경우로 제한합니다.

### Services

외부 API, 데이터 정제, fallback 정책은 `src/services/`에 둡니다.
UI 컴포넌트는 외부 API 응답 형식을 직접 알지 않도록 합니다.

현재 서비스:

- `BlogPortfolioService`: 네이버 블로그 응답을 화면용 `PortfolioPost`로 변환합니다.
- `InquiryService`: 견적 문의를 Supabase `inquiries` 테이블에 저장합니다.

추가 예정 서비스 예시:

- `InquiryService`: 견적 문의 저장/전송
- `CaseRepository`: 관리자용 시공사례 조회/저장
- `AssetService`: 시공사진 업로드/경로 관리

## Backend Extension Plan

현재 백엔드가 필요한 지점은 두 곳입니다.

- 네이버 블로그 API 프록시: `vite.config.ts`의 `/api/naver-blog`
- 견적 문의 저장: `src/services/InquiryService.ts`에서 Supabase `inquiries` 테이블에 저장
- 관리자 로그인 및 문의 관리: `src/admin/AdminPage.tsx`와 `supabase/schema.sql`의 `admin_users` / RLS 정책
- 고객 로그인 및 내 문의 관리: `src/account/AccountPage.tsx`와 `supabase/schema.sql`의 사용자 소유 정책

추천 확장 순서:

1. `.env.local`에 네이버 API 키 추가
2. Supabase 프로젝트 생성
3. `supabase/schema.sql` 실행
4. `public.admin_users`에 관리자 Google 이메일 추가
5. Supabase Auth에서 Google provider 활성화
6. `ADMIN_EMAIL`, `RESEND_API_KEY`를 Vercel 환경변수에 설정
7. GitHub Actions 스케줄이 5분 간격으로 `/api/notify-inquiries`를 호출합니다
7. 관리자 페이지에서 시공사례/고정 블로그 글 관리
8. Capacitor로 APK 패키징

## Environment Variables

네이버 블로그 자동 연동에는 다음 값이 필요합니다.

```text
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_BLOG_ID=it77khy
GEMINI_API_KEY=
GEMINI_BLOG_SUMMARY_MODEL=gemini-2.5-flash-lite
VITE_NAVER_MAP_CLIENT_ID=
VITE_NAVER_MAP_LAT=
VITE_NAVER_MAP_LNG=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
ADMIN_EMAIL=
RESEND_API_KEY=
```

`.env.local`에 넣고 dev 서버를 재시작하세요.

카카오톡 채널 URL은 `src/data.ts`의 `business.kakaoUrl`을 실제 채널 주소로 교체하세요. 현재는 placeholder 값이 들어 있습니다.

## Admin Login

관리자 로그인은 Supabase Auth Google OAuth를 사용합니다.

- 로그인 화면: `/admin`
- 접근 권한: `public.admin_users` 테이블에 등록된 이메일만 허용
- RLS 정책: `private.is_admin_user()`가 `auth.jwt()->>'email'`을 확인

Google provider를 켠 뒤, 관리자 이메일을 `public.admin_users`에 추가하세요.
예시:

```sql
insert into public.admin_users (email) values ('admin@example.com');
```

## Customer Login

고객도 Google 로그인으로 자신의 견적 요청 기록을 볼 수 있습니다.

- 로그인 화면: `/account`
- 고객이 로그인 상태에서 남긴 문의는 `user_id`로 본인 계정에 연결됩니다.
- 고객은 자신의 문의를 수정할 수 있습니다.
- 고객 로그인을 쓰려면 Supabase Auth에서 Google provider를 활성화하세요.

## Inquiry Alerts

GitHub Actions가 5분 간격으로 `/api/notify-inquiries`를 호출합니다.
이 기능은 `ADMIN_EMAIL`과 `RESEND_API_KEY`가 있어야 실제 이메일이 전송됩니다.

## PWA And APK Readiness

이 앱은 PWA 기본 구조를 포함합니다.

- `public/manifest.webmanifest`
- `public/service-worker.js`
- `public/icons/`

나중에 Play Store 배포가 필요하면 React 앱은 그대로 두고 Capacitor로 Android 프로젝트를 생성하는 흐름을 권장합니다.
모바일 앱에서도 같은 API를 사용해야 하므로, 브라우저 전용 코드와 서버 API 호출을 섞지 않는 구조를 유지합니다.

## Maintenance Rules

- 새 기능은 먼저 어느 경계에 속하는지 정합니다: UI, data, service, backend, PWA.
- 단순 텍스트/링크 변경은 `data.ts`에서 끝나야 합니다.
- API 응답 구조가 바뀌면 서비스 클래스에서 흡수하고 UI 타입은 유지합니다.
- 섹션 컴포넌트가 커지면 별도 파일로 분리하되, 한 번만 쓰는 작은 JSX는 과하게 분리하지 않습니다.
- 변경 후 최소 `npm run build`를 실행합니다.
