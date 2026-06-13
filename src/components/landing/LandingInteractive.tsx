import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  ArrowUpRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  ReceiptText,
  RefreshCw
} from "lucide-react";
import { business, pinnedPosts } from "../../data";
import { BlogPortfolioService } from "../../services/BlogPortfolioService";
import { buildEstimateHref } from "../../services/QuoteService";
import { getServicePricingConfig } from "../../pricing/registry";
import type { PortfolioPost } from "../../types";
import type { LandingPageDefinition } from "../../landingPages";
import type { ServicePricingConfig } from "../../pricing/types";

/**
 * 랜딩의 인터랙티브 영역(블로그 레퍼런스 캐러셀 + 모의 견적기 + 이전 버튼)을
 * App.tsx에서 옮긴 아일랜드. SEO 대상이 아니므로 Astro에서 client:visible로 수화한다.
 * App.tsx 원본 코드는 Phase 7에서 라우팅과 함께 삭제되어 중복이 해소된다.
 */

const blogPortfolioService = new BlogPortfolioService("/api/naver-blog", pinnedPosts);

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function buildSummaryLines(description: string) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  if (!cleaned) return ["상세 내용을 확인해 주세요."];
  const sentences = cleaned
    .split(/(?<=[.!?])\s+|(?<=다)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (!sentences.length) return [cleaned.slice(0, 120)];
  return sentences.slice(0, 3).map((sentence) => sentence.slice(0, 80));
}

function normalizeSearchText(value: string) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function parseLandingPostDate(value: string) {
  const cleaned = String(value ?? "").replace(/[^\d]/g, "");
  if (cleaned.length < 8) return 0;
  const year = Number.parseInt(cleaned.slice(0, 4), 10);
  const month = Number.parseInt(cleaned.slice(4, 6), 10) - 1;
  const day = Number.parseInt(cleaned.slice(6, 8), 10);
  const timestamp = new Date(year, month, day).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareLandingPostDate(left: string, right: string) {
  return parseLandingPostDate(left) - parseLandingPostDate(right);
}

function scoreLandingPost(post: PortfolioPost, terms: string[], page: LandingPageDefinition) {
  const title = normalizeSearchText([post.title, post.cardTitle].filter(Boolean).join(" "));
  const description = normalizeSearchText(post.description);
  const summary = normalizeSearchText((post.summary ?? []).join(" "));
  const keywords = normalizeSearchText((post.keywords ?? []).join(" "));
  const haystack = `${title} ${description} ${summary} ${keywords}`;
  const blockedTerms = page.blogExcludeTerms ?? [];

  if (blockedTerms.some((term) => term && haystack.includes(term))) return 0;
  if (!terms.length || !terms.some((term) => haystack.includes(term))) return 0;

  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    const titleHit = title.includes(term);
    const descriptionHit = description.includes(term);
    const summaryHit = summary.includes(term);
    const keywordsHit = keywords.includes(term);
    if (!titleHit && !descriptionHit && !summaryHit && !keywordsHit) continue;
    if (titleHit) score += 8;
    if (keywordsHit) score += 6;
    if (descriptionHit) score += 4;
    if (summaryHit) score += 5;
    score += term.length >= 3 ? 2 : 1;
  }

  if (page.pageType === "Service") {
    score += title.length ? 6 : 0;
    score += keywords ? 3 : 0;
    score += summary ? 2 : 0;
  } else {
    score += description ? 6 : 0;
    score += summary ? 4 : 0;
  }

  const parsedDate = parseLandingPostDate(post.date);
  if (parsedDate) score += page.pageType === "Place" ? 8 : 5;
  return score;
}

