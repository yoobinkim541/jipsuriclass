import { ArrowLeft, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { business } from "../data";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

export function LoginPage() {
  async function signIn(role: "account" | "admin") {
    const redirectTo = `${window.location.origin}/${role}`;
    await authService.signInWithGoogle(redirectTo);
  }

  return (
    <main className="login-shell">
      <header className="login-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
      </header>

      <section className="login-card">
        <span className="admin-kicker">
          <LogIn size={16} />
          로그인
        </span>
        <h1>한 번의 로그인으로 고객과 관리자를 나눕니다</h1>
        <p>고객은 문의 기록 확인과 수정, 관리자는 문의 관리와 홈페이지 편집을 사용할 수 있습니다.</p>

        <div className="login-grid">
          <button className="login-option" type="button" onClick={() => void signIn("account")}>
            <UserRound size={22} />
            <strong>고객 로그인</strong>
            <span>내 견적 요청과 수정 기록을 확인합니다.</span>
          </button>
          <button className="login-option" type="button" onClick={() => void signIn("admin")}>
            <ShieldCheck size={22} />
            <strong>관리자 로그인</strong>
            <span>문의 내역과 홈페이지 편집기에 들어갑니다.</span>
          </button>
        </div>
      </section>
    </main>
  );
}
