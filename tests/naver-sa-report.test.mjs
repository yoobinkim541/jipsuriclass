import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createNaverSearchAdClient,
  signRequest,
} from "../scripts/lib/naver-search-ad.mjs";
import {
  buildRecommendations,
  formatKstDate,
  formatReportMessage,
  summarizeCampaignStats,
} from "../scripts/lib/naver-sa-report.mjs";
import { createReportStorage } from "../scripts/lib/report-storage.mjs";
import { sendTelegramMessage } from "../scripts/lib/telegram.mjs";
import { runReport } from "../scripts/naver-sa-report.mjs";

test("signs the method and URI without query parameters", () => {
  assert.equal(
    signRequest({
      timestamp: "1700000000000",
      method: "GET",
      uri: "/stats",
      secretKey: "test-secret",
    }),
    "asZJ8mLjcxcEUkTtL6JvKk2WEPrOg6EVKOxuU5K5lC8=",
  );
});

test("rejects a customer ID that is not numeric", () => {
  assert.throws(
    () => createNaverSearchAdClient({ accessLicense: "license", secretKey: "secret", customerId: "customerId:12" }),
    /NAVER_SA_CUSTOMER_ID must contain digits only/,
  );
});

test("serializes repeated ids and JSON stats fields", async () => {
  const requests = [];
  const client = createNaverSearchAdClient({
    accessLicense: "license",
    secretKey: "secret",
    customerId: "123",
    now: () => 1700000000000,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    },
  });

  await client.getStats({
    ids: ["cmp-1", "cmp-2"],
    since: "2026-08-27",
    until: "2026-08-27",
  });

  assert.match(requests[0].url, /ids=cmp-1&ids=cmp-2/);
  assert.match(requests[0].url, /fields=%5B%22impCnt%22/);
  assert.equal(requests[0].options.headers["X-Customer"], "123");
  assert.equal(requests[0].options.headers["X-Timestamp"], "1700000000000");
});

test("retries a rate-limited request with exponential delay", async () => {
  let attempts = 0;
  const delays = [];
  const client = createNaverSearchAdClient({
    accessLicense: "license",
    secretKey: "secret",
    customerId: "123",
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return new Response(JSON.stringify({ message: "rate limited" }), { status: 429 });
      return new Response(JSON.stringify([]), { status: 200 });
    },
    sleep: async (delay) => delays.push(delay),
  });

  await client.listCampaigns();

  assert.equal(attempts, 2);
  assert.deepEqual(delays, [800]);
});

test("aggregates campaign stats and recalculates CTR and CPC", () => {
  const summary = summarizeCampaignStats(
    [{ nccCampaignId: "cmp-1", name: "누수 캠페인" }],
    [{ id: "cmp-1", impCnt: 1000, clkCnt: 20, salesAmt: 5000, ccnt: 2 }],
  );

  assert.deepEqual(summary.totals, {
    impressions: 1000,
    clicks: 20,
    cost: 5000,
    conversions: 2,
    ctr: 2,
    cpc: 250,
    costPerConversion: 2500,
  });
  assert.equal(summary.campaigns[0].name, "누수 캠페인");
});

test("recommends a tracking and landing check when traffic has no conversion", () => {
  const recommendations = buildRecommendations(
    {
      totals: {
        impressions: 500,
        clicks: 8,
        cost: 16000,
        conversions: 0,
        ctr: 1.6,
        cpc: 2000,
        costPerConversion: 0,
      },
      campaigns: [],
    },
    [],
  );

  assert.ok(recommendations.some((item) => item.includes("전환")));
});

test("formats a bounded Korean report message", () => {
  const message = formatReportMessage({
    reportDate: "2026-08-27",
    summary: {
      totals: {
        impressions: 100,
        clicks: 2,
        cost: 1000,
        conversions: 0,
        ctr: 2,
        cpc: 500,
        costPerConversion: 0,
      },
      campaigns: [],
    },
    recommendations: ["전환 추적을 확인하세요."],
    keywordIdeas: [],
  });

  assert.match(message, /네이버 광고 일일 리포트/);
  assert.match(message, /전환 추적/);
  assert.ok(message.length <= 4096);
});

test("formats a date in Korea Standard Time", () => {
  assert.equal(formatKstDate(new Date("2026-08-27T15:30:00.000Z")), "2026-08-28");
});

