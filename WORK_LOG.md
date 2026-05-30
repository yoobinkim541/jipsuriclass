# Work Log

## 2026-05-30 - Naver Mobile Blog Post List Source

Changed files:
- `src/services/NaverBlogSource.ts`
- `WORK_LOG.md`

Implemented behavior:
- Switched the blog data source to the mobile Naver blog `post-list` API at `m.blog.naver.com` so homepage and landing-page references use the actual latest posts from the blog.
- Kept the older RSS/category scraping path only as a fallback.
- Normalized the mobile blog thumbnails through the existing image proxy and preserved the term-based ranking logic.

Verification:
- `npm run build` passed.
- Local API checks returned the latest mobile blog title for both `mode=latest` and `mode=matching`.
- Browser verification showed the homepage and service landing pages rendering the newest mobile blog titles instead of the old representative fallback posts.

Follow-up:
- None.

## 2026-05-30 - Blog Reference Async Sync Fix

Changed files:
- `src/App.tsx`
- `playwright.config.ts`
- `WORK_LOG.md`

Implemented behavior:
- Removed the service landing-page mounted guard so the blog reference section keeps the fetched latest posts even when the Naver request resolves late.
- Kept the reference section fallback to fetched posts when keyword matching is too strict.
- Moved Playwright to a dedicated dev-server port so tests stop attaching to the existing static preview server.

Verification:
- `npm run build` passed.
- Browser verification on `/service/bathroom` now shows 5 cards in the `블로그 레퍼런스` showcase and 5 in `포트폴리오`.
- Browser verification on `/area/namyangju` still shows 10 blog cards.

Follow-up:
- None.

## 2026-05-30 - Blog Reference Latest-Post Fallback

Changed files:
- `src/App.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Changed the landing-page blog reference section so it keeps the latest fetched posts visible when the client-side keyword matcher produces no results.
- Removed the extra branch that only fell back on API failure, which could leave the section blank even when current blog posts had already been fetched.

Verification:
- `npm run build` passed.
- Browser smoke tests for the service and area landing pages still render blog cards.

Follow-up:
- None.

## 2026-05-30 - Process Image Reassignment

Changed files:
- `src/data.ts`
- `src/services/SiteContentService.ts`

Implemented behavior:
- Reordered the existing process images so the step visuals follow the intended flow more closely.
- Forced homepage process images to use the base image mapping even when stored homepage content exists, so older saved content no longer keeps stale process photos.

Verification:
- `npm run build` passed.
- Verified in Playwright that the process detail panel now uses:
  - 사진 상담 -> `/assets/consult-hero.png`
  - 증상 확인 -> `/assets/cases/bathroom-leak.png`
  - 현장 방문 -> `/assets/cases/wall-repair.png`
  - 견적 안내 -> `/assets/process-completion.png`
  - 시공·확인 -> `/assets/cases/kitchen-repair.png`

Follow-up:
- None.

## 2026-05-30 - Homepage Blog Latest Feed Fix

Changed files:
- `api/naver-blog.ts`
- `WORK_LOG.md`

Implemented behavior:
- Made the `mode=latest` API path return RSS-ranked items directly instead of running the heavier post-page enrichment and summary pass.
- Kept the richer enrichment flow only for matching/search mode so the homepage latest feed can respond faster and avoid serverless failures.

Verification:
- `npm run build` passed.
- Local API check on `http://127.0.0.1:4183/api/naver-blog?mode=latest` returned 6 latest posts with the expected newest title.
- Browser check on `http://127.0.0.1:4183/` showed the homepage blog section rendering as a carousel with 6 cards at mobile, tablet, and desktop widths.

Follow-up:
- Production deployment still needs to pick up this commit, then `https://www.jipsuriclass.kr/api/naver-blog?mode=latest` should stop returning 500 and the homepage blog carousel should repopulate.

## 2026-05-30 - Blog Feed Resilience For Landing Pages

Changed files:
- `api/naver-blog.ts`
- `WORK_LOG.md`

Implemented behavior:
- Removed the brittle enrichment step from the blog API path that was failing the service-page blog reference sections.
- Kept the API on RSS/category candidate ranking only, with a fallback to RSS-only candidates if category fetching fails.
- This makes both homepage latest feed and service/area blog reference sections depend on the same lightweight, serverless-safe flow.

Verification:
- `npm run build` passed.
- Local API checks returned `source: "naver"` for both `mode=latest` and a service-page `mode=matching` query.
- Browser/Playwright check on `/service/door` showed 10 rendered blog cards in the reference section, and the first card title matched the matching API first item.
- Browser/Playwright check on `/` showed 6 rendered latest blog cards, with the first card title matching the latest API first item.

Follow-up:
- Wait for the Vercel deployment to pick up `main`; after that the production blog reference sections should stop showing empty states.

## 2026-05-30 - Blog Empty-State Fallback Fix

Changed files:
- `src/App.tsx`
- `src/services/BlogPortfolioService.ts`
- `WORK_LOG.md`

Implemented behavior:
- Homepage blog now renders fallback posts when the latest Naver fetch fails instead of showing an empty block.
- Landing-page blog reference sections now fall back to the cached representative posts when the matching filter produces nothing after an API failure.
- This keeps blog areas populated even while the production Naver fetch is unstable.

Verification:
- `npm run build` passed.
- Local browser check on `/` showed 6 rendered blog cards.
- Local browser check on `/service/door` showed 10 rendered blog cards in the reference area.

Follow-up:
- Production still depends on the current Vercel deployment picking up this commit, but the UI no longer needs the remote blog API to succeed in order to avoid blank sections.

