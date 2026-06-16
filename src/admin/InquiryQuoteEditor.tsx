import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, DragEvent } from "react";
import { CheckCircle2, ChevronDown, Download, ExternalLink, FileSpreadsheet, FileUp, Maximize2, Minimize2, Plus, PlugZap, Save, Search, Trash2, X } from "lucide-react";
import {
  buildQuoteDraftFromInquiry,
  buildQuoteSourceLabel,
  calculateQuoteTotals,
  checkQuoteSheetConnection,
  createQuoteSheet,
  downloadQuoteAsPdf,
  downloadQuoteAsXlsx,
  downloadQuoteTemplateAsXlsx,
  getQuotePriceCatalog,
  importQuoteFromGoogleSheetUrl,
  importQuoteFromXlsx,
  mergeQuoteIntoIntake
} from "../services/QuoteService";
import type { InquiryIntake, InquiryQuoteCharge, InquiryQuoteLineItem, InquiryQuoteSnapshot, InquiryRow } from "../types";

const priceCatalog = getQuotePriceCatalog();

type InquiryQuoteEditorProps = {
  inquiry: InquiryRow;
  onSave: (intake: InquiryIntake) => Promise<void>;
};

const emptyCharge = (prefix: string, index: number): InquiryQuoteCharge => ({
  id: `${prefix}-${index + 1}-${Date.now()}`,
  label: "",
  qty: 1,
  unitPrice: 0,
  amount: 0
});

const emptyLineItem = (index: number): InquiryQuoteLineItem => ({
  id: `manual-line-${index + 1}-${Date.now()}`,
  sourceId: null,
  name: "",
  unit: "",
  qty: 1,
  unitPrice: 0,
  categoryTitle: null,
  note: null,
  materialNote: null
});

/** 피드백 문구가 오류성인지(빨간 배너로 강조) 판별 — 한국어 실패 표현 휴리스틱.
 * "확인"은 제외: 성공 안내("…아래 링크에서 확인하세요")에도 흔히 쓰여, 발행 성공 메시지가
 * 빨간 오류 배너로 잘못 표시되던 문제가 있었음. 실제 오류는 실패/못/없습니다 등으로 잡힌다. */
function isErrorFeedback(message: string): boolean {
  return /(실패|못|오류|않았|아직|없습니다|에러)/.test(message);
}

/** 발행 시점과 현재 견적의 내용 변화를 비교하기 위한 서명(시트 링크·시각 등 메타 제외). */
function quoteSignature(quote: InquiryQuoteSnapshot): string {
  return JSON.stringify({
    lineItems: quote.lineItems,
    materialCharges: quote.materialCharges,
    extraCharges: quote.extraCharges,
    profitRate: quote.profitRate,
    roundingAdjust: quote.roundingAdjust,
    vatManual: quote.vatManual,
    vatRate: quote.vatRate,
    depositManual: quote.depositManual,
    deposit: quote.deposit,
    workScale: quote.workScale,
    workPeriod: quote.workPeriod,
    memo: quote.memo
  });
}

type CatalogItem = (typeof priceCatalog)[number]["items"][number];

