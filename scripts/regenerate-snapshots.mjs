/**
 * public/area/* · public/service/* 정적 스냅샷 재생성.
 *
 * 랜딩 페이지 본문(크롤러가 보는 SEO 표면)은 public/<path>/index.html 에
 * 베이크되어 있어, landingPages.ts 데이터를 바꾸면 이 스크립트로 다시 떠야 한다.
 *
 * 사용법: npm run build 후 `node scripts/regenerate-snapshots.mjs`
 * (빌드 산출물을 vite preview 로 띄워 렌더링하므로 dist 가 최신이어야 한다.
 *  메타·에셋 경로·JSON-LD 는 이후 빌드의 patch-static-html.mjs 가 매번 덮어쓴다.)
 */
import { spawn } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

const paths = [];
for (const group of ["area", "service"]) {
  const dir = path.resolve("public", group);
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      paths.push(`/${group}/${entry.name}`);
    }
  }
}

console.log(`${paths.length}개 스냅샷 재생성 시작`);

const preview = spawn("npx", ["vite", "preview", "--port", String(PORT), "--host", "127.0.0.1"], {
  stdio: "ignore",
  detached: false
});

try {
  await waitForServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const pagePath of paths) {
    const page = await context.newPage();
    await page.goto(`${BASE}${pagePath}`, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const rendered = await page.evaluate(() => document.querySelector("#root")?.innerHTML?.length ?? 0);
    if (rendered < 1000) {
      console.error(`!! ${pagePath}: 본문이 비어 있어 건너뜀 (root ${rendered}자)`);
      await page.close();
      continue;
    }
    const html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
    const outDir = path.resolve("public", ...pagePath.split("/").filter(Boolean));
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, "index.html"), html, "utf8");
    console.log(`ok ${pagePath}`);
    await page.close();
  }

  await browser.close();
} finally {
  preview.kill("SIGTERM");
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("vite preview 서버가 뜨지 않았습니다");
}
