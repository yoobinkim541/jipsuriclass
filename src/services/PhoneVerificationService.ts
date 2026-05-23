type VerificationSendResponse = {
  ok: boolean;
  message?: string;
};

type VerificationCheckResponse = {
  ok: boolean;
  approved: boolean;
  message?: string;
};

export class PhoneVerificationService {
  async sendCode(phone: string): Promise<VerificationSendResponse> {
    const response = await fetch("/api/estimate-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "send",
        phone
      })
    });

    const data = (await response.json().catch(() => ({}))) as VerificationSendResponse & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "인증번호 전송에 실패했습니다.");
    }

    return data;
  }

  async checkCode(phone: string, code: string): Promise<VerificationCheckResponse> {
    const response = await fetch("/api/estimate-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "check",
        phone,
        code
      })
    });

    const data = (await response.json().catch(() => ({}))) as VerificationCheckResponse & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "인증번호 확인에 실패했습니다.");
    }

    return data;
  }
}
