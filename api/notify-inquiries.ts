import type { VercelRequest, VercelResponse } from "@vercel/node";

type InquiryRow = {
  name: string;
  phone: string;
  service_area: string | null;
  message: string;
  created_at: string;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL;
// 외부 스케줄러가 호출하는 무인 엔드포인트 — 시크릿이 설정돼 있으면 호출을 검증한다.
// (미설정 시 동작 불변. 설정 후 스케줄러에 x-notify-secret 헤더 또는 ?secret= 를 추가하면
//  무단 호출로 인한 어드민 이메일 발송 악용을 차단한다.)
const notifySecret = process.env.NOTIFY_INQUIRIES_SECRET;
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (notifySecret) {
    const provided =
      (typeof request.headers["x-notify-secret"] === "string" && request.headers["x-notify-secret"]) ||
      (typeof request.query.secret === "string" && request.query.secret) ||
      "";
    if (provided !== notifySecret) {
      response.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  if (!supabaseUrl || !supabasePublishableKey) {
    response.status(500).json({ error: "Missing Supabase configuration" });
    return;
  }

  if (!resendApiKey || !adminEmail) {
    response.status(200).json({ ok: true, emailSent: false, reason: "missing_email_configuration" });
    return;
  }

  // The cron runs once per day (see vercel.json). Look back slightly more than
  // 24h so inquiries near the execution boundary are never dropped. This is a
  // backup digest — each inquiry is already alerted in real time on submit
  // (email + Telegram in api/inquiries.ts).
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({
    select: "name,phone,service_area,message,created_at",
    source: "eq.website",
    status: "eq.new",
    created_at: `gte.${cutoff}`
  });

  const listResponse = await fetch(`${supabaseUrl}/rest/v1/inquiries?${query.toString()}`, {
    headers: {
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`
    }
  });

  if (!listResponse.ok) {
    // 업스트림(Supabase) 응답 본문은 서버 로그에만 — 클라이언트엔 일반 메시지(스키마/정책 정보 누출 방지).
    const errorText = await listResponse.text().catch(() => "");
    console.error("[notify-inquiries] list failed", listResponse.status, errorText);
    response.status(502).json({ error: "Failed to read inquiries" });
    return;
  }

  const rows = (await listResponse.json()) as InquiryRow[];
  if (!rows.length) {
    response.status(200).json({ ok: true, emailSent: false, count: 0 });
    return;
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "집수리클라쓰 <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `최근 24시간 문의 ${rows.length}건`,
      html: buildDigestHtml(rows)
    })
  });

  if (!emailResponse.ok) {
    // 업스트림(Resend) 응답 본문은 서버 로그에만 — 클라이언트엔 일반 메시지.
    const errorText = await emailResponse.text().catch(() => "");
    console.error("[notify-inquiries] email failed", emailResponse.status, errorText);
    response.status(502).json({ error: "Failed to send email" });
    return;
  }

  response.status(200).json({ ok: true, emailSent: true, count: rows.length });
}

function buildDigestHtml(rows: InquiryRow[]) {
  const entries = rows
    .map(
      (row) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(row.name)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(row.phone)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(row.service_area || "-")}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(row.created_at)}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 0 10px 14px; color: #374151;">${escapeHtml(row.message)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">일일 문의 요약</h2>
      <p style="margin: 0 0 16px;">최근 24시간 동안 총 ${rows.length}건의 새 문의가 들어왔습니다.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left" style="padding: 10px; border-bottom: 2px solid #111827;">이름</th>
            <th align="left" style="padding: 10px; border-bottom: 2px solid #111827;">연락처</th>
            <th align="left" style="padding: 10px; border-bottom: 2px solid #111827;">지역</th>
            <th align="left" style="padding: 10px; border-bottom: 2px solid #111827;">시간</th>
          </tr>
        </thead>
        <tbody>${entries}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
