import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";
import "../auth-panel.css";

export function LoginPage() {
  return (
    <div className="auth-shell">
      {/* 상단 바 */}
      <header className="auth-top">
        <a className="auth-back" href="/">
          <ArrowLeft size={18} />
          집수리<em>클라쓰</em>
        </a>
        <a className="auth-side-link" href="/admin/login">
          <ShieldCheck size={15} />
          관리자 입장
        </a>
      </header>

      {/* 레이아웃 */}
      <main className="auth-layout">
        {/* 히어로 */}
        <aside className="auth-hero">
          <span className="auth-hero__kicker">고객 마이페이지</span>
          <h1 className="auth-hero__title">
            내 문의를 한눈에 보고,<br />
            같은 계정으로<br />
            계속 이어갑니다.
          </h1>
          <p className="auth-hero__lede">
            이메일 또는 Google 로그인으로 접속할 수 있습니다.
            문의 내역, 첨부 사진, 상담 상태를 마이페이지에서 이어서 확인하세요.
          </p>
          <div className="auth-hero__grid">
            <article>
              <strong>실시간 조회</strong>
              <span>내 문의와 진행 상태를 바로 확인</span>
            </article>
            <article>
              <strong>같은 계정 유지</strong>
              <span>이메일·Google 로그인 모두 연결</span>
            </article>
            <article>
              <strong>모바일 친화</strong>
              <span>사진 상담과 문의 확인을 한 흐름으로</span>
            </article>
          </div>
          <div className="auth-hero__notes">
            <span>상담 기록 보관</span>
            <span>첨부 사진 확인</span>
            <span>관리자 문의 처리 연동</span>
          </div>
        </aside>

        {/* 인증 카드 */}
        <section className="auth-card" aria-label="고객 로그인">
          <div className="auth-card__head">
            <h2>고객 로그인</h2>
            <p>이메일과 비밀번호, 또는 Google로 같은 계정에 들어갑니다.</p>
          </div>
          <EmailPasswordAuthPanel
            title="고객 로그인"
            description="이메일과 비밀번호, 또는 Google로 같은 계정에 들어갑니다."
            redirectTo="/mypage"
            adminRedirectTo="/admin/inquiries"
            submitLabel="이메일 로그인"
            googleLabel="Google로 로그인"
          />
          <p className="auth-foot">
            {business.name}은 상담 목적으로만 계정 정보를 사용합니다.
          </p>
        </section>
      </main>
    </div>
  );
}
