import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";

export function AdminLoginPage() {
  return (
    <main className="login-shell admin-login-shell">
      <header className="login-header login-header-wide">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
        <a className="admin-login-return" href="/login">
          <ShieldCheck size={14} />
          고객 로그인
        </a>
      </header>

      <div className="login-layout">
        <aside className="login-hero-panel">
          <span className="auth-panel-kicker">관리자</span>
          <h1>상담을 받고, 상태를 관리하고, 견적을 발행합니다.</h1>
          <p>
            관리자 계정으로 로그인하면 들어온 상담 요청을 한곳에서 확인하고, 상태 변경·메모·견적 발행까지 처리할 수 있습니다.
          </p>
          <div className="login-highlight-grid">
            <article>
              <strong>상담 관리</strong>
              <span>접수·응대·완료 상태를 한 화면에서 확인합니다.</span>
            </article>
            <article>
              <strong>견적 발행</strong>
              <span>문의 내용을 기반으로 상담 견적을 빠르게 작성합니다.</span>
            </article>
            <article>
              <strong>콘텐츠 편집</strong>
              <span>홈페이지·랜딩·계정 화면 문구를 바로 고칩니다.</span>
            </article>
          </div>
          <div className="login-hero-notes">
            <span>관리자 전용</span>
            <span>Supabase 인증</span>
            <span>RLS 보호</span>
          </div>
        </aside>

        <EmailPasswordAuthPanel
          title="관리자 로그인"
          description="등록된 관리자 이메일로만 접근할 수 있습니다."
          redirectTo="/admin/inquiries"
          adminRedirectTo="/admin/inquiries"
          submitLabel="이메일 로그인"
          googleLabel="Google로 로그인"
        />
      </div>
    </main>
  );
}
