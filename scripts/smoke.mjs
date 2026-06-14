#!/usr/bin/env node
// 배포 게이트용 빌드 산출물 스모크 — 결정적, 서버/네트워크 불필요.
// 빌드가 정상적인 dist 를 만들었는지 검증한다. 통과 못하면 exit 1 → 배포 중단.
// 테스트용으로 SMOKE_DIST 환경변수로 검사 대상 디렉터리를 바꿀 수 있다 (기본 dist).
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = process.env.SMOKE_DIST || "dist";
const fails = [];
const ok = [];

function check(label, fn) {
  try {
    const detail = fn();
    ok.push(`${label}${detail ? " — " + detail : ""}`);
  } catch (e) {
    fails.push(`${label}: ${e.message}`);
  }
}

function read(rel) {
  const p = join(DIST, rel);
  if (!existsSync(p)) throw new Error(`없음 (${p})`);
  return readFileSync(p, "utf8");
}

// 1. 진입 HTML 이 정상적인가
check("index.html", () => {
  const html = read("index.html");
  if (html.length < 500) throw new Error(`너무 작음 (${html.length}B)`);
  if (!/<title>/i.test(html)) throw new Error("<title> 없음");
  if (!/집수리/.test(html)) throw new Error("브랜드 문구 '집수리' 없음");
  if (!/<script[\s>]/i.test(html)) throw new Error("번들 <script> 없음");
  return `${html.length}B`;
});

// 2. JS 번들이 실제로 빌드됐는가
check("assets 번들", () => {
  const dir = join(DIST, "assets");
  if (!existsSync(dir)) throw new Error("dist/assets 없음");
  const js = readdirSync(dir).filter((f) => f.endsWith(".js"));
  if (js.length === 0) throw new Error(".js 번들 없음");
  const biggest = Math.max(...js.map((f) => statSync(join(dir, f)).size));
  if (biggest < 10_000) throw new Error(`번들이 비정상적으로 작음 (${biggest}B)`);
  return `${js.length}개 / 최대 ${(biggest / 1024).toFixed(0)}KB`;
});

// 3. 사전 렌더된 SEO 페이지 + postbuild 패치가 적용됐는가
check("사전 렌더 서비스 페이지", () => {
  const sample = "service/leak/index.html";
  const html = read(sample);
  if (html.length < 500) throw new Error(`${sample} 너무 작음`);
  if (!/<title>/i.test(html)) throw new Error(`${sample} <title> 없음`);
  return sample;
});

// 4. 핵심 정적 파일
for (const f of ["sitemap.xml", "manifest.webmanifest", "robots.txt"]) {
  check(f, () => {
    read(f);
    return "있음";
  });
}

// 결과
console.log(`smoke 대상: ${DIST}`);
for (const o of ok) console.log(`  ✓ ${o}`);
for (const f of fails) console.log(`  ✗ ${f}`);

if (fails.length) {
  console.error(`\nSMOKE 실패 — ${fails.length}개 검사 실패. 배포 중단.`);
  process.exit(1);
}
console.log(`\nSMOKE 통과 — ${ok.length}개 검사 OK.`);
