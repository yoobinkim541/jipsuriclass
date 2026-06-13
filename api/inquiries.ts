import type { VercelRequest, VercelResponse } from "@vercel/node";

type InquiryPayload = {
  name?: string;
  phone?: string;
  serviceArea?: string;
  message?: string;
  attachments?: Array<{ name?: string; url?: string; type?: string }>;
  intake?: Record<string, unknown>;
  userId?: string | null;
  userEmail?: string | null;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    response.status(500).json({ error: "Missing Supabase configuration" });
    return;
  }

  const payload = request.body as InquiryPayload;
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").trim();
  const serviceArea = String(payload.serviceArea || "").trim();
  const message = String(payload.message || "").trim();
  const attachments = Array.isArray(payload.attachments)
    ? payload.attachments
        .map((item) => ({
          name: String(item?.name || "").trim(),
          url: String(item?.url || "").trim(),
          type: String(item?.type || "").trim()
        }))
        .filter((item) => item.url)
    : [];
  const intake = payload.intake && typeof payload.intake === "object" ? payload.intake : {};
  const userId = payload.userId ? String(payload.userId).trim() : null;
  const userEmail = payload.userEmail ? String(payload.userEmail).trim() : null;

  if (!name || !phone || !message) {
    response.status(400).json({ error: "Required fields missing" });
    return;
  }

  const authorization = typeof request.headers.authorization === "string" && request.headers.authorization
    ? request.headers.authorization
    : `Bearer ${supabasePublishableKey}`;

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/inquiries`, {
    method: "POST",
    headers: {
      apikey: supabasePublishableKey,
      Authorization: authorization,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      name,
      phone,
      service_area: serviceArea || null,
      message,
      attachments,
      intake,
      user_id: userId,
      user_email: userEmail,
      status: "new",
      source: "website"
    })
  });

  if (!insertResponse.ok) {
    const errorText = await insertResponse.text();
    response.status(insertResponse.status).json({ error: errorText || "Failed to store inquiry" });
    return;
  }

  let telegramSent = false;
  if (telegramBotToken && telegramChatId) {
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: buildTelegramText({ name, phone, serviceArea, message, userEmail, attachments, intake }),
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      });
      telegramSent = telegramResponse.ok;
    } catch {
      telegramSent = false;
    }
  }

  let emailSent = false;
  if (resendApiKey && adminEmail) {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "집수리클라쓰 <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `새 견적 문의: ${name}`,
        html: buildEmailHtml({ name, phone, serviceArea, message, userEmail, attachments, intake })
      })
    });

    emailSent = emailResponse.ok;
  }

  response.status(200).json({ ok: true, emailSent, telegramSent });
}

function buildTelegramText(input: {
  name: string;
  phone: string;
  serviceArea: string;
  message: string;
  userEmail: string | null;
  attachments: Array<{ name: string; url: string; type: string }>;
  intake: Record<string, unknown>;
}) {
  const lines = [
    "🔔 <b>새 상담 요청</b>",
    "",
    `👤 이름: ${escapeHtml(input.name)}`,
    `📞 연락처: ${escapeHtml(input.phone)}`,
    `📍 지역: ${escapeHtml(input.serviceArea || "-")}`
  ];

  if (input.userEmail) {
    lines.push(`✉️ 이메일: ${escapeHtml(input.userEmail)}`);
  }

  const summary = formatIntakePlain(input.intake);
  if (summary) {
    lines.push("", "📋 설문 요약", summary);
  }

  if (input.attachments.length) {
    lines.push("", `📷 첨부 사진 ${input.attachments.length}장`);
  }

  const trimmedMessage = input.message.length > 600 ? `${input.message.slice(0, 600)}…` : input.message;
  lines.push("", "📝 문의 내용", escapeHtml(trimmedMessage));
  lines.push("", '👉 <a href="https://www.jipsuriclass.kr/admin/inquiries">어드민에서 확인</a>');

  return lines.join("\n");
}

function formatIntakePlain(intake: Record<string, unknown>) {
  const addressParts = [intake.postalCode, intake.address, intake.detailAddress]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  const address = addressParts.join(" ").trim();

  return [
    ["공간 유형", intake.spaceType],
    ["면적", intake.areaBand],
    ["거주 상태", intake.propertyStatus],
    ["수리 이유", intake.reason],
    ["예산", intake.budget],
    ["착수 시기", intake.startTiming],
    ["주소", address || undefined]
  ]
    .filter(([, value]) => typeof value === "string" && (value as string).trim())
    .map(([label, value]) => `· ${label}: ${escapeHtml(String(value))}`)
    .join("\n");
}

function buildEmailHtml(input: {
  name: string;
  phone: string;
  serviceArea: string;
  message: string;
  userEmail: string | null;
  attachments: Array<{ name: string; url: string; type: string }>;
  intake: Record<string, unknown>;
}) {
  const summary = formatIntakeSummary(input.intake);
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">새 견적 문의</h2>
      <p><strong>이름:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>연락처:</strong> ${escapeHtml(input.phone)}</p>
      <p><strong>지역:</strong> ${escapeHtml(input.serviceArea || "-")}</p>
      <p><strong>이메일:</strong> ${escapeHtml(input.userEmail || "-")}</p>
      ${summary ? `<p><strong>설문 요약:</strong><br />${summary}</p>` : ""}
      ${
        input.attachments.length
          ? `
            <p><strong>첨부사진:</strong></p>
            <ul style="padding-left: 18px;">
              ${input.attachments
                .map(
                  (attachment) =>
                    `<li><a href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer">${escapeHtml(attachment.name || "첨부파일")}</a></li>`
                )
                .join("")}
            </ul>
          `
          : ""
      }
      <p><strong>문의내용:</strong></p>
      <pre style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 8px;">${escapeHtml(input.message)}</pre>
    </div>
  `;
}

function formatIntakeSummary(intake: Record<string, unknown>) {
  const addressParts = [intake.postalCode, intake.address, intake.detailAddress]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  const address = addressParts.join(" ").trim();

  const entries = [
    ["공간 유형", intake.spaceType],
    ["면적", intake.areaBand],
    ["거주 상태", intake.propertyStatus],
    ["수리 이유", intake.reason],
    ["예산", intake.budget],
    ["착수 시기", intake.startTiming],
    ["주소", address || undefined]
  ]
    .filter(([, value]) => typeof value === "string" && (value as string).trim())
    .map(([label, value]) => `${label}: ${escapeHtml(String(value))}`);

  return entries.join("<br />");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