test("sends a plain text report to the Telegram chat", async () => {
  const requests = [];
  await sendTelegramMessage({
    token: "bot-token",
    chatId: "chat-1",
    text: "네이버 광고 일일 리포트",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    },
  });

  assert.equal(requests[0].url, "https://api.telegram.org/botbot-token/sendMessage");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    chat_id: "chat-1",
    text: "네이버 광고 일일 리포트",
    disable_web_page_preview: true,
  });
});

test("upserts a daily report through Supabase without exposing the key in the body", async () => {
  const requests = [];
  const storage = createReportStorage({
    supabaseUrl: "https://example.supabase.co",
    serviceRoleKey: "service-role-secret",
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return new Response("", { status: 201 });
    },
  });

  await storage.upsertReport({
    reportDate: "2026-08-27",
    customerId: "123",
    totals: { clicks: 2 },
    campaigns: [],
    recommendations: [],
    keywordIdeas: [],
  });

  assert.match(requests[0].url, /naver_sa_daily_reports/);
  assert.equal(requests[0].options.headers.Prefer, "resolution=merge-duplicates");
  assert.equal(JSON.parse(requests[0].options.body)[0].customer_id, "123");
  assert.equal(JSON.parse(requests[0].options.body)[0].serviceRoleKey, undefined);
});

test("dry-run reads campaign stats but skips Telegram delivery", async () => {
  const requests = [];
  const output = [];
  const result = await runReport({
    argv: ["--dry-run", "--date=2026-08-27"],
    env: {
      NAVER_SA_ACCESS_LICENSE: "license",
      NAVER_SA_SECRET_KEY: "secret",
      NAVER_SA_CUSTOMER_ID: "123",
      TELEGRAM_BOT_TOKEN: "bot-token",
      TELEGRAM_REPORT_CHAT_ID: "chat-1",
    },
    now: () => 1787844600000,
    output: (message) => output.push(message),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/ncc/campaigns")) {
        return new Response(JSON.stringify([{ nccCampaignId: "cmp-1", name: "누수 캠페인" }]), { status: 200 });
      }
      if (url.includes("/stats")) {
        return new Response(JSON.stringify({ data: [{ id: "cmp-1", impCnt: 100, clkCnt: 2, salesAmt: 1000, ccnt: 0 }] }), { status: 200 });
      }
      throw new Error(`unexpected request: ${url}`);
    },
  });

  assert.equal(result.reportDate, "2026-08-27");
  assert.equal(requests.length, 2);
  assert.equal(output.length, 1);
  assert.match(output[0], /네이버 광고 일일 리포트/);
  assert.equal(requests.some((request) => request.url.includes("telegram.org")), false);
});

test("continues Telegram delivery when Supabase storage is unavailable", async () => {
  const requests = [];
  const output = [];
  const result = await runReport({
    argv: ["--date=2026-08-27"],
    env: {
      NAVER_SA_ACCESS_LICENSE: "license",
      NAVER_SA_SECRET_KEY: "secret",
      NAVER_SA_CUSTOMER_ID: "123",
      TELEGRAM_BOT_TOKEN: "bot-token",
      TELEGRAM_REPORT_CHAT_ID: "chat-1",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
    },
    output: (message) => output.push(message),
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes("/ncc/campaigns")) {
        return new Response(JSON.stringify([{ nccCampaignId: "cmp-1", name: "누수 캠페인" }]), { status: 200 });
      }
      if (url.includes("/stats")) {
        return new Response(JSON.stringify({ data: [{ id: "cmp-1", impCnt: 100, clkCnt: 2, salesAmt: 1000, ccnt: 0 }] }), { status: 200 });
      }
      if (url.includes("/naver_sa_daily_reports")) {
        return new Response(JSON.stringify({ message: "service restricted" }), { status: 503 });
      }
      if (url.includes("telegram.org")) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      throw new Error(`unexpected request: ${url}`);
    },
  });

  assert.equal(result.reportDate, "2026-08-27");
  assert.equal(requests.some((request) => request.url.includes("telegram.org")), true);
  assert.ok(output.some((message) => message.includes("Supabase")));
  assert.ok(output.some((message) => message.includes("전송 완료")));
});
