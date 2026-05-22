import { supabase } from "../lib/supabaseClient";

export class AuthService {
  async signInWithGoogle(redirectTo: string) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
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
}
