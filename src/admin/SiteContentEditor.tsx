import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClipboardList, Home, LayoutGrid, LoaderCircle, PencilLine, Plus, RotateCcw, Save, Shield, Stethoscope, Trash2, UserRound } from "lucide-react";
import { HomepageEditor } from "./HomepageEditor";
import { LandingPagesEditor } from "./LandingPagesEditor";
import {
  SiteContentService,
  defaultAccountPageContent,
  defaultDiagnosisPageContent,
  defaultEstimatePageContent,
  defaultPrivacyPageContent
} from "../services/SiteContentService";
import type { AccountPageContent, DiagnosisPageContent, EstimatePageContent, PrivacyPageContent } from "../types";

const siteContentService = new SiteContentService();
const AUTOSAVE_DELAY = 1200;

export type EditorPage = "homepage" | "landing" | "account" | "estimate" | "diagnosis" | "privacy";
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

export function SiteContentEditor({
  isAuthenticated,
  initialPage
}: {
  isAuthenticated: boolean;
  initialPage?: EditorPage;
}) {
  const [page, setPage] = useState<EditorPage>(initialPage ?? "homepage");
  const pageTabs = [
    { key: "homepage" as const, icon: Home, title: "홈페이지", caption: "메인 섹션·사진" },
    { key: "landing" as const, icon: LayoutGrid, title: "랜딩페이지", caption: "서비스·지역" },
    { key: "account" as const, icon: UserRound, title: "마이페이지", caption: "계정·문의 내역" },
    { key: "estimate" as const, icon: ClipboardList, title: "견적상담", caption: "신청서·약관" },
    { key: "diagnosis" as const, icon: Stethoscope, title: "자기진단", caption: "증상·답변 문구" },
    { key: "privacy" as const, icon: Shield, title: "개인정보처리방침", caption: "약관 본문" }
  ];
  const pageMeta: Record<EditorPage, { title: string; description: string; badge: string }> = {
    homepage: {
      title: "홈페이지 — 히어로·카드·사진 편집",
      description: "대표 문구와 사진 배치를 바꾸면 바로 메인 화면에서 확인할 수 있습니다.",
      badge: "메인 화면"
    },
    landing: {
      title: "랜딩페이지 — 서비스·지역 문구 편집",
      description: "서비스 카드, 지역 설명, 연결 문구를 한 번에 정리할 수 있습니다.",
      badge: "확장 페이지"
    },
    account: {
      title: "마이페이지 — 로그인 안내·문의 카드 편집",
      description: "계정 안내, 요약 카드, 문의 목록의 텍스트를 실제 화면 기준으로 맞춥니다.",
      badge: "계정 화면"
    },
    estimate: {
      title: "견적상담 — 선택지·제출 폼 편집",
      description: "단계별 질문, 약관, 첨부 안내를 수정하면 작성 화면에 바로 반영됩니다.",
      badge: "상담 신청서"
    },
    diagnosis: {
      title: "자기진단 — 증상별 원인·점검 문구 편집",
      description: "히어로 문구와 증상별 답변(원인·점검·상담 안내)을 실제 진단 화면 기준으로 수정합니다.",
      badge: "자가진단 화면"
    },
    privacy: {
      title: "개인정보처리방침 — 약관 본문 편집",
      description: "수집 항목·이용 목적 등 약관 섹션을 추가·삭제하고 문구를 바로 바꿉니다.",
      badge: "약관 화면"
    }
  };

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

      <div className="editor-page-summary" aria-live="polite">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            {pageMeta[page].badge}
          </span>
          <h2>{pageMeta[page].title}</h2>
          <p>{pageMeta[page].description}</p>
        </div>
        <div className="editor-shortcuts">
          <span>자동 저장</span>
          <kbd>Ctrl + S</kbd>
          <span>즉시 저장</span>
          <span>모바일·태블릿 지원</span>
        </div>
      </div>

      <div className="editor-page-panels">
        <section className="editor-page-panel" hidden={page !== "homepage"}>
          <HomepageEditor isAuthenticated={isAuthenticated} isActive={page === "homepage"} />
        </section>
        <section className="editor-page-panel" hidden={page !== "landing"}>
          <LandingPagesEditor isAuthenticated={isAuthenticated} isActive={page === "landing"} />
        </section>
        <section className="editor-page-panel" hidden={page !== "account"}>
          <AccountContentEditor isAuthenticated={isAuthenticated} isActive={page === "account"} />
        </section>
        <section className="editor-page-panel" hidden={page !== "estimate"}>
          <EstimateContentEditor isAuthenticated={isAuthenticated} isActive={page === "estimate"} />
        </section>
        <section className="editor-page-panel" hidden={page !== "diagnosis"}>
          <DiagnosisContentEditor isAuthenticated={isAuthenticated} isActive={page === "diagnosis"} />
        </section>
        <section className="editor-page-panel" hidden={page !== "privacy"}>
          <PrivacyContentEditor isAuthenticated={isAuthenticated} isActive={page === "privacy"} />
        </section>
      </div>
    </section>
  );
}

