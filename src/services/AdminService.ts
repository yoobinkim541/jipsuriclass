import { supabase } from "../lib/supabaseClient";
import type { InquiryIntake, InquiryRow, InquiryStatus } from "../types";

export class AdminService {
  async signOut() {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    await supabase.auth.signOut();
  }

  async getSession() {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return data.session;
  }

  async listInquiries(): Promise<InquiryRow[]> {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { data, error } = await supabase
      .from("inquiries")
      .select("id,name,phone,service_area,message,attachments,intake,status,source,user_id,user_email,created_at,notified_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return (data ?? []) as InquiryRow[];
  }

  async updateInquiryStatus(id: string, status: InquiryStatus) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) {
      throw error;
    }
  }

  async updateInquiryIntake(id: string, intake: InquiryIntake) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { error } = await supabase.from("inquiries").update({ intake }).eq("id", id);
    if (error) {
      throw error;
    }
  }
}
