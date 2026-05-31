import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4174';
const routes = ['/admin', '/admin/inquiries', '/admin/login', '/account', '/login'];
const viewports = [
  ['mobile-320', 320, 800],
  ['mobile-360', 360, 800],
  ['mobile-390', 390, 844],
  ['tablet-768', 768, 1024],
  ['laptop-1366', 1366, 768],
  ['desktop-1920', 1920, 1080]
];

const browser = await chromium.launch({ headless: true });
const results = [];

for (const [label, width, height] of viewports) {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const consoleMessages = [];
    const pageErrors = [];
    page.on('console', (msg) => {
      if (['error', 'warning'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => pageErrors.push(err.message));
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const selectors = [
        '.admin-header', '.admin-home', '.admin-nav', '.admin-actions', '.admin-email',
        '.admin-hero', '.admin-login-card', '.admin-toolbar', '.admin-queue-panel',
        '.admin-insight-grid', '.admin-list', '.editor-workspace', '.editor-preview-panel',
        '.auth-card', '.account-summary-grid', '.account-list-section', '.account-list-head'
      ];
      const overflowing = Array.from(document.querySelectorAll('body *'))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          return rect.right > window.innerWidth + 1 || rect.left < -1;
        })
        .slice(0, 20)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            cls: el.className?.toString?.().slice(0, 140) ?? '',
            text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 100),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          };
        });
      const selected = Object.fromEntries(selectors.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return [sel, null];
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return [sel, {
          display: style.display,
          gridTemplateColumns: style.gridTemplateColumns,
          flexDirection: style.flexDirection,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 120)
        }];
      }));
      const smallTaps = Array.from(document.querySelectorAll('button,a,input,select,textarea'))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          return rect.height < 36 || rect.width < 36;
        })
        .slice(0, 20)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), cls: el.className?.toString?.().slice(0, 80) ?? '', text: (el.textContent ?? '').trim().slice(0, 60), width: Math.round(rect.width), height: Math.round(rect.height) };
        });
      return {
        title: document.title,
        statusText: body.innerText.slice(0, 500).replace(/\s+/g, ' '),
        innerWidth: window.innerWidth,
        scrollWidth: doc.scrollWidth,
        bodyScrollWidth: body.scrollWidth,
        overflowX: Math.max(doc.scrollWidth, body.scrollWidth) - window.innerWidth,
        height: doc.scrollHeight,
        overflowing,
        smallTaps,
        selected
      };
    });
    const pathName = route.replace(/\//g, '_') || '_root';
    const screenshot = `/tmp/jipsuri-${label}${pathName}.png`;
    await page.screenshot({ path: screenshot, fullPage: true });
    results.push({ label, width, height, route, httpStatus: response?.status(), consoleMessages, pageErrors, screenshot, metrics });
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
