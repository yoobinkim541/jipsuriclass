import { expect, test } from "@playwright/test";

type ServiceCase = {
  path: string;
  apiTerms: string[];
  categoryNos: number[];
};

const serviceCases: ServiceCase[] = [
  {
    path: "/service/bathroom",
    apiTerms: ["욕실", "화장실", "세면대", "샤워부스", "환풍기", "타일", "줄눈", "욕조", "곰팡이", "백시멘트", "실리콘"],
    categoryNos: [40, 31, 38]
  },
  {
    path: "/service/tile",
    apiTerms: ["타일", "줄눈", "실리콘", "욕실", "화장실", "주방", "현관", "타일교체", "타일보수", "타일시공"],
    categoryNos: [40, 31]
  },
  {
    path: "/service/waterproofing-tile",
    apiTerms: ["방수", "타일", "줄눈", "실리콘", "욕실", "화장실", "베란다", "크랙", "균열", "우레탄"],
    categoryNos: [40, 31]
  },
  {
    path: "/service/exterior",
    apiTerms: ["외벽", "외부", "도장", "방수", "크랙", "균열", "드라이비트", "스톤코트", "칼라강판", "난간"],
    categoryNos: [31, 43]
  }
];

const browserSmokeCases = serviceCases;

for (const serviceCase of serviceCases) {
  test(`${serviceCase.path} API returns blog posts`, async ({ request }) => {
    const response = await request.get(buildApiUrl(serviceCase));
    expect(response.ok()).toBeTruthy();

    const data = (await response.json()) as { items?: Array<{ title?: string }> };
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(data.items?.length ?? 0).toBeGreaterThan(0);
  });
}

for (const serviceCase of browserSmokeCases) {
  test(`${serviceCase.path} browser smoke renders cards`, async ({ page }) => {
    await page.goto(serviceCase.path, { waitUntil: "domcontentloaded" });
    const reference = page.locator('section[aria-labelledby="landing-blog-title"] .landing-blog-showcase').first();
    await expect.poll(async () => await reference.locator(".blog-card").count()).toBeGreaterThan(0);
    const text = (await reference.innerText()).toLowerCase();
    expect(text).not.toContain("키워드가 맞는 최신 게시물을 찾지 못했습니다.");
  });
}

function buildApiUrl(serviceCase: ServiceCase) {
  const params = new URLSearchParams();
  params.set("terms", serviceCase.apiTerms.join(","));
  params.set("categoryNos", serviceCase.categoryNos.join(","));
  return `/api/naver-blog?${params.toString()}`;
}
