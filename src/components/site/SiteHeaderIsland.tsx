import { useEffect, useState } from "react";
import { Calculator, Menu, User, X } from "lucide-react";
import { business, navItems } from "../../data";

/**
 * SiteHeaderIsland — App.tsx의 SiteHeader를 자립형 아일랜드로 옮긴 버전.
 * 차이점: menuOpen 상태를 내부에서 관리하고, SSR(빌드) 시 window가 없어도
 * 안전하도록 모든 window 접근을 가드한다. Astro에서 client:idle로 수화한다.
 */
export function SiteHeaderIsland({ brandHref = "/" }: { brandHref?: string }) {
  const menuItems = navItems;
  // Start non-home (the SSR value, since window is absent at build) so the first
  // client render matches the server HTML; the real value is set in an effect
  // after mount to avoid a hydration mismatch when this island is reused on "/".
  const [isHome, setIsHome] = useState(false);
  const resolveHref = (href: string) => (href.startsWith("#") && !isHome ? `/${href}` : href);

  const resolveActiveHref = () => {
    if (typeof window === "undefined") return "";
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState("");

  useEffect(() => {
    setIsHome(typeof window !== "undefined" && window.location.pathname === "/");
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);

  useEffect(() => {
    setActiveHref(resolveActiveHref());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="nav" data-elevated={menuOpen || scrolled ? "true" : "false"}>
        <div className="nav__progress">
          <span className="nav__progress-bar" style={{ width: `${scrollPct}%` }} />
        </div>
        <div className="nav__inner">
          <a className="brand" href={brandHref} aria-label="집수리클라쓰 홈">
            <img className="brand__mark" src="/icons/icon.png" alt="" aria-hidden="true" />
            <span className="brand__name">
              집수리<em>클라쓰</em>
            </span>
          </a>
          <nav className="nav__links" aria-label="주요 메뉴">
            {menuItems.map((item) => (
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
            <button
              className="nav__menu"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "사이드바 닫기" : "사이드바 열기"}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={closeMenu} aria-hidden="true" />
          <div className="mobile-menu">
            <button onClick={closeMenu} aria-label="메뉴 닫기">
              <X size={24} />
            </button>
            {menuItems.map((item) => (
              <a
                href={resolveHref(item.href)}
                key={item.href}
                onClick={closeMenu}
                data-active={activeHref === item.href ? "true" : undefined}
                aria-current={activeHref === item.href ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
            <a href="/calculator" onClick={closeMenu} className="mobile-menu__calc">
              <Calculator size={16} />
              전체 서비스 모의계산
            </a>
            <a href="/login" onClick={closeMenu}>
              마이페이지
            </a>
          </div>
        </>
      )}
    </>
  );
}
