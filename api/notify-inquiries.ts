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
const cronSecret = process.env.CRON_SECRET;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (cronSecret) {
    const authHeader = request.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
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

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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
    const errorText = await listResponse.text();
    response.status(listResponse.status).json({ error: errorText || "Failed to read inquiries" });
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
      subject: `최근 5분 문의 ${rows.length}건`,
      html: buildDigestHtml(rows)
    })
  });

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    response.status(emailResponse.status).json({ error: errorText || "Failed to send email" });
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
      <h2 style="margin: 0 0 12px;">최근 5분 문의 알림</h2>
      <p style="margin: 0 0 16px;">총 ${rows.length}건의 새 문의가 들어왔습니다.</p>
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
