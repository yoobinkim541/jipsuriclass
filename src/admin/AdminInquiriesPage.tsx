import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Copy,
  Download,
  LoaderCircle,
  RefreshCcw,
  SortAsc
} from "lucide-react";
import { AdminService } from "../services/AdminService";
import type { InquiryIntake, InquiryRow, InquiryStatus } from "../types";
import { InquiryQuoteEditor } from "./InquiryQuoteEditor";
import { AdminShell } from "./AdminShell";
import { buildAnalytics, filterInquiries, formatDate, formatTime, sortOrder, statusLabel, statusOrder, stringField, type SortMode, type TimeFilter, type InquiryFilter } from "./adminUtils";
import { useAdminSession } from "./useAdminSession";

const adminService = new AdminService();

export function AdminInquiriesPage() {
  const { sessionEmail, sessionLoading, authError, setAuthError, signOut } = useAdminSession();
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
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
    if (!sessionEmail) {
      setInquiries([]);
      setExpandedInquiryId(null);
      return;
    }

    void loadInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionEmail]);

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
    await loadInquiries();
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

  async function handleMemoSave(id: string, currentIntake: InquiryIntake | null, memo: string) {
    setError(null);
    try {
      const intake = await adminService.updateInquiryMemo(id, currentIntake, memo);
      setInquiries((current) => current.map((item) => (item.id === id ? { ...item, intake } : item)));
      setCopyFeedback("메모 저장됨");
      window.setTimeout(() => setCopyFeedback(null), 1800);
    } catch (memoError) {
      setError(memoError instanceof Error ? memoError.message : "메모를 저장하지 못했습니다.");
    }
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

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
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
  const visibleInquiries = useMemo(
    () => filterInquiries(inquiries, { searchQuery, statusFilter, timeFilter, sortMode }),
    [inquiries, searchQuery, sortMode, statusFilter, timeFilter]
  );

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

  const pendingCount = analytics.byStatus.new + analytics.byStatus.contacted;
  const selectedCount = selectedVisibleInquiryIds.length;
  const topbarSearchPlaceholder = "이름·연락처·지역으로 검색";

  return (
    <AdminShell
      pageMeta={{
        kicker: "대시보드 · 상담 요청",
        title: "들어온 상담을 확인하고 응대 상태를 정리하세요.",
        description: "상담신청 폼, 전화, 카카오톡으로 들어온 요청을 한 화면에서 검색하고 처리할 수 있습니다."
      }}
      actions={
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
      }
      searchQuery={searchQuery}
      searchPlaceholder={topbarSearchPlaceholder}
      onSearchChange={setSearchQuery}
      sessionEmail={sessionEmail}
      sessionLoading={sessionLoading}
      onSignOut={signOut}
      sidebarBadges={{ inquiries: analytics.total, analytics: analytics.last7Days, editor: 4 }}
    >
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
                      <InquiryMemoEditor
                        key={`memo-${item.id}`}
                        memo={item.intake?.adminMemo ?? ""}
                        onSave={(memo) => handleMemoSave(item.id, item.intake, memo)}
                      />
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

      {copyFeedback ? <div className="admin-toast" role="status">{copyFeedback}</div> : null}
    </AdminShell>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="admin-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function InquiryMemoEditor({ memo, onSave }: { memo: string; onSave: (memo: string) => void }) {
  const [draft, setDraft] = useState(memo);

  return (
    <div className="admin-memo-editor">
      <span className="admin-memo-editor__label">관리자 메모</span>
      <textarea
        value={draft}
        placeholder="응대 내용, 일정, 특이사항을 적어두세요."
        onChange={(event) => setDraft(event.target.value)}
      />
      <button className="admin-status-button" type="button" disabled={draft === memo} onClick={() => onSave(draft)}>
        메모 저장
      </button>
    </div>
  );
}
