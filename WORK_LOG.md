# Work Log

## 2026-05-25 - 방수·타일 가격표 통합

Changed files: `src/App.tsx`, `src/waterproofingTilePriceData.ts`, `src/landingPages.ts`, `src/styles.css`, `public/sitemap.xml`

Implemented behavior:
- Added a new integrated `/service/waterproofing-tile/price` page that combines 방수 and 타일 pricing into one calculator flow.
- Kept the existing table pattern from the electric pricing page, with all material/product costs shown as `별도`.
- Added landing-page quick links for 방수·타일 that deep-link into the price page with preselected estimate items.
- Updated the waterproofing·tile landing page to point to the new integrated price page.
- Added the new route to the sitemap and kept the old service-specific price pages available.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the old `/service/waterproofing/price` and `/service/tile/price` URLs retired later, they can be redirected in a separate cleanup pass.

# 2026-05-25 - 방수·타일 가격표 페이지 추가

Changed files:
- `src/App.tsx`
- `src/waterproofingTilePriceData.ts`
- `public/sitemap.xml`
- `WORK_LOG.md`

Implemented behavior:
- 방수, 타일, 방수·타일 서비스에 각각 가격표 페이지를 연결했습니다.
- 가격표는 전기 페이지와 같은 표/체크박스/모의견적 계산기 형식을 유지했습니다.
- 제품, 부속자재는 별도 표시로 처리하고, 출장비와 시공비 중심으로만 항목을 노출했습니다.
- 랜딩 페이지 상단 버튼에서 각 서비스 가격표로 바로 이동할 수 있게 했습니다.
- `/service/waterproofing/price`, `/service/tile/price`, `/service/waterproofing-tile/price` 를 sitemap에 추가했습니다.

Verification:
- `npm run build` passed.
- `Invoke-WebRequest`로 `/service/waterproofing/price`, `/service/tile/price`, `/service/waterproofing` 200 응답 확인.
- Playwright 브라우저 자동화는 임시 디렉터리 권한 문제로 실행하지 못했습니다.

Follow-up:
- 실제 브라우저에서 가격표 표 길이와 모바일 카드 간격을 한 번만 확인하면 됩니다.

## 2026-05-25 - Copy & UX Fix Pass

Changed files: `src/App.tsx`, `src/landingPages.ts`, `src/styles.css`

Implemented behavior:
- **Copy**: `문수리` → `문 수리` across all human-visible labels, descriptions, headings in all service/area pages. Search terms untouched for SEO.
- **Copy**: Fixed broken relatedLink in `/area/bucheon` (label "인천·부천" was pointing to `/area/goyang`; label corrected to "고양·일산").
- **Copy**: `/service/bathroom` FAQ answer rephrased ("대부분은 아닙니다" → "반드시 그렇지는 않습니다").
- **Copy**: `/service/waterproofing-tile` FAQ ("보아야 합니다" → "확인해야 합니다").
- **Copy**: `/area/gyeonggi` duplicate 출동 동선 point replaced with housing type diversity note.
- **Copy**: `/area/seoul` two near-identical FAQ answers differentiated.
- **Copy**: Trust bar label redundancy removed ("국가공인 7 자격" → "국가공인 자격").
- **Copy**: Landing blog section heading now uses `serviceType`/`areaLabel` instead of `searchTerms[0]` to avoid "문수리 사례 & 블로그" inconsistency.
- **CSS HIGH-1**: `.about-visual__tile figcaption span` font-size 15px → 13px (prevents overflow on 164px tiles).
- **CSS HIGH-2**: `.landing-back-btn` mobile: `right: 14px` → `left: 14px` (avoids covering right-side content).
- **CSS HIGH-3**: Added `.contact-estimate-card .primary-button { width: 100% }` at max-width:720px.
- **CSS MED-1**: `process__track` intermediate 2-col layout at min-width:480px (before jumping to 5-col at 768px).
- **CSS MED-2**: Landing page collapse breakpoint: `max-width:900px` → `768px` (consistent with site breakpoints).
- **CSS MED-3**: Hero title mobile: `clamp(72px,19vw,108px)` → `clamp(46px,14vw,76px)` (was too large at 320px).
- **CSS MED-5**: Cases carousel tablet rule added: `min(58vw,520px)` at 720–1279px (peek at next card).

Verification: `npm run build` passed. DOM/computed-style checks via browser JS confirmed trust label, tile caption, door page headings/FAQ, bucheon link, bathroom FAQ.

Follow-up: None.

Use this file as the final stop for each completed task. Keep entries short and practical so future maintenance starts here before searching the codebase.

## 2026-05-22 - Current Implementation Brief

Changed files: existing project state reviewed only.

Implemented behavior:
- React/Vite single page site for "집수리 클라쓰".
- Responsive header, mobile menu, hero CTA, symptoms, services, cases, blog, process, contact, footer, and mobile quick CTA.
- User-editable business profile, services, symptoms, cases, pinned blog posts, and process steps live in `src/data.ts`.
- Naver Blog portfolio loading uses `BlogPortfolioService`, with fallback posts when credentials or API calls fail.
- Local `/api/naver-blog` proxy is implemented in `vite.config.ts`.
- Vercel serverless `/api/naver-blog` endpoint is implemented in `api/naver-blog.ts`.
- Estimate inquiries are submitted through `InquiryService` to Supabase `inquiries`.
- Supabase browser client is isolated in `src/lib/supabaseClient.ts`.
- Initial Supabase schema and insert-only anon RLS policy are in `supabase/schema.sql`.

Verification:
- Code was inspected; no build was run for this documentation-only update.

Follow-up:
- Replace placeholder phone, Kakao URL, business registration number, owner, and address in `src/data.ts`.
- Configure Naver API credentials and Supabase environment variables in deployment.