## 2026-05-30 - Price Pages Noindex Cleanup

Changed files:
- `src/App.tsx`
- `public/sitemap.xml`
- `WORK_LOG.md`

Implemented behavior:
- Marked the four `/service/*/price` utility pages as `noindex,nofollow`.
- Removed those price pages from the sitemap so Google stops spending crawl budget on pages that are not meant to rank.

Verification:
- `npm run build` passed.
- Local browser check on `/service/electric/price` showed `meta robots = noindex,nofollow` and the correct canonical URL.

Follow-up:
- The remaining service and area pages are still indexable; if Search Console continues to report `crawled - currently not indexed`, the next pass should focus on making those pages more distinctive and less template-heavy.

## 2026-05-30 - Static Landing Snapshots For Indexing

Changed files:
- `vercel.json`
- `public/service/*/index.html`
- `public/area/*/index.html`
- `WORK_LOG.md`

Implemented behavior:
- Generated prerendered HTML snapshots for all service and area landing pages, including the price pages, so Google receives page-specific HTML instead of only the SPA shell.
- Updated Vercel rewrites so `/service/:path*` and `/area/:path*` resolve to the matching static snapshot files.
- Kept the app behavior unchanged for users, but gave crawlers a much stronger HTML entrypoint per route.

Verification:
- `npm run build` passed.
- Confirmed the build output includes route-specific HTML files such as `/service/film/index.html`, `/service/electric/price/index.html`, and `/area/seoul/index.html`.

Follow-up:
- Monitor Search Console after the next deploy. If `crawled - currently not indexed` still persists, the remaining work is content differentiation rather than routing.

## 2026-05-30 - Blog Latest Fallback Removal

Changed files:
- `src/App.tsx`
- `src/services/BlogPortfolioService.ts`

Implemented behavior:
- Homepage blog now shows latest Naver posts only.
- If the latest fetch fails, it no longer falls back to older curated cards; it shows an empty-state message instead.

Verification:
- `npm run build` passed.
- Browser verification pending.

Follow-up:
- None.

## 2026-05-29 - Blog Section Freshness

Changed files:
- `src/App.tsx`
- `src/services/BlogPortfolioService.ts`
- `api/naver-blog.ts`
- `src/styles.css`

Implemented behavior:
- Made the homepage blog section render latest Naver posts directly when available instead of merging in older fallback cards.
- Removed client-side caching from the latest blog fetch path and disabled server caching for `mode=latest` so the feed stays fresh.
- Showed blog carousel controls on desktop and widened the rail so the section uses more of the screen.

Verification:
- `npm run build` passed.
- Verified in Playwright at 390px, 820px, 1366px, and 1440px that the homepage blog rail is horizontal, the controls are visible, and the first card matches the latest Naver API title.

Follow-up:
- None.

## 2026-05-29 - Homepage Header Center Alignment

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Center-aligned the homepage service and specialty section titles/subtitles.
- Centered the case and blog heading blocks while keeping the action links on the right.

Verification:
- `npm run build` passed.
- Browser-checked the homepage and confirmed the requested sections use centered heading alignment.

Follow-up:
- None.

## 2026-05-29 - Homepage Self-Diagnosis Link

Changed files:
- `src/App.tsx`
- `src/data.ts`
- `WORK_LOG.md`

Implemented behavior:
- Linked the homepage `자가진단` nav item to the homepage symptoms section (`#symptoms`).
- Added an explicit `id="symptoms"` anchor to the homepage symptoms block so the link can jump to it directly.

Verification:
- `npm run build` passed.
- Browser-checked the homepage and confirmed the `자가진단` nav item resolves to `#symptoms`.

Follow-up:
- Diagnosis page active-state behavior can be revisited if you want that nav item to keep a special highlight there as well.

## 2026-05-29 - Homepage Title Typography Unify

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Unified homepage section title typography across services, specialties, cases, blog, and contact blocks.
- Removed per-section inline title sizing so the shared CSS rules now control font family, size, weight, and spacing.
- Kept the hero typography unchanged.

Verification:
- `npm run build` passed.
- Browser-checked the homepage at mobile and desktop widths and confirmed non-hero titles now share the same 30px / 48px sizing scale and 800 weight.

Follow-up:
- None.

## 2026-05-29 - Blog Carousel Restore

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Restored the homepage blog portfolio to a horizontal carousel across tablet and desktop widths.
- Removed the layout collapse that was stacking blog cards vertically on wider screens.
- Kept the blog section auto-height so the section no longer balloons to several viewport heights.

Verification:
- `npm run build` passed.
- Browser-checked the blog section at `820px` and `1440px` widths and confirmed the rail displays horizontally with normal card heights.

Follow-up:
- None.

## 2026-05-29 - 1440px Nav Fix

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Prevented the 1440px desktop navigation actions from wrapping vertically.
- Reduced mid-desktop nav spacing slightly so the logo, menu, login, and phone CTA fit on a single line.

Verification:
- `npm run build` passed.
- Browser-checked the header at `1440px` width and confirmed the right-side actions stay in one row.

Follow-up:
- None.

## 2026-05-29 - Mobile Section Top Spacing

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Increased the mobile homepage section top spacing so section titles no longer sit too close to the previous block.

Verification:
- `npm run build` passed.
- Browser-checked the mobile homepage layout and confirmed the main section headings have more breathing room.

Follow-up:
- None.

## 2026-05-29 - Mobile Contact Section Fix

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added mobile-only spacing so the homepage contact section clears the fixed bottom CTA.
- Forced the contact layout into a single column on phones so the estimate card and copy no longer collapse into a narrow vertical column.

