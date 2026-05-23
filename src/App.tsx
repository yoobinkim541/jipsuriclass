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
import { BusinessInfoList, OfficeSection } from "./components/OfficeSection";

const blogPortfolioService = new BlogPortfolioService("/api/naver-blog", pinnedPosts);
const siteContentService = new SiteContentService();

function App() {
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
  if (window.location.pathname.startsWith("/estimate")) {
    return <EstimatePage />;
  }

  return <HomePage />;
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
          <img className="brand-mark" src="/icons/icon.svg" alt="" aria-hidden="true" />
          <span>{business.name}</span>
        </a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {menuItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="header-login-link" href="/login">
          로그인
        </a>
        <a className="header-call" href={business.phoneHref}>
          <Phone size={18} />
          {business.phone}
        </a>
        <button className="menu-button" onClick={onOpenMenu} aria-label="메뉴 열기">
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
  const symptomRoutes: Record<string, string> = {
    "물이 샌다": "누수/배관",
    "벽지가 들뜬다": "도배/바닥",
    "타일이 깨졌다": "욕실",
    "문이 안 닫힌다": "문/목공",
    "곰팡이가 생겼다": "방수",
    "수전·배수가 불편하다": "주방"
  };

  return (
    <section className="symptoms section" aria-labelledby="symptoms-title">
      <SectionHeading
        id="symptoms-title"
        title="고객이 말하는 증상부터 확인합니다"
        description="전문 용어를 몰라도 괜찮습니다. 지금 보이는 문제를 기준으로 상담을 시작합니다."
      />
      <div className="symptom-grid">
        {symptoms.map((item) => (
          <a
            href={`/estimate?project=${encodeURIComponent(symptomRoutes[item] ?? "")}&issue=${encodeURIComponent(item)}`}
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
            <img className="blog-card-image" src={post.image} alt={post.title} />
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
          <a className="secondary-button" href="/estimate">
            <ArrowUpRight size={20} />
            견적상담 페이지
          </a>
        </div>
        <BusinessInfoList />
      </div>
      <div className="contact-estimate-card">
        <span className="admin-kicker">
          <ArrowUpRight size={16} />
          견적상담
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