## 2026-05-22 - Phone Number Update

Changed files:
- `src/data.ts`

Implemented behavior:
- Updated the public phone number and `tel:` link to `010-3323-9677`.

Verification:
- `npm run build` passed.

Follow-up:
- Still need the real Kakao channel URL, business registration number, owner name, address, exact service area, and consultation hours.

## 2026-05-22 - Business Information Update

Changed files:
- `src/data.ts`

Implemented behavior:
- Updated business name to `집수리클라쓰`.
- Updated business registration number to `633-25-01331`.
- Updated owner to `이보미`.
- Updated business address to `경기도 남양주시 화도읍 경춘로 1790-2 106호`.

Verification:
- `npm run build` passed.

Follow-up:
- Still need the real Kakao channel URL, exact service area, consultation hours, Naver API credentials, and Supabase environment variables.

## 2026-05-22 - Introduction And Service Scope Update

Changed files:
- `src/types.ts`
- `src/data.ts`
- `src/App.tsx`
- `src/styles.css`

Implemented behavior:
- Added an `소개` navigation item and about section after the hero.
- Added editable business introduction and strength bullets to `src/data.ts`.
- Updated the introduction copy to position 집수리클라쓰 as a 종합 집수리·설비공사업체.
- Added representative direct participation and 7 국가공인 건축자격 messaging.
- Updated service cards to cover remodeling, 설비, 방수·타일, 목공, 전기, 도배·바닥, 도장·페인트, and 인테리어 필름.

Verification:
- `npm run build` passed.

Follow-up:
- Confirm whether the exact phrase should be `품격 있는` or `품격있는`.
- Still need the real Kakao channel URL, exact service area, consultation hours, Naver API credentials, and Supabase environment variables.

## 2026-05-22 - Business Hours Update

Changed files:
- `src/data.ts`

Implemented behavior:
- Updated consultation hours to `08:00 - 21:00 / 매주 일요일 휴무`.

Verification:
- `npm run build` passed.

Follow-up:
- Still need the real Kakao channel URL, exact service area, Naver API credentials, and Supabase environment variables.

## 2026-05-22 - Specialty Work List Update

Changed files:
- `src/types.ts`
- `src/data.ts`
- `src/App.tsx`
- `src/styles.css`

Implemented behavior:
- Added editable `business.specialties` list for detailed work keywords.
- Added `가능작업` navigation item and section.
- Displayed the provided repair, setup, finishing, and remodeling items as contact-linked chips.

Verification:
- `npm run build` passed.

Follow-up:
- Still need the real Kakao channel URL, exact service area, Naver API credentials, and Supabase environment variables.

## 2026-05-22 - Supabase Publishable Key Check

Changed files:
- None

Implemented behavior:
- Confirmed `.env` already contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Left `.env.example` blank for secrets/config values, as expected.

Verification:
- No build was run because no source or environment file changes were needed.

Follow-up:
- Still need the real Kakao channel URL, exact service area, and Naver API credentials.

## 2026-05-22 - Supabase Inquiries Table Creation

Changed files:
- `WORK_LOG.md`

Implemented behavior:
- Added global Codex MCP server `supabase` for project `xhpldpigkkswmlvqruvl`.
- Created `public.inquiries` table in Supabase.
- Enabled RLS on `public.inquiries`.
- Added anon insert-only policy `Anyone can create website inquiries`.
- Granted `insert` on `public.inquiries` to `anon`.
- Created `inquiries_created_at_idx` index.

Verification:
- Confirmed `public.inquiries` exists as a base table.
- Confirmed RLS is enabled.
- Confirmed the anon insert policy exists.
- Supabase security advisor returned no lints.
- Supabase performance advisor returned only an informational unused-index notice for the newly created `inquiries_created_at_idx`.

Follow-up:
- Test the live website contact form and confirm a row appears in Supabase.
- Still need the real Kakao channel URL, exact service area, and Naver API credentials.

## 2026-05-22 - Supabase Inquiry Insert Verification

Changed files:
- `WORK_LOG.md`

Implemented behavior:
- Verified direct database insert into `public.inquiries`.
- Verified public REST insert using the publishable key and anon insert-only RLS path with `Prefer: return=minimal`.

Verification:
- `npm run build` passed.
- Latest rows include `폼 경로 테스트` and `테스트 문의` with `status = new` and `source = website`.
- A REST insert with `return=representation` failed because select permission is intentionally not granted to `anon`; insert-only behavior works with `return=minimal`, matching the app's no-row-return insert path.

Follow-up:
- Confirm the actual website form in browser after deployment or local browser tooling is available.
- Still need the real Kakao channel URL, exact service area, and Naver API credentials.

## 2026-05-22 - Vercel Environment, Production Deploy, And Live Verification

Changed files:
- `WORK_LOG.md`

Implemented behavior:
- Confirmed Vercel env vars exist for Supabase and Naver Blog integration.
- Created Preview deployment `dpl_2uRd8uPqG54bgyk2vHK1Y2NAWCm2`.
- Created Production deployment `dpl_ADRXq7M5nsNJwSqM6kuBH2bDFWzi`.
- Production deployment was aliased to `https://www.jipsuriclass.kr`.

Verification:
- Production build passed on Vercel.
- `https://www.jipsuriclass.kr` returned HTTP 200.
- `https://www.jipsuriclass.kr/api/naver-blog` returned `source: naver` with live Naver blog items.
- Production inquiry insert path was verified with a `Production 문의 테스트` row in Supabase.
- Recent Vercel logs showed `GET /api/naver-blog` returning 200 and no error log entries in the fetched window.

Follow-up:
- Preview deployments are protected by Vercel Authentication; use production domain for external sharing unless preview protection is disabled or a bypass token is used.
- Browser-level form interaction was not automated in this run, but the same Supabase insert-only path used by the form was verified against production configuration.