Verification:
- `npm run build` passed.
- Browser-checked the mobile viewport at `390px` width and confirmed the contact copy and estimate card render in a normal single-column layout.

Follow-up:
- None.

## 2026-05-29 - Restore Services Section Scale

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Restored the homepage services section to a larger, more readable layout.
- Brought back a larger services heading block and expanded the first service card into a prominent feature card.
- Increased the desktop service grid spacing and card sizing so the section no longer feels compressed.

Verification:
- `npm run build` passed.
- Browser checked `http://127.0.0.1:4174/` and confirmed the services section renders with a larger heading and a 2-column/2-row featured first card.

Follow-up:
- None.

## 2026-05-29 - Homepage Blog Latest Posts

Changed files:
- `src/App.tsx`
- `src/services/BlogPortfolioService.ts`
- `api/naver-blog.ts`
- `WORK_LOG.md`

Implemented behavior:
- Added a dedicated latest-posts fetch path for the homepage blog portfolio.
- Kept landing-page blog matching behavior unchanged.
- Removed the homepage's initial fallback display of pinned case-like posts and replaced it with a loading state until latest blog posts arrive.

Verification:
- `npm run build` passed.
- Playwright checked the home page nav labels and confirmed `자가진단` and `견적상담` are present in the desktop menu.
- Playwright confirmed the home page renders the section order with `작업 절차` before `블로그`.
- Playwright scrolled to `#blog` and confirmed the nav underline moves to `블로그`.

Follow-up:
- None.

## 2026-05-29 - Diagnosis Page Nav Sync

Changed files:
- `src/diagnosis/DiagnosisPage.tsx`
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Renamed the diagnosis wording from `자기진단` to `자가진단` in the page SEO and visible labels.
- Added the global navigation bar to the diagnosis page so the current `자가진단` item shows the active underline bar.
- Kept the diagnosis page header behavior aligned with the homepage navigation styles.

Verification:
- `npm run build` passed.
- Playwright verified that `/diagnosis` shows `자가진단` as the active nav item and the diagnosis kicker now reads `간편 자가진단`.

Follow-up:
- None.

## 2026-05-29 - Homepage Blog Carousel Expansion

Changed files:
- `src/App.tsx`
- `src/services/BlogPortfolioService.ts`
- `api/naver-blog.ts`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reworked the homepage blog section into a horizontal carousel matching the cases section layout.
- Increased the homepage blog fetch target to 8 posts and widened the blog data pipeline to allow 8 items.
- Filled the homepage carousel to 8 cards by combining the latest API posts with curated fallback blog posts when the live feed returns fewer than 8 items.

Verification:
- `npm run build` passed.
- Playwright verified the homepage blog section renders as a flex carousel with 8 cards.

Follow-up:
- None.

## 2026-05-29 - Homepage Nav and Section Alignment

Changed files:
- `src/App.tsx`
- `src/contentSections.ts`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added `자가진단` and `견적상담` to the desktop navigation and marked the current nav item with an active underline bar.
- Kept the home-page section order aligned with the nav order by rendering the canonical homepage section sequence.
- Moved the home-page `작업 절차` section ahead of `블로그` to match the top navigation.
- Standardized the non-hero, non-about section titles to a shared header rhythm so the home page feels more consistent.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-29 - Process Section Refinement

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Moved the process section title block higher and reduced the vertical offset before the three signal cards.
- Increased the contrast of the signal cards with a stronger background, border, and shadow.
- Tightened the card spacing and typography so the three cards read more clearly at desktop size.

Verification:
- `npm run build` passed.
- Browser-checked the local preview and confirmed the process card background, border, and shadow styles are present.

Follow-up:
- None.

## 2026-05-29 - Desktop Service And Blog Tightening

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reduced the desktop service section density again so the first bento card no longer dominates the layout.
- Tightened the desktop blog section by forcing a 4-column, smaller-card layout with reduced image and body spacing.
- Added a final desktop-only override block to force service and blog sections to align from the top instead of centering their content.

Verification:
- `npm run build` passed.
- Browser-checked the local preview at 1920px and confirmed `justify-content` is now `flex-start` for both sections, with a smaller blog card height and smaller service card height.

Follow-up:
- None.

## 2026-05-29 - Desktop Section Density Reduction

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reduced the desktop prominence of the homepage service bento cards so the first card no longer dominates the whole section.
- Tightened desktop blog card sizing and removed the oversized featured treatment.
- Kept the changes desktop-only so tablet and mobile layouts stay intact.

Verification:
- `npm run build` passed.
- Browser-checked the local preview and confirmed the first service card now renders as a normal-size card instead of a 2x2 block.

Follow-up:
- None.

## 2026-05-28 - Editor Change Summary

Changed files:
- `src/admin/HomepageEditor.tsx`
- `src/admin/LandingPagesEditor.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added a top-level changed section counter to the homepage editor save state.
- Added a top-level changed page counter to the landing page editor save state.
- Styled the new save summary so it fits the existing editor status block.

Verification:
- `npm run build` passed.
- Browser-checked `/admin` in a local preview and confirmed the homepage editor shows the change counter in the save state block.

Follow-up:
- None.

## 2026-05-28 - Admin Inquiry Bulk Actions

Changed files:
- `src/admin/AdminPage.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added inquiry time filters for today, 7 days, and 30 days on the admin inquiry view.
- Added checkbox-based multi-select and a bulk action bar for selected inquiries.
- Added bulk status updates and tightened the row selection layout so the list stays readable.

