import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(selector);
  if (start === -1) return "";
  const open = css.indexOf("{", start);
  const close = css.indexOf("}\\n", open);
  return open === -1 || close === -1 ? "" : css.slice(open + 1, close);
}

test("desktop hero card deck only animates compositor-safe properties", () => {
  const css = readFileSync("src/styles.css", "utf8");
  const cardRule = cssBlock(css, ".hero__card");
  const roleRules = [".hero__card--main", ".hero__card--b", ".hero__card--c", ".hero__card--hidden"]
    .map((selector) => cssBlock(css, selector))
    .join("\\n");
  const layoutProperties = /\b(top|left|right|bottom|width|height)\b/;

  expect(cardRule).not.toMatch(/transition:[\s\S]*\b(top|left|right|bottom|width|height)\b/);
  expect(roleRules).not.toMatch(new RegExp(layoutProperties.source + "\\s*:"));
});

test("homepage default hero content mirrors the live first viewport", () => {
  const source = readFileSync("src/services/SiteContentService.ts", "utf8");

  expect(source).toContain('title: "집의 모든 불편을"');
  expect(source).toContain("사전 상담으로 증상을 먼저 확인하고, 현장 방문 후 꼭 필요한 작업만 진행합니다.");
  expect(source).toContain('{ num: "1000+", label: "시공 완료", sub: "대표 직접 시공 누적 현장" }');
});

test("desktop hero copy does not auto-rotate", () => {
  const source = readFileSync("src/App.tsx", "utf8");

  expect(source).not.toContain("setRotatorIndex");
  expect(source).not.toContain("setRotatorKey");
});