## 2026-05-22 - Admin Google Login And Dashboard Scaffold

Changed files:
- `src/App.tsx`
- `src/admin/AdminPage.tsx`
- `src/services/AdminService.ts`
- `src/types.ts`
- `src/styles.css`
- `supabase/schema.sql`
- `vercel.json`
- `README.md`

Implemented behavior:
- Added `/admin` route handling with a dedicated admin dashboard.
- Added Google OAuth sign-in and sign-out flow through Supabase Auth.
- Added admin inquiry listing and status update controls.
- Added `public.admin_users` allowlist table and `private.is_admin_user()` RLS helper.
- Granted authenticated users `select`/`update` on `public.inquiries` while restricting rows to admin allowlist members.
- Added Vercel rewrites so `/admin` resolves to the SPA.

Verification:
- `npm run build` passed.

Follow-up:
- Add the actual Google account email to `public.admin_users`.
- Enable Google provider in Supabase Auth dashboard if it is not already enabled.
- If you want 5-minute alerting next, choose the delivery channel: email, webhook, or Kakao message.

## 2026-05-22 - Inquiry Alerts, Google Login, And Deployment Prep

Changed files:
- `.env.example`
- `.github/workflows/inquiry-alerts.yml`
- `README.md`
- `api/notify-inquiries.ts`
- `vercel.json`

Implemented behavior:
- Added a cron endpoint at `/api/notify-inquiries` that checks the last 5 minutes of new website inquiries and prepares an email digest for the admin inbox.
- Added a GitHub Actions schedule to run every 5 minutes and call the digest endpoint.
- Added `ADMIN_EMAIL` and `RESEND_API_KEY` documentation to the environment setup.
- Stored `ADMIN_EMAIL=yoobinkim06@gmail.com` in Vercel production and development environments.

Verification:
- `npm run build` passed.
- Vercel env vars were updated successfully for `ADMIN_EMAIL`.
- No email provider key is present yet, so the cron endpoint is staged and will return a missing-email-configuration response until `RESEND_API_KEY` is installed.

Follow-up:
- Install or provision a supported email provider key so the cron job can actually send mail.
- Enable Google provider in Supabase Auth if it is not already enabled.
- Add the actual Google account email to `public.admin_users`.

## 2026-05-22 - Login Entry Point Visibility Fix

Changed files:
- `src/App.tsx`
- `src/styles.css`

Implemented behavior:
- Added customer and admin login buttons to the sticky header on desktop.
- Added the same login links to the mobile menu.
- Added login shortcuts near the hero CTA and in the contact section so the entry points are visible before scrolling to the footer.

Verification:
- `npm run build` passed.

Follow-up:
- None for visibility; the next thing to verify is the live deployment reflecting these header links.

## 2026-05-22 - Service Worker Cache Refresh

Changed files:
- `public/service-worker.js`

Implemented behavior:
- Bumped the app shell cache version from `v1` to `v2`.
- Switched navigation requests to a network-first strategy so live updates replace stale cached HTML more reliably.

Verification:
- Pending rebuild and redeploy.

Follow-up:
- Confirm the live site shows the new header login links after the updated service worker ships.

## 2026-05-22 - Admin Homepage Editor

Changed files:
- `src/App.tsx`
- `src/admin/AdminPage.tsx`
- `src/admin/HomepageEditor.tsx`
- `src/services/SiteContentService.ts`
- `src/types.ts`
- `src/styles.css`
- Supabase `public.site_content` and `public.admin_users`

Implemented behavior:
- Added a Supabase-backed homepage content store for the editable landing page sections.
- Added a dedicated admin editor panel for the hero, about, services, cases, process, and contact copy.
- Added image URL fields with live previews for the hero and case cards.
- Kept the homepage on the same public route, but changed it to load and merge editable content from Supabase.
- Seeded `public.site_content` with a homepage row and kept admin-only update access through RLS.

Verification:
- `npm run build` passed.

Follow-up:
- To edit the homepage, log in at `/admin` with the Google account and save from the homepage editor.
- If you want file uploads instead of image URLs, the next step is Supabase Storage.

## 2026-05-22 - Mobile And Tablet Layout Pass

Changed files:
- `src/App.tsx`
- `src/styles.css`

Implemented behavior:
- Converted the hero into a full-screen full-bleed image section with text overlay.
- Added tablet-specific hero width/height tuning so the landing screen does not collapse into the desktop layout.
- Tightened mobile spacing and forced stacked CTA/login button groups for easier tapping.
- Kept the admin/editor layout responsive so it stacks on narrower tablet widths.

Verification:
- `npm run build` passed.

Follow-up:
- Verify the live page on a phone-sized viewport and a tablet-sized viewport after the next deployment.

## 2026-05-22 - Portfolio Cards, Neutral Palette, And Icon Refresh

Changed files:
- `src/App.tsx`
- `src/data.ts`
- `src/services/BlogPortfolioService.ts`
- `api/naver-blog.ts`
- `vite.config.ts`
- `src/types.ts`
- `src/styles.css`
- `index.html`
- `public/icons/icon.svg`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

Implemented behavior:
- Converted the blog portfolio area to photo cards instead of text rows.
- Added Naver blog thumbnail extraction from each post page's `og:image`, with fallback case images when a thumbnail is missing.
- Shifted the site to a cooler neutral palette with Google Fonts `Inter` + `Noto Sans KR`.
- Replaced the web/app SVG icons with a darker, more minimal house-style mark inspired by the existing blog icon.

Verification:
- `npm run build` passed.

Follow-up:
- Check the live site on a browser to confirm the new card thumbnails render for Naver blog posts.

## 2026-05-22 - Admin Split Pages, Autosave, And Inquiry Analytics

