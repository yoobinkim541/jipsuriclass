import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveWebAppUrl, deployTailOf } from "./_quoteSheetUrl";

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

    // 진단용: 실제 호출한 배포 ID 꼬리표(비밀 아님)와 상태를 남긴다 — 환경변수가
    // 최신 배포를 가리키는지, 401/404가 어느 배포에서 나는지 한눈에 확인하기 위함.
    const deployTail = deployTailOf(webAppUrl);
    const finalHost = (() => {
      try {
        return new URL(upstream.url).host;
      } catch {
        return "?";
      }
    })();

    const text = await upstream.text();
    const data = safeParse(text) as { sheetUrl?: string; pdfUrl?: string; sheetId?: string; error?: string } | null;
    // 시트 생성은 sheetUrl, PDF 생성은 pdfUrl을 돌려준다 — 둘 중 하나라도 있으면 성공.
    if (!upstream.ok || !data || typeof data !== "object" || data.error || (!data.sheetUrl && !data.pdfUrl)) {
      console.error(`[create-quote-sheet] 실패 status=${upstream.status} deploy=…${deployTail} finalHost=${finalHost} bodyHead=${text.slice(0, 120)}`);
      const upstreamError = data?.error;
      if (!upstreamError && (upstream.status === 401 || upstream.status === 403)) {
        // 401/403 = 웹앱이 익명 접근을 허용하지 않음(로그인 요구 페이지로 응답).
        throw new Error(
          `Apps Script 웹앱이 로그인 필요 상태입니다(${upstream.status}). 호출한 배포 …${deployTail}. ` +
            "① 환경변수 QUOTE_SHEET_WEBAPP_URL이 '모든 사용자'로 배포한 최신 주소인지, ② 변경 후 Vercel을 재배포했는지 확인해 주세요."
        );
      }
      throw new Error(upstreamError || `Apps Script 응답 오류 (${upstream.status}) · 배포 …${deployTail}`);
    }

    response.status(200).json({
      sheetUrl: data.sheetUrl ?? null,
      sheetId: data.sheetId ?? null,
      pdfUrl: data.pdfUrl ?? null
    });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : "구글시트 생성에 실패했습니다." });
  }
}

function safeParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
