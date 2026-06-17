# jipsuriclass 잔여 작업

> 갱신: 2026-06-17 — A 완료, B는 Astro 전환으로 obsolete. 나머지는 선택(성능/정리).

## ✅ Task A: 서비스/지역 페이지 블로그 Empty State fallback — 완료
- `BlogPortfolioService.loadPortfolioPosts()`가 매칭 0건이면 `loadLatestPortfolioPosts()`로 폴백.
- 지역 페이지는 키워드 매칭 글만 반환 + 모바일 post-list 여러 페이지 수집(`api/naver-blog-source.ts`).

## ⛔ Task B: 정적 HTML SEO 타이틀/설명 — obsolete
- Astro 전환으로 `service/[slug].astro`·`area/[slug].astro`가 빌드 타임에 per-page `<title>`/메타/JSON-LD를 생성.
  레거시 `scripts/patch-static-html.mjs`(build:vite 전용) 경로는 더 이상 주 빌드가 아님.

## Task C: jspdf 동적 import (선택, 성능)
**파일:** `src/estimate/EstimatePage.tsx`
- `import { jsPDF } from "jspdf"` → 핸들러 내 `await import("jspdf")`로 분할(html2canvas 동반 분리).

## Task D: CSS unused code 정리 (선택)
**파일:** `src/styles.css`
- 미사용 셀렉터 제거. 견적 카드형 전환 후 `quote-editor__table*` 일부가 미사용일 수 있음 — 제거 전 사용처 확인.

## 후속(아키텍처)
- 정적 랜딩(/service·/area)의 헤더/푸터/오피스에 영업정보 변경 라이브 반영 → 해당 섹션 client island화 또는 빌드 타임 주입 필요(현재 재배포 시 반영, 홈 SPA는 즉시).
- 견적서(문의별 `intake.quoteSnapshot`) 단위 롤백은 별도 설계 필요(현재 롤백 대상은 사이트 콘텐츠/설정).

## 규칙
- `npm run build` 통과 필수.
- 비즈니스 로직 변경은 사전 합의.
