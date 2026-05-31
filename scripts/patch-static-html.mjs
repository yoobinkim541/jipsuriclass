import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const PRICING_PAGES = [
  { pagePath: "/service/plumbing/pricing", serviceName: "종합 설비" },
  { pagePath: "/service/electric/pricing", serviceName: "전기" },
  { pagePath: "/service/leak/pricing", serviceName: "누수 탐지·보수" },
  { pagePath: "/service/bathroom/pricing", serviceName: "욕실 수리" },
  { pagePath: "/service/door/pricing", serviceName: "도어 수리" },
  { pagePath: "/service/window/pricing", serviceName: "창문·방충망" },
  { pagePath: "/service/carpentry/pricing", serviceName: "목공·인테리어" },
  { pagePath: "/service/wallpaper/pricing", serviceName: "도배" },
  { pagePath: "/service/wallpaper-floor/pricing", serviceName: "도배·바닥" },
  { pagePath: "/service/tile/pricing", serviceName: "타일" },
  { pagePath: "/service/paint/pricing", serviceName: "페인트" },
  { pagePath: "/service/exterior/pricing", serviceName: "외부 부분보수" },
];

const SITE_URL = "https://www.jipsuriclass.kr";

const distRoot = path.resolve("dist");
const indexHtmlPath = path.join(distRoot, "index.html");
const indexHtml = await readFile(indexHtmlPath, "utf8");
const landingPageMeta = await loadLandingPageMeta();

const scriptMatch = indexHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const styleMatch = indexHtml.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);

if (!scriptMatch) {
  throw new Error("Unable to locate the main JavaScript bundle in dist/index.html");
}

const scriptPath = scriptMatch[1];
const stylePath = styleMatch?.[1];
const htmlFiles = await collectHtmlFiles(distRoot);

for (const filePath of htmlFiles) {
  const original = await readFile(filePath, "utf8");
  let updated = original.replace(/\/assets\/index-[^"]+\.js/g, scriptPath);

  if (stylePath) {
    updated = updated.replace(/\/assets\/index-[^"]+\.css/g, stylePath);
  }

  const pagePath = toPagePath(filePath);
  const meta = landingPageMeta.get(pagePath);
  if (meta) {
    updated = replaceTitleAndDescription(updated, meta);
  }

  if (updated !== original) {
    await writeFile(filePath, updated, "utf8");
  }
}

await generatePricingPages();

async function generatePricingPages() {
  for (const { pagePath, serviceName } of PRICING_PAGES) {
    const title = `${serviceName} 가격표 | 집수리클라쓰`;
    const description = `집수리클라쓰 ${serviceName} 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.`;
    const url = `${SITE_URL}${pagePath}`;

    let html = indexHtml;
    if (stylePath) {
      html = html.replace(/\/assets\/index-[^"]+\.css/g, stylePath);
    }
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
      .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
      .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
      .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
      .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
      .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);

    const dirPath = path.join(distRoot, ...pagePath.split("/").filter(Boolean));
    await mkdir(dirPath, { recursive: true });
    await writeFile(path.join(dirPath, "index.html"), html, "utf8");
  }
}

async function collectHtmlFiles(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && entry.name === "index.html") {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadLandingPageMeta() {
  const source = await readFile(path.resolve("src/landingPages.ts"), "utf8");
  const meta = new Map();
  const pagePattern = /\{\s*path:\s*"((?:\/service|\/area)\/[^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/g;
  let match;

  while ((match = pagePattern.exec(source))) {
    meta.set(match[1], {
      title: decodeStringLiteral(match[2]),
      description: decodeStringLiteral(match[3])
    });
  }

  return meta;
}

function toPagePath(filePath) {
  const relative = path.relative(distRoot, filePath);
  const directory = path.dirname(relative).replaceAll(path.sep, "/");
  return directory === "." ? "/" : `/${directory}`;
}

function replaceTitleAndDescription(html, meta) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*" \/>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`
    );
}

function decodeStringLiteral(value) {
  return value.replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
