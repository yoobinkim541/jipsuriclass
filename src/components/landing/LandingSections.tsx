import { ArrowUpRight, CheckCircle2, MessageCircle, Phone, ReceiptText } from "lucide-react";
import { business } from "../../data";
import { BusinessInfoList } from "../OfficeSection";
import { getServicePricingConfig } from "../../pricing/registry";
import type { LandingPageDefinition } from "../../landingPages";

/**
 * 랜딩 정적 섹션 — App.tsx LandingPage의 summary/points/faq/relatedLinks 분기를
 * 그대로 옮긴 것. window/상태/이펙트 없이 props만 쓰므로 Astro가 빌드 타임에
 * 정적 HTML(JS 0)로 렌더한다. 이게 SEO 핵심 본문이다.
 */

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function buildPriceSelectionHref(path: string, options: { items?: string[]; focus?: string }) {
  const params = new URLSearchParams();
  if (options.focus) params.set("focus", options.focus);
  if (options.items?.length) params.set("items", options.items.join(","));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function LandingSummarySection({ content }: { content: LandingPageDefinition }) {
  const pricingConfig = getServicePricingConfig(content.path);
  return (
    <section
      className={`landing-hero section${content.path === "/service/plumbing" ? " landing-hero--plumbing" : ""}${content.path === "/service/bathroom" ? " landing-hero--bathroom" : ""}`}
      aria-labelledby="landing-title"
    >
      <span className="landing-kicker">{content.categoryLabel}</span>
      <div className="landing-hero-grid">
        <div className="landing-hero-copy">
          <h1 id="landing-title">{content.heroTitle}</h1>
          <p>{content.heroDescription}</p>
          <div className="hero-actions">
            <a className="primary-button" href={business.phoneHref}>
              <Phone size={20} />
              전화 상담
            </a>
            <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={20} />
              카카오톡 상담
            </a>
            <a className="secondary-button" href="/estimate">
              <ArrowUpRight size={20} />
              견적상담
            </a>
            {pricingConfig && (
              <a className="secondary-button" href={pricingConfig.pricingPagePath}>
                <ReceiptText size={20} />
                가격표 보기
              </a>
            )}
          </div>
          {content.path === "/service/waterproofing-tile" ? (
            <div className="landing-price-quick">
              <span className="landing-price-quick__label">빠른 모의견적</span>
              <div className="landing-price-quick__grid">
                <a
                  className="secondary-button"
                  href={buildPriceSelectionHref("/service/waterproofing-tile/price", {
                    focus: "waterproofing-finish",
                    items: ["waterproof-bathroom-waterproof", "waterproof-bathroom-silicone", "waterproof-tile-repair"]
                  })}
                >
                  욕실 방수
                </a>
                <a
                  className="secondary-button"
                  href={buildPriceSelectionHref("/service/waterproofing-tile/price", {
                    focus: "tile-repair",
                    items: ["tile-break-repair"]
                  })}
                >
                  타일 깨짐보수
                </a>
                <a
                  className="secondary-button"
                  href={buildPriceSelectionHref("/service/waterproofing-tile/price", {
                    focus: "tile-repair",
                    items: ["tile-caulking", "tile-silicone"]
                  })}
                >
                  줄눈·실리콘 보수
                </a>
                <a
                  className="secondary-button"
                  href={buildPriceSelectionHref("/service/waterproofing-tile/price", {
                    focus: "tile-repair",
                    items: ["tile-bathtub-finish"]
                  })}
                >
                  욕조철거 후 타일마감
                </a>
              </div>
            </div>
          ) : null}
        </div>
        <aside className="landing-hero-panel">
          <span className="landing-panel-label">핵심 안내</span>
          <ul className="landing-highlight-list">
            {content.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <BusinessInfoList />
        </aside>
      </div>
    </section>
  );
}

export function LandingPointsSection({ content }: { content: LandingPageDefinition }) {
  const isPlumbingPage = content.path === "/service/plumbing";
  const isServicePage = content.categoryLabel === "서비스";
  const plumbingPointTitles = [
    "문제가 생긴 곳부터 확인합니다",
    "꼭 필요한 작업만 정리합니다",
    "급한 조치와 복구를 나눠 안내합니다"
  ];
  const plumbingPointBodies = [
    "물이 새거나 막힌 곳과 실제 원인이 다를 수 있어 사진과 현장을 함께 확인합니다.",
    "배관, 배수, 온수, 해빙, 부속 교체 중 필요한 작업만 골라 안내합니다.",
    "급한 증상은 먼저 막고, 복구 작업은 현장 상태와 일정에 맞춰 진행합니다."
  ];
  const servicePointTitles = ["현장 상태를 먼저 확인합니다", "필요한 작업을 정리합니다", "작업 범위를 안내합니다"];

  if (isServicePage) {
    return (
      <section className="landing-section landing-section--service-points" aria-labelledby="landing-points-title">
        <div className="landing-points-layout">
          <div className="landing-points-heading">
            <span>현장 상담 기준</span>
            <h2 id="landing-points-title">{content.pointsTitle}</h2>
            <p>{content.description}</p>
            <small>사진을 먼저 보내주시면 방문 전 작업 범위와 우선순위를 더 빠르게 정리할 수 있습니다.</small>
          </div>
          <div className="landing-point-grid landing-point-grid--service">
            {content.points.map((point, index) => (
              <article className="landing-point-card landing-point-card--service" key={point}>
                <span className="landing-point-card__number">0{index + 1}</span>
                <h3>{(isPlumbingPage ? plumbingPointTitles : servicePointTitles)[index] ?? "현장 상태를 함께 확인합니다"}</h3>
                <p>{(isPlumbingPage ? plumbingPointBodies[index] : undefined) ?? point}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="landing-section section" aria-labelledby="landing-points-title">
      <SectionHeading id="landing-points-title" title={content.pointsTitle} description={content.description} />
      <div className="landing-point-grid">
        {content.points.map((point) => (
          <article className="landing-point-card" key={point}>
            <CheckCircle2 size={20} />
            <p>{point}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function LandingFaqSection({ content }: { content: LandingPageDefinition }) {
  return (
    <section className="landing-section section" aria-labelledby="landing-faq-title">
      <SectionHeading
        id="landing-faq-title"
        title="자주 묻는 질문"
        description="자주 묻는 질문을 짧고 분명하게 정리했습니다."
      />
      <div className="landing-faq-list">
        {content.faq.map((item) => (
          <details className="landing-faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function LandingRelatedSection({ content }: { content: LandingPageDefinition }) {
  return (
    <section className="landing-section section" aria-labelledby="landing-related-title">
      <SectionHeading
        id="landing-related-title"
        title="함께 보면 좋은 페이지"
        description={
          content.categoryLabel === "지역"
            ? "인근·연관 지역 상담 페이지로 바로 이동할 수 있습니다."
            : "비슷한 서비스 페이지로 바로 이동할 수 있습니다."
        }
      />
      <div className="landing-related-links">
        {content.relatedLinks.map((link) => (
          <a className="landing-related-link" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
