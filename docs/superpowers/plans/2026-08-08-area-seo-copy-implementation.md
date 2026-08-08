# 지역 랜딩 SEO 문구 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 지역 랜딩 페이지의 하단 및 메타 설명을 짧고 브랜드 톤에 맞는 공통 문구로 바꾼다.

**Architecture:** `buildAreaSeoDescription`이 지역명만 받아 최종 문구를 반환한다. 기존 `areaPagesLinked`와 `mergeLandingPageContent`는 이 함수를 이미 사용하므로, 한 함수와 그 회귀 테스트만 수정해 16개 지역 페이지에 일관되게 반영한다.

**Tech Stack:** TypeScript, Astro, Playwright, Vercel static build

## Global Constraints

- 적용 문구는 `{지역명} 종합 집수리 | 전체 리모델링부터 누수피해복구공사, 일상배상책임보험수리, 도배·석고보드 교체까지 클라쓰가 다른 집수리`이다.
- `누수피해복구공사`, `일상배상책임보험수리`, `도배`, `석고보드 교체`는 정확한 형태로 포함한다.
- 서비스 랜딩 페이지, 히어로 문구, 지역 외 콘텐츠는 변경하지 않는다.
- 관리자 저장값이 있어도 지역 페이지는 공통 문구를 우선한다.

---

### Task 1: 지역 공통 설명문과 회귀 테스트 갱신

**Files:**
- Modify: `src/landingPages.ts:53-55`
- Modify: `tests/area-descriptions.spec.ts:1-34`
- Modify: `WORK_LOG.md:1`

**Interfaces:**
- Consumes: `buildAreaSeoDescription(areaLabel: string): string`
- Produces: 모든 `categoryLabel === "지역"` 페이지에 쓰이는 새 설명문

- [ ] **Step 1: 새 문구를 고정하는 실패 테스트 작성**

`tests/area-descriptions.spec.ts`의 지역별 검사에서 기존 문구 일부 검사:

```ts
expect(page.description).toContain(`${areaLabel}에서 필요한 집수리 관련 모든 상담`);
```

를 아래의 정확한 예상 문구 검사로 교체한다.

```ts
expect(page.description).toBe(
  `${areaLabel} 종합 집수리 | 전체 리모델링부터 누수피해복구공사, 일상배상책임보험수리, 도배·석고보드 교체까지 클라쓰가 다른 집수리`
);
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx playwright test tests/area-descriptions.spec.ts --reporter=line`

Expected: 기존 `buildAreaSeoDescription`이 이전 문구를 반환하므로 새 정확 문자열 비교에서 FAIL.

- [ ] **Step 3: 최소 구현으로 공통 생성 함수 변경**

`src/landingPages.ts`의 함수를 아래처럼 변경한다.

```ts
export function buildAreaSeoDescription(areaLabel: string) {
  return `${areaLabel} 종합 집수리 | 전체 리모델링부터 누수피해복구공사, 일상배상책임보험수리, 도배·석고보드 교체까지 클라쓰가 다른 집수리`;
}
```

- [ ] **Step 4: 지역 설명문 테스트 통과 확인**

Run: `npx playwright test tests/area-descriptions.spec.ts --reporter=line`

Expected: 16개 지역의 기본 설명문과 관리자 저장값 병합 사례가 모두 PASS.

- [ ] **Step 5: 전체 정적 빌드와 생성 결과 확인**

Run: `npm run build`

Expected: PASS. 빌드 결과의 `/area/seoul/index.html` 메타 설명은 서울 공통 문구와 정확히 일치.

- [ ] **Step 6: 작업 기록 갱신**

`WORK_LOG.md` 맨 위에 변경 파일, 적용 문구, Playwright 및 빌드 검증 결과, 포털 재크롤링 지연 가능성을 짧게 기록한다.

- [ ] **Step 7: 변경사항 확인 및 커밋**

Run: `git diff --check && git status --short`

Expected: 공백 오류 없이 `src/landingPages.ts`, `tests/area-descriptions.spec.ts`, `WORK_LOG.md`만 변경.

```bash
git add src/landingPages.ts tests/area-descriptions.spec.ts WORK_LOG.md
git commit -m "fix) 지역 랜딩 설명문 브랜드 문구 적용"
```

### Task 2: 프로덕션 배포와 라이브 메타 설명 확인

**Files:**
- No source changes expected

**Interfaces:**
- Consumes: `main` 브랜치의 Task 1 커밋
- Produces: `https://www.jipsuriclass.kr/area/seoul`에 반영된 새 메타 설명

- [ ] **Step 1: 프로덕션 배포 실행**

Run: `vercel deploy --prod --yes`

Expected: 배포 상태 `READY`, `www.jipsuriclass.kr` 별칭 유지.

- [ ] **Step 2: 라이브 서울 지역 페이지 메타 설명 확인**

Run:

```bash
node -e "fetch('https://www.jipsuriclass.kr/area/seoul?seo-copy-check=20260808').then(async (response) => { const html = await response.text(); const match = html.match(/<meta name=\"description\" content=\"([^\"]+)\"/); if (!response.ok || !match) process.exit(1); console.log(match[1]); })"
```

Expected: 서울 공통 문구가 한 글자도 다르지 않게 출력.

- [ ] **Step 3: 배포 결과 기록**

배포 URL, 배포 상태, 라이브 메타 설명 확인 결과를 사용자에게 전달한다. 포털 검색 결과 문구는 각 포털의 재크롤링 시점에 갱신된다고 함께 알린다.

## Self-Review

- Spec coverage: 공통 문구, 정확 키워드, 서비스 페이지 비변경, 관리자 저장값 우선순위, 테스트, 빌드, 배포를 각각 Task 1 또는 Task 2에 연결했다.
- Placeholder scan: `TBD`, `TODO`, 모호한 구현 지시가 없다.
- Type consistency: 기존 `buildAreaSeoDescription(areaLabel: string): string` 인터페이스를 유지한다.
