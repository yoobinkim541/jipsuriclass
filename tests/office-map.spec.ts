import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("desktop office map uses Naver Maps SDK instead of blocked iframe embed", () => {
  const source = readFileSync("src/components/NaverMapEmbed.tsx", "utf8");

  expect(source).not.toContain("<iframe");
  expect(source).not.toContain("map.naver.com/p/entry/place");
  expect(source).toContain("loadNaverMapsSdk");
  expect(source).toContain("geocodeNaverAddress");
  expect(source).toContain("office-map-live");
});
