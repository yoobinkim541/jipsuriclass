import type { VercelRequest, VercelResponse } from "@vercel/node";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * 구글 시트를 xlsx로 export해 그대로 전달하는 프록시.
 * 브라우저에서 docs.google.com을 직접 fetch하면 CORS로 막히므로 서버에서 받아온다.
 * 시트는 '링크가 있는 모든 사용자: 보기'로 공유돼 있어야 접근 가능하다.
 */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  const id = String(request.query.id || "").trim();
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    response.status(400).setHeader("Content-Type", "text/plain; charset=utf-8").send("Invalid sheet id");
    return;
  }

  const exportUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`;

  try {
    const upstream = await fetch(exportUrl, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0", Accept: XLSX_MIME + ",*/*" }
    });

    const contentType = upstream.headers.get("content-type") || "";
    // 비공개 시트는 로그인/권한 HTML 페이지를 반환한다 → xlsx가 아니면 접근 불가로 처리.
    if (!upstream.ok || contentType.includes("text/html")) {
      throw new Error(`Sheet not accessible (${upstream.status})`);
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    response.setHeader("Content-Type", XLSX_MIME);
    response.setHeader("Cache-Control", "no-store");
    response.status(200).send(buffer);
  } catch (error) {
    response
      .status(502)
      .setHeader("Content-Type", "text/plain; charset=utf-8")
      .send("Google Sheet is not accessible. Share it as '링크가 있는 모든 사용자: 보기'.");
  }
}
