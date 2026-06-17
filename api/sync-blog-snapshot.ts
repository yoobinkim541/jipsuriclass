import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * 블로그 글을 받아 site_content(id="blog-snapshot")에 저장하는 동기화 엔드포인트.
 * GitHub Actions cron(또는 수동)으로 호출되며, 사용자 세션이 없으므로
 * 서비스 롤 키로 RLS를 우회해 upsert한다. BLOG_SYNC_SECRET으로 호출을 보호한다.
 *
 * 필요한 환경변수:
 *  - VITE_SUPABASE_URL              (기존)
 *  - SUPABASE_SERVICE_ROLE_KEY      (신규 — Supabase 프로젝트 설정의 service_role 키)
 *  - BLOG_SYNC_SECRET               (신규 — 임의의 긴 토큰)
 */
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const syncSecret = process.env.BLOG_SYNC_SECRET;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST" && request.method !== "GET") {
    response.setHeader("Allow", "POST, GET");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const provided =
    (typeof request.headers["x-sync-secret"] === "string" && request.headers["x-sync-secret"]) ||
    (typeof request.query.secret === "string" && request.query.secret) ||
    "";
  if (!syncSecret || provided !== syncSecret) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!supabaseUrl || !serviceRoleKey) {
    response.status(500).json({ error: "Missing Supabase service configuration" });
    return;
  }

  try {
    // 같은 배포의 블로그 API에서 전체 글을 받아온다.
    const host = request.headers["x-forwarded-host"] || request.headers.host;
    const proto = (request.headers["x-forwarded-proto"] as string) || "https";
    const origin = host ? `${proto}://${host}` : "";
    const blogResponse = await fetch(`${origin}/api/naver-blog?mode=all`);
    const blogPayload = (await blogResponse.json().catch(() => ({}))) as { items?: unknown[] };
    const items = Array.isArray(blogPayload.items) ? blogPayload.items : [];

    if (!items.length) {
      // 빈 결과로 기존 스냅샷을 덮어쓰지 않는다(네이버 일시 장애 보호).
      response.status(502).json({ ok: false, error: "No blog items fetched; snapshot left unchanged" });
      return;
    }

    const upsert = await fetch(`${supabaseUrl}/rest/v1/site_content?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        id: "blog-snapshot",
        payload: { items, syncedAt: new Date().toISOString() }
      })
    });

    if (!upsert.ok) {
      const text = await upsert.text().catch(() => "");
      console.error("[sync-blog-snapshot] upsert failed", upsert.status, text);
      response.status(502).json({ ok: false, error: "Snapshot upsert failed" });
      return;
    }

    response.status(200).json({ ok: true, count: items.length });
  } catch (error) {
    console.error("[sync-blog-snapshot] error", error instanceof Error ? error.message : error);
    response.status(500).json({ ok: false, error: "Sync failed" });
  }
}
