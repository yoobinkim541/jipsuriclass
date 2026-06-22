import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bath,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorClosed,
  Droplets,
  LayoutGrid,
  Lightbulb,
  Menu,
  MessageCircle,
  Phone,
  ShieldAlert,
  User,
  Wrench,
  X,
  Zap,
  type LucideIcon
} from "lucide-react";
import { business, navItems } from "../data";
import { symptomCategories, type SymptomCategory } from "../data";
import { diagnosisTopics, getDiagnosisTopicById, getDiagnosisTopicByTrigger, SELF_CHECKABLE_IDS, type DiagnosisTopic } from "./diagnosisData";
import { MobileQuickCta } from "../components/site/SiteFooter";
import { trackEvent } from "../lib/analytics";
import { SiteContentService, defaultDiagnosisPageContent } from "../services/SiteContentService";
import type { DiagnosisPageContent } from "../types";

const siteContentService = new SiteContentService();

// 카테고리별 라인 아이콘(증상 카드·카테고리 펄 공용). 이모지 대신 브랜드 톤의 선 아이콘.
const CATEGORY_ICON: Record<string, LucideIcon> = {
  door: DoorClosed,
  leak: Droplets,
  wall: LayoutGrid,
  electric: Zap,
  bathroom: Bath,
  kitchen: Wrench
};
const categoryIconFor = (id: string): LucideIcon => CATEGORY_ICON[id] ?? Wrench;

// 히어로 3단계 안내(페이지 흐름과 1:1 대응).
const DIAGNOSIS_STEPS = [
  { title: "문제 부위 선택", desc: "문·창문, 누수, 전기 등 선택" },
  { title: "증상 선택", desc: "해당 증상을 선택해 주세요" },
  { title: "원인·대응법 확인", desc: "원인과 해결 방법을 안내드려요" }
];

