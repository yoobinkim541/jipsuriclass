function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createReportStorage({ supabaseUrl, serviceRoleKey, fetchImpl = globalThis.fetch } = {}) {
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

  async function request(url, options) {
    const response = await fetchImpl(url, options);
    const payload = parseResponseBody(await response.text());
    if (!response.ok) {
      const detail = payload && typeof payload === "object" ? payload.message ?? payload.hint ?? "Supabase request failed" : "Supabase request failed";
      throw new Error(detail);
    }
    return payload;
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
