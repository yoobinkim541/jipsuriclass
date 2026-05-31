# 집수리클라쓰

> 서울·경기 종합 집수리 상담 웹앱 — 사진 기반 견적 상담, 지역·서비스별 SEO 랜딩, 관리자 대시보드

[![Vercel](https://img.shields.io/badge/Vercel-배포중-black?logo=vercel)](https://www.jipsuriclass.kr)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-인증·DB-3ECF8E?logo=supabase)](https://supabase.com)

**라이브 사이트:** [www.jipsuriclass.kr](https://www.jipsuriclass.kr)

---

## 개요

집수리클라쓰는 서울·경기 지역 집수리 업체를 위한 풀스택 비즈니스 웹앱입니다.

- **고객 흐름** — 홈 → 증상 자가진단 → 서비스·지역 랜딩 → 견적상담 신청
- **관리자 흐름** — 상담 요청 수신 → 상태 관리·견적 발행 → 페이지 콘텐츠 편집
- **SEO** — 15개 지역·13개 서비스 랜딩 페이지 + 사전 렌더링(SSG) + OG 태그 자동 패치

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, TypeScript 6, Vite 8 |
| 스타일 | CSS Custom Properties (토큰 기반 디자인 시스템) |
| 백엔드 API | Vercel Functions (Node.js) |
| 인증·데이터 | Supabase Auth + PostgreSQL + RLS |
| 배포 | Vercel (빌드: `npm run build`, 출력: `dist/`) |
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
```

---

## 프로젝트 구조

```
jipsuriclass/
├── src/
│   ├── App.tsx                    # 전체 라우팅 + 홈페이지 섹션 조립
│   ├── data.ts                    # 운영 정보, 서비스, 사례, 고정 블로그 글
│   ├── types.ts                   # 공통 타입 정의
│   ├── styles.css                 # 전역 디자인 토큰 + 반응형 스타일
│   ├── admin-panel.css            # 관리자 대시보드 전용 스타일
│   ├── auth-panel.css             # 로그인·마이페이지 공통 스타일
│   ├── landingPages.ts            # 서비스·지역 랜딩 페이지 정의 (28개)
│   ├── admin/
│   │   ├── AdminShell.tsx         # 관리자 레이아웃 (사이드바·상단바)
│   │   ├── AdminLoginPage.tsx     # 관리자 로그인 페이지
│   │   ├── AdminInquiriesPage.tsx # 상담 요청 목록·상세·상태 관리
│   │   ├── AdminAnalyticsPage.tsx # 유입·전환 분석
│   │   ├── AdminEditorPage.tsx    # 페이지 콘텐츠 편집
│   │   ├── SiteContentEditor.tsx  # 홈·견적·계정 페이지 편집
│   │   ├── HomepageEditor.tsx     # 홈 섹션별 편집
│   │   ├── LandingPagesEditor.tsx # 랜딩 페이지 편집
│   │   └── InquiryQuoteEditor.tsx # 견적 에디터
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
├── public/
│   ├── service/                   # 서비스별 사전 렌더링 HTML (SEO)
│   ├── area/                      # 지역별 사전 렌더링 HTML (SEO)
│   ├── assets/                    # 시공사진 이미지
│   ├── manifest.webmanifest       # PWA 설치 정보
│   └── service-worker.js          # 앱 셸 캐시
├── scripts/
│   └── patch-static-html.mjs     # 빌드 후 OG 태그·제목 자동 패치
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
| 서비스 랜딩 (13종) | `/service/{slug}` |
| 지역 랜딩 (15개) | `/area/{slug}` |
| 서비스별 가격표 + 모의견적 | `/service/{slug}/pricing` |
| 고객 로그인·마이페이지 | `/login`, `/mypage` |
| 개인정보처리방침 | `/privacy` |

### 관리자 향

| 기능 | 경로 |
|------|------|
| 관리자 로그인 | `/admin/login` |
| 상담 요청 목록·상태 관리 | `/admin/inquiries` |
| 유입·전환 분석 | `/admin/analytics` |
| 페이지 콘텐츠 편집 | `/admin/editor` |

---

## 배포

### Vercel 설정

`vercel.json`에 빌드·라우팅·캐시 설정이 모두 커밋되어 있습니다.

```
Build Command : npm run build
Output Dir    : dist
Framework     : Vite
```

**캐시 전략**
- `/assets/*`, `/icons/*` → `max-age=31536000, immutable` (콘텐츠 해시 기반)
- `/`, `/admin/*`, `/service/*` 등 → `no-cache` (항상 최신)

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
npm run build
  ├── tsc -b              # TypeScript 타입 검사
  ├── vite build          # JS·CSS 번들 (코드 스플리팅 적용)
  └── node scripts/patch-static-html.mjs
        # public/ HTML 파일의 <title>, og:title, og:description,
        # twitter:title, twitter:description을 landingPages.ts 값으로 자동 교체
```

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
| `inquiries` | 견적 문의 저장 (고객 정보·설문·첨부·상태) |
| `admin_users` | 관리자 이메일 허용 목록 |
| `site_content` | 관리자 편집 콘텐츠 (홈·랜딩·견적·계정 문구) |

---

## 자주 바꾸는 항목

| 항목 | 파일 |
|------|------|
| 전화번호·카카오·사업자·운영시간 | `src/data.ts` → `business` |
| 서비스 카드 | `src/data.ts` → `services` |
| 대표 현장사례 | `src/data.ts` → `cases` |
| 고정 블로그 포스트 | `src/data.ts` → `pinnedPosts` |
| 지역·서비스 랜딩 내용 | `src/landingPages.ts` |
| 가격표 항목·단가 | `src/pricing/*.ts` |
| 디자인 토큰 (색상·여백·폰트) | `src/styles.css` `:root` |
| PWA 이름·테마색 | `public/manifest.webmanifest` |

---

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
| `styles.css` | 전역 토큰·공개 사이트 전체 |
| `admin-panel.css` | 관리자 대시보드 전용 레이아웃·컴포넌트 |
| `auth-panel.css` | 로그인·마이페이지 공통 auth 레이아웃 |

---

## 라이선스

비공개 프로젝트 — 집수리클라쓰 전용
