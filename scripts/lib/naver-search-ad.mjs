import { createHmac } from "node:crypto";

const DEFAULT_BASE_URL = "https://api.searchad.naver.com";
const DEFAULT_STATS_FIELDS = [
  "impCnt",
  "clkCnt",
  "salesAmt",
  "ctr",
  "cpc",
  "avgRnk",
  "ccnt",
];

export class NaverSearchAdError extends Error {
  constructor(message, { status = 0, payload = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "NaverSearchAdError";
    this.status = status;
    this.payload = payload;
  }
}

export function signRequest({ timestamp, method, uri, secretKey }) {
  if (!timestamp || !method || !uri || !secretKey) {
    throw new Error("Naver SA signature inputs are incomplete");
  }

  return createHmac("sha256", secretKey)
    .update(`${timestamp}.${method}.${uri}`)
    .digest("base64");
}

function appendQueryParams(searchParams, params) {
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      }
      continue;
    }

    searchParams.append(key, String(value));
  }
}

function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(payload, status) {
  if (payload && typeof payload === "object") {
    return payload.message ?? payload.title ?? payload.detail ?? `Naver SA request failed (${status})`;
  }
  return `Naver SA request failed (${status})`;
}

export function createNaverSearchAdClient({
  accessLicense,
  secretKey,
  customerId,
  baseUrl = DEFAULT_BASE_URL,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  // VM의 짧은 네트워크 순단(DNS 재조회, 연결 끊김 등)이 몇 초 내에 회복되는 경우가 많아
  // 이전 기본값(재시도 2회, 총 대기 ~2.4초)으로는 실제 순단을 못 버티고 크론이 실패했다
  // (2026-09-04, 09-05 연속 실패로 확인). 지수 백오프를 유지하며 예산을 넉넉히 늘린다
  // (재시도 4회, 총 대기 ~12.6초) — 일일 크론이라 지연은 문제되지 않는다.
  maxRetries = 4,
  retryDelayMs = 800,
} = {}) {
  if (!accessLicense || !secretKey || !customerId) {
    throw new Error("NAVER_SA_ACCESS_LICENSE, NAVER_SA_SECRET_KEY, and NAVER_SA_CUSTOMER_ID are required");
  }
  if (!/^\d+$/.test(String(customerId))) {
    throw new Error("NAVER_SA_CUSTOMER_ID must contain digits only");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  async function request(path, { method = "GET", query, body } = {}) {
    const url = new URL(path, baseUrl);
    appendQueryParams(url.searchParams, query);

    let attempt = 0;
    while (true) {
      const timestamp = String(now());
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Timestamp": timestamp,
        "X-API-KEY": accessLicense,
        "X-Customer": String(customerId),
        "X-Signature": signRequest({ timestamp, method, uri: path, secretKey }),
      };
      let response;
      try {
        response = await fetchImpl(url.toString(), {
          method,
          headers,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      } catch (networkError) {
        // fetch 자체가 거부되는 net-level 실패(DNS·타임아웃·연결끊김 등)도 HTTP 429/5xx와
        // 동일하게 재시도한다 — 이 케이스가 재시도 없이 그대로 던져지면 크론이 완전 무음 실패한다.
        const canRetryNetwork = attempt < maxRetries;
        if (!canRetryNetwork) {
          throw new NaverSearchAdError(`Naver SA network request failed: ${networkError.message}`, {
            status: 0,
            payload: null,
            cause: networkError,
          });
        }
        const waitFor = retryDelayMs * 2 ** attempt;
        attempt += 1;
        await sleep(waitFor);
        continue;
      }
      const payload = parseResponseBody(await response.text());

      if (response.ok) return payload;

      const canRetry = (response.status === 429 || response.status >= 500) && attempt < maxRetries;
      if (!canRetry) {
        throw new NaverSearchAdError(errorMessage(payload, response.status), {
          status: response.status,
          payload,
        });
      }

      const waitFor = retryDelayMs * 2 ** attempt;
      attempt += 1;
      await sleep(waitFor);
    }
  }

  return {
    async listCampaigns() {
      const payload = await request("/ncc/campaigns");
      if (Array.isArray(payload)) return payload;
      return Array.isArray(payload?.data) ? payload.data : [];
    },

    async getStats({ ids, since, until, fields = DEFAULT_STATS_FIELDS }) {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const payload = await request("/stats", {
        query: {
          ids,
          fields: JSON.stringify(fields),
          timeRange: JSON.stringify({ since, until }),
        },
      });
      if (Array.isArray(payload)) return payload;
      return Array.isArray(payload?.data) ? payload.data : [];
    },

    async getRelatedKeywords({ hintKeywords }) {
      if (!hintKeywords) return [];
      const payload = await request("/keywordstool", {
        query: {
          hintKeywords,
          includeHintKeywords: 1,
          showDetail: 1,
        },
      });
      if (Array.isArray(payload)) return payload;
      return Array.isArray(payload?.keywordList) ? payload.keywordList : [];
    },
  };
}
