# Work Log

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
