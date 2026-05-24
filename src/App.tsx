import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  MessageCircle,
  Phone,
  User,
  X
} from "lucide-react";
import { business, cases, navItems, pinnedPosts, process, services, symptoms } from "./data";
import { BlogPortfolioService } from "./services/BlogPortfolioService";
import { SiteContentService, defaultHomepageContent } from "./services/SiteContentService";
import type { HomepageContent, PortfolioPost } from "./types";
import { AdminPage } from "./admin/AdminPage";
import { AdminLoginPage } from "./admin/AdminLoginPage";
import { AccountPage } from "./account/AccountPage";
import { LoginPage } from "./login/LoginPage";
import { PrivacyPolicyPage } from "./privacy/PrivacyPolicyPage";
import { EstimatePage } from "./estimate/EstimatePage";
import { DiagnosisPage } from "./diagnosis/DiagnosisPage";
import { BusinessInfoList, OfficeSection } from "./components/OfficeSection";
import { buildLandingPageJsonLd, getLandingPageDefinition, getLandingPageIndexLinks, mergeLandingPageContent } from "./landingPages";
import { defaultLandingPagesContent, type LandingPagesContent } from "./services/SiteContentService";

const blogPortfolioService = new BlogPortfolioService("/api/naver-blog", pinnedPosts);
const siteContentService = new SiteContentService();
const siteUrl = "https://www.jipsuriclass.kr";
const siteName = business.name;
const defaultDescription = "서울·경기 집수리, 누수 복구, 부분수리, 욕실·주방·도배·전기·목공 상담을 사진 기반으로 빠르게 안내합니다.";
const defaultImage = `${siteUrl}/og-image.png`;

function App() {
  const [landingPageOverrides, setLandingPageOverrides] = useState<LandingPagesContent>(defaultLandingPagesContent);

  useEffect(() => {
    let mounted = true;

    void siteContentService.loadLandingPagesContent().then((content) => {
      if (!mounted) return;
      setLandingPageOverrides(content);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const landingPage = getLandingPageDefinition(window.location.pathname);
  const mergedLandingPage = landingPage ? mergeLandingPageContent(landingPage, landingPageOverrides[landingPage.path] ?? null) : null;

  usePageSeo(getSeoConfigForPath(window.location.pathname, mergedLandingPage ?? undefined));

  if (window.location.pathname.startsWith("/admin/login")) {
    return <AdminLoginPage />;
  }
  if (window.location.pathname.startsWith("/admin")) {
    return <AdminPage />;
  }
  if (window.location.pathname.startsWith("/mypage") || window.location.pathname.startsWith("/account")) {
    return <AccountPage />;
  }
  if (window.location.pathname.startsWith("/login")) {
    return <LoginPage />;
  }
  if (window.location.pathname.startsWith("/privacy")) {
    return <PrivacyPolicyPage />;
  }
  if (window.location.pathname.startsWith("/diagnosis")) {
    return <DiagnosisPage />;
  }
  if (window.location.pathname.startsWith("/estimate")) {
    return <EstimatePage />;
  }

  if (mergedLandingPage) {
    return <LandingPage content={mergedLandingPage} />;
  }

  return <HomePage />;
}

function usePageSeo(config: SeoConfig) {
  useEffect(() => {
    document.title = config.title;

    setMetaTag("description", config.description);
    setMetaTag("robots", config.noindex ? "noindex,nofollow" : "index,follow");
    setMetaTag("theme-color", "#0f172a");
    setMetaTag("og:locale", "ko_KR", "property");
    setMetaTag("og:type", "website", "property");
    setMetaTag("og:site_name", siteName, "property");
    setMetaTag("og:title", config.title, "property");
    setMetaTag("og:description", config.description, "property");
    setMetaTag("og:image", config.image ?? defaultImage, "property");
    setMetaTag("og:image:alt", "집수리클라쓰 OG 배너", "property");
    setMetaTag("og:url", `${siteUrl}${config.path}`, "property");
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", config.title);
    setMetaTag("twitter:description", config.description);
    setMetaTag("twitter:image", config.image ?? defaultImage);
    setMetaTag("twitter:image:alt", "집수리클라쓰 OG 배너");
    setLinkTag("canonical", `${siteUrl}${config.path}`);
    setStructuredData(config.jsonLd);
  }, [config]);
}

type SeoConfig = {
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
};

function getSeoConfigForPath(pathname: string, landingPage?: ReturnType<typeof getLandingPageDefinition>): SeoConfig {
  if (pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/mypage") || pathname.startsWith("/login")) {
    return {
      path: pathname,
      title: `${siteName} | 내부 페이지`,
      description: defaultDescription,
      image: defaultImage,
      noindex: true
    };
  }

  if (pathname.startsWith("/estimate")) {
    return {
      path: "/estimate",
      title: `견적상담 | ${siteName}`,
      description: "사진과 증상으로 집수리·누수 복구·부분수리 견적을 빠르게 상담하는 페이지입니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `견적상담 | ${siteName}`,
          url: `${siteUrl}/estimate`,
          description: "사진과 증상으로 집수리·누수 복구·부분수리 견적을 빠르게 상담하는 페이지입니다."
        }
      ]
    };
  }

  if (pathname.startsWith("/privacy")) {
    return {
      path: "/privacy",
      title: `개인정보처리방침 | ${siteName}`,
      description: "집수리클라쓰의 개인정보 수집, 이용, 보관, 제3자 제공 기준을 확인할 수 있습니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `개인정보처리방침 | ${siteName}`,
          url: `${siteUrl}/privacy`,
          description: "집수리클라쓰의 개인정보 수집, 이용, 보관, 제3자 제공 기준을 확인할 수 있습니다."
        }
      ]
    };
  }

  if (pathname.startsWith("/diagnosis")) {
    return {
      path: "/diagnosis",
      title: `간편 자기진단 | ${siteName}`,
      description: "문이 뻑뻑하거나 물이 새는 등 생활 집수리 증상을 클릭하면 원인과 다음 행동을 바로 확인할 수 있습니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "문이 뻑뻑해요. 어떻게 확인하나요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "경첩 처짐, 문틀 변형, 바닥 쓸림을 먼저 확인하고, 증상이 반복되면 문수리 상담이 필요합니다."
              }
            },
            {
              "@type": "Question",
              name: "물이 샌다. 바로 뭘 해야 하나요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "전기 기기 주변이면 사용을 멈추고 물자국이 번지는 방향을 확인한 뒤 누수 상담을 받는 것이 좋습니다."
              }
            }
          ]
        }
      ]
    };
  }

  if (landingPage) {
    return {
      path: landingPage.path,
      title: landingPage.title,
      description: landingPage.description,
      image: defaultImage,
      jsonLd: buildLandingPageJsonLd(landingPage, siteUrl)
    };
  }

  return {
    path: "/",
    title: `${siteName} - 클라스가 다른 종합 집수리`,
    description: defaultDescription,
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        description: defaultDescription
      },
      {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        name: siteName,
        url: siteUrl,
        telephone: business.phone,
        image: defaultImage,
        address: {
          "@type": "PostalAddress",
          streetAddress: business.address,
          addressCountry: "KR"
        },
        areaServed: business.area,
        openingHours: business.hours,
        sameAs: [business.naverBlogUrl, business.mapUrl, business.kakaoUrl],
        description: business.introduction
      }
    ]
  };
}

