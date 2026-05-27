import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { CheckCircle2, Download, FileUp, Plus, Save, Trash2 } from "lucide-react";
import {
  buildQuoteDraftFromInquiry,
  buildQuoteSourceLabel,
  calculateQuoteTotals,
  downloadQuoteAsPdf,
  downloadQuoteAsXlsx,
  downloadQuoteTemplateAsXlsx,
  importQuoteFromXlsx,
  mergeQuoteIntoIntake
} from "../services/QuoteService";
import type { InquiryIntake, InquiryQuoteCharge, InquiryQuoteLineItem, InquiryQuoteSnapshot, InquiryRow } from "../types";

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

export function InquiryQuoteEditor({ inquiry, onSave }: InquiryQuoteEditorProps) {
  const [draft, setDraft] = useState<InquiryQuoteSnapshot>(() => ensureEditableDraft(buildQuoteDraftFromInquiry(inquiry)));
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const totals = useMemo(() => calculateQuoteTotals(draft), [draft]);

  useEffect(() => {
    setDraft(ensureEditableDraft(buildQuoteDraftFromInquiry(inquiry)));
    setFeedback(null);
  }, [inquiry.id, inquiry.intake]);

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

  const sourceLabel = buildQuoteSourceLabel(draft);

  return (
    <section className="quote-editor" aria-labelledby={`quote-editor-${inquiry.id}`}>
      <div className="quote-editor__header">
        <div>
          <span className="admin-kicker">견적 편집</span>
          <h3 id={`quote-editor-${inquiry.id}`}>엑셀 표처럼 편집하고 바로 다운로드합니다</h3>
          <p>
            선택 항목을 견적서 초안으로 불러와 자재비와 부대비용을 바로 수정할 수 있습니다. 엑셀 파일을 드래그 앤 드롭하면 현재 견적 초안을 그 내용으로 교체할 수 있습니다. 저장한 내용은 문의의 `intake.quoteSnapshot`에 보관됩니다.
          </p>
        </div>
        <div className="quote-editor__actions">
          <button className="admin-status-button" type="button" onClick={() => void handleSave()} disabled={saving}>
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
          <button className="admin-status-button" type="button" onClick={applyBasicTemplate} disabled={saving || importing}>
            <Plus size={14} />
            기본 템플릿
          </button>
          <button className="admin-primary-button quote-editor__confirm-button" type="button" onClick={() => void handleConfirmToggle()} disabled={saving}>
            <CheckCircle2 size={14} />
            {draft.confirmedAt ? "컨펌 취소" : "견적 컨펌"}
          </button>
        </div>
      </div>

      <div className="quote-editor__meta">
        <span>출처: {sourceLabel}</span>
        <span>기준: {draft.selectedWorks.length ? draft.selectedWorks.join(", ") : "직접 작성"}</span>
        <span>{draft.confirmedAt ? `컨펌일: ${new Date(draft.confirmedAt).toLocaleString("ko-KR")}` : "컨펌 전"}</span>
        <span>최종 수정: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("ko-KR") : "-"}</span>
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

      <div className="quote-editor__table-wrap">
        <div className="quote-editor__table-toolbar">
          <span className="quote-editor__table-hint">
            {draft.lineItems.length ? "라인 항목을 직접 수정하거나 추가할 수 있습니다." : "아래 버튼으로 견적 항목을 추가하세요."}
          </span>
          <button className="admin-status-button" type="button" onClick={addLineItem}>
            <Plus size={14} />
            항목 추가
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
                      <input className="quote-field" value={item.note ?? ""} onChange={(event) => updateLineItem(index, { note: event.target.value || null })} />
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

      <div className="quote-editor__summary">
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

      {feedback ? <p className="quote-editor__feedback">{feedback}</p> : null}
    </section>
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
