const numberFormatter = new Intl.NumberFormat("ko-KR");

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replaceAll(",", "").replace("%", "").trim();
  if (!normalized || normalized === "-") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function metric(stat, ...keys) {
  for (const key of keys) {
    if (stat?.[key] !== undefined && stat?.[key] !== null) return toNumber(stat[key]);
  }
  return 0;
}

function makeCampaign(campaign) {
  const id = String(campaign?.nccCampaignId ?? campaign?.id ?? "");
  return {
    id,
    name: String(campaign?.name ?? (id || "이름 없음")),
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    costPerConversion: 0,
  };
}

function makeMetrics(stat) {
  const impressions = metric(stat, "impCnt", "impressions");
  const clicks = metric(stat, "clkCnt", "clicks");
  const cost = metric(stat, "salesAmt", "cost");
  const conversions = metric(stat, "ccnt", "convCnt", "conversions");
  return {
    impressions,
    clicks,
    cost,
    conversions,
    ctr: impressions > 0 ? round((clicks / impressions) * 100) : 0,
    cpc: clicks > 0 ? round(cost / clicks) : 0,
    costPerConversion: conversions > 0 ? round(cost / conversions) : 0,
  };
}

export function formatKstDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function summarizeCampaignStats(campaigns = [], stats = []) {
  const byId = new Map();
  for (const campaign of campaigns) {
    const normalized = makeCampaign(campaign);
    if (normalized.id) byId.set(normalized.id, normalized);
  }

  for (const stat of stats) {
    const id = String(stat?.id ?? stat?.nccCampaignId ?? "");
    if (!id) continue;
    if (!byId.has(id)) byId.set(id, makeCampaign({ id, name: id }));
    const current = byId.get(id);
    const metrics = makeMetrics(stat);
    current.impressions += metrics.impressions;
    current.clicks += metrics.clicks;
    current.cost += metrics.cost;
    current.conversions += metrics.conversions;
  }

  const campaignRows = [...byId.values()].map((campaign) => ({
    ...campaign,
    ctr: campaign.impressions > 0 ? round((campaign.clicks / campaign.impressions) * 100) : 0,
    cpc: campaign.clicks > 0 ? round(campaign.cost / campaign.clicks) : 0,
    costPerConversion: campaign.conversions > 0 ? round(campaign.cost / campaign.conversions) : 0,
  }));
  const totals = campaignRows.reduce(
    (result, campaign) => ({
      impressions: result.impressions + campaign.impressions,
      clicks: result.clicks + campaign.clicks,
      cost: result.cost + campaign.cost,
      conversions: result.conversions + campaign.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 },
  );

  return {
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? round((totals.clicks / totals.impressions) * 100) : 0,
      cpc: totals.clicks > 0 ? round(totals.cost / totals.clicks) : 0,
      costPerConversion: totals.conversions > 0 ? round(totals.cost / totals.conversions) : 0,
    },
    campaigns: campaignRows,
  };
}

