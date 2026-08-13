import { expect, test } from "@playwright/test";

test("estimate page defaults to light theme even when the system is dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => localStorage.removeItem("jsc-theme"));

  await page.goto("/estimate", { waitUntil: "domcontentloaded" });

  expect(await page.locator("html").getAttribute("data-theme")).toBe("light");
});

test("estimate survey controls stay readable in dark theme", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("jsc-theme", "dark"));
  await page.goto("/estimate", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /진행|시작|상담/ }).first().click();

  const selectors = [
    ".estimate-survey-form",
    ".estimate-question-block h2",
    ".estimate-choice",
    ".estimate-step-count"
  ];

  for (const selector of selectors) {
    const contrast = await page.locator(selector).first().evaluate((element) => {
      const parseColor = (value: string): [number, number, number] | null => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/) ;
        if (!match) return null;
        return [Number(match[1]), Number(match[2]), Number(match[3])];
      };
      const relativeLuminance = (color: [number, number, number]) => {
        const [red, green, blue] = color.map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const contrastRatio = (foreground: [number, number, number], background: [number, number, number]) => {
        const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
        const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
        return (lighter + 0.05) / (darker + 0.05);
      };
      const style = getComputedStyle(element);
      const parentStyle = getComputedStyle(element.parentElement ?? document.body);
      const background = parseColor(style.backgroundColor) ?? parseColor(parentStyle.backgroundColor) ?? [11, 18, 32];
      const color = parseColor(style.color) ?? [248, 250, 252];
      return contrastRatio(color, background);
    });

    expect(contrast, selector).toBeGreaterThanOrEqual(4.5);
  }
});

test("desktop estimate survey balances the full panel with bottom actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/estimate", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /진행|시작|상담/ }).first().click();

  const survey = page.locator(".estimate-survey-form");
  const choiceGrid = page.locator(".estimate-survey-form .estimate-choice-grid").first();
  const actions = page.locator(".estimate-step-actions");
  const question = page.locator(".estimate-question-block");

  await expect(survey).toHaveCSS("align-content", "start");
  expect(
    await choiceGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)
  ).toBe(2);

  const [surveyBox, actionsBox] = await Promise.all([survey.boundingBox(), actions.boundingBox()]);
  const [questionBox, choiceGridBox] = await Promise.all([question.boundingBox(), choiceGrid.boundingBox()]);
  expect(surveyBox?.height).toBeGreaterThanOrEqual(700);
  expect(surveyBox?.y).toBeGreaterThanOrEqual(110);
  expect((choiceGridBox?.y ?? 0) - ((questionBox?.y ?? 0) + (questionBox?.height ?? 0))).toBeGreaterThanOrEqual(40);
  expect((actionsBox?.y ?? 0) + (actionsBox?.height ?? 0)).toBeGreaterThanOrEqual(
    (surveyBox?.y ?? 0) + (surveyBox?.height ?? 0) - 56
  );
});

test("single-choice answers advance to the next survey step after two seconds", async ({ page }) => {
  await page.goto("/estimate", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /진행|시작|상담/ }).first().click();

  await page.getByRole("button", { name: "아파트" }).click();
  await page.waitForTimeout(1700);
  await expect(page.getByText("1 / 8")).toBeVisible();

  await page.waitForTimeout(450);
  await expect(page.getByText("2 / 8")).toBeVisible();
});
