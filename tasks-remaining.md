# jipsuriclass 잔여 작업 — Codex 실행

## Task A: 서비스/지역 페이지 블로그 Empty State fallback
**파일:** src/services/BlogPortfolioService.ts
- loadMatchingPortfolioPosts()에서 키워드 매칭 결과 0개면 loadLatestPortfolioPosts()로 fallback
- 현재: return result; (빈 결과 그대로 반환)
- 수정: 매칭 결과 posts.length === 0이면 loadLatestPortfolioPosts() 호출

## Task B: 정적 HTML SEO 타이틀/설명
**파일:** scripts/patch-static-html.mjs
- 빌드 후 /service/*/index.html, /area/*/index.html의 <title>과 <meta name="description">을 페이지별로 변경
- src/landingPages.ts의 getLandingPageDefinition 참조
- src/router.tsx의 getSeoConfigForPath 참조

## Task C: jspdf 동적 import
**파일:** src/estimate/EstimatePage.tsx
- import { jsPDF } from "jspdf" → 핸들러 내에서 동적 import
- import("jspdf")로 변경하여 html2canvas(199KB)도 함께 분할

## Task D: CSS unused code 정리
**파일:** src/styles.css
- 사용되지 않는 CSS 클래스 셀렉터 제거

## 규칙
- npm run build 통과 필수
- 비즈니스 로직 변경 금지
- 각 작업 완료 후 ALL_DONE 출력
