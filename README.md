# 집수리클라쓰

> 서울·경기 종합 집수리 상담 웹앱 — 사진 기반 견적 상담, 지역·서비스별 SEO 랜딩, 관리자 대시보드

[![Vercel](https://img.shields.io/badge/Vercel-배포중-black?logo=vercel)](https://www.jipsuriclass.kr)
[![Astro](https://img.shields.io/badge/Astro-6-FF5D01?logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-인증·DB-3ECF8E?logo=supabase)](https://supabase.com)

**라이브 사이트:** [www.jipsuriclass.kr](https://www.jipsuriclass.kr)

---

## 개요

집수리클라쓰는 서울·경기 지역 집수리 업체를 위한 풀스택 비즈니스 웹앱입니다. 단순 소개 페이지가 아니라, 고객의 상담 진입부터 관리자 견적 발행·콘텐츠 운영까지 한 흐름으로 이어지도록 구성되어 있습니다.

- **고객 흐름** — 홈 → 증상 자가진단 → 서비스·지역 랜딩 → 가격표·모의견적 → 8단계 견적상담 신청
- **관리자 흐름** — 상담 요청 수신 → 상태·메모 관리 → 상담 기반 견적서 발행 → 공개 페이지 콘텐츠 편집
- **SEO** — 16개 지역·15개 서비스 랜딩 + 12개 가격표를 Astro로 빌드 타임 정적 생성(본문 + JSON-LD), 어드민·견적기 등 인터랙티브 화면만 React 아일랜드
- **운영 철학** — 고객이 전문 용어를 몰라도 사진·증상·공간 기준으로 문의할 수 있게 하고, 관리자는 코드 수정 없이 문구와 랜딩 콘텐츠를 Supabase에서 관리합니다.

### 핵심 사용자

| 사용자 | 주요 목표 | 대표 화면 |
|--------|-----------|-----------|
| 신규 고객 | 증상 확인, 작업 가능 여부 파악, 상담 신청 | 홈, 자가진단, 서비스/지역 랜딩, 견적상담 |
| 가격 탐색 고객 | 작업 항목별 기준가 확인, 모의 견적 계산 | 서비스별 가격표, 모의견적 계산기 |
| 관리자 | 문의 확인, 고객 상태 관리, 견적 발행, 콘텐츠 수정 | 관리자 대시보드, 상담 상세, 콘텐츠 편집기 |
| 검색 유입 고객 | 지역·서비스별 상담 가능 여부 확인 | /area/*, /service/*, /service/*/pricing |

### 최근 품질 기준

- 저장된 테마 선택이 없으면 **라이트 모드가 기본값**입니다. OS가 다크모드여도 첫 방문은 라이트로 시작합니다.
- 다크모드는 사용자가 토글로 명시 선택한 경우에만 적용되며, 견적상담 폼의 입력창·선택지·요약 카드가 모두 대비 기준을 갖도록 회귀 테스트가 있습니다.
- 블로그 API가 느리거나 키워드 매칭 결과가 없으면 빈 섹션 대신 대표 사례 폴백을 보여줍니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Astro 6 (아일랜드) + React 19, TypeScript 6 |
| 스타일 | CSS Custom Properties (토큰 기반 디자인 시스템, `data-theme` 다크모드 토글) |
| 백엔드 API | Vercel Functions (`api/*.ts`, Node.js) |
| 인증·데이터 | Supabase Auth + PostgreSQL + RLS |
| 분석 | Vercel Web Analytics + Speed Insights (익명·쿠키리스) |
| 배포 | Vercel (빌드: `astro build`, @astrojs/vercel 어댑터) |
| 블로그 연동 | 네이버 블로그 API + Gemini AI 요약 |
| 이메일 알림 | Resend API |
| 지도 | 네이버 지도 Embed |

---

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드 + SEO 패치
npm run build

# 빌드 미리보기
npm run preview
```

### 검증 명령

| 목적 | 명령 | 설명 |
|------|------|------|
| 전체 프로덕션 빌드 | `npm run build` | Astro 정적 페이지, Vercel 함수 번들, 타입 생성을 함께 확인합니다. |
| 블로그 연동 회귀 테스트 | `npm run test:blog` | 서비스 랜딩의 네이버 블로그 API와 카드 렌더링을 Playwright로 확인합니다. |
| 견적상담 테마 회귀 테스트 | `npx playwright test tests/estimate-theme.spec.ts` | 기본 라이트 모드와 다크모드 견적 폼 대비를 확인합니다. |
| 정적 산출물 스모크 | `node scripts/smoke.mjs` | 빌드 산출물의 주요 HTML/SEO/PWA 조건을 빠르게 확인합니다. |

### 환경 변수

`.env.local` 파일을 루트에 생성하세요.

```env
# 네이버 API (블로그·지도)
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_BLOG_ID=it77khy

# Gemini AI (블로그 카드 요약 — 없으면 기본 네이버 내용 사용)
GEMINI_API_KEY=
GEMINI_BLOG_SUMMARY_MODEL=gemini-2.5-flash-lite

# 네이버 지도 (없으면 정적 Embed로 폴백)
VITE_NAVER_MAP_CLIENT_ID=
VITE_NAVER_MAP_LAT=
VITE_NAVER_MAP_LNG=

# Supabase (필수 — 견적 저장·관리자·고객 로그인)
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# 이메일 알림 (선택)
ADMIN_EMAIL=
RESEND_API_KEY=

# 텔레그램 알림 (선택)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# 블로그 스냅샷 자동 동기화 cron (선택 — /api/sync-blog-snapshot 보호)
SUPABASE_SERVICE_ROLE_KEY=
BLOG_SYNC_SECRET=
```

> 블로그 스냅샷 cron: **오라클 클라우드 서버의 crontab**이 `scripts/sync-blog-snapshot.sh`로 매일 `/api/sync-blog-snapshot`을 호출합니다(Vercel/GitHub Actions cron 미사용). 서버에 `BLOG_SYNC_SECRET`(엔드포인트 값과 동일)만 있으면 되고, 엔드포인트는 Vercel에 설정된 `SUPABASE_SERVICE_ROLE_KEY`로 RLS를 우회해 스냅샷을 저장합니다. 설치 방법은 스크립트 상단 주석 참고. 관리자 ‘블로그 연동 → 스냅샷 동기화’ 버튼으로 수동 동기화도 가능합니다.
>
> ```bash
> # 오라클 서버 crontab 예시 (매일 03:00 KST)
> 0 3 * * * set -a; . /etc/jipsuri-blog-sync.env; set +a; /path/to/jipsuriclass/scripts/sync-blog-snapshot.sh >> /var/log/jipsuri-blog-sync.log 2>&1
> ```

---

## 프로젝트 구조

```
jipsuriclass/
├── src/
│   ├── pages/                     # Astro 라우트
│   │   ├── [...all].astro         # 미이전 경로 → 기존 SPA(<App client:only>) SSR 마운트
│   │   ├── privacy.astro          # 정적
│   │   ├── service/[slug].astro          # 서비스 랜딩 15p (정적 + JSON-LD)
│   │   ├── service/[slug]/pricing.astro  # 가격표 12p (정적)
│   │   └── area/[slug].astro             # 지역 랜딩 16p (정적)
│   ├── layouts/BaseLayout.astro   # 문서 셸: head·폰트·파비콘·SW·애널리틱스
│   ├── components/seo/Seo.astro   # per-page meta + JSON-LD (빌드 타임)
│   ├── components/site/           # SiteHeaderIsland.tsx · SiteFooter.tsx (공유 chrome)
│   ├── components/landing/        # LandingSections.tsx(정적) · LandingInteractive.tsx(아일랜드)
│   ├── App.tsx                    # SPA: 홈·진단·견적·포트폴리오 (catch-all이 마운트)
│   ├── data.ts                    # 운영 정보, 서비스, 사례, 고정 블로그 글
│   ├── types.ts                   # 공통 타입 정의
│   ├── styles.css                 # 전역 디자인 토큰 + 다크모드
│   ├── auth-panel.css             # 로그인·마이페이지 스타일
│   ├── lib/                       # supabaseClient.ts · analytics.ts · theme.ts · useTheme.ts · koreanParticle.ts
│   ├── landingPages.ts            # 서비스·지역 랜딩 정의 (31개: 서비스 15 + 지역 16)
│   ├── admin/                     # 어드민 대시보드 (해시 탭, React 아일랜드)
│   │   ├── AdminPage.tsx          # 셸: 상단바·사이드바·해시탭·미리보기 모달
│   │   ├── InquiriesTab.tsx       # 상담 목록·상세·상태·메모·견적
│   │   ├── DashboardPanels.tsx    # 분석·지역·작업·콘텐츠·블로그·설정·이력 탭
│   │   ├── SiteContentEditor.tsx  # 핵심 페이지 편집(홈·랜딩·계정·견적상담·자기진단·개인정보)
│   │   ├── HomepageEditor.tsx     # 홈 섹션별 편집
│   │   ├── LandingPagesEditor.tsx # 랜딩 페이지 편집
│   │   ├── InquiryQuoteEditor.tsx # 견적 에디터
│   │   ├── AdminLoginPage.tsx     # 관리자 로그인
│   │   └── admin.css              # .adm-root 스코프 스타일 (다크모드 포함)
│   ├── account/
│   │   └── AccountPage.tsx        # 고객 마이페이지
│   ├── login/
│   │   └── LoginPage.tsx          # 고객 로그인
│   ├── estimate/
│   │   └── EstimatePage.tsx       # 8단계 견적 상담 폼
│   ├── diagnosis/
│   │   └── DiagnosisPage.tsx      # 증상별 자가진단
│   ├── pricing/
│   │   ├── registry.ts            # 서비스별 가격표 레지스트리
│   │   └── ServicePricingPage.tsx # 가격표 + 모의견적 계산기
│   ├── services/
│   │   ├── BlogPortfolioService.ts # 네이버 블로그 API 정제·폴백
│   │   ├── SiteContentService.ts   # Supabase 콘텐츠 CRUD
│   │   ├── InquiryService.ts       # 견적 문의 저장
│   │   ├── AdminService.ts         # 관리자 전용 API
│   │   ├── AuthService.ts          # Supabase Auth 래퍼
│   │   ├── QuoteService.ts         # 견적 PDF·Excel 생성
│   │   └── MediaService.ts         # 파일 업로드
│   └── components/
│       ├── EmailPasswordAuthPanel.tsx # 이메일·Google 로그인 폼
│       ├── NaverMapEmbed.tsx          # 네이버 지도 Embed
│       └── OfficeSection.tsx          # 사무실 정보·지도 섹션
├── api/
│   ├── naver-blog.ts              # 블로그 포트폴리오 서버리스 API
│   ├── inquiries.ts               # 문의 저장 + 이메일 발송
│   ├── notify-inquiries.ts        # 미발송 문의 알림 API
│   ├── blog-image.ts              # 블로그 이미지 프록시
│   └── naver-geocode.ts           # 주소 → 좌표 변환
├── public/                        # (service/·area/ 랜딩은 Astro가 빌드 타임 생성 — 스냅샷 미커밋)
│   ├── assets/                    # 시공사진 이미지
│   ├── icons/                     # 파비콘 (icon.png + 다크모드 icon-dark.svg)
│   ├── manifest.webmanifest       # PWA 설치 정보
│   └── service-worker.js          # 앱 셸 캐시
├── astro.config.mjs               # Astro + @astrojs/react + @astrojs/vercel
├── scripts/
│   ├── patch-static-html.mjs      # 레거시 Vite 빌드 전용 SEO 패치(build:vite)
│   ├── smoke.mjs                  # 빌드 산출물 스모크 검증
│   ├── regenerate-snapshots.mjs   # 정적 스냅샷 재생성 보조
│   └── sync-blog-snapshot.sh      # 외부 cron용 블로그 스냅샷 동기화
├── vercel.json                    # 라우팅·캐시·리다이렉트 설정
└── supabase/
    └── schema.sql                 # DB 스키마·RLS 정책
```

---

## 주요 기능

### 고객 향

| 기능 | 경로 |
|------|------|
| 홈 (히어로·증상·서비스·블로그) | `/` |
| 증상별 자가진단 | `/diagnosis` |
| 8단계 견적 상담 신청 | `/estimate` |
| 서비스 랜딩 (15종) | `/service/{slug}` |
| 지역 랜딩 (16개) | `/area/{slug}` |
| 서비스별 가격표 + 모의견적 | `/service/{slug}/pricing` |
| 고객 로그인·마이페이지 | `/login`, `/mypage` |
| 개인정보처리방침 | `/privacy` |

### 관리자 향

| 기능 | 경로(해시 탭) |
|------|------|
| 관리자 로그인 | `/admin/login` |
| 상담 요청 목록·상태·메모·견적 발행 | `/admin#inquiries` |
| 유입·전환 분석 | `/admin#analytics` |
| 지역·서비스 랜딩 편집 (카드 → 해당 페이지로 바로 열림) | `/admin#regions`, `/admin#works` |
| 핵심 페이지 편집 (홈·견적상담·마이페이지·자기진단·개인정보처리방침) | `/admin#content` |
| 블로그 연동 (네이버 글 자동 수집·썸네일 프록시) | `/admin#blog` |
| 사이트 설정 — 영업 정보·대표 자격증 편집(저장 시 전역 반영, 자격증은 현재 공개 홈 오시는 길에는 노출하지 않음) | `/admin#settings` |
| 편집 이력 — 변경 항목 표시 + 과거 시점으로 되돌리기(롤백) | `/admin#audit` |

> 콘텐츠·설정 편집 내용은 Supabase `site_content`에 저장되어 공개 사이트에 즉시 반영됩니다(코드 수정 불필요). 견적 에디터는 항목·자재·부대비용을 편집해 구글시트 발행(최초 1회 생성 후 같은 시트 갱신)·PDF·엑셀로 내보냅니다.

---

## 배포

### Vercel 설정

`vercel.json`에 빌드·라우팅·캐시 설정이 모두 커밋되어 있습니다.

```
Build Command : astro build   (npm run build)
Output        : @astrojs/vercel 어댑터 (.vercel/output, Build Output API)
Framework     : Astro 6 (아일랜드)
```

**렌더링 모델**
- `/service/*`, `/area/*`, `/service/*/pricing`, `/privacy` → 빌드 타임 정적 HTML(+JSON-LD), JS≈0
- `/`, `/diagnosis`, `/estimate`, `/admin`, `/login`, `/mypage`, `/portfolio` → `src/pages/[...all].astro` 온디맨드 SSR catch-all이 기존 React SPA(`<App client:only>`)를 그대로 마운트
- `/icons/*` → `max-age=31536000, immutable`; 인증/동적 경로(`/admin` 등)는 `no-cache`; `/_astro/*`는 어댑터가 immutable 처리

### Vercel 환경 변수

Vercel 대시보드 → Project Settings → Environment Variables에 `.env.local`과 동일한 값을 추가하세요.

### 도메인 DNS

`jipsuriclass.kr`을 Vercel 도메인으로 추가한 후 DNS를 설정하세요.

```
A      @      76.76.21.21
CNAME  www    cname.vercel-dns.com
```

### 빌드 파이프라인

```
npm run build  →  astro build
  ├── src/pages/**/*.astro 를 정적 HTML로 prerender
  │     (랜딩·가격표·privacy: 본문 + JSON-LD를 빌드 타임 생성, 콘텐츠는
  │      SiteContentService로 Supabase override를 빌드 타임에 반영)
  ├── 인터랙티브 부분만 React 아일랜드로 번들 (client:idle/visible/only)
  └── @astrojs/vercel 어댑터가 .vercel/output 으로 출력
        (정적 파일 + [...all] catch-all 함수 + /api/* 서버리스 함수)
```

> 레거시 Vite 빌드는 `npm run build:vite`(tsc + vite + patch-static-html.mjs)로
> 남겨둠 — Astro cutover가 안정화되면 제거 예정(patch-static-html, 루트 index.html,
> App.tsx 라우팅 분기).

---

## Supabase 설정

1. Supabase 프로젝트 생성
2. `supabase/schema.sql` 실행
3. Authentication → Providers에서 **Google** 활성화
4. `public.admin_users`에 관리자 이메일 추가

```sql
insert into public.admin_users (email) values ('admin@jipsuriclass.kr');
```

### 테이블 구조

| 테이블 | 용도 |
|--------|------|
| `inquiries` | 견적 문의 저장 (고객 정보·설문·첨부·상태·견적 스냅샷) |
| `admin_users` | 관리자 이메일 허용 목록 |
| `site_content` | 관리자 편집 콘텐츠 (홈·랜딩·견적상담·계정·자기진단·개인정보처리방침·사이트설정·블로그스냅샷) |
| `content_audit` | 콘텐츠 편집 이력 (누가·언제·어느 영역·변경 항목, `payload` 스냅샷으로 **되돌리기** 지원) |

> `site_content`는 RLS로 허용 id를 제한합니다. 새 편집 영역을 추가하면 `supabase/migrations/`의 정책 갱신 SQL을 Supabase SQL Editor에서 1회 실행해야 저장이 됩니다(예: 자기진단·개인정보·사이트설정 id 추가 마이그레이션).

---

## 자주 바꾸는 항목

> 영업 정보·자격증, 핵심 페이지·랜딩 문구는 **관리자에서 직접 편집·저장**할 수 있습니다(아래 `src/*`는 기본값/코드 폴백 기준).

| 항목 | 편집 위치 |
|------|------|
| 전화번호·카카오·사업자·운영시간·자격증 | 관리자 `#settings` (기본값: `src/data.ts` → `business` / `defaultCertifications`; 자격증은 내부 설정값으로 유지) |
| 홈·견적상담·마이페이지·자기진단·개인정보 문구 | 관리자 `#content` (기본값: `src/data.ts`, `src/services/SiteContentService.ts`) |
| 지역·서비스 랜딩 내용 | 관리자 `#regions`·`#works` (기본값: `src/landingPages.ts`) |
| 서비스 카드·대표 현장사례·고정 블로그 | `src/data.ts` → `services`·`cases`·`pinnedPosts` |
| 가격표 항목·단가 | `src/pricing/*.ts` |
| 디자인 토큰 (색상·여백·폰트) | `src/styles.css` `:root` |
| PWA 이름·테마색 | `public/manifest.webmanifest` |

---

## 운영 흐름 상세

### 견적상담 퍼널

1. 고객은 홈 CTA, 자가진단, 서비스/가격표 페이지에서 `/estimate`로 진입합니다.
2. 인트로 화면에서 상담 목적을 확인한 뒤 8단계 설문으로 들어갑니다.
3. 설문은 공간 종류, 평수, 집 상태, 상담 이유, 상담 공간, 예산, 시공 희망 시점, 연락처/주소/사진을 순서대로 받습니다.
4. 작성 중인 비개인정보 답변은 `localStorage`에 임시 저장됩니다. 이름·전화번호·동의값은 저장하지 않습니다.
5. 제출 시 `InquiryService`가 Supabase `inquiries`에 저장하고, 첨부 파일은 `MediaService`를 통해 업로드됩니다.
6. 모의견적에서 넘어온 작업 항목이 있으면 `QuoteService`가 상담 데이터 안에 견적 초안을 함께 저장합니다.

### 블로그·포트폴리오 흐름

- 홈 블로그 섹션은 네이버 블로그 최신 글을 우선 사용합니다.
- 지역·서비스 랜딩은 키워드와 카테고리 번호로 후보를 넓게 수집한 뒤 관련 글만 랭킹합니다.
- 네이버 모바일 API 응답은 숫자/문자열 `logNo`, `title/subject`, `briefContents/summary`, JSON 접두사 등을 모두 정규화합니다.
- 이미지 보강은 항목별 타임아웃을 두어 느린 글 하나가 전체 렌더링을 막지 않게 합니다.
- 매칭 결과가 없으면 공개 화면에는 대표 사례 폴백을 보여주고, 운영자는 관리자 블로그 탭에서 스냅샷 동기화를 수동 실행할 수 있습니다.

### 테마 정책

- 테마 상태는 `<html data-theme="light|dark">`에 저장됩니다.
- `jsc-theme` localStorage 값이 `dark`일 때만 다크모드가 적용됩니다. 값이 없거나 손상되면 라이트 모드로 시작합니다.
- 첫 페인트 깜빡임을 줄이기 위해 `src/layouts/BaseLayout.astro`와 루트 `index.html`에 같은 초기화 스크립트를 둡니다.
- 다크모드 CSS는 `src/styles.css`의 `:root[data-theme="dark"]` 블록에 모아두며, 관리자 전용 보정은 `src/admin/admin.css`가 담당합니다.

## 디자인 시스템

### 주요 토큰

```css
/* 색상 */
--navy-900: #0b1a30   /* 주 텍스트·액션 */
--gold-500: #d7ae6b   /* 강조·브랜드 골드 */
--cream:    #faf7f2   /* 배경 크림 */
--paper:    #ffffff   /* 카드 배경 */

/* 타이포그래피 */
--f-display: "Inter", "Noto Sans KR"  /* 제목 */
--f-sans:    "Noto Sans KR", "Inter"  /* 본문 */
--f-mono:    "JetBrains Mono"         /* 코드·수치 */
```

### CSS 파일 역할

| 파일 | 범위 |
|------|------|
| `styles.css` | 전역 토큰·공개 사이트 전체(편집기 공용 스타일 포함) |
| `src/admin/admin.css` | 관리자 대시보드 전용(`.adm-root` 스코프, 다크모드 오버라이드 포함) |
| `auth-panel.css` | 로그인·마이페이지 공통 auth 레이아웃 |

### UI 유지보수 규칙

- 사용자 편집 가능한 문구와 영업 정보는 우선 `src/data.ts` 또는 Supabase `site_content` 기본값에서 관리합니다.
- 외부 API 응답 파싱은 UI 컴포넌트 안에 두지 않고 `src/services/`에서 정규화합니다.
- 공개 페이지 섹션 구성은 `src/App.tsx`, 정적 랜딩은 `src/landingPages.ts`와 Astro 페이지에서 관리합니다.
- 카드형 UI는 8px 내외의 작은 radius를 기본으로 하고, 중첩 카드보다 섹션/패널 단위 배치를 우선합니다.
- 테마 변경 시 `tests/estimate-theme.spec.ts`처럼 실제 화면의 계산된 색상과 기본 테마를 함께 검증합니다.

---

## 배포 후 확인

### 라이브 반영 확인

배포 후에는 최소한 아래를 확인합니다.

```bash
curl -I -L https://www.jipsuriclass.kr/estimate
curl -L -s https://www.jipsuriclass.kr/estimate | grep -E "라이트 모드|data-theme|jsc-theme"
```

확인 포인트:

- HTTP 200 응답
- `server: Vercel` 응답 헤더
- 테마 초기화 스크립트가 저장값 없을 때 `light`를 쓰는지
- `/_astro/*` CSS/JS 파일명이 새 빌드 해시로 바뀌었는지

### 운영 체크리스트

- 견적상담: 라이트 기본값, 수동 다크모드 폼 대비, 사진 첨부 버튼, 개인정보 동의 체크
- 홈: 히어로 CTA 순서, 모바일 CTA 중복 여부, 블로그 폴백 표시
- 랜딩: 대표 서비스/지역 페이지 1개씩 열어 JSON-LD와 본문 표시 확인
- 관리자: 상담 목록, 콘텐츠 저장, 사이트 설정 저장, 블로그 스냅샷 동기화
- 알림: Resend/Telegram 환경 변수가 있는 배포 환경에서 문의 저장 후 알림 수신 확인

---

## 라이선스

비공개 프로젝트 — 집수리클라쓰 전용
