import { useEffect, useState } from "react";
import { Globe, LoaderCircle, LogIn } from "lucide-react";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

type EmailPasswordAuthPanelProps = {
  title: string;
  description: string;
  redirectTo: string;
  adminRedirectTo: string;
  submitLabel: string;
  googleLabel?: string;
};

export function EmailPasswordAuthPanel({
  title,
  description,
  redirectTo,
  adminRedirectTo,
  submitLabel,
  googleLabel
}: EmailPasswordAuthPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then(async (session) => {
        if (!mounted || !session?.user) return;
        const nextPath = (await authService.isAdminEmail(session.user.email ?? "")) ? adminRedirectTo : redirectTo;
        window.location.replace(nextPath);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [adminRedirectTo, redirectTo]);

  async function resolveSessionRedirect(session: Awaited<ReturnType<typeof authService.getSession>>) {
    if (!session?.user.email) {
      window.location.replace(redirectTo);
      return;
    }

    const nextPath = (await authService.isAdminEmail(session.user.email)) ? adminRedirectTo : redirectTo;
    window.location.replace(nextPath);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await authService.signInWithEmailPassword(email.trim(), password);
      await resolveSessionRedirect(session);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "로그인에 실패했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      await authService.signInWithGoogle(window.location.pathname);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Google 로그인에 실패했습니다.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>이메일</span>
        <input
          autoComplete="email"
          inputMode="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className="auth-field">
        <span>비밀번호</span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder="비밀번호"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? <p className="auth-error">{error}</p> : null}

      <button className="auth-submit" type="submit" disabled={loading}>
        {loading ? <LoaderCircle size={18} className="spin" /> : null}
        {loading ? "로그인 중" : submitLabel}
      </button>

      {googleLabel ? (
        <>
          <div className="auth-divider"><span>또는</span></div>
          <button className="auth-google" type="button" onClick={() => void handleGoogleSignIn()} disabled={loading}>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-7.9z"/>
              <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8A11 11 0 0 0 12 23z"/>
              <path fill="#FBBC05" d="M6 14.3a6.6 6.6 0 0 1 0-4.2V7.3H2.3a11 11 0 0 0 0 9.8z"/>
              <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3.1-3.1A11 11 0 0 0 2.3 7.3L6 10.1c.9-2.6 3.2-4.4 6-4.4z"/>
            </svg>
            {googleLabel}
          </button>
        </>
      ) : null}
    </form>
  );
}