Verification:
- `npm run build` passed.
- Browser-checked `/admin/inquiries` in a local preview; the new time filter chips rendered and the page stayed stable, but the preview had no inquiry rows to exercise the bulk bar.

Follow-up:
- None.

## 2026-05-28 - Admin Inquiry Dashboard Improvement

Changed files:
- `src/admin/AdminPage.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added a compact inquiry dashboard panel with pending, today, 7-day, and last refresh summaries.
- Added quick action chips for pending, new, done, CSV export, and refresh on the inquiry management view.
- Replaced the first insight card set with a clearer pending status summary so the queue reads faster at a glance.

Verification:
- `npm run build` passed.
- Browser-checked `/admin/inquiries` at 1440px and confirmed the new dashboard panel, quick actions, and filtered summary render correctly.

Follow-up:
- None.

## 2026-05-28 - Homepage Rotator Copy Fix

Changed files:
- `src/App.tsx`
- `src/admin/HomepageEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Changed the homepage hero rotator copy from `으로 끝냅니다` to `로 끝냅니다`.
- Kept the homepage editor preview in sync with the public hero text.

Verification:
- `npm run build` passed.
- Browser verification confirmed the homepage hero now reads `집의 모든 불편을 한 통의 전화로 끝냅니다.`

## 2026-05-28 - Contact Section Reflow

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Split the contact section into a full-width header block and a lower two-column content row.
- Moved the detailed consultation card below the header so the main title can use the upper page width.
- Tightened the consultation card title so it reads in two lines instead of stacking into a narrow column.

Verification:
- `npm run build` passed.
- Browser-checked the rebuilt preview at `http://127.0.0.1:4175/` and confirmed the contact title spans the upper area and the consultation card sits lower with a wider title line.

Follow-up:
- None.

## 2026-05-28 - Process Signal Card Tightening

Changed files:
- `src/App.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Shortened the three process signal descriptions so they read as concise labels instead of long paragraphs.
- Tightened the signal card typography and clamped the descriptions to two lines on the homepage desktop layout.

Verification:
- `npm run build` passed.
- Browser-checked the local homepage layout and confirmed the process signal cards are shorter and less vertically stretched.

Follow-up:
- None.

## 2026-05-28 - Blog Header Lift

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Moved the homepage blog section title and description higher by reducing the section top padding.
- Tightened the blog heading block spacing so the section starts earlier on wide screens.

Verification:
- `npm run build` passed.
- Browser-checked the local homepage at `http://127.0.0.1:5173/` and confirmed the blog heading sits higher on the page.

Follow-up:
- None.

## 2026-05-28 - Cases Header Lift

Changed files:
- `src/App.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Moved the homepage `대표 현장사례` heading and description higher by reducing the section header's top padding.

Verification:
- `npm run build` passed.
- Browser-checked the local homepage at `http://127.0.0.1:5173/` and confirmed the cases header sits higher on the page.

Follow-up:
- None.

## 2026-05-28 - Homepage Services Spacing

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Moved the homepage services section title higher by reducing the top padding on the section header.
- Increased the spacing between service cards on medium and large desktop layouts.

Verification:
- `npm run build` passed.
- Browser-checked the local homepage layout at `http://127.0.0.1:5173/` and confirmed the service cards render with wider gaps.

Follow-up:
- None.

## 2026-05-28 - Admin Stack Rollout

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Applied the stacked preview-over-inspector layout to all admin editors at mobile and tablet sizes.
- Added tablet preview scrolling and height limits so the preview stays readable without stretching the page excessively.
- Kept the desktop split layout intact.

Verification:
- `npm run build` passed.
- Browser verification at 390px, 820px, 1280px, and 1440px confirmed the admin editors keep preview above inspector on small screens and remain split on larger screens.

Follow-up:
- None.

## 2026-05-28 - All Admin Stack Unification

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Applied the same stacked preview-over-inspector layout to the landing-page, account, and estimate editors at mobile and tablet sizes.
- Added explicit admin-shell overrides so all editor pages follow the same order and avoid split-panel feel on smaller screens.

Verification:
- `npm run build` passed.
- Browser verification at 390px and 1024px confirmed the homepage, landing-page, account, and estimate editors all keep preview above inspector.

Follow-up:
- None.

## 2026-05-28 - Tablet Editor Stack Refinement

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Extended the vertical editor layout to the tablet breakpoint as well, so preview sits above the inspector instead of staying in a more side-by-side feeling layout.
- Disabled the sticky inspector behavior on tablet so the panel reads as a normal section below the preview.

Verification:
- `npm run build` passed.
- Browser verification at a 1024px viewport confirmed the homepage editor preview renders above the inspector.

Follow-up:
- The same tablet stacking can be applied to the other admin editors if you want the whole admin area to behave identically.

## 2026-05-28 - Editor Header Copy Shortening

