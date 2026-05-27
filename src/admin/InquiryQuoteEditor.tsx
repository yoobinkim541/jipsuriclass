import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Save, Trash2 } from "lucide-react";
import { buildQuoteDraftFromInquiry, buildQuoteSourceLabel, calculateQuoteTotals, downloadQuoteAsPdf, downloadQuoteAsXlsx, mergeQuoteIntoIntake } from "../services/QuoteService";
import type { InquiryIntake, InquiryQuoteCharge, InquiryQuoteLineItem, InquiryQuoteSnapshot, InquiryRow } from "../types";

type InquiryQuoteEditorProps = {
  inquiry: InquiryRow;
  onSave: (intake: InquiryIntake) => Promise<void>;
};

const emptyCharge = (prefix: string, index: number): InquiryQuoteCharge => ({
  id: `${prefix}-${index + 1}-${Date.now()}`,
  label: "",
  amount: 0
});

export function InquiryQuoteEditor({ inquiry, onSave }: InquiryQuoteEditorProps) {
  const [draft, setDraft] = useState<InquiryQuoteSnapshot>(() => buildQuoteDraftFromInquiry(inquiry));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const totals = useMemo(() => calculateQuoteTotals(draft), [draft]);

  useEffect(() => {
    setDraft(buildQuoteDraftFromInquiry(inquiry));
    setFeedback(null);
  }, [inquiry.id, inquiry.intake]);

  function updateLineItem(index: number, patch: Partial<InquiryQuoteLineItem>) {
    setDraft((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
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
      [kind]: current[kind].map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) as InquiryQuoteCharge[]
    }));
  }

  function removeCharge(kind: "materialCharges" | "extraCharges", index: number) {
    setDraft((current) => ({
      ...current,
      [kind]: current[kind].filter((_, itemIndex) => itemIndex !== index) as InquiryQuoteCharge[]
    }));
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

  async function handleXlsxDownload() {
    await downloadQuoteAsXlsx({ inquiry, quote: draft, totals });
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
            선택 항목을 견적서 초안으로 불러와 자재비와 부대비용을 바로 수정할 수 있습니다. 저장한 내용은 문의의 `intake.quoteSnapshot`에 보관됩니다.
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
          <button className="admin-status-button" type="button" onClick={() => void handlePdfDownload()}>
            <Download size={14} />
            PDF 다운로드
          </button>
        </div>
      </div>

      <div className="quote-editor__meta">
        <span>출처: {sourceLabel}</span>
        <span>선택 항목: {draft.selectedWorks.length ? draft.selectedWorks.join(", ") : "-"}</span>
        <span>최종 수정: {draft.updatedAt ? new Date(draft.updatedAt).toLocaleString("ko-KR") : "-"}</span>
      </div>

      <div className="quote-editor__table-wrap">
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
            {draft.lineItems.map((item, index) => {
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
                    <input className="quote-field" value={item.note ?? ""} onChange={(event) => updateLineItem(index, { note: event.target.value || null })} />
                  </td>
                </tr>
              );
            })}
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
              <div className="quote-editor__charge-row" key={item.id}>
                <input className="quote-field" value={item.label} onChange={(event) => updateCharge("materialCharges", index, { label: event.target.value })} placeholder="자재명" />
                <input className="quote-field quote-field--number" type="number" min={0} value={item.amount} onChange={(event) => updateCharge("materialCharges", index, { amount: Math.max(0, Number(event.target.value) || 0) })} />
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
