import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
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

export function AdminPage() {
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
        if (session?.user) {
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
      if (session?.user) {
        void loadInquiries();
      } else {
        setInquiries([]);
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
      await authService.signInWithGoogle(`${window.location.origin}/admin`);
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
          <h1>문의와 상태를 한 화면에서 관리합니다</h1>
          <p>
            구글 소셜 로그인으로 접근하고, Supabase RLS로 허용된 관리자만 문의 목록과 상태를 볼 수 있게
            구성합니다.
          </p>
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

      <HomepageEditor isAuthenticated={Boolean(sessionEmail)} />

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
    </main>
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
