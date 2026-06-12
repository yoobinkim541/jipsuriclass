import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:5174";
const OUT = "./verify-screenshots/full";
mkdirSync(OUT, { recursive: true });

const EXEC = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 }
];

const PAGES = [
  { path: "/", name: "home" },
  { path: "/service/bathroom", name: "service-bathroom" },
  { path: "/area/namyangju", name: "area-namyangju" },
  { path: "/diagnosis", name: "diagnosis" },
  { path: "/estimate", name: "estimate" },
  { path: "/admin/login", name: "admin-login" },
  { path: "/admin", name: "admin" }
];

// External hosts are blocked in this sandbox; their fetch failures are expected.
const IGNORABLE = [/net::ERR_/, /Failed to load resource/, /supabase/i, /naver/i, /kakao/i, /googleapis/i, /gstatic/i];

const log = (m) => console.log(`[verify] ${m}`);

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const results = [];

  for (const vp of VIEWPORTS) {
    log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    for (const p of PAGES) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      let loadOk = true;
      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(1500);
      } catch (e) {
        loadOk = false;
        log(`  ✗ [${p.name}] load failed: ${e.message.split("\n")[0]}`);
      }

      const realConsoleErrors = consoleErrors.filter((t) => !IGNORABLE.some((re) => re.test(t)));

      const overflow = await page
        .evaluate(() => {
          const doc = document.documentElement;
          return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
        })
        .catch(() => null);
      const hasOverflow = overflow ? overflow.scrollW > overflow.clientW + 1 : null;

      const bodyText = await page.evaluate(() => document.body.innerText.length).catch(() => 0);
      const rendered = bodyText > 50;

      const checks = [
        { check: "page loads", pass: loadOk },
        { check: "renders content", pass: rendered },
        { check: "no JS page errors", pass: pageErrors.length === 0 },
        { check: "no app console errors", pass: realConsoleErrors.length === 0 },
        { check: "no horizontal overflow", pass: hasOverflow === false }
      ];
      for (const c of checks) results.push({ vp: vp.name, page: p.name, ...c });

      const failed = checks.filter((c) => !c.pass);
      log(
        `  ${failed.length === 0 ? "✓" : "✗"} ${p.name}` +
          (failed.length ? ` — failed: ${failed.map((c) => c.check).join(", ")}` : "")
      );
      if (pageErrors.length) log(`     pageErrors: ${pageErrors.slice(0, 3).join(" | ")}`);
      if (realConsoleErrors.length) log(`     consoleErrors: ${realConsoleErrors.slice(0, 3).join(" | ")}`);
      if (hasOverflow) log(`     overflow: scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);

      await page.screenshot({ path: `${OUT}/${vp.name}-${p.name}.png`, fullPage: false }).catch(() => {});
      await page.close();
    }
  }

  await browser.close();

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n========== RESULTS: ${passed}/${results.length} passed ==========`);
  for (const r of results.filter((r) => !r.pass)) {
    console.log(`  ✗ [${r.vp}] [${r.page}] ${r.check}`);
  }
  if (results.every((r) => r.pass)) console.log("  All checks passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
