import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardList, Home, LayoutGrid, LoaderCircle, PencilLine, RotateCcw, Save, UserRound } from "lucide-react";
import { HomepageEditor } from "./HomepageEditor";
import { LandingPagesEditor } from "./LandingPagesEditor";
import { SiteContentService, defaultAccountPageContent, defaultEstimatePageContent } from "../services/SiteContentService";
import type { AccountPageContent, EstimatePageContent } from "../types";

const siteContentService = new SiteContentService();
const AUTOSAVE_DELAY = 1200;

type EditorPage = "homepage" | "landing" | "account" | "estimate";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function SiteContentEditor({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [page, setPage] = useState<EditorPage>("homepage");
  const pageTabs = [
    { key: "homepage" as const, icon: Home, title: "홈페이지", caption: "메인 섹션과 사진" },
    { key: "landing" as const, icon: LayoutGrid, title: "랜딩페이지", caption: "서비스·지역 페이지" },
    { key: "account" as const, icon: UserRound, title: "마이페이지", caption: "계정과 문의 내역" },
    { key: "estimate" as const, icon: ClipboardList, title: "견적상담", caption: "신청서와 약관" }
  ];

  return (
    <section className="site-content-editor">
      <div className="editor-page-tabs" aria-label="페이지 편집 이동">
        {pageTabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={page === item.key ? "editor-page-tab active" : "editor-page-tab"}
              key={item.key}
              type="button"
              onClick={() => setPage(item.key)}
            >
              <Icon size={18} />
              <span>
                <strong>{item.title}</strong>
                <em>{item.caption}</em>
              </span>
            </button>
          );
        })}
      </div>

      {page === "homepage" ? <HomepageEditor isAuthenticated={isAuthenticated} /> : null}
      {page === "landing" ? <LandingPagesEditor isAuthenticated={isAuthenticated} /> : null}
      {page === "account" ? <AccountContentEditor isAuthenticated={isAuthenticated} /> : null}
      {page === "estimate" ? <EstimateContentEditor isAuthenticated={isAuthenticated} /> : null}
    </section>
  );
}