Changed files:
- `src/admin/HomepageEditor.tsx`
- `src/admin/LandingPagesEditor.tsx`
- `src/admin/SiteContentEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Shortened the top explanatory copy in the homepage, landing-page, account, and estimate editors.
- Kept the headings unchanged and reduced only the supporting paragraph text so the headers scan faster.

Verification:
- `npm run build` passed.
- Browser verification confirmed the shortened header copy renders on the admin pages.

Follow-up:
- None.

## 2026-05-28 - Mobile Editor Stack Refinement

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Reworked the mobile admin editor layout so the preview panel renders above the inspector instead of competing side-by-side.
- Kept the preview panel independently scrollable on mobile while leaving the inspector as a separate section below it.
- Preserved the sticky desktop layout; this pass only tightens the mobile stacking behavior.

Verification:
- `npm run build` passed.
- Browser verification at a 390px viewport confirmed the homepage editor preview now stacks above the inspector.

Follow-up:
- If needed, the same mobile stacking pattern can be applied to the landing, account, and estimate editors for consistency.

## 2026-05-28 - Editor UX Polish Pass

Changed files:
- `src/admin/HomepageEditor.tsx`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added a compact context strip to the editor header so the current section and its description are visible without hunting in the sidebar.
- Made the section navigation sticky and visually grouped so switching sections feels more direct.
- Made the inspector panel sticky on desktop with its own scroll area so long sections do not trap the user in the page scroll.
- Tightened the shared inspector copy to reduce repeated wording and clarified the shared-image note in the about section.

Verification:
- `npm run build` passed.
- Browser verification confirmed the homepage admin editor still renders and the new context strip appears.

Follow-up:
- The remaining UX work, if desired, is mostly microcopy and spacing tuning rather than structural changes.

## 2026-05-28 - Homepage Hero Subgroup Schema Pass

Changed files:
- `src/contentSections.ts`
- `src/admin/HomepageEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Moved the homepage hero's trust, proof, and menu label repeaters onto shared tuple-group schema definitions.
- Removed the last remaining bespoke homepage editor blocks for those repeated fields.
- Kept the hero content editing aligned with the public hero rendering while reducing one-off form code.

Verification:
- `npm run build` passed.
- Browser verification confirmed the homepage and admin page still render normally.

Follow-up:
- The homepage editor is now largely schema-driven. The remaining manual bits are the hero card-image picker and the about-section image links, which are intentionally kept separate because they point at shared case images.

## 2026-05-28 - Landing Page Form Schema Pass

Changed files: `src/admin/LandingPagesEditor.tsx`, `src/contentSections.ts`, `WORK_LOG.md`

Implemented behavior:
- Moved the landing-page editor's basic information, hero, and body fields onto shared field schema metadata.
- Kept FAQ and related-link repeaters intact for now, but reduced the amount of section-specific hardcoding in the admin form.
- Continued the section-based CMS direction by making the landing editor's core inputs derive from schema definitions rather than hand-written one-off inputs.

Verification:
- `npm run build` passed.

Follow-up:
- The homepage editor still has more bespoke section rendering than the landing editor. The next pass should lift its remaining repeaters and simple fields into the same schema pattern.

## 2026-05-28 - Section-Based CMS Schema

Changed files: `src/App.tsx`, `src/admin/HomepageEditor.tsx`, `src/contentSections.ts`, `src/landingPages.ts`, `src/services/SiteContentService.ts`, `src/types.ts`, `WORK_LOG.md`

Implemented behavior:
- Added a shared section schema module so homepage and landing-page content use the same section identity and order model.
- Stored section order in homepage and landing-page CMS payloads, with defaults preserved for older saved content.
- Switched the public homepage and landing pages to render from the shared section order instead of hardcoded page composition.
- Wired the homepage admin section navigator to the shared schema labels so the editor and public page stay aligned.

Verification:
- `npm run build` passed.
- Playwright browser verification confirmed the homepage and landing page render in the shared section order.

Follow-up:
- The section schema now covers ordering and grouping. Next step, if desired, is to move individual section field definitions into the same schema so the editor form itself becomes fully data-driven.

## 2026-05-28 - Admin Fullscreen Preview Mode

Changed files: `src/admin/HomepageEditor.tsx`, `src/admin/LandingPagesEditor.tsx`, `src/admin/SiteContentEditor.tsx`, `src/styles.css`, `WORK_LOG.md`

Implemented behavior:
- Added an explicit `전체 미리보기` toggle to the homepage, landing-page, account, and estimate admin editors.
- Rendered the preview panels as fixed overlays when fullscreen mode is active so mobile and tablet users can inspect the whole mock page without fighting the editor layout.
- Kept the preview panels scrollable inside the overlay with touch-friendly momentum scrolling.

Verification:
- `npm run build` passed.

Follow-up:
- If you want, the next pass can add a dimmed backdrop or split the fullscreen preview into a true modal with a separate close button row.

## 2026-05-28 - Admin Preview Scrollability Fix

Changed files: `src/styles.css`, `WORK_LOG.md`

Implemented behavior:
- Restored internal scrolling for admin preview panels on tablet and mobile so the full preview can be inspected without the whole page feeling stuck.
- Kept the inspector itself non-scroll-trapping, while letting preview panels scroll with touch drag, wheel, and overscroll containment.
- Increased the mobile preview scale slightly so more of the rendered page is visible inside the bounded preview viewport.

Verification:
- `npm run build` passed.

Follow-up:
- If you want, the next pass can add a visible drag handle or "전체 미리보기" modal for an even clearer mobile preview mode.

## 2026-05-28 - Admin Home Hero Editability Expansion

Changed files: `src/App.tsx`, `src/admin/HomepageEditor.tsx`, `src/services/SiteContentService.ts`, `src/types.ts`, `WORK_LOG.md`

Implemented behavior:
- Exposed the homepage hero rotating words, proof text, and trust metrics in the admin editor instead of leaving them hardcoded.
- Updated the live homepage hero and trust band to render from saved homepage content with sensible defaults.
- Kept the editor preview aligned with the new hero fields so the admin can see the same text that will appear on the public page.

Verification:
- `npm run build` passed.

Follow-up:
- The remaining global business profile values still live outside the homepage content model and can be split out next if you want full site-wide editing.

## 2026-05-27 - Admin Editor UX Polish

Changed files: `src/admin/SiteContentEditor.tsx`, `src/styles.css`, `WORK_LOG.md`

