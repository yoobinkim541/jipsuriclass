function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createReportStorage({
  supabaseUrl,
  serviceRoleKey,
  fetchImpl = globalThis.fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxRetries = 2,
  retryDelayMs = 800,
} = {}) {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("A Supabase URL and service role key are required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/naver_sa_daily_reports`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };

  // naver-search-ad.mjs와 동일하게 net-level 실패도 재시도한다 — 이 요청들은 runReport에서
  // try/catch로 감싸 실패해도 리포트 자체는 계속 진행되지만, 몇 초짜리 순단으로 매번
  // 이력 조회·저장을 건너뛰게 되는 걸 줄인다.
  async function request(url, options) {
    let attempt = 0;
    while (true) {
      let response;
      try {
        response = await fetchImpl(url, options);
      } catch (networkError) {
        if (attempt >= maxRetries) {
          throw new Error(`Supabase network request failed: ${networkError.message}`, { cause: networkError });
        }
        await sleep(retryDelayMs * 2 ** attempt);
        attempt += 1;
        continue;
      }

      const payload = parseResponseBody(await response.text());
      if (!response.ok) {
        const detail = payload && typeof payload === "object" ? payload.message ?? payload.hint ?? "Supabase request failed" : "Supabase request failed";
        const canRetry = (response.status === 429 || response.status >= 500) && attempt < maxRetries;
        if (!canRetry) {
          throw new Error(detail);
        }
        await sleep(retryDelayMs * 2 ** attempt);
        attempt += 1;
        continue;
      }
      return payload;
    }
  }

  return {
    async listRecentReports({ customerId, beforeDate, limit = 7 }) {
      const url = new URL(endpoint);
      url.searchParams.set("customer_id", `eq.${customerId}`);
      url.searchParams.set("report_date", `lt.${beforeDate}`);
      url.searchParams.set("select", "report_date,totals");
      url.searchParams.set("order", "report_date.desc");
      url.searchParams.set("limit", String(limit));
      const payload = await request(url.toString(), { method: "GET", headers });
      return Array.isArray(payload) ? payload : [];
    },

    async upsertReport({ reportDate, customerId, totals, campaigns, recommendations, keywordIdeas }) {
      const url = new URL(endpoint);
      url.searchParams.set("on_conflict", "report_date,customer_id");
      await request(url.toString(), {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify([{
          report_date: reportDate,
          customer_id: String(customerId),
          totals,
          campaigns,
          recommendations,
          keyword_ideas: keywordIdeas,
          updated_at: new Date().toISOString(),
        }]),
      });
    },
  };
}
