import { expect, test } from "@playwright/test";
import { buildAreaSeoDescription, landingPageDefinitions, mergeLandingPageContent } from "../src/landingPages";

const requiredTerms = ["집수리", "누수피해복구공사", "일상배상책임보험수리", "도배", "석고보드 교체"];

test("all area landing descriptions use the requested regional SEO wording", () => {
  const areaPages = landingPageDefinitions.filter((page) => page.categoryLabel === "지역");

  expect(areaPages.length).toBeGreaterThan(0);

  for (const page of areaPages) {
    const areaLabel = page.areaLabel ?? page.title.replace(" | 집수리클라쓰", "");
    const expectedDescription = `${areaLabel} 종합 집수리 | 전체 리모델링부터 누수피해복구공사, 일상배상책임보험수리, 도배·석고보드 교체까지 클라쓰가 다른 집수리`;

    expect(buildAreaSeoDescription(areaLabel)).toBe(expectedDescription);
    expect(page.description).toBe(expectedDescription);
    for (const term of requiredTerms) {
      expect(page.description).toContain(term);
    }
  }
});

test("area descriptions keep the new SEO wording even when old admin overrides exist", () => {
  const areaPage = landingPageDefinitions.find((page) => page.path === "/area/seoul");

  expect(areaPage).toBeTruthy();

  const merged = mergeLandingPageContent(areaPage!, {
    description: "서울 지역의 누수, 욕실수리, 도배, 문 수리 상담을 위한 대표 지역 페이지입니다."
  });

  expect(merged.description).toBe(buildAreaSeoDescription("서울"));
});