Implemented behavior:
- Made the admin page tabs sticky on desktop so page switching stays visible while scrolling long edit forms.
- Tightened the editor save-state strip so the autosave note reads more compactly.
- Collapsed the `Ctrl + S` hint into a single shortcut pill and hid shortcut keys on mobile so the summary area is less cramped.

Verification:
- `npm run build` passed.
- Browser screenshots reviewed on desktop and mobile after the change.

Follow-up:
- None.

## 2026-05-28 - Quote Template Download and XLSX Validation

Changed files:
- `src/admin/InquiryQuoteEditor.tsx`
- `src/services/QuoteService.ts`
- `WORK_LOG.md`

Implemented behavior:
- Added a sample quote template download button in the admin quote editor.
- Generated a dedicated 상담 견적서 template workbook that matches the current import structure.
- Strengthened XLSX import validation with clearer errors for missing sheets, empty sheets, missing quote structure, and malformed line-item headers.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-28 - Consultation Quote Title and Template

Changed files:
- `src/admin/InquiryQuoteEditor.tsx`
- `src/services/QuoteService.ts`
- `WORK_LOG.md`

Implemented behavior:
- Split exported quote titles and filenames so direct-written 상담 견적 uses `상담 견적서`, while mock-quote based exports keep `견적서`.
- Added a basic consultation quote template button in the admin quote editor for inquiries without a prefilled mock quote.
- Kept the existing confirm flow, customer mypage quote visibility, and Excel import/export behavior intact.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-28 - Confirmed Quote Visibility in My Page

Changed files:
- `src/admin/AdminPage.tsx`
- `src/admin/InquiryQuoteEditor.tsx`
- `src/account/AccountPage.tsx`
- `src/services/QuoteService.ts`
- `src/types.ts`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added a quote confirm toggle in the admin quote editor that stamps `confirmedAt` onto the saved quote snapshot.
- Added customer-facing quote cards in 마이페이지 for confirmed quotes, including source, confirm date, totals, top line items, and PDF/XLSX download actions.
- Updated quote export/import metadata to preserve confirmation dates.
- Marked confirmed quotes in the admin inquiry list so the confirmation state is visible at a glance.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-28 - Admin Quote Material Quantity and Excel Import

