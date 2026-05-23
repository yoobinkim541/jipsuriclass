import type { VercelRequest, VercelResponse } from "@vercel/node";

type VerificationPayload = {
  action?: "send" | "check";
  phone?: string;
  code?: string;
};

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
    response.status(503).json({
      ok: false,
      error: "Twilio 설정이 누락되었습니다. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID를 확인하세요."
    });
    return;
  }

  const payload = request.body as VerificationPayload;
  const action = payload.action;
  const phone = normalizePhoneNumber(String(payload.phone || ""));

  if (!action || !phone) {
    response.status(400).json({ ok: false, error: "필수 값이 누락되었습니다." });
    return;
  }

  try {
    if (action === "send") {
      const sendResponse = await fetch(`https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/Verifications`, {
        method: "POST",
        headers: {
          Authorization: basicAuthHeader(twilioAccountSid, twilioAuthToken),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: phone,
          Channel: "sms"
        })
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        response.status(sendResponse.status).json({
          ok: false,
          error: parseTwilioError(errorText) || "인증번호 전송에 실패했습니다."
        });
        return;
      }

      response.status(200).json({ ok: true, message: "인증번호를 전송했습니다." });
      return;
    }

    if (action === "check") {
      const code = String(payload.code || "").trim();
      if (!code) {
        response.status(400).json({ ok: false, error: "인증번호를 입력해 주세요." });
        return;
      }

      const checkResponse = await fetch(`https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`, {
        method: "POST",
        headers: {
          Authorization: basicAuthHeader(twilioAccountSid, twilioAuthToken),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          To: phone,
          Code: code
        })
      });

      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        response.status(checkResponse.status).json({
          ok: false,
          approved: false,
          error: parseTwilioError(errorText) || "인증번호 확인에 실패했습니다."
        });
        return;
      }

      const data = (await checkResponse.json()) as { status?: string; valid?: boolean };
      const approved = data.status === "approved" || data.valid === true;
      response.status(200).json({
        ok: true,
        approved,
        message: approved ? "휴대폰 인증이 완료되었습니다." : "인증번호가 일치하지 않습니다."
      });
      return;
    }

    response.status(400).json({ ok: false, error: "지원하지 않는 action입니다." });
  } catch (error) {
    response.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다."
    });
  }
}

function normalizePhoneNumber(input: string) {
  const trimmed = input.trim().replace(/[^\d+]/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("82")) return `+${trimmed}`;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `+82${digits.slice(1)}`;
  }

  return `+${digits}`;
}

function basicAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`;
}

function parseTwilioError(text: string) {
  try {
    const data = JSON.parse(text) as { message?: string; detail?: string };
    return data.message || data.detail;
  } catch {
    return text.trim();
  }
}