function AccountContentEditor({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<AccountPageContent>(defaultAccountPageContent);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultAccountPageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadAccountContent()
      .then((content) => {
        if (!mounted) return;
        setDraft(content);
        draftRef.current = content;
        lastSavedRef.current = JSON.stringify(content);
        setSaveState("saved");
        setSaveNote("현재 내용이 저장되어 있습니다.");
        setLastSavedAt(new Date().toISOString());
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "편집 내용을 불러오지 못했습니다.");
        setSaveState("error");
        setSaveNote("불러오기에 실패했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const snapshot = JSON.stringify(draft);
    if (snapshot === lastSavedRef.current) {
      if (saveState !== "saving") {
        setSaveState("saved");
        setSaveNote("현재 내용이 저장되어 있습니다.");
      }
      return;
    }

    setSaveState("dirty");
    setSaveNote("변경 내용을 자동 저장합니다.");
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void persistDraft("auto");
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isAuthenticated, loading]);

  async function persistDraft(mode: "auto" | "manual") {
    const payload = draftRef.current;
    const snapshot = JSON.stringify(payload);
    setSaving(true);
    setError(null);
    setSaveState("saving");
    setSaveNote(mode === "auto" ? "자동 저장 중입니다." : "저장 중입니다.");

    try {
      await siteContentService.saveAccountContent(payload);
      lastSavedRef.current = snapshot;
      setSaveState("saved");
      setSaveNote(mode === "auto" ? "자동 저장되었습니다." : "저장되었습니다.");
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => {
        if (lastSavedRef.current === snapshot) {
          setSaveNote("현재 내용이 저장되어 있습니다.");
        }
      }, 2200);
    } catch (saveError) {
      setSaveState("error");
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
      setSaveNote("저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function markEdited() {
    if (saveState !== "saving") {
      setSaveState("dirty");
      setSaveNote("변경 내용을 자동 저장합니다.");
    }
  }

  function updateHero(field: keyof AccountPageContent["hero"], value: string | string[]) {
    setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));
    markEdited();
  }

  function updateAuth(field: keyof AccountPageContent["auth"], value: string) {
    setDraft((current) => ({ ...current, auth: { ...current.auth, [field]: value } }));
    markEdited();
  }

  function updateSummary(index: number, field: "label" | "description", value: string) {
    setDraft((current) => {
      const summary = current.summary.slice();
      summary[index] = { ...(summary[index] ?? { label: "", description: "" }), [field]: value };
      return { ...current, summary };
    });
    markEdited();
  }

  function updateList(field: keyof AccountPageContent["list"], value: string) {
    setDraft((current) => ({ ...current, list: { ...current.list, [field]: value } }));
    markEdited();
  }

  function updateIntakeLabel(field: keyof AccountPageContent["intakeLabels"], value: string) {
    setDraft((current) => ({ ...current, intakeLabels: { ...current.intakeLabels, [field]: value } }));
    markEdited();
  }

  function resetDraft() {
    setDraft(defaultAccountPageContent);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
    setError(null);
  }

  return (
    <section className="editor-shell" aria-labelledby="account-editor-title">
      <div className="editor-header">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            마이페이지 편집기
          </span>
          <h2 id="account-editor-title">마이페이지의 문구와 안내를 바로 수정합니다</h2>
          <p>로그인 안내, 요약 카드, 문의 목록 라벨을 모두 관리할 수 있습니다.</p>
          <div className="editor-save-state" aria-live="polite">
            <span data-state={saveState}>
              {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
            </span>
            <p>{saveNote}</p>
            {lastSavedAt ? <em>최근 저장 {formatEditorTime(lastSavedAt)}</em> : null}
          </div>
        </div>
        <div className="editor-actions">
          <button className="admin-ghost-button" type="button" onClick={resetDraft} disabled={!isAuthenticated || loading || saving}>
            <RotateCcw size={16} />
            기본값
          </button>
          <button className="admin-primary-button" type="button" onClick={() => void persistDraft("manual")} disabled={!isAuthenticated || loading || saving}>
            {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {saving ? "저장 중" : "즉시 저장"}
          </button>
        </div>
      </div>

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {loading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          편집 내용을 불러오는 중
        </div>
      ) : (
        <div className="editor-workspace editor-workspace-single">
          <aside className="editor-inspector editor-inspector-full">
            <InspectorGroup title="상단 소개">
              <Field label="배지">
                <input value={draft.hero.kicker} onChange={(event) => updateHero("kicker", event.target.value)} />
              </Field>
              <Field label="제목">
                <input value={draft.hero.title} onChange={(event) => updateHero("title", event.target.value)} />
              </Field>
              <Field label="설명">
                <textarea rows={4} value={draft.hero.description} onChange={(event) => updateHero("description", event.target.value)} />
              </Field>
              <Field label="안내 문구">
                <textarea rows={3} value={draft.hero.notes.join("\n")} onChange={(event) => updateHero("notes", normalizeLines(event.target.value, 3))} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="로그인 카드">
              {Object.entries(draft.auth).map(([key, value]) =>
                key === "loadingText" || key === "currentLoginLabel" || key === "collapseLabel" || key === "expandLabel" || key === "passwordLabel" || key === "passwordPlaceholder" || key === "passwordSaveLabel" || key === "googleConnectLabel" || key === "passwordSavingLabel" || key === "googleConnectingLabel" || key === "accountMessageEmptyText" || key === "collapsedNote" || key === "noSessionLabel" || key === "noSessionTitle" || key === "noSessionDescription" || key === "loginLinkLabel" ? (
                  <EditableTextField
                    key={key}
                    label={labelForAccountAuth(key as keyof AccountPageContent["auth"])}
                    value={String(value)}
                    multiline={isLongEditorField(key, String(value))}
                    onChange={(nextValue) => updateAuth(key as keyof AccountPageContent["auth"], nextValue)}
                  />
                ) : null
              )}
            </InspectorGroup>

            <InspectorGroup title="요약 카드">
              {draft.summary.map((item, index) => (
                <div className="editor-inline-card" key={index}>
                  <Field label={`제목 ${index + 1}`}>
                    <input value={item.label} onChange={(event) => updateSummary(index, "label", event.target.value)} />
                  </Field>
                  <Field label={`설명 ${index + 1}`}>
                    <textarea rows={3} value={item.description} onChange={(event) => updateSummary(index, "description", event.target.value)} />
                  </Field>
                </div>
              ))}
            </InspectorGroup>

            <InspectorGroup title="문의 목록">
              {Object.entries(draft.list).map(([key, value]) => (
                <EditableTextField
                  key={key}
                  label={labelForAccountList(key as keyof AccountPageContent["list"])}
                  value={String(value)}
                  multiline={isLongEditorField(key, String(value))}
                  onChange={(nextValue) => updateList(key as keyof AccountPageContent["list"], nextValue)}
                />
              ))}
            </InspectorGroup>

            <InspectorGroup title="설문 라벨">
              {Object.entries(draft.intakeLabels).map(([key, value]) => (
                <Field key={key} label={labelForIntake(key as keyof AccountPageContent["intakeLabels"])}>
                  <input value={String(value)} onChange={(event) => updateIntakeLabel(key as keyof AccountPageContent["intakeLabels"], event.target.value)} />
                </Field>
              ))}
            </InspectorGroup>
          </aside>
        </div>
      )}
    </section>
  );
}

function EstimateContentEditor({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<EstimatePageContent>(defaultEstimatePageContent);
  const [selectedStep, setSelectedStep] = useState(0);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultEstimatePageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadEstimateContent()
      .then((content) => {
        if (!mounted) return;
        setDraft(content);
        draftRef.current = content;
        lastSavedRef.current = JSON.stringify(content);
        setSaveState("saved");
        setSaveNote("현재 내용이 저장되어 있습니다.");
        setLastSavedAt(new Date().toISOString());
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "편집 내용을 불러오지 못했습니다.");
        setSaveState("error");
        setSaveNote("불러오기에 실패했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const snapshot = JSON.stringify(draft);
    if (snapshot === lastSavedRef.current) {
      if (saveState !== "saving") {
        setSaveState("saved");
        setSaveNote("현재 내용이 저장되어 있습니다.");
      }
      return;
    }

    setSaveState("dirty");
    setSaveNote("변경 내용을 자동 저장합니다.");
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      void persistDraft("auto");
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isAuthenticated, loading]);

  async function persistDraft(mode: "auto" | "manual") {
    const payload = draftRef.current;
    const snapshot = JSON.stringify(payload);
    setSaving(true);
    setError(null);
    setSaveState("saving");
    setSaveNote(mode === "auto" ? "자동 저장 중입니다." : "저장 중입니다.");

    try {
      await siteContentService.saveEstimateContent(payload);
      lastSavedRef.current = snapshot;
      setSaveState("saved");
      setSaveNote(mode === "auto" ? "자동 저장되었습니다." : "저장되었습니다.");
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => {
        if (lastSavedRef.current === snapshot) {
          setSaveNote("현재 내용이 저장되어 있습니다.");
        }
      }, 2200);
    } catch (saveError) {
      setSaveState("error");
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
      setSaveNote("저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function markEdited() {
    if (saveState !== "saving") {
      setSaveState("dirty");
      setSaveNote("변경 내용을 자동 저장합니다.");
    }
  }

  function updateHeader(field: keyof EstimatePageContent["header"], value: string) {
    setDraft((current) => ({ ...current, header: { ...current.header, [field]: value } }));
    markEdited();
  }

  function updateIntro(field: keyof EstimatePageContent["intro"], value: string) {
    setDraft((current) => ({ ...current, intro: { ...current.intro, [field]: value } }));
    markEdited();
  }

  function updateStep(index: number, field: "title" | "label" | "question" | "helper" | "count" | "options", value: string) {
    setDraft((current) => {
      const steps = current.steps.slice();
      const next = { ...(steps[index] ?? defaultEstimatePageContent.steps[index]) } as EstimatePageContent["steps"][number];

      switch (field) {
        case "title":
          next.title = value;
          break;
        case "label":
          next.label = value;
          break;
        case "question":
          next.question = value;
          break;
        case "helper":
          next.helper = value;
          break;
        case "count":
          next.count = value;
          break;
        case "options": {
          const lines = value
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          next.options = lines.length ? lines : [""];
          break;
        }
      }

      steps[index] = next;
      return { ...current, steps };
    });
    markEdited();
  }

  function updateFinal(field: keyof EstimatePageContent["final"], value: string) {
    setDraft((current) => ({ ...current, final: { ...current.final, [field]: value } }));
    markEdited();
  }

  function updatePrivacySection(index: number, field: "heading" | "body", value: string) {
    setDraft((current) => {
      const sections = current.privacy.sections.slice();
      sections[index] = { ...(sections[index] ?? { heading: "", body: "" }), [field]: value };
      return { ...current, privacy: { ...current.privacy, sections } };
    });
    markEdited();
  }

  function updateReviewLabel(field: keyof EstimatePageContent["reviewLabels"], value: string) {
    setDraft((current) => ({ ...current, reviewLabels: { ...current.reviewLabels, [field]: value } }));
    markEdited();
  }

  function updateOtherRoomLabel(value: string) {
    setDraft((current) => ({ ...current, otherRoomLabel: value }));
    markEdited();
  }

  function resetDraft() {
    setDraft(defaultEstimatePageContent);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
    setError(null);
    setSelectedStep(0);
  }

  return (
    <section className="editor-shell" aria-labelledby="estimate-editor-title">
      <div className="editor-header">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            견적상담 편집기
          </span>
          <h2 id="estimate-editor-title">상담 신청서의 문구와 선택지를 바로 수정합니다</h2>
          <p>입력 안내, 선택지, 개인정보 문구, 업로드 안내까지 모두 편집할 수 있습니다.</p>
          <div className="editor-save-state" aria-live="polite">
            <span data-state={saveState}>
              {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
            </span>
            <p>{saveNote}</p>
            {lastSavedAt ? <em>최근 저장 {formatEditorTime(lastSavedAt)}</em> : null}
          </div>
        </div>
        <div className="editor-actions">
          <button className="admin-ghost-button" type="button" onClick={resetDraft} disabled={!isAuthenticated || loading || saving}>
            <RotateCcw size={16} />
            기본값
          </button>
          <button className="admin-primary-button" type="button" onClick={() => void persistDraft("manual")} disabled={!isAuthenticated || loading || saving}>
            {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {saving ? "저장 중" : "즉시 저장"}
          </button>
        </div>
      </div>

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {loading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          편집 내용을 불러오는 중
        </div>
      ) : (
        <div className="editor-workspace editor-workspace-single">
          <aside className="editor-inspector editor-inspector-full">
            <InspectorGroup title="상단">
              <Field label="홈 링크 라벨">
                <input value={draft.header.homeLinkLabel} onChange={(event) => updateHeader("homeLinkLabel", event.target.value)} />
              </Field>
              <Field label="연락처 라벨">
                <input value={draft.header.phoneLabel} onChange={(event) => updateHeader("phoneLabel", event.target.value)} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="인트로">
              <Field label="제목">
                <input value={draft.intro.title} onChange={(event) => updateIntro("title", event.target.value)} />
              </Field>
              <Field label="설명">
                <textarea rows={4} value={draft.intro.description} onChange={(event) => updateIntro("description", event.target.value)} />
              </Field>
              <Field label="버튼">
                <input value={draft.intro.buttonLabel} onChange={(event) => updateIntro("buttonLabel", event.target.value)} />
              </Field>
              <Field label="이미지 대체텍스트">
                <input value={draft.intro.heroAlt} onChange={(event) => updateIntro("heroAlt", event.target.value)} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="단계별 문구">
              <div className="editor-step-list">
                {draft.steps.map((step, index) => (
                  <button
                    key={`${step.label}-${index}`}
                    type="button"
                    className={selectedStep === index ? "editor-step-tab active" : "editor-step-tab"}
                    onClick={() => setSelectedStep(index)}
                  >
                    <span>{step.count}</span>
                    <strong>{step.label}</strong>
                    <em>{step.mode === "final" ? "입력" : step.mode === "multi" ? "복수 선택" : "단일 선택"}</em>
                  </button>
                ))}
              </div>
              {draft.steps[selectedStep] ? (
                <div className="editor-inline-card">
                  <Field label="배지">
                    <input value={draft.steps[selectedStep].title} onChange={(event) => updateStep(selectedStep, "title", event.target.value)} />
                  </Field>
                  <Field label="제목">
                    <input value={draft.steps[selectedStep].label} onChange={(event) => updateStep(selectedStep, "label", event.target.value)} />
                  </Field>
                  <Field label="질문">
                    <textarea rows={3} value={draft.steps[selectedStep].question} onChange={(event) => updateStep(selectedStep, "question", event.target.value)} />
                  </Field>
                  <Field label="도움말">
                    <textarea rows={3} value={draft.steps[selectedStep].helper} onChange={(event) => updateStep(selectedStep, "helper", event.target.value)} />
                  </Field>
                  <Field label="진행 표시">
                    <input value={draft.steps[selectedStep].count} onChange={(event) => updateStep(selectedStep, "count", event.target.value)} />
                  </Field>
                  <Field label="선택지">
                    <textarea
                      rows={6}
                      value={draft.steps[selectedStep].options.join("\n")}
                      onChange={(event) => updateStep(selectedStep, "options", event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}
            </InspectorGroup>

            <InspectorGroup title="마무리 입력">
              {Object.entries(draft.final).map(([key, value]) => (
                <EditableTextField
                  key={key}
                  label={labelForEstimateFinal(key as keyof EstimatePageContent["final"])}
                  value={String(value)}
                  multiline={isLongEditorField(key, String(value))}
                  onChange={(nextValue) => updateFinal(key as keyof EstimatePageContent["final"], nextValue)}
                />
              ))}
            </InspectorGroup>

            <InspectorGroup title="개인정보 약관">
              {draft.privacy.sections.map((section, index) => (
                <div className="editor-inline-card" key={index}>
                  <Field label={`섹션 제목 ${index + 1}`}>
                    <input value={section.heading} onChange={(event) => updatePrivacySection(index, "heading", event.target.value)} />
                  </Field>
                  <Field label={`섹션 내용 ${index + 1}`}>
                    <textarea rows={4} value={section.body} onChange={(event) => updatePrivacySection(index, "body", event.target.value)} />
                  </Field>
                </div>
              ))}
            </InspectorGroup>

            <InspectorGroup title="선택 결과 라벨">
              {Object.entries(draft.reviewLabels).map(([key, value]) => (
                <Field key={key} label={labelForEstimateReview(key as keyof EstimatePageContent["reviewLabels"])}>
                  <input value={String(value)} onChange={(event) => updateReviewLabel(key as keyof EstimatePageContent["reviewLabels"], event.target.value)} />
                </Field>
              ))}
              <Field label="기타 입력 라벨">
                <input value={draft.otherRoomLabel} onChange={(event) => updateOtherRoomLabel(event.target.value)} />
              </Field>
            </InspectorGroup>
          </aside>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function EditableTextField({
  label,
  value,
  multiline,
  onChange
}: {
  label: string;
  value: string;
  multiline: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </Field>
  );
}

function InspectorGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="editor-group">
      <div className="section-heading">
        <h3>{title}</h3>
      </div>
      <div className="editor-group-body">{children}</div>
    </section>
  );
}

function isLongEditorField(key: string, value: string) {
  return (
    value.length > 42 ||
    key.toLowerCase().includes("description") ||
    key.toLowerCase().includes("help") ||
    key.toLowerCase().includes("message") ||
    key.toLowerCase().includes("placeholder") ||
    key.toLowerCase().includes("note")
  );
}

function labelForAccountAuth(key: keyof AccountPageContent["auth"]) {
  const map: Record<keyof AccountPageContent["auth"], string> = {
    loadingText: "로딩 문구",
    currentLoginLabel: "현재 로그인",
    collapseLabel: "접기",
    expandLabel: "펼치기",
    passwordLabel: "비밀번호 라벨",
    passwordPlaceholder: "비밀번호 플레이스홀더",
    passwordSaveLabel: "비밀번호 저장 버튼",
    googleConnectLabel: "Google 연결 버튼",
    passwordSavingLabel: "비밀번호 저장 중",
    googleConnectingLabel: "Google 연결 중",
    accountMessageEmptyText: "안내 없음",
    collapsedNote: "접힌 안내",
    noSessionLabel: "세션 없음 라벨",
    noSessionTitle: "로그인 필요 제목",
    noSessionDescription: "로그인 필요 설명",
    loginLinkLabel: "로그인 링크"
  };

  return map[key];
}

function labelForAccountList(key: keyof AccountPageContent["list"]) {
  const map: Record<keyof AccountPageContent["list"], string> = {
    kicker: "섹션 배지",
    title: "섹션 제목",
    description: "섹션 설명",
    loadingText: "로딩 문구",
    emptyText: "빈 상태",
    detailToggleLabel: "상세 전환",
    editLabel: "편집 버튼",
    cancelLabel: "취소 버튼",
    saveLabel: "저장 버튼",
    nameLabel: "이름 라벨",
    phoneLabel: "연락처 라벨",
    areaLabel: "지역 라벨",
    messageLabel: "문의 내용 라벨",
    sourceLabel: "출처 라벨",
    attachmentLabel: "첨부 라벨",
    notifiedLabel: "알림 라벨",
    noAreaText: "지역 없음"
  };

  return map[key];
}

function labelForIntake(key: keyof AccountPageContent["intakeLabels"]) {
  const map: Record<keyof AccountPageContent["intakeLabels"], string> = {
    propertyType: "집 환경",
    projectType: "공사 유형",
    address: "주소",
    preferredTime: "상담 가능 시간",
    budget: "예산"
  };

  return map[key];
}

function labelForEstimateFinal(key: keyof EstimatePageContent["final"]) {
  const map: Record<keyof EstimatePageContent["final"], string> = {
    reviewKicker: "리뷰 배지",
    nameLabel: "이름 라벨",
    namePlaceholder: "이름 플레이스홀더",
    phoneLabel: "휴대폰 라벨",
    phoneHelp: "휴대폰 도움말",
    phonePlaceholder: "휴대폰 플레이스홀더",
    addressLabel: "주소 라벨",
    addressHelp: "주소 도움말",
    postcodePlaceholder: "우편번호 플레이스홀더",
    postcodeButtonLabel: "우편번호 버튼",
    addressPlaceholder: "주소 입력 플레이스홀더",
    detailAddressPlaceholder: "상세주소 플레이스홀더",
    requestLabel: "요청사항 라벨",
    requestPlaceholder: "요청사항 플레이스홀더",
    requestCounterSuffix: "카운터 접미사",
    consentLabel: "동의 라벨",
    privacyLinkLabel: "약관 링크",
    attachmentTitle: "첨부 제목",
    attachmentHelp: "첨부 도움말",
    fileAddLabel: "파일 추가 버튼",
    fileClearLabel: "파일 전체 삭제 버튼",
    fileReplaceLabel: "파일 변경 버튼",
    fileDeleteLabel: "파일 삭제 버튼",
    noAttachmentText: "첨부 없음 문구",
    backLabel: "이전 버튼",
    firstLabel: "처음 버튼",
    nextLabel: "다음 버튼",
    submitLabel: "제출 버튼",
    submittingLabel: "제출 중",
    successMessage: "성공 문구",
    errorMessage: "오류 문구"
  };

  return map[key];
}

function labelForEstimateReview(key: keyof EstimatePageContent["reviewLabels"]) {
  const map: Record<keyof EstimatePageContent["reviewLabels"], string> = {
    spaceType: "공간",
    areaBand: "평수",
    propertyStatus: "집 상태",
    reason: "상담 이유",
    selectedRooms: "상담 공간",
    otherRoomDetail: "기타 입력",
    budget: "예산",
    startTiming: "시공 일정",
    requestNote: "요청사항"
  };

  return map[key];
}

function normalizeLines(value: string, minLength = 1) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= minLength) {
    return lines;
  }

  return Array.from({ length: minLength }, (_, index) => lines[index] ?? "");
}

function formatEditorTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