function AccountContentEditor({ isAuthenticated, isActive }: { isAuthenticated: boolean; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showPreviewFullscreen, setShowPreviewFullscreen] = useState(false);
  const [draft, setDraft] = useState<AccountPageContent>(defaultAccountPageContent);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultAccountPageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEditorSaveShortcut(() => void persistDraft("manual"), isAuthenticated && !loading && isActive);

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
          <p>마이페이지 문구를 바로 수정합니다.</p>
          <div className="editor-save-state" aria-live="polite">
            <span data-state={saveState}>
              {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
            </span>
            <p>{saveNote}</p>
            {lastSavedAt ? <em>최근 저장 {formatEditorTime(lastSavedAt)}</em> : null}
          </div>
        </div>
        <div className="editor-actions">
          <button className="admin-ghost-button" type="button" onClick={() => setShowPreview((current) => !current)}>
            {showPreview ? "미리보기 숨기기" : "미리보기 보기"}
          </button>
          {showPreview ? (
            <button className="admin-ghost-button" type="button" onClick={() => setShowPreviewFullscreen((current) => !current)}>
              {showPreviewFullscreen ? "전체 미리보기 닫기" : "전체 미리보기"}
            </button>
          ) : null}
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
        <div className={showPreview ? "editor-workspace editor-workspace-with-preview" : "editor-workspace editor-workspace-single"}>
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

          {showPreview ? (
            <aside
              className={showPreviewFullscreen ? "editor-preview-panel editor-preview-panel-fullscreen" : "editor-preview-panel"}
              aria-label="마이페이지 실시간 미리보기"
            >
              {showPreviewFullscreen ? (
                <div className="editor-preview-toolbar">
                  <span>전체 미리보기</span>
                  <button type="button" className="admin-ghost-button" onClick={() => setShowPreviewFullscreen(false)}>
                    닫기
                  </button>
                </div>
              ) : null}
              <div className="editor-preview-head">
                <span className="editor-preview-kicker">실시간 미리보기</span>
                <strong>{draft.hero.title}</strong>
                <p>{draft.hero.description}</p>
              </div>
              <div className="editor-preview-card">
                <div className="editor-preview-chip-row">
                  <span>{draft.hero.kicker}</span>
                  {draft.hero.notes.slice(0, 3).map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
                <div className="editor-preview-stat-grid">
                  {draft.summary.map((item) => (
                    <article key={item.label} className="editor-preview-stat">
                      <strong>{item.label || "제목"}</strong>
                      <p>{item.description || "설명이 여기에 표시됩니다."}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="editor-preview-card editor-preview-card-soft">
                <span className="editor-preview-muted">{draft.list.kicker}</span>
                <strong>{draft.list.title}</strong>
                <p>{draft.list.description}</p>
                <div className="editor-preview-labels">
                  <span>{draft.list.detailToggleLabel}</span>
                  <span>{draft.list.editLabel}</span>
                  <span>{draft.list.saveLabel}</span>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
}

function EstimateContentEditor({ isAuthenticated, isActive }: { isAuthenticated: boolean; isActive: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showPreviewFullscreen, setShowPreviewFullscreen] = useState(false);
  const [draft, setDraft] = useState<EstimatePageContent>(defaultEstimatePageContent);
  const [selectedStep, setSelectedStep] = useState(0);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultEstimatePageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEditorSaveShortcut(() => void persistDraft("manual"), isAuthenticated && !loading && isActive);

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
          <p>견적상담 문구를 바로 수정합니다.</p>
          <div className="editor-save-state" aria-live="polite">
            <span data-state={saveState}>
              {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
            </span>
            <p>{saveNote}</p>
            {lastSavedAt ? <em>최근 저장 {formatEditorTime(lastSavedAt)}</em> : null}
          </div>
        </div>
        <div className="editor-actions">
          {showPreview ? (
            <button className="admin-ghost-button" type="button" onClick={() => setShowPreviewFullscreen((current) => !current)}>
              {showPreviewFullscreen ? "전체 미리보기 닫기" : "전체 미리보기"}
            </button>
          ) : null}
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
        <div className={showPreview ? "editor-workspace editor-workspace-with-preview" : "editor-workspace editor-workspace-single"}>
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

          {showPreview ? (
            <aside
              className={showPreviewFullscreen ? "editor-preview-panel editor-preview-panel-fullscreen" : "editor-preview-panel"}
              aria-label="견적상담 실시간 미리보기"
            >
              {showPreviewFullscreen ? (
                <div className="editor-preview-toolbar">
                  <span>전체 미리보기</span>
                  <button type="button" className="admin-ghost-button" onClick={() => setShowPreviewFullscreen(false)}>
                    닫기
                  </button>
                </div>
              ) : null}
              <div className="editor-preview-head">
                <span className="editor-preview-kicker">실시간 미리보기</span>
                <strong>{draft.intro.title}</strong>
                <p>{draft.intro.description}</p>
              </div>
              <div className="editor-preview-card">
                <div className="editor-preview-chip-row">
                  <span>{draft.header.homeLinkLabel}</span>
                  <span>{draft.header.phoneLabel}</span>
                  <span>{draft.final.reviewKicker}</span>
                </div>
                <div className="editor-preview-step-grid">
                  {draft.steps.map((step, index) => (
                    <article key={`${step.label}-${index}`} className={selectedStep === index ? "editor-preview-step active" : "editor-preview-step"}>
                      <span>{step.count}</span>
                      <strong>{step.label}</strong>
                      <p>{step.question}</p>
                    </article>
                  ))}
                </div>
              </div>
              <div className="editor-preview-card editor-preview-card-soft">
                <span className="editor-preview-muted">{draft.final.reviewKicker}</span>
                <strong>{draft.final.submitLabel}</strong>
                <p>{draft.final.successMessage}</p>
                <div className="editor-preview-labels">
                  <span>{draft.final.fileAddLabel}</span>
                  <span>{draft.final.fileReplaceLabel}</span>
                  <span>{draft.final.fileDeleteLabel}</span>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** 페이지 편집기 공통 로직(로드·자동저장·즉시저장·기본값 복원)을 한곳에 모은 훅.
 * 기존 마이페이지/견적상담 편집기와 동일한 동작을 새 편집기들이 그대로 재사용한다. */
function useAutosaveDraft<T>(opts: {
  isAuthenticated: boolean;
  isActive: boolean;
  load: () => Promise<T>;
  save: (content: T) => Promise<void>;
  initial: T;
}) {
  const { isAuthenticated, isActive, load, save, initial } = opts;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<T>(initial);
  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(initial));
  const autosaveTimerRef = useRef<number | null>(null);
  const saveStateRef = useRef(saveState);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    saveStateRef.current = saveState;
  }, [saveState]);

  async function persistDraft(mode: "auto" | "manual") {
    const payload = draftRef.current;
    const snapshot = JSON.stringify(payload);
    setSaving(true);
    setError(null);
    setSaveState("saving");
    setSaveNote(mode === "auto" ? "자동 저장 중입니다." : "저장 중입니다.");
    try {
      await save(payload);
      lastSavedRef.current = snapshot;
      setSaveState("saved");
      setSaveNote(mode === "auto" ? "자동 저장되었습니다." : "저장되었습니다.");
      setLastSavedAt(new Date().toISOString());
      window.setTimeout(() => {
        if (lastSavedRef.current === snapshot) setSaveNote("현재 내용이 저장되어 있습니다.");
      }, 2200);
    } catch (saveError) {
      setSaveState("error");
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
      setSaveNote("저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  useEditorSaveShortcut(() => void persistDraft("manual"), isAuthenticated && !loading && isActive);

  useEffect(() => {
    let mounted = true;
    void load()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated) return;
    const snapshot = JSON.stringify(draft);
    if (snapshot === lastSavedRef.current) {
      if (saveStateRef.current !== "saving") {
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

  function markEdited() {
    if (saveStateRef.current !== "saving") {
      setSaveState("dirty");
      setSaveNote("변경 내용을 자동 저장합니다.");
    }
  }

  function reset(content: T) {
    setDraft(content);
    setError(null);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
  }

  return { loading, saving, error, saveState, saveNote, lastSavedAt, draft, setDraft, persistDraft, markEdited, reset };
}

/** 편집기 공통 헤더(타이틀·저장 상태·액션 버튼). 새 편집기들이 동일한 모양을 쓰도록 분리. */
function EditorHeader({
  badge,
  title,
  description,
  saveState,
  saveNote,
  lastSavedAt,
  isAuthenticated,
  loading,
  saving,
  onReset,
  onSave,
  extraActions
}: {
  badge: string;
  title: string;
  description: string;
  saveState: SaveState;
  saveNote: string;
  lastSavedAt: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
  extraActions?: ReactNode;
}) {
  return (
    <div className="editor-header">
      <div>
        <span className="admin-kicker">
          <PencilLine size={16} />
          {badge}
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="editor-save-state" aria-live="polite">
          <span data-state={saveState}>
            {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
          </span>
          <p>{saveNote}</p>
          {lastSavedAt ? <em>최근 저장 {formatEditorTime(lastSavedAt)}</em> : null}
        </div>
      </div>
      <div className="editor-actions">
        {extraActions}
        <button className="admin-ghost-button" type="button" onClick={onReset} disabled={!isAuthenticated || loading || saving}>
          <RotateCcw size={16} />
          기본값
        </button>
        <button className="admin-primary-button" type="button" onClick={onSave} disabled={!isAuthenticated || loading || saving}>
          {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
          {saving ? "저장 중" : "즉시 저장"}
        </button>
      </div>
    </div>
  );
}

function PrivacyContentEditor({ isAuthenticated, isActive }: { isAuthenticated: boolean; isActive: boolean }) {
  const editor = useAutosaveDraft<PrivacyPageContent>({
    isAuthenticated,
    isActive,
    initial: defaultPrivacyPageContent,
    load: () => siteContentService.loadPrivacyContent(),
    save: (content) => siteContentService.savePrivacyContent(content)
  });
  const { draft, setDraft, markEdited } = editor;

  function updateIntro(field: keyof PrivacyPageContent["intro"], value: string) {
    setDraft((current) => ({ ...current, intro: { ...current.intro, [field]: value } }));
    markEdited();
  }

  function updateSection(index: number, field: "heading" | "body", value: string) {
    setDraft((current) => {
      const sections = current.sections.slice();
      sections[index] = { ...(sections[index] ?? { heading: "", body: "" }), [field]: value };
      return { ...current, sections };
    });
    markEdited();
  }

  function addSection() {
    setDraft((current) => ({ ...current, sections: [...current.sections, { heading: "새 항목", body: "" }] }));
    markEdited();
  }

  function removeSection(index: number) {
    setDraft((current) => ({ ...current, sections: current.sections.filter((_, i) => i !== index) }));
    markEdited();
  }

  return (
    <section className="editor-shell" aria-labelledby="privacy-editor-title">
      <EditorHeader
        badge="개인정보처리방침 편집기"
        title="개인정보처리방침 본문을 바로 수정합니다"
        description="약관 섹션을 추가·삭제하고 문구를 바꾸면 /privacy 페이지에 바로 반영됩니다."
        saveState={editor.saveState}
        saveNote={editor.saveNote}
        lastSavedAt={editor.lastSavedAt}
        isAuthenticated={isAuthenticated}
        loading={editor.loading}
        saving={editor.saving}
        onReset={() => editor.reset(defaultPrivacyPageContent)}
        onSave={() => void editor.persistDraft("manual")}
      />

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {editor.error ? <p className="admin-error">{editor.error}</p> : null}

      {editor.loading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          편집 내용을 불러오는 중
        </div>
      ) : (
        <div className="editor-workspace editor-workspace-with-preview">
          <aside className="editor-inspector editor-inspector-full">
            <InspectorGroup title="상단 소개">
              <Field label="배지">
                <input value={draft.intro.kicker} onChange={(event) => updateIntro("kicker", event.target.value)} />
              </Field>
              <Field label="제목">
                <input value={draft.intro.title} onChange={(event) => updateIntro("title", event.target.value)} />
              </Field>
              <Field label="설명">
                <textarea rows={4} value={draft.intro.description} onChange={(event) => updateIntro("description", event.target.value)} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="약관 섹션">
              {draft.sections.map((section, index) => (
                <div className="editor-inline-card editor-removable-card" key={index}>
                  <button className="editor-remove-button" type="button" onClick={() => removeSection(index)} aria-label={`${index + 1}번 섹션 삭제`}>
                    <Trash2 size={14} />
                  </button>
                  <Field label={`제목 ${index + 1}`}>
                    <input value={section.heading} onChange={(event) => updateSection(index, "heading", event.target.value)} />
                  </Field>
                  <Field label={`내용 ${index + 1}`}>
                    <textarea rows={4} value={section.body} onChange={(event) => updateSection(index, "body", event.target.value)} />
                  </Field>
                </div>
              ))}
              <button className="editor-add-button" type="button" onClick={addSection}>
                <Plus size={15} />섹션 추가
              </button>
            </InspectorGroup>

            <InspectorGroup title="하단">
              <Field label="하단 표기(상호 등)">
                <input
                  value={draft.contactNote}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDraft((current) => ({ ...current, contactNote: value }));
                    markEdited();
                  }}
                />
              </Field>
            </InspectorGroup>
          </aside>

          <aside className="editor-preview-panel" aria-label="개인정보처리방침 실시간 미리보기">
            <div className="editor-preview-head">
              <span className="editor-preview-kicker">{draft.intro.kicker}</span>
              <strong>{draft.intro.title}</strong>
              <p>{draft.intro.description}</p>
            </div>
            <div className="editor-preview-card editor-preview-card-soft">
              {draft.sections.map((section, index) => (
                <div className="editor-preview-policy" key={index}>
                  <strong>{section.heading || "제목"}</strong>
                  <p>{section.body || "내용이 여기에 표시됩니다."}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function DiagnosisContentEditor({ isAuthenticated, isActive }: { isAuthenticated: boolean; isActive: boolean }) {
  const editor = useAutosaveDraft<DiagnosisPageContent>({
    isAuthenticated,
    isActive,
    initial: defaultDiagnosisPageContent,
    load: () => siteContentService.loadDiagnosisContent(),
    save: (content) => siteContentService.saveDiagnosisContent(content)
  });
  const { draft, setDraft, markEdited } = editor;
  const [topicQuery, setTopicQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(draft.topics[0]?.id ?? "");

  const selectedIndex = draft.topics.findIndex((topic) => topic.id === selectedTopicId);
  const selectedTopic = selectedIndex >= 0 ? draft.topics[selectedIndex] : draft.topics[0];
  const filteredTopics = draft.topics.filter(
    (topic) => !topicQuery.trim() || `${topic.trigger} ${topic.title}`.toLowerCase().includes(topicQuery.trim().toLowerCase())
  );

  function updateHero(field: keyof DiagnosisPageContent["hero"], value: string | string[]) {
    setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));
    markEdited();
  }

  function updateSectionText(field: keyof DiagnosisPageContent["sections"], value: string) {
    setDraft((current) => ({ ...current, sections: { ...current.sections, [field]: value } }));
    markEdited();
  }

  function updateTopic(field: keyof DiagnosisPageContent["topics"][number], value: string | string[]) {
    if (!selectedTopic) return;
    setDraft((current) => ({
      ...current,
      topics: current.topics.map((topic) => (topic.id === selectedTopic.id ? { ...topic, [field]: value } : topic))
    }));
    markEdited();
  }

  return (
    <section className="editor-shell" aria-labelledby="diagnosis-editor-title">
      <EditorHeader
        badge="자기진단 편집기"
        title="자가진단 화면의 문구와 증상별 답변을 수정합니다"
        description="히어로 안내와 증상별 원인·점검·상담 문구를 바꾸면 /diagnosis 화면에 바로 반영됩니다. (증상 카테고리 구성은 코드에서 관리)"
        saveState={editor.saveState}
        saveNote={editor.saveNote}
        lastSavedAt={editor.lastSavedAt}
        isAuthenticated={isAuthenticated}
        loading={editor.loading}
        saving={editor.saving}
        onReset={() => {
          editor.reset(defaultDiagnosisPageContent);
          setSelectedTopicId(defaultDiagnosisPageContent.topics[0]?.id ?? "");
        }}
        onSave={() => void editor.persistDraft("manual")}
      />

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {editor.error ? <p className="admin-error">{editor.error}</p> : null}

      {editor.loading ? (
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
                <textarea rows={3} value={draft.hero.description} onChange={(event) => updateHero("description", event.target.value)} />
              </Field>
              <Field label="빠른 흐름 (줄마다 한 단계)">
                <textarea rows={3} value={draft.hero.quickFlow.join("\n")} onChange={(event) => updateHero("quickFlow", normalizeLines(event.target.value, 1))} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="섹션 제목">
              <Field label="카테고리 섹션 제목">
                <input value={draft.sections.categoryTitle} onChange={(event) => updateSectionText("categoryTitle", event.target.value)} />
              </Field>
              <Field label="카테고리 섹션 설명">
                <input value={draft.sections.categoryDescription} onChange={(event) => updateSectionText("categoryDescription", event.target.value)} />
              </Field>
              <Field label="증상 섹션 제목">
                <input value={draft.sections.symptomTitle} onChange={(event) => updateSectionText("symptomTitle", event.target.value)} />
              </Field>
              <Field label="증상 섹션 설명">
                <input value={draft.sections.symptomDescription} onChange={(event) => updateSectionText("symptomDescription", event.target.value)} />
              </Field>
              <Field label="답변 섹션 제목">
                <input value={draft.sections.answerTitle} onChange={(event) => updateSectionText("answerTitle", event.target.value)} />
              </Field>
              <Field label="답변 섹션 설명">
                <input value={draft.sections.answerDescription} onChange={(event) => updateSectionText("answerDescription", event.target.value)} />
              </Field>
            </InspectorGroup>

            <InspectorGroup title={`증상별 답변 (${draft.topics.length}개)`}>
              <div className="editor-topic-search">
                <input
                  value={topicQuery}
                  placeholder="증상 검색 (예: 문, 누수, 곰팡이)"
                  onChange={(event) => setTopicQuery(event.target.value)}
                />
              </div>
              <div className="editor-topic-picker">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    className={selectedTopic && topic.id === selectedTopic.id ? "editor-topic-chip active" : "editor-topic-chip"}
                    onClick={() => setSelectedTopicId(topic.id)}
                  >
                    {topic.trigger}
                  </button>
                ))}
                {filteredTopics.length === 0 ? <p className="editor-topic-empty">검색 결과가 없습니다.</p> : null}
              </div>

              {selectedTopic ? (
                <div className="editor-inline-card">
                  <Field label="증상 라벨(버튼)">
                    <input value={selectedTopic.trigger} onChange={(event) => updateTopic("trigger", event.target.value)} />
                  </Field>
                  <Field label="제목">
                    <input value={selectedTopic.title} onChange={(event) => updateTopic("title", event.target.value)} />
                  </Field>
                  <Field label="요약">
                    <textarea rows={2} value={selectedTopic.summary} onChange={(event) => updateTopic("summary", event.target.value)} />
                  </Field>
                  <Field label="가능한 원인 (줄마다 하나)">
                    <textarea rows={4} value={selectedTopic.likelyCauses.join("\n")} onChange={(event) => updateTopic("likelyCauses", normalizeLines(event.target.value, 1))} />
                  </Field>
                  <Field label="먼저 확인할 것 (줄마다 하나)">
                    <textarea rows={4} value={selectedTopic.firstChecks.join("\n")} onChange={(event) => updateTopic("firstChecks", normalizeLines(event.target.value, 1))} />
                  </Field>
                  <Field label="이럴 때 상담하세요">
                    <textarea rows={2} value={selectedTopic.whenToCall} onChange={(event) => updateTopic("whenToCall", event.target.value)} />
                  </Field>
                  <Field label="연결 서비스 버튼 문구">
                    <input value={selectedTopic.ctaLabel} onChange={(event) => updateTopic("ctaLabel", event.target.value)} />
                  </Field>
                  <Field label="연결 서비스 경로">
                    <input value={selectedTopic.ctaHref} onChange={(event) => updateTopic("ctaHref", event.target.value)} />
                  </Field>
                </div>
              ) : null}
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

function useEditorSaveShortcut(onSave: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onSave]);
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
