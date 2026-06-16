/**
 * Apps Script 웹앱 주소 정규화 (create-quote-sheet / check-quote-sheet 공용).
 * 파일명이 '_'로 시작하므로 Vercel 라우트로 노출되지 않고 import 전용이다.
 */

/**
 * Apps Script 웹앱 주소를 정규화한다.
 *  - 전체 URL(https://…/exec) → 그대로(단, /exec 누락 시 보강)
 *  - script.google.com/…       → https:// 보강
 *  - /macros/s/…/exec          → 호스트 보강
 *  - 배포 ID만(AKfycb…)         → https://script.google.com/macros/s/<id>/exec
 */
export function resolveWebAppUrl(raw: string): string {
  const value = raw.trim();
  if (/^https?:\/\//i.test(value)) return ensureExec(value);
  if (value.startsWith("script.google.com")) return ensureExec(`https://${value}`);
  if (value.startsWith("/macros/")) return ensureExec(`https://script.google.com${value}`);
  const id = value.replace(/^\/+|\/+$/g, "");
  return `https://script.google.com/macros/s/${id}/exec`;
}

/** Apps Script 배포 URL인데 끝의 /exec 가 빠진 경우 붙여준다(붙어 있으면 그대로). */
function ensureExec(url: string): string {
  const cleaned = url.replace(/\/+$/, "");
  if (/\/macros\/s\/[^/]+$/.test(cleaned)) return `${cleaned}/exec`;
  return cleaned;
}

/** 배포 ID 끝 10자리(비밀 아님) — 진단·점검 메시지용. */
export function deployTailOf(url: string): string {
  return url.match(/\/s\/([^/]+)/)?.[1]?.slice(-10) ?? "?";
}