Changed files:
- `src/admin/InquiryQuoteEditor.tsx`
- `src/services/QuoteService.ts`
- `src/types.ts`
- `src/styles.css`
- `src/admin/HomepageEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Added quantity and unit-price inputs to admin quote material charges, with the material total recalculated from `qty * unitPrice`.
- Added an Excel drag-and-drop / file-pick import zone in the quote editor that replaces the current draft with data parsed from an `.xlsx` or `.xls` file.
- Updated quote XLSX/PDF exports to include material quantities and unit prices so imported files round-trip cleanly.
- Kept legacy quote snapshots compatible by normalizing older material charge data into the new structure.

Verification:
- `npm run build` passed.
- Local Vite dev server is running on `127.0.0.1:5173`.

Follow-up:
- Browser-authenticated verification of the admin inquiry page was not performed in this turn.

## 2026-05-28 - Direct Quote Writing for Non-Mock Inquiries

Changed files:
- `src/admin/AdminPage.tsx`
- `src/admin/InquiryQuoteEditor.tsx`
- `src/services/QuoteService.ts`
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Allowed the admin inquiry detail panel to open the quote editor for every inquiry, even when the customer did not submit a mock estimate.
- Added manual quote line-item creation and deletion so admins can build a 상담 견적 from scratch.
- Updated the quote editor to label no-source quotes as direct-written estimates instead of implying a mock estimate exists.
- Kept the existing Excel import/export flow and material quantity handling intact.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-28 - Blog Profile Split + Unit Tests

Changed files:
- `src/services/BlogMatchingProfiles.ts`
- `src/landingPages.ts`
- `src/App.tsx`
- `tests/blog-profiles.spec.ts`
- `WORK_LOG.md`

Implemented behavior:
- Moved service blog matching rules into a dedicated `BlogMatchingProfiles` service module.
- Kept landing-page blog selection driven by the shared profile table.
- Added unit-style tests that verify the profile table keys and the critical `tile`, `방수·타일`, and `외부` rule sets.

Verification:
- `npm run build` passed.
- `npm run test:blog` passed.

Follow-up:
- None.

## 2026-05-28 - Blog Profile Consolidation

Changed files:
- `src/landingPages.ts`
- `src/App.tsx`
- `tests/blog-matching.spec.ts`
- `WORK_LOG.md`

Implemented behavior:
- Consolidated service blog rules into a single profile table with fetch, match, query, exclude, and category settings.
- Kept landing-page blog selection driven by explicit match terms instead of position-based anchors.
- Preserved category-based fetching and page-specific exclusions.

Verification:
- `npm run build` passed.
- `npm run test:blog` passed.

Follow-up:
- None.

## 2026-05-28 - Blog Matching Rule Hardening

Changed files:
- `src/landingPages.ts`
- `src/App.tsx`
- `tests/blog-matching.spec.ts`
- `WORK_LOG.md`

Implemented behavior:
- Split landing-page blog logic into `searchTerms`, `queryTerms`, and explicit `matchTerms`.
- Removed the old first-three-term gating so service pages are filtered by page-specific match rules instead of ad hoc anchor order.
- Kept category-based fetching, but made the landing render layer depend on explicit service match terms for more stable results.
- Expanded the blog regression test to cover the `방수·타일` browser flow again.

Verification:
- `npm run build` passed.
- `npm run test:blog` passed.

Follow-up:
- None.

## 2026-05-27 - Blog Matching Regression Tests

Changed files:
- `playwright.config.ts`
- `tests/blog-matching.spec.ts`
- `package.json`
- `WORK_LOG.md`

Implemented behavior:
- Added Playwright regression coverage for representative service landing pages.
- Verified `/api/naver-blog` returns posts for the key service categories.
- Verified the landing page blog reference section renders cards for `욕실`, `타일`, and `외부` pages.
- Kept `방수·타일` under API coverage only because its browser render is slower and more network-sensitive in CI.

Verification:
- `npm run test:blog` passed.
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-27 - Service Landing Blog Audit

Changed files: `WORK_LOG.md`

Implemented behavior:
- Audited every service landing page's `블로그 레퍼런스` section in the browser.
- Confirmed the stricter blog filter now leaves the problem pages empty instead of showing wrong cross-service posts.

Verification:
- Browser audit completed for all service landing pages.
- `tile`, `방수·타일`, and `외부 부분보수` blog reference sections are empty instead of showing unrelated posts.

Follow-up:
- Some service pages still have sparse or empty blog references because the blog has no sufficiently specific matching posts for the new stricter filters.

## 2026-05-27 - Landing Blog Matching Hardening

Changed files: `src/landingPages.ts`, `src/App.tsx`

Implemented behavior:
- Tightened service-page blog anchors so broad overlap terms do not pull unrelated posts across services.
- Added page-level blog exclusion terms for `방수·타일` and `타일` pages to block obvious cross-service matches.
- Kept area pages on their existing location-based matching rules.

Verification:
- `npm run build` passed.
- Browser checks confirmed the wrong `외벽 방수` and unrelated `욕실/문/배관` titles do not appear on `/service/tile` and `/service/waterproofing-tile`.

Follow-up:
- `api/naver-blog` can still return broad candidates for some pages, but the landing-page filter now suppresses them before rendering.

## 2026-05-27 - Landing Blog Matching Refinement

Changed files: `src/landingPages.ts`, `src/App.tsx`

Implemented behavior:
- Split service-page blog matching from the broader SEO search terms by adding per-service `blogTerms` anchors.
- Narrowed landing-page blog fetching/filtering so service pages use service-specific anchors instead of broad shared terms like `방수`, `외벽`, or `코킹`.
- Kept area-page matching on the existing area-focused terms.

Verification:
- `npm run build` passed.

## 2026-05-27 - Estimate Works Handoff

Changed files: `src/estimate/EstimatePage.tsx`, `src/styles.css`

Implemented behavior:
- Parsed `works=` from the calculator CTA and carried the selected items into the estimate page.
- Added an intro summary card and a survey summary card so users can confirm the transferred items before continuing.
- Included the transferred work list in the inquiry payload and submission message so the saved inquiry keeps the calculator context.
- Added a visible "계산기로 돌아가기" / "작업 수정" escape hatch for users who want to revise the selected items.

Verification:
- `npm run build` passed.
- Browser checks passed on mobile, tablet, laptop, and desktop viewport sizes with no console errors and no horizontal overflow in the estimate flow.

## 2026-05-27 - 모의 견적 계산기 수량 조정

Changed files:
- `src/App.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Changed the service-page mock estimator from selected-only state to per-item quantity state.
- Added plus/minus quantity controls for all selected estimator items, including `회`, `개`, `건`, `문짝당`, `평당`, and `식` units.
- Updated the estimate summary and subtotal/VAT/total calculation to multiply each selected item by its quantity.
- `식` items can now also be counted when the user needs multiple sets.
- Improved the mobile estimator row layout so the item name uses the full row width and price/material/quantity controls sit below it instead of squeezing the name into many short lines.

Verification:
- `npm run build` passed.
- Playwright mobile/tablet checks passed on `/service/door`; quantity controls worked for both `개` and `식` items, the expected total `363,000원~` appeared, and no horizontal overflow was detected.

Follow-up:
- None.

## 2026-05-27 - 메인페이지 섹션 여백 균형 조정

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Restored laptop section alignment for services, representative cases, and blog from top-aligned back to vertically centered so compact cards do not sit too high in the viewport.
- Added laptop-specific hero spacing that keeps bottom breathing room when the rotating hero title wraps to three lines.
- Kept tablet and mobile layouts scroll-safe without horizontal overflow.

Verification:
- `npm run build` passed.
- Playwright layout check passed at 1920x1080, 1440x900, 820x1180, and 390x844 with no console errors and no horizontal overflow.
- Screenshot review confirmed the laptop hero, tablet hero, and mobile hero retain balanced vertical spacing.

Follow-up:
- None.

## 2026-05-26 - 서비스 섹션 압축 및 네비게이션 순서 조정

Changed files:
- `src/styles.css`
- `src/data.ts`
- `WORK_LOG.md`

Implemented behavior:
- Kept the service section in place and tightened its laptop-size layout by reducing the section head spacing, card padding, card height, and typography.
- Moved the top navigation `자가진단` link to appear between `소개` and `서비스`.

Verification:
- `npm run build` passed.

Follow-up:
- None.

## 2026-05-26 - 노트북 섹션 압축 정리

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Kept `가능 작업` back on the original sizing path and limited the laptop compact rules to `서비스`, `대표 현장 사례`, and `블로그`.
- Changed the laptop service section to a compact 5-column grid with shorter cards.
- Reduced representative case card width, media ratio, body text, and controls for laptop viewports.
- Changed the laptop blog section to 5 compact equal cards so the current posts fit in one row.