function setMetaTag(name: string, content: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  tag.href = href;
}

function setStructuredData(jsonLd?: Record<string, unknown>[]) {
  const existing = document.head.querySelector<HTMLScriptElement>('script[data-seo="json-ld"]');
  if (existing) {
    existing.remove();
  }

  if (!jsonLd?.length) {
    return;
  }

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.dataset.seo = "json-ld";
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blogPosts, setBlogPosts] = useState<PortfolioPost[]>(pinnedPosts);
  const [blogSource, setBlogSource] = useState<"loading" | "naver" | "fallback">("loading");
  const [homeContent, setHomeContent] = useState(defaultHomepageContent);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void siteContentService.loadHomepageContent().then((content) => {
      if (!mounted) return;
      setHomeContent(content);
      setContentReady(true);
    });

    blogPortfolioService.loadPortfolioPosts().then(({ posts, source }) => {
      if (!mounted) return;
      setBlogPosts(posts);
      setBlogSource(source);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <SiteHeader
        menuOpen={menuOpen}
        navLabels={homeContent.navLabels}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <main className="home-page" id="top">
        <HeroSection content={homeContent.hero} cases={homeContent.cases} />
        <AboutSection content={homeContent.about} cases={homeContent.cases} />
        <SymptomsSection symptoms={homeContent.symptoms ?? symptoms} />
        <ServicesSection services={homeContent.services} />
        <SpecialtiesSection />
        <CasesSection cases={homeContent.cases} />
        <ProcessSection steps={homeContent.process} />
        <BlogSection posts={blogSource === "naver" ? blogPosts : homeContent.blog} source={blogSource} />
        <OfficeSection />
        <ContactSection content={homeContent.contact} />
      </main>
      {!contentReady ? <div className="content-loading">페이지 내용을 불러오는 중</div> : null}
      <SiteFooter />
      <MobileQuickCta />
    </>
  );
}

/**
 * 상단 내비게이션
 * 데스크톱은 가로 메뉴, 태블릿/모바일은 슬라이드 메뉴로 전환됩니다.
 */
function SiteHeader({
  menuOpen,
  navLabels,
  onOpenMenu,
  onCloseMenu
}: {
  menuOpen: boolean;
  navLabels: string[];
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}) {
  const seenLabels = new Set<string>();
  const navLabelFallbacks: Partial<Record<(typeof navItems)[number]["href"], string>> = {
    "#contact": "문의"
  };
  const menuItems = navItems.map((item, index) => {
    const candidateLabel = navLabels[index] ?? item.label;
    const fallbackLabel = navLabelFallbacks[item.href] ?? item.label;
    const label = seenLabels.has(candidateLabel) || candidateLabel === "문의" && item.href === "#contact" ? fallbackLabel : candidateLabel;
    seenLabels.add(label);
    return {
      ...item,
      label
    };
  });
  const desktopMenuItems = menuItems.filter((item) => item.href.startsWith("#"));

  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="nav" data-elevated={menuOpen || scrolled ? "true" : "false"}>
        <div className="nav__progress">
          <span className="nav__progress-bar" style={{ width: `${scrollPct}%` }} />
        </div>
        <div className="nav__inner">
          <a className="brand" href="#top" aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
            <span className="brand__name">
              집수리<em>클라쓰</em>
            </span>
          </a>
          <nav className="nav__links" aria-label="주요 메뉴">
            {desktopMenuItems.map((item) => (
              <a href={item.href} key={item.href}>
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
            <button className="nav__menu" onClick={onOpenMenu} aria-label="사이드바 열기">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu">
          <button onClick={onCloseMenu} aria-label="메뉴 닫기">
            <X size={24} />
          </button>
          {menuItems.map((item) => (
            <a href={item.href} key={item.href} onClick={onCloseMenu}>
              {item.label}
            </a>
          ))}
          <a href="/login" onClick={onCloseMenu}>
            로그인
          </a>
        </div>
      )}
    </>
  );
}

/**
 * 첫 화면 전환 영역
 * 두 컬럼 그리드: 왼쪽 카피+CTA, 오른쪽 케이스 이미지 카드 덱
 */
