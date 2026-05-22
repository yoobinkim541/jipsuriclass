import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";

export function AdminLoginPage() {
  return (
    <main className="login-shell admin-login-shell">
      <header className="login-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
        <a className="admin-login-return" href="/login">
          <ShieldCheck size={14} />
          고객 로그인
        </a>
      </header>

      <EmailPasswordAuthPanel
        title="관리자 로그인"
        description="관리자 이메일과 비밀번호, 또는 Google로 같은 계정에 들어갑니다."
        redirectTo="/admin/inquiries"
        adminRedirectTo="/admin/inquiries"
        submitLabel="이메일 로그인"
        googleLabel="Google로 로그인"
      />
    </main>
  );
}
