import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  ExternalLink,
  FileText,
  Hammer,
  History,
  Home,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquare,
  Monitor,
  Rss,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Tablet,
  UserRound,
  X
} from "lucide-react";
import "./admin.css";
import { business } from "../data";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { landingPageDefinitions } from "../landingPages";
import { AuthService } from "../services/AuthService";
import { AdminService } from "../services/AdminService";
import type { InquiryIntake, InquiryRow, InquiryStatus } from "../types";
import { InquiriesTab, buildDisplay, inquiryStatusLabels } from "./InquiriesTab";
import {
  AnalyticsTab,
  AuditTab,
  BlogTab,
  ContentTab,
  RegionsTab,
  SettingsTab,
  WorksTab
} from "./DashboardPanels";
import type { EditorPage } from "./SiteContentEditor";

const authService = new AuthService();
const adminService = new AdminService();

type AdminTab = "inquiries" | "analytics" | "regions" | "works" | "content" | "blog" | "settings" | "audit";

const tabs: Array<{ key: AdminTab; label: string; icon: typeof Home; group: string }> = [
  { key: "inquiries", label: "상담 요청", icon: MessageSquare, group: "대시보드" },
  { key: "analytics", label: "유입·분석", icon: BarChart3, group: "대시보드" },
  { key: "regions", label: "지역 페이지", icon: MapPin, group: "콘텐츠" },
  { key: "works", label: "작업 페이지", icon: Hammer, group: "콘텐츠" },
  { key: "content", label: "핵심 페이지", icon: LayoutGrid, group: "콘텐츠" },
  { key: "blog", label: "블로그 연동", icon: Rss, group: "콘텐츠" },
  { key: "settings", label: "사이트 설정", icon: Settings, group: "사이트" },
  { key: "audit", label: "편집 이력", icon: History, group: "사이트" }
];

