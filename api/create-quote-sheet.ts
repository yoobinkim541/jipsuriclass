import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 견적을 대표님 구글 계정의 Apps Script 웹앱으로 보내 '견적완료건' 템플릿 시트를 생성한다.
 * 비밀키(QUOTE_SHEET_SECRET)를 함께 보내 웹앱이 검증한다. 키는 브라우저에 노출되지 않는다.
 *
 * 필요한 환경변수:
 *  - QUOTE_SHEET_WEBAPP_URL : Apps Script 웹앱 배포 URL (…/exec)
 *  - QUOTE_SHEET_SECRET     : 웹앱과 공유하는 비밀키
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.status(405).json({ error: "POST만 허용됩니다." });
    return;
  }

  const rawWebAppUrl = process.env.QUOTE_SHEET_WEBAPP_URL;
  const secret = process.env.QUOTE_SHEET_SECRET;
  if (!rawWebAppUrl || !secret) {
    response.status(503).json({
      error: "구글시트 연동이 아직 설정되지 않았습니다. QUOTE_SHEET_WEBAPP_URL / QUOTE_SHEET_SECRET 환경변수를 등록해 주세요."
    });
    return;
  }
  // QUOTE_SHEET_WEBAPP_URL에 전체 URL이 아니라 Apps Script 배포 ID(AKfycb…)나
  // 경로만 넣은 경우에도 동작하도록 전체 exec URL로 보정한다.
  const webAppUrl = resolveWebAppUrl(rawWebAppUrl);

  const payload = typeof request.body === "string" ? safeParse(request.body) : request.body;
  if (!payload || typeof payload !== "object") {
    response.status(400).json({ error: "잘못된 요청 본문입니다." });
    return;
  }

  try {
    const upstream = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
      redirect: "follow"
    });

    const text = await upstream.text();
    const data = safeParse(text);
    if (!upstream.ok || !data || typeof data !== "object" || !(data as { sheetUrl?: string }).sheetUrl) {
      throw new Error((data as { error?: string })?.error || `Apps Script 응답 오류 (${upstream.status})`);
    }

    response.status(200).json({
      sheetUrl: (data as { sheetUrl: string }).sheetUrl,
      pdfUrl: (data as { pdfUrl?: string }).pdfUrl ?? null
    });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "구글시트 생성에 실패했습니다." });
  }
}

/**
 * Apps Script 웹앱 주소를 정규화한다.
 *  - 전체 URL(https://…/exec) → 그대로
 *  - script.google.com/…       → https:// 보강
 *  - /macros/s/…/exec          → 호스트 보강
 *  - 배포 ID만(AKfycb…)         → https://script.google.com/macros/s/<id>/exec
 */
function resolveWebAppUrl(raw: string): string {
  const value = raw.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("script.google.com")) return `https://${value}`;
  if (value.startsWith("/macros/")) return `https://script.google.com${value}`;
  const id = value.replace(/^\/+|\/+$/g, "");
  return `https://script.google.com/macros/s/${id}/exec`;
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