export function DiagnosisPage() {
  // SSR(빌드/프리렌더) 시 window가 없으므로 가드 — 렌더 중 실행되는 useMemo 초기화 안전화.
  const query = useMemo(
    () => new URLSearchParams(typeof window === "undefined" ? "" : window.location.search),
    []
  );
  const [content, setContent] = useState<DiagnosisPageContent>(defaultDiagnosisPageContent);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadDiagnosisContent()
      .then((loaded) => {
        if (mounted) setContent(loaded);
      })
      .catch(() => {
        /* 로드 실패 시 기본 문구 유지 */
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 관리자 편집 내용(content.topics)을 코드의 토픽에 id 기준으로 덧입혀 화면에 반영한다.
  const topicOverrides = useMemo(() => new Map(content.topics.map((topic) => [topic.id, topic])), [content]);
  const viewTopic = (topic: DiagnosisTopic): DiagnosisTopic => {
    const override = topicOverrides.get(topic.id);
    return override ? { ...topic, ...override } : topic;
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const activeHref = "/diagnosis";

  const initialCategory = useMemo<SymptomCategory | null>(() => {
    const catId = query.get("category");
    return catId ? (symptomCategories.find((c) => c.id === catId) ?? symptomCategories[0]) : symptomCategories[0];
  }, [query]);

  const initialTopic = useMemo<DiagnosisTopic>(() => {
    const issue = query.get("issue") ?? query.get("topic");
    if (issue) return getDiagnosisTopicByTrigger(issue) ?? getDiagnosisTopicById(issue);
    return diagnosisTopics[0];
  }, [query]);

  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>(initialCategory ?? symptomCategories[0]);
  const [selectedTopic, setSelectedTopic] = useState<DiagnosisTopic>(initialTopic);
  const answerRef = useRef<HTMLElement>(null);
  const symptomListRef = useRef<HTMLElement>(null);

  function scrollToAnswer() {
    setTimeout(() => {
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // 메인 페이지에서 직접 진입 시 자동 스크롤
  useEffect(() => {
    if (query.get("issue") || query.get("topic")) {
      // 증상 직접 선택 → 답변까지
      scrollToAnswer();
    } else if (query.get("category")) {
      // 카테고리 선택 → 증상 목록으로
      setTimeout(() => {
        symptomListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const resolveHref = (href: string) => (href.startsWith("#") ? `/${href}` : href);

  function pickCategory(cat: SymptomCategory) {
    setSelectedCategory(cat);
    const first = diagnosisTopics.find((t) => t.id === cat.symptoms[0]?.id);
    if (first) setSelectedTopic(first);
  }

  function pickTopic(id: string) {
    const topic = getDiagnosisTopicById(id);
    if (topic) {
      setSelectedTopic(topic);
      scrollToAnswer();
      // 어떤 증상(문제)으로 자가진단을 하는지 분포 측정 — 수요 파악·콘텐츠 우선순위에 활용
      trackEvent("diagnosis_symptom", { topic: topic.id });
    }
  }

  return (
    <>
      <header className="nav diagnosis-header" data-elevated={menuOpen || scrolled ? "true" : "false"}>
        <div className="nav__progress">
          <span className="nav__progress-bar" style={{ width: `${scrollPct}%` }} />
        </div>
        <div className="nav__inner">
          <a className="brand" href="/" aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/icon.png" alt="" aria-hidden="true" />
            <span className="brand__name">
              집수리<em>클라쓰</em>
            </span>
          </a>
          <nav className="nav__links" aria-label="주요 메뉴">
            {navItems.map((item) => (
              <a
                href={resolveHref(item.href)}
                key={item.href}
                data-active={activeHref === item.href ? "true" : undefined}
                aria-current={activeHref === item.href ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="nav__actions">
            <a className="nav__login" href="/login" aria-label="마이페이지">
              <User size={17} />
              <span>마이페이지</span>
            </a>
            <a className="nav__phone" href={business.phoneHref}>
              {business.phone}
            </a>
            <button className="nav__menu" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "사이드바 닫기" : "사이드바 열기"}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div className="mobile-menu">
            <button onClick={() => setMenuOpen(false)} aria-label="메뉴 닫기">
              <X size={24} />
            </button>
            {navItems.map((item) => (
              <a
                href={resolveHref(item.href)}
                key={item.href}
                onClick={() => setMenuOpen(false)}
                data-active={activeHref === item.href ? "true" : undefined}
                aria-current={activeHref === item.href ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
            <a href="/login" onClick={() => setMenuOpen(false)}>
              마이페이지
            </a>
          </div>
        </>
      )}

      <main className="diagnosis-page" id="top">
        <section className="diagnosis-hero section" aria-labelledby="diagnosis-title">
          <span className="landing-kicker">{content.hero.kicker}</span>
          <div className="diagnosis-hero-grid">
            <div className="diagnosis-hero-copy">
              <h1 id="diagnosis-title">{content.hero.title}</h1>
              <p>{content.hero.description}</p>
              <div className="hero-actions">
                <a className="primary-button" href={business.phoneHref}>
                  <Phone size={20} />
                  전화 상담
                </a>
                <a className="secondary-button kakao-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
                  <MessageCircle size={20} />
                  카카오톡 사진 상담
                </a>
                <a className="secondary-button" href="/estimate">
                  <ArrowUpRight size={18} />
                  견적상담
                </a>
              </div>
              <p className="diagnosis-hero-hours">
                <Clock size={15} aria-hidden="true" />
                {business.hours} · 빠른 상담이 필요하신가요?
              </p>
            </div>
            <aside className="diagnosis-hero-steps" aria-label="진단 3단계 흐름">
              <ol>
                {DIAGNOSIS_STEPS.map((step, index) => (
                  <li key={step.title}>
                    <span className="diagnosis-step-num">{index + 1}</span>
                    <div className="diagnosis-step-body">
                      <strong>{step.title}</strong>
                      <p>{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        {/* 1단: 카테고리 */}
        <section className="diagnosis-section section" aria-labelledby="diagnosis-cat-title">
          <div className="section-heading">
            <h2 id="diagnosis-cat-title">{content.sections.categoryTitle}</h2>
            <p>{content.sections.categoryDescription}</p>
          </div>
          <div className="diagnosis-cat-grid">
            {symptomCategories.map((cat) => {
              const Icon = categoryIconFor(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`diagnosis-cat-card${selectedCategory.id === cat.id ? " active" : ""}`}
                  onClick={() => pickCategory(cat)}
                >
                  <span className="diagnosis-cat-icon">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="diagnosis-cat-label">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2단: 세부 증상 */}
        <section ref={symptomListRef} className="diagnosis-section section" aria-labelledby="diagnosis-list-title">
          <div className="section-heading">
            <h2 id="diagnosis-list-title">{content.sections.symptomTitle}</h2>
            <p>{content.sections.symptomDescription}</p>
          </div>
          <div className="diagnosis-topic-grid">
            {selectedCategory.symptoms.map((s) => {
              const base = diagnosisTopics.find((t) => t.id === s.id);
              if (!base) return null;
              const topic = viewTopic(base);
              const Icon = categoryIconFor(selectedCategory.id);
              const selfCheck = SELF_CHECKABLE_IDS.has(topic.id);
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`diagnosis-symptom-card${selectedTopic.id === topic.id ? " active" : ""}`}
                  onClick={() => pickTopic(topic.id)}
                >
                  <span className="diagnosis-symptom-icon" aria-hidden="true">
                    <Icon size={22} />
                  </span>
                  <span className="diagnosis-symptom-body">
                    <strong>{topic.title}</strong>
                    <p>{topic.summary}</p>
                  </span>
                  <span className="diagnosis-symptom-foot">
                    <span className={`diagnosis-symptom-status ${selfCheck ? "is-self" : "is-expert"}`}>
                      {selfCheck ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
                      {selfCheck ? "자가 확인 가능" : "전문가 점검 권장"}
                    </span>
                    <ChevronRight className="diagnosis-symptom-arrow" size={18} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 답변 */}
        <section ref={answerRef} className="diagnosis-section section" aria-labelledby="diagnosis-answer-title">
          <div className="section-heading">
            <h2 id="diagnosis-answer-title">{content.sections.answerTitle}</h2>
            <p>{content.sections.answerDescription}</p>
          </div>

          {(() => {
            const answer = viewTopic(selectedTopic);
            return (
          <article className="diagnosis-answer-card">
            <div className="diagnosis-answer-header">
              <span className="diagnosis-answer-tag">선택한 증상</span>
              <h3>{answer.title}</h3>
              <p>{answer.summary}</p>
            </div>

            <div className="diagnosis-answer-grid">
              <div className="diagnosis-answer-panel">
                <strong className="diagnosis-panel-title is-cause">대표 원인</strong>
                <ul className="diagnosis-list-check">
                  {answer.likelyCauses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="diagnosis-answer-panel">
                <strong className="diagnosis-panel-title is-check">먼저 확인할 것</strong>
                <ol className="diagnosis-list-num">
                  {answer.firstChecks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
              <div className="diagnosis-answer-panel">
                <strong className="diagnosis-panel-title is-expert">전문가 점검이 필요한 경우</strong>
                <p className="diagnosis-panel-text">{answer.whenToCall}</p>
              </div>
            </div>

            {answer.firstChecks[0] ? (
              <div className="diagnosis-tip">
                <Lightbulb size={18} aria-hidden="true" />
                <p>
                  <strong>추천 팁</strong>
                  가장 먼저 {answer.firstChecks[0]}.
                </p>
              </div>
            ) : null}

            {/* 증상을 확인한 직후(의도 정점)에 바로 연락할 수 있도록 전화·카톡을 1순위로.
                긴급 증상(예: 전기 타는 냄새)도 읽기 페이지가 아니라 즉시 통화로 연결된다. */}
            <div className="hero-actions diagnosis-answer-actions">
              <a className="primary-button" href={business.phoneHref}>
                <Phone size={20} />
                전화 상담
              </a>
              <a className="secondary-button kakao-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
                <MessageCircle size={20} />
                카카오톡 사진 상담
              </a>
              <a className="secondary-button" href="/estimate">
                <ArrowUpRight size={20} />
                견적상담
              </a>
            </div>
            {answer.ctaHref?.startsWith("/service/") && (
              <a className="diagnosis-answer-servicelink" href={answer.ctaHref}>
                {answer.ctaLabel} ›
              </a>
            )}
          </article>
            );
          })()}
        </section>
        <div className="mobile-cta-spacer" aria-hidden="true" />
      </main>
      <MobileQuickCta />
      <button
        className="diagnosis-back-float"
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
          window.location.href = "/";
        }}
        aria-label="이전 페이지로 돌아가기"
      >
        <ChevronLeft size={18} />
        이전 페이지
      </button>
    </>
  );
}
