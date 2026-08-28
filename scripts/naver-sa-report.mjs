import { pathToFileURL } from "node:url";

import { createNaverSearchAdClient } from "./lib/naver-search-ad.mjs";
import {
  buildRecommendations,
  formatKstDate,
  formatReportMessage,
  summarizeCampaignStats,
} from "./lib/naver-sa-report.mjs";
import { createReportStorage } from "./lib/report-storage.mjs";
import { sendTelegramMessage } from "./lib/telegram.mjs";

function getArgument(argv, name) {
  const prefix = `${name}=`;
  const argument = argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : "";
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00+09:00`));
}

function getReportDate(argv, now) {
  const explicitDate = getArgument(argv, "--date");
  if (explicitDate) {
    if (!isValidDate(explicitDate)) throw new Error("--date must use YYYY-MM-DD");
    return explicitDate;
  }

  const current = typeof now === "function" ? now() : now;
  const currentDate = current instanceof Date ? current : new Date(current);
  return formatKstDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
}

function splitKeywords(value) {
  return String(value ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function createStorageFromEnv(env, fetchImpl) {
  const supabaseUrl = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl && !serviceRoleKey) return null;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be configured together");
  }
  return createReportStorage({ supabaseUrl, serviceRoleKey, fetchImpl });
}

export async function runReport({
  env = process.env,
  argv = process.argv.slice(2),
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  output = console.log,
} = {}) {
  const dryRun = argv.includes("--dry-run");
  const reportDate = getReportDate(argv, now);
  const reportChatId = env.TELEGRAM_REPORT_CHAT_ID ?? env.TELEGRAM_CHAT_ID;

  if (!env.NAVER_SA_ACCESS_LICENSE || !env.NAVER_SA_SECRET_KEY || !env.NAVER_SA_CUSTOMER_ID) {
    throw new Error("NAVER_SA_ACCESS_LICENSE, NAVER_SA_SECRET_KEY, and NAVER_SA_CUSTOMER_ID are required");
  }
  if (!dryRun && (!env.TELEGRAM_BOT_TOKEN || !reportChatId)) {
    throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_REPORT_CHAT_ID (or TELEGRAM_CHAT_ID) are required");
  }

  const client = createNaverSearchAdClient({
    accessLicense: env.NAVER_SA_ACCESS_LICENSE,
    secretKey: env.NAVER_SA_SECRET_KEY,
    customerId: env.NAVER_SA_CUSTOMER_ID,
    baseUrl: env.NAVER_SA_API_BASE_URL || undefined,
    fetchImpl,
  });
  const campaigns = await client.listCampaigns();
  const campaignIds = campaigns
    .map((campaign) => campaign?.nccCampaignId ?? campaign?.id)
    .filter(Boolean)
    .map(String);
  const stats = await client.getStats({ ids: campaignIds, since: reportDate, until: reportDate });
  const summary = summarizeCampaignStats(campaigns, stats);

  let storage = null;
  let history = [];
  if (!dryRun) {
    storage = createStorageFromEnv(env, fetchImpl);
    if (storage) {
      history = await storage.listRecentReports({
        customerId: env.NAVER_SA_CUSTOMER_ID,
        beforeDate: reportDate,
      });
    }
  }

  const recommendations = buildRecommendations(summary, history);
  const keywordHints = splitKeywords(env.NAVER_SA_KEYWORD_HINTS);
  const keywordIdeas = keywordHints.length > 0
    ? await client.getRelatedKeywords({ hintKeywords: keywordHints.join(",") })
    : [];
  const message = formatReportMessage({
    reportDate,
    summary,
    recommendations,
    keywordIdeas,
  });
  const report = {
    reportDate,
    customerId: String(env.NAVER_SA_CUSTOMER_ID),
    summary,
    recommendations,
    keywordIdeas,
    message,
  };

  if (dryRun) {
    output(message);
    return report;
  }

  if (storage) {
    await storage.upsertReport({
      reportDate,
      customerId: env.NAVER_SA_CUSTOMER_ID,
      totals: summary.totals,
      campaigns: summary.campaigns,
      recommendations,
      keywordIdeas,
    });
  }
  await sendTelegramMessage({
    token: env.TELEGRAM_BOT_TOKEN,
    chatId: reportChatId,
    text: message,
    fetchImpl,
  });
  output(`네이버 광고 리포트 전송 완료: ${reportDate}`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runReport().catch((error) => {
    console.error(`[naver-sa-report] ${error.message}`);
    process.exitCode = 1;
  });
}
