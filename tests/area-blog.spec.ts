import { expect, test } from "@playwright/test";

type AreaCase = {
  path: string;
  areaName: string;
};

const areaCases: AreaCase[] = [
  { path: "/area/namyangju", areaName: "남양주" },
  { path: "/area/seoul", areaName: "서울" },
  { path: "/area/gyeonggi", areaName: "경기" },
  { path: "/area/paju", areaName: "파주" }
];

for (const areaCase of areaCases) {
  test(`${areaCase.path} landing page renders blog cards`, async ({ page }) => {
    await page.goto(areaCase.path, { waitUntil: "domcontentloaded" });
    const reference = page.locator('section[aria-labelledby="landing-blog-title"] .landing-blog-showcase').first();

    await expect.poll(async () => await reference.locator(".blog-card").count()).toBeGreaterThan(0);

    const text = (await reference.innerText()).toLowerCase();
    expect(text).not.toContain("키워드가 맞는 최신 게시물을 찾지 못했습니다.");
    expect((await page.title()).toLowerCase()).toContain(areaCase.areaName.toLowerCase());
  });
}
