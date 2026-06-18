import { useMemo, useState } from "react";
import { Calculator, ChevronDown, ChevronLeft, MessageCircle, Minus, Phone, Plus } from "lucide-react";
import { business } from "../data";
import { MobileQuickCta } from "../components/site/SiteFooter";
import { servicePricingRegistry } from "./registry";
import type { PricingItem } from "./types";

type SelectedItem = {
  serviceName: string;
  categoryTitle: string;
  item: PricingItem;
  qty: number;
};

function itemKey(servicePath: string, categoryId: string, itemName: string) {
  return `${servicePath}::${categoryId}::${itemName}`;
}

/**
 * 전체 서비스 모의 견적 계산(모바일 우선).
 * 서비스별 가격표(registry)를 한 페이지에 모아, 항목을 선택하면 합계를 계산한다.
 * 자재 '별도' 항목은 합계에 기본 단가만 반영하고 별도 표시한다. 정확한 견적은 현장 확인 후.
 */
export function AllServicesCalculatorPage() {
  const services = useMemo(() => Object.values(servicePricingRegistry), []);
  const [selected, setSelected] = useState<Record<string, SelectedItem>>({});
  const [openService, setOpenService] = useState<string | null>(services[0]?.servicePath ?? null);

  function toggleItem(servicePath: string, serviceName: string, categoryId: string, categoryTitle: string, item: PricingItem) {
    const key = itemKey(servicePath, categoryId, item.name);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { serviceName, categoryTitle, item, qty: 1 };
      }
      return next;
    });
  }

  function changeQty(key: string, delta: number) {
    setSelected((prev) => {
      const current = prev[key];
      if (!current) return prev;
      const qty = Math.max(1, current.qty + delta);
      return { ...prev, [key]: { ...current, qty } };
    });
  }

  const selectedList = Object.entries(selected);
  const total = selectedList.reduce((sum, [, value]) => sum + (value.item.price || 0) * value.qty, 0);
  const hasMaterialExtra = selectedList.some(([, value]) => value.item.materialNote === "별도");

  function goToEstimate() {
    const works = selectedList.map(([, value]) => `${value.serviceName} - ${value.item.name}`);
    const query = works.length ? `?works=${encodeURIComponent(works.join(","))}` : "";
    window.location.href = `/estimate${query}`;
  }

  return (
    <>
      <header className="nav" data-elevated="true">
        <div className="nav__inner">
          <a className="brand" href="/" aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/icon.png" alt="" aria-hidden="true" />
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
          if (window.history.length > 1) window.history.back();
          else window.location.href = "/";
        }}
      >
        <ChevronLeft size={18} />
        <span>이전</span>
      </button>

      <main className="calc-page">
        <div className="calc-page__head">
          <span className="calc-page__kicker">
            <Calculator size={15} />
            모의 견적 계산
          </span>
          <h1>필요한 작업을 골라 예상 비용을 확인하세요</h1>
          <p>
            서비스별 기준 단가로 대략적인 금액을 계산합니다. 현장 상태·난이도·자재에 따라 실제 비용은 달라지며, 정확한 견적은
            현장 확인 후 안내드립니다.
          </p>
        </div>

        <div className="calc-services">
          {services.map((service) => {
            const open = openService === service.servicePath;
            const serviceSelectedCount = selectedList.filter(([key]) => key.startsWith(`${service.servicePath}::`)).length;
            return (
              <section className="calc-service" key={service.servicePath}>
                <button
                  type="button"
                  className="calc-service__toggle"
                  aria-expanded={open}
                  onClick={() => setOpenService(open ? null : service.servicePath)}
                >
                  <span className="calc-service__name">
                    {service.serviceName}
                    {serviceSelectedCount > 0 ? <em className="calc-service__badge">{serviceSelectedCount}</em> : null}
                  </span>
                  <ChevronDown size={18} className={open ? "calc-chevron calc-chevron--open" : "calc-chevron"} />
                </button>

                {open ? (
                  <div className="calc-service__body">
                    {service.categories.map((cat) => (
                      <div className="calc-cat" key={cat.id}>
                        <h2 className="calc-cat__title">{cat.title}</h2>
                        <ul className="calc-items">
                          {cat.items.map((item) => {
                            const key = itemKey(service.servicePath, cat.id, item.name);
                            const chosen = selected[key];
                            return (
                              <li key={item.name} className={chosen ? "calc-item calc-item--on" : "calc-item"}>
                                <button
                                  type="button"
                                  className="calc-item__main"
                                  aria-pressed={Boolean(chosen)}
                                  onClick={() =>
                                    toggleItem(service.servicePath, service.serviceName, cat.id, cat.title, item)
                                  }
                                >
                                  <span className="calc-item__check" aria-hidden="true" />
                                  <span className="calc-item__name">
                                    {item.name}
                                    <span className="calc-item__unit">/ {item.unit}</span>
                                    {item.materialNote === "별도" ? (
                                      <span className="calc-item__material">자재 별도</span>
                                    ) : null}
                                  </span>
                                  <span className="calc-item__price">{item.priceLabel}</span>
                                </button>
                                {chosen ? (
                                  <div className="calc-qty" aria-label={`${item.name} 수량`}>
                                    <button type="button" onClick={() => changeQty(key, -1)} aria-label="수량 줄이기">
                                      <Minus size={14} />
                                    </button>
                                    <span>{chosen.qty}</span>
                                    <button type="button" onClick={() => changeQty(key, 1)} aria-label="수량 늘리기">
                                      <Plus size={14} />
                                    </button>
                                  </div>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mobile-cta-spacer" aria-hidden="true" />
        <div className="calc-spacer" aria-hidden="true" />
      </main>

      {/* 합계 요약(고정) */}
      <div className="calc-summary" role="status" aria-live="polite">
        <div className="calc-summary__row">
          <span className="calc-summary__label">선택 {selectedList.length}개 · 예상 합계</span>
          <strong className="calc-summary__total">{total.toLocaleString("ko-KR")}원{hasMaterialExtra ? "~" : ""}</strong>
        </div>
        {hasMaterialExtra ? <p className="calc-summary__note">‘자재 별도’ 항목은 자재비가 추가됩니다.</p> : null}
        <div className="calc-summary__actions">
          <button type="button" className="calc-summary__cta" onClick={goToEstimate} disabled={!selectedList.length}>
            이 내역으로 견적 상담
          </button>
          <a className="calc-summary__alt" href={business.kakaoUrl} target="_blank" rel="noreferrer" aria-label="카카오톡 상담">
            <MessageCircle size={18} />
          </a>
          <a className="calc-summary__alt" href={business.phoneHref} aria-label="전화 상담">
            <Phone size={18} />
          </a>
        </div>
      </div>

      <MobileQuickCta />
    </>
  );
}
