import { MessageCircle, Phone } from "lucide-react";
import { business } from "../../data";

/** App.tsx의 SiteFooter와 동일(정적). */
export function SiteFooter() {
  return (
    <footer className="footer">
      <strong>{business.name}</strong>
      <p>
        {business.registrationNumber} · {business.owner} · {business.address}
      </p>
      <p>개인정보는 상담 목적 외 사용하지 않으며, 아래 정책 페이지에서 처리 방침을 확인할 수 있습니다.</p>
      <a className="footer-admin-link" href="/privacy">
        개인정보처리방침
      </a>
    </footer>
  );
}

/** App.tsx의 MobileQuickCta와 동일(정적 링크). */
export function MobileQuickCta() {
  return (
    <div className="mobile-cta" aria-label="빠른 상담">
      <a href={business.phoneHref}>
        <Phone size={19} />
        전화
      </a>
      <a className="mobile-cta__kakao" href={business.kakaoUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={19} />
        카카오톡
      </a>
    </div>
  );
}