Changed files:
- `src/admin/AdminPage.tsx`
- `src/admin/HomepageEditor.tsx`
- `src/styles.css`

Implemented behavior:
- Split the admin experience into `/admin/editor` and `/admin/inquiries`.
- Added automatic save behavior in the homepage editor after edits settle.
- Added inquiry summary cards and a 7-day bar chart on the inquiry page.

Verification:
- `npm run build` passed.

Follow-up:
- Rework the editor into a more direct click-to-edit preview flow if you want the admin page to mirror the public homepage more closely.

## 2026-05-22 - Hero Carousel And Click-To-Edit Admin Preview

Changed files:
- `src/App.tsx`
- `src/admin/HomepageEditor.tsx`
- `src/styles.css`

Implemented behavior:
- Turned the hero into an auto-rotating carousel with manual previous/next controls and dots.
- Rebuilt the admin editor into a live homepage preview on the left and a click-to-edit inspector on the right.
- Kept autosave in place so edits persist after the user pauses typing.

Verification:
- `npm run build` passed.

Follow-up:
- Check the live site to confirm the hero carousel feels smooth on desktop and mobile.

## 2026-05-22 - Icon Redesign From Reference Image

Changed files:
- `public/icons/icon.svg`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

Implemented behavior:
- Rebuilt the web and web app icons from the provided reference image.
- Used a dark circular badge, beige ring, house outline, central circular detail, and crossed tool motif to match the reference more closely.

Verification:
- `npm run build` passed.

Follow-up:
- Push and redeploy if the new icon set should ship immediately.

## 2026-05-22 - Header Brand Mark Icon Update

Changed files:
- `src/App.tsx`
- `src/styles.css`

Implemented behavior:
- Replaced the top-left text brand mark with the new icon asset in the sticky navigation bar.

Verification:
- `npm run build` passed.

Follow-up:
- Commit, push, and redeploy if the header icon should ship immediately.

## 2026-05-22 - Public Site Without Login CTAs

Changed files:
- `src/App.tsx`

Implemented behavior:
- Removed visible customer/admin login CTAs from the public homepage, header menu, mobile menu, hero, contact area, and footer.
- Kept the public site usable without signing in.
- Left direct `/admin` and `/account` routes in place for explicit access when needed.

Verification:
- `npm run build` passed.

Follow-up:
- Push and redeploy if the no-login public experience should ship immediately.
# 2026-05-22
- 변경 파일: `src/App.tsx`, `src/admin/AdminPage.tsx`, `src/admin/HomepageEditor.tsx`, `src/account/AccountPage.tsx`, `src/services/InquiryService.ts`, `src/services/AdminService.ts`, `src/services/MediaService.ts`, `src/services/SiteContentService.ts`, `src/data.ts`, `src/styles.css`, `src/types.ts`, `api/inquiries.ts`, `api/naver-blog.ts`, `vite.config.ts`, `supabase/schema.sql`, `src/privacy/PrivacyPolicyPage.tsx`
- 구현 동작: 간단 견적 문의에 사진 첨부 업로드를 추가하고, 단계형 `견적상담` 페이지를 만들어 집 환경과 공사 유형을 먼저 고른 뒤 연락처, 주소, 상담 가능 시간, 사진, 예산, 세부사항을 입력하게 했습니다. 증상 버튼은 `/estimate`로 바로 연결되며, 대표 현장 사례는 관리자 페이지에서 이미지 업로드와 블로그 링크 편집이 가능해졌고 카드 클릭 시 실제 블로그 글로 이동합니다. 개인정보처리방침 페이지와 푸터 링크, 오시는 길 섹션, 블로그 썸네일 이미지 추출 개선, 상단 카피를 `클라쓰가 다른 종합집수리`로 교체한 내용도 반영했습니다. 설문 대시보드에는 집 환경/공사 유형/예산/상담 가능 시간 분포를 한눈에 보는 카드와 목록을 추가했고, 설문 첫 화면은 생성한 상담 이미지로 교체했으며 이미지 경로는 `src/assets/images.ts` 한 파일에서 관리하도록 정리했습니다.

- 변경 파일: `src/estimate/EstimatePage.tsx`, `src/styles.css`
- 구현 동작: `견적상담` 페이지를 8단계 상담 신청서로 재구성했습니다. 1~6단계는 공간 종류, 평수, 집 상태, 상담 이유, 상담 공간 다중 선택, 예산으로 나누고, 7단계는 시공 희망 시점, 8단계는 이름/휴대폰/주소/상세주소/요청사항/개인정보 동의/사진 첨부로 분리했습니다. 첫 화면은 풀사이즈 히어로와 소개 문구만 보여주고 `진행하기`를 눌러 설문으로 들어가게 했습니다.
- 검증 결과: `npm run build` 통과
- 커밋/배포: `2a2a126`로 커밋 후 GitHub push 완료, Vercel production 재배포 및 `https://www.jipsuriclass.kr` alias 갱신 완료

- 변경 파일: `src/estimate/EstimatePage.tsx`, `src/styles.css`
- 구현 동작: 견적상담 첫 화면을 스크롤 없는 풀뷰 히어로로 바꾸고, 상담 화면은 왼쪽 1/3에 모던 인테리어 이미지 패널, 오른쪽 2/3에 8단계 질문 패널을 두는 구조로 재정리했습니다. 모바일에서는 이미지와 폼을 세로로 쌓고 패딩/버튼/선택칩 크기를 줄여 따로 최적화했습니다. 이미지는 `src/assets/images.ts` 한 파일의 자산 경로를 그대로 사용해 관리합니다.
- 검증 결과: `npm run build` 통과
- 검증 결과: `npm run build` 통과, Supabase `admin_users` RLS 활성화 확인
- 남은 후속 작업: 브라우저 실화면에서 첨부 미리보기, 오시는 길 iframe, 사례 카드 링크 동작 확인 후 GitHub push 및 Vercel 재배포