function readTabFromHash(): AdminTab {
  const hash = window.location.hash.replace("#", "");
  return (tabs.some((tab) => tab.key === hash) ? hash : "inquiries") as AdminTab;
}

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>(readTabFromHash);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [contentEditorPage, setContentEditorPage] = useState<EditorPage | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ path: string; label: string } | null>(null);
  const toastTimer = useRef<number | null>(null);

  /* 구 경로(/admin/inquiries)는 해시 탭으로 흡수 */
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin/inquiries")) {
      window.history.replaceState(null, "", "/admin#inquiries");
    }
  }, []);

  /* 해시 ↔ 탭 동기화 */
  useEffect(() => {
    const apply = () => setTab(readTabFromHash());
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  function gotoTab(next: AdminTab) {
    window.location.hash = next;
    setTab(next);
  }

  // 비로그인 방문자는 세션 확인이 끝나면 로그인 페이지로 보낸다(Supabase 설정 시에만).
  // 로그인 페이지(AdminLoginPage)는 이 컴포넌트를 쓰지 않아 리다이렉트 루프가 없다.
  useEffect(() => {
    if (sessionLoading || sessionEmail || !isSupabaseConfigured) return;
    window.location.replace("/admin/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, sessionEmail]);

  /* 세션 + 문의 로드 */
  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
        if (!mounted) return;
        setSessionEmail(session?.user.email ?? null);
        setSessionName(socialName(session));
        setSessionLoading(false);
        if (session?.user) void loadInquiries();
      })
      .catch((sessionError) => {
        if (!mounted) return;
        setAuthError(sessionError instanceof Error ? sessionError.message : "세션을 불러오지 못했습니다.");
        setSessionLoading(false);
      });

    const { data } =
      supabase?.auth.onAuthStateChange((event, session) => {
        setSessionEmail(session?.user.email ?? null);
        setSessionName(socialName(session));
        setSessionLoading(false);
        // 초기 로드는 위의 getSession()이 담당한다. INITIAL_SESSION에서 또 부르면
        // 마운트 시 문의를 두 번 가져오므로 실제 인증 전환에서만 다시 로드한다.
        if (event === "INITIAL_SESSION") return;
        if (session?.user) {
          void loadInquiries();
        } else {
          setInquiries([]);
          setDetailId(null);
        }
      }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function loadInquiries() {
    setInquiriesLoading(true);
    setError(null);
    try {
      const rows = await adminService.listInquiries();
      setInquiries(rows);
      setAuthError(null);
      setDetailId((current) => (current && rows.some((item) => item.id === current) ? current : null));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "문의 목록을 불러오지 못했습니다.";
      setError(message);
      if (message.toLowerCase().includes("permission denied")) {
        setAuthError("관리자 이메일을 allowlist에 추가해야 문의 목록을 볼 수 있습니다.");
      }
    } finally {
      setInquiriesLoading(false);
    }
  }

  async function handleSignOut() {
    await authService.signOut();
    window.location.href = "/admin/login";
  }

  function toast(message: string) {
    setToastMessage(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMessage(null), 2400);
  }

  async function handleStatusMemoSave(id: string, status: InquiryStatus, memo: string) {
    const target = inquiries.find((item) => item.id === id);
    if (!target) return;
    try {
      if (target.status !== status) {
        await adminService.updateInquiryStatus(id, status);
      }
      const trimmedMemo = memo.trim();
      const currentMemo = target.intake?.adminMemo ?? "";
      let nextIntake = target.intake;
      if (trimmedMemo !== currentMemo.trim()) {
        nextIntake = { ...(target.intake ?? {}), adminMemo: trimmedMemo };
        await adminService.updateInquiryIntake(id, nextIntake);
      }
      setInquiries((current) =>
        current.map((item) => (item.id === id ? { ...item, status, intake: nextIntake ?? item.intake } : item))
      );
    } catch (saveError) {
      toast(saveError instanceof Error ? saveError.message : "변경 사항을 저장하지 못했습니다.");
      throw saveError;
    }
  }

  async function handleQuoteIntakeSave(id: string, intake: InquiryIntake) {
    await adminService.updateInquiryIntake(id, intake);
    const target = inquiries.find((item) => item.id === id);
    // 견적이 확정 발행되면 상태를 자동으로 '견적완료'로 올린다 (이미 시공중/완료면 유지).
    // 상태 승격은 best-effort: 실패해도 이미 저장된 견적은 화면에 반영하고 상태만 기존값으로 둔다.
    const currentStatus: InquiryStatus = target?.status ?? "new";
    let nextStatus: InquiryStatus = currentStatus;
    if (intake.quoteSnapshot?.confirmedAt && (currentStatus === "new" || currentStatus === "contacted")) {
      try {
        await adminService.updateInquiryStatus(id, "quoted");
        nextStatus = "quoted";
      } catch {
        // 상태 승격 실패 — 견적(intake)은 이미 저장됨, 상태는 그대로 유지
      }
    }
    setInquiries((current) => current.map((item) => (item.id === id ? { ...item, intake, status: nextStatus } : item)));
  }

  const newInquiries = useMemo(() => inquiries.filter((item) => item.status === "new"), [inquiries]);
  const regionCount = useMemo(() => landingPageDefinitions.filter((page) => page.categoryLabel === "지역").length, []);
  const workCount = useMemo(() => landingPageDefinitions.filter((page) => page.categoryLabel === "서비스").length, []);

  function openInquiryDetail(id: string) {
    gotoTab("inquiries");
    setDetailId(id);
  }

  const isAuthenticated = Boolean(sessionEmail);

  return (
    <div className="adm-root">
      <header className="adm-top">
        <a className="adm-brand" href="/">
          <img src="/icons/icon.png" alt="" aria-hidden="true" />
          <span>
            집수리<em>클라쓰</em>
          </span>
          <span className="adm-top__pill">관리자</span>
        </a>
        <div className="adm-top__center">
          <CommandPalette
            inquiries={inquiries}
            onOpenInquiry={openInquiryDetail}
            onGotoTab={gotoTab}
            onPreview={(path, label) => setPreview({ path, label })}
          />
        </div>
        <div className="adm-top__right">
          <NotificationBell newInquiries={newInquiries} onOpenInquiry={openInquiryDetail} />
          <a className="adm-top__btn" href="/" target="_blank" rel="noreferrer" title="새 창으로 사이트 보기">
            <ExternalLink />
          </a>
          <UserMenu email={sessionEmail} name={sessionName} onSignOut={() => void handleSignOut()} />
        </div>
      </header>

      <div className="adm-mtabs" role="tablist" aria-label="관리자 메뉴">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={tab === item.key ? "is-active" : ""}
            onClick={() => gotoTab(item.key)}
          >
            {item.label}
            {item.key === "inquiries" && newInquiries.length ? ` ${newInquiries.length}` : ""}
          </button>
        ))}
      </div>

      <div className="adm-shell">
        <aside className="adm-side">
          <nav className="adm-nav">
            {["대시보드", "콘텐츠", "사이트"].map((group) => (
              <div key={group} style={{ display: "contents" }}>
                <span className="adm-nav__group">{group}</span>
                {tabs
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = item.icon;
                    const count =
                      item.key === "inquiries"
                        ? newInquiries.length
                        : item.key === "regions"
                          ? regionCount
                          : item.key === "works"
                            ? workCount
                            : null;
                    return (
                      <a
                        key={item.key}
                        className={`adm-nav__item${tab === item.key ? " is-active" : ""}`}
                        href={`#${item.key}`}
                        onClick={() => setTab(item.key)}
                      >
                        <Icon />
                        {item.label}
                        {count !== null ? <span className="adm-nav__count">{count}</span> : null}
                      </a>
                    );
                  })}
              </div>
            ))}
          </nav>
          <div className="adm-side__foot">
            <div className="adm-side__pulse">
              <span className="adm-dot" />
              <span>모든 시스템 정상</span>
            </div>
            <span>jipsuriclass.kr · admin</span>
          </div>
        </aside>

        <main className="adm-main">
          {sessionLoading ? (
            <div className="adm-gate">
              <div className="adm-gate__card">
                <LoaderCircle className="spin" />
                <strong>세션 확인 중</strong>
                <p>관리자 로그인 상태를 확인하고 있습니다.</p>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div className="adm-gate">
              <div className="adm-gate__card">
                <ShieldCheck />
                <strong>관리자 로그인이 필요합니다</strong>
                <p>관리자 이메일과 비밀번호, 또는 Google 계정으로 로그인하세요.</p>
                {authError ? <span className="adm-gate__error">{authError}</span> : null}
                <a className="adm-btn adm-btn--primary adm-btn--lg" href="/admin/login">
                  관리자 로그인
                </a>
              </div>
            </div>
          ) : authError ? (
            <div className="adm-gate">
              <div className="adm-gate__card">
                <ShieldCheck />
                <strong>접근 권한이 없습니다</strong>
                <span className="adm-gate__error">{authError}</span>
                <p>{sessionEmail} 계정은 관리자 allowlist(admin_users)에 없습니다.</p>
                <button className="adm-btn adm-btn--ghost" type="button" onClick={() => void handleSignOut()}>
                  다른 계정으로 로그인
                </button>
              </div>
            </div>
          ) : (
            <>
              {tab === "inquiries" ? (
                <InquiriesTab
                  inquiries={inquiries}
                  loading={inquiriesLoading}
                  error={error && !authError ? error : null}
                  detailId={detailId}
                  onOpenDetail={setDetailId}
                  onRefresh={loadInquiries}
                  onStatusMemoSave={handleStatusMemoSave}
                  onQuoteIntakeSave={handleQuoteIntakeSave}
                  toast={toast}
                />
              ) : null}
              {tab === "analytics" ? <AnalyticsTab inquiries={inquiries} /> : null}
              {tab === "regions" ? (
                <RegionsTab
                  onPreview={(path, label) => setPreview({ path, label })}
                  onEdit={() => {
                    setContentEditorPage("landing");
                    gotoTab("content");
                  }}
                />
              ) : null}
              {tab === "works" ? (
                <WorksTab
                  onPreview={(path, label) => setPreview({ path, label })}
                  onEdit={() => {
                    setContentEditorPage("landing");
                    gotoTab("content");
                  }}
                />
              ) : null}
              {tab === "content" ? (
                <ContentTab
                  isAuthenticated={isAuthenticated}
                  editorPage={contentEditorPage}
                  onEditorPageChange={setContentEditorPage}
                  onPreview={(path, label) => setPreview({ path, label })}
                />
              ) : null}
              {tab === "blog" ? <BlogTab toast={toast} /> : null}
              {tab === "settings" ? <SettingsTab toast={toast} /> : null}
              {tab === "audit" ? <AuditTab /> : null}
            </>
          )}
        </main>
      </div>

      {preview ? <PreviewModal path={preview.path} label={preview.label} onClose={() => setPreview(null)} /> : null}
      {toastMessage ? (
        <div className="adm-toast" role="status">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}

/* ──────────── ⌘K 커맨드 팔레트 ──────────── */

function CommandPalette({
  inquiries,
  onOpenInquiry,
  onGotoTab,
  onPreview
}: {
  inquiries: InquiryRow[];
  onOpenInquiry: (id: string) => void;
  onGotoTab: (tab: AdminTab) => void;
  onPreview: (path: string, label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLLabelElement | null>(null);

  const index = useMemo(() => {
    const entries: Array<{ type: string; label: string; sub?: string; icon: typeof Home; run: () => void }> = [];
    tabs.forEach((item) => {
      entries.push({ type: "탭", label: item.label, icon: item.icon, run: () => onGotoTab(item.key) });
    });
    inquiries.forEach((item) => {
      const display = buildDisplay(item);
      entries.push({
        type: "상담",
        label: `${item.name} · ${display.workType}`,
        sub: `${display.region} · ${inquiryStatusLabels[item.status] ?? item.status}`,
        icon: UserRound,
        run: () => onOpenInquiry(item.id)
      });
    });
    landingPageDefinitions.forEach((page) => {
      const label = page.areaLabel || page.title.split("|")[0].trim();
      entries.push({
        type: page.categoryLabel,
        label,
        sub: page.path,
        icon: page.categoryLabel === "지역" ? MapPin : Hammer,
        run: () => onPreview(page.path, label)
      });
    });
    (
      [
        ["/", "홈"],
        ["/estimate", "상담신청서"],
        ["/mypage", "마이페이지"],
        ["/diagnosis", "자기진단"],
        ["/privacy", "개인정보처리방침"]
      ] as Array<[string, string]>
    ).forEach(([path, name]) => {
      entries.push({ type: "페이지", label: name, sub: path, icon: FileText, run: () => onPreview(path, name) });
    });
    return entries;
  }, [inquiries, onGotoTab, onOpenInquiry, onPreview]);

  const hits = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = term
      ? index.filter((entry) => `${entry.label} ${entry.sub ?? ""} ${entry.type}`.toLowerCase().includes(term))
      : index;
    return filtered.slice(0, 9);
  }, [index, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <label className="adm-top__search" ref={rootRef}>
      <Search />
      <input
        ref={inputRef}
        type="search"
        placeholder="상담요청·페이지·블로그 글 검색"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && hits[0]) {
            hits[0].run();
            setOpen(false);
            setQuery("");
            inputRef.current?.blur();
          }
        }}
      />
      <kbd>⌘K</kbd>
      {open ? (
        <div className="adm-cmdk">
          {hits.length ? (
            hits.map((entry, indexInList) => {
              const Icon = entry.icon;
              return (
                <button
                  key={`${entry.type}-${entry.label}-${entry.sub ?? ""}`}
                  className={`adm-cmdk__item${indexInList === 0 ? " is-first" : ""}`}
                  type="button"
                  onClick={() => {
                    entry.run();
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <Icon />
                  <span className="adm-cmdk__label">
                    {entry.label}
                    {entry.sub ? <em>{entry.sub}</em> : null}
                  </span>
                  <span className="adm-cmdk__type">{entry.type}</span>
                </button>
              );
            })
          ) : (
            <div className="adm-cmdk__empty">검색 결과가 없습니다</div>
          )}
        </div>
      ) : null}
    </label>
  );
}

/* ──────────── 알림 벨 ──────────── */

function NotificationBell({
  newInquiries,
  onOpenInquiry
}: {
  newInquiries: InquiryRow[];
  onOpenInquiry: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button className="adm-top__btn" type="button" title="알림" onClick={() => setOpen((current) => !current)}>
        <Bell />
        {newInquiries.length ? <span className="adm-top__dot" /> : null}
      </button>
      {open ? (
        <div className="adm-notif">
          <header>알림{newInquiries.length ? ` · 새 상담 ${newInquiries.length}건` : ""}</header>
          {newInquiries.length ? (
            newInquiries.slice(0, 5).map((item) => {
              const display = buildDisplay(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  className="adm-notif__row"
                  onClick={() => {
                    setOpen(false);
                    onOpenInquiry(item.id);
                  }}
                >
                  <strong>
                    {item.name} · {display.workType}
                  </strong>
                  <span>
                    {display.region} · {new Date(item.created_at).toLocaleString("ko-KR")}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="adm-notif__empty">새 알림이 없습니다</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ──────────── 사용자 메뉴 ──────────── */

function socialName(session: { user?: { user_metadata?: Record<string, unknown> | null } } | null | undefined): string | null {
  const meta = session?.user?.user_metadata ?? {};
  const value = meta.full_name ?? meta.name ?? meta.user_name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function UserMenu({ email, name, onSignOut }: { email: string | null; name: string | null; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const initial = (email?.[0] ?? "관").toUpperCase();

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button className="adm-top__user" type="button" onClick={() => setOpen((current) => !current)}>
        <span className="adm-top__avatar">{initial}</span>
        <span className="adm-top__user-meta">
          <strong>{name ?? business.owner.replace("대표자 ", "")}</strong>
          <em>{email ?? "로그인 필요"}</em>
        </span>
        <ChevronDown />
      </button>
      {open ? (
        <div className="adm-usermenu">
          <a href="/" target="_blank" rel="noreferrer">
            <Home />
            사이트 홈
          </a>
          <a href="/mypage" target="_blank" rel="noreferrer">
            <UserRound />내 마이페이지
          </a>
          {email ? (
            <button type="button" className="adm-usermenu__logout" onClick={onSignOut}>
              <LogOut />
              로그아웃
            </button>
          ) : (
            <a href="/admin/login">
              <ShieldCheck />
              관리자 로그인
            </a>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ──────────── 미리보기 모달 ──────────── */

function PreviewModal({ path, label, onClose }: { path: string; label: string; onClose: () => void }) {
  const [width, setWidth] = useState<string>("100%");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const sizes: Array<{ key: string; icon: typeof Monitor; title: string }> = [
    { key: "390px", icon: Smartphone, title: "모바일" },
    { key: "820px", icon: Tablet, title: "태블릿" },
    { key: "100%", icon: Monitor, title: "데스크탑" }
  ];

  return (
    <div className="adm-pv" role="dialog" aria-label={`${label} 미리보기`}>
      <div className="adm-pv__backdrop" onClick={onClose} />
      <div className="adm-pv__panel">
        <header className="adm-pv__bar">
          <span className="adm-pv__file">
            {label} · {path}
          </span>
          <div className="adm-pv__sizes">
            {sizes.map((size) => {
              const Icon = size.icon;
              return (
                <button
                  key={size.key}
                  type="button"
                  title={size.title}
                  className={width === size.key ? "is-active" : ""}
                  onClick={() => setWidth(size.key)}
                >
                  <Icon />
                </button>
              );
            })}
          </div>
          <div className="adm-pv__tools">
            <a className="adm-pv__open" href={path} target="_blank" rel="noreferrer">
              <ExternalLink />새 탭
            </a>
            <button type="button" className="adm-pv__close" aria-label="닫기" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </header>
        <div className="adm-pv__stage">
          <iframe className="adm-pv__frame" title={`${label} 미리보기`} src={path} style={{ width }} />
        </div>
      </div>
    </div>
  );
}
