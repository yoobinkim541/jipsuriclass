import { ArrowLeft } from "lucide-react";
import { business } from "../data";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";

export function LoginPage() {
  return (
    <main className="login-shell">
      <div className="login-shell-bg" aria-hidden="true" />
      <header className="login-header login-header-wide">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
      </header>

      <section className="login-layout">
        <aside className="login-hero-panel">
          <span className="auth-panel-kicker">고객 로그인</span>
          <h1>내 문의를 한눈에 보고, 같은 계정으로 계속 이어갑니다.</h1>
          <p>
            이메일 비밀번호 또는 Google 로그인으로 접속할 수 있습니다. 문의 내역, 첨부 사진, 상담 상태를
            마이페이지에서 이어서 확인하세요.
          </p>
          <div className="login-highlight-grid">
            <article>
              <strong>실시간 조회</strong>
              <span>내 문의와 진행 상태를 바로 확인</span>
            </article>
            <article>
              <strong>같은 계정 유지</strong>
              <span>이메일/Google 로그인 모두 연결</span>
            </article>
            <article>
              <strong>모바일 친화</strong>
              <span>사진 상담과 문의 확인을 한 흐름으로</span>
            </article>
          </div>
          <div className="login-hero-notes">
            <span>상담 기록 보관</span>
            <span>첨부 사진 확인</span>
            <span>관리자 문의 처리 연동</span>
          </div>
        </aside>

        <EmailPasswordAuthPanel
          title="고객 로그인"
          description="이메일과 비밀번호, 또는 Google로 같은 계정에 들어갑니다."
          redirectTo="/mypage"
          adminRedirectTo="/admin/inquiries"
          submitLabel="이메일 로그인"
          googleLabel="Google로 로그인"
        />
      </section>
    </main>
  );
}
