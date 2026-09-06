function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function sendTelegramMessage({
  token,
  chatId,
  text,
  fetchImpl = globalThis.fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  maxRetries = 2,
  retryDelayMs = 800,
} = {}) {
  if (!token || !chatId || !text) {
    throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_REPORT_CHAT_ID, and report text are required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  // naver-search-ad.mjs와 동일한 이유로 net-level 실패(DNS·연결끊김 등)도 재시도한다 —
  // 전체 리포트 파이프라인이 여러 외부 호스트를 순차 호출한 뒤 마지막에 텔레그램을
  // 호출하는데, 이 마지막 호출만 재시도 없이 즉시 실패하던 것이 실제 크론 실패의 원인이었다
  // (2026-09-04·09-05, 네이버·Supabase 호출은 각각 재현 시 항상 성공했다).
  let attempt = 0;
  while (true) {
    let response;
    try {
      response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: String(chatId),
          text,
          disable_web_page_preview: true,
        }),
      });
    } catch (networkError) {
      if (attempt >= maxRetries) {
        throw new Error(`Telegram network request failed: ${networkError.message}`, { cause: networkError });
      }
      await sleep(retryDelayMs * 2 ** attempt);
      attempt += 1;
      continue;
    }

    const payload = parseResponseBody(await response.text());
    if (!response.ok || payload?.ok === false) {
      const detail = payload && typeof payload === "object" ? payload.description ?? "Telegram request failed" : "Telegram request failed";
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
