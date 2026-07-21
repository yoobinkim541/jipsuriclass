import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test("legacy React app routes are not rewritten to the static home page", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    rewrites?: Array<{ source?: string; destination?: string }>;
  };
  const legacyRoutes = ["/admin", "/account", "/mypage", "/login", "/diagnosis", "/estimate"];
  const brokenRewrites = (config.rewrites ?? []).filter((rewrite) => {
    if (rewrite.destination !== "/") return false;
    return legacyRoutes.some((route) => rewrite.source === route || rewrite.source === route + "/:path*");
  });

  expect(brokenRewrites).toEqual([]);
});