Verification:
- `npm run build` passed.
- Browser measurement initially confirmed blog fit at 1280x720 and cases/blog fit at 1440x900; a later in-app browser recheck was blocked by local URL policy after the final additional reductions.

Follow-up:
- None.

## 2026-05-26 - 블로그 카드 위치 하향 조정

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added a small top margin above the homepage blog card grid so the cards sit slightly lower in the viewport.
- Left the blog heading and card sizing unchanged.

Verification:
- Pending build.

Follow-up:
- None.

## 2026-05-27 - Naver Blog Category Matching

Changed files:
- `src/services/BlogPortfolioService.ts`
- `src/services/NaverBlogSource.ts`
- `src/landingPages.ts`
- `src/App.tsx`
- `vite.config.ts`

Implemented behavior:
- Added service-page `blogCategoryNos` so landing blog fetches can pull from the right Naver Blog categories.
- Routed both the dev proxy and production API through the shared category-aware Naver Blog loader.
- Loosened the landing-page blog anchors for `타일`, `방수·타일`, and `외벽` pages so real matching posts are not filtered out.
- Kept unrelated posts blocked with page-specific exclude terms.

Verification:
- `npm run build` passed.
- Browser verified `/service/tile`, `/service/waterproofing-tile`, and `/service/exterior` now render non-empty blog cards.
- Confirmed the landing pages show relevant titles from the matching Naver Blog categories.

Follow-up:
- None.

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

## 2026-05-26 - Homepage Specialties Laptop Fit

Changed files:
- `src/styles.css`
- `WORK_LOG.md`

Implemented behavior:
- Added laptop-only compact sizing for the homepage `가능 작업` section at 1100-1599px widths.
- Reduced the section title spacing, filter buttons, search input, work chips, grid gaps, and bottom jump buttons so all work chips fit in one laptop viewport.
- Kept the existing mobile, tablet, and 4K sizing rules unchanged.

Verification:
- `npm run build` passed.
- Browser measurement passed at laptop-sized viewport; the `가능 작업` section fit without internal scrolling and the visible work grid compressed to 184px high.

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

## 2026-05-27 - Admin Quote Editor and Export Flow

Changed files:
- `src/services/QuoteService.ts`
- `src/admin/InquiryQuoteEditor.tsx`
- `src/admin/AdminPage.tsx`
- `src/estimate/EstimatePage.tsx`
- `src/App.tsx`
- `src/services/AdminService.ts`
- `src/pricing/registry.ts`
- `src/pricing/types.ts`
- `src/types.ts`
- `src/styles.css`
- `package.json`
- `package-lock.json`

Implemented behavior:
- Added mock-estimate source context to the estimate intake so the selected works and source paths are preserved in inquiry data.
- Added an admin quote editor that loads the inquiry into an editable spreadsheet-style quote draft with line items, material charges, extra charges, memo, totals, and save support.
- Added XLSX and PDF download actions for the admin quote draft.
- Added runtime Korean font loading for PDF generation.
- Fixed quote item resolution so a source-specific `workIds` selection maps to one source instead of duplicating across all catalog sources.

Verification:
- `npm run build` passed.
- Browser verified `/service/electric/price` selection -> `/estimate` transfer on mobile and desktop.
- Browser verified estimate intro summary renders the selected work list.
- Browser verified XLSX/PDF download generation from the quote service helpers.
- Browser verified quote draft resolution returns a single source-specific line item for a source-matched work ID.

Follow-up:
- None.

## 2026-05-28 - Homepage Repeater Schema Pass

Changed files:
- `src/contentSections.ts`
- `src/admin/HomepageEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Added shared repeater schemas for homepage services, cases, blog posts, and process steps.
- Replaced the homepage editor's manual repeater inspectors with schema-driven list and field rendering.
- Kept image upload support for repeater items while centralizing the edit handlers.

Verification:
- `npm run build` passed.
- Browser verified homepage and admin page render without obvious layout breakage.

Follow-up:
- The homepage editor is now mostly schema-driven; only the hero media deck and a few targeted image upload controls still remain bespoke.

## 2026-05-28 - Homepage Editor Schema Pass

Changed files:
- `src/contentSections.ts`
- `src/admin/HomepageEditor.tsx`
- `src/App.tsx`
- `src/admin/InquiryQuoteEditor.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Added shared homepage editor field schemas for hero, about, symptoms, specialties, and contact.
- Swapped the homepage editor's simple sections to schema-driven form rendering instead of hardcoded field blocks.
- Made the public homepage hero use `hero.title` so the editor's title field affects the live view.
- Fixed the hero title spacing bug so the rotator text no longer runs into the title.
- Updated the inquiry quote editor's default charge shape to match the current quote types.

Verification:
- `npm run build` passed.
- Browser checked the homepage hero text on `http://127.0.0.1:4173/` and confirmed it renders as expected.

Follow-up:
- The remaining complex homepage repeaters (`services`, `cases`, `blog`, `process`) are still manual and can be moved into the same schema pattern next.

## 2026-05-27 - Price Calculator Selection Persistence

Changed files:
- `src/App.tsx`
- `WORK_LOG.md`

Implemented behavior:
- Persisted the service price-page mock estimate selection in `localStorage` by pricing page path.
- Restored selected items and quantities when the user returns from the estimate page or refreshes the calculator.
- Kept query-string preselection working while letting stored selections resume the last calculator state.

Verification:
- `npm run build` passed.
- Browser verified mobile and desktop restore flow.
- Verified the selected checkbox stays checked after returning from `/estimate`.
- Verified quantity changes are restored as well.

Follow-up:
- None.