## 2026-05-22 - Tablet And Naver Maps Optimization

Changed files:
- `src/App.tsx`
- `src/components/OfficeSection.tsx`
- `src/components/NaverMapEmbed.tsx`
- `src/services/NaverMapsService.ts`
- `src/styles.css`
- `.env`
- `.env.example`
- `WORK_LOG.md`

Implemented behavior:
- Broke the office/location area out into its own component so the main app file stays smaller and easier to maintain.
- Replaced the old map iframe with the official NAVER Maps JavaScript API and geocoded the office address into an interactive map with a marker.
- Added mobile-friendly NAVER Map links for place, route search, and navigation, while keeping the public desktop fallback as the existing map URL.
- Tightened responsive behavior for phone and iPad/tablet widths by reducing section padding, card padding, hero typography, and oversized controls.
- Reduced the hero carousel bottom controls to small dots on mobile and hid the large arrow buttons there.
- Removed stray compiled `.js` files from `src/` that were shadowing the TypeScript source and breaking Vite's build.
- Added `VITE_NAVER_MAP_CLIENT_ID` to the local env file and Vercel production environment.

Verification:
- `npm run build` passed.
- `VITE_NAVER_MAP_CLIENT_ID` was added to Vercel production.

Follow-up:
- Confirm the live deployment after redeploying, especially the office map, mobile spacing, and tablet layout.

## 2026-05-23 - Naver Map Geocode Fallback

Changed files:
- `api/naver-geocode.ts`
- `src/components/NaverMapEmbed.tsx`
- `src/services/NaverMapsService.ts`
- `src/styles.css`
- `vite.config.ts`
- `.env`
- `WORK_LOG.md`

Implemented behavior:
- Moved NAVER map geocoding to a server-side `/api/naver-geocode` endpoint so the browser no longer depends on `naver.maps.Service.geocode`.
- Kept the interactive map SDK load for the office section, but added a fallback to the existing Naver map URL if geocoding or SDK rendering fails.
- Replaced the user-facing technical error text with a short fallback message so the page does not expose internal exceptions.

Verification:
- `npm run build` passed.
- Local geocode request returned `403`, so the fallback path is now the safe default instead of a crash.

Follow-up:
- If the server-side geocode permission is fixed later, the interactive map will automatically resume without another code change.

## 2026-05-23 - Hide Map Failure Copy

Changed files:
- `src/components/NaverMapEmbed.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Removed the visible fallback error copy from the office map area.
- Kept the iframe fallback in place so users still have a map path even when the interactive geocode flow fails.
- Left the technical error only in console output for debugging.

Verification:
- `npm run build` passed.

Follow-up:
- If the Naver Maps API permissions are corrected, the dynamic map will continue to recover without UI changes.

## 2026-05-23 - Operational Config Cleanup

Changed files:
- `.env.example`
- `README.md`
- `WORK_LOG.md`

Implemented behavior:
- Documented all runtime environment variables referenced by the app, including optional Gemini blog summaries, interactive Naver map settings, Supabase, and email alert configuration.
- Marked the interactive office map variables as optional and documented the static Naver map fallback.
- Added a note that `src/data.ts` still uses a placeholder Kakao channel URL and should be replaced with the real channel when available.

Verification:
- `npm run build` passed.

Follow-up:
- Replace `business.kakaoUrl` in `src/data.ts` with the real Kakao channel URL when it is available.
- Set the optional map and email variables in Vercel if interactive map and alert delivery are needed.

## 2026-05-23 - Login Screen Redesign

Changed files:
- `src/login/LoginPage.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reworked the customer login page into a wider two-column layout so the screen feels fuller and less empty.
- Added a dark branded explainer panel with login benefits, summary chips, and clearer visual hierarchy.
- Upgraded the auth card styling with larger radii, stronger contrast, softer gradients, and more modern input/button treatment.
- Kept the login logic and redirects unchanged.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the admin login page to match this new visual language, apply the same treatment there next.

## 2026-05-23 - Remove Header Login Button

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Removed the visible 로그인 button from the desktop top navigation bar.
- Kept the mobile menu login entry and dedicated `/login` route intact.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the mobile menu login entry removed too, that can be done separately.

## 2026-05-23 - Sidebar-Only Login Access

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Kept the login entry out of the top navigation on every screen size.
- Made the menu button visible on desktop and mobile so the sidebar can be opened everywhere.
- Kept login access inside the sidebar menu only, so users reach `/login` from that side menu list instead of the top bar.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the sidebar menu itself to become a full slide-over navigation drawer with more emphasis on account actions, that can be a separate pass.

## 2026-05-23 - Estimate Intro Full-Bleed

