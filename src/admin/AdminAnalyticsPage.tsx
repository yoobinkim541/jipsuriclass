import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Clock3, LoaderCircle, RefreshCcw } from "lucide-react";
import { AdminService } from "../services/AdminService";
import type { InquiryRow } from "../types";
import { AdminShell } from "./AdminShell";
import { buildAnalytics, filterInquiries, formatDate, statusLabel, stringField, type SortMode, type TimeFilter, type InquiryFilter } from "./adminUtils";
import { useAdminSession } from "./useAdminSession";

const adminService = new AdminService();

export function AdminAnalyticsPage() {
  const { sessionEmail, sessionLoading, authError, setAuthError, signOut } = useAdminSession();
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  useEffect(() => {
    if (!sessionEmail) {
      setInquiries([]);
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
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "문의 목록을 불러오지 못했습니다.";
      setError(message);
      if (message.toLowerCase().includes("permission denied")) {
        setAuthError("관리자 이메일을 allowlist에 추가해야 유입 분석을 볼 수 있습니다.");
      }
    } finally {
      setInquiriesLoading(false);
    }
  }

  const analytics = useMemo(() => buildAnalytics(inquiries), [inquiries]);
  const visibleInquiries = useMemo(
    () =>
      filterInquiries(inquiries, {
        searchQuery,
        statusFilter: "all" as InquiryFilter,
        timeFilter,
        sortMode: "newest" as SortMode
      }),
    [inquiries, searchQuery, timeFilter]
  );

  const sourceSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of inquiries) {
      const key = stringField(item.source) ?? "미분류";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, count }));
  }, [inquiries]);

  const areaSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of inquiries) {
      const key = stringField(item.service_area) ?? "지역 미입력";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [inquiries]);

  const recentInquiries = visibleInquiries.slice(0, 6);
  const maxSeriesCount = Math.max(...analytics.series.map((item) => item.count), 1);
  const completionRate = analytics.total ? Math.round((analytics.byStatus.done / analytics.total) * 100) : 0;
  const pendingRate = analytics.total ? Math.round(((analytics.byStatus.new + analytics.byStatus.contacted) / analytics.total) * 100) : 0;

  return (
    <AdminShell
      pageMeta={{
        kicker: "대시보드 · 유입 분석",
        title: "어디서 들어와서 어느 지점에서 신청했나요?",
        description: "상담 요청을 기준으로 최근 유입 추세와 접수 채널, 지역 분포를 빠르게 확인합니다."
      }}
      actions={
        <>
          <button className="admin-ghost-button" type="button" onClick={() => void loadInquiries()}>
            <RefreshCcw size={16} />
            새로고침
          </button>
          <a className="admin-primary-button" href="/admin/inquiries">
            <ArrowUpRight size={16} />
            상담 요청 보기
          </a>
        </>
      }
      searchQuery={searchQuery}
      searchPlaceholder="지역·출처·문의 문구로 검색"
      onSearchChange={setSearchQuery}
      sessionEmail={sessionEmail}
      sessionLoading={sessionLoading}
      onSignOut={signOut}
      sidebarBadges={{ inquiries: analytics.total, analytics: analytics.last7Days, editor: 4 }}
    >
      <section className="admin-queue-grid" aria-label="유입 요약">
        <article className="admin-queue-card admin-queue-card--highlight">
          <span>전체 문의</span>
          <strong>{analytics.total}</strong>
          <p>누적 접수</p>
        </article>
        <article className="admin-queue-card">
          <span>오늘 문의</span>
          <strong>{analytics.today}</strong>
          <p>금일 들어온 요청</p>
        </article>
        <article className="admin-queue-card">
          <span>최근 7일</span>
          <strong>{analytics.last7Days}</strong>
          <p>주간 접수량</p>
        </article>
        <article className="admin-queue-card">
          <span>미처리</span>
          <strong>{analytics.byStatus.new + analytics.byStatus.contacted}</strong>
          <p>응대가 필요한 요청</p>
        </article>
      </section>

      <section className="admin-insight-grid" aria-label="전환 지표">
        <article className="admin-insight-card">
          <span>완료율</span>
          <strong>{completionRate}%</strong>
          <p>완료 상태로 전환된 비율입니다.</p>
        </article>
        <article className="admin-insight-card">
          <span>미처리율</span>
          <strong>{pendingRate}%</strong>
          <p>신규와 연락 중 상태의 비중입니다.</p>
        </article>
        <article className="admin-insight-card">
          <span>상태 분포</span>
          <strong>{analytics.byStatus.done} / {analytics.byStatus.new + analytics.byStatus.contacted}</strong>
          <p>완료와 진행 중 문의를 함께 보여줍니다.</p>
        </article>
      </section>

      <section className="admin-chart-section">
        <div className="admin-breakdown-card">
          <span>최근 7일 추세</span>
          <strong>일자별 상담 유입</strong>
          <p>날짜별 접수 수를 막대로 표시합니다.</p>
        </div>
        <div className="admin-chart-panel">
          {analytics.series.map((item) => (
            <div className="admin-chart-row" key={`${item.dateLabel}-${item.label}`}>
              <div className="admin-chart-row__labels">
                <strong>{item.dateLabel}</strong>
                <span>{item.label}</span>
              </div>
              <div className="admin-chart-row__track" aria-hidden="true">
                <span className="admin-chart-row__bar" style={{ width: `${Math.max(8, (item.count / maxSeriesCount) * 100)}%` }} />
              </div>
              <strong className="admin-chart-row__value">{item.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-breakdown-grid">
        <article className="admin-breakdown-card">
          <span>접수 경로</span>
          <strong>주요 유입 채널</strong>
          <p>전화, 카카오톡, 폼 등 요청 출처를 모읍니다.</p>
          <div className="admin-compact-list">
            {sourceSummary.length ? sourceSummary.map((item) => (
              <div className="admin-compact-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            )) : <div className="admin-empty admin-empty--compact">데이터가 없습니다.</div>}
          </div>
        </article>

        <article className="admin-breakdown-card">
          <span>지역 분포</span>
          <strong>자주 들어오는 지역</strong>
          <p>지역별 문의 분포를 빠르게 확인합니다.</p>
          <div className="admin-compact-list">
            {areaSummary.length ? areaSummary.map((item) => (
              <div className="admin-compact-row" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.count}</strong>
              </div>
            )) : <div className="admin-empty admin-empty--compact">데이터가 없습니다.</div>}
          </div>
        </article>

        <article className="admin-breakdown-card">
          <span>최근 접수</span>
          <strong>가장 최근 문의</strong>
          <p>검색어와 기간 필터가 적용된 최근 문의입니다.</p>
          <div className="admin-recent-list">
            {recentInquiries.length ? recentInquiries.map((item) => (
              <article className="admin-recent-card" key={item.id}>
                <div className="admin-row-top">
                  <strong>{item.name}</strong>
                  <span className={`status-badge status-${item.status}`}>{statusLabel(item.status)}</span>
                </div>
                <p>{item.phone} · {item.service_area || "지역 미입력"}</p>
                <p>{formatDate(item.created_at)}</p>
                <p className="admin-message">{item.message}</p>
              </article>
            )) : <div className="admin-empty admin-empty--compact">표시할 문의가 없습니다.</div>}
          </div>
        </article>
      </section>

      <section className="admin-toolbar" aria-label="유입 분석 필터">
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
        <div className="admin-toolbar-meta">
          <span className="admin-count">{visibleInquiries.length}건</span>
          <span className="admin-sync">
            <Clock3 size={14} />
            유입 추세
          </span>
        </div>
      </section>

      {authError ? <p className="admin-banner">{authError}</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {inquiriesLoading ? <div className="admin-empty"><LoaderCircle size={18} className="spin" />분석 데이터를 불러오는 중</div> : null}
    </AdminShell>
  );
}

