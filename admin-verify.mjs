import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5174";
const OUT = "./verify-screenshots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "mobile-375", width: 375, height: 812 }
];

const log = (msg) => console.log(`[verify] ${msg}`);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    log(`\n=== ${vp.name} (${vp.width}×${vp.height}) ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle", timeout: 20000 });

    // Screenshot initial state
    await page.screenshot({ path: `${OUT}/${vp.name}-01-initial.png`, fullPage: false });

    // 1. Editor shell present
    const editorShell = await page.locator(".editor-shell").count();
    results.push({ vp: vp.name, check: "editor-shell present", pass: editorShell > 0 });
    log(`  ${editorShell > 0 ? "✓" : "✗"} editor-shell (count=${editorShell})`);

    // 2. Section chips: 7 visible (homepage tab is default)
    const chipCount = await page.locator(".editor-section-chip").count();
    results.push({ vp: vp.name, check: "section chips count=7", pass: chipCount === 7 });
    log(`  ${chipCount === 7 ? "✓" : "✗"} section chips (count=${chipCount})`);

    // 3. Section nav is VISIBLE at all sizes (not hidden)
    const navVisible = await page.locator(".editor-section-nav").first().evaluate(
      el => getComputedStyle(el).display !== "none"
    ).catch(() => false);
    results.push({ vp: vp.name, check: "section-nav visible", pass: navVisible });
    log(`  ${navVisible ? "✓" : "✗"} section-nav visible`);

    // 4. Layout: check computed grid-template-columns on editor-workspace
    const workspaceGrid = await page.locator(".editor-workspace").first().evaluate(
      el => getComputedStyle(el).gridTemplateColumns
    ).catch(() => null);
    if (workspaceGrid) {
      const isSingleCol = !workspaceGrid.includes(" "); // single value = single column
      if (vp.width <= 1100) {
        results.push({ vp: vp.name, check: "workspace single-col at ≤1100px", pass: isSingleCol });
        log(`  ${isSingleCol ? "✓" : "✗"} workspace grid="${workspaceGrid}" (expected single col)`);
      } else {
        results.push({ vp: vp.name, check: "workspace two-col at >1100px", pass: !isSingleCol });
        log(`  ${!isSingleCol ? "✓" : "✗"} workspace grid="${workspaceGrid}" (expected two col)`);
      }
    } else {
      log(`  ? workspace grid not measurable`);
    }

    // 5. About section: click chip → inspector shows input
    const aboutChip = page.locator(".editor-section-chip", { hasText: "소개" });
    if (await aboutChip.isVisible().catch(() => false)) {
      await aboutChip.scrollIntoViewIfNeeded();
      await aboutChip.click();
      await page.waitForTimeout(400);
      const inputVal = await page.locator(".editor-inspector input").first().inputValue().catch(() => null);
      results.push({ vp: vp.name, check: "about chip → inspector input", pass: inputVal !== null });
      log(`  ${inputVal !== null ? "✓" : "✗"} about inspector input (val="${inputVal ?? "n/a"}")`);
      await page.screenshot({ path: `${OUT}/${vp.name}-02-about.png`, fullPage: false });
    } else {
      results.push({ vp: vp.name, check: "about chip → inspector input", pass: false });
      log(`  ✗ about chip not visible`);
    }

    // 6. Edit field → dirty state (works without auth at local)
    if (vp.width === 1440) {
      const firstInput = page.locator(".editor-inspector input").first();
      if (await firstInput.isVisible().catch(() => false)) {
        const orig = await firstInput.inputValue();
        await firstInput.fill(orig + " test");
        await page.waitForTimeout(300);
        const stateEl = page.locator(".editor-save-state span").first();
        const saveState = await stateEl.getAttribute("data-state").catch(() => null);
        const isDirtyOrSaving = saveState === "dirty" || saveState === "saving";
        results.push({ vp: vp.name, check: "edit → dirty/saving state", pass: isDirtyOrSaving });
        log(`  ${isDirtyOrSaving ? "✓" : "✗"} save state after edit="${saveState}"`);
        await page.screenshot({ path: `${OUT}/${vp.name}-03-dirty.png`, fullPage: false });
        await firstInput.fill(orig);
      }
    }

    // 7. Preview edit triggers present (one per section = 7)
    const heroChip = page.locator(".editor-section-chip", { hasText: "히어로" });
    if (await heroChip.isVisible().catch(() => false)) {
      await heroChip.scrollIntoViewIfNeeded();
      await heroChip.click();
      await page.waitForTimeout(300);
    }
    const triggerCount = await page.locator(".preview-edit-trigger").count();
    results.push({ vp: vp.name, check: "preview edit triggers present", pass: triggerCount > 0 });
    log(`  ${triggerCount > 0 ? "✓" : "✗"} preview edit triggers (count=${triggerCount})`);

    // 8. Cases section: click chip → click card → active state
    const casesChip = page.locator(".editor-section-chip", { hasText: "사례" });
    if (await casesChip.isVisible().catch(() => false)) {
      await casesChip.scrollIntoViewIfNeeded();
      await casesChip.click();
      await page.waitForTimeout(400);
      const caseCards = await page.locator(".preview-item-card").count();
      results.push({ vp: vp.name, check: "case cards visible", pass: caseCards > 0 });
      log(`  ${caseCards > 0 ? "✓" : "✗"} case cards (count=${caseCards})`);

      if (caseCards > 0) {
        await page.locator(".preview-item-card").first().click();
        await page.waitForTimeout(200);
        const activeCount = await page.locator(".preview-item-card.active").count();
        results.push({ vp: vp.name, check: "case card click → active", pass: activeCount > 0 });
        log(`  ${activeCount > 0 ? "✓" : "✗"} case card active`);
      }
      await page.screenshot({ path: `${OUT}/${vp.name}-04-cases.png`, fullPage: false });
    } else {
      results.push({ vp: vp.name, check: "case cards visible", pass: false });
      log(`  ✗ cases chip not visible`);
    }

    // 9. All 7 section chips functional (click each, inspector updates)
    const allChipLabels = ["히어로", "소개", "서비스", "사례", "블로그", "작업 절차", "문의"];
    let chipSwitchPass = 0;
    for (const label of allChipLabels) {
      const chip = page.locator(".editor-section-chip", { hasText: label });
      if (await chip.isVisible().catch(() => false)) {
        await chip.scrollIntoViewIfNeeded();
        await chip.click();
        await page.waitForTimeout(200);
        const isActive = await chip.evaluate(el => el.classList.contains("active")).catch(() => false);
        if (isActive) chipSwitchPass++;
      }
    }
    results.push({ vp: vp.name, check: "all 7 section chips switchable", pass: chipSwitchPass === 7 });
    log(`  ${chipSwitchPass === 7 ? "✓" : "✗"} section chip switching (${chipSwitchPass}/7)`);

    await page.screenshot({ path: `${OUT}/${vp.name}-05-final.png`, fullPage: false });
    await page.close();
  }

  await browser.close();

  // Summary
  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\n========== RESULTS: ${passed}/${total} passed ==========`);
  const failures = results.filter((r) => !r.pass);
  for (const r of failures) {
    console.log(`  ✗ [${r.vp}] ${r.check}`);
  }
  if (failures.length === 0) {
    console.log("  All checks passed.");
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
