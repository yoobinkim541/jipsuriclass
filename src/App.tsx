import React, { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  User,
  X
} from "lucide-react";
import { business, cases, navItems, pinnedPosts, process, services, symptoms, symptomCategories } from "./data";
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
import { buildLandingPageJsonLd, getLandingPageDefinition, mergeLandingPageContent } from "./landingPages";
import { defaultLandingPagesContent, type LandingPagesContent } from "./services/SiteContentService";
import { defaultHomepageSectionOrder, defaultLandingSectionOrder } from "./contentSections";
import { type PriceCategory, type PriceItem } from "./electricPriceData";
import {
  waterproofingPriceCategories,
  waterproofingTilePriceCategories
} from "./waterproofingTilePriceData";
import { ServicePricingPage } from "./pricing/ServicePricingPage";
import { getServicePricingConfig, getServicePricingConfigByPricingPath } from "./pricing/registry";
import type { ServicePricingConfig } from "./pricing/types";
import { buildEstimateHref } from "./services/QuoteService";

const blogPortfolioService = new BlogPortfolioService("/api/naver-blog", pinnedPosts);
const siteContentService = new SiteContentService();
const siteUrl = "https://www.jipsuriclass.kr";
const siteName = business.name;
const defaultDescription = "서울·경기 집수리, 누수 복구, 부분수리, 욕실·주방·도배·전기·목공 상담을 사진 기반으로 빠르게 안내합니다.";
const defaultImage = `${siteUrl}/og-image.png`;
function Redirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

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
  const pricingPageConfig = getServicePricingConfigByPricingPath(window.location.pathname);
  if (pricingPageConfig) {
    return <ServicePricingPage config={pricingPageConfig} />;
  }

  if (window.location.pathname === "/service/electric/price") {
    return <Redirect to="/service/electric/pricing" />;
  }
  if (window.location.pathname === "/service/waterproofing-tile/price") {
    return <WaterproofingTilePricePage />;
  }
  if (window.location.pathname === "/service/waterproofing/price") {
    return <WaterproofingPricePage />;
  }
  if (window.location.pathname === "/service/tile/price") {
    return <Redirect to="/service/tile/pricing" />;
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

  if (pathname === "/service/electric/price") {
    return {
      path: "/service/electric/price",
      title: `전기공사 가격표 | ${siteName}`,
      description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `전기공사 가격표 | ${siteName}`,
          url: `${siteUrl}/service/electric/price`,
          description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/waterproofing-tile/price") {
    return {
      path: "/service/waterproofing-tile/price",
      title: `방수·타일 가격표 | ${siteName}`,
      description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `방수·타일 가격표 | ${siteName}`,
          url: `${siteUrl}/service/waterproofing-tile/price`,
          description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/waterproofing/price") {
    return {
      path: "/service/waterproofing/price",
      title: `방수 보수 가격표 | ${siteName}`,
      description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `방수 보수 가격표 | ${siteName}`,
          url: `${siteUrl}/service/waterproofing/price`,
          description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/tile/price") {
    return {
      path: "/service/tile/price",
      title: `타일 시공·보수 가격표 | ${siteName}`,
      description: "집수리클라쓰 타일 시공·보수 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `타일 시공·보수 가격표 | ${siteName}`,
          url: `${siteUrl}/service/tile/price`,
          description: "집수리클라쓰 타일 시공·보수 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  const registryPricingConfig = getServicePricingConfigByPricingPath(pathname);
  if (registryPricingConfig) {
    return {
      path: pathname,
      title: `${registryPricingConfig.serviceName} 가격표 | ${siteName}`,
      description: `집수리클라쓰 ${registryPricingConfig.serviceName} 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.`,
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${registryPricingConfig.serviceName} 가격표 | ${siteName}`,
          url: `${siteUrl}${pathname}`,
          description: `집수리클라쓰 ${registryPricingConfig.serviceName} 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다.`
        }
      ]
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
      noindex: true,
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
      title: `간편 자가진단 | ${siteName}`,
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
    title: `${siteName} - 클라쓰가 다른 종합 집수리`,
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
  const [blogPosts, setBlogPosts] = useState<PortfolioPost[]>([]);
  const [blogSource, setBlogSource] = useState<"loading" | "naver" | "fallback">("loading");
  const [homeContent, setHomeContent] = useState(defaultHomepageContent);
  const [contentReady, setContentReady] = useState(false);
  const homepageSections = homeContent.sections?.length ? homeContent.sections : defaultHomepageSectionOrder;
  const homepageSectionOrder = defaultHomepageSectionOrder.filter((sectionId) => homepageSections.includes(sectionId));

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const isReload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
    if (isReload) return;
    const id = hash.slice(1);
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", window.location.pathname);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    void siteContentService.loadHomepageContent().then((content) => {
      if (!mounted) return;
      setHomeContent(content);
      setContentReady(true);
    });

    blogPortfolioService.loadLatestPortfolioPosts().then(({ posts, source }) => {
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
        {homepageSectionOrder.map((sectionId) => {
          switch (sectionId) {
            case "hero":
              return <HeroSection key={sectionId} content={homeContent.hero} cases={homeContent.cases} />;
            case "about":
              return <AboutSection key={sectionId} content={homeContent.about} cases={homeContent.cases} />;
            case "symptoms":
              return <SymptomsSection key={sectionId} symptoms={homeContent.symptoms ?? symptoms} categories={symptomCategories} />;
            case "services":
              return <ServicesSection key={sectionId} services={homeContent.services} />;
            case "specialties":
              return <SpecialtiesSection key={sectionId} specialties={homeContent.specialties ?? business.specialties} />;
            case "cases":
              return <CasesSection key={sectionId} cases={homeContent.cases} />;
            case "blog":
              return (
                <BlogSection
                  key={sectionId}
                  posts={blogPosts}
                  source={blogSource}
                />
              );
            case "location":
              return <OfficeSection key={sectionId} />;
            case "contact":
              return <ContactSection key={sectionId} content={homeContent.contact} />;
            case "process":
              return <ProcessSection key={sectionId} steps={homeContent.process} />;
            default:
              return null;
          }
        })}
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
  onCloseMenu,
  brandHref = "#top"
}: {
  menuOpen: boolean;
  navLabels: string[];
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  brandHref?: string;
}) {
  const menuItems = navItems;
  const desktopMenuItems = menuItems;
  const isHome = window.location.pathname === "/";
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);
  const resolveActiveHref = () => {
    if (isHome) {
      const anchorItems = menuItems.filter((item) => item.href.startsWith("#"));
      let activeHref = anchorItems[0]?.href ?? "";
      const scrollTop = window.scrollY + 140;

      for (const item of anchorItems) {
        const target = document.getElementById(item.href.slice(1));
        if (!target) continue;
        if (target.offsetTop <= scrollTop) {
          activeHref = item.href;
        }
      }

      return activeHref;
    }

    if (window.location.pathname.startsWith("/diagnosis")) return "/#symptoms";
    if (window.location.pathname.startsWith("/estimate")) return "/estimate";
    return "";
  };

  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState(resolveActiveHref);

  useEffect(() => {
    const handleScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
      setScrolled(window.scrollY > 10);
      if (isHome) {
        setActiveHref(resolveActiveHref());
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isHome]);

  useEffect(() => {
    setActiveHref(resolveActiveHref());
  }, [isHome]);

  return (
    <>
      <header className="nav" data-elevated={menuOpen || scrolled ? "true" : "false"}>
        <div className="nav__progress">
          <span className="nav__progress-bar" style={{ width: `${scrollPct}%` }} />
        </div>
        <div className="nav__inner">
          <a className="brand" href={brandHref} aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/brand-icon.png" alt="" aria-hidden="true" />
            <span className="brand__name">
              집수리<em>클라쓰</em>
            </span>
          </a>
          <nav className="nav__links" aria-label="주요 메뉴">
            {desktopMenuItems.map((item) => (
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
            <button className="nav__menu" onClick={menuOpen ? onCloseMenu : onOpenMenu} aria-label={menuOpen ? "사이드바 닫기" : "사이드바 열기"}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
        <div className="mobile-menu-overlay" onClick={onCloseMenu} aria-hidden="true" />
        <div className="mobile-menu">
          <button onClick={onCloseMenu} aria-label="메뉴 닫기">
            <X size={24} />
          </button>
          {menuItems.map((item) => (
            <a
              href={resolveHref(item.href)}
              key={item.href}
              onClick={onCloseMenu}
              data-active={activeHref === item.href ? "true" : undefined}
              aria-current={activeHref === item.href ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
          <a href="/login" onClick={onCloseMenu}>
            마이페이지
          </a>
        </div>
        </>
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
  const heroRotatorWords = content.rotatorWords.length > 0 ? content.rotatorWords : defaultHomepageContent.hero.rotatorWords;
  const [rotatorIndex, setRotatorIndex] = useState(0);
  const [rotatorKey, setRotatorKey] = useState(0);
  const [mainCardIndex, setMainCardIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRotatorIndex((i) => (i + 1) % heroRotatorWords.length);
      setRotatorKey((k) => k + 1);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [heroRotatorWords.length]);

  const caseImages = useMemo(
    () => editableCases.filter((c) => c.image).slice(0, 5),
    [editableCases]
  );

  // 4초마다 메인 카드 자동 회전
  useEffect(() => {
    if (caseImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setMainCardIndex((i) => (i + 1) % caseImages.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [caseImages.length]);

  // 각 이미지에 role 부여 (순서 고정 → CSS transition 작동)
  const cardSlots = useMemo(() => {
    if (caseImages.length === 0) return [];
    return caseImages.map((img, i) => {
      const offset = (i - mainCardIndex + caseImages.length) % caseImages.length;
      const role: "main" | "b" | "c" | "hidden" =
        offset === 0 ? "main" : offset === 1 ? "b" : offset === 2 ? "c" : "hidden";
      return { img, role, imgIndex: i };
    });
  }, [caseImages, mainCardIndex]);

  const proofs = content.proofs.length > 0 ? content.proofs : defaultHomepageContent.hero.proofs;
  const trustItems = content.trust.length > 0 ? content.trust : defaultHomepageContent.hero.trust;

  return (
    <section className="hero" id="hero">
      <div className="hero__grid">
        {/* Left column */}
        <div>
          <h1 className="hero__title">
            {content.title || "집의 모든 불편을"}{" "}
            <br />
            <span className="hero__rotator">
              <em key={rotatorKey}>{heroRotatorWords[rotatorIndex % heroRotatorWords.length]}</em>
            </span>
            로 끝냅니다.
          </h1>
          <p className="hero__lede">
            {(content.description || "물 새는 천장부터 들뜬 벽지까지. 큰 공사 권하지 않고 딱 필요한 만큼만, 7개 국가공인 건축자격을 가진 대표가 직접 손봅니다.").replace("누수 복구", "누수 복구")}
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
            {proofs.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
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
                  className={`hero__card hero__card--${role}${isMain || role === "hidden" ? "" : " hero__card--clickable"}`}
                  onClick={isMain || role === "hidden" ? undefined : () => setMainCardIndex(imgIndex)}
                  role={isMain || role === "hidden" ? undefined : "button"}
                  tabIndex={isMain || role === "hidden" ? undefined : 0}
                  aria-label={isMain || role === "hidden" ? undefined : `${img.area} 크게 보기`}
                  onKeyDown={isMain || role === "hidden" ? undefined : (e) => {
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
          </div>
        ) : null}
      </div>
      <div className="trust trust--embedded" aria-label="신뢰 지표">
        <div className="trust__inner">
          {trustItems.map((item) => (
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
    () => cases.filter((item) => item.image).slice(0, 5),
    [cases]
  );
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // 4초마다 대표 이미지 자동 회전
  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % allImages.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [allImages.length]);

  const heroItem = allImages[featuredIndex];
  const tileItems = allImages.filter((_, i) => i !== featuredIndex).slice(0, 2);

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
          <figure className="about-visual__hero about-visual__hero--auto" key={`hero-${featuredIndex}`}>
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
              onClick={() => setFeaturedIndex(allImages.indexOf(item))}
              role="button"
              tabIndex={0}
              aria-label={`${item.title} 크게 보기`}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFeaturedIndex(allImages.indexOf(item)); }}
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
function SymptomsSection({ symptoms, categories }: { symptoms: string[]; categories: typeof symptomCategories }) {
  return (
    <section className="symptoms section" id="symptoms" aria-labelledby="symptoms-title">
      <RowHeading
        id="symptoms-title"
        title="고객이 말하는 증상부터 간편 자가진단을 시작합니다"
        description="전문 용어를 몰라도 괜찮습니다. 지금 보이는 문제를 클릭하면 바로 원인과 다음 행동이 나옵니다."
        linkLabel="자가진단 페이지로 이동"
        href="/diagnosis"
      />

      {/* 데스크탑: 2단 — 카테고리 + 세부 증상 칩 */}
      <div className="symptom-categories">
        {categories.map((cat) => (
          <div className="symptom-cat-card" key={cat.id}>
            <a className="symptom-cat-label" href={`/diagnosis?category=${cat.id}`}>
              <span className="symptom-cat-icon">{cat.icon}</span>
              {cat.label}
              <ArrowUpRight size={14} />
            </a>
            <ul className="symptom-chip-list">
              {cat.symptoms.map((s) => (
                <li key={s.id}>
                  <a className="symptom-chip" href={`/diagnosis?issue=${s.id}`}>
                    {s.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 모바일·태블릿: 1단 — 카테고리 칩만 */}
      <div className="symptom-grid--mobile">
        {categories.map((cat) => (
          <a
            className="symptom-grid-item"
            href={`/diagnosis?category=${cat.id}`}
            key={cat.id}
          >
            <span>{cat.icon} {cat.label}</span>
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
      <div className="sec-head services-head">
        <h2 id="services-title">생활 집수리 서비스</h2>
        <p>큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다.</p>
      </div>
      <div className="bento">
        {services.map((service, index) => {
          const item = editableServices[index] ?? { title: service.title, text: service.text };
          return (
            <a className="bento__card bento__card--link" href={service.href} key={item.title}>
              <span className="bento__num">{String(index + 1).padStart(2, "0")}</span>
              <service.icon size={28} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <span className="bento__link-label">
                {index === 0 ? "견적상담으로 이동" : "자세히 보기"}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function SpecialtiesSection({ specialties = business.specialties }: { specialties?: string[] }) {
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
    return specialties.filter((item) => {
      const catMatch = activeCategory === "all" || itemCatMap[item] === activeCategory;
      const searchMatch = !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [activeCategory, searchQuery, specialties]);

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
      <div className="sec-head">
        <h2 id="specialties-title">가능 작업</h2>
        <p>집 안팎에서 필요한 수리, 설비, 마감, 리모델링 작업을 폭넓게 상담합니다.</p>
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
          <Search size={16} style={{ color: "var(--ink-3,#5b6781)" }} />
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
    }, 2800);

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
      <RowHeading
        id="cases-title"
        title="대표 현장사례"
        description="실제 현장 사진과 작업 내용을 확인하세요."
        linkLabel="전체 사례 보기"
        href={business.naverBlogUrl}
        className="naver-link"
      />
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

  const description =
    source === "naver"
      ? "최근 현장 시공 사례를 블로그에서 가져옵니다."
      : "대표 시공 포트폴리오입니다.";
  const displayPosts = posts.slice(0, 8);

  useAutoCarousel(railRef, { enabled: displayPosts.length > 1 });

  if (source === "loading" && !displayPosts.length) {
    return (
      <section className="blog section" id="blog" aria-labelledby="blog-title">
        <RowHeading
          id="blog-title"
          title="네이버 블로그 포트폴리오"
          description="최근 현장 시공 사례를 블로그에서 가져옵니다."
          linkLabel="N 블로그"
          href={business.naverBlogUrl}
          className="naver-link"
        />
        <div className="admin-empty">최신 블로그 글을 불러오는 중</div>
      </section>
    );
  }

  if (!displayPosts.length) {
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
        <div className="admin-empty">최신 블로그 글을 불러오지 못했습니다. N 블로그에서 직접 확인해 주세요.</div>
      </section>
    );
  }

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
      <div className="blog__carousel">
        <div className="blog__rail" ref={railRef} onScroll={handleScroll}>
          {displayPosts.map((post, index) => (
            <a
              className={index === 0 ? "blog-card blog-card-featured blog__card" : "blog-card blog__card"}
              href={post.link}
              target="_blank"
              rel="noreferrer"
            key={post.title}
            ref={(el) => { cardRefs.current[index] = el; }}
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
      text: "방문 전에 사진으로 범위를 먼저 좁힙니다.",
      icon: MessageCircle
    },
    {
      label: "대표 직접 확인",
      text: "대표가 현장을 직접 보고 필요한 작업만 고릅니다.",
      icon: User
    },
    {
      label: "투명 안내",
      text: "비용·범위·일정을 한 번에 정리해 안내합니다.",
      icon: Phone
    }
  ];
  return (
    <section className="process" id="process" aria-labelledby="process-title">
      <div className="process__shell">
        <div className="process__intro">
          <SectionHeading
            id="process-title"
            title="작업 절차"
            description="불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다."
          />
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
      <div className="contact-header">
        <h2 id="contact-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <div className="contact-layout">
        <div className="contact-copy">
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

  const landingSearchTerms = buildLandingSearchTerms(content);
  const landingQueryTerms = buildLandingQueryTerms(content);
  const landingSearchKey = `${landingQueryTerms.join("|")}::${(content.blogCategoryNos ?? []).join(",")}`;

  useEffect(() => {
    blogPortfolioService.loadPortfolioPosts(landingQueryTerms, content.blogCategoryNos ?? []).then(({ posts }) => {
      setLandingPosts(posts);
    });
  }, [landingSearchKey]);

  const referencePosts = useMemo(() => {
    const matchedPosts = filterLandingPosts(landingPosts, content, landingSearchTerms);
    if (content.pageType === "Service") {
      return matchedPosts;
    }
    if (matchedPosts.length) return matchedPosts;
    return landingPosts.slice(0, 6);
  }, [content, landingPosts, landingSearchTerms]);
  // Portfolio: fixed curated posts managed via admin editor — never changes automatically
  const portfolioPosts = pinnedPosts.slice(0, 5);
  const landingSectionOrder = content.sections ?? defaultLandingSectionOrder;

  return (
    <>
      <SiteHeader
        menuOpen={menuOpen}
        navLabels={defaultHomepageContent.navLabels}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
        brandHref="/"
      />
      <LandingBackButton fallbackHref="/" />
      <main className="landing-page" id="top">
        {landingSectionOrder.map((sectionId) => {
          switch (sectionId) {
            case "summary":
              return (
                <section className="landing-hero section" aria-labelledby="landing-title" key={sectionId}>
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
                        {getServicePricingConfig(content.path) && (
                          <a className="secondary-button" href={getServicePricingConfig(content.path)!.pricingPagePath}>
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
            case "points":
              return (
                <section className="landing-section section" aria-labelledby="landing-points-title" key={sectionId}>
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
            case "blog":
              return (
                <section className="landing-section section" aria-labelledby="landing-blog-title" key={sectionId}>
                  <SectionHeading
                    id="landing-blog-title"
                    title={`${content.serviceType ?? content.areaLabel ?? content.searchTerms[0]} 사례 & 블로그`}
                    description={`${content.serviceType ?? content.areaLabel ?? content.searchTerms[0]} 관련 시공 사례와 블로그 게시물을 모았습니다.`}
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
                  {getServicePricingConfig(content.path) && <ServiceEstimator config={getServicePricingConfig(content.path)!} />}
                </section>
              );
            case "faq":
              return (
                <section className="landing-section section" aria-labelledby="landing-faq-title" key={sectionId}>
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
            case "relatedLinks":
              return (
                <section className="landing-section section" aria-labelledby="landing-related-title" key={sectionId}>
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
              );
            default:
              return null;
          }
        })}
      </main>
      <SiteFooter />
      <MobileQuickCta />
    </>
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
        {/* ── 왼쪽: 항목 테이블 ── */}
        <div className="estimator-table-col">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--ink-3,#5b6781)" }}>
              항목 클릭으로 선택 · 복수 항목 동시 선택 가능
            </span>
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
                      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(item.name); } }}
                    >
                      <div className="estimator-checkbox">
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                            <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "clamp(13px,1.2vw,14px)", color: "var(--ink,#0b1a30)" }}>
                          {item.name}
                        </span>
                        <span style={{ marginLeft: 6, fontSize: 11, color: "var(--ink-4,#94a0b8)" }}>/ {item.unit}</span>
                      </div>

                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-700,#10284a)", whiteSpace: "nowrap" }}>
                        {item.priceLabel}
                      </span>

                      {item.materialNote === "별도" ? (
                        <span style={{ background: "#f0f4ff", color: "#3b5bdb", fontWeight: 600, fontSize: 11, padding: "2px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
                          자재별도
                        </span>
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

        {/* ── 오른쪽: 견적 요약 패널 ── */}
        <div className="estimator-panel-col">
          <div style={{ background: "#fff", border: "1px solid var(--hair,#e6dfd0)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--hair,#e6dfd0)", display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={16} style={{ color: "var(--ink-2,#2a3a55)" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink,#0b1a30)" }}>견적 요약</span>
              {selectedCount > 0 && (
                <span style={{ marginLeft: "auto", background: "#3b5bdb", color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>
                  {selectedCount}
                </span>
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

                  {!hasCallout && (
                    <p style={{ fontSize: 12, color: "var(--ink-3,#5b6781)", margin: "0 0 6px" }}>* 출장비(평일 15,000원~) 별도</p>
                  )}
                  {hasMaterial && (
                    <p style={{ fontSize: 12, color: "var(--ink-3,#5b6781)", margin: "0 0 10px" }}>* 부속자재 비용 별도 항목 있음</p>
                  )}

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
                      <span style={{ fontWeight: 800, fontSize: "clamp(16px,1.8vw,20px)", color: "var(--navy-700,#10284a)" }}>
                        {fmt(Math.round(total * 1.1))}~
                      </span>
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

const LandingBackButton = ({ fallbackHref = "/" }: { fallbackHref?: string }) => {
  return (
    <button
      className="landing-back-btn"
      type="button"
      aria-label="이전 페이지로 이동"
      onClick={() => {
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
};

function BlogCardImage({
  post
}: {
  post: PortfolioPost;
}) {
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
    <div className="landing-blog-showcase">
      <h3>{label}</h3>
      {displayPosts.length ? (
        <>
          <div
            className="blog-card-grid landing-blog-grid blog-card-carousel-mobile"
            ref={railRef}
            onScroll={handleScroll}
          >
            {displayPosts.map((post, index) => (
              <a
                className={index === 0 ? "blog-card blog-card-featured" : "blog-card"}
                href={post.link}
                target="_blank"
                rel="noreferrer"
                key={`${label}-${post.link}-${post.title}`}
                ref={(el) => { cardRefs.current[index] = el; }}
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

function filterLandingPosts(
  posts: PortfolioPost[],
  page: NonNullable<ReturnType<typeof getLandingPageDefinition>>,
  terms: string[]
) {
  // Only return posts that actually match the search terms.
  // Showing unrelated recent posts is worse than showing nothing.
  return posts
    .map((post) => ({ post, score: scoreLandingPost(post, terms, page) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareLandingPostDate(right.post.date, left.post.date))
    .map((entry) => entry.post)
    .slice(0, 6);
}

function buildLandingSearchTerms(page: NonNullable<ReturnType<typeof getLandingPageDefinition>>) {
  const terms = page.pageType === "Service"
    ? (page.blogTerms ?? page.searchTerms)
    : [page.areaLabel, ...page.searchTerms];

  return terms
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function buildLandingQueryTerms(page: NonNullable<ReturnType<typeof getLandingPageDefinition>>) {
  const terms = page.pageType === "Service"
    ? (page.blogQueryTerms ?? page.blogTerms ?? page.searchTerms)
    : [page.areaLabel, ...page.searchTerms];

  return terms
    .filter((term): term is string => typeof term === "string" && term.trim().length > 0)
    .map((term) => term.toLowerCase())
    .filter((term, index, array) => array.indexOf(term) === index);
}

function buildPriceSelectionHref(
  path: string,
  options: {
    items?: string[];
    focus?: string;
  }
) {
  const params = new URLSearchParams();
  if (options.focus) {
    params.set("focus", options.focus);
  }
  if (options.items?.length) {
    params.set("items", options.items.join(","));
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function scoreLandingPost(
  post: PortfolioPost,
  terms: string[],
  page: NonNullable<ReturnType<typeof getLandingPageDefinition>>
) {
  const title = normalizeSearchText([post.title, post.cardTitle].filter(Boolean).join(" "));
  const description = normalizeSearchText(post.description);
  const summary = normalizeSearchText((post.summary ?? []).join(" "));
  const keywords = normalizeSearchText((post.keywords ?? []).join(" "));
  const haystack = `${title} ${description} ${summary} ${keywords}`;
  const blockedTerms = page.blogExcludeTerms ?? [];

  if (blockedTerms.some((term) => term && haystack.includes(term))) {
    return 0;
  }

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
    }, 2800);

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

function getPricePageQuery() {
  if (typeof window === "undefined") {
    return { focus: "", itemIds: [] as string[] };
  }

  const params = new URLSearchParams(window.location.search);
  const rawItems = params.get("items") ?? params.get("selected") ?? params.get("item") ?? "";
  const itemIds = rawItems
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return {
    focus: (params.get("focus") ?? "").trim(),
    itemIds
  };
}

function buildInitialPriceSelection(categories: PriceCategory[], itemIds: string[]) {
  if (!itemIds.length) {
    return {};
  }

  const allowed = new Set(categories.flatMap((category) => category.items.map((item) => item.id)));
  return itemIds.reduce<Record<string, number>>((selection, itemId) => {
    if (allowed.has(itemId)) {
      selection[itemId] = 1;
    }
    return selection;
  }, {});
}

const PRICE_SELECTION_STORAGE_PREFIX = "jipsuri.priceSelection.v1";

function buildPriceSelectionStorageKey(pricingPath: string) {
  return `${PRICE_SELECTION_STORAGE_PREFIX}:${pricingPath}`;
}

function readPersistedPriceSelection(pricingPath: string, categories: PriceCategory[]) {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(buildPriceSelectionStorageKey(pricingPath));
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const allowed = new Set(categories.flatMap((category) => category.items.map((item) => item.id)));

    return Object.entries(parsed).reduce<Record<string, number>>((selection, [itemId, qty]) => {
      const nextQty = Number(qty);
      if (allowed.has(itemId) && Number.isFinite(nextQty) && nextQty > 0) {
        selection[itemId] = Math.max(1, Math.round(nextQty));
      }
      return selection;
    }, {});
  } catch {
    return {};
  }
}

function persistPriceSelection(pricingPath: string, categories: PriceCategory[], selection: Record<string, number>) {
  if (typeof window === "undefined") {
    return;
  }

  const allowed = new Set(categories.flatMap((category) => category.items.map((item) => item.id)));
  const nextSelection = Object.entries(selection).reduce<Record<string, number>>((acc, [itemId, qty]) => {
    if (allowed.has(itemId) && Number.isFinite(qty) && qty > 0) {
      acc[itemId] = Math.max(1, Math.round(qty));
    }
    return acc;
  }, {});
  const storageKey = buildPriceSelectionStorageKey(pricingPath);

  if (!Object.keys(nextSelection).length) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(nextSelection));
}

type ServicePricePageProps = {
  kicker: string;
  title: string;
  description: string;
  note: string;
  servicePath: string;
  pricingPath: string;
  categories: PriceCategory[];
  backHref: string;
  backLabel: string;
};

function ServicePricePage({
  kicker,
  title,
  description,
  note,
  servicePath,
  pricingPath,
  categories,
  backHref,
  backLabel
}: ServicePricePageProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initialQuery = useMemo(() => getPricePageQuery(), []);
  const [selected, setSelected] = useState<Record<string, number>>(() => {
    const querySelection = buildInitialPriceSelection(categories, initialQuery.itemIds);
    if (Object.keys(querySelection).length > 0) {
      return querySelection;
    }

    return readPersistedPriceSelection(pricingPath, categories);
  });

  useEffect(() => {
    persistPriceSelection(pricingPath, categories, selected);
  }, [categories, pricingPath, selected]);

  useEffect(() => {
    if (!initialQuery.focus) return;

    const target = document.getElementById(`price-category-${initialQuery.focus}`);
    if (!target) return;

    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialQuery.focus]);

  function toggle(item: PriceItem) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = 1;
      }
      return next;
    });
  }

  function setQty(itemId: string, qty: number) {
    setSelected((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: qty };
    });
  }

  const allItems = categories.flatMap((c) => c.items);
  const selectedItems = allItems.filter((item) => selected[item.id]);
  const total = selectedItems.reduce((sum, item) => sum + item.price * (selected[item.id] ?? 0), 0);
  const hasSelection = selectedItems.length > 0;

  return (
    <>
      <SiteHeader
        menuOpen={menuOpen}
        navLabels={defaultHomepageContent.navLabels}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
        brandHref="/"
      />
      <LandingBackButton fallbackHref={backHref} />
      <main className="price-page" id="top">
        <section className="price-page__hero section">
          <span className="landing-kicker">{kicker}</span>
          <h1 className="price-page__title">{title}</h1>
          <p className="price-page__desc">
            {description}
            <br />
            <span className="price-page__note">{note}</span>
          </p>
        </section>

        <div className="price-page__layout section">
          <div className="price-page__table-wrap">
            {categories.map((cat) => (
              <section key={cat.id} id={`price-category-${cat.id}`} className="price-category">
                <h2 className="price-category__title">{cat.title}</h2>
                <table className="price-table">
                  <thead>
                    <tr>
                      <th className="price-table__check">선택</th>
                      <th className="price-table__name">항목</th>
                      <th className="price-table__unit">단위</th>
                      <th className="price-table__price">인건비</th>
                      <th className="price-table__material">제품·부속자재</th>
                      <th className="price-table__qty">수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item) => {
                      const isSelected = !!selected[item.id];
                      return (
                        <tr
                          key={item.id}
                          className={`price-table__row${isSelected ? " price-table__row--selected" : ""}`}
                          onClick={() => toggle(item)}
                        >
                          <td className="price-table__check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle(item)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`${item.name} 선택`}
                            />
                          </td>
                          <td className="price-table__name">
                            {item.name}
                            {item.note && <span className="price-table__row-note">{item.note}</span>}
                          </td>
                          <td className="price-table__unit">{item.unit}</td>
                          <td className="price-table__price">{item.price.toLocaleString()}원</td>
                          <td className="price-table__material">
                            {item.materialNote ? <span className="price-tag-separate">별도</span> : "포함"}
                          </td>
                          <td className="price-table__qty" onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <div className="price-qty">
                                <button
                                  type="button"
                                  className="price-qty__btn"
                                  onClick={() => setQty(item.id, (selected[item.id] ?? 1) - 1)}
                                  aria-label="수량 감소"
                                >
                                  −
                                </button>
                                <span className="price-qty__val">{selected[item.id]}</span>
                                <button
                                  type="button"
                                  className="price-qty__btn"
                                  onClick={() => setQty(item.id, (selected[item.id] ?? 1) + 1)}
                                  aria-label="수량 증가"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="price-qty__placeholder">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            ))}
          </div>

          <aside className="price-calc" aria-label="모의 견적 계산기">
            <div className="price-calc__inner">
              <h2 className="price-calc__title">모의 견적 계산기</h2>
              <p className="price-calc__sub">표에서 항목을 선택하면 자동으로 계산됩니다.</p>

              {hasSelection ? (
                <>
                  <ul className="price-calc__list">
                    {selectedItems.map((item) => (
                      <li key={item.id} className="price-calc__item">
                        <span className="price-calc__item-name">
                          {item.name}
                          {selected[item.id] > 1 && <span className="price-calc__item-qty"> ×{selected[item.id]}</span>}
                        </span>
                        <span className="price-calc__item-price">{(item.price * selected[item.id]).toLocaleString()}원</span>
                      </li>
                    ))}
                  </ul>
                  <div className="price-calc__divider" />
                  <div className="price-calc__subtotal-row">
                    <span>인건비 소계</span>
                    <span>{total.toLocaleString()}원</span>
                  </div>
                  <div className="price-calc__subtotal-row">
                    <span>부가세 (10%)</span>
                    <span>{Math.round(total * 0.1).toLocaleString()}원</span>
                  </div>
                  <div className="price-calc__divider" />
                  <div className="price-calc__total-row">
                    <span>합계 (VAT 포함)</span>
                    <span className="price-calc__total">{Math.round(total * 1.1).toLocaleString()}원~</span>
                  </div>
                  <p className="price-calc__disclaimer">
                    제품·부속자재와 출장비는 별도이며, 실제 견적은 현장 확인 후 달라질 수 있습니다.
                  </p>
                </>
              ) : (
                <p className="price-calc__empty">아직 선택된 항목이 없습니다.<br />위 표에서 항목을 클릭해 보세요.</p>
              )}

              <div className="price-calc__actions">
                <a className="primary-button" href={business.phoneHref}>
                  <Phone size={18} />
                  전화 상담
                </a>
                <a
                  className="secondary-button"
                  href={buildEstimateHref({
                    works: selectedItems.map((item) => item.name),
                    workIds: selectedItems.map((item) => item.id),
                    sourceServicePath: servicePath,
                    sourcePricingPath: pricingPath
                  })}
                >
                  <ArrowUpRight size={18} />
                  견적 요청
                </a>
              </div>
            </div>
          </aside>
        </div>

        <section className="price-page__back-section section">
          <a className="secondary-button" href={backHref}>
            <ChevronLeft size={18} />
            {backLabel}
          </a>
        </section>
      </main>
      <SiteFooter />
      <MobileQuickCta />
    </>
  );
}

function WaterproofingPricePage() {
  return (
    <ServicePricePage
      kicker="방수 보수 서비스"
      title="방수 보수 가격표"
      description="항목을 선택하면 아래 모의 견적 계산기에 자동으로 반영됩니다."
      note="※ 제품·부속자재와 출장비는 별도이며, 실제 견적은 현장 상태에 따라 달라질 수 있습니다."
      servicePath="/service/waterproofing"
      pricingPath="/service/waterproofing/price"
      categories={waterproofingPriceCategories}
      backHref="/service/waterproofing"
      backLabel="방수 보수 서비스 보기"
    />
  );
}

function WaterproofingTilePricePage() {
  return (
    <ServicePricePage
      kicker="방수·타일 서비스"
      title="방수·타일 가격표"
      description="방수 보수와 타일 보수의 기준 금액을 한 페이지에서 확인하고, 필요한 항목을 골라 모의 견적을 계산해보세요."
      note="※ 제품·부속자재는 별도이며, 실제 견적은 현장 상태와 마감 범위에 따라 달라질 수 있습니다."
      servicePath="/service/waterproofing-tile"
      pricingPath="/service/waterproofing-tile/price"
      categories={waterproofingTilePriceCategories}
      backHref="/service/waterproofing-tile"
      backLabel="방수·타일 서비스 보기"
    />
  );
}

export default App;
