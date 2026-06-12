import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const GENERATED_PAGES = [
  "/service/plumbing/pricing",
  "/service/electric/pricing",
  "/service/leak/pricing",
  "/service/bathroom/pricing",
  "/service/door/pricing",
  "/service/window/pricing",
  "/service/carpentry/pricing",
  "/service/wallpaper/pricing",
  "/service/wallpaper-floor/pricing",
  "/service/tile/pricing",
  "/service/paint/pricing",
  "/service/exterior/pricing",
  "/diagnosis",
  "/estimate"
];

const SITE_URL = "https://www.jipsuriclass.kr";

const distRoot = path.resolve("dist");
const indexHtmlPath = path.join(distRoot, "index.html");
const indexHtml = await readFile(indexHtmlPath, "utf8");
const seo = await loadSeoModule();

const scriptMatch = indexHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const styleMatch = indexHtml.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);

if (!scriptMatch) {
  throw new Error("Unable to locate the main JavaScript bundle in dist/index.html");
}

const scriptPath = scriptMatch[1];
const stylePath = styleMatch?.[1];

await generateSpaPages();

const htmlFiles = await collectHtmlFiles(distRoot);

for (const filePath of htmlFiles) {
  const original = await readFile(filePath, "utf8");
  let updated = original.replace(/\/assets\/index-[^"]+\.js/g, scriptPath);

  if (stylePath) {
    updated = updated.replace(/\/assets\/index-[^"]+\.css/g, stylePath);
  }

  updated = applySeo(updated, toPagePath(filePath));

  if (updated !== original) {
    await writeFile(filePath, updated, "utf8");
  }
}

async function generateSpaPages() {
  for (const pagePath of GENERATED_PAGES) {
    const dirPath = path.join(distRoot, ...pagePath.split("/").filter(Boolean));
    await mkdir(dirPath, { recursive: true });
    await writeFile(path.join(dirPath, "index.html"), indexHtml, "utf8");
  }
}

/**
 * Bake the same SEO output the client computes (src/seo.ts) into the static
 * HTML so crawlers that do not execute JavaScript (e.g. Naver) see it too.
 * The client removes/replaces `script[data-seo="json-ld"]` on load, so the
 * baked JSON-LD never duplicates in rendered DOM.
 */
function applySeo(html, pagePath) {
  const config = seo.getSeoConfigForPath(pagePath);
  const title = config.title;
  const description = config.description;
  const url = `${SITE_URL}${config.path}`;
  const image = config.image ?? `${SITE_URL}/og-image.png`;
  const robots = config.noindex ? "noindex,nofollow" : "index,follow";

  let updated = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, `<meta name="robots" content="${robots}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapeHtml(image)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
    .replace(/<meta\s+name="twitter:description"[\s\S]*?\/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);

  updated = updated.replace(/\s*<script type="application\/ld\+json" data-seo="json-ld">[\s\S]*?<\/script>/g, "");
  if (config.jsonLd?.length) {
    const jsonLd = `    <script type="application/ld+json" data-seo="json-ld">${JSON.stringify(config.jsonLd).replace(/</g, "\\u003c")}</script>\n  </head>`;
    updated = updated.replace(/<\/head>/, jsonLd);
  }

  return updated;
}

async function loadSeoModule() {
  const outfile = path.resolve("node_modules/.cache/seo-prerender.mjs");
  await build({
    entryPoints: [path.resolve("src/seo.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    alias: { "lucide-react": path.resolve("scripts/lucide-stub.cjs") },
    outfile,
    logLevel: "silent"
  });
  const module = await import(pathToFileURL(outfile).href);
  await rm(outfile, { force: true });
  return module;
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

function toPagePath(filePath) {
  const relative = path.relative(distRoot, filePath);
  const directory = path.dirname(relative).replaceAll(path.sep, "/");
  return directory === "." ? "/" : `/${directory}`;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
