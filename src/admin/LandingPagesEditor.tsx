import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, PencilLine, RefreshCcw, RotateCcw, Save } from "lucide-react";
import { defaultLandingPagesContent, SiteContentService, type LandingPagesContent } from "../services/SiteContentService";
import { landingPageDefinitions, type LandingPageContent } from "../landingPages";

const siteContentService = new SiteContentService();
const AUTOSAVE_DELAY = 1200;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type LandingPanel = "summary" | "hero" | "body" | "faq" | "links";
type LandingFieldKey = "title" | "description" | "searchTerms" | "heroTitle" | "heroDescription" | "highlights" | "pointsTitle" | "points";
type LandingFieldSchema = {
  key: LandingFieldKey;
  label: string;
  kind: "text" | "multiline" | "list";
  rows?: number;
  hint?: string;
};

const landingFieldSchemas: Record<"summary" | "hero" | "points", LandingFieldSchema[]> = {
  summary: [
    { key: "title", label: "제목", kind: "text" },
    { key: "description", label: "설명", kind: "multiline", rows: 3 },
    { key: "searchTerms", label: "검색 키워드", kind: "list", hint: "줄 바꿈으로 구분" }
  ],
  hero: [
    { key: "heroTitle", label: "히어로 제목", kind: "text" },
    { key: "heroDescription", label: "히어로 설명", kind: "multiline", rows: 4 },
    { key: "highlights", label: "핵심 안내", kind: "list", hint: "홈 화면의 포인트 카드에 노출됩니다." }
  ],
  points: [
    { key: "pointsTitle", label: "섹션 제목", kind: "text" },
    { key: "points", label: "본문 문장", kind: "list", hint: "줄 바꿈으로 구분" }
  ]
};

const defaultPagePath = landingPageDefinitions[0]?.path ?? "/service/leak";

