import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Inbox,
  LoaderCircle,
  MessageCircle,
  Phone,
  RefreshCcw,
  Search,
  TrendingUp,
  X
} from "lucide-react";
import { business } from "../data";
import type { InquiryIntake, InquiryRow, InquiryStatus } from "../types";
import { InquiryQuoteEditor } from "./InquiryQuoteEditor";

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "신규",
  contacted: "응대중",
  quoted: "견적완료",
  active: "시공중",
  done: "완료",
  spam: "스팸"
};

const filterOrder: Array<"all" | InquiryStatus> = ["all", "new", "contacted", "quoted", "active", "done", "spam"];

type InquiriesTabProps = {
  inquiries: InquiryRow[];
  loading: boolean;
  error: string | null;
  detailId: string | null;
  onOpenDetail: (id: string | null) => void;
  onRefresh: () => Promise<void>;
  onStatusMemoSave: (id: string, status: InquiryStatus, memo: string) => Promise<void>;
  onQuoteIntakeSave: (id: string, intake: InquiryIntake) => Promise<void>;
  toast: (message: string) => void;
};

export function InquiriesTab({
  inquiries,
  loading,
  error,
  detailId,
  onOpenDetail,
  onRefresh,
  onStatusMemoSave,
  onQuoteIntakeSave,
  toast
}: InquiriesTabProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const map = { all: inquiries.length } as Record<"all" | InquiryStatus, number>;
    (Object.keys(inquiryStatusLabels) as InquiryStatus[]).forEach((status) => {
      map[status] = inquiries.filter((item) => item.status === status).length;
    });
    return map;
  }, [inquiries]);

  const kpi = useMemo(() => buildKpi(inquiries), [inquiries]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inquiries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!query) return true;
      return [item.name, item.phone, item.service_area, item.message, item.user_email]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [inquiries, statusFilter, search]);

  const detail = detailId ? inquiries.find((item) => item.id === detailId) ?? null : null;

  function handleExport() {
    const header = ["접수일", "이름", "연락처", "지역", "작업", "예산", "상태", "문의 내용", "고객 이메일"];
    const rows = visible.map((item) => {
      const display = buildDisplay(item);
      return [
        formatDateTime(item.created_at),
        item.name,
        item.phone,
        display.region,
        display.workType,
        display.budget,
        inquiryStatusLabels[item.status] ?? item.status,
        item.message ?? "",
        item.user_email ?? ""
      ];
    });
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell);
            // CSV 수식 인젝션 방지: =,+,-,@,탭,CR로 시작하면 작은따옴표를 앞에 붙인다.
            const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
            return `"${safe.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `상담요청_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`${visible.length}건을 CSV로 내보냈습니다.`);
  }

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">대시보드 · 상담 요청</span>
          <h1>들어온 상담을 확인하고 응대 상태를 정리해요.</h1>
          <p>
            상담신청 폼(<code>/estimate</code>) · 전화 · 카카오톡으로 들어온 요청이 한 곳에 모입니다. 사진은
            첨부 또는 카카오톡에서 함께 받습니다.
          </p>
        </div>
        <div className="adm-tab__actions">
          <button className="adm-btn adm-btn--ghost" type="button" onClick={handleExport}>
            <Download />CSV 내보내기
          </button>
          <button className="adm-btn adm-btn--primary" type="button" onClick={() => void onRefresh().then(() => toast("최신 데이터로 새로고침했습니다."))}>
            <RefreshCcw />새로고침
          </button>
        </div>
      </header>

      {error ? <div className="adm-gate__error" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}

      <div className="adm-kpi-row">
        <article className="adm-kpi">
          <span className="adm-kpi__label">신규 (지난 7일)</span>
          <span className="adm-kpi__num">{kpi.newLast7Days}</span>
          <span className={`adm-kpi__diff${kpi.today > 0 ? " adm-kpi__diff--up" : ""}`}>
            {kpi.today > 0 ? <TrendingUp /> : null}오늘 {kpi.today}건 접수
          </span>
        </article>
        <article className="adm-kpi">
          <span className="adm-kpi__label">응대 중</span>
          <span className="adm-kpi__num">{counts.contacted}</span>
          <span className="adm-kpi__diff">전화 회신 대기</span>
        </article>
        <article className="adm-kpi">
          <span className="adm-kpi__label">시공 진행</span>
          <span className="adm-kpi__num">{counts.active}</span>
          <span className="adm-kpi__diff">견적완료 {counts.quoted}건 대기</span>
        </article>
        <article className="adm-kpi">
          <span className="adm-kpi__label">완료 (이번 달)</span>
          <span className="adm-kpi__num">{kpi.doneThisMonth}</span>
          <span className="adm-kpi__diff">누적 완료 {counts.done}건</span>
        </article>
      </div>

      <div className="adm-inq-controls">
        <div className="adm-inq-filters">
          {filterOrder.map((key) => (
            <button
              key={key}
              type="button"
              className={statusFilter === key ? "is-active" : ""}
              onClick={() => setStatusFilter(key)}
            >
              {key === "all" ? "전체" : inquiryStatusLabels[key]} <span>{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>
        <label className="adm-inq-search">
          <Search />
          <input
            type="search"
            placeholder="이름·연락처·지역으로 검색"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="adm-inq-table" role="table">
        <div className="adm-inq-row adm-inq-row--head" role="row">
          <span>접수일</span>
          <span>이름</span>
          <span>연락처</span>
          <span>지역</span>
          <span>공간 / 작업</span>
          <span>예산</span>
          <span>채널</span>
          <span>상태</span>
        </div>
        {loading ? (
          <div className="adm-inq-empty">
            <LoaderCircle className="spin" size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
            문의 목록을 불러오는 중…
          </div>
        ) : visible.length === 0 ? (
          <div className="adm-inq-empty">표시할 상담 요청이 없습니다.</div>
        ) : (
          visible.map((item) => {
            const display = buildDisplay(item);
            return (
              <button className="adm-inq-row" role="row" key={item.id} type="button" onClick={() => onOpenDetail(item.id)}>
                <span className="adm-cell-date">
                  {formatDateShort(item.created_at)}
                  <br />
                  <em>{formatTimeShort(item.created_at)}</em>
                </span>
                <span className="adm-cell-name">{item.name}</span>
                <span className="adm-cell-phone">{item.phone}</span>
                <span className="adm-cell-region">{display.region}</span>
                <span className="adm-cell-scope">
                  <strong>{display.workType}</strong>
                  <em>{[display.spaceType, display.when].filter(Boolean).join(" · ") || "-"}</em>
                </span>
                <span className="adm-cell-budget">{display.budget}</span>
                <span className="adm-cell-ch">
                  {display.channel === "kakao" ? <><MessageCircle />카톡</> : display.channel === "phone" ? <><Phone />전화</> : <><Inbox />폼</>}
                </span>
                <span>
                  <span className={`adm-status adm-status--${item.status}`}>{inquiryStatusLabels[item.status] ?? item.status}</span>
                </span>
              </button>
            );
          })
        )}
      </div>

      <p className="adm-inq-foot">// 표시 {visible.length} / 전체 {inquiries.length}건</p>

      {detail ? (
        <InquiryDetailPanel
          inquiry={detail}
          onClose={() => onOpenDetail(null)}
          onStatusMemoSave={onStatusMemoSave}
          onQuoteIntakeSave={onQuoteIntakeSave}
        />
      ) : null}
    </section>
  );
}

function InquiryDetailPanel({
  inquiry,
  onClose,
  onStatusMemoSave,
  onQuoteIntakeSave
}: {
  inquiry: InquiryRow;
  onClose: () => void;
  onStatusMemoSave: (id: string, status: InquiryStatus, memo: string) => Promise<void>;
  onQuoteIntakeSave: (id: string, intake: InquiryIntake) => Promise<void>;
}) {
  const [statusDraft, setStatusDraft] = useState<InquiryStatus>(inquiry.status);
  const [memoDraft, setMemoDraft] = useState(inquiry.intake?.adminMemo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setStatusDraft(inquiry.status);
    setMemoDraft(inquiry.intake?.adminMemo ?? "");
    setSaved(false);
    // 슬라이드 인 트랜지션을 위해 다음 프레임에 open
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [inquiry.id]);

  // 견적 발행 등으로 부모에서 상태가 바뀌면 칩도 따라가게 한다.
  // (메모는 입력 중일 수 있어 동기화하지 않는다 — id 변경 시에만 재설정)
  useEffect(() => {
    setStatusDraft(inquiry.status);
  }, [inquiry.status]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const display = buildDisplay(inquiry);
  const intake = inquiry.intake ?? {};
  const address = [intake.postalCode, intake.address, intake.detailAddress]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ");
  const rooms = [
    ...(Array.isArray(intake.selectedRooms) ? intake.selectedRooms : []),
    ...(intake.otherRoomDetail ? [intake.otherRoomDetail] : [])
  ].join(", ");
  const attachments = inquiry.attachments ?? [];

  async function handleSave() {
    setSaving(true);
    try {
      await onStatusMemoSave(inquiry.id, statusDraft, memoDraft);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="adm-detail-backdrop" onClick={onClose} />
      <aside className={`adm-detail${open ? " is-open" : ""}`} aria-label="상담 요청 상세">
        <header className="adm-detail__head">
          <button className="adm-detail__close" type="button" aria-label="닫기" onClick={onClose}>
            <X />
          </button>
          <span className="adm-detail__kicker">INQ-{inquiry.id.slice(0, 8).toUpperCase()}</span>
          <h2>{inquiry.name} 님</h2>
          <span className="adm-detail__date">{formatDateTime(inquiry.created_at)} 접수</span>
        </header>
        <div className="adm-detail__body">
          <dl>
            <dt>연락처</dt>
            <dd>
              <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
            </dd>
          </dl>
          {inquiry.user_email ? (
            <dl>
              <dt>이메일</dt>
              <dd>{inquiry.user_email}</dd>
            </dl>
          ) : null}
          <dl>
            <dt>채널</dt>
            <dd>{display.channel === "kakao" ? "카카오톡" : display.channel === "phone" ? "전화" : "신청 폼"}</dd>
          </dl>
          <dl>
            <dt>지역</dt>
            <dd>{display.region}</dd>
          </dl>
          {address ? (
            <dl>
              <dt>주소</dt>
              <dd>{address}</dd>
            </dl>
          ) : null}
          <dl>
            <dt>공간 형태</dt>
            <dd>{[display.spaceType, intake.areaBand].filter(Boolean).join(" · ") || "-"}</dd>
          </dl>
          {intake.propertyStatus ? (
            <dl>
              <dt>거주 상태</dt>
              <dd>{intake.propertyStatus}</dd>
            </dl>
          ) : null}
          {intake.reason ? (
            <dl>
              <dt>수리 이유</dt>
              <dd>{intake.reason}</dd>
            </dl>
          ) : null}
          {rooms ? (
            <dl>
              <dt>필요한 곳</dt>
              <dd>
                <strong style={{ color: "var(--navy-700)" }}>{rooms}</strong>
              </dd>
            </dl>
          ) : null}
          <dl>
            <dt>희망 시기</dt>
            <dd>{display.when || "-"}</dd>
          </dl>
          <dl>
            <dt>예산</dt>
            <dd>{display.budget}</dd>
          </dl>
          <dl>
            <dt>문의 내용</dt>
            <dd style={{ lineHeight: 1.65, color: "var(--ink-2)", whiteSpace: "pre-wrap" }}>{inquiry.message}</dd>
          </dl>
          {attachments.length ? (
            <dl>
              <dt>첨부사진</dt>
              <dd>
                <div className="adm-detail__attach">
                  {attachments.map((attachment) => (
                    <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" title={attachment.name}>
                      <img src={attachment.url} alt={attachment.name || "첨부사진"} loading="lazy" />
                    </a>
                  ))}
                </div>
              </dd>
            </dl>
          ) : null}

          <div className="adm-edit">
            <span className="adm-edit__label">상태 변경</span>
            <div className="adm-edit__status">
              {(Object.keys(inquiryStatusLabels) as InquiryStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`adm-edit__chip${statusDraft === status ? " is-active" : ""}`}
                  onClick={() => setStatusDraft(status)}
                >
                  {inquiryStatusLabels[status]}
                </button>
              ))}
            </div>
            <span className="adm-edit__label">상담 메모 (내부용)</span>
            <textarea
              className="adm-edit__memo"
              placeholder="응대 내용·견적 메모를 남겨두세요. 같은 계정에서 이어 볼 수 있습니다."
              value={memoDraft}
              onChange={(event) => setMemoDraft(event.target.value)}
            />
            <button className="adm-edit__save" type="button" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "저장 중…" : "변경 저장"}
            </button>
            {saved ? <span className="adm-edit__saved">저장됨 ✓</span> : null}

            <div className="adm-quote-host">
              <span className="adm-edit__label">견적서 작성·발행</span>
              <InquiryQuoteEditor inquiry={inquiry} onSave={(intakeNext) => onQuoteIntakeSave(inquiry.id, intakeNext)} />
            </div>
          </div>
        </div>
        <footer className="adm-detail__foot">
          <a className="adm-btn adm-btn--accent adm-btn--lg" href={business.kakaoUrl} target="_blank" rel="noreferrer">
            <MessageCircle />카카오톡 응대
          </a>
          <a className="adm-btn adm-btn--primary adm-btn--lg" href={`tel:${inquiry.phone}`}>
            <Phone />지금 전화
          </a>
        </footer>
      </aside>
    </>
  );
}

export function buildDisplay(inquiry: InquiryRow) {
  const intake = inquiry.intake ?? {};
  const works = [
    ...(Array.isArray(intake.selectedRooms) ? intake.selectedRooms : []),
    ...(Array.isArray(intake.selectedWorks) ? intake.selectedWorks : [])
  ];
  const workType = works.length ? works.join(", ") : intake.projectType || "상담";
  const source = inquiry.source || "";
  const channel = /kakao/i.test(source) ? "kakao" : /phone/i.test(source) ? "phone" : "form";

  return {
    region: inquiry.service_area || intake.address || "-",
    spaceType: intake.spaceType || intake.propertyType || "",
    workType,
    when: intake.startTiming || intake.preferredTime || "",
    budget: intake.budget || "-",
    channel
  };
}

function buildKpi(inquiries: InquiryRow[]) {
  const now = new Date();
  const todayKey = now.toDateString();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

  let newLast7Days = 0;
  let today = 0;
  let doneThisMonth = 0;
  inquiries.forEach((item) => {
    const created = new Date(item.created_at);
    if (created >= sevenDaysAgo) newLast7Days += 1;
    if (created.toDateString() === todayKey) today += 1;
    if (item.status === "done" && `${created.getFullYear()}-${created.getMonth()}` === monthKey) doneThisMonth += 1;
  });

  return { newLast7Days, today, doneThisMonth };
}

function formatDateShort(value: string) {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimeShort(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
