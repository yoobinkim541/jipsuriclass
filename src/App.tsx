import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  Menu,
  MessageCircle,
  Phone,
  Send,
  X
} from "lucide-react";
import { business, cases, navItems, pinnedPosts, process, services, symptoms } from "./data";
import { BlogPortfolioService } from "./services/BlogPortfolioService";
import type { PortfolioPost } from "./types";

const blogPortfolioService = new BlogPortfolioService("/api/naver-blog", pinnedPosts);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [blogPosts, setBlogPosts] = useState<PortfolioPost[]>(pinnedPosts);
  const [blogSource, setBlogSource] = useState<"loading" | "naver" | "fallback">("loading");
  const [estimateSubmitted, setEstimateSubmitted] = useState(false);

  useEffect(() => {
    blogPortfolioService.loadPortfolioPosts().then(({ posts, source }) => {
      setBlogPosts(posts);
      setBlogSource(source);
    });
  }, []);

  function handleEstimateSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEstimateSubmitted(true);
    window.setTimeout(() => setEstimateSubmitted(false), 3600);
  }

  return (
    <>
      <SiteHeader menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} onCloseMenu={() => setMenuOpen(false)} />
      <main id="top">
        <HeroSection />
        <SymptomsSection />
        <ServicesSection />
        <CasesSection />
        <BlogSection posts={blogPosts} source={blogSource} />
        <ProcessSection />
        <ContactSection submitted={estimateSubmitted} onSubmit={handleEstimateSubmit} />
      </main>
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
  onOpenMenu,
  onCloseMenu
}: {
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
}) {
  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="집수리 클라쓰 홈">
          <span className="brand-mark">집</span>
          <span>{business.name}</span>
        </a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
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
          {navItems.map((item) => (
            <a href={item.href} key={item.href} onClick={onCloseMenu}>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * 첫 화면 전환 영역
 * 브랜드 포지션, 즉시 상담 CTA, 신뢰 포인트를 한 화면에 배치합니다.
 */
function HeroSection() {
  return (
    <section className="hero section">
      <div className="hero-copy">
        <h1>누수부터 부분수리까지, 집 문제를 정확히 고칩니다</h1>
        <p>
          사진 상담으로 증상을 먼저 확인하고, 필요한 작업만 설명합니다. 생활 집수리, 누수 복구,
          원상복구까지 현장 중심으로 처리합니다.
        </p>
        <CtaButtons />
        <ProofList />
      </div>
      <div className="hero-media" aria-label="집수리 현장 이미지">
        <img
          src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1100&q=80"
          alt="공구를 사용해 집수리 현장을 점검하는 모습"
        />
        <div className="media-note">
          <CheckCircle2 size={18} />
          현장 사진 확인 후 작업 범위를 안내합니다
        </div>
      </div>
    </section>
  );
}

function CtaButtons() {
  return (
    <div className="hero-actions">
      <a className="primary-button" href={business.phoneHref}>
        <Phone size={20} />
        전화 상담
      </a>
      <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
        <MessageCircle size={20} />
        카카오톡 상담
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

/** 증상 기반 진입 영역: 고객이 전문 공종명을 몰라도 문의할 수 있게 돕습니다. */
function SymptomsSection() {
  return (
    <section className="symptoms section" aria-labelledby="symptoms-title">
      <SectionHeading
        id="symptoms-title"
        title="고객이 말하는 증상부터 확인합니다"
        description="전문 용어를 몰라도 괜찮습니다. 지금 보이는 문제를 기준으로 상담을 시작합니다."
      />
      <div className="symptom-grid">
        {symptoms.map((item) => (
          <a href="#contact" key={item}>
            {item}
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
    </section>
  );
}

/** 서비스 카드 영역: 새 공종 추가 시 data.ts의 services 배열만 수정하면 됩니다. */
function ServicesSection() {
  return (
    <section className="services section" id="services" aria-labelledby="services-title">
      <SectionHeading
        id="services-title"
        title="생활 집수리 서비스"
        description="큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다."
      />
      <div className="service-grid">
        {services.map((service) => (
          <article className="service-card" key={service.title}>
            <service.icon size={26} />
            <h3>{service.title}</h3>
            <p>{service.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 수동 대표 사례 영역: 실제 사진이 들어오면 data.ts의 cases.image만 교체합니다. */
function CasesSection() {
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
        {cases.map((item) => (
          <article className="case-card" key={item.title}>
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
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 네이버 블로그 자동 연동 영역: API 실패 시 pinnedPosts가 표시됩니다. */
function BlogSection({ posts, source }: { posts: PortfolioPost[]; source: "loading" | "naver" | "fallback" }) {
  const description =
    source === "naver"
      ? "네이버 블로그 최신 현장 글을 자동으로 가져왔습니다."
      : "API 키가 없거나 연결되지 않으면 대표글을 대신 보여줍니다.";

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
      <div className="blog-list">
        {posts.map((post) => (
          <a className="blog-row" href={post.link} target="_blank" rel="noreferrer" key={post.title}>
            <span className="naver-mark">N</span>
            <div>
              <time>{post.date}</time>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </div>
            <ExternalLink size={18} />
          </a>
        ))}
      </div>
    </section>
  );
}

/** 작업 절차 영역: 상담에서 시공 확인까지의 기대 흐름을 고정합니다. */
function ProcessSection() {
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
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 문의 영역: 지금은 데모 제출 상태이며, 추후 API 또는 폼 서비스 연결 지점입니다. */
function ContactSection({ submitted, onSubmit }: { submitted: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return (
    <section className="contact section" id="contact" aria-labelledby="contact-title">
      <div className="contact-copy">
        <h2 id="contact-title">사진을 보내주시면 작업 가능 여부부터 확인합니다</h2>
        <p>
          급한 누수, 부분 파손, 퇴거 전 복구처럼 상황이 명확할수록 상담이 빠릅니다. 모바일에서는
          하단 버튼으로 바로 연락할 수 있습니다.
        </p>
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
        <BusinessInfoList />
      </div>
      <EstimateForm submitted={submitted} onSubmit={onSubmit} />
    </section>
  );
}

function BusinessInfoList() {
  return (
    <ul className="business-list">
      <li>영업지역: {business.area}</li>
      <li>상담시간: {business.hours}</li>
      <li>{business.registrationNumber}</li>
      <li>{business.owner}</li>
      <li>{business.address}</li>
    </ul>
  );
}

function EstimateForm({
  submitted,
  onSubmit
}: {
  submitted: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="estimate-form" onSubmit={onSubmit}>
      <label>
        이름
        <input required name="name" placeholder="홍길동" />
      </label>
      <label>
        연락처
        <input required name="phone" placeholder="010-0000-0000" inputMode="tel" />
      </label>
      <label>
        지역
        <input name="area" placeholder="예: 서울 강동구" />
      </label>
      <label>
        문의 내용
        <textarea required name="message" rows={5} placeholder="증상, 건물 유형, 사진 보유 여부를 적어주세요." />
      </label>
      <button type="submit">
        <Send size={19} />
        간단 견적 문의
      </button>
      {submitted && <p className="form-success">문의 내용이 확인되었습니다. 실제 전송 API 연결 전 데모 상태입니다.</p>}
    </form>
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
      <p>개인정보는 상담 목적 외 사용하지 않으며, 실제 운영 시 개인정보처리방침 페이지를 연결합니다.</p>
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
