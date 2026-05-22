import { supabase } from "../lib/supabaseClient";
import type { InquiryAttachment } from "../types";

export type InquiryInput = {
  name: string;
  phone: string;
  serviceArea?: string;
  message: string;
  attachments?: InquiryAttachment[];
  intake?: Record<string, unknown>;
};

/**
 * 견적 문의 저장 책임을 담당합니다.
 * UI는 성공/실패만 알면 되고, Supabase 테이블명과 컬럼명은 이 서비스 안에 격리합니다.
 */
export class InquiryService {
  async createInquiry(input: InquiryInput): Promise<void> {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const sessionResponse = await supabase.auth.getSession();
    const session = sessionResponse.data.session;

    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
      },
        body: JSON.stringify({
          name: input.name.trim(),
          phone: input.phone.trim(),
          serviceArea: input.serviceArea?.trim() || "",
          message: input.message.trim(),
          attachments: input.attachments ?? [],
          intake: input.intake ?? {},
          userId: session?.user.id ?? null,
          userEmail: session?.user.email ?? null
        })
      });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || "문의 저장에 실패했습니다");
    }
  }
}
