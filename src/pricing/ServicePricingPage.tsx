import React from "react";
import { ChevronLeft, Info, MessageCircle, Phone } from "lucide-react";
import { business } from "../data";
import { MobileQuickCta } from "../components/site/SiteFooter";
import type { ServicePricingConfig } from "./types";

export function ServicePricingPage({ config }: { config: ServicePricingConfig }) {
  return (
    <>
      <header className="nav" data-elevated="true">
        <div className="nav__inner">
          <a className="brand" href="/" aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/brand-icon.png" alt="" aria-hidden="true" />
            <span className="brand__name">
              집수리<em>클라쓰</em>
            </span>
          </a>
          <div className="nav__actions">
            <a className="nav__phone" href={business.phoneHref}>
              {business.phone}
            </a>
          </div>
        </div>
      </header>

      <button
        className="landing-back-btn"
        type="button"
        aria-label="이전 페이지로 이동"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = "/";
          }
        }}
      >
        <ChevronLeft size={18} />
        <span>이전</span>
      </button>

      <main style={{ maxWidth: "var(--max, 1320px)", margin: "0 auto", padding: "clamp(32px,5vw,64px) clamp(18px,5vw,64px)" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "clamp(32px,5vw,56px)" }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3,#5b6781)" }}>
            서비스
          </span>
          <h1 style={{ fontFamily: "var(--f-display)", fontWeight: 800, fontSize: "clamp(26px,4vw,48px)", letterSpacing: "-0.03em", margin: "8px 0 12px", color: "var(--ink,#0b1a30)" }}>
            {config.serviceName} 가격표
          </h1>
          <p style={{ fontSize: "clamp(15px,1.4vw,17px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>
            작업 유형별 기준 단가입니다. 현장 상태·난이도·추가 작업에 따라 실제 비용이 달라질 수 있으며, 정확한 견적은 현장 확인 후 안내드립니다.
          </p>
        </div>

        {/* 안내 배너 */}
        <div style={{ background: "#fff8ed", border: "1px solid #f0d99a", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: "clamp(28px,4vw,48px)" }}>
          <Info size={18} style={{ color: "#b07d10", flexShrink: 0, marginTop: 2 }} />
          <p style={{ margin: 0, fontSize: 14, color: "#7a5608", lineHeight: 1.6 }}>
            {config.disclaimer}
          </p>
        </div>

        {/* 가격 테이블 목록 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(28px,4vw,48px)" }}>
          {config.categories.map((cat) => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <div style={{ marginBottom: 12 }}>
                <h2
                  id={`cat-${cat.id}`}
                  style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: "clamp(17px,2vw,22px)", letterSpacing: "-0.02em", margin: "0 0 4px", color: "var(--ink,#0b1a30)" }}
                >
                  {cat.title}
                </h2>
                {cat.note && (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3,#5b6781)" }}>{cat.note}</p>
                )}
              </div>

              <div style={{ background: "var(--panel,#fff)", border: "1px solid var(--hair,#e6dfd0)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--cream-2,#f1ece1)" }}>
                      <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "var(--ink-2,#2a3a55)", borderBottom: "1px solid var(--hair,#e6dfd0)" }}>
                        항목
                      </th>
                      <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--ink-2,#2a3a55)", borderBottom: "1px solid var(--hair,#e6dfd0)", whiteSpace: "nowrap" }}>
                        기준 단가
                      </th>
                      <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--ink-2,#2a3a55)", borderBottom: "1px solid var(--hair,#e6dfd0)", whiteSpace: "nowrap" }}>
                        부속자재
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item, i) => (
                      <tr
                        key={item.name}
                        style={{ borderBottom: i < cat.items.length - 1 ? "1px solid var(--hair,#e6dfd0)" : "none" }}
                      >
                        <td style={{ padding: "12px 16px", fontSize: "clamp(13px,1.2vw,15px)", color: "var(--ink,#0b1a30)" }}>
                          {item.name}
                          <span style={{ marginLeft: 6, fontSize: 12, color: "var(--ink-4,#94a0b8)" }}>/ {item.unit}</span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "clamp(13px,1.2vw,15px)", fontWeight: 600, color: "var(--navy-700,#10284a)", whiteSpace: "nowrap" }}>
                          {item.priceLabel}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "center", fontSize: 13 }}>
                          {item.materialNote === "별도" ? (
                            <span style={{ background: "#f0f4ff", color: "#3b5bdb", fontWeight: 600, fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>
                              별도
                            </span>
                          ) : (
                            <span style={{ color: "var(--ink-4,#94a0b8)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        {/* 하단 CTA */}
        <div style={{ marginTop: "clamp(40px,6vw,72px)", background: "var(--navy-800,#0b1d34)", borderRadius: 16, padding: "clamp(28px,4vw,48px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--f-display)", fontWeight: 800, fontSize: "clamp(20px,2.5vw,30px)", color: "#fff", letterSpacing: "-0.02em" }}>
            정확한 견적은 현장 확인 후 안내드립니다
          </h2>
          <p style={{ margin: 0, fontSize: "clamp(14px,1.2vw,16px)", color: "rgba(255,255,255,0.65)" }}>
            사진을 먼저 보내주시면 현장 방문 없이도 범위를 빠르게 확인합니다.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a className="primary-button" href={business.phoneHref} style={{ minHeight: 46 }}>
              <Phone size={18} />
              전화 상담
            </a>
            <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer" style={{ minHeight: 46, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              <MessageCircle size={18} />
              카카오톡 상담
            </a>
          </div>
        </div>
        <div className="mobile-cta-spacer" aria-hidden="true" />
      </main>
      <MobileQuickCta />
    </>
  );
}
