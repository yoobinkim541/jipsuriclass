import { track } from "@vercel/analytics";

/**
 * 전환 이벤트 계측 유틸 (Vercel Web Analytics).
 * - 익명·쿠키리스(PIPA/GDPR 동의 배너 불필요). 절대 PII(이름·전화·주소)를 props로 보내지 않는다.
 * - 개발 환경에서는 track()이 자동 no-op. 프로덕션 + 대시보드에서 Analytics 활성화 시에만 수집.
 */
type EventProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(name: string, props?: EventProps) {
  try {
    track(name, props as Record<string, string | number | boolean | null>);
  } catch {
    /* 분석 스크립트 미로딩 등은 조용히 무시 — 사용자 경험에 영향 없도록 */
  }
}

/** 클릭된 연락 링크가 어느 영역에서 발생했는지 대략적 라벨로 환원(전화 vs 카톡 + 위치 분석용). */
function ctaArea(el: Element): string {
  const map: Array<[string, string]> = [
    [".mobile-cta", "mobile_bar"],
    [".diagnosis-answer-actions", "diagnosis_answer"],
    [".diagnosis-hero", "diagnosis_hero"],
    [".estimate-intro", "estimate_intro"],
    [".contact", "contact_section"],
    [".hero-actions", "hero"],
    [".landing-hero", "landing_hero"],
    [".price-page__cta, .pricing-cta", "pricing_cta"],
    ["header.nav, .nav", "nav"],
    ["footer, .footer", "footer"],
  ];
  for (const [selector, label] of map) {
    if (el.closest(selector)) return label;
  }
  return "other";
}

let installed = false;

/** 모든 tel:·카카오톡 링크 클릭을 단일 위임 리스너로 계측한다(현재·미래 링크 모두 자동 포함). */
export function initContactTracking() {
  if (installed || typeof document === "undefined") return;
  installed = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      let method: "phone" | "kakao" | null = null;
      if (href.startsWith("tel:")) method = "phone";
      else if (href.includes("pf.kakao.com") || href.includes("kakao")) method = "kakao";
      if (!method) return;

      trackEvent("contact_click", {
        method,
        area: ctaArea(anchor),
        path: window.location.pathname,
      });
    },
    { capture: true }
  );
}
