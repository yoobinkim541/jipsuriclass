import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

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
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${d}" />`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/g, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/g, `$1${d}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/g, `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/g, `$1${d}$2`);
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
