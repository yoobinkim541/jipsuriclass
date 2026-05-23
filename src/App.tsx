import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  MessageCircle,
  Phone,
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
    title: `${siteName} | 서울·경기 집수리·누수·부분수리`,
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

  const heroSlides = useMemo(
    () => [
      {
        image: homeContent.hero.image,
        position: homeContent.hero.imagePosition,
        scale: homeContent.hero.imageScale
      },
      ...homeContent.hero.slides
    ],
    [homeContent.hero]
  );

  return (
    <>
      <SiteHeader
        menuOpen={menuOpen}
        navLabels={homeContent.navLabels}
        onOpenMenu={() => setMenuOpen(true)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <main id="top">
        <HeroSection content={homeContent.hero} slides={heroSlides} />
        <AboutSection content={homeContent.about} />
        <SymptomsSection symptoms={homeContent.symptoms} />
        <ServicesSection services={homeContent.services} />
        <SpecialtiesSection />
        <SearchLandingSection />
        <CasesSection cases={homeContent.cases} />
        <BlogSection posts={blogSource === "naver" ? blogPosts : homeContent.blog} source={blogSource} />
        <ProcessSection steps={homeContent.process} />
        <ContactSection content={homeContent.contact} />
        <OfficeSection />
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
  const menuItems = navItems.map((item, index) => ({
    ...item,
    label: navLabels[index] ?? item.label
  }));

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="집수리클라쓰 홈">
          <img className="brand-mark" src="/icons/icon.png" alt="" aria-hidden="true" />
          <span>{business.name}</span>
        </a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {menuItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-call" href={business.phoneHref}>
          <Phone size={18} />
          {business.phone}
        </a>
        <button className="menu-button" onClick={onOpenMenu} aria-label="사이드바 열기">
          <Menu size={24} />
        </button>
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
 * 브랜드 포지션, 즉시 상담 CTA, 신뢰 포인트를 한 화면에 배치합니다.
 */
function HeroSection({
  content,
  slides
}: {
  content: HomepageContent["hero"];
  slides: HomepageContent["hero"]["slides"];
}) {
  const heroSlides = useMemo(() => slides.filter((slide) => slide.image).slice(0, 3), [slides]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (heroSlides.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <section className="hero hero-fullbleed">
      <div className="hero-carousel" aria-hidden="true">
        {heroSlides.map((slide, index) => (
          <img
            key={slide.image}
            className={index === activeSlide ? "hero-background hero-slide active" : "hero-background hero-slide"}
            src={slide.image}
            style={{ objectPosition: slide.position, transform: `scale(${slide.scale})` }}
            alt=""
          />
        ))}
      </div>
      <div className="hero-overlay" />
      <div className="hero-copy">
        <span className="hero-kicker">{content.mediaNote}</span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <CtaButtons content={content} />
        <ProofList />
      </div>
      {heroSlides.length > 1 ? (
        <div className="hero-carousel-controls" aria-label="히어로 이미지 전환">
          <button type="button" onClick={() => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}>
            <ChevronLeft size={18} />
          </button>
          <div className="hero-carousel-dots">
            {heroSlides.map((slide, index) => (
              <button
                key={`${slide.image}-${index}`}
                type="button"
                className={index === activeSlide ? "hero-dot active" : "hero-dot"}
                onClick={() => setActiveSlide(index)}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}>
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CtaButtons({ content }: { content: HomepageContent["hero"] }) {
  return (
    <div className="hero-actions">
      <a className="primary-button" href={business.phoneHref}>
        <Phone size={20} />
        {content.primaryActionLabel}
      </a>
      <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={20} />
        {content.secondaryActionLabel}
      </a>
      <a className="secondary-button" href="/estimate">
        <ArrowUpRight size={20} />
        {content.tertiaryActionLabel}
      </a>
    </div>
  );
}

function ProofList() {
  const proofs = useMemo(
    () => [
      ["상담 방식", "사진 기반 사전 확인"],
      ["작업 범위", "부분수리부터 복구까지"],
      ["현장 기록", "네이버 블로그 사례 연동"]
    ],
    []
  );

  return (
    <dl className="proof-list">
      {proofs.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function AboutSection({
  content
}: {
  content: { eyebrow: string; title: string; description: string; strengths: string[] };
}) {
  return (
    <section className="about section" id="about" aria-labelledby="about-title">
      <div className="about-copy">
        <span>{content.eyebrow}</span>
        <h2 id="about-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <ul className="about-strengths">
        {content.strengths.map((item) => (
          <li key={item}>
            <CheckCircle2 size={20} />
            {item}
          </li>
        ))}
      </ul>
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

/** 서비스 카드 영역: 새 공종 추가 시 data.ts의 services 배열만 수정하면 됩니다. */
function ServicesSection({
  services: editableServices
}: {
  services: { title: string; text: string }[];
}) {
  return (
    <section className="services section" id="services" aria-labelledby="services-title">
      <SectionHeading
        id="services-title"
        title="생활 집수리 서비스"
        description="큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다."
      />
      <div className="service-grid">
        {services.map((service, index) => {
          const item = editableServices[index] ?? { title: service.title, text: service.text };
          return (
            <article className="service-card" key={item.title}>
              <service.icon size={26} />
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
  return (
    <section className="specialties section" id="specialties" aria-labelledby="specialties-title">
      <SectionHeading
        id="specialties-title"
        title="가능 작업"
        description="집 안팎에서 필요한 수리, 설비, 마감, 리모델링 작업을 폭넓게 상담합니다."
      />
      <div className="specialty-list">
        {business.specialties.map((item) => (
          <a href="#contact" key={item}>
            {item}
          </a>
        ))}
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
        title="검색용 페이지"
        description="누수, 욕실수리, 도배, 문수리와 지역 검색어를 따로 볼 수 있게 나눴습니다."
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

/** 수동 대표 사례 영역: 실제 사진이 들어오면 data.ts의 cases.image만 교체합니다. */
function CasesSection({
  cases: editableCases
}: {
  cases: { title: string; area: string; problem: string; solution: string; image: string; link: string }[];
}) {
  return (
    <section className="cases section" id="cases" aria-labelledby="cases-title">
      <RowHeading
        id="cases-title"
        title="대표 현장사례"
        description="실제 사진이 준비되면 이 영역에 바로 교체할 수 있습니다."
        linkLabel="전체 사례 보기"
        href={business.naverBlogUrl}
      />
      <div className="case-grid">
        {editableCases.map((item) => (
          <a className="case-card case-link" href={item.link} target="_blank" rel="noreferrer" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <span>{item.area}</span>
              <h3>{item.title}</h3>
              <p>
                <strong>문제</strong> {item.problem}
              </p>
              <p>
                <strong>해결</strong> {item.solution}
              </p>
              <span className="case-card-link">
                블로그 보기 <ExternalLink size={16} />
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

/** 네이버 블로그 자동 연동 영역: API 실패 시 관리자 지정 포스트가 표시됩니다. */
function BlogSection({
  posts,
  source
}: {
  posts: PortfolioPost[];
  source: "loading" | "naver" | "fallback";
}) {
  const description =
    source === "naver"
      ? "네이버 블로그 최신 현장 글을 자동으로 가져와 사진 카드로 보여줍니다."
      : "API 키가 없거나 연결되지 않으면 관리자 지정 포트폴리오 카드로 대신 보여줍니다.";

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
      <div className="blog-card-grid">
        {posts.map((post, index) => (
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

/** 작업 절차 영역: 상담에서 시공 확인까지의 기대 흐름을 고정합니다. */
function ProcessSection({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <section className="process section" id="process" aria-labelledby="process-title">
      <SectionHeading
        id="process-title"
        title="작업 절차"
        description="불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다."
      />
      <div className="process-line">
        {process.map((step, index) => (
          <article key={step.title}>
            <span>{index + 1}</span>
            <step.icon size={24} />
            <h3>{steps[index]?.title ?? step.title}</h3>
            <p>{steps[index]?.text ?? step.text}</p>
          </article>
        ))}
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
            title={`${content.searchTerms[0]} 최신 블로그 레퍼런스`}
            description={
              landingSource === "naver"
                ? `네이버에서 ${content.searchTerms.join(", ")} 키워드가 들어간 최신 게시물을 추려서 보여줍니다.`
                : "연결이 없을 때는 관리자 지정 포트폴리오를 대신 보여줍니다."
            }
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
            description="검색에서 자주 들어오는 질문을 짧고 분명하게 정리합니다."
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
            title="연결된 페이지"
            description="서비스와 지역 페이지를 서로 연결해 검색 신호를 이어줍니다."
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
  return (
    <div className="landing-blog-showcase">
      <h3>{label}</h3>
      {posts.length ? (
        <div className="blog-card-grid landing-blog-grid">
          {posts.map((post, index) => (
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

export default App;
