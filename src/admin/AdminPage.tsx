import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  LoaderCircle,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  RefreshCcw,
  Search,
  ShieldCheck,
  SortAsc,
  UserRound,
} from "lucide-react";
import { business } from "../data";
import { supabase } from "../lib/supabaseClient";
import { AuthService } from "../services/AuthService";
import { AdminService } from "../services/AdminService";
import type { InquiryIntake, InquiryRow, InquiryStatus } from "../types";
import { InquiryQuoteEditor } from "./InquiryQuoteEditor";
import { SiteContentEditor } from "./SiteContentEditor";

const authService = new AuthService();
const adminService = new AdminService();
const statusOrder: Array<InquiryFilter> = ["all", "pending", "new", "contacted", "done", "spam"];
const sortOrder: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "status", label: "상태순" },
  { value: "name", label: "이름순" }
];

type AdminView = "editor" | "inquiries";
type SortMode = "newest" | "oldest" | "status" | "name";
type TimeFilter = "all" | "today" | "7d" | "30d";
type InquiryFilter = "all" | "pending" | InquiryStatus;
type SidebarItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
  active: boolean;
  hint?: string;
};

export function AdminPage() {
  const view = getAdminView();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InquiryFilter>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiryIds, setSelectedInquiryIds] = useState<string[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedInquiryId, setExpandedInquiryId] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    authService
      .getSession()
      .then((session) => {
        if (!mounted) return;
        setSessionEmail(session?.user.email ?? null);
        setSessionLoading(false);
        if (session?.user && view === "inquiries") {
          void loadInquiries();
        }
      })
      .catch((sessionError) => {
        if (!mounted) return;
        setAuthError(sessionError instanceof Error ? sessionError.message : "세션을 불러오지 못했습니다.");
        setSessionLoading(false);
      });

    const { data } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        setSessionEmail(session?.user.email ?? null);
        setSessionLoading(false);
        if (session?.user && view === "inquiries") {
          void loadInquiries();
        } else {
          setInquiries([]);
          setExpandedInquiryId(null);
        }
      }) ?? { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [view]);

  async function loadInquiries() {
    setInquiriesLoading(true);
    setError(null);
    try {
      const rows = await adminService.listInquiries();
      setInquiries(rows);
      setAuthError(null);
      setLastRefreshedAt(new Date().toISOString());
      setExpandedInquiryId((current) => (current && rows.some((item) => item.id === current) ? current : null));
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

  async function handleRefresh() {
    if (view === "inquiries") {
      await loadInquiries();
      return;
    }

    window.location.reload();
  }

  async function handleSignOut() {
    await authService.signOut();
    window.location.reload();
  }

  async function handleStatusChange(id: string, status: InquiryStatus) {
    setActionId(id);
    setError(null);
    try {
      await adminService.updateInquiryStatus(id, status);
      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "상태를 바꾸지 못했습니다.");
    } finally {
      setActionId(null);
    }
  }

  async function handleBulkStatusChange(status: InquiryStatus) {
    if (!selectedVisibleInquiryIds.length) return;

    setActionId(`bulk-${status}`);
    setError(null);

    try {
      await Promise.all(selectedVisibleInquiryIds.map((id) => adminService.updateInquiryStatus(id, status)));
      setInquiries((current) => current.map((item) => (selectedVisibleInquiryIds.includes(item.id) ? { ...item, status } : item)));
      setSelectedInquiryIds((current) => current.filter((id) => !selectedVisibleInquiryIds.includes(id)));
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "상태를 바꾸지 못했습니다.");
    } finally {
      setActionId(null);
    }
  }

  async function handleInquiryIntakeSave(id: string, intake: InquiryIntake) {
    await adminService.updateInquiryIntake(id, intake);
    setInquiries((current) => current.map((item) => (item.id === id ? { ...item, intake } : item)));
  }

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} 복사됨`);
    } catch {
      setCopyFeedback("복사 실패");
    } finally {
      window.setTimeout(() => setCopyFeedback(null), 1800);
    }
  }

  function handleExport() {
    const header = ["이름", "연락처", "지역", "상태", "문의 내용", "접수 경로", "접수일시", "고객 이메일"];
    const rows = visibleInquiries.map((item) => [
      item.name,
      item.phone,
      item.service_area ?? "",
      statusLabel(item.status),
      item.message ?? "",
      item.source ?? "",
      formatDate(item.created_at),
      item.user_email ?? ""
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    if (!expandedInquiryId) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedInquiryId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expandedInquiryId]);

  const analytics = useMemo(() => buildAnalytics(inquiries), [inquiries]);

  const visibleInquiries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const now = new Date();
    const todayKey = now.toDateString();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const filtered = inquiries.filter((item) => {
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "pending" && (item.status === "new" || item.status === "contacted")) ||
        item.status === statusFilter;
      const createdAt = new Date(item.created_at);
      const timeMatch =
        timeFilter === "all" ||
        (timeFilter === "today" && createdAt.toDateString() === todayKey) ||
        (timeFilter === "7d" && createdAt >= sevenDaysAgo) ||
        (timeFilter === "30d" && createdAt >= thirtyDaysAgo);
      const searchMatch =
        !normalizedQuery ||
        [item.name, item.phone, item.service_area, item.message, item.user_email]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      return statusMatch && timeMatch && searchMatch;
    });

    return filtered.slice().sort((left, right) => {
      if (sortMode === "name") {
        return left.name.localeCompare(right.name, "ko-KR");
      }

      if (sortMode === "status") {
        const statusDiff = statusSortValue(left.status) - statusSortValue(right.status);
        return statusDiff || new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      }

      const timeDiff = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      return sortMode === "oldest" ? timeDiff : -timeDiff;
    });
  }, [inquiries, searchQuery, sortMode, statusFilter, timeFilter]);

  const selectedInquirySet = useMemo(() => new Set(selectedInquiryIds), [selectedInquiryIds]);
  const selectedVisibleInquiryIds = useMemo(
    () => visibleInquiries.filter((item) => selectedInquirySet.has(item.id)).map((item) => item.id),
    [selectedInquirySet, visibleInquiries]
  );

  useEffect(() => {
    setSelectedInquiryIds((current) => {
      const next = current.filter((id) => inquiries.some((item) => item.id === id));
      return next.length === current.length ? current : next;
    });
  }, [inquiries]);

  const pageMeta =
    view === "editor"
      ? {
          kicker: "콘텐츠 · 핵심 페이지",
          title: "핵심 페이지를 바로 수정하세요.",
          description: "홈, 자기진단, 상담신청 같은 자주 쓰는 페이지를 한 번에 관리합니다."
        }
      : {
          kicker: "대시보드 · 상담 요청",
          title: "들어온 상담을 빠르게 확인하고 상태를 정리하세요.",
          description: "상담신청, 전화, 카카오톡으로 들어온 요청을 한 화면에서 검색하고 처리할 수 있습니다."
        };

  const pendingCount = analytics.byStatus.new + analytics.byStatus.contacted;
  const selectedCount = selectedVisibleInquiryIds.length;
  const topbarSearchPlaceholder =
    view === "inquiries" ? "이름·연락처·지역으로 검색" : "홈·랜딩·마이·견적 편집 항목 검색";
  const sidebarGroups: Array<{ title: string; items: SidebarItem[] }> = [
    {
      title: "대시보드",
      items: [
        {
          label: "상담 요청",
          href: "/admin/inquiries",
          icon: MessageSquare,
          badge: analytics.total,
          active: view === "inquiries"
        },
        {
          label: "유입 분석",
          href: "/admin/inquiries#inquiry-summary",
          icon: BarChart3,
          badge: analytics.last7Days,
          active: false
        }
      ]
    },
    {
      title: "콘텐츠",
      items: [
        {
          label: "페이지 편집",
          href: "/admin/editor",
          icon: LayoutDashboard,
          badge: 4,
          active: view === "editor"
        }
      ]
    },
    {
      title: "사이트",
      items: [
        {
          label: "사이트 확인",
          href: "/",
          icon: ExternalLink,
          active: false
        },
        {
          label: "로그인",
          href: "/admin/login",
          icon: UserRound,
          active: false
        }
      ]
    }
  ];

  function toggleInquirySelection(id: string) {
    setSelectedInquiryIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  function selectVisibleInquiries() {
    setSelectedInquiryIds(visibleInquiries.map((item) => item.id));
  }

  function clearSelection() {
    setSelectedInquiryIds([]);
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="관리자 내비게이션">
        <a className="admin-brand" href="/">
          <span className="admin-brand__mark" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <span className="admin-brand__text">
            <strong>{business.name}</strong>
            <em>관리자 콘솔</em>
          </span>
        </a>

        <nav className="admin-sidebar__nav">
          {sidebarGroups.map((group) => (
            <div className="admin-sidebar__group" key={group.title}>
              <span className="admin-sidebar__group-label">{group.title}</span>
              <div className="admin-sidebar__list">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      className={item.active ? "admin-sidebar__item active" : "admin-sidebar__item"}
                      href={item.href}
                      key={item.label}
                    >
                      <span className="admin-sidebar__item-icon">
                        <Icon size={18} />
                      </span>
                      <span className="admin-sidebar__item-copy">
                        <strong>{item.label}</strong>
                        {item.hint ? <em>{item.hint}</em> : null}
                      </span>
                      {item.badge !== undefined ? <span className="admin-sidebar__badge">{item.badge}</span> : null}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__status">
          <span className="admin-sidebar__status-dot" />
          <div>
            <strong>모든 시스템 정상</strong>
            <p>BUILD · {new Date().toISOString().slice(0, 10)}</p>
          </div>
        </div>
      </aside>

      <div className="admin-frame">
        <header className="admin-topbar">
          <a className="admin-topbar__home" href="/">
            <ArrowLeft size={18} />
            <span>{business.name}</span>
          </a>

          <label className="admin-topbar__search" aria-label="관리자 전역 검색">
            <Search size={18} />
            <input
              aria-label="관리자 검색"
              className="admin-topbar__search-input"
              placeholder={topbarSearchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <kbd>⌘K</kbd>
          </label>

          <div className="admin-topbar__actions">
            <button className="admin-topbar__icon-button" type="button" aria-label="알림">
              <Bell size={18} />
            </button>
            <a className="admin-topbar__icon-button" href="/" aria-label="공개 사이트 열기" target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
            </a>
            {sessionEmail ? (
              <button className="admin-user-chip" type="button" onClick={() => void handleSignOut()} aria-label="로그아웃">
                <span className="admin-user-chip__avatar">{business.owner.slice(-1)}</span>
                <span className="admin-user-chip__copy">
                  <strong>{business.owner}</strong>
                  <em>대표 · 관리자</em>
                </span>
                <LogOut size={16} />
              </button>
            ) : (
              <a className="admin-user-chip admin-user-chip--login" href="/admin/login">
                <span className="admin-user-chip__avatar">{business.owner.slice(-1)}</span>
                <span className="admin-user-chip__copy">
                  <strong>로그인 필요</strong>
                  <em>관리자 입장</em>
                </span>
                <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </header>

        <div className="admin-content">
          <section className="admin-hero">
            <div className="admin-hero__copy">
              <span className="admin-kicker">
                <ShieldCheck size={16} />
                {pageMeta.kicker}
              </span>
              <h1>{pageMeta.title}</h1>
              <p>{pageMeta.description}</p>
            </div>
            <div className="admin-hero__actions">
              {view === "inquiries" ? (
                <>
                  <button className="admin-ghost-button" type="button" onClick={handleExport} disabled={!visibleInquiries.length}>
                    <Download size={16} />
                    CSV 내보내기
                  </button>
                  <button className="admin-primary-button" type="button" onClick={() => void handleRefresh()}>
                    <RefreshCcw size={16} />
                    새로고침
                  </button>
                </>
              ) : (
                <>
                  <button className="admin-ghost-button" type="button" onClick={() => void handleRefresh()}>
                    <RefreshCcw size={16} />
                    동기화
                  </button>
                  <a className="admin-primary-button" href="/admin/login">
                    <ArrowUpRight size={16} />
                    관리자 로그인
                  </a>
                </>
              )}
            </div>
          </section>

          {view === "editor" ? (
            sessionLoading ? (
              <div className="admin-empty">
                <LoaderCircle size={18} className="spin" />
                세션 확인 중
              </div>
            ) : (
              <section className="admin-panel admin-panel--editor" aria-label="페이지 편집">
                <SiteContentEditor isAuthenticated={Boolean(sessionEmail)} searchQuery={searchQuery} />
              </section>
            )
          ) : (
            <>
              <section className="admin-metrics" id="inquiry-summary" aria-label="문의 요약">
                <button className="admin-metric-card admin-metric-card--active" type="button" onClick={() => setStatusFilter("all")}>
                  <span>전체 문의</span>
                  <strong>{analytics.total}</strong>
                  <p>누적 문의 수</p>
                </button>
                <button className="admin-metric-card" type="button" onClick={() => setStatusFilter("pending")}>
                  <span>미처리</span>
                  <strong>{pendingCount}</strong>
                  <p>신규 + 처리중</p>
                </button>
                <article className="admin-metric-card">
                  <span>오늘 문의</span>
                  <strong>{analytics.today}</strong>
                  <p>금일 접수</p>
                </article>
                <article className="admin-metric-card">
                  <span>최근 7일</span>
                  <strong>{analytics.last7Days}</strong>
                  <p>주간 접수</p>
                </article>
              </section>

              <section className="admin-toolbar" aria-label="문의 검색 및 필터">
                <div className="admin-toolbar-group">
                  {statusOrder.map((status) => (
                    <button
                      key={status}
                      className={statusFilter === status ? "admin-filter active" : "admin-filter"}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                    >
                      {statusLabel(status)}
                    </button>
                  ))}
                </div>
                <div className="admin-toolbar-group">
                  {([
                    ["all", "전체"],
                    ["today", "오늘"],
                    ["7d", "7일"],
                    ["30d", "30일"]
                  ] as Array<[TimeFilter, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      className={timeFilter === value ? "admin-filter active" : "admin-filter"}
                      type="button"
                      onClick={() => setTimeFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="admin-toolbar-group">
                  <SortAsc size={16} className="admin-toolbar-icon" />
                  <select
                    aria-label="문의 정렬"
                    className="admin-sort"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                  >
                    {sortOrder.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-spacer" />
                <div className="admin-toolbar-meta">
                  <span className="admin-count">{visibleInquiries.length}건</span>
                  {selectedCount > 0 ? <span className="admin-sync">선택 {selectedCount}건</span> : null}
                  <span className="admin-sync">
                    <Clock3 size={14} />
                    {lastRefreshedAt ? `마지막 ${formatTime(lastRefreshedAt)}` : "새로고침 전"}
                  </span>
                  <button className="admin-ghost-button admin-export-button" type="button" onClick={handleExport} disabled={!visibleInquiries.length}>
                    <Download size={14} />
                    <span className="admin-btn-label">내보내기</span>
                  </button>
                </div>
              </section>

              {authError ? <p className="admin-banner">{authError}</p> : null}
              {error ? <p className="admin-error">{error}</p> : null}

              <section className="admin-list" aria-label="문의 목록">
                {selectedCount > 0 ? (
                  <div className="admin-bulk-bar" aria-label="선택 문의 작업">
                    <div className="admin-bulk-copy">
                      <strong>선택 {selectedCount}건</strong>
                      <p>선택한 문의를 한 번에 처리합니다.</p>
                    </div>
                    <div className="admin-bulk-actions">
                      <button
                        className="admin-bulk-button"
                        type="button"
                        onClick={selectVisibleInquiries}
                        disabled={!visibleInquiries.length || Boolean(actionId)}
                      >
                        전체 선택
                      </button>
                      <button className="admin-bulk-button" type="button" onClick={clearSelection} disabled={Boolean(actionId)}>
                        선택 해제
                      </button>
                      <button className="admin-bulk-button" type="button" onClick={() => void handleBulkStatusChange("contacted")} disabled={Boolean(actionId)}>
                        연락 처리
                      </button>
                      <button className="admin-bulk-button" type="button" onClick={() => void handleBulkStatusChange("done")} disabled={Boolean(actionId)}>
                        완료 처리
                      </button>
                      <button className="admin-bulk-button" type="button" onClick={() => void handleBulkStatusChange("spam")} disabled={Boolean(actionId)}>
                        스팸 처리
                      </button>
                    </div>
                  </div>
                ) : null}
                {inquiriesLoading ? (
                  <div className="admin-empty">
                    <LoaderCircle size={18} className="spin" />
                    문의를 불러오는 중
                  </div>
                ) : visibleInquiries.length ? (
                  visibleInquiries.map((item) => {
                    const isExpanded = expandedInquiryId === item.id;

                    return (
                      <article className="admin-row" key={item.id}>
                        <div className="admin-row-main">
                          <div className="admin-row-top">
                            <label className="admin-row-select">
                              <input
                                type="checkbox"
                                checked={selectedInquirySet.has(item.id)}
                                onChange={() => toggleInquirySelection(item.id)}
                                disabled={Boolean(actionId)}
                                aria-label={`${item.name} 선택`}
                              />
                              <span>선택</span>
                            </label>
                            <strong>{item.name}</strong>
                            <span className={`status-badge status-${item.status}`}>{item.status}</span>
                          </div>
                          <p>
                            {item.phone} · {item.service_area || "지역 미입력"} · {formatDate(item.created_at)}
                          </p>
                          {item.user_email ? <p>고객 이메일: {item.user_email}</p> : null}
                          <p className="admin-message">{item.message}</p>
                          <div className="admin-quote-badge-row">
                            {item.intake?.quoteSnapshot?.confirmedAt ? (
                              <span className="admin-quote-badge">견적 컨펌됨</span>
                            ) : item.intake?.selectedWorks?.length || item.intake?.quoteSnapshot ? (
                              <span className="admin-quote-badge">견적 작성됨</span>
                            ) : (
                              <span className="admin-quote-badge admin-quote-badge--muted">견적 없음</span>
                            )}
                            <span className="admin-quote-badge admin-quote-badge--muted">
                              {item.intake?.selectedWorks?.length ?? 0}개 항목
                            </span>
                          </div>
                          {isExpanded ? (
                            <div className="admin-row-detail">
                              <div className="admin-detail-grid">
                                <DetailItem label="연락처" value={item.phone} />
                                <DetailItem label="지역" value={item.service_area || "지역 미입력"} />
                                <DetailItem label="고객 이메일" value={item.user_email || "-"} />
                                <DetailItem label="접수 경로" value={item.source} />
                              </div>
                              <div className="admin-detail-grid">
                                <DetailItem label="집 환경" value={stringField(item.intake?.propertyType)} />
                                <DetailItem label="공사 유형" value={stringField(item.intake?.projectType)} />
                                <DetailItem label="예산" value={stringField(item.intake?.budget)} />
                                <DetailItem label="상담 가능 시간" value={stringField(item.intake?.preferredTime)} />
                              </div>
                              <InquiryQuoteEditor inquiry={item} onSave={(nextIntake) => handleInquiryIntakeSave(item.id, nextIntake)} />
                              {item.attachments?.length ? (
                                <div className="inquiry-attachment-grid" aria-label="첨부 사진">
                                  {item.attachments.map((attachment) => (
                                    <a
                                      className="inquiry-attachment"
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      key={attachment.url}
                                    >
                                      <img src={attachment.url} alt={attachment.name} />
                                      <span>{attachment.name}</span>
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                        <div className="admin-row-actions">
                          <button
                            className="admin-status-button admin-detail-toggle"
                            type="button"
                            onClick={() => setExpandedInquiryId((current) => (current === item.id ? null : item.id))}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "접기" : "상세"}
                          </button>
                          {(["new", "contacted", "done", "spam"] as InquiryStatus[])
                            .filter((status) => status !== item.status)
                            .map((status) => (
                              <button
                                key={status}
                                className="admin-status-button"
                                type="button"
                                disabled={Boolean(actionId)}
                                onClick={() => void handleStatusChange(item.id, status)}
                              >
                                {actionId === item.id ? <LoaderCircle size={12} className="spin" /> : statusLabel(status)}
                              </button>
                            ))}
                          <button className="admin-link admin-copy-button" type="button" onClick={() => void handleCopy(item.phone, "연락처")}>
                            <Copy size={14} />
                            복사
                          </button>
                          <a className="admin-link" href={`tel:${item.phone}`}>
                            <ArrowUpRight size={14} />
                            전화
                          </a>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="admin-empty">표시할 문의가 없습니다.</div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
      {copyFeedback ? <div className="admin-toast" role="status">{copyFeedback}</div> : null}
    </main>
  );
}

function getAdminView(): AdminView {
  const pathname = window.location.pathname;
  return pathname.startsWith("/admin/editor") ? "editor" : "inquiries";
}

function buildAnalytics(inquiries: InquiryRow[]) {
  const total = inquiries.length;
  const byStatus = inquiries.reduce<Record<InquiryStatus, number>>(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { new: 0, contacted: 0, done: 0, spam: 0 }
  );

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const series = Array.from({ length: 7 }, (_value, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() - (6 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const count = inquiries.filter((item) => {
      const createdAt = new Date(item.created_at);
      return createdAt >= day && createdAt < next;
    }).length;

    return {
      label: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(day),
      dateLabel: new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(day),
      count
    };
  });

  const last7Days = series.reduce((sum, item) => sum + item.count, 0);
  const today = series[series.length - 1]?.count ?? 0;

  return { total, byStatus, series, last7Days, today };
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function statusSortValue(status: InquiryStatus) {
  switch (status) {
    case "new":
      return 0;
    case "contacted":
      return 1;
    case "done":
      return 2;
    case "spam":
      return 3;
    default:
      return 4;
  }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="admin-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function statusLabel(status: InquiryFilter) {
  const map: Record<InquiryFilter, string> = {
    all: "전체",
    pending: "미처리",
    new: "신규",
    contacted: "연락",
    done: "완료",
    spam: "스팸"
  };
  return map[status];
}

function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
