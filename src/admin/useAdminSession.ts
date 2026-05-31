import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export function useAdminSession() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
        if (!mounted) return;
        setSessionEmail(session?.user.email ?? null);
        setSessionLoading(false);
      })
      .catch((sessionError) => {
        if (!mounted) return;
        setAuthError(sessionError instanceof Error ? sessionError.message : "세션을 불러오지 못했습니다.");
        setSessionLoading(false);
      });

    const { data } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        setSessionEmail(session?.user.email ?? null);
        setSessionLoading(false);
      }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await authService.signOut();
    window.location.reload();
  }

  return {
    authError,
    sessionEmail,
    sessionLoading,
    setAuthError,
    signOut
  };
}

