function parseResponseBody(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function sendTelegramMessage({ token, chatId, text, fetchImpl = globalThis.fetch } = {}) {
  if (!token || !chatId || !text) {
    throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_REPORT_CHAT_ID, and report text are required");
  }
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: String(chatId),
      text,
      disable_web_page_preview: true,
    }),
  });
  const payload = parseResponseBody(await response.text());
  if (!response.ok || payload?.ok === false) {
    const detail = payload && typeof payload === "object" ? payload.description ?? "Telegram request failed" : "Telegram request failed";
    throw new Error(detail);
  }
  return payload;
}
