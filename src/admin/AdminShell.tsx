import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  Layout,
  LogOut,
  MessageSquare,
  Search,
} from "lucide-react";
import { business } from "../data";
import "../admin-panel.css";

type AdminShellProps = {
  pageMeta: {
    kicker: string;
    title: string;
    description: string;
  };
  actions: ReactNode;
  searchQuery: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  sessionEmail: string | null;
  sessionLoading: boolean;
  onSignOut: () => void | Promise<void>;
  sidebarBadges?: Partial<Record<"inquiries" | "analytics" | "editor", string | number>>;
  children: ReactNode;
};

export function AdminShell({
  pageMeta,
  actions,
  searchQuery,
  searchPlaceholder,
  onSearchChange,
  sessionEmail,
  sessionLoading,
  onSignOut,
  sidebarBadges,
  children,
}: AdminShellProps) {
  const pathname = window.location.pathname;

  const navGroups = [
    {
      label: "대시보드",
      items: [
        { label: "상담 요청", href: "/admin/inquiries", icon: MessageSquare, active: pathname.startsWith("/admin/inquiries"), badge: sidebarBadges?.inquiries },
        { label: "유입·분석",  href: "/admin/analytics", icon: BarChart3,     active: pathname.startsWith("/admin/analytics"), badge: sidebarBadges?.analytics },
      ],
    },
    {
      label: "콘텐츠",
      items: [
        { label: "페이지 편집", href: "/admin/editor", icon: Layout, active: pathname.startsWith("/admin/editor"), badge: sidebarBadges?.editor },
      ],
    },
    {
      label: "사이트",
      items: [
        { label: "사이트 보기", href: "/", icon: ExternalLink, active: false, badge: undefined },
      ],
    },
  ] as const;

  return (
    <div className="admin-page-root">
      {/* 상단 띠 */}
      <header className="admin-top">
        <a className="admin-brand" href="/">
          <img className="admin-brand__mark" src="/icons/brand-icon.png" alt="" aria-hidden="true" />
          <span className="admin-brand__name">
            집수리<em>클라쓰</em>
          </span>
          <span className="admin-top__pill">관리자</span>
        </a>

        <div className="admin-top__center">
          <label className="admin-top__search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <kbd>⌘K</kbd>
          </label>
        </div>

        <div className="admin-top__right">
          <button className="admin-top__btn" type="button" aria-label="알림">
            <Bell size={16} />
            <span className="admin-top__dot" />
          </button>
          <a className="admin-top__btn" href="/" target="_blank" rel="noreferrer" aria-label="사이트 새 창 열기">
            <ExternalLink size={16} />
          </a>
          {sessionLoading ? (
            <span className="admin-top__user">
              <span className="admin-top__user-avatar">···</span>
              <span className="admin-top__user-meta">
                <strong>확인 중</strong>
                <em>관리자 상태</em>
              </span>
            </span>
          ) : sessionEmail ? (
            <button className="admin-top__user" type="button" onClick={() => void onSignOut()} aria-label="로그아웃">
              <span className="admin-top__user-avatar">{business.owner.slice(-1)}</span>
              <span className="admin-top__user-meta">
                <strong>{business.owner}</strong>
                <em>대표 · 관리자</em>
              </span>
              <LogOut size={14} />
            </button>
          ) : (
            <a className="admin-top__user" href="/admin/login">
              <span className="admin-top__user-avatar">{business.owner.slice(-1)}</span>
              <span className="admin-top__user-meta">
                <strong>로그인 필요</strong>
                <em>관리자 입장</em>
              </span>
              <ChevronDown size={14} />
            </a>
          )}
        </div>
      </header>

      {/* 셸 그리드 */}
      <div className="admin-shell-grid">
        {/* 사이드바 */}
        <aside className="admin-side" aria-label="관리자 내비게이션">
          <nav className="admin-nav">
            {navGroups.map((group) => (
              <div key={group.label}>
                <span className="admin-nav__group">{group.label}</span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      className={item.active ? "admin-nav__item is-active" : "admin-nav__item"}
                      href={item.href}
                      {...(item.href === "/" ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      <Icon size={16} />
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="admin-nav__count">{item.badge}</span>
                      )}
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="admin-side__foot">
            <div className="admin-side__pulse">
              <span className="admin-side__pulse-dot" />
              <span>모든 시스템 정상</span>
            </div>
            <span>build · {new Date().toISOString().slice(0, 10)}</span>
          </div>
        </aside>

        {/* 메인 */}
        <main className="admin-main">
          <header className="admin-tab__head">
            <div>
              <span className="admin-tab__kicker">{pageMeta.kicker}</span>
              <h1>{pageMeta.title}</h1>
              <p>{pageMeta.description}</p>
            </div>
            <div className="admin-tab__actions">{actions}</div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
