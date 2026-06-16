import type { VercelRequest, VercelResponse } from "@vercel/node";
import { resolveWebAppUrl, deployTailOf } from "./_quoteSheetUrl";

/**
 * 구글시트 연동 상태 점검 — Apps Script 웹앱에 GET(doGet)으로 핑을 보내
 * '정상 / 로그인필요(401) / 미설정 / 오류'를 돌려준다. 발행을 눌러보지 않고도
 * 환경변수·배포 상태를 확인하기 위한 진단용. 비밀키는 사용하지 않는다(읽기 핑).
 */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const rawWebAppUrl = process.env.QUOTE_SHEET_WEBAPP_URL;
  const secret = process.env.QUOTE_SHEET_SECRET;

  if (!rawWebAppUrl) {
    response.status(200).json({ ok: false, state: "unconfigured", message: "환경변수 QUOTE_SHEET_WEBAPP_URL 미설정" });
    return;
  }
  if (!secret) {
    response.status(200).json({ ok: false, state: "unconfigured", message: "환경변수 QUOTE_SHEET_SECRET 미설정" });
    return;
  }

  const webAppUrl = resolveWebAppUrl(rawWebAppUrl);
  const deployTail = deployTailOf(webAppUrl);

  try {
    const upstream = await fetch(webAppUrl, { method: "GET", redirect: "follow" });
    const text = await upstream.text();
    let pingedOk = false;
    try {
      pingedOk = (JSON.parse(text) as { ok?: boolean })?.ok === true;
    } catch {
      pingedOk = false;
    }

    if (pingedOk) {
      response.status(200).json({ ok: true, state: "ok", deployTail, message: `정상 연결됨 (배포 …${deployTail})` });
      return;
    }
    if (upstream.status === 401 || upstream.status === 403) {
      response.status(200).json({
        ok: false,
        state: "unauthorized",
        deployTail,
        message: `로그인 필요(${upstream.status}) — Apps Script 웹앱 액세스를 '모든 사용자'로 배포했는지 확인 (배포 …${deployTail})`
      });
      return;
    }
    response.status(200).json({
      ok: false,
      state: "error",
      deployTail,
      message: `웹앱 응답 이상 (HTTP ${upstream.status}, 배포 …${deployTail}) — 환경변수 주소/재배포 확인`
    });
  } catch (error) {
    response.status(200).json({
      ok: false,
      state: "error",
      deployTail,
      message: error instanceof Error ? `연결 실패: ${error.message}` : "연결 실패"
    });
  }
}