export function LandingPagesEditor({
  isAuthenticated,
  isActive = true,
  searchQuery = "",
  initialPath
}: {
  isAuthenticated: boolean;
  isActive?: boolean;
  searchQuery?: string;
  initialPath?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  // 카드의 '편집'에서 넘어온 특정 페이지(initialPath)가 있으면 그 페이지로 시작한다.
  const [selectedPath, setSelectedPath] = useState(
    initialPath && landingPageDefinitions.some((page) => page.path === initialPath) ? initialPath : defaultPagePath
  );
  const [showPreview, setShowPreview] = useState(true);
  const [showPreviewFullscreen, setShowPreviewFullscreen] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<LandingPanel>("summary");
  const [draft, setDraft] = useState<LandingPagesContent>(defaultLandingPagesContent);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultLandingPagesContent));
  const autosaveTimerRef = useRef<number | null>(null);
  const changedPageCount = countChangedTopLevelSections(draft, lastSavedRef.current);
  const normalizedSearch = searchQuery.trim().toLowerCase();

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!normalizedSearch) return;
    const match = landingPageDefinitions.find((page) => normalizeSearchText(page).includes(normalizedSearch));
    if (match && match.path !== selectedPath) {
      setSelectedPath(match.path);
    }
  }, [normalizedSearch, selectedPath]);

  useEditorSaveShortcut(() => void persistDraft("manual"), isAuthenticated && !loading && isActive);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadLandingPagesContent()
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
      await siteContentService.saveLandingPagesContent(payload);
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

  function updatePage(path: string, updater: (page: LandingPageContent) => LandingPageContent) {
    setDraft((current) => ({
      ...current,
      [path]: updater(current[path] ?? defaultLandingPagesContent[path])
    }));
    markEdited();
  }

  function updateLandingField(path: string, key: LandingFieldKey, value: string) {
    updatePage(path, (page) => ({
      ...page,
      [key]: key === "searchTerms" || key === "highlights" || key === "points" ? normalizeLines(value, 1) : value
    }));
  }

  function getLandingFieldValue(page: LandingPageContent, key: LandingFieldKey) {
    const value = page[key];
    return Array.isArray(value) ? value.join("\n") : value;
  }

  function resetDraft() {
    setDraft(defaultLandingPagesContent);
    setSelectedPath(defaultPagePath);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
    setError(null);
  }

  const selectedDefinition = landingPageDefinitions.find((page) => page.path === selectedPath) ?? landingPageDefinitions[0];
  const selectedPage = draft[selectedPath] ?? defaultLandingPagesContent[selectedPath] ?? defaultLandingPagesContent[defaultPagePath];
  const panelNav: Array<{ key: LandingPanel; label: string; hint: string }> = [
    { key: "summary", label: "기본 정보", hint: "제목과 검색어" },
    { key: "hero", label: "히어로", hint: "첫 화면 문구" },
    { key: "body", label: "본문", hint: "핵심 문장" },
    { key: "faq", label: "FAQ", hint: "질문과 답변" },
    { key: "links", label: "연결", hint: "다음 페이지" }
  ];

  return (
    <section className="editor-shell editor-shell--studio" aria-labelledby="landing-editor-title">
      <div className="editor-studio-hero">
        <div className="editor-header">
          <div>
            <span className="admin-kicker">
              <PencilLine size={16} />
              랜딩페이지 편집기
            </span>
            <h2 id="landing-editor-title">서비스와 지역 랜딩페이지를 바로 수정합니다</h2>
            <p>페이지를 고르고, 오른쪽 콘솔에서 검색·문구·FAQ를 한 번에 다듬습니다.</p>
            <div className="editor-save-state" aria-live="polite">
              <span data-state={saveState}>
                {saveState === "saving" ? "저장 중" : saveState === "dirty" ? "변경됨" : saveState === "error" ? "오류" : "저장됨"}
              </span>
              <p>{saveNote}</p>
              <strong className="editor-save-count">변경 페이지 {changedPageCount}개</strong>
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

        <div className="editor-studio-hero__meta">
          <div className="editor-context-strip" aria-label="현재 편집 대상">
            <span>
              현재 페이지
              <strong>{selectedDefinition?.title.replace(" | 집수리클라쓰", "") ?? selectedPage.title}</strong>
            </span>
            <span>
              경로
              <strong>{selectedPath}</strong>
            </span>
          </div>
          <div className="editor-studio-stat-row">
            <div>
              <span>섹션</span>
              <strong>{selectedPage.faq.length + selectedPage.relatedLinks.length + selectedPage.points.length} blocks</strong>
            </div>
            <div>
              <span>검색어</span>
              <strong>{normalizedSearch ? searchQuery.trim() : "전체 페이지"}</strong>
            </div>
            <div>
              <span>상태</span>
              <strong>{showPreview ? "프리뷰 동시 편집" : "폼 집중 편집"}</strong>
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="editor-studio-grid editor-studio-grid--landing">
        <aside className="editor-studio-rail">
          <div className="editor-studio-rail__card">
            <span className="editor-studio-rail__eyebrow">선택된 페이지</span>
            <strong>{selectedDefinition?.title.replace(" | 집수리클라쓰", "") ?? selectedPage.title}</strong>
            <p>{selectedDefinition?.categoryLabel ?? "랜딩"} · {selectedPath}</p>
            <div className="editor-studio-metrics">
              <span>
                <em>FAQ</em>
                <strong>{selectedPage.faq.length}</strong>
              </span>
              <span>
                <em>연결</em>
                <strong>{selectedPage.relatedLinks.length}</strong>
              </span>
            </div>
          </div>

          <div className="editor-page-list">
            {landingPageDefinitions.map((page) => (
              <button
                className={selectedPath === page.path ? "editor-page-chip active" : "editor-page-chip"}
                key={page.path}
                type="button"
                onClick={() => setSelectedPath(page.path)}
              >
                <strong>{page.title.replace(" | 집수리클라쓰", "")}</strong>
                <span>{page.categoryLabel}</span>
              </button>
            ))}
          </div>

          <div className="editor-shortcuts editor-shortcuts--rail">
            <span>검색어로 페이지 이동</span>
            <span>페이지 전환 시 자동 포커스</span>
            <span>실시간 저장</span>
          </div>
        </aside>

        <div className="editor-studio-stage">
          {loading ? (
            <div className="admin-empty">
              <LoaderCircle size={18} className="spin" />
              편집 내용을 불러오는 중
            </div>
          ) : (
            <div className={showPreview ? "editor-workspace editor-workspace-with-preview" : "editor-workspace editor-workspace-single"}>
              {showPreview ? (
                <aside
                  className={showPreviewFullscreen ? "editor-preview-panel editor-preview-panel-fullscreen" : "editor-preview-panel"}
                  aria-label="랜딩페이지 실시간 미리보기"
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
                    <strong>{selectedDefinition?.title.replace(" | 집수리클라쓰", "") ?? selectedPage.title}</strong>
                    <p>
                      {selectedDefinition?.categoryLabel ?? "랜딩"} · {selectedPath}
                    </p>
                  </div>

                  <div className="editor-preview-card">
                    <div className="editor-preview-chip-row">
                      <span>{selectedDefinition?.categoryLabel ?? "랜딩"}</span>
                      <span>{selectedDefinition?.pageType === "Service" ? "서비스" : "지역"}</span>
                      {selectedPage.searchTerms.slice(0, 3).map((term) => (
                        <span key={term}>{term}</span>
                      ))}
                    </div>
                    <strong>{selectedPage.title}</strong>
                    <p>{selectedPage.description}</p>
                  </div>

                  <section className="landing-preview-block">
                    <h4>히어로</h4>
                    <div className="editor-preview-card editor-preview-card-soft">
                      <strong>{selectedPage.heroTitle}</strong>
                      <p>{selectedPage.heroDescription}</p>
                      <ul className="landing-preview-list">
                        {selectedPage.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  <section className="landing-preview-block">
                    <h4>{selectedPage.pointsTitle}</h4>
                    <div className="editor-preview-card">
                      <ol className="landing-preview-point-list">
                        {selectedPage.points.map((point, index) => (
                          <li key={point}>
                            <span>{index + 1}</span>
                            <p>{point}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </section>

                  <section className="landing-preview-block">
                    <h4>FAQ</h4>
                    <div className="landing-preview-faq-grid">
                      {selectedPage.faq.map((item) => (
                        <article className="landing-preview-faq-card" key={item.question}>
                          <strong>{item.question}</strong>
                          <p>{item.answer}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="landing-preview-block">
                    <h4>연결 페이지</h4>
                    <div className="landing-preview-link-grid">
                      {selectedPage.relatedLinks.map((item) => (
                        <article className="landing-preview-link-card" key={item.label}>
                          <strong>{item.label}</strong>
                          <p>{item.href}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </aside>
              ) : null}

              <aside className="editor-inspector editor-inspector-full">
                <div className="editor-panel-nav">
                  {panelNav.map((panel) => (
                    <button
                      key={panel.key}
                      type="button"
                      className={selectedPanel === panel.key ? "editor-panel-chip active" : "editor-panel-chip"}
                      onClick={() => setSelectedPanel(panel.key)}
                    >
                      <strong>{panel.label}</strong>
                      <span>{panel.hint}</span>
                    </button>
                  ))}
                </div>

                {selectedPanel === "summary" ? (
                  <InspectorGroup title="기본 정보">
                    {landingFieldSchemas.summary.map((field) => (
                      <Field key={field.key} label={field.label}>
                        {field.kind === "text" ? (
                          <input value={String(getLandingFieldValue(selectedPage, field.key))} onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)} />
                        ) : (
                          <textarea
                            rows={field.rows ?? 3}
                            value={getLandingFieldValue(selectedPage, field.key)}
                            onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)}
                          />
                        )}
                      </Field>
                    ))}
                  </InspectorGroup>
                ) : null}

                {selectedPanel === "hero" ? (
                  <InspectorGroup title="히어로">
                    {landingFieldSchemas.hero.map((field) => (
                      <Field key={field.key} label={field.label}>
                        {field.kind === "text" ? (
                          <input value={String(getLandingFieldValue(selectedPage, field.key))} onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)} />
                        ) : (
                          <textarea
                            rows={field.rows ?? 4}
                            value={getLandingFieldValue(selectedPage, field.key)}
                            onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)}
                          />
                        )}
                      </Field>
                    ))}
                  </InspectorGroup>
                ) : null}

                {selectedPanel === "body" ? (
                  <InspectorGroup title="본문">
                    {landingFieldSchemas.points.map((field) => (
                      <Field key={field.key} label={field.label}>
                        {field.kind === "text" ? (
                          <input value={String(getLandingFieldValue(selectedPage, field.key))} onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)} />
                        ) : (
                          <textarea
                            rows={field.rows ?? 6}
                            value={getLandingFieldValue(selectedPage, field.key)}
                            onChange={(event) => updateLandingField(selectedPath, field.key, event.target.value)}
                          />
                        )}
                      </Field>
                    ))}
                  </InspectorGroup>
                ) : null}

                {selectedPanel === "faq" ? (
                  <InspectorGroup title="FAQ">
                    {selectedPage.faq.map((item, index) => (
                      <div className="editor-inline-card" key={`${selectedPath}-faq-${index}`}>
                        <Field label={`질문 ${index + 1}`}>
                          <input
                            value={item.question}
                            onChange={(event) =>
                              updatePage(selectedPath, (page) => {
                                const faq = page.faq.slice();
                                faq[index] = { ...(faq[index] ?? { question: "", answer: "" }), question: event.target.value };
                                return { ...page, faq };
                              })
                            }
                          />
                        </Field>
                        <Field label={`답변 ${index + 1}`}>
                          <textarea
                            rows={3}
                            value={item.answer}
                            onChange={(event) =>
                              updatePage(selectedPath, (page) => {
                                const faq = page.faq.slice();
                                faq[index] = { ...(faq[index] ?? { question: "", answer: "" }), answer: event.target.value };
                                return { ...page, faq };
                              })
                            }
                          />
                        </Field>
                      </div>
                    ))}
                  </InspectorGroup>
                ) : null}

                {selectedPanel === "links" ? (
                  <InspectorGroup title="연결 페이지">
                    {selectedPage.relatedLinks.map((item, index) => (
                      <div className="editor-inline-card" key={`${selectedPath}-link-${index}`}>
                        <Field label={`링크 이름 ${index + 1}`}>
                          <input
                            value={item.label}
                            onChange={(event) =>
                              updatePage(selectedPath, (page) => {
                                const relatedLinks = page.relatedLinks.slice();
                                relatedLinks[index] = { ...(relatedLinks[index] ?? { label: "", href: "" }), label: event.target.value };
                                return { ...page, relatedLinks };
                              })
                            }
                          />
                        </Field>
                        <Field label={`링크 주소 ${index + 1}`}>
                          <input
                            value={item.href}
                            onChange={(event) =>
                              updatePage(selectedPath, (page) => {
                                const relatedLinks = page.relatedLinks.slice();
                                relatedLinks[index] = { ...(relatedLinks[index] ?? { label: "", href: "" }), href: event.target.value };
                                return { ...page, relatedLinks };
                              })
                            }
                          />
                        </Field>
                      </div>
                    ))}
                  </InspectorGroup>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </div>
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

function normalizeSearchText(value: unknown): string {
  if (typeof value === "string") {
    return value.toLowerCase();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeSearchText(item)).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map((item) => normalizeSearchText(item))
      .join(" ");
  }

  return String(value ?? "").toLowerCase();
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

function countChangedTopLevelSections<T extends Record<string, unknown>>(current: T, previousSnapshot: string) {
  try {
    const previous = JSON.parse(previousSnapshot) as T;
    return Object.keys(current).reduce((count, key) => {
      return JSON.stringify(current[key]) === JSON.stringify(previous[key]) ? count : count + 1;
    }, 0);
  } catch {
    return 0;
  }
}
