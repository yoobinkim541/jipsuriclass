import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  Clock3,
  Copy,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  Search,
  ShieldCheck,
  SortAsc,
} from "lucide-react";
import { business } from "../data";
import { supabase } from "../lib/supabaseClient";
import { AuthService } from "../services/AuthService";
import { AdminService } from "../services/AdminService";
import type { InquiryRow, InquiryStatus } from "../types";
import { HomepageEditor } from "./HomepageEditor";

const authService = new AuthService();
const adminService = new AdminService();
const statusOrder: Array<"all" | InquiryStatus> = ["all", "new", "contacted", "done", "spam"];
const sortOrder: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "status", label: "상태순" },
  { value: "name", label: "이름순" }
];

type AdminView = "editor" | "inquiries";
type SortMode = "newest" | "oldest" | "status" | "name";

export function AdminPage() {
  const view = getAdminView();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");
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

  async function handleCopy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${label}를 복사했습니다.`);
      window.setTimeout(() => setCopyFeedback((current) => (current === `${label}를 복사했습니다.` ? null : current)), 1800);
    } catch {
      setCopyFeedback("복사에 실패했습니다.");
      window.setTimeout(() => setCopyFeedback((current) => (current === "복사에 실패했습니다." ? null : current)), 1800);
    }
  }

  const analytics = useMemo(() => buildAnalytics(inquiries), [inquiries]);
  const intakeStats = useMemo(() => buildIntakeStats(inquiries), [inquiries]);

  const visibleInquiries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = inquiries.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      const searchMatch =
        !normalizedQuery ||
        [item.name, item.phone, item.service_area, item.message, item.user_email]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(normalizedQuery));

      return statusMatch && searchMatch;
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
  }, [inquiries, searchQuery, sortMode, statusFilter]);

  const pageMeta =
    view === "editor"
      ? {
          kicker: "홈페이지 편집",
          title: "페이지에 보이는 글과 사진을 바로 고칩니다",
          description: "관리자만 수정할 수 있으며, 입력한 내용은 자동으로 저장됩니다."
        }
      : {
          kicker: "문의 관리",
          title: "문의 흐름과 추이를 한 번에 확인합니다",
          description: "검색, 필터, 상태 변경을 한 화면에서 끝낼 수 있게 정리했습니다."
        };

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
        <div className="admin-actions">
          {sessionEmail ? <span className="admin-email">{sessionEmail}</span> : null}
          <button className="admin-ghost-button" onClick={() => void handleRefresh()} type="button">
            <RefreshCcw size={16} />
            새로고침
          </button>
          {sessionEmail ? (
            <button className="admin-ghost-button" onClick={() => void handleSignOut()} type="button">
              <LogOut size={16} />
              로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <section className="admin-hero">
        <div>
          <span className="admin-kicker">
            <ShieldCheck size={16} />
            관리자
          </span>
          <h1>{pageMeta.title}</h1>
          <p>{pageMeta.description}</p>
        </div>
        <div className="admin-login-card">
          {sessionLoading ? (
            <p className="admin-muted">세션 확인 중</p>
          ) : sessionEmail ? (
            <div className="admin-session-card">
              <strong>로그인됨</strong>
              <p>{sessionEmail}</p>
            </div>
          ) : (
            <>
              <strong>관리자 로그인 필요</strong>
              <p>관리자 이메일과 비밀번호, 또는 Google로 로그인하세요.</p>
              <a className="admin-primary-button" href="/admin/login">
                관리자 로그인
              </a>
            </>
          )}
        </div>
      </section>

      <nav className="admin-subnav" aria-label="관리자 페이지">
        <a className={view === "editor" ? "admin-subnav-link active" : "admin-subnav-link"} href="/admin/editor">
          <LayoutDashboard size={16} />
          홈페이지 편집
        </a>
        <a className={view === "inquiries" ? "admin-subnav-link active" : "admin-subnav-link"} href="/admin/inquiries">
          <CalendarRange size={16} />
          문의 내역
        </a>
      </nav>

      <section className="admin-mobile-overview" aria-label="모바일 문의 요약">
        <div className="admin-mobile-metric">
          <span>전체 문의</span>
          <strong>{analytics.total}</strong>
        </div>
        <div className="admin-mobile-metric">
          <span>새 문의</span>
          <strong>{analytics.byStatus.new}</strong>
        </div>
        <div className="admin-mobile-metric">
          <span>처리중</span>
          <strong>{analytics.byStatus.contacted}</strong>
        </div>
        <div className="admin-mobile-metric">
          <span>새로고침</span>
          <strong>{lastRefreshedAt ? formatTime(lastRefreshedAt) : "-"}</strong>
        </div>
      </section>

      {view === "editor" ? (
        <HomepageEditor isAuthenticated={Boolean(sessionEmail)} />
      ) : (
        <>
          <section className="admin-insight-grid" aria-label="문의 요약">
            <InsightCard
              label="전체 문의"
              value={analytics.total}
              caption="누적 문의 수"
              onClick={() => setStatusFilter("all")}
              active={statusFilter === "all"}
            />
            <InsightCard
              label="새 문의"
              value={analytics.byStatus.new}
              caption="응답 대기 중"
              onClick={() => setStatusFilter("new")}
              active={statusFilter === "new"}
            />
            <InsightCard
              label="처리중"
              value={analytics.byStatus.contacted}
              caption="후속 연락 필요"
              onClick={() => setStatusFilter("contacted")}
              active={statusFilter === "contacted"}
            />
            <InsightCard
              label="완료"
              value={analytics.byStatus.done}
              caption="처리 완료"
              onClick={() => setStatusFilter("done")}
              active={statusFilter === "done"}
            />
          </section>

          <section className="admin-insight-grid admin-insight-grid-secondary" aria-label="설문 선택 요약">
            <article className="admin-insight-card">
              <span>가장 많은 집 환경</span>
              <strong>{intakeStats.topPropertyType.label}</strong>
              <p>{intakeStats.topPropertyType.count}건</p>
            </article>
            <article className="admin-insight-card">
              <span>가장 많은 공사 유형</span>
              <strong>{intakeStats.topProjectType.label}</strong>
              <p>{intakeStats.topProjectType.count}건</p>
            </article>
            <article className="admin-insight-card">
              <span>가장 많은 예산대</span>
              <strong>{intakeStats.topBudget.label}</strong>
              <p>{intakeStats.topBudget.count}건</p>
            </article>
            <article className="admin-insight-card">
              <span>가장 많은 상담 시간</span>
              <strong>{intakeStats.topTime.label}</strong>
              <p>{intakeStats.topTime.count}건</p>
            </article>
          </section>

          <section className="admin-breakdown-section" aria-labelledby="intake-breakdown-title">
            <div className="section-heading row-heading">
              <div>
                <h2 id="intake-breakdown-title">설문 선택 분포</h2>
                <p>고객이 실제로 많이 고르는 집 환경과 공사 유형을 한눈에 확인합니다.</p>
              </div>
            </div>
            <div className="admin-breakdown-grid">
              <BreakdownCard title="집 환경" items={intakeStats.propertyTypes} />
              <BreakdownCard title="공사 유형" items={intakeStats.projectTypes} />
              <BreakdownCard title="상담 가능 시간" items={intakeStats.times} />
              <BreakdownCard title="예산" items={intakeStats.budgets} />
            </div>
          </section>

          <section className="admin-chart-section" aria-labelledby="inquiry-chart-title">
            <div className="section-heading row-heading">
              <div>
                <h2 id="inquiry-chart-title">최근 7일 문의 추이</h2>
                <p>일자별 문의가 얼마나 들어왔는지 바로 확인할 수 있습니다.</p>
              </div>
            </div>
            <InquiryChart series={analytics.series} />
          </section>

          <section className="admin-toolbar" aria-label="문의 검색 및 필터">
            <div className="admin-search-wrap">
              <Search size={16} />
              <input
                aria-label="문의 검색"
                className="admin-search"
                placeholder="이름, 연락처, 메시지 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="admin-toolbar-group">
              {statusOrder.map((status) => (
                <button
                  key={status}
                  className={statusFilter === status ? "admin-filter active" : "admin-filter"}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "전체" : status}
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
              <span className="admin-sync">
                <Clock3 size={14} />
                {lastRefreshedAt ? `마지막 새로고침 ${formatTime(lastRefreshedAt)}` : "새로고침 전"}
              </span>
            </div>
          </section>

          {authError ? <p className="admin-banner">{authError}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}
          {copyFeedback ? <p className="admin-banner">{copyFeedback}</p> : null}

          <section className="admin-list" aria-label="문의 목록">
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
                        <strong>{item.name}</strong>
                        <span className={`status-badge status-${item.status}`}>{item.status}</span>
                      </div>
                      <p>
                        {item.phone} · {item.service_area || "지역 미입력"} · {formatDate(item.created_at)}
                      </p>
                      {item.user_email ? <p>고객 이메일: {item.user_email}</p> : null}
                      <p className="admin-message">{item.message}</p>
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
                      {(["new", "contacted", "done", "spam"] as InquiryStatus[]).map((status) => (
                        <button
                          key={status}
                          className="admin-status-button"
                          type="button"
                          disabled={actionId === item.id || item.status === status}
                          onClick={() => void handleStatusChange(item.id, status)}
                        >
                          {status}
                        </button>
                      ))}
                      <a className="admin-link" href={business.phoneHref}>
                        연락 <ArrowUpRight size={14} />
                      </a>
                      <button className="admin-link admin-copy-button" type="button" onClick={() => void handleCopy(item.phone, "연락처")}>
                        복사 <Copy size={14} />
                      </button>
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
    </main>
  );
}

function getAdminView(): AdminView {
  return window.location.pathname.startsWith("/admin/inquiries") ? "inquiries" : "editor";
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

function buildIntakeStats(inquiries: InquiryRow[]) {
  const propertyTypes = countField(inquiries, (item) => stringField(item.intake?.propertyType));
  const projectTypes = countField(inquiries, (item) => stringField(item.intake?.projectType));
  const times = countField(inquiries, (item) => stringField(item.intake?.preferredTime));
  const budgets = countField(inquiries, (item) => stringField(item.intake?.budget));

  return {
    propertyTypes,
    projectTypes,
    times,
    budgets,
    topPropertyType: propertyTypes[0] ?? { label: "-", count: 0 },
    topProjectType: projectTypes[0] ?? { label: "-", count: 0 },
    topTime: times[0] ?? { label: "-", count: 0 },
    topBudget: budgets[0] ?? { label: "-", count: 0 }
  };
}

function countField(
  inquiries: InquiryRow[],
  selector: (item: InquiryRow) => string | null
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();
  inquiries.forEach((item) => {
    const value = selector(item);
    if (!value) return;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko-KR"))
    .slice(0, 6);
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

function InsightCard({
  label,
  value,
  caption,
  onClick,
  active
}: {
  label: string;
  value: number;
  caption: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      className={active ? "admin-insight-card admin-insight-card-button active" : "admin-insight-card admin-insight-card-button"}
      type="button"
      onClick={onClick}
      aria-pressed={active}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
    </button>
  );
}

function BreakdownCard({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <article className="admin-breakdown-card">
      <strong>{title}</strong>
      <div className="admin-breakdown-list">
        {items.length ? (
          items.map((item) => (
            <div className="admin-breakdown-item" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
          ))
        ) : (
          <p className="admin-muted">데이터가 없습니다.</p>
        )}
      </div>
    </article>
  );
}

function InquiryChart({
  series
}: {
  series: Array<{ label: string; dateLabel: string; count: number }>;
}) {
  const max = Math.max(1, ...series.map((item) => item.count));

  return (
    <div className="inquiry-chart">
      {series.map((item) => (
        <div className="inquiry-chart-bar" key={`${item.dateLabel}-${item.label}`}>
          <div className="inquiry-chart-column">
            <span style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }} />
          </div>
          <strong>{item.count}</strong>
          <small>
            {item.label}
            <br />
            {item.dateLabel}
          </small>
        </div>
      ))}
    </div>
  );
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
