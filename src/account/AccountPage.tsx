import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit2,
  LoaderCircle,
  LogOut,
  RefreshCcw,
  ShieldCheck,
  User
} from "lucide-react";
import { business } from "../data";
import { supabase } from "../lib/supabaseClient";
import { AuthService } from "../services/AuthService";
import type { InquiryRow } from "../types";

const authService = new AuthService();

type Draft = {
  name: string;
  phone: string;
  service_area: string;
  message: string;
};

export function AccountPage() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

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
        setError(sessionError instanceof Error ? sessionError.message : "세션을 불러오지 못했습니다.");
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

  async function handleSignIn() {
    setError(null);
    try {
      await authService.signInWithGoogle(`${window.location.origin}/account`);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Google 로그인에 실패했습니다.");
    }
  }

  async function handleSignOut() {
    await authService.signOut();
    window.location.reload();
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
            고객 계정
          </span>
          <h1>내 견적 요청과 작업 기록을 확인합니다</h1>
          <p>
            구글 로그인으로 본인 문의만 보고, 수정이 필요한 요청은 바로 업데이트할 수 있습니다.
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
              <p>고객 계정으로 로그인해 이전 문의를 확인하세요.</p>
              <button className="admin-primary-button" onClick={() => void handleSignIn()} type="button">
                <User size={18} />
                Google로 로그인
              </button>
            </>
          )}
        </div>
      </section>

      {error ? <p className="admin-error">{error}</p> : null}

      <section className="admin-list" aria-label="내 문의 목록">
        {loading ? (
          <div className="admin-empty">
            <LoaderCircle size={18} className="spin" />
            문의를 불러오는 중
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
                    <strong>{item.name}</strong>
                    <span className={`status-badge status-${item.status}`}>{item.status}</span>
                  </div>
                  <p>
                    {item.phone} · {item.service_area || "지역 미입력"} · {formatDate(item.created_at)}
                  </p>
                  {isEditing ? (
                    <div className="account-edit-form">
                      <label>
                        이름
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
                        연락처
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
                        지역
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
                        문의 내용
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
                      {formatIntakeEntries(item.intake).map((entry) => (
                        <li key={entry.label}>
                          <strong>{entry.label}</strong> {entry.value}
                        </li>
                      ))}
                    </ul>
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
                    {isEditing ? "취소" : "수정"}
                  </button>
                  {isEditing ? (
                    <button className="admin-primary-button" type="button" disabled={savingId === item.id} onClick={() => void saveInquiry(item.id)}>
                      {savingId === item.id ? "저장 중" : "저장"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="admin-empty">본인 명의의 문의가 없습니다.</div>
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

function formatIntakeEntries(intake: Record<string, unknown>) {
  return [
    { label: "집 환경", value: String(intake.propertyType ?? "-") },
    { label: "공사 유형", value: String(intake.projectType ?? "-") },
    { label: "주소", value: String(intake.address ?? "-") },
    { label: "상담 가능 시간", value: String(intake.preferredTime ?? "-") },
    { label: "예산", value: String(intake.budget ?? "-") }
  ];
}