function HeroSection({
  content,
  cases: editableCases
}: {
  content: HomepageContent["hero"];
  cases: HomepageContent["cases"];
}) {
  const rotatorWords = ["한 통의 전화", "사진 몇 장", "5분의 상담", "한 번의 방문"];
  const [rotatorIndex, setRotatorIndex] = useState(0);
  const [rotatorKey, setRotatorKey] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRotatorIndex((i) => (i + 1) % rotatorWords.length);
      setRotatorKey((k) => k + 1);
    }, 2400);
    return () => window.clearInterval(timer);
  }, []);

  const caseImages = useMemo(
    () => editableCases.filter((c) => c.image).slice(0, 3),
    [editableCases]
  );

  const proofs: [string, string][] = [
    ["상담 방식", "사진 기반 사전 확인"],
    ["작업 범위", "부분수리부터 복구까지"],
    ["현장 기록", "네이버 블로그 사례 연동"]
  ];

  return (
    <section className="hero" id="hero">
      <div className="hero__grid">
        {/* Left column */}
        <div>
          <span className="hero__eyebrow">
            <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2f7a4d", display: "inline-block" }} />
            서울·경기 종합 집수리
          </span>
          <h1 className="hero__title">
            집의 모든 불편을
            <br />
            <span className="hero__rotator">
              <em key={rotatorKey}>{rotatorWords[rotatorIndex]}</em>
            </span>
            으로 끝냅니다.
          </h1>
          <p className="hero__lede">
            {content.description || "물 새는 천장부터 들뜬 벽지까지. 큰 공사 권하지 않고 딱 필요한 만큼만, 7개 국가공인 건축자격을 가진 대표가 직접 손봅니다."}
          </p>
          <div className="hero__cta">
            <a className="primary-button" href={business.phoneHref}>
              <Phone size={18} />
              {content.primaryActionLabel || "전화 상담"}
            </a>
            <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              {content.secondaryActionLabel || "카카오톡"}
            </a>
            <a className="secondary-button" href="/estimate">
              <ArrowUpRight size={18} />
              {content.tertiaryActionLabel || "견적상담"}
            </a>
          </div>
          <dl className="hero__proof">
            {proofs.map(([dt, dd]) => (
              <div key={dt}>
                <dt>{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column: card deck */}
        {caseImages.length > 0 ? (
          <div className="hero__deck">
            {caseImages[0] && (
              <div className="hero__card hero__card--main">
                <img src={caseImages[0].image} alt={caseImages[0].title} />
                <div className="hero__card-tag">{caseImages[0].area}</div>
              </div>
            )}
            {caseImages[1] && (
              <div className="hero__card hero__card--b">
                <img src={caseImages[1].image} alt={caseImages[1].title} />
              </div>
            )}
            {caseImages[2] && (
              <div className="hero__card hero__card--c">
                <img src={caseImages[2].image} alt={caseImages[2].title} />
              </div>
            )}
            <div className="hero__chip hero__chip--running">
              <span className="pulse" />
              <strong>{caseImages.length}건</strong> 대표사례
            </div>
          </div>
        ) : null}
      </div>
      <div className="trust trust--embedded" aria-label="신뢰 지표">
        <div className="trust__inner">
          {[
            { num: "7", label: "국가공인 7 자격", sub: "대표 직접 보유 · 직접 시공" },
            { num: "31", label: "가능 작업", sub: "생활 보수부터 전체 리모델링까지" },
            { num: "13시간", label: "운영 시간", sub: "월~토 08:00 – 21:00" }
          ].map((item) => (
            <div className="trust__item" key={item.label}>
              <span className="trust__num">{item.num}</span>
              <div className="trust__label">
                <strong>{item.label}</strong>
                <span>{item.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection({
  content,
  cases
}: {
  content: { eyebrow: string; title: string; description: string; strengths: string[] };
  cases: HomepageContent["cases"];
}) {
  const featuredImages = useMemo(
    () => cases.filter((item) => item.image).slice(0, 3),
    [cases]
  );

  return (
    <section className="about section" id="about" aria-labelledby="about-title">
      <div className="about-copy">
        <span>{content.eyebrow}</span>
        <h2 id="about-title">{content.title}</h2>
        <p>{content.description}</p>
        <ul className="about-strengths">
          {content.strengths.map((item) => (
            <li key={item}>
              <CheckCircle2 size={20} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="about-visual" aria-label="현장 사진 요약">
        {featuredImages[0] && (
          <figure className="about-visual__hero">
            <img src={featuredImages[0].image} alt={featuredImages[0].title} loading="lazy" />
            <figcaption>
              <strong>{featuredImages[0].area}</strong>
              <span>{featuredImages[0].title}</span>
            </figcaption>
          </figure>
        )}
        <div className="about-visual__stack">
          {featuredImages.slice(1, 3).map((item, index) => (
            <figure className={`about-visual__tile about-visual__tile--${index + 1}`} key={item.title}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <figcaption>
                <strong>{item.area}</strong>
                <span>{item.title}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="about-visual__note">
          <strong>현장 사진 우선 상담</strong>
          <span>사진을 먼저 보내주시면 불필요한 공사 없이 필요한 작업만 골라드립니다.</span>
        </div>
      </div>
    </section>
  );
}

/** 증상 기반 진입 영역: 고객이 전문 공종명을 몰라도 문의할 수 있게 돕습니다. */
function SymptomsSection({ symptoms }: { symptoms: string[] }) {
  return (
    <section className="symptoms section" aria-labelledby="symptoms-title">
      <SectionHeading
        id="symptoms-title"
        title="고객이 말하는 증상부터 간편 자기진단을 시작합니다"
        description="전문 용어를 몰라도 괜찮습니다. 지금 보이는 문제를 클릭하면 바로 원인과 다음 행동이 나옵니다."
      />
      <div className="symptom-grid">
        {symptoms.map((item) => (
          <a
            href={`/diagnosis?issue=${encodeURIComponent(item)}`}
            key={item}
          >
            {item}
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
    </section>
  );
}

/** 서비스 카드 영역: 벤토 그리드 — 첫 카드가 2열 차지 */
function ServicesSection({
  services: editableServices
}: {
  services: { title: string; text: string }[];
}) {
  return (
    <section className="services" id="services" aria-labelledby="services-title">
      <div className="sec-head" style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(48px,8vw,96px) clamp(18px,5vw,64px) clamp(24px,3vw,36px)" }}>
        <h2 id="services-title" style={{ fontFamily: "var(--f-display,sans-serif)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--ink,#0b1a30)" }}>생활 집수리 서비스</h2>
        <p style={{ fontSize: "clamp(15px,1.4vw,18px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다.</p>
      </div>
      <div className="bento">
        {services.map((service, index) => {
          const item = editableServices[index] ?? { title: service.title, text: service.text };
          return (
            <article className="bento__card" key={item.title}>
              <span className="bento__num">{String(index + 1).padStart(2, "0")}</span>
              <service.icon size={28} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SpecialtiesSection() {
  const categories = [
    { key: "all", label: "전체" },
    { key: "utility", label: "설비·배관" },
    { key: "finish", label: "마감" },
    { key: "wood", label: "문·창·목공" },
    { key: "remodel", label: "욕실·주방·리모델링" },
    { key: "extra", label: "기타" }
  ];

  // Map each specialty to a category
  const itemCatMap: Record<string, string> = {
    "수도 배관": "utility", "전기 배선": "utility", "온수기 설치/수리": "utility",
    "환풍기": "utility", "주방후드": "utility", "조명": "utility",
    "도배": "finish", "바닥재": "finish", "페인트": "finish", "필름": "finish",
    "타일": "finish", "줄눈": "finish", "실리콘 시공": "finish", "탄성코트 시공": "finish",
    "인테리어 필름": "finish",
    "문 설치/수리": "wood", "중문": "wood", "창문/샷시": "wood", "방충망": "wood",
    "방범창": "wood", "방풍시공": "wood", "열쇠/도어락": "wood", "가구 조립": "wood", "단열시공": "wood",
    "욕실 리모델링": "remodel", "주방 리모델링": "remodel", "싱크대 교체": "remodel",
    "붙박이장": "remodel", "냉장고장 설치": "remodel", "옥상 방수": "remodel",
    "집 전체 리모델링": "remodel",
    "커튼/블라인드": "extra", "전동 빨래건조대": "extra"
  };

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    return business.specialties.filter((item) => {
      const catMatch = activeCategory === "all" || itemCatMap[item] === activeCategory;
      const searchMatch = !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [activeCategory, searchQuery]);

  const toggleSelected = (item: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  };

  const ctaHref = selected.size > 0
    ? `/estimate?works=${encodeURIComponent([...selected].join(","))}`
    : "/estimate";

  return (
    <section className="specialties" id="specialties" aria-labelledby="specialties-title">
      <div className="sec-head" style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(28px,4vw,52px) clamp(18px,5vw,64px) clamp(16px,2vw,24px)", textAlign: "center" }}>
        <h2 id="specialties-title" style={{ fontFamily: "var(--f-display,sans-serif)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--ink,#0b1a30)" }}>가능 작업</h2>
        <p style={{ fontSize: "clamp(15px,1.4vw,18px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>집 안팎에서 필요한 수리, 설비, 마감, 리모델링 작업을 폭넓게 상담합니다.</p>
      </div>
      <div className="specs__controls">
        <div className="specs__filters">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`specs__filter${activeCategory === cat.key ? " active" : ""}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="specs__search">
          <ArrowUpRight size={16} style={{ color: "var(--ink-3,#5b6781)" }} />
          <input
            type="search"
            placeholder="작업 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="작업 검색"
          />
        </div>
      </div>
      <div className="specs__grid">
        {filteredItems.map((item) => (
          <button
            key={item}
            className={`specs__item${selected.has(item) ? " selected" : ""}`}
            onClick={() => toggleSelected(item)}
            aria-pressed={selected.has(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {selected.size > 0 && (
        <div className="specs__cta">
          <div className="specs__cta-inner">
            <span>
              <strong>{selected.size}개</strong> 작업 선택됨: {[...selected].slice(0, 3).join(", ")}{selected.size > 3 ? ` 외 ${selected.size - 3}개` : ""}
            </span>
            <a className="primary-button" href={ctaHref} style={{ minHeight: 42, padding: "0 18px", fontSize: 14 }}>
              이 작업으로 견적 받기 <ArrowUpRight size={16} />
            </a>
            <button
              onClick={() => setSelected(new Set())}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-3,#5b6781)", padding: "0 8px" }}
            >
              초기화
            </button>
          </div>
        </div>
      )}
      <div className="specs__jump-actions">
        <a className="specs__jump-button primary" href="/diagnosis">
          자가진단 바로가기
        </a>
        <a className="specs__jump-button secondary" href="/estimate">
          견적상담 바로가기
        </a>
      </div>
    </section>
  );
}

function SearchLandingSection() {
  const { services: servicePages, areas: areaPages } = getLandingPageIndexLinks();

  return (
    <section className="landing-links section" id="landing-pages" aria-labelledby="landing-pages-title">
      <SectionHeading
        id="landing-pages-title"
        title="서비스·지역별 안내"
        description="서비스 유형과 지역별로 정리한 상담 안내 페이지입니다."
      />
      <div className="landing-link-groups">
        <div className="landing-link-group">
          <h3>서비스</h3>
          <div className="landing-link-grid">
            {servicePages.map((page) => (
              <a className="landing-link-card" href={page.path} key={page.path}>
                <span>{page.categoryLabel}</span>
                <strong>{page.title.replace(" | 집수리클라쓰", "")}</strong>
                <p>{page.description}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="landing-link-group">
          <h3>지역</h3>
          <div className="landing-link-grid">
            {areaPages.map((page) => (
              <a className="landing-link-card" href={page.path} key={page.path}>
                <span>{page.categoryLabel}</span>
                <strong>{page.title.replace(" | 집수리클라쓰", "")}</strong>
                <p>{page.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** 수동 대표 사례 영역: 가로 스크롤 레일 */
function CasesSection({
  cases: editableCases
}: {
  cases: { title: string; area: string; problem: string; solution: string; image: string; link: string }[];
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const scrollFrameRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  function scrollToIndex(nextIndex: number, behavior: ScrollBehavior = "smooth") {
    const rail = railRef.current;
    const card = cardRefs.current[nextIndex];
    if (!rail || !card) return;

    const nextLeft = Math.max(0, card.offsetLeft - rail.clientWidth / 2 + card.offsetWidth / 2);

    rail.scrollTo({
      left: nextLeft,
      behavior,
    });
  }

  useEffect(() => {
    scrollToIndex(0, "auto");
  }, [editableCases.length]);

  useEffect(() => {
    if (typeof window === "undefined" || editableCases.length <= 1) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const stopEvents: Array<keyof HTMLElementEventMap> = ["pointerdown", "touchstart", "wheel", "mousedown", "keydown"];
    let stopped = false;
    const timerId = window.setInterval(() => {
      if (stopped) return;
      scrollToIndex((activeIndexRef.current + 1) % editableCases.length);
    }, 4200);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timerId);
    };

    const rail = railRef.current;
    stopEvents.forEach((eventName) => {
      rail?.addEventListener(eventName, stop, { passive: true });
    });

    return () => {
      window.clearInterval(timerId);
      stopEvents.forEach((eventName) => {
        rail?.removeEventListener(eventName, stop);
      });
    };
  }, [editableCases.length]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  function syncActiveFromScroll() {
    const rail = railRef.current;
    if (!rail) return;

    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - railCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    activeIndexRef.current = nearestIndex;
    setActiveIndex((current) => (current === nearestIndex ? current : nearestIndex));
  }

  function handleScroll() {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
    scrollFrameRef.current = window.requestAnimationFrame(syncActiveFromScroll);
  }

  function goToIndex(nextIndex: number) {
    if (!editableCases.length) return;
    const normalized = (nextIndex + editableCases.length) % editableCases.length;
    activeIndexRef.current = normalized;
    setActiveIndex(normalized);
    scrollToIndex(normalized);
  }

  return (
    <section className="cases" id="cases" aria-labelledby="cases-title">
      <div style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(48px,8vw,96px) clamp(18px,5vw,64px) clamp(20px,2.5vw,32px)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 id="cases-title" style={{ fontFamily: "var(--f-display,sans-serif)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--ink,#0b1a30)" }}>대표 현장사례</h2>
          <p style={{ fontSize: "clamp(15px,1.4vw,18px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>실제 현장 사진과 작업 내용을 확인하세요.</p>
        </div>
        <a href={business.naverBlogUrl} target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, color: "var(--navy-700,#10284a)", display: "inline-flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--ink,#0b1a30)", paddingBottom: 2 }}>
          전체 사례 보기 <ExternalLink size={14} />
        </a>
      </div>
      <div className="cases__carousel">
        <div
          className="cases__rail"
          ref={railRef}
          onScroll={handleScroll}
        >
          {editableCases.map((item, index) => (
            <a
              className={index === activeIndex ? "cases__card is-active" : "cases__card"}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              key={item.title}
              ref={(element) => {
                cardRefs.current[index] = element;
              }}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <div className="cases__media">
                <img src={item.image} alt={item.title} />
              </div>
              <div className="cases__body">
                <h3>{item.title}</h3>
                <dl className="row">
                  <dt>문제</dt>
                  <dd>{item.problem}</dd>
                </dl>
                <dl className="row">
                  <dt>해결</dt>
                  <dd>{item.solution}</dd>
                </dl>
                <div className="more">
                  블로그 보기 <ExternalLink size={14} />
                </div>
              </div>
            </a>
          ))}
        </div>
        {editableCases.length > 1 ? (
          <div className="cases__carousel-controls" aria-label="대표 현장사례 캐러셀 컨트롤">
            <button className="cases__carousel-button" type="button" onClick={() => goToIndex(activeIndex - 1)} aria-label="이전 사례">
              <ChevronLeft size={16} />
            </button>
            <div className="cases__carousel-dots" aria-label="현재 사례 위치">
              {editableCases.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  className={index === activeIndex ? "cases__dot active" : "cases__dot"}
                  onClick={() => goToIndex(index)}
                  aria-label={`${index + 1}번째 사례로 이동`}
                  aria-pressed={index === activeIndex}
                />
              ))}
            </div>
            <button className="cases__carousel-button" type="button" onClick={() => goToIndex(activeIndex + 1)} aria-label="다음 사례">
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** 네이버 블로그 포트폴리오 영역 */
function BlogSection({
  posts,
  source
}: {
  posts: PortfolioPost[];
  source: "loading" | "naver" | "fallback";
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  useAutoCarousel(railRef, { enabled: true });

  const description =
    source === "naver"
      ? "최근 현장 시공 사례를 블로그에서 가져옵니다."
      : "대표 시공 포트폴리오입니다.";
  const displayPosts = posts.slice(0, 5);

  return (
    <section className="blog section" id="blog" aria-labelledby="blog-title">
      <RowHeading
        id="blog-title"
        title="네이버 블로그 포트폴리오"
        description={description}
        linkLabel="N 블로그"
        href={business.naverBlogUrl}
        className="naver-link"
      />
      <div className="blog-card-grid blog-card-carousel-mobile" ref={railRef}>
        {displayPosts.map((post, index) => (
          <a
            className={index === 0 ? "blog-card blog-card-featured" : "blog-card"}
            href={post.link}
            target="_blank"
            rel="noreferrer"
            key={post.title}
          >
            <img
              className="blog-card-image"
              src={post.image}
              alt={post.title}
              loading="lazy"
              onError={(event) => {
                const image = event.currentTarget;
                if (image.dataset.fallbackApplied === "true") return;
                image.dataset.fallbackApplied = "true";
                image.src = "/assets/consult-hero.png";
              }}
            />
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
    </section>
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

const processIllustrations = [
  /* 01 사진 상담 */
  <svg key="p1" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="320" height="200" rx="20" fill="#eef4fb"/>
    <rect x="96" y="22" width="88" height="148" rx="14" fill="#fff" stroke="#c8d6e8" strokeWidth="1.5"/>
    <rect x="104" y="42" width="72" height="80" rx="6" fill="#dce8f5"/>
    <path d="M140 52L168 72H112Z" fill="#10284a"/>
    <rect x="116" y="72" width="48" height="36" fill="#10284a"/>
    <rect x="132" y="84" width="16" height="24" rx="3" fill="#fff"/>
    <rect x="128" y="72" width="14" height="14" rx="2" fill="#d7ae6b"/>
    <circle cx="140" cy="156" r="10" fill="#10284a"/>
    <circle cx="140" cy="156" r="6" fill="#fff"/>
    <circle cx="140" cy="156" r="3" fill="#10284a"/>
    <rect x="190" y="34" width="96" height="70" rx="14" fill="#10284a"/>
    <polygon points="194,104 186,120 214,104" fill="#10284a"/>
    <text x="238" y="55" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="#d7ae6b" textAnchor="middle">사진 상담</text>
    <rect x="198" y="63" width="76" height="3" rx="1.5" fill="rgba(255,255,255,0.6)"/>
    <rect x="198" y="73" width="58" height="3" rx="1.5" fill="rgba(255,255,255,0.35)"/>
    <rect x="198" y="83" width="68" height="3" rx="1.5" fill="rgba(255,255,255,0.5)"/>
    <rect x="20" y="64" width="62" height="28" rx="14" fill="#d7ae6b"/>
    <text x="51" y="83" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#10284a" textAnchor="middle">01</text>
    <circle cx="40" cy="30" r="4" fill="#d7ae6b" fillOpacity="0.5"/>
    <circle cx="284" cy="168" r="5" fill="#d7ae6b" fillOpacity="0.3"/>
  </svg>,
  /* 02 증상 확인 */
  <svg key="p2" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="320" height="200" rx="20" fill="#edf5f1"/>
    <rect x="52" y="38" width="160" height="120" rx="8" fill="#fff" stroke="#c8d6e8" strokeWidth="1.5"/>
    <rect x="52" y="38" width="160" height="26" rx="8" fill="#dce8f5"/>
    <path d="M144 78L156 96L149 110L162 132" stroke="#94a0b8" strokeWidth="2" strokeLinecap="round"/>
    <path d="M114 88L126 104L120 118" stroke="#b0bac8" strokeWidth="1.5" strokeLinecap="round"/>
    <ellipse cx="156" cy="100" rx="5" ry="7" fill="#6ba3c8" fillOpacity="0.7"/>
    <ellipse cx="122" cy="118" rx="4" ry="5.5" fill="#6ba3c8" fillOpacity="0.5"/>
    <ellipse cx="148" cy="136" rx="3.5" ry="5" fill="#6ba3c8" fillOpacity="0.35"/>
    <circle cx="228" cy="90" r="42" fill="rgba(16,40,74,0.06)"/>
    <circle cx="222" cy="84" r="30" fill="none" stroke="#10284a" strokeWidth="4"/>
    <circle cx="222" cy="84" r="21" fill="rgba(255,255,255,0.55)"/>
    <line x1="245" y1="107" x2="262" y2="126" stroke="#10284a" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="222" cy="76" r="6" fill="#d7ae6b"/>
    <path d="M222 82 L222 94" stroke="#d7ae6b" strokeWidth="3" strokeLinecap="round"/>
    <rect x="20" y="64" width="62" height="28" rx="14" fill="#d7ae6b"/>
    <text x="51" y="83" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#10284a" textAnchor="middle">02</text>
    <circle cx="280" cy="44" r="4" fill="#d7ae6b" fillOpacity="0.4"/>
    <circle cx="46" cy="176" r="5" fill="#10284a" fillOpacity="0.08"/>
  </svg>,
  /* 03 현장 방문 */
  <svg key="p3" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="320" height="200" rx="20" fill="#fef5ee"/>
    <rect x="68" y="92" width="136" height="92" fill="#fff" stroke="#c8d6e8" strokeWidth="1.5"/>
    <path d="M52 96L136 32L220 96Z" fill="#10284a"/>
    <rect x="80" y="108" width="36" height="28" rx="4" fill="#dce8f5"/>
    <line x1="98" y1="108" x2="98" y2="136" stroke="#c8d6e8" strokeWidth="1"/>
    <line x1="80" y1="122" x2="116" y2="122" stroke="#c8d6e8" strokeWidth="1"/>
    <rect x="156" y="108" width="36" height="28" rx="4" fill="#dce8f5"/>
    <line x1="174" y1="108" x2="174" y2="136" stroke="#c8d6e8" strokeWidth="1"/>
    <line x1="156" y1="122" x2="192" y2="122" stroke="#c8d6e8" strokeWidth="1"/>
    <rect x="114" y="142" width="44" height="42" rx="4" fill="#10284a" fillOpacity="0.12"/>
    <rect x="118" y="146" width="36" height="38" rx="3" fill="#10284a" fillOpacity="0.1"/>
    <circle cx="140" cy="167" r="3" fill="#d7ae6b"/>
    <path d="M252 36C244 36 238 42 238 50C238 62 252 78 252 78C252 78 266 62 266 50C266 42 260 36 252 36Z" fill="#d7ae6b"/>
    <circle cx="252" cy="50" r="7" fill="#fff"/>
    <circle cx="242" cy="30" r="16" fill="#d7ae6b" fillOpacity="0.15"/>
    <rect x="20" y="64" width="62" height="28" rx="14" fill="#10284a"/>
    <text x="51" y="83" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#fff" textAnchor="middle">03</text>
    <circle cx="288" cy="162" r="4" fill="#d7ae6b" fillOpacity="0.4"/>
  </svg>,
  /* 04 견적 안내 */
  <svg key="p4" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="320" height="200" rx="20" fill="#f2eeff"/>
    <rect x="88" y="22" width="140" height="172" rx="12" fill="#fff" stroke="#c8d6e8" strokeWidth="1.5"/>
    <rect x="88" y="22" width="140" height="44" rx="12" fill="#10284a"/>
    <rect x="88" y="54" width="140" height="12" fill="#10284a"/>
    <text x="158" y="48" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="#d7ae6b" textAnchor="middle">견적서</text>
    <rect x="104" y="80" width="50" height="3" rx="1.5" fill="#dce8f5"/>
    <rect x="190" y="80" width="22" height="3" rx="1.5" fill="#10284a" fillOpacity="0.5"/>
    <rect x="104" y="93" width="42" height="3" rx="1.5" fill="#dce8f5"/>
    <rect x="190" y="93" width="22" height="3" rx="1.5" fill="#10284a" fillOpacity="0.5"/>
    <rect x="104" y="106" width="56" height="3" rx="1.5" fill="#dce8f5"/>
    <rect x="190" y="106" width="22" height="3" rx="1.5" fill="#10284a" fillOpacity="0.5"/>
    <rect x="104" y="119" width="46" height="3" rx="1.5" fill="#dce8f5"/>
    <rect x="190" y="119" width="22" height="3" rx="1.5" fill="#10284a" fillOpacity="0.5"/>
    <line x1="104" y1="135" x2="216" y2="135" stroke="#e6dfd0" strokeWidth="1.5"/>
    <text x="108" y="155" fontFamily="system-ui,sans-serif" fontSize="11" fill="#5b6781">합계</text>
    <text x="212" y="155" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#10284a" textAnchor="end">투명 견적</text>
    <rect x="196" y="164" width="78" height="26" rx="13" fill="#d7ae6b"/>
    <text x="235" y="182" fontFamily="system-ui,sans-serif" fontSize="12" fontWeight="700" fill="#10284a" textAnchor="middle">숨김없음</text>
    <rect x="20" y="64" width="62" height="28" rx="14" fill="#d7ae6b"/>
    <text x="51" y="83" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#10284a" textAnchor="middle">04</text>
    <circle cx="40" cy="30" r="4" fill="#d7ae6b" fillOpacity="0.5"/>
    <circle cx="274" cy="42" r="3" fill="#10284a" fillOpacity="0.12"/>
  </svg>,
  /* 05 시공·확인 */
  <svg key="p5" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="320" height="200" rx="20" fill="#eef4fb"/>
    <rect x="46" y="76" width="196" height="110" rx="8" fill="#fff" stroke="#c8d6e8" strokeWidth="1.5"/>
    <rect x="46" y="76" width="196" height="8" fill="#10284a" fillOpacity="0.07"/>
    <g transform="rotate(-18 96 128)">
      <rect x="86" y="88" width="14" height="64" rx="5" fill="#94a0b8"/>
      <rect x="74" y="82" width="38" height="20" rx="6" fill="#10284a"/>
    </g>
    <g transform="rotate(18 180 128)">
      <rect x="173" y="88" width="14" height="64" rx="5" fill="#94a0b8"/>
      <path d="M166 80C166 72 192 72 192 80C192 86 188 90 180 90C172 90 166 86 166 80Z" fill="#10284a"/>
      <path d="M166 158C166 166 192 166 192 158C192 152 188 148 180 148C172 148 166 152 166 158Z" fill="#10284a"/>
    </g>
    <circle cx="230" cy="76" r="46" fill="rgba(215,174,107,0.12)"/>
    <circle cx="226" cy="70" r="32" fill="#10284a"/>
    <path d="M212 70L222 82L242 58" stroke="#d7ae6b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="226" y="114" fontFamily="system-ui,sans-serif" fontSize="10" fill="#5b6781" textAnchor="middle">작업 완료</text>
    <rect x="20" y="64" width="62" height="28" rx="14" fill="#d7ae6b"/>
    <text x="51" y="83" fontFamily="system-ui,sans-serif" fontSize="13" fontWeight="800" fill="#10284a" textAnchor="middle">05</text>
    <circle cx="286" cy="44" r="4" fill="#d7ae6b" fillOpacity="0.4"/>
    <circle cx="48" cy="182" r="5" fill="#10284a" fillOpacity="0.07"/>
  </svg>
];

/** 작업 절차 영역: 클릭 가능한 스텝 트랙 + 상세 패널 */
function ProcessSection({ steps }: { steps: { title: string; text: string }[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const activeData = process[activeStep];
  const activeContent = steps[activeStep];

  return (
    <section className="process" id="process" aria-labelledby="process-title">
      <div style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(32px,5vw,64px) clamp(18px,5vw,64px) clamp(16px,2vw,24px)" }}>
        <h2 id="process-title" style={{ fontFamily: "var(--f-display,sans-serif)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--ink,#0b1a30)" }}>작업 절차</h2>
        <p style={{ fontSize: "clamp(15px,1.4vw,18px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다.</p>
      </div>
      <div className="process__track">
        {process.map((step, index) => (
          <button
            key={step.title}
            className={`process__step${activeStep === index ? " active" : ""}`}
            onClick={() => setActiveStep(index)}
            aria-current={activeStep === index ? "true" : undefined}
          >
            <span className="step-num">0{index + 1}</span>
            <step.icon size={22} />
            <h3>{steps[index]?.title ?? step.title}</h3>
          </button>
        ))}
      </div>
      {activeData && (
        <div className="process__detail">
          <div className="process__detail-card">
            <div className="process__illustration">
              {processIllustrations[activeStep]}
            </div>
            <div>
              <h3>{activeContent?.title ?? activeData.title}</h3>
              <p>{activeContent?.text ?? activeData.text}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/** 문의 영역: 지금은 데모 제출 상태이며, 추후 API 또는 폼 서비스 연결 지점입니다. */
function ContactSection({
  content
}: {
  content: { title: string; description: string };
}) {
  return (
    <section className="contact section" id="contact" aria-labelledby="contact-title">
      <div className="contact-copy">
        <h2 id="contact-title">{content.title}</h2>
        <p>{content.description}</p>
        <div className="contact-actions">
          <a className="primary-button" href={business.phoneHref}>
            <Phone size={20} />
            {business.phone}
          </a>
          <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
            <MessageCircle size={20} />
            카카오톡으로 사진 보내기
          </a>
        </div>
        <p className="contact-actions-note">빠른 문의는 전화·카카오톡으로, 상세 상담은 아래 견적상담 카드에서 이어집니다.</p>
        <BusinessInfoList />
      </div>
      <div className="contact-estimate-card">
        <span className="admin-kicker">
          <ArrowUpRight size={16} />
          상세 상담
        </span>
        <h3>상세한 상담은 견적상담 페이지에서 이어집니다</h3>
        <p>사진 첨부와 단계별 질문으로 더 정확하게 상담을 받을 수 있습니다.</p>
        <a className="primary-button" href="/estimate">
          견적상담 페이지로 이동
        </a>
      </div>
    </section>
  );
}

function SectionHeading({ id, title, description }: { id: string; title: string; description: string }) {
  return (
    <div className="section-heading">
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function RowHeading({
  id,
  title,
  description,
  linkLabel,
  href,
  className
}: {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <div className="section-heading row-heading">
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {linkLabel} <ExternalLink size={17} />
      </a>
    </div>
  );
}

function SiteFooter() {
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

function LandingPage({ content }: { content: NonNullable<ReturnType<typeof getLandingPageDefinition>> }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingPosts, setLandingPosts] = useState<PortfolioPost[]>([]);
  const [landingSource, setLandingSource] = useState<"loading" | "naver" | "fallback">("loading");

  useEffect(() => {
    let mounted = true;

    blogPortfolioService.loadPortfolioPosts().then(({ posts, source }) => {
      if (!mounted) return;
      setLandingPosts(posts);
      setLandingSource(source);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const matchedPosts = useMemo(() => filterLandingPosts(landingPosts, content), [content, landingPosts]);
  const referencePosts = matchedPosts.slice(0, 3);
  const portfolioPosts = matchedPosts.slice(3, 6).length ? matchedPosts.slice(3, 6) : matchedPosts.slice(0, 3);

  return (
    <>
      <SiteHeader
        menuOpen={menuOpen}
        navLabels={defaultHomepageContent.navLabels}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <main className="landing-page" id="top">
        <section className="landing-hero section" aria-labelledby="landing-title">
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
              </div>
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

        <section className="landing-section section" aria-labelledby="landing-blog-title">
          <SectionHeading
            id="landing-blog-title"
            title={`${content.searchTerms[0]} 사례 & 블로그`}
            description={`${content.searchTerms[0]} 관련 시공 사례와 블로그 게시물을 모았습니다.`}
          />
          <BlogShowcase
            label="블로그 레퍼런스"
            posts={referencePosts}
            emptyText="키워드가 맞는 최신 게시물을 찾지 못했습니다."
          />
          <BlogShowcase
            label="포트폴리오"
            posts={portfolioPosts}
            emptyText="추가 포트폴리오를 찾지 못했습니다."
          />
        </section>

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

        <section className="landing-section section" aria-labelledby="landing-related-title">
          <SectionHeading
            id="landing-related-title"
            title="함께 보면 좋은 페이지"
            description="관련 서비스나 인근 지역 상담 페이지로 바로 이동할 수 있습니다."
          />
          <div className="landing-related-links">
            {content.relatedLinks.map((link) => (
              <a className="landing-related-link" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      <MobileQuickCta />
    </>
  );
}

function BlogShowcase({
  label,
  posts,
  emptyText
}: {
  label: string;
  posts: PortfolioPost[];
  emptyText: string;
}) {
  const displayPosts = posts.slice(0, 5);

  return (
    <div className="landing-blog-showcase">
      <h3>{label}</h3>
      {displayPosts.length ? (
        <div className="blog-card-grid landing-blog-grid blog-card-carousel-mobile">
          {displayPosts.map((post, index) => (
            <a
              className={index === 0 ? "blog-card blog-card-featured" : "blog-card"}
              href={post.link}
              target="_blank"
              rel="noreferrer"
              key={`${label}-${post.link}-${post.title}`}
            >
              <img
                className="blog-card-image"
                src={post.image}
                alt={post.title}
                loading="lazy"
                onError={(event) => {
                  const image = event.currentTarget;
                  if (image.dataset.fallbackApplied === "true") return;
                  image.dataset.fallbackApplied = "true";
                  image.src = "/assets/consult-hero.png";
                }}
              />
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
      ) : (
        <p className="landing-empty">{emptyText}</p>
      )}
    </div>
  );
}

function filterLandingPosts(posts: PortfolioPost[], page: NonNullable<ReturnType<typeof getLandingPageDefinition>>) {
  const terms = page.searchTerms.map((term) => term.toLowerCase());
  const matched = posts.filter((post) => {
    const haystack = [
      post.title,
      post.cardTitle,
      post.description,
      post.date,
      ...(post.summary ?? []),
      ...(post.keywords ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });

  if (matched.length) {
    return matched.slice(0, 6);
  }

  return posts.slice(0, 6);
}

function MobileQuickCta() {
  return (
    <div className="mobile-cta" aria-label="빠른 상담">
      <a href={business.phoneHref}>
        <Phone size={19} />
        전화
      </a>
      <a href={business.kakaoUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={19} />
        카카오톡
      </a>
    </div>
  );
}

function useAutoCarousel(
  ref: RefObject<HTMLElement | null>,
  { enabled }: { enabled: boolean }
) {
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
    let timerId = window.setInterval(() => {
      if (stopped) return;

      const firstCard = container.firstElementChild as HTMLElement | null;
      if (!firstCard) return;

      const cardWidth = firstCard.getBoundingClientRect().width;
      const gapValue = window.getComputedStyle(container).columnGap || window.getComputedStyle(container).gap || "0";
      const gap = Number.parseFloat(gapValue) || 0;
      const step = Math.max(220, cardWidth + gap);
      const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 12;

      container.scrollTo({
        left: atEnd ? 0 : container.scrollLeft + step,
        behavior: "smooth"
      });
    }, 3400);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timerId);
    };

    const events: Array<keyof HTMLElementEventMap> = ["pointerdown", "touchstart", "wheel", "keydown", "mousedown"];
    events.forEach((eventName) => {
      container.addEventListener(eventName, stop, { passive: true });
    });

    return () => {
      window.clearInterval(timerId);
      events.forEach((eventName) => {
        container.removeEventListener(eventName, stop);
      });
    };
  }, [enabled, ref]);
}

export default App;
