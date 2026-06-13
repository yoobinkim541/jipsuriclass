import { chromium, devices } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL || "http://localhost:4179";
const OUT = "./verify-screenshots/mobile-ux";
mkdirSync(OUT, { recursive: true });
const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const PAGES = [
  { path: "/", name: "home" },
  { path: "/service/bathroom", name: "service" },
  { path: "/service/bathroom/pricing", name: "pricing" },
  { path: "/area/namyangju", name: "area" },
  { path: "/diagnosis", name: "diagnosis" },
  { path: "/estimate", name: "estimate" },
  { path: "/portfolio", name: "portfolio" },
  { path: "/login", name: "login" },
  { path: "/mypage", name: "mypage" }
];

const iphone = devices["iPhone 12"];

async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: EXEC });
  const ctx = await browser.newContext({ ...iphone, serviceWorkers: "block" });
  await ctx.route(/^https?:\/\//, (route) => {
    const u = route.request().url();
    return u.includes("localhost") || u.includes("127.0.0.1") ? route.continue() : route.abort();
  });

  for (const p of PAGES) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${BASE}${p.path}`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(1800);
    } catch (e) {
      console.log(`[${p.name}] load error: ${e.message.split("\n")[0]}`);
    }

    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;

      // Small tap targets (interactive els < 40px in either dimension, visible)
      const interactive = [...document.querySelectorAll("a, button, input, select, [role=button]")];
      const smallTargets = [];
      for (const el of interactive) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") continue;
        if (r.top > window.innerHeight * 3) continue; // only first few screens
        if ((r.height < 36 || r.width < 36)) {
          const label = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.tagName).trim().slice(0, 24);
          smallTargets.push(`${Math.round(r.width)}x${Math.round(r.height)} "${label}"`);
        }
      }

      // Tiny font sizes on visible text
      const textEls = [...document.querySelectorAll("p, span, a, li, button, label, small")];
      const tiny = new Set();
      for (const el of textEls) {
        if (!el.innerText || !el.innerText.trim()) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.top > window.innerHeight * 3) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 12) tiny.add(`${fs}px "${el.innerText.trim().slice(0, 20)}"`);
      }

      // Fixed/sticky bottom CTA height (to assess content overlap)
      let fixedBottom = null;
      for (const el of document.querySelectorAll("*")) {
        const s = getComputedStyle(el);
        if ((s.position === "fixed" || s.position === "sticky") && parseFloat(s.bottom) === 0) {
          const r = el.getBoundingClientRect();
          if (r.height > 20 && r.width > vw * 0.5) { fixedBottom = { h: Math.round(r.height), cls: el.className?.toString().slice(0, 40) }; break; }
        }
      }

      const doc = document.documentElement;
      return {
        overflowX: doc.scrollWidth > doc.clientWidth + 1 ? `${doc.scrollWidth}>${doc.clientWidth}` : "ok",
        pageH: Math.round(doc.scrollHeight),
        smallTargets: smallTargets.slice(0, 8),
        smallTargetCount: smallTargets.length,
        tiny: [...tiny].slice(0, 6),
        fixedBottom
      };
    }).catch((e) => ({ error: e.message }));

    console.log(`\n=== ${p.name} (${p.path}) ===`);
    console.log(JSON.stringify(info, null, 1));

    await page.screenshot({ path: `${OUT}/${p.name}-full.png`, fullPage: true }).catch(() => {});
    await page.screenshot({ path: `${OUT}/${p.name}-fold.png`, fullPage: false }).catch(() => {});
    await page.close();
  }

  await browser.close();
}
run().catch((e) => { console.error(e); process.exit(1); });