function filterLandingPosts(posts: PortfolioPost[], page: LandingPageDefinition, terms: string[]) {
  return posts
    .map((post) => ({ post, score: scoreLandingPost(post, terms, page) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareLandingPostDate(right.post.date, left.post.date))
    .map((entry) => entry.post)
    .slice(0, 6);
}

function buildLandingSearchTerms(page: LandingPageDefinition) {
  const terms =
    page.pageType === "Service" ? page.blogTerms ?? page.searchTerms : [page.areaLabel, ...page.searchTerms];
  return terms
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function buildLandingQueryTerms(page: LandingPageDefinition) {
  const terms =
    page.pageType === "Service"
      ? page.blogQueryTerms ?? page.blogTerms ?? page.searchTerms
      : [page.areaLabel, ...page.searchTerms];
  return terms
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function useAutoCarousel(ref: RefObject<HTMLElement | null>, { enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const container = ref.current;
    if (!container) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    if (prefersReducedMotion || !isMobile) return;
    const overflow = container.scrollWidth > container.clientWidth + 8;
    if (!overflow) return;

    let stopped = false;
    const timerId = window.setInterval(() => {
      if (stopped) return;
      const firstCard = container.firstElementChild as HTMLElement | null;
      if (!firstCard) return;
      const cardWidth = firstCard.getBoundingClientRect().width;
      const gapValue = window.getComputedStyle(container).columnGap || window.getComputedStyle(container).gap || "0";
      const gap = Number.parseFloat(gapValue) || 0;
      const step = Math.max(220, cardWidth + gap);
      const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 12;
      container.scrollTo({ left: atEnd ? 0 : container.scrollLeft + step, behavior: "smooth" });
    }, 2800);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timerId);
    };
    const events: Array<keyof HTMLElementEventMap> = ["pointerdown", "touchstart", "wheel", "keydown", "mousedown"];
    events.forEach((eventName) => container.addEventListener(eventName, stop, { passive: true }));
    return () => {
      window.clearInterval(timerId);
      events.forEach((eventName) => container.removeEventListener(eventName, stop));
    };
  }, [enabled, ref]);
}

function BlogCardImage({ post }: { post: PortfolioPost }) {
  const candidates = useMemo(() => {
    const values = [post.image, ...(post.imageCandidates ?? [])].map((candidate) => candidate.trim()).filter(Boolean);
    return [...new Set(values)];
  }, [post.image, post.imageCandidates]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [post.link, post.title, candidates.join("|")]);

  const currentImage = candidates[candidateIndex] ?? "/assets/consult-hero.png";

  return (
    <img
      className="blog-card-image"
      src={currentImage}
      alt={post.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(event) => {
        if (candidateIndex < candidates.length - 1) {
          setCandidateIndex((index) => index + 1);
          return;
        }
        const image = event.currentTarget;
        if (image.dataset.fallbackApplied === "true") return;
        image.dataset.fallbackApplied = "true";
        image.src = "/assets/consult-hero.png";
      }}
    />
  );
}

function BlogShowcase({ label, posts, emptyText }: { label: string; posts: PortfolioPost[]; emptyText: string }) {
  const displayPosts = posts.slice(0, 5);
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const scrollFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useAutoCarousel(railRef, { enabled: displayPosts.length > 1 });

  function scrollToIndex(index: number) {
    const rail = railRef.current;
    const card = cardRefs.current[index];
    if (!rail || !card) return;
    const railRect = rail.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    rail.scrollBy({ left: cardRect.left - railRect.left - (railRect.width - cardRect.width) / 2, behavior: "smooth" });
  }

  function syncActiveFromScroll() {
    const rail = railRef.current;
    if (!rail) return;
    const railCenter = rail.scrollLeft + rail.offsetWidth / 2;
    let nearest = 0;
    let nearestDist = Infinity;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - railCenter);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  }

  function handleScroll() {
    if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = window.requestAnimationFrame(syncActiveFromScroll);
  }

  function goToIndex(next: number) {
    const normalized = (next + displayPosts.length) % displayPosts.length;
    setActiveIndex(normalized);
    scrollToIndex(normalized);
  }

  return (
    <div className="landing-blog-showcase">
      <h3>{label}</h3>
      {displayPosts.length ? (
        <>
          <div className="blog-card-grid landing-blog-grid blog-card-carousel-mobile" ref={railRef} onScroll={handleScroll}>
            {displayPosts.map((post, index) => (
              <a
                className={index === 0 ? "blog-card blog-card-featured" : "blog-card"}
                href={post.link}
                target="_blank"
                rel="noreferrer"
                key={`${label}-${post.link}-${post.title}`}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
              >
                <BlogCardImage post={post} />
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="naver-mark">N</span>
                    <time>{post.date}</time>
                  </div>
                  <h3>{post.cardTitle ?? post.title}</h3>
                  <div className="blog-card-summary">
                    {(post.summary?.length ? post.summary : buildSummaryLines(post.description)).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  {!!post.keywords?.length && (
                    <div className="blog-card-keywords" aria-label="요약 키워드">
                      {post.keywords.slice(0, 4).map((keyword) => (
                        <span className="blog-keyword" key={keyword}>
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="blog-card-link">
                    자세히 보기 <ExternalLink size={16} />
                  </span>
                </div>
              </a>
            ))}
          </div>
          {displayPosts.length > 1 && (
            <div className="blog-carousel-controls" aria-label={`${label} 캐러셀 컨트롤`}>
              <button className="cases__carousel-button" type="button" onClick={() => goToIndex(activeIndex - 1)} aria-label="이전 글">
                <ChevronLeft size={16} />
              </button>
              <div className="cases__carousel-dots" aria-label="현재 위치">
                {displayPosts.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={index === activeIndex ? "cases__dot active" : "cases__dot"}
                    onClick={() => goToIndex(index)}
                    aria-label={`${index + 1}번째 글로 이동`}
                    aria-pressed={index === activeIndex}
                  />
                ))}
              </div>
              <button className="cases__carousel-button" type="button" onClick={() => goToIndex(activeIndex + 1)} aria-label="다음 글">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="landing-empty">{emptyText}</p>
      )}
    </div>
  );
}

function ServiceEstimator({ config }: { config: ServicePricingConfig }) {
  const [selected, setSelected] = useState<Record<string, number>>({});

  const toggle = useCallback((name: string) => {
    setSelected((prev) => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: 1 };
    });
  }, []);

  const setItemQty = useCallback((name: string, qty: number) => {
    setSelected((prev) => {
      if (!prev[name]) return prev;
      return { ...prev, [name]: Math.max(1, Math.min(99, qty)) };
    });
  }, []);

  const selectedItems = useMemo(
    () => config.categories.flatMap((cat) => cat.items).filter((item) => selected[item.name]),
    [selected, config]
  );

  const selectedCount = selectedItems.length;
  const canAdjustQuantity = (_unit: string) => true;
  const total = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * (selected[item.name] ?? 1), 0),
    [selectedItems, selected]
  );
  const hasCallout = selectedItems.some((i) => i.name.includes("출장"));
  const hasMaterial = selectedItems.some((i) => i.materialNote === "별도");
  const fmt = (n: number) => n.toLocaleString("ko-KR") + "원";

  return (
    <section className="landing-section section" aria-labelledby="estimator-title">
      <SectionHeading
        id="estimator-title"
        title="모의 견적 계산기"
        description="항목을 클릭해 선택하면 최소 기준 비용을 바로 확인할 수 있습니다. 실제 견적은 현장 상태에 따라 달라집니다."
      />

      <div className="estimator-layout">
        <div className="estimator-table-col">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--ink-3,#5b6781)" }}>항목 클릭으로 선택 · 복수 항목 동시 선택 가능</span>
            {selectedCount > 0 && (
              <button
                onClick={() => setSelected({})}
                style={{ background: "none", border: "1px solid var(--hair,#e6dfd0)", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "var(--ink-3,#5b6781)", padding: "3px 10px", display: "flex", alignItems: "center", gap: 4 }}
              >
                <RefreshCw size={12} />
                초기화
              </button>
            )}
          </div>

          <div style={{ background: "#fff", border: "1px solid var(--hair,#e6dfd0)", borderRadius: 12, overflow: "hidden" }}>
            {config.categories.map((cat, catIdx) => (
              <div key={cat.id}>
                <div style={{ background: "var(--cream-2,#f1ece1)", padding: "8px 16px", borderTop: catIdx > 0 ? "1px solid var(--hair,#e6dfd0)" : undefined, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink,#0b1a30)" }}>{cat.title}</span>
                  {cat.note && <span style={{ fontSize: 12, color: "var(--ink-3,#5b6781)" }}>· {cat.note}</span>}
                </div>

                {cat.items.map((item) => {
                  const qty = selected[item.name] ?? 0;
                  const isSelected = qty > 0;
                  const isQuantityItem = canAdjustQuantity(item.unit);
                  return (
                    <div
                      key={item.name}
                      className="estimator-item-row"
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => toggle(item.name)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          toggle(item.name);
                        }
                      }}
                    >
                      <div className="estimator-checkbox">
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "clamp(13px,1.2vw,14px)", color: "var(--ink,#0b1a30)" }}>{item.name}</span>
                        <span style={{ marginLeft: 6, fontSize: 11, color: "var(--ink-4,#94a0b8)" }}>/ {item.unit}</span>
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-700,#10284a)", whiteSpace: "nowrap" }}>{item.priceLabel}</span>

                      {item.materialNote === "별도" ? (
                        <span style={{ background: "#f0f4ff", color: "#3b5bdb", fontWeight: 600, fontSize: 11, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>자재별도</span>
                      ) : (
                        <span style={{ width: 44, flexShrink: 0 }} />
                      )}

                      {isSelected && isQuantityItem && (
                        <div
                          className="estimator-qty-control"
                          aria-label={`${item.name} 수량`}
                          onClick={(event) => event.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, border: "1px solid var(--hair,#e6dfd0)", borderRadius: 999, padding: 2, background: "#fff" }}
                        >
                          <button
                            type="button"
                            aria-label={`${item.name} 수량 줄이기`}
                            onClick={() => setItemQty(item.name, qty - 1)}
                            style={{ width: 22, height: 22, border: 0, borderRadius: 999, background: "var(--cream-2,#f1ece1)", color: "var(--ink,#0b1a30)", cursor: "pointer", fontWeight: 800, lineHeight: 1 }}
                          >
                            -
                          </button>
                          <span style={{ minWidth: 18, textAlign: "center", fontSize: 12, fontWeight: 800, color: "var(--ink,#0b1a30)" }}>{qty}</span>
                          <button
                            type="button"
                            aria-label={`${item.name} 수량 늘리기`}
                            onClick={() => setItemQty(item.name, qty + 1)}
                            style={{ width: 22, height: 22, border: 0, borderRadius: 999, background: "var(--navy-700,#10284a)", color: "#fff", cursor: "pointer", fontWeight: 800, lineHeight: 1 }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="estimator-panel-col">
          <div style={{ background: "#fff", border: "1px solid var(--hair,#e6dfd0)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hair,#e6dfd0)", display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={16} style={{ color: "var(--ink-2,#2a3a55)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink,#0b1a30)" }}>견적 요약</span>
              {selectedCount > 0 && (
                <span style={{ marginLeft: "auto", background: "#3b5bdb", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{selectedCount}</span>
              )}
            </div>

            <div style={{ padding: "16px 18px" }}>
              {selectedItems.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3,#5b6781)", textAlign: "center", lineHeight: 1.7 }}>
                  왼쪽에서 항목을 선택하면<br />견적이 자동으로 계산됩니다.
                </p>
              ) : (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    {selectedItems.map((item) => {
                      const qty = selected[item.name] ?? 1;
                      return (
                        <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, fontSize: 13 }}>
                          <span style={{ color: "var(--ink-2,#2a3a55)", flex: 1, lineHeight: 1.4 }}>
                            {item.name}
                            {qty > 1 && <span style={{ color: "var(--ink-4,#94a0b8)", fontWeight: 700 }}> ×{qty}</span>}
                          </span>
                          <span style={{ fontWeight: 600, color: "var(--ink,#0b1a30)", whiteSpace: "nowrap" }}>{fmt(item.price * qty)}~</span>
                        </div>
                      );
                    })}
                  </div>

                  {!hasCallout && <p style={{ fontSize: 12, color: "var(--ink-3,#5b6781)", margin: "0 0 6px" }}>* 출장비(평일 15,000원~) 별도</p>}
                  {hasMaterial && <p style={{ fontSize: 12, color: "var(--ink-3,#5b6781)", margin: "0 0 10px" }}>* 부속자재 비용 별도 항목 있음</p>}

                  <div style={{ borderTop: "1px solid var(--hair,#e6dfd0)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-2,#2a3a55)" }}>
                      <span>공급가액</span>
                      <span style={{ fontWeight: 600 }}>{fmt(total)}~</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink-2,#2a3a55)" }}>
                      <span>부가세 (10%)</span>
                      <span style={{ fontWeight: 600 }}>{fmt(Math.round(total * 0.1))}~</span>
                    </div>
                    <div style={{ borderTop: "2px solid var(--navy-700,#10284a)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--ink,#0b1a30)" }}>최소 합계</span>
                      <span style={{ fontWeight: 800, fontSize: "clamp(16px,1.8vw,20px)", color: "var(--navy-700,#10284a)" }}>{fmt(Math.round(total * 1.1))}~</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    <a className="primary-button" href={business.phoneHref} style={{ minHeight: 42, justifyContent: "center" }}>
                      <Phone size={16} />
                      전화 상담
                    </a>
                    <a
                      className="secondary-button"
                      href={buildEstimateHref({
                        works: selectedItems.map((i) => i.name),
                        sourceServicePath: config.servicePath,
                        sourcePricingPath: config.pricingPagePath
                      })}
                      style={{ minHeight: 38, justifyContent: "center", fontSize: 13 }}
                    >
                      이 항목으로 견적 받기 <ArrowUpRight size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <a href={config.pricingPagePath} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13, color: "var(--ink-3,#5b6781)", marginTop: 12 }}>
            <ReceiptText size={14} />
            전체 가격표 보기
          </a>
        </div>
      </div>
    </section>
  );
}

export function LandingBackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  return (
    <button
      className="landing-back-btn"
      type="button"
      aria-label="이전 페이지로 이동"
      onClick={() => {
        if (typeof window === "undefined") return;
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = fallbackHref;
        }
      }}
    >
      <ChevronLeft size={18} />
      <span>이전</span>
    </button>
  );
}

/** 랜딩 'blog' 섹션 — App.tsx LandingPage의 blog case와 동일. */
export function LandingBlogSection({ content }: { content: LandingPageDefinition }) {
  const [landingPosts, setLandingPosts] = useState<PortfolioPost[]>([]);

  const landingSearchTerms = buildLandingSearchTerms(content);
  const landingQueryTerms = buildLandingQueryTerms(content);
  const landingSearchKey = `${landingQueryTerms.join("|")}::${(content.blogCategoryNos ?? []).join(",")}`;

  useEffect(() => {
    blogPortfolioService.loadPortfolioPosts(landingQueryTerms, content.blogCategoryNos ?? []).then(({ posts }) => {
      setLandingPosts(posts);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [landingSearchKey]);

  const referencePosts = useMemo(() => {
    const matchedPosts = filterLandingPosts(landingPosts, content, landingSearchTerms);
    if (content.pageType === "Service") return matchedPosts;
    if (matchedPosts.length) return matchedPosts;
    return landingPosts.slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, landingPosts, landingSearchTerms]);

  const portfolioPosts = pinnedPosts.slice(0, 5);
  const pricingConfig = getServicePricingConfig(content.path);

  return (
    <section className="landing-section section" aria-labelledby="landing-blog-title">
      <SectionHeading
        id="landing-blog-title"
        title={`${content.serviceType ?? content.areaLabel ?? content.searchTerms[0]} 사례 & 블로그`}
        description={`${content.serviceType ?? content.areaLabel ?? content.searchTerms[0]} 관련 시공 사례와 블로그 게시물을 모았습니다.`}
      />
      <BlogShowcase label="블로그 레퍼런스" posts={referencePosts} emptyText="키워드가 맞는 최신 게시물을 찾지 못했습니다." />
      <BlogShowcase label="포트폴리오" posts={portfolioPosts} emptyText="추가 포트폴리오를 찾지 못했습니다." />
      {pricingConfig && <ServiceEstimator config={pricingConfig} />}
    </section>
  );
}
