import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";

export function LoginPage() {
  return (
    <main className="login-shell">
      <header className="login-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
      </header>

      <EmailPasswordAuthPanel
        title="고객 로그인"
        description="이메일과 비밀번호, 또는 Google로 같은 계정에 들어갑니다."
        redirectTo="/mypage"
        adminRedirectTo="/admin/inquiries"
        submitLabel="이메일 로그인"
        googleLabel="Google로 로그인"
      />

      <a className="admin-corner-link" href="/admin/login">
        <ShieldCheck size={14} />
        관리자 로그인
      </a>
    </main>
  );
}
