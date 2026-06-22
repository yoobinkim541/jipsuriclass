import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Download,
  Globe,
  Edit2,
  KeyRound,
  LoaderCircle,
  LogOut,
  Phone,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { business } from "../data";
import { ThemeToggle } from "../components/ThemeToggle";
import { supabase } from "../lib/supabaseClient";
import { AuthService } from "../services/AuthService";
import { buildQuoteSourceLabel, calculateQuoteTotals, downloadQuoteAsPdf, downloadQuoteAsXlsx } from "../services/QuoteService";
import { SiteContentService, defaultAccountPageContent } from "../services/SiteContentService";
import type { InquiryQuoteSnapshot, InquiryRow } from "../types";
import "../auth-panel.css";

const authService = new AuthService();
const siteContentService = new SiteContentService();

type Draft = {
  name: string;
  phone: string;
  service_area: string;
  message: string;
};

function socialName(session: { user?: { user_metadata?: Record<string, unknown> | null } } | null | undefined): string | null {
  const meta = session?.user?.user_metadata ?? {};
  const value = meta.full_name ?? meta.name ?? meta.user_name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// 상태 배지를 고객에게 보여줄 한국어 라벨로(DB enum이 그대로 'NEW'/'QUOTED'로 노출되던 문제).
const STATUS_KO: Record<string, string> = {
  new: "접수",
  contacted: "상담중",
  quoted: "견적발송",
  done: "완료",
  active: "진행중",
  spam: "보류"
};

export function AccountPage() {
  const [content, setContent] = useState(defaultAccountPageContent);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [passwordDraft, setPasswordDraft] = useState("");
  const [accountActionLoading, setAccountActionLoading] = useState<"password" | "google" | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountPanelOpen, setAccountPanelOpen] = useState(() => window.innerWidth > 720);

  const totalInquiries = inquiries.length;
  const newInquiries = inquiries.filter((item) => item.status === "new").length;
  // '알림 발송'(notified_at)은 어드민 내부 지표라 고객에겐 의미 없음 → 고객 관점의 '받은 견적'으로.
  const quotedInquiries = inquiries.filter((item) => item.intake?.quoteSnapshot?.confirmedAt).length;
  // 로그인한 사용자에겐 이름으로 인사(개인화). 비로그인 시 관리자 설정 타이틀 유지.
  const accountName = sessionName ?? (sessionEmail ? sessionEmail.split("@")[0] : null);
  const heroTitle = accountName ? `${accountName}님, 안녕하세요` : content.hero.title;

  useEffect(() => {
    let mounted = true;

    void siteContentService
      .loadAccountContent()
      .then((loadedContent) => {
        if (mounted) {
          setContent(loadedContent);
        }
      })
      .catch(() => undefined);

    authService
      .getSession()
      .then((session) => {
        if (!mounted) return;
        setSessionEmail(session?.user.email ?? null);
        setSessionName(socialName(session));
        setSessionLoading(false);
        if (session?.user) {
          void loadInquiries();
        }
      })
      .catch((sessionError) => {
        if (!mounted) return;
        setError(sessionError instanceof Error ? sessionError.message : "세션을 불러오지 못했습니다.");
        setSessionLoading(false);
      });

    const { data } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
      setSessionName(socialName(session));
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

  // 성공/오류 안내는 잠시 후 자동으로 사라지게(오래된 메시지 잔류 방지).
  useEffect(() => {
    if (!accountMessage) return;
    const timer = window.setTimeout(() => setAccountMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [accountMessage]);

  async function loadInquiries() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase!
        .from("inquiries")
        .select("id,name,phone,service_area,message,attachments,intake,status,source,user_id,user_email,created_at,notified_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (queryError) {
        throw queryError;
      }

      const rows = (data ?? []) as InquiryRow[];
      setInquiries(rows);
      const nextDrafts: Record<string, Draft> = {};
      rows.forEach((row) => {
        nextDrafts[row.id] = {
          name: row.name,
          phone: row.phone,
          service_area: row.service_area ?? "",
          message: row.message
        };
      });
      setDrafts(nextDrafts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "문의 내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await authService.signOut();
    window.location.reload();
  }

  async function handleAddPassword() {
    if (!passwordDraft.trim()) {
      setAccountMessage("비밀번호를 입력하세요.");
      return;
    }

    setAccountActionLoading("password");
    setAccountMessage(null);
    try {
      await authService.updatePassword(passwordDraft.trim());
      setPasswordDraft("");
      setAccountMessage("비밀번호를 이 계정에 추가했습니다.");
    } catch (passwordError) {
      setAccountMessage(passwordError instanceof Error ? passwordError.message : "비밀번호 설정에 실패했습니다.");
    } finally {
      setAccountActionLoading(null);
    }
  }

  async function handleLinkGoogle() {
    setAccountActionLoading("google");
    setAccountMessage(null);
    try {
      await authService.linkGoogleIdentity();
    } catch (googleError) {
      setAccountMessage(googleError instanceof Error ? googleError.message : "Google 연결에 실패했습니다.");
      setAccountActionLoading(null);
    }
  }

  async function saveInquiry(id: string) {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setError(null);
    try {
      const { error: updateError } = await supabase!
        .from("inquiries")
        .update({
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          service_area: draft.service_area.trim() || null,
          message: draft.message.trim()
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setInquiries((current) =>
        current.map((row) =>
          row.id === id
            ? { ...row, name: draft.name, phone: draft.phone, service_area: draft.service_area || null, message: draft.message }
            : row
        )
      );
      setEditingId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "문의를 수정하지 못했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  const ownInquiries = inquiries;

  return (
    <div className="mypage-shell">
      <header className="mypage-header">
        <a className="mypage-brand" href="/">
          <ArrowLeft size={18} />
          집수리<em>클라쓰</em>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sessionEmail ? (
            <span style={{ fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--f-mono)" }}>
              {sessionEmail}
            </span>
          ) : null}
          <ThemeToggle className="theme-toggle--compact" />
          <button
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, border: "1px solid var(--hair)", background: "var(--cream)", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}
            onClick={() => void loadInquiries()} type="button" aria-label="새로고침"
          >
            <RefreshCcw size={15} />새로고침
          </button>
          {sessionEmail ? (
            <button
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, border: "1px solid var(--hair)", background: "var(--cream)", fontSize: 13, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer" }}
              onClick={() => void handleSignOut()} type="button" aria-label="로그아웃"
            >
              <LogOut size={15} />로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <section className="admin-hero">
        <div>
          <span className="admin-kicker">
            <ShieldCheck size={16} />
            {content.hero.kicker}
          </span>
          <h1>{heroTitle}</h1>
          <p>{content.hero.description}</p>
          <div className="account-hero-notes" aria-label="계정 안내">
            {content.hero.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </div>
        <div className="admin-login-card">
          {sessionLoading ? (
            <p className="admin-muted">{content.auth.loadingText}</p>
          ) : sessionEmail ? (
            <div className="admin-session-card admin-session-card-stack">
              <div className="account-login-head">
                <div>
                  <span className="account-session-label">{content.auth.currentLoginLabel}</span>
                  <strong>{sessionName ?? sessionEmail}</strong>
                </div>
                <button
                  className="admin-status-button account-login-toggle"
                  type="button"
                  aria-expanded={accountPanelOpen}
                  onClick={() => setAccountPanelOpen((current) => !current)}
                >
                  {accountPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {accountPanelOpen ? content.auth.collapseLabel : content.auth.expandLabel}
                </button>
              </div>
              {accountPanelOpen ? (
                <div className="account-identity-actions">
                  <label className="account-identity-field">
                    <span>{content.auth.passwordLabel}</span>
                    <input
                      autoComplete="new-password"
                      placeholder={content.auth.passwordPlaceholder}
                      type="password"
                      value={passwordDraft}
                      onChange={(event) => setPasswordDraft(event.target.value)}
                    />
                  </label>
                  <div className="account-identity-buttons">
                    <button
                      className="admin-primary-button"
                      type="button"
                      onClick={() => void handleAddPassword()}
                      disabled={accountActionLoading === "password"}
                    >
                      <KeyRound size={16} />
                      {accountActionLoading === "password" ? content.auth.passwordSavingLabel : content.auth.passwordSaveLabel}
                    </button>
                    <button
                      className="admin-ghost-button"
                      type="button"
                      onClick={() => void handleLinkGoogle()}
                      disabled={accountActionLoading === "google"}
                    >
                      <Globe size={16} />
                      {accountActionLoading === "google" ? content.auth.googleConnectingLabel : content.auth.googleConnectLabel}
                    </button>
                  </div>
                  {accountMessage ? <p className="admin-muted">{accountMessage || content.auth.accountMessageEmptyText}</p> : null}
                </div>
              ) : (
                <p className="admin-muted account-login-collapsed-note">
                  {content.auth.collapsedNote}
                </p>
              )}
            </div>
          ) : (
            <>
              <span className="account-session-label">{content.auth.noSessionLabel}</span>
              <strong>{content.auth.noSessionTitle}</strong>
              <p>{content.auth.noSessionDescription}</p>
              <a className="admin-primary-button" href="/login">
                {content.auth.loginLinkLabel}
              </a>
            </>
          )}
        </div>
      </section>

      {totalInquiries > 0 ? (
      <section className="account-summary-grid" aria-label="마이페이지 요약">
        <article className="account-summary-card">
          <span>{content.summary[0]?.label ?? "총 문의"}</span>
          <strong>{totalInquiries}</strong>
          <p>{content.summary[0]?.description ?? "최근 100건까지 빠르게 확인합니다."}</p>
        </article>
        <article className="account-summary-card">
          <span>{content.summary[1]?.label ?? "새 문의"}</span>
          <strong>{newInquiries}</strong>
          <p>{content.summary[1]?.description ?? "아직 처리 전인 문의만 따로 볼 수 있습니다."}</p>
        </article>
        <article className="account-summary-card">
          <span>받은 견적</span>
          <strong>{quotedInquiries}</strong>
          <p>컨펌된 견적서를 받은 문의 수입니다.</p>
        </article>
      </section>
      ) : null}

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="account-list-section" aria-label="내 문의 목록">
        <div className="account-list-head">
          <div>
            <span className="account-list-kicker">{content.list.kicker}</span>
            <h2>{content.list.title}</h2>
          </div>
          <p>{content.list.description}</p>
        </div>
        {totalInquiries > 0 ? (
          <div className="account-new-cta">
            <a className="admin-primary-button" href="/estimate">
              <ClipboardList size={16} />
              새 견적 상담 신청
            </a>
          </div>
        ) : null}
        <div className="admin-list">
          {loading ? (
            <div className="admin-empty">
              <LoaderCircle size={18} className="spin" />
              {content.list.loadingText}
            </div>
          ) : ownInquiries.length ? (
            ownInquiries.map((item) => {
              const draft = drafts[item.id] || {
                name: item.name,
                phone: item.phone,
                service_area: item.service_area || "",
                message: item.message
              };
              const isEditing = editingId === item.id;

              return (
                <article className="admin-row" key={item.id}>
                  <div className="admin-row-main">
                    <div className="admin-row-top">
                      <div className="account-row-title">
                        <strong>{item.name}</strong>
                        <span className="account-row-subtitle">{item.phone}</span>
                      </div>
                      <span className={`status-badge status-${item.status}`}>{STATUS_KO[item.status] ?? item.status}</span>
                    </div>
                    <p>
                      {item.service_area || content.list.noAreaText} · {formatDate(item.created_at)}
                    </p>
                    {isEditing ? (
                      <div className="account-edit-form">
                        <label>
                          {content.list.nameLabel}
                          <input
                            value={draft.name}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, name: event.target.value }
                              }))
                            }
                          />
                        </label>
                        <label>
                          {content.list.phoneLabel}
                          <input
                            value={draft.phone}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, phone: event.target.value }
                              }))
                            }
                          />
                        </label>
                        <label>
                          {content.list.areaLabel}
                          <input
                            value={draft.service_area}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, service_area: event.target.value }
                              }))
                            }
                          />
                        </label>
                        <label>
                          {content.list.messageLabel}
                          <textarea
                            rows={5}
                            value={draft.message}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, message: event.target.value }
                              }))
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <p className="admin-message">{item.message}</p>
                    )}
                    {item.intake ? (
                      <ul className="inquiry-intake-list">
                        {formatIntakeEntries(item.intake, content.intakeLabels).map((entry) => (
                          <li key={entry.label}>
                            <strong>{entry.label}</strong> {entry.value}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="account-row-meta">
                      <span>
                        {content.list.sourceLabel} {item.source}
                      </span>
                      <span>
                        {content.list.attachmentLabel} {item.attachments?.length ?? 0}개
                      </span>
                      <span>{item.notified_at ? `${content.list.notifiedLabel} ${formatDate(item.notified_at)}` : `${content.list.notifiedLabel} 미발송`}</span>
                    </div>
                    {item.intake?.quoteSnapshot?.confirmedAt ? (
                      <ConfirmedQuoteCard inquiry={item} quote={item.intake.quoteSnapshot} />
                    ) : item.intake?.quoteSnapshot ? (
                      <p className="account-quote-note">견적서는 아직 컨펌되지 않았습니다.</p>
                    ) : null}
                    {item.attachments?.length ? (
                      <div className="inquiry-attachment-grid" aria-label="첨부 사진">
                        {item.attachments.map((attachment) => (
                          <a className="inquiry-attachment" href={attachment.url} target="_blank" rel="noreferrer" key={attachment.url}>
                            <img src={attachment.url} alt={attachment.name} />
                            <span>{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="admin-row-actions">
                    <button className="admin-status-button" type="button" onClick={() => setEditingId(isEditing ? null : item.id)}>
                      <Edit2 size={14} />
                      {isEditing ? content.list.cancelLabel : content.list.editLabel}
                    </button>
                    {isEditing ? (
                      <button className="admin-primary-button" type="button" disabled={savingId === item.id} onClick={() => void saveInquiry(item.id)}>
                        {savingId === item.id ? "저장 중" : content.list.saveLabel}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="account-empty">
              <span className="account-empty__icon" aria-hidden="true">
                <ClipboardList size={26} />
              </span>
              <strong className="account-empty__title">{content.list.emptyText}</strong>
              <p className="account-empty__desc">
                간단한 설문으로 견적 상담을 신청하면, 진행 상태와 받은 견적서를 이 화면에서 한눈에 확인할 수 있어요.
              </p>
              <div className="account-empty__actions">
                <a className="admin-primary-button" href="/estimate">
                  <ClipboardList size={16} />
                  견적 상담 신청하기
                </a>
                <a className="admin-ghost-button" href={business.phoneHref}>
                  <Phone size={16} />
                  전화 상담
                </a>
              </div>
            </div>
          )}
        </div>
      </section>
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

function formatIntakeEntries(
  intake: Record<string, unknown>,
  labels: {
    propertyType: string;
    projectType: string;
    address: string;
    preferredTime: string;
    budget: string;
  }
) {
  return [
    { label: labels.propertyType, value: String(intake.propertyType ?? "-") },
    { label: labels.projectType, value: String(intake.projectType ?? "-") },
    { label: labels.address, value: String(intake.address ?? "-") },
    { label: labels.preferredTime, value: String(intake.preferredTime ?? "-") },
    { label: labels.budget, value: String(intake.budget ?? "-") }
  ];
}

function ConfirmedQuoteCard({ inquiry, quote }: { inquiry: InquiryRow; quote: InquiryQuoteSnapshot }) {
  const totals = calculateQuoteTotals(quote);

  async function handleDownloadXlsx() {
    await downloadQuoteAsXlsx({ inquiry, quote, totals });
  }

  async function handleDownloadPdf() {
    await downloadQuoteAsPdf({ inquiry, quote, totals });
  }

  return (
    <div className="account-quote-card" aria-label="컨펌된 견적서">
      <div className="account-quote-card__head">
        <div>
          <span className="account-quote-kicker">컨펌된 견적서</span>
          <strong>{buildQuoteSourceLabel(quote)}</strong>
          <p>컨펌일 {quote.confirmedAt ? formatDate(quote.confirmedAt) : "-"}</p>
        </div>
        <div className="account-quote-actions">
          <button className="admin-status-button" type="button" onClick={() => void handleDownloadXlsx()}>
            <Download size={14} />
            XLSX
          </button>
          <button className="admin-status-button" type="button" onClick={() => void handleDownloadPdf()}>
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>
      <div className="account-quote-grid">
        <div>
          <span>공급가액</span>
          <strong>{(totals.workSubtotal + totals.materialSubtotal + totals.extraSubtotal).toLocaleString()}원</strong>
        </div>
        <div>
          <span>부가세</span>
          <strong>{totals.vat.toLocaleString()}원</strong>
        </div>
        <div>
          <span>합계</span>
          <strong>{totals.total.toLocaleString()}원</strong>
        </div>
      </div>
      <ul className="account-quote-list">
        {quote.lineItems.slice(0, 4).map((item) => (
          <li key={item.id}>
            <span>{item.name}</span>
            <strong>{(item.qty * item.unitPrice).toLocaleString()}원</strong>
          </li>
        ))}
        {quote.lineItems.length > 4 ? <li><span>외 {quote.lineItems.length - 4}개 항목</span><strong>-</strong></li> : null}
      </ul>
    </div>
  );
}