/** 가격표에서 항목 추가 — 검색 + 공종 그룹 + 클릭 추가하는 모던 드롭다운. */
function CatalogPicker({ onPick }: { onPick: (item: CatalogItem, group: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return priceCatalog;
    return priceCatalog
      .map((group) => ({ ...group, items: group.items.filter((item) => item.name.toLowerCase().includes(q) || group.serviceLabel.toLowerCase().includes(q)) }))
      .filter((group) => group.items.length);
  }, [query]);

  const totalCount = useMemo(() => groups.reduce((sum, group) => sum + group.items.length, 0), [groups]);

  return (
    <div className={open ? "catalog-picker catalog-picker--open" : "catalog-picker"} ref={rootRef}>
      <button type="button" className="catalog-picker__trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="catalog-picker__trigger-label">
          <Plus size={15} />
          가격표에서 항목 추가
        </span>
        <ChevronDown size={16} className={open ? "catalog-picker__chevron catalog-picker__chevron--open" : "catalog-picker__chevron"} />
      </button>
      {open ? (
        <div className="catalog-picker__panel">
          <div className="catalog-picker__search">
            <Search size={15} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="항목·공정 검색 (예: 타일, 수전, 도배)"
            />
          </div>
          <div className="catalog-picker__list">
            {groups.map((group) => (
              <div className="catalog-picker__group" key={group.servicePath}>
                <div className="catalog-picker__group-label">{group.serviceLabel}</div>
                {group.items.map((item, itemIndex) => (
                  <button
                    type="button"
                    className="catalog-picker__item"
                    key={`${group.servicePath}-${itemIndex}`}
                    onClick={() => onPick(item, group.serviceLabel)}
                  >
                    <span className="catalog-picker__item-name">{item.name}</span>
                    <span className="catalog-picker__item-meta">
                      {item.price.toLocaleString()}원/{item.unit}
                      {item.materialNote === "별도" ? <em className="catalog-picker__badge">자재별도</em> : null}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {totalCount === 0 ? <p className="catalog-picker__empty">검색 결과가 없습니다.</p> : null}
          </div>
          <div className="catalog-picker__foot">클릭하면 견적에 바로 추가됩니다 · 여러 개 연속 선택 가능</div>
        </div>
      ) : null}
    </div>
  );
}

export function InquiryQuoteEditor({ inquiry, onSave }: InquiryQuoteEditorProps) {
  const [draft, setDraft] = useState<InquiryQuoteSnapshot>(() => ensureEditableDraft(buildQuoteDraftFromInquiry(inquiry)));
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [checking, setChecking] = useState(false);
  // 발행 시점의 견적 서명. 이후 항목을 추가/수정하면 현재 서명과 달라져 '저장하기'로 전환된다.
  const [publishedSig, setPublishedSig] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totals = useMemo(() => calculateQuoteTotals(draft), [draft]);

  // 전체화면일 때 ESC로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  function addCatalogItem(item: (typeof priceCatalog)[number]["items"][number], group: string) {
    setDraft((current) => ({
      ...current,
      lineItems: [
        ...current.lineItems.filter((line) => line.name.trim() || line.unitPrice > 0),
        {
          id: `catalog-${item.name}-${Date.now()}`,
          sourceId: item.sourceId,
          name: item.name,
          unit: item.unit,
          qty: 1,
          unitPrice: item.price,
          categoryTitle: group,
          note: item.materialNote === "별도" ? "자재 별도" : item.note,
          materialNote: item.materialNote
        }
      ]
    }));
    setFeedback(`'${item.name}' 항목을 추가했습니다.`);
  }

  useEffect(() => {
    // 다른 문의로 전환될 때만 draft를 다시 시드한다. 같은 문의의 intake 참조 변경
    // (예: 메모 저장)에는 반응하지 않아야 편집 중인 견적이 날아가지 않는다.
    const seeded = ensureEditableDraft(buildQuoteDraftFromInquiry(inquiry));
    setDraft(seeded);
    // 이미 발행된 견적이면 로드 시점을 '발행 상태'로 간주(변경 전까지 저장 버튼 비노출).
    setPublishedSig(seeded.sheetUrl ? quoteSignature(seeded) : null);
    setFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiry.id]);

  function updateLineItem(index: number, patch: Partial<InquiryQuoteLineItem>) {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    }));
  }

  function addLineItem() {
    setDraft((current) => ({
      ...current,
      lineItems: [...current.lineItems, emptyLineItem(current.lineItems.length)]
    }));
  }

  function removeLineItem(index: number) {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function addCharge(kind: "materialCharges" | "extraCharges") {
    setDraft((current) => ({
      ...current,
      [kind]: [...current[kind], emptyCharge(kind === "materialCharges" ? "material" : "extra", current[kind].length)] as InquiryQuoteCharge[]
    }));
  }

  function updateCharge(kind: "materialCharges" | "extraCharges", index: number, patch: Partial<InquiryQuoteCharge>) {
    setDraft((current) => ({
      ...current,
      [kind]: current[kind].map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        if (kind === "materialCharges") {
          const next = { ...item, ...patch };
          const qty = Math.max(1, Math.round(Number(next.qty) || 1));
          const unitPrice = Math.max(0, Number(next.unitPrice) || 0);
          return { ...next, qty, unitPrice, amount: qty * unitPrice };
        }

        const nextUnitPrice = Math.max(0, Number(patch.unitPrice ?? item.unitPrice) || 0);
        return { ...item, ...patch, qty: 1, unitPrice: nextUnitPrice, amount: Math.max(0, Number(patch.amount ?? item.amount) || 0) };
      }) as InquiryQuoteCharge[]
    }));
  }

  function removeCharge(kind: "materialCharges" | "extraCharges", index: number) {
    setDraft((current) => ({
      ...current,
      [kind]: current[kind].filter((_, itemIndex) => itemIndex !== index) as InquiryQuoteCharge[]
    }));
  }

  function applyBasicTemplate() {
    setDraft(createBasicTemplateDraft(inquiry));
    setFeedback("기본 상담 견적 템플릿을 불러왔습니다.");
  }

  async function replaceQuoteFromFile(file: File) {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls")) {
      setFeedback("엑셀 파일만 불러올 수 있습니다.");
      return;
    }

    setImporting(true);
    setFeedback(null);
    try {
      const nextQuote = await importQuoteFromXlsx({ inquiry, file });
      setDraft(ensureEditableDraft(nextQuote));
      setFeedback("엑셀 견적을 불러왔습니다. 저장하면 문의 데이터가 갱신됩니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "엑셀 견적을 불러오지 못했습니다.");
    } finally {
      setImporting(false);
      setDragActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function importFromSheetUrl() {
    if (!sheetUrl.trim()) {
      setFeedback("구글 시트 링크를 입력해 주세요.");
      return;
    }
    setImporting(true);
    setFeedback(null);
    try {
      const nextQuote = await importQuoteFromGoogleSheetUrl({ inquiry, url: sheetUrl });
      setDraft(ensureEditableDraft(nextQuote));
      setFeedback("구글 시트 견적을 불러왔습니다. 저장하면 문의 데이터가 갱신됩니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "구글 시트를 불러오지 못했습니다.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void replaceQuoteFromFile(file);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    setDragActive(false);
    if (file) {
      void replaceQuoteFromFile(file);
    }
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const nextQuote: InquiryQuoteSnapshot = {
        ...draft,
        updatedAt: new Date().toISOString()
      };
      await onSave(mergeQuoteIntoIntake(inquiry.intake, nextQuote));
      setDraft(nextQuote);
      setFeedback("견적이 저장되었습니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "견적 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmToggle() {
    setSaving(true);
    setFeedback(null);
    try {
      const nextQuote: InquiryQuoteSnapshot = {
        ...draft,
        confirmedAt: draft.confirmedAt ? null : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await onSave(mergeQuoteIntoIntake(inquiry.intake, nextQuote));
      setDraft(nextQuote);
      setFeedback(nextQuote.confirmedAt ? "견적이 컨펌되었습니다. 고객 마이페이지에 노출됩니다." : "견적 컨펌을 취소했습니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "견적 컨펌을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleXlsxDownload() {
    await downloadQuoteAsXlsx({ inquiry, quote: draft, totals });
  }

  async function handleTemplateDownload() {
    await downloadQuoteTemplateAsXlsx();
  }

  async function handlePdfDownload() {
    await downloadQuoteAsPdf({ inquiry, quote: draft, totals });
  }

  async function handleCheckConnection() {
    setChecking(true);
    setFeedback(null);
    try {
      const result = await checkQuoteSheetConnection();
      setFeedback(result.ok ? `구글시트 연동 정상 — ${result.message}` : `구글시트 연동 오류 — ${result.message}`);
    } finally {
      setChecking(false);
    }
  }

  async function handlePublishSheet() {
    setPublishing(true);
    setFeedback(null);
    try {
      const { sheetUrl: createdSheetUrl, pdfUrl } = await createQuoteSheet({ inquiry, quote: draft });
      const nextQuote: InquiryQuoteSnapshot = { ...draft, sheetUrl: createdSheetUrl, pdfUrl, updatedAt: new Date().toISOString() };
      await onSave(mergeQuoteIntoIntake(inquiry.intake, nextQuote));
      setDraft(nextQuote);
      setPublishedSig(quoteSignature(nextQuote));
      setFeedback("구글시트 견적서를 생성했습니다. 아래 링크에서 확인하세요.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "구글시트 생성에 실패했습니다.");
    } finally {
      setPublishing(false);
    }
  }

  const sourceLabel = buildQuoteSourceLabel(draft);
  // 자재비를 묶을 수 있는 공종 목록(현재 라인 항목의 공사명들).
  const workCategories = Array.from(
    new Set(draft.lineItems.map((item) => item.categoryTitle).filter((title): title is string => Boolean(title && title.trim())))
  );
  // 발행 후 항목/금액이 바뀌었는지 — 바뀌면 '구글시트 저장하기'로 전환해 변경분을 반영 발행.
  const sheetChangedSincePublish = Boolean(draft.sheetUrl) && publishedSig !== null && quoteSignature(draft) !== publishedSig;
  const publishLabel = publishing
    ? draft.sheetUrl
      ? "저장 중"
      : "발행 중"
    : !draft.sheetUrl
      ? "구글시트로 발행"
      : sheetChangedSincePublish
        ? "구글시트 저장하기"
        : "구글시트 재발행";

  const editorBody = (
    <section
      className={fullscreen ? "quote-editor quote-editor--fullscreen" : "quote-editor"}
      aria-labelledby={`quote-editor-${inquiry.id}`}
    >
      <div className="quote-editor__header">
        <div>
          <span className="admin-kicker">견적 편집</span>
          <h3 id={`quote-editor-${inquiry.id}`}>엑셀 표처럼 편집하고 바로 다운로드합니다</h3>
          <p>
            선택 항목을 견적서 초안으로 불러와 자재비와 부대비용을 바로 수정할 수 있습니다. 엑셀 파일을 드래그 앤 드롭하면 현재 견적 초안을 그 내용으로 교체할 수 있습니다. 저장한 내용은 문의의 `intake.quoteSnapshot`에 보관됩니다.
          </p>
        </div>
        <div className="quote-editor__actions">
          <button className="admin-status-button quote-editor__action--primary" type="button" onClick={() => void handleSave()} disabled={saving}>
            <Save size={14} />
            {saving ? "저장 중" : "견적 저장"}
          </button>
          <button className="admin-status-button" type="button" onClick={() => void handleXlsxDownload()}>
            <Download size={14} />
            엑셀 다운로드
          </button>
          <button className="admin-status-button" type="button" onClick={() => void handleTemplateDownload()}>
            <Download size={14} />
            샘플 템플릿
          </button>
          <button className="admin-status-button" type="button" onClick={() => void handlePdfDownload()}>
            <Download size={14} />
            PDF 다운로드
          </button>
          <button
            className={
              !draft.sheetUrl || sheetChangedSincePublish
                ? "admin-status-button quote-editor__action--accent"
                : "admin-status-button"
            }
            type="button"
            onClick={() => void handlePublishSheet()}
            disabled={publishing}
            title={sheetChangedSincePublish ? "변경된 내용으로 구글시트를 다시 발행합니다" : undefined}
          >
            <FileSpreadsheet size={14} />
            {publishLabel}
            {sheetChangedSincePublish ? " ●" : ""}
          </button>
          <button className="admin-status-button" type="button" onClick={() => void handleCheckConnection()} disabled={checking} title="발행 누르지 않고 구글시트 연동 상태만 확인">
            <PlugZap size={14} />
            {checking ? "점검 중" : "연동 점검"}
          </button>
          <button className="admin-status-button" type="button" onClick={applyBasicTemplate} disabled={saving || importing}>
            <Plus size={14} />
            기본 템플릿
          </button>
          <button className="admin-status-button" type="button" onClick={() => setFullscreen((value) => !value)}>
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {fullscreen ? "축소" : "전체 화면"}
          </button>
          <button className="admin-primary-button quote-editor__confirm-button" type="button" onClick={() => void handleConfirmToggle()} disabled={saving}>
            <CheckCircle2 size={14} />
            {draft.confirmedAt ? "컨펌 취소" : "견적 컨펌"}
          </button>
          {fullscreen ? (
            <button className="admin-status-button quote-editor__close" type="button" onClick={() => setFullscreen(false)} aria-label="전체 화면 닫기">
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p
          className={`quote-editor__feedback ${isErrorFeedback(feedback) ? "quote-editor__feedback--error" : "quote-editor__feedback--ok"}`}
          role="status"
          aria-live="polite"
        >
          {feedback}
        </p>
      ) : null}

      <div className="quote-editor__meta">
        <span>출처: {sourceLabel}</span>
        <span>기준: {draft.selectedWorks.length ? draft.selectedWorks.join(", ") : "직접 작성"}</span>
        <span>{draft.confirmedAt ? `컨펌일: ${new Date(draft.confirmedAt).toLocaleString("ko-KR")}` : "컨펌 전"}</span>
        <span>최종 수정: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("ko-KR") : "-"}</span>
        {draft.sheetUrl ? (
          <a className="quote-editor__sheet-link" href={draft.sheetUrl} target="_blank" rel="noreferrer">
            구글시트 견적서 <ExternalLink size={12} />
          </a>
        ) : null}
        {draft.pdfUrl ? (
          <a className="quote-editor__sheet-link" href={draft.pdfUrl} target="_blank" rel="noreferrer">
            PDF <ExternalLink size={12} />
          </a>
        ) : null}
      </div>

      <div className="quote-editor__info">
        <label>
          <span>공사 규모</span>
          <input
            className="quote-field"
            value={draft.workScale ?? ""}
            placeholder="예: 24평 아파트 · 욕실 1개"
            onChange={(event) => setDraft((current) => ({ ...current, workScale: event.target.value }))}
          />
        </label>
        <label>
          <span>총 공사기간</span>
          <input
            className="quote-field"
            value={draft.workPeriod ?? ""}
            placeholder="예: 3일 / 약 2주"
            onChange={(event) => setDraft((current) => ({ ...current, workPeriod: event.target.value }))}
          />
        </label>
      </div>

      <div
        className={dragActive ? "editor-upload-field active quote-editor__upload" : "editor-upload-field quote-editor__upload"}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
      >
        <label className="editor-upload-trigger quote-editor__dropzone">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileInputChange}
            disabled={importing}
          />
          <strong>엑셀 드래그 앤 드롭으로 견적 교체</strong>
          <span className="editor-upload-hint">
            엑셀 견적서를 넣으면 현재 초안을 그 내용으로 바꿉니다. {importing ? "불러오는 중..." : "클릭해서 파일을 선택할 수도 있습니다."}
          </span>
        </label>
        <button className="admin-status-button quote-editor__upload-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}>
          <FileUp size={14} />
          {importing ? "불러오는 중" : "엑셀 불러오기"}
        </button>
      </div>

      <div className="quote-editor__gsheet">
        <input
          className="quote-field"
          type="url"
          value={sheetUrl}
          onChange={(event) => setSheetUrl(event.target.value)}
          placeholder="구글 시트 링크 붙여넣기 (https://docs.google.com/spreadsheets/d/...)"
          disabled={importing}
        />
        <button className="admin-status-button" type="button" onClick={() => void importFromSheetUrl()} disabled={importing || !sheetUrl.trim()}>
          <FileUp size={14} />
          구글 시트 불러오기
        </button>
        <span className="quote-editor__gsheet-hint">시트를 ‘링크가 있는 모든 사용자: 보기’로 공유하고, 샘플 템플릿과 같은 형식이어야 합니다.</span>
      </div>

      <CatalogPicker onPick={(item, label) => addCatalogItem(item, label)} />

      <p className="quote-editor__section">견적 항목</p>
      <div className="quote-editor__table-wrap">
        <div className="quote-editor__table-toolbar">
          <span className="quote-editor__table-hint">
            {draft.lineItems.length ? "라인 항목을 직접 수정하거나 추가할 수 있습니다." : "아래 버튼으로 견적 항목을 추가하세요."}
          </span>
          <button className="admin-status-button" type="button" onClick={addLineItem}>
            <Plus size={14} />
            빈 항목 추가
          </button>
        </div>
        <table className="quote-editor__table">
          <thead>
            <tr>
              <th>항목</th>
              <th>단위</th>
              <th>수량</th>
              <th>단가</th>
              <th>금액</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {draft.lineItems.length ? draft.lineItems.map((item, index) => {
              const amount = item.qty * item.unitPrice;
              return (
                <tr key={item.id}>
                  <td>
                    <input className="quote-field" value={item.name} onChange={(event) => updateLineItem(index, { name: event.target.value })} />
                  </td>
                  <td>
                    <input className="quote-field" value={item.unit} onChange={(event) => updateLineItem(index, { unit: event.target.value })} />
                  </td>
                  <td>
                    <input
                      className="quote-field quote-field--number"
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(event) => updateLineItem(index, { qty: Math.max(1, Number(event.target.value) || 1) })}
                    />
                  </td>
                  <td>
                    <input
                      className="quote-field quote-field--number"
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(event) => updateLineItem(index, { unitPrice: Math.max(0, Number(event.target.value) || 0) })}
                    />
                  </td>
                  <td>{amount.toLocaleString()}원</td>
                  <td>
                    <div className="quote-editor__lineitem-note">
                      <textarea
                        className="quote-field quote-editor__note-field"
                        rows={1}
                        value={item.note ?? ""}
                        placeholder="비고"
                        onChange={(event) => updateLineItem(index, { note: event.target.value || null })}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto";
                            el.style.height = `${el.scrollHeight}px`;
                          }
                        }}
                      />
                      <button className="admin-status-button" type="button" onClick={() => removeLineItem(index)} disabled={draft.lineItems.length === 1}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6}>
                  <div className="quote-editor__empty-state">
                    <p>모의 견적이 없는 문의입니다. 새 견적 항목을 추가해서 상담 견적서를 작성할 수 있습니다.</p>
                    <button className="admin-status-button" type="button" onClick={addLineItem}>
                      <Plus size={14} />
                      첫 항목 추가
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="quote-editor__section">추가 비용 · 자재 / 부대</p>
      <div className="quote-editor__grid">
        <div className="quote-editor__panel">
          <div className="quote-editor__panel-head">
            <strong>자재비</strong>
            <button className="admin-status-button" type="button" onClick={() => addCharge("materialCharges")}>
              <Plus size={14} />
              추가
            </button>
          </div>
          <div className="quote-editor__charge-list">
            {draft.materialCharges.length ? draft.materialCharges.map((item, index) => (
              <div className="quote-editor__charge-row quote-editor__charge-row--material" key={item.id}>
                <select
                  className="quote-field"
                  value={item.group ?? ""}
                  onChange={(event) => updateCharge("materialCharges", index, { group: event.target.value || undefined })}
                  title="이 자재비를 묶을 공종(상세내역에서 해당 작업에 합쳐집니다)"
                >
                  <option value="">자재(별도)</option>
                  {workCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}에 포함
                    </option>
                  ))}
                </select>
                <input className="quote-field" value={item.label} onChange={(event) => updateCharge("materialCharges", index, { label: event.target.value })} placeholder="자재명" />
                <input className="quote-field quote-field--number" type="number" min={1} value={item.qty} onChange={(event) => updateCharge("materialCharges", index, { qty: Math.max(1, Number(event.target.value) || 1) })} />
                <input className="quote-field quote-field--number" type="number" min={0} value={item.unitPrice} onChange={(event) => updateCharge("materialCharges", index, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} />
                <span className="quote-editor__charge-total">{item.amount.toLocaleString()}원</span>
                <button className="admin-status-button" type="button" onClick={() => removeCharge("materialCharges", index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )) : <p className="quote-editor__empty">자재비 항목이 없습니다.</p>}
          </div>
        </div>

        <div className="quote-editor__panel">
          <div className="quote-editor__panel-head">
            <strong>부대비용</strong>
            <button className="admin-status-button" type="button" onClick={() => addCharge("extraCharges")}>
              <Plus size={14} />
              추가
            </button>
          </div>
          <div className="quote-editor__charge-list">
            {draft.extraCharges.length ? draft.extraCharges.map((item, index) => (
              <div className="quote-editor__charge-row" key={item.id}>
                <input className="quote-field" value={item.label} onChange={(event) => updateCharge("extraCharges", index, { label: event.target.value })} placeholder="부대비용명" />
                <input className="quote-field quote-field--number" type="number" min={0} value={item.amount} onChange={(event) => updateCharge("extraCharges", index, { amount: Math.max(0, Number(event.target.value) || 0) })} />
                <button className="admin-status-button" type="button" onClick={() => removeCharge("extraCharges", index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            )) : <p className="quote-editor__empty">부대비용 항목이 없습니다.</p>}
          </div>
        </div>
      </div>

      <p className="quote-editor__section">금액 요약</p>
      <div className="quote-editor__summary">
        <div>
          <span>공사비합계</span>
          <strong>{totals.workCost.toLocaleString()}원</strong>
        </div>
        <label>
          <span>이윤율(%)</span>
          <input
            className="quote-field quote-field--number"
            type="number"
            min={0}
            max={100}
            step={1}
            value={Math.round((draft.profitRate ?? 0.08) * 100)}
            onChange={(event) => setDraft((current) => ({ ...current, profitRate: Math.min(100, Math.max(0, Number(event.target.value) || 0)) / 100 }))}
          />
        </label>
        <div>
          <span>이윤</span>
          <strong>{totals.profit.toLocaleString()}원</strong>
        </div>
        <label>
          <span>절삭</span>
          <input
            className="quote-field quote-field--number"
            type="number"
            value={totals.rounding}
            onChange={(event) => setDraft((current) => ({ ...current, roundingAdjust: Number(event.target.value) || 0 }))}
          />
        </label>
        <div>
          <span>합계(부가세 별도)</span>
          <strong>{totals.subtotal.toLocaleString()}원</strong>
        </div>
        <div>
          <span>
            부가세{draft.vatManual ? "" : "(10%)"}
            <label className="quote-editor__manual-toggle">
              <input
                type="checkbox"
                checked={draft.vatManual ?? false}
                onChange={(event) => setDraft((current) => ({ ...current, vatManual: event.target.checked }))}
              />
              직접
            </label>
          </span>
          {draft.vatManual ? (
            <input
              className="quote-field quote-field--number"
              type="number"
              min={0}
              max={100}
              step={1}
              value={Math.round((draft.vatRate ?? 0.1) * 100)}
              onChange={(event) => setDraft((current) => ({ ...current, vatRate: Math.min(100, Math.max(0, Number(event.target.value) || 0)) / 100 }))}
            />
          ) : (
            <strong>{totals.vat.toLocaleString()}원</strong>
          )}
        </div>
        <div className="quote-editor__summary-headline">
          <span>합계금액(부가세 포함)</span>
          <strong>{totals.total.toLocaleString()}원</strong>
        </div>
        <div>
          <span>
            계약금{draft.depositManual ? "" : "(30%)"}
            <label className="quote-editor__manual-toggle">
              <input
                type="checkbox"
                checked={draft.depositManual ?? false}
                onChange={(event) => setDraft((current) => ({ ...current, depositManual: event.target.checked }))}
              />
              직접
            </label>
          </span>
          {draft.depositManual ? (
            <input
              className="quote-field quote-field--number"
              type="number"
              min={0}
              value={draft.deposit ?? 0}
              onChange={(event) => setDraft((current) => ({ ...current, deposit: Math.max(0, Number(event.target.value) || 0) }))}
            />
          ) : (
            <strong>{totals.deposit.toLocaleString()}원</strong>
          )}
        </div>
        <div>
          <span>잔금</span>
          <strong>{totals.balance.toLocaleString()}원</strong>
        </div>
      </div>

      <label className="quote-editor__memo">
        메모
        <textarea
          rows={3}
          className="quote-field"
          value={draft.memo}
          onChange={(event) => setDraft((current) => ({ ...current, memo: event.target.value }))}
          placeholder="견적 조건, 자재 선택 이유, 추가 안내 등을 적습니다."
        />
      </label>
    </section>
  );

  if (!fullscreen || typeof document === "undefined") return editorBody;
  // 문의 상세 드로어가 transform/fixed로 포함 블록을 만들어 position:fixed가 갇히므로
  // body로 포털해 진짜 전체 화면 오버레이로 띄운다.
  return createPortal(
    <div
      // body로 포털되면 .adm-root 밖이라 어드민 토큰/다크 오버라이드가 끊긴다.
      // adm-root를 함께 부여해 토큰·다크 스타일을 그대로 재사용한다(백드롭은 CSS로 복구).
      className="quote-editor__overlay adm-root"
      role="dialog"
      aria-modal="true"
      onClick={(event) => {
        if (event.target === event.currentTarget) setFullscreen(false);
      }}
    >
      {editorBody}
    </div>,
    document.body
  );
}

function ensureEditableDraft(quote: InquiryQuoteSnapshot): InquiryQuoteSnapshot {
  if (quote.lineItems.length > 0) {
    return quote;
  }

  return {
    ...quote,
    lineItems: [emptyLineItem(0)]
  };
}

function createBasicTemplateDraft(inquiry: InquiryRow): InquiryQuoteSnapshot {
  return {
    sourceServicePath: null,
    sourcePricingPath: null,
    sourceServiceLabel: null,
    confirmedAt: null,
    selectedWorks: [],
    selectedWorkIds: [],
    lineItems: [
      {
        ...emptyLineItem(0),
        name: "상담 및 현장 확인",
        unit: "건",
        qty: 1,
        unitPrice: 0,
        note: "기본 상담 템플릿"
      },
      {
        ...emptyLineItem(1),
        name: "기본 시공비",
        unit: "식",
        qty: 1,
        unitPrice: 0,
        note: "필요 시 금액을 입력하세요"
      }
    ],
    materialCharges: [
      {
        ...emptyCharge("material", 0),
        label: "기본 자재비",
        qty: 1,
        unitPrice: 0,
        amount: 0
      }
    ],
    extraCharges: [],
    vatRate: 0.1,
    memo: "",
    updatedAt: inquiry.created_at ?? new Date().toISOString()
  };
}
