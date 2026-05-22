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

  async signInWithEmailPassword(email: string, password: string) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async linkGoogleIdentity() {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    return supabase.auth.linkIdentity({
      provider: "google"
    });
  }

  async updatePassword(password: string) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      throw error;
    }

    return data.user;
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
