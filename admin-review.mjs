import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:4179";
const OUT = "./verify-screenshots/admin";
mkdirSync(OUT, { recursive: true });

const EXEC = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "desktop-1440", width: 1440, height: 900 }
];

const PAGES = [
  { path: "/admin", name: "admin-root-redirect" },
  { path: "/admin/login", name: "login" },
  { path: "/admin/inquiries", name: "inquiries" },
  { path: "/admin/analytics", name: "analytics" },
  { path: "/admin/editor", name: "editor" }
];

const IGNORABLE = [/net::ERR_/, /Failed to load resource/, /supabase/i, /naver/i, /kakao/i, /googleapis/i, /gstatic/i, /daumcdn/i, /Supabase environment/i];

const log = (m) => console.log(`[admin] ${m}`);

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const results = [];

  for (const vp of VIEWPORTS) {
    log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    for (const p of PAGES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        serviceWorkers: "block"
      });
      const page = await context.newPage();
      await page.route(/^https?:\/\//, (route) => {
        const url = route.request().url();
        if (url.startsWith(BASE) || url.includes("localhost") || url.includes("127.0.0.1")) return route.continue();
        return route.abort();
      });
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
      page.on("pageerror", (err) => pageErrors.push(String(err)));

      let loadOk = true;
      try {
        await page.goto(`${BASE}${p.path}`, { waitUntil: "load", timeout: 30000 });
        await page.waitForTimeout(1800);
      } catch (e) {
        loadOk = false;
        log(`  ✗ [${p.name}] load failed: ${e.message.split("\n")[0]}`);
      }

      const realConsoleErrors = consoleErrors.filter((t) => !IGNORABLE.some((re) => re.test(t)));
      const finalPath = await page.evaluate(() => location.pathname).catch(() => "?");
      const overflow = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth })).catch(() => null);
      const hasOverflow = overflow ? overflow.scrollW > overflow.clientW + 1 : null;
      const bodyText = await page.evaluate(() => document.body.innerText.length).catch(() => 0);

      // Admin-specific structural checks
      const adminShell = await page.evaluate(() =>
        !!document.querySelector(".admin-shell, .admin-top, .admin-sidebar, .editor-shell, .auth-shell, [class*='admin']")
      ).catch(() => false);

      const checks = [
        { check: "page loads", pass: loadOk },
        { check: "renders content (>50 chars)", pass: bodyText > 50 },
        { check: "admin chrome present", pass: adminShell },
        { check: "no JS page errors", pass: pageErrors.length === 0 },
        { check: "no app console errors", pass: realConsoleErrors.length === 0 },
        { check: "no horizontal overflow", pass: hasOverflow === false }
      ];
      for (const c of checks) results.push({ vp: vp.name, page: p.name, ...c });

      const failed = checks.filter((c) => !c.pass);
      log(`  ${failed.length === 0 ? "✓" : "✗"} ${p.name} (→ ${finalPath})` + (failed.length ? ` — ${failed.map((c) => c.check).join(", ")}` : ""));
      if (pageErrors.length) log(`     pageErrors: ${pageErrors.slice(0, 2).join(" | ")}`);
      if (realConsoleErrors.length) log(`     consoleErrors: ${realConsoleErrors.slice(0, 2).join(" | ")}`);
      if (hasOverflow) log(`     overflow: scrollW=${overflow.scrollW} clientW=${overflow.clientW}`);

      await page.screenshot({ path: `${OUT}/${vp.name}-${p.name}.png`, fullPage: false }).catch(() => {});
      await context.close();
    }
  }

  await browser.close();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n========== ADMIN RESULTS: ${passed}/${results.length} passed ==========`);
  for (const r of results.filter((r) => !r.pass)) console.log(`  ✗ [${r.vp}] [${r.page}] ${r.check}`);
  if (results.every((r) => r.pass)) console.log("  All admin checks passed.");
}

run().catch((err) => { console.error(err); process.exit(1); });
