import { useEffect, useState } from "react";
import { Globe, LoaderCircle, LogIn } from "lucide-react";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

type EmailPasswordAuthPanelProps = {
  title: string;
  description: string;
  redirectTo: string;
  submitLabel: string;
  googleLabel?: string;
};

export function EmailPasswordAuthPanel({
  title,
  description,
  redirectTo,
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
      .then((session) => {
        if (!mounted || !session?.user) return;
        window.location.replace(redirectTo);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [redirectTo]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.signInWithEmailPassword(email.trim(), password);
      window.location.replace(redirectTo);
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
      await authService.signInWithGoogle(redirectTo);
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : "Google 로그인에 실패했습니다.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      <span className="auth-panel-kicker">
        <LogIn size={16} />
        로그인
      </span>
      <h1>{title}</h1>
      <p>{description}</p>

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
        {loading ? <LoaderCircle size={18} className="spin" /> : <LogIn size={18} />}
        {loading ? "로그인 중" : submitLabel}
      </button>

      {googleLabel ? (
        <>
          <div className="auth-divider">
            <span>또는</span>
          </div>
          <button className="auth-secondary" type="button" onClick={() => void handleGoogleSignIn()} disabled={loading}>
            <Globe size={18} />
            {googleLabel}
          </button>
        </>
      ) : null}
    </form>
  );
}