function average(history, key) {
  const values = history
    .map((item) => toNumber(item?.totals?.[key] ?? item?.[key]))
    .filter((value) => value > 0);
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildRecommendations(summary, history = []) {
  const totals = summary?.totals ?? {};
  const recommendations = [];
  const campaigns = Array.isArray(summary?.campaigns) ? summary.campaigns : [];

  if (totals.impressions === 0) {
    recommendations.push("노출이 없어 캠페인·광고그룹 ON 상태, 키워드 승인 상태, 입찰가와 예산을 먼저 확인하세요.");
  } else if (totals.clicks === 0) {
    recommendations.push("노출은 있지만 클릭이 없어 광고 문구와 키워드의 서비스·지역 정합성, 검색어 의도를 점검하세요.");
  }

  if (totals.cost > 0 && totals.conversions === 0) {
    recommendations.push("비용은 발생했지만 전환 데이터가 0입니다. 전환 추적 설정과 상담 완료 이벤트를 먼저 확인한 뒤 검색어 보고서에서 제외 검색어를 정리하세요.");
  }

  const lowCtrCampaigns = campaigns
    .filter((campaign) => campaign.impressions >= 100 && campaign.ctr < 1)
    .sort((left, right) => right.impressions - left.impressions)
    .slice(0, 3);
  if (lowCtrCampaigns.length > 0) {
    recommendations.push(`CTR 1% 미만 캠페인(${lowCtrCampaigns.map((campaign) => campaign.name).join(", ")})의 제목·설명과 랜딩 첫 화면을 우선 개선하세요.`);
  }

  const averageCost = average(history, "cost");
  const averageClicks = average(history, "clicks");
  if (averageCost > 0 && totals.cost > averageCost * 1.5 && totals.clicks <= averageClicks) {
    recommendations.push("최근 저장된 평균보다 비용이 크게 늘었지만 클릭이 늘지 않았습니다. 입찰가와 확장 검색어를 낮은 단위로 조정하고 다음 날 변화를 비교하세요.");
  }

  const averageCtr = average(history, "ctr");
  if (averageCtr > 0 && totals.ctr < averageCtr * 0.7 && totals.impressions >= 100) {
    recommendations.push("최근 평균보다 CTR이 크게 낮습니다. 키워드와 광고 문구의 연결성을 확인하고 성과가 낮은 소재를 교체하세요.");
  }

  if (recommendations.length === 0) {
    recommendations.push("큰 이상 신호는 없습니다. 검색어 보고서의 실제 문의 의도와 상담 접수 전환을 함께 확인하세요.");
  }

  return recommendations;
}

function formatWon(value) {
  return `${numberFormatter.format(Math.round(toNumber(value)))}원`;
}

function formatCount(value) {
  return numberFormatter.format(Math.round(toNumber(value)));
}

function formatCampaign(campaign) {
  return `- ${campaign.name}: 노출 ${formatCount(campaign.impressions)}, 클릭 ${formatCount(campaign.clicks)}, CTR ${campaign.ctr.toFixed(2)}%, 비용 ${formatWon(campaign.cost)}, CPC ${formatWon(campaign.cpc)}, 전환 ${formatCount(campaign.conversions)}`;
}

function formatKeywordIdea(keyword) {
  const pc = metric(keyword, "monthlyPcQcCnt");
  const mobile = metric(keyword, "monthlyMobileQcCnt");
  const competition = keyword?.compIdx ?? keyword?.competitionIndex ?? "-";
  return `- ${keyword?.relKeyword ?? "이름 없음"}: 월 검색량 약 ${formatCount(pc + mobile)}, 경쟁도 ${competition}`;
}

export function formatReportMessage({ reportDate, summary, recommendations = [], keywordIdeas = [] }) {
  const totals = summary?.totals ?? {};
  const campaigns = [...(summary?.campaigns ?? [])]
    .sort((left, right) => right.cost - left.cost)
    .slice(0, 12);
  const lines = [
    "네이버 광고 일일 리포트",
    `기준일: ${reportDate}`,
    "",
    "전체 성과",
    `노출 ${formatCount(totals.impressions)} | 클릭 ${formatCount(totals.clicks)} | CTR ${toNumber(totals.ctr).toFixed(2)}%`,
    `비용 ${formatWon(totals.cost)} | CPC ${formatWon(totals.cpc)} | 전환 ${formatCount(totals.conversions)} | 전환당 비용 ${formatWon(totals.costPerConversion)}`,
  ];

  if (campaigns.length > 0) {
    lines.push("", "캠페인별 성과", ...campaigns.map(formatCampaign));
  }

  lines.push("", "개선 제안", ...(recommendations.length > 0 ? recommendations.map((item, index) => `${index + 1}. ${item}`) : ["1. 확인할 제안이 없습니다."]));

  if (keywordIdeas.length > 0) {
    lines.push("", "키워드 탐색 참고", ...keywordIdeas.slice(0, 5).map(formatKeywordIdea));
  }

  const message = lines.join("\n");
  return message.length <= 4096 ? message : `${message.slice(0, 4088)}\n...`;
}

export { toNumber };
