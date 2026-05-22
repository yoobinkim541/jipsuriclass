import { supabase } from "../lib/supabaseClient";
import type { InquiryAttachment } from "../types";

const MEDIA_BUCKET = "jipsuri-media";

export class MediaService {
  async uploadInquiryAttachment(file: File): Promise<InquiryAttachment> {
    return this.uploadPublicFile(file, "inquiries");
  }

  async uploadCaseImage(file: File): Promise<InquiryAttachment> {
    return this.uploadPublicFile(file, "cases");
  }

  async uploadHomepageImage(file: File): Promise<InquiryAttachment> {
    return this.uploadPublicFile(file, "homepage");
  }

  private async uploadPublicFile(file: File, folder: string): Promise<InquiryAttachment> {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
    const path = `${folder}/${Date.now()}-${randomId()}-${safeName || "upload"}`;

    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined
    });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

    return {
      name: file.name,
      type: file.type || "application/octet-stream",
      url: data.publicUrl
    };
  }
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 10);
}
