import React, { useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
  const menuItems = navItems;
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
            <img className="brand__mark" src="/icons/brand-icon.png" alt="" aria-hidden="true" />
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
  const [mainCardIndex, setMainCardIndex] = useState(0);

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

  const cardSlots = useMemo(() => {
    if (caseImages.length === 0) return [];
    const nonMain = caseImages
      .map((img, i) => ({ img, i }))
      .filter(({ i }) => i !== mainCardIndex);
    const slots: Array<{ img: (typeof caseImages)[number]; role: "main" | "b" | "c"; imgIndex: number }> = [
      { img: caseImages[mainCardIndex], role: "main", imgIndex: mainCardIndex }
    ];
    if (nonMain[0]) slots.push({ img: nonMain[0].img, role: "b", imgIndex: nonMain[0].i });
    if (nonMain[1]) slots.push({ img: nonMain[1].img, role: "c", imgIndex: nonMain[1].i });
    return slots;
  }, [caseImages, mainCardIndex]);

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

        {/* Right column: card deck — click smaller cards to promote to main */}
        {cardSlots.length > 0 ? (
          <div className="hero__deck">
            {cardSlots.map(({ img, role, imgIndex }) => {
              const isMain = role === "main";
              return (
                <div
                  key={img.title}
                  className={`hero__card hero__card--${role}${isMain ? "" : " hero__card--clickable"}`}
                  onClick={isMain ? undefined : () => setMainCardIndex(imgIndex)}
                  role={isMain ? undefined : "button"}
                  tabIndex={isMain ? undefined : 0}
                  aria-label={isMain ? undefined : `${img.area} 크게 보기`}
                  onKeyDown={isMain ? undefined : (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMainCardIndex(imgIndex);
                    }
                  }}
                >
                  <img src={img.image} alt={img.title} />
                  {isMain && <div className="hero__card-tag">{img.area}</div>}
                </div>
              );
            })}
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
  const allImages = useMemo(
    () => cases.filter((item) => item.image).slice(0, 3),
    [cases]
  );
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [heroKey, setHeroKey] = useState(0);

  const heroItem = allImages[featuredIndex];
  const tileItems = allImages.filter((_, i) => i !== featuredIndex);

  function handleTileClick(item: typeof allImages[0]) {
    const newIndex = allImages.indexOf(item);
    if (newIndex === featuredIndex) return;
    setFeaturedIndex(newIndex);
    setHeroKey((k) => k + 1);
  }

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
        {heroItem && (
          <figure className="about-visual__hero" key={`hero-${heroKey}`}>
            <img src={heroItem.image} alt={heroItem.title} loading="lazy" />
            <figcaption>
              <strong>{heroItem.area}</strong>
              <span>{heroItem.title}</span>
            </figcaption>
          </figure>
        )}
        <div className="about-visual__stack">
          {tileItems.map((item) => (
            <figure
              className="about-visual__tile about-visual__tile--clickable"
              key={item.title}
              onClick={() => handleTileClick(item)}
              role="button"
              tabIndex={0}
              aria-label={`${item.title} 크게 보기`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleTileClick(item); }}
            >
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
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollFrameRef = useRef<number | null>(null);

  useAutoCarousel(railRef, { enabled: true });

  const description =
    source === "naver"
      ? "최근 현장 시공 사례를 블로그에서 가져옵니다."
      : "대표 시공 포트폴리오입니다.";
  const displayPosts = posts.slice(0, 5);

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
      if (dist < nearestDist) { nearestDist = dist; nearest = index; }
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
    <section className="blog section" id="blog" aria-labelledby="blog-title">
      <RowHeading
        id="blog-title"
        title="네이버 블로그 포트폴리오"
        description={description}
        linkLabel="N 블로그"
        href={business.naverBlogUrl}
        className="naver-link"
      />
      <div className="blog-card-grid blog-card-carousel-mobile" ref={railRef} onScroll={handleScroll}>
        {displayPosts.map((post, index) => (
          <a
            className={index === 0 ? "blog-card blog-card-featured" : "blog-card"}
            href={post.link}
            target="_blank"
            rel="noreferrer"
            key={post.title}
            ref={(el) => { cardRefs.current[index] = el; }}
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
      <div className="blog-carousel-controls" aria-label="블로그 포트폴리오 캐러셀 컨트롤">
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
  "/assets/consult-hero.png",
  "/assets/cases/bathroom-leak.png",
  "/assets/cases/kitchen-repair.png",
  "/assets/cases/wall-repair.png",
  "/assets/process-completion.png"
];

/** 작업 절차 영역: 클릭 가능한 스텝 트랙 + 상세 패널 */
function ProcessSection({ steps }: { steps: { title: string; text: string; image?: string }[] }) {
  const [activeStep, setActiveStep] = useState(0);
  const activeData = process[activeStep];
  const activeContent = steps[activeStep];
  const processSignals = [
    {
      label: "사진 우선",
      text: "방문 전에 범위를 먼저 좁혀 불필요한 동선을 줄입니다.",
      icon: MessageCircle
    },
    {
      label: "대표 직접 확인",
      text: "대표가 현장을 직접 보고 필요한 작업만 추립니다.",
      icon: User
    },
    {
      label: "투명 안내",
      text: "작업 범위, 비용, 일정은 한 번에 정리해서 안내합니다.",
      icon: Phone
    }
  ];
  return (
    <section className="process" id="process" aria-labelledby="process-title">
      <div className="process__shell">
        <div className="process__intro">
          <div style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(32px,5vw,64px) clamp(18px,5vw,64px) 0" }}>
            <h2 id="process-title" style={{ fontFamily: "var(--f-display,sans-serif)", fontWeight: 800, fontSize: "clamp(26px,3.5vw,44px)", letterSpacing: "-0.03em", margin: "0 0 10px", color: "var(--ink,#0b1a30)" }}>작업 절차</h2>
            <p style={{ fontSize: "clamp(15px,1.4vw,18px)", color: "var(--ink-2,#2a3a55)", margin: 0 }}>불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다.</p>
          </div>
          <div className="process__signal-grid">
            {processSignals.map((signal) => {
              const SignalIcon = signal.icon;

              return (
                <article key={signal.label} className="process__signal-card">
                  <div className="process__signal-icon" aria-hidden="true">
                    <SignalIcon size={20} />
                  </div>
                  <div>
                    <h3>{signal.label}</h3>
                    <p>{signal.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="process__content">
          <div className="process__track">
            {process.map((step, index) => (
              <React.Fragment key={step.title}>
                <button
                  className={`process__step${activeStep === index ? " active" : ""}`}
                  onClick={() => setActiveStep(index)}
                  aria-current={activeStep === index ? "true" : undefined}
                >
                  <span className="step-num">0{index + 1}</span>
                  <step.icon size={22} />
                  <h3>{steps[index]?.title ?? step.title}</h3>
                </button>
                {activeStep === index && (
                  <div className="process__inline-detail">
                    <div className="process__illustration">
                      <img
                        src={steps[index]?.image || processIllustrations[index]}
                        alt={steps[index]?.title ?? step.title}
                        className="process__step-photo"
                      />
                    </div>
                    <div className="process__inline-text">
                      <h3>{steps[index]?.title ?? step.title}</h3>
                      <p>{steps[index]?.text ?? step.text}</p>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {activeData && (
            <div className="process__detail">
              <div className="process__detail-card">
                <div className="process__detail-media">
                  <div className="process__detail-gallery-main">
                    <img
                      src={steps[activeStep]?.image || processIllustrations[activeStep]}
                      alt={activeContent?.title ?? activeData.title}
                      className="process__step-photo"
                    />
                  </div>
                </div>
                <div className="process__detail-copy">
                  <div className="process__detail-kicker">0{activeStep + 1} / 05</div>
                  <h3>{activeContent?.title ?? activeData.title}</h3>
                  <p>{activeContent?.text ?? activeData.text}</p>
                  <div className="process__detail-points">
                    {processSignals.map((signal) => {
                      const SignalIcon = signal.icon;

                      return (
                        <div className="process__detail-point" key={signal.label}>
                          <SignalIcon size={16} />
                          <span>{signal.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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

  const landingSearchTerms = buildLandingSearchTerms(content);
  const landingQueryTerms = buildLandingQueryTerms(content);
  const landingSearchKey = landingQueryTerms.join("|");

  useEffect(() => {
    let mounted = true;

    blogPortfolioService.loadPortfolioPosts(landingQueryTerms).then(({ posts, source }) => {
      if (!mounted) return;
      setLandingPosts(posts);
      setLandingSource(source);
    });

    return () => {
      mounted = false;
    };
  }, [landingSearchKey]);

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
  const terms = buildLandingSearchTerms(page);
  const ranked = posts
    .map((post) => ({
      post,
      score: scoreLandingPost(post, terms, page)
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareLandingPostDate(right.post.date, left.post.date))
    .map((entry) => entry.post);

  if (ranked.length) {
    return ranked.slice(0, 6);
  }

  return [...posts]
    .sort((left, right) => compareLandingPostDate(right.date, left.date))
    .slice(0, 6);
}

function buildLandingSearchTerms(page: NonNullable<ReturnType<typeof getLandingPageDefinition>>) {
  const extraTerms = page.pageType === "Service"
    ? [page.serviceType, page.serviceType, page.title]
    : [page.areaLabel, page.areaLabel, page.title];

  const relatedTerms = page.pageType === "Service" ? (page.relatedLinks?.map((link) => link.label) ?? []) : [];

  return [...page.searchTerms, ...extraTerms, ...relatedTerms]
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function buildLandingQueryTerms(page: NonNullable<ReturnType<typeof getLandingPageDefinition>>) {
  const coreTerms = page.pageType === "Service"
    ? [page.serviceType, ...page.searchTerms]
    : [page.areaLabel, ...page.searchTerms];

  return coreTerms
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function scoreLandingPost(
  post: PortfolioPost,
  terms: string[],
  page: NonNullable<ReturnType<typeof getLandingPageDefinition>>
) {
  const title = normalizeSearchText(post.cardTitle ?? post.title);
  const description = normalizeSearchText(post.description);
  const summary = normalizeSearchText((post.summary ?? []).join(" "));
  const keywords = normalizeSearchText((post.keywords ?? []).join(" "));
  const haystack = `${title} ${description} ${summary} ${keywords}`;

  if (!terms.length || !terms.some((term) => haystack.includes(term))) {
    return 0;
  }

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

  const primaryTerm = normalizeSearchText(page.pageType === "Service" ? page.serviceType ?? page.title : page.areaLabel ?? page.title);
  if (primaryTerm && haystack.includes(primaryTerm)) {
    score += page.pageType === "Service" ? 24 : 20;
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
  if (parsedDate) {
    score += page.pageType === "Place" ? 8 : 5;
  }
  return score;
}

function normalizeSearchText(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compareLandingPostDate(left: string, right: string) {
  return parseLandingPostDate(left) - parseLandingPostDate(right);
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
