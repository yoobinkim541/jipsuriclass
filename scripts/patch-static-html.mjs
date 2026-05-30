import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const distRoot = path.resolve("dist");
const indexHtmlPath = path.join(distRoot, "index.html");
const indexHtml = await readFile(indexHtmlPath, "utf8");

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
