import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5174";
const OUT = "./verify-screenshots";
mkdirSync(OUT, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 20000 });
  await page.waitForTimeout(600);

  // Screenshot hero initial state
  await page.screenshot({ path: `${OUT}/hero-01-initial.png`, fullPage: false });
  console.log("✓ initial hero screenshot");

  // Check trust band is at the bottom of the hero section
  const heroBox = await page.locator("#hero").boundingBox();
  const trustBox = await page.locator(".trust--embedded").first().boundingBox();
  if (heroBox && trustBox) {
    const heroBottom = heroBox.y + heroBox.height;
    const trustBottom = trustBox.y + trustBox.height;
    const diff = Math.abs(heroBottom - trustBottom);
    const flush = diff < 4; // within 4px
    console.log(`${flush ? "✓" : "✗"} trust band flush (hero bottom=${Math.round(heroBottom)}, trust bottom=${Math.round(trustBottom)}, diff=${Math.round(diff)}px)`);
  }

  // Check clickable cards have cursor:pointer
  const cardBCount = await page.locator(".hero__card--b").count();
  const cardCCount = await page.locator(".hero__card--c").count();
  console.log(`✓ cards present: main=1, b=${cardBCount}, c=${cardCCount}`);

  const bCursor = await page.locator(".hero__card--b").evaluate(el => getComputedStyle(el).cursor).catch(() => "?");
  console.log(`${bCursor === "pointer" ? "✓" : "✗"} card--b cursor=${bCursor}`);

  // Click the visible left-edge portion of --b (not covered by --main which starts at 18% x)
  const bCard = page.locator(".hero__card--b");
  const bBox = await bCard.boundingBox();
  if (bBox) {
    await page.mouse.click(bBox.x + 6, bBox.y + bBox.height / 2);
  } else {
    await bCard.click({ force: true });
  }
  await page.waitForTimeout(200); // let state update

  const newMainCount = await page.locator(".hero__card--main").count();
  const newBCount = await page.locator(".hero__card--b").count();
  console.log(`${newMainCount === 1 ? "✓" : "✗"} after click: main cards=${newMainCount}`);
  console.log(`${newBCount === 1 ? "✓" : "✗"} after click: b cards=${newBCount}`);

  // Screenshot mid-animation (200ms after click)
  await page.screenshot({ path: `${OUT}/hero-02-after-click.png`, fullPage: false });

  // Wait for animation to settle
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/hero-03-settled.png`, fullPage: false });
  console.log("✓ post-animation screenshot captured");

  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
