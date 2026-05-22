import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";

export function PrivacyPolicyPage() {
  return (
    <main className="privacy-shell">
      <header className="privacy-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
      </header>

      <section className="privacy-card">
        <span className="admin-kicker">
          <ShieldCheck size={16} />
          개인정보처리방침
        </span>
        <h1>문의와 상담에 필요한 최소 정보만 처리합니다</h1>
        <p>
          집수리클라쓰는 견적 문의, 고객 응대, 시공 상담, 사후 확인을 위해 이름, 연락처, 지역, 문의 내용,
          첨부 사진, 로그인 계정 정보를 처리합니다.
        </p>

        <div className="privacy-section">
          <h2>수집 항목</h2>
          <p>이름, 연락처, 지역, 문의 내용, 사진 첨부, 로그인 이메일, 문의 작성 시각과 상태 정보.</p>
        </div>
        <div className="privacy-section">
          <h2>이용 목적</h2>
          <p>견적 안내, 현장 상담, 시공 관리, 고객 계정 제공, 관리자 응대, 문의 이력 보관.</p>
        </div>
        <div className="privacy-section">
          <h2>보관과 삭제</h2>
          <p>상담과 시공 완료 후에도 분쟁 대응과 사후 관리가 필요한 기간 동안 보관할 수 있으며, 삭제 요청 시 관련 법령과 내부 보관 기준에 따라 처리합니다.</p>
        </div>
        <div className="privacy-section">
          <h2>제3자 제공</h2>
          <p>원칙적으로 외부에 제공하지 않으며, 사용자가 선택한 저장·알림 서비스는 운영 목적 범위 내에서만 사용합니다.</p>
        </div>
        <div className="privacy-section">
          <h2>문의</h2>
          <p>
            개인정보 관련 문의는 전화 {business.phone} 또는 사이트 문의 채널로 접수할 수 있습니다.
          </p>
        </div>
      </section>

      <footer className="privacy-footer">
        <p>{business.name}</p>
        <a href="/">홈으로</a>
      </footer>
    </main>
  );
}