Changed files:
- `src/estimate/EstimatePage.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Removed the phone number from the top of the estimate intro page.
- Made the estimate intro stage behave like a full-bleed image hero across desktop, tablet, and mobile.
- Moved the intro copy lower on top of the image so the layout feels more cinematic and less centered.
- Flattened the `진행하기` button by removing the heavy raised look.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the survey stage to use the same full-bleed visual treatment next, that can be done separately.

## 2026-05-23 - Blog Thumbnail Quality Upgrade

Changed files:
- `api/naver-blog.ts`
- `api/blog-image.ts`
- `vite.config.ts`
- `WORK_LOG.md`

Implemented behavior:
- Re-ranked blog image candidates so the card prefers wider, higher-quality post images over weaker preview thumbnails.
- Upgraded Naver blog image URLs that use thumbnail-style `type=` parameters to a higher-resolution variant before serving them.
- Applied the same image URL normalization in both dev proxy and production API paths so local preview and deployed behavior match.
- Kept the existing card crop behavior, but made the source image more suitable for the card frame.

Verification:
- `npm run build` passed.

Follow-up:
- If a specific post still ships a weak thumbnail, the next step is to replace that post’s image manually in the fallback portfolio data or admin content editor.

## 2026-05-23 - Estimate Step Spacing Tightening

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reduced the height and padding of the `1/8` step badge.
- Tightened the spacing between the step label, question text, and the overall form card so the first survey step reads more compactly.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the options grid itself compressed further, that can be tuned separately without changing the content flow.

## 2026-05-23 - Contact CTA Split

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Removed the duplicated `견적상담 페이지` button from the quick contact button row.
- Kept quick contact limited to phone and KakaoTalk.
- Reframed the lower card as the dedicated detailed 상담 entry point, with a short helper sentence explaining the split.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the quick contact row to become icon-only chips on mobile, that can be done as a separate polish pass.

## 2026-05-23 - Page Title Brand Fix

Changed files:
- `index.html`
- `WORK_LOG.md`

Implemented behavior:
- Updated the browser page title to `집수리클라쓰 - 클라쓰가 다른 종합집수리`.
- Fixed the brand spelling in the HTML metadata description so it matches the rest of the site.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the same branding tone applied to Open Graph title/description meta tags next, that can be updated separately.

## 2026-05-23 - App Icon Replacement

Changed files:
- `index.html`
- `public/manifest.webmanifest`
- `public/service-worker.js`
- `src/App.tsx`
- `public/icons/icon.png`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `WORK_LOG.md`

Implemented behavior:
- Replaced the old SVG icon references with the new modern icon artwork in PNG form.
- Updated the browser favicon, Apple touch icon, PWA manifest icons, service worker app shell, and header brand mark to use the new icon set.
- Kept the old SVG files in place for now, but they are no longer referenced by the app.

Verification:
- `npm run build` passed.

Follow-up:
- If you want, the remaining unused SVG icon files can be deleted in a cleanup pass after confirming the new PNG icons are shipping correctly.

## 2026-05-23 - SEO Review

Changed files:
- `WORK_LOG.md`

Implemented behavior:
- Reviewed the current site structure for Google search visibility risks.
- Confirmed the app is still a client-rendered Vite SPA with no `robots.txt`, `sitemap.xml`, canonical tags, or Open Graph metadata in place yet.

Verification:
- No build was run because this was a guidance-only review.

Follow-up:
- Add sitemap, robots, canonical, structured data, and stronger service/location content before expecting meaningful organic rankings.

## 2026-05-23 - SEO Technical Setup

Changed files:
- `src/App.tsx`
- `index.html`
- `public/robots.txt`
- `public/sitemap.xml`
- `WORK_LOG.md`

Implemented behavior:
- Added per-path SEO metadata handling in `App` for title, description, canonical URL, Open Graph tags, Twitter tags, robots directives, and JSON-LD.
- Added `HomeAndConstructionBusiness` structured data on the home page.
- Added `WebPage` structured data on `/estimate` and `/privacy`.
- Set private routes like `/admin`, `/account`, `/mypage`, and `/login` to `noindex,nofollow`.
- Added `robots.txt` with the public sitemap and disallowed private routes.
- Added a basic `sitemap.xml` for the public pages.
- Tightened the default `index.html` title and description for search intent clarity.

Verification:
- `npm run build` passed.

Follow-up:
- Add more service/location landing pages next if you want stronger organic ranking coverage beyond the home page.

## 2026-05-23 - Brand And External Channel Consistency

Changed files:
- `src/App.tsx`
- `src/data.ts`
- `src/components/OfficeSection.tsx`
- `public/manifest.webmanifest`
- `index.html`
- `WORK_LOG.md`

Implemented behavior:
- Standardized the public-facing brand title to `집수리클라쓰` in the manifest and HTML metadata.
- Reworded the home-page SEO title so the brand and service intent stay consistent.
- Updated the strength copy to mention search visibility across Naver, Kakao, and Google.
- Added an "외부 채널" block to the location section with direct links to Naver Blog, Naver Map, and KakaoTalk.
- Added a note to keep the Google Business Profile name, phone number, and address aligned with the site.

Verification:
- `npm run build` passed.

Follow-up:
- If you give me the real Google Business Profile URL and Kakao channel URL, I can wire those into the site instead of leaving the Google profile as a text note.

## 2026-05-23 - Service And Area Landing Pages

Changed files:
- `src/App.tsx`
- `src/landingPages.ts`
- `src/styles.css`
- `public/sitemap.xml`
- `vercel.json`
- `WORK_LOG.md`

Implemented behavior:
- Added dedicated landing pages for `누수 수리`, `욕실 수리`, `도배`, and `문수리`.
- Added dedicated landing pages for `남양주`, `구리`, `하남`, `서울`, and `경기`.
- Added a shared SEO-friendly landing-page template with unique descriptions, highlights, FAQs, related links, and structured data.
- Added an internal-link section on the homepage so the new service and area pages are discoverable from the main page.
- Added Vercel rewrites for `/service/*` and `/area/*` so these routes resolve correctly in production.
- Added the new page URLs to `sitemap.xml`.

Verification:
- `npm run build` passed.

Follow-up:
- If you want stronger coverage, the next step is to expand each page with one or two real case photos and more local wording.

## 2026-05-23 - Keyword-Filtered Landing Content

Changed files:
- `src/App.tsx`
- `src/landingPages.ts`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added keyword lists to each service and area landing page definition.
- Loaded Naver blog portfolio posts on each landing page and filtered them by page-specific keywords.
- Displayed filtered results in separate `블로그 레퍼런스` and `포트폴리오` sections.
- Kept the latest Naver posts first when matching terms like `누수`, `남양주`, `구리`, and `하남`.

Verification:
- `npm run build` passed.

Follow-up:
- If you want the results to be even tighter, the next step is to add more keyword-specific Naver post titles and summaries in the source blog data.

## 2026-05-23 - Representative Case Photos

Changed files:
- `src/assets/images.ts`
- `public/assets/cases/bathroom-leak.png`
- `public/assets/cases/kitchen-repair.png`
- `public/assets/cases/wall-repair.png`
- `WORK_LOG.md`

Implemented behavior:
- Generated and inserted new photorealistic case images for bathroom leak repair, kitchen sink drain repair, and wall wallpaper repair.
- Replaced the previous external stock image references with local project assets for the representative case cards.

Verification:
- `npm run build` passed.

Follow-up:
- If you want, the next step is to add short captions or before/after labels so each case image explains itself better on mobile.

## 2026-05-23 - Editable Landing Pages

Changed files:
- `src/App.tsx`
- `src/admin/SiteContentEditor.tsx`
- `src/admin/LandingPagesEditor.tsx`
- `src/landingPages.ts`
- `src/services/SiteContentService.ts`
- `WORK_LOG.md`

Implemented behavior:
- Added a dedicated admin editor tab for service and area landing pages.
- Stored landing-page content in Supabase as a single `landing-pages` payload keyed by route.
- Let the public landing pages load the saved admin overrides on page load and merge them with the default definitions.
- Kept SEO titles and structured data aligned with the edited landing-page content.

Verification:
- `npm run build` passed.

Follow-up:
- If you want, the next pass can add a live preview panel for each landing page in the admin editor so edits are easier to judge visually.

## 2026-05-23 - Diagnosis Q&A Page

Changed files:
- `src/App.tsx`
- `src/data.ts`
- `src/diagnosis/DiagnosisPage.tsx`
- `src/diagnosis/diagnosisData.ts`
- `src/styles.css`
- `public/sitemap.xml`
- `vercel.json`
- `WORK_LOG.md`

Implemented behavior:
- Added a dedicated `/diagnosis` self-check page with clickable symptom cards and an answer panel.
- Added entries for common issues like stiff doors, leaks, wallpaper lifting, tile cracks, mold, and drain trouble.
- Routed homepage symptom chips to the diagnosis page instead of sending them directly to the estimate form.
- Added a `자기진단` item to the main navigation.
- Added FAQ structured data and sitemap/rewrite support for the new route.

Verification:
- `npm run build` passed.

Follow-up:
- If you want this page editable from the admin next, I can wire its questions and answers into the same site content editor model as the other pages.

## 2026-05-23 - Static Open Graph Preview Setup

Changed files:
- `index.html`
- `src/App.tsx`
- `public/og-image.png`
- `WORK_LOG.md`

Implemented behavior:
- Added static Open Graph and Twitter metadata to the HTML shell so KakaoTalk, Instagram, and other link preview crawlers can read the page without waiting for client-side JavaScript.
- Switched the default OG image to a dedicated landscape banner asset stored in `public/og-image.png`.
- Aligned the runtime SEO updater with the same OG image and brand title so SPA navigation and browser shares stay consistent.

Verification:
- `npm run build` passed.

Follow-up:
- If you want route-specific OG previews for `/estimate` or `/privacy` in external crawlers, the next step would be server-rendered HTML or per-route prerendering.

## 2026-05-23 - Estimate Full-Height Fix

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Switched the estimate shell height from `100svh` to `100dvh` so the intro screen fills the visible viewport more reliably on mobile browsers and in-app browsers.

Verification:
- Pending build.

Follow-up:
- If the bottom edge still shows a gap on a specific device, the next step is to tune the intro hero image crop separately from the viewport height unit.

## 2026-05-23 - Estimate Step Header Compression

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Switched the estimate step header from a stacked block to a horizontal row so the `1/8` badge and step label sit tighter together.
- Reduced the vertical spacing above and below the question block so the content anchors closer to the card's top-left corner.
- Kept the mobile layout aligned to the top while preserving scrollable survey content.

Verification:
- Pending build.

Follow-up:
- If you want the step label even smaller or the card content to start higher still, that can be tuned further without changing the form flow.

## 2026-05-23 - Consent Label Spacing Fix

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added spacing inside the consent label so the checkbox text and the privacy policy link no longer read as a single cramped block.
- Kept the existing wording and interaction intact.

Verification:
- Pending build.

Follow-up:
- If the consent area still feels tight on mobile, the next adjustment would be a slightly larger vertical gap inside the consent card.

## 2026-05-23 - Estimate Background Scroll Lock

Changed files:
- `src/estimate/EstimatePage.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Locked the estimate page body in place while the page is open so mobile browsers do not scroll the background behind the survey.
- Kept scrolling limited to the survey card itself, with touch scrolling and overscroll behavior contained inside that card.

Verification:
- Pending build.

Follow-up:
- If a specific mobile browser still leaks background scroll, the next step is to inspect that browser's overscroll behavior and adjust the fixed-body lock further.

## 2026-05-23 - Tablet Header Call Alignment

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Shifted the header call button further to the right only in the tablet breakpoint range so the top bar reads cleaner on medium screens.

Verification:
- Pending build.

Follow-up:
- If you want the phone button even closer to the right edge, the next step is a slightly tighter tablet header padding adjustment.

## 2026-05-23 - Mobile Estimate Home Link Alignment

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Nudged the mobile estimate intro header slightly farther left so the `집수리클라쓰` back/home link sits closer to the screen edge.

Verification:
- Pending build.

Follow-up:
- If you want it even tighter, the left inset can be reduced another few pixels without affecting the desktop layout.

# 2026-05-25 - KakaoTalk Chat Link Update

Changed files:
- `src/data.ts`

Implemented behavior:
- Updated the shared `business.kakaoUrl` so every KakaoTalk button now points to `http://pf.kakao.com/_xmygxmxb/chat`.

Verification:
- `npm run build` passed.

# 2026-05-24 - Remove White Icon Backgrounds

Changed files:
- `public/service-worker.js`
- `public/manifest.webmanifest`

Implemented behavior:
- Switched the app shell cache to the SVG icon set so the service worker no longer serves the older PNG icon assets.
- Changed the manifest icon type to SVG and matched the manifest background color to the site background instead of white.

Verification:
- Pending build.

Follow-up:
- If Safari still shows the old icon, the next step is to clear the installed service worker/cache on that device.

# 2026-05-24 - Icon Rollback to Previous Version

Changed files:
- `public/icons/icon.svg`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`
- `index.html`
- `public/manifest.webmanifest`
- `src/diagnosis/DiagnosisPage.tsx`

Implemented behavior:
- Restored the previous darker house-mark icon artwork in the public icon SVGs.
- Pointed the app header, diagnosis page, document favicon references, and manifest icons back to the restored icon set.

Verification:
- `npm run build` passed.

## 2026-05-23 - Mobile Estimate Intro Full View

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Expanded the mobile estimate intro hero to fill the visible viewport more aggressively so the landing screen does not leave a large blank area below the image.
- Tightened the mobile intro text block and button width so the copy reads as a proper hero rather than a short band at the top.

Verification:
- Pending build.

Follow-up:
- If the device-specific browser chrome still creates a gap, the next refinement is a per-device safe-area adjustment and a slightly smaller header inset.

## 2026-05-26 - Homepage Hero Laptop Image Sizing

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Split the homepage hero card deck sizing into laptop, large desktop, and 4K-class media queries.
- Capped the right hero image deck at 460px on 1100-1599px laptop widths, 520px on 1600-2199px widths, and 720px on 2200px+ 4K-class widths.
- Kept the existing mobile/tablet behavior that hides the right-side hero deck below 1024px.

Verification:
- `npm run build` passed.
- Browser measurement passed at 1440x900, 1920x1080, and 2560x1440; the hero deck measured 460px, 520px, and 720px wide respectively.

Follow-up:
- None.

## 2026-05-23 - Transparent Favicon Refresh

Changed files:
- `public/icons/icon.svg`
- `index.html`
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Replaced the browser tab favicon with a transparent SVG version so the icon no longer carries a visible background box.
- Increased the visual weight of the mark so it reads better at small favicon sizes.
- Switched the header brand mark to the same SVG and removed the rounded image-box styling around it.

Verification:
- Pending build.

Follow-up:
- If the favicon still feels too subtle in a specific browser tab size, the next step is to simplify the mark further for 16px rendering.

## 2026-05-24 - Homepage Design Handoff: Navy/Gold/Cream Redesign

Changed files:
- `src/styles.css`
- `src/App.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Added new design system CSS tokens at top of styles.css: `--navy-700`, `--navy-800`, `--gold-500`, `--cream`, `--cream-2`, `--ink`, `--ink-2`, `--ink-3`, `--ink-4`, `--hair`, `--f-display`, `--f-sans`, `--f-mono`, `--max`.
- Updated `:root` `background` and `color` to use cream/navy scheme.
- Replaced `.site-header` with new `.nav` component: sticky, cream background, scroll progress bar (navy→gold gradient), elevated state with blur.
- Replaced fullbleed carousel hero with two-column grid hero: left column has eyebrow, rotating keyword title (cycles every 2.4s), lede, CTA buttons, proof DL; right column shows case image card deck with 3 stacked/rotated cards and a running chip counter.
- Added `TrustBandSection`: dark navy band with 3 trust metrics (7 국가공인 자격, 31 가능 작업, 13시간 운영시간) in gold numbers.
- Updated `ServicesSection` to bento grid: first card spans 2×2 on desktop with dark navy gradient background.
- Updated `SpecialtiesSection` with category filter buttons (전체/설비·배관/마감/문·창·목공/욕실·주방·리모델링/기타), search input, and multi-select chips that show a CTA link to `/estimate?works=...`.
- Updated `CasesSection` to horizontal scroll rail with case cards showing media, title, problem/solution DL, and blog link.
- Updated `ProcessSection` to clickable step track: each step button highlights as active (dark navy), clicking reveals a detail card below.
- Updated `HomePage()` to: SiteHeader → HeroSection → TrustBandSection → ServicesSection → SpecialtiesSection → CasesSection → ProcessSection → BlogSection → ContactSection → SiteFooter → MobileQuickCta. (Removed AboutSection, SymptomsSection, SearchLandingSection, OfficeSection from homepage — components remain in file.)
- All other page components (LandingPage, AdminPage, EstimatePage, etc.) unchanged.

Verification:
- `npm run build` passed (tsc + vite, no errors, 383 kB JS / 83 kB CSS).

Follow-up:
- Deploy to Vercel to verify visual output in browser.
- Consider replacing placeholder case images with real job-site photos for the hero card deck.

## 2026-05-25 - Waterproofing/Tile Price Pages

Changed files:
- `src/App.tsx`
- `src/waterproofingTilePriceData.ts`
- `src/styles.css`
- `public/sitemap.xml`
- `WORK_LOG.md`

Implemented behavior:
- Added a combined `/service/waterproofing-tile/price` page that reuses the existing price-table pattern and computes a mock estimate from selected labor items.
- Wired the combined landing page CTA and quick estimate chips to the combined price page.
- Marked product and accessory material costs as separate in the pricing data.
- Added the combined landing page and price page URLs to `sitemap.xml`.

Verification:
- `npm run build` passed.
- Browser verification completed with Playwright on desktop and mobile viewports.
- Verified landing-page CTA rendering, price-page rendering, and calculator updates after row selection.

Follow-up:
- None.
