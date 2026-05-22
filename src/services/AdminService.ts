import { supabase } from "../lib/supabaseClient";
import type { InquiryRow, InquiryStatus } from "../types";

export class AdminService {
  async signInWithGoogle() {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`
      }
    });
  }

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
}
