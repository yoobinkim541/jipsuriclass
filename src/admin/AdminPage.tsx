import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarRange,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  User
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

type AdminView = "editor" | "inquiries";

export function AdminPage() {
  const view = getAdminView();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [actionId, setActionId] = useState<string | null>(null);

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

    const { data } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      setSessionLoading(false);
      if (session?.user && view === "inquiries") {
        void loadInquiries();
      } else {
        setInquiries([]);
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

  async function handleSignIn() {
    setError(null);
    try {
      await authService.signInWithGoogle(`${window.location.origin}/admin/${view}`);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Google 로그인에 실패했습니다.");
    }
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

  const visibleInquiries = useMemo(
    () => (statusFilter === "all" ? inquiries : inquiries.filter((item) => item.status === statusFilter)),
    [inquiries, statusFilter]
  );

  const analytics = useMemo(() => buildAnalytics(inquiries), [inquiries]);

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
          description: "최근 문의 수, 상태 분포, 일자별 추이를 보고 바로 대응할 수 있습니다."
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
          <button className="admin-ghost-button" onClick={() => void loadInquiries()} type="button">
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
              <strong>Google 로그인</strong>
              <p>관리자 구글 계정으로 로그인하세요.</p>
              <button className="admin-primary-button" onClick={() => void handleSignIn()} type="button">
                <User size={18} />
                Google로 로그인
              </button>
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

      {view === "editor" ? (
        <HomepageEditor isAuthenticated={Boolean(sessionEmail)} />
      ) : (
        <>
          <section className="admin-insight-grid" aria-label="문의 요약">
            <article className="admin-insight-card">
              <span>전체 문의</span>
              <strong>{analytics.total}</strong>
              <p>누적 문의 수</p>
            </article>
            <article className="admin-insight-card">
              <span>최근 7일</span>
              <strong>{analytics.last7Days}</strong>
              <p>최근 일주일 유입</p>
            </article>
            <article className="admin-insight-card">
              <span>오늘</span>
              <strong>{analytics.today}</strong>
              <p>당일 들어온 문의</p>
            </article>
            <article className="admin-insight-card">
              <span>새 문의</span>
              <strong>{analytics.byStatus.new}</strong>
              <p>응답 대기 중</p>
            </article>
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

          <section className="admin-toolbar">
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
            <div className="admin-spacer" />
            <span className="admin-count">{visibleInquiries.length}건</span>
          </section>

          {authError ? <p className="admin-banner">{authError}</p> : null}
          {error ? <p className="admin-error">{error}</p> : null}

          <section className="admin-list" aria-label="문의 목록">
            {inquiriesLoading ? (
              <div className="admin-empty">
                <LoaderCircle size={18} className="spin" />
                문의를 불러오는 중
              </div>
            ) : visibleInquiries.length ? (
              visibleInquiries.map((item) => (
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
                  </div>
                  <div className="admin-row-actions">
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
                  </div>
                </article>
              ))
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
