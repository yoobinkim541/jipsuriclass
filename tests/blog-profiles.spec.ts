import { expect, test } from "@playwright/test";
import { getServiceBlogProfile, getServiceBlogProfiles } from "../src/services/BlogMatchingProfiles";

test("service blog profiles include the expected service routes", () => {
  const profiles = getServiceBlogProfiles();
  expect(Object.keys(profiles).sort()).toEqual([
    "/service/bathroom",
    "/service/carpentry",
    "/service/door",
    "/service/electric",
    "/service/exterior",
    "/service/interior-film",
    "/service/leak",
    "/service/paint",
    "/service/plumbing",
    "/service/tile",
    "/service/wallpaper",
    "/service/wallpaper-floor",
    "/service/waterproofing",
    "/service/waterproofing-tile",
    "/service/window"
  ]);
});

test("tile profile keeps strict exclusions and category targeting", () => {
  const profile = getServiceBlogProfile("/service/tile");
  expect(profile).toBeTruthy();
  expect(profile?.categoryNos).toEqual([40, 31]);
  expect(profile?.matchTerms).toContain("타일");
  expect(profile?.matchTerms).toContain("욕실");
  expect(profile?.excludeTerms).toContain("문필름");
  expect(profile?.excludeTerms).toContain("방충망");
});

test("waterproofing-tile profile keeps floor and bathroom keywords together", () => {
  const profile = getServiceBlogProfile("/service/waterproofing-tile");
  expect(profile).toBeTruthy();
  expect(profile?.categoryNos).toEqual([40, 31]);
  expect(profile?.matchTerms).toContain("방수");
  expect(profile?.matchTerms).toContain("타일");
  expect(profile?.queryTerms).toContain("베란다");
});

test("exterior profile stays focused on facade repair", () => {
  const profile = getServiceBlogProfile("/service/exterior");
  expect(profile).toBeTruthy();
  expect(profile?.categoryNos).toEqual([31, 43]);
  expect(profile?.matchTerms).toContain("외벽");
  expect(profile?.matchTerms).toContain("드라이비트");
  expect(profile?.queryTerms).toContain("방수");
});

test("unknown routes do not return a blog profile", () => {
  expect(getServiceBlogProfile("/service/unknown")).toBeUndefined();
});
