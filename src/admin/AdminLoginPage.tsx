import { ArrowLeft, UserRound } from "lucide-react";
import { EmailPasswordAuthPanel } from "../components/EmailPasswordAuthPanel";
import "../auth-panel.css";

export function AdminLoginPage() {
  return (
    <div className="auth-shell">
      {/* 상단 바 */}
      <header className="auth-top">
        <a className="auth-back" href="/">
          <ArrowLeft size={18} />
          집수리<em>클라쓰</em>
        </a>
        <a className="auth-side-link" href="/login">
          <UserRound size={15} />
          고객 로그인
        </a>
      </header>

      {/* 레이아웃 */}
      <main className="auth-layout">
        {/* 히어로 */}
        <aside className="auth-hero">
          <span className="auth-hero__kicker">관리자</span>
          <h1 className="auth-hero__title">
            상담을 받고,<br />
            상태를 관리하고,<br />
            견적을 발행합니다.
          </h1>
          <p className="auth-hero__lede">
            관리자 계정으로 로그인하면 들어온 상담 요청을 한곳에서 확인하고,
            상태 변경·메모·견적 발행까지 처리할 수 있습니다.
          </p>
          <div className="auth-hero__grid">
            <article>
              <strong>상담 관리</strong>
              <span>접수·응대·완료 상태 추적</span>
            </article>
            <article>
              <strong>견적 발행</strong>
              <span>항목별 견적서 작성·발행</span>
            </article>
            <article>
              <strong>콘텐츠 편집</strong>
              <span>모든 페이지 인라인 수정</span>
            </article>
          </div>
          <div className="auth-hero__notes">
            <span>관리자 전용</span>
            <span>Supabase 인증</span>
            <span>RLS 보호</span>
          </div>
        </aside>

        {/* 인증 카드 */}
        <section className="auth-card" aria-label="관리자 로그인">
          <div className="auth-card__head">
            <h2>관리자 로그인</h2>
            <p>등록된 관리자 이메일로만 접근할 수 있습니다.</p>
          </div>
          <EmailPasswordAuthPanel
            title="관리자 로그인"
            description="등록된 관리자 이메일로만 접근할 수 있습니다."
            redirectTo="/admin/inquiries"
            adminRedirectTo="/admin/inquiries"
            submitLabel="이메일 로그인"
            googleLabel="Google로 로그인"
          />
        </section>
      </main>
    </div>
  );
}
