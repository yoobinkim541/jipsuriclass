import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, PencilLine, RefreshCcw, RotateCcw, Save } from "lucide-react";
import { defaultLandingPagesContent, SiteContentService, type LandingPagesContent } from "../services/SiteContentService";
import { landingPageDefinitions, type LandingPageContent } from "../landingPages";

const siteContentService = new SiteContentService();
const AUTOSAVE_DELAY = 1200;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const defaultPagePath = landingPageDefinitions[0]?.path ?? "/service/leak";

export function LandingPagesEditor({ isAuthenticated, isActive = true }: { isAuthenticated: boolean; isActive?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState(defaultPagePath);
  const [draft, setDraft] = useState<LandingPagesContent>(defaultLandingPagesContent);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultLandingPagesContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

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

  function resetDraft() {
    setDraft(defaultLandingPagesContent);
    setSelectedPath(defaultPagePath);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
    setError(null);
  }

  const selectedDefinition = landingPageDefinitions.find((page) => page.path === selectedPath) ?? landingPageDefinitions[0];
  const selectedPage = draft[selectedPath] ?? defaultLandingPagesContent[selectedPath] ?? defaultLandingPagesContent[defaultPagePath];

  return (
    <section className="editor-shell" aria-labelledby="landing-editor-title">
      <div className="editor-header">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            랜딩페이지 편집기
          </span>
          <h2 id="landing-editor-title">서비스와 지역 랜딩페이지를 바로 수정합니다</h2>
          <p>누수, 욕실수리, 도배, 문수리, 남양주, 구리, 하남, 서울, 경기 페이지를 각각 편집할 수 있습니다.</p>
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
        <div className="editor-workspace editor-workspace-with-preview">
          <aside className="editor-preview-panel" aria-label="랜딩페이지 실시간 미리보기">
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

          <aside className="editor-inspector editor-inspector-full">
            <section className="editor-group">
              <div className="section-heading">
                <h3>페이지 선택</h3>
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
            </section>

            <InspectorGroup title="기본 정보">
              <Field label="제목">
                <input
                  value={selectedPage.title}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      title: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="설명">
                <textarea
                  rows={3}
                  value={selectedPage.description}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      description: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="검색 키워드">
                <textarea
                  rows={3}
                  value={selectedPage.searchTerms.join("\n")}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      searchTerms: normalizeLines(event.target.value, 1)
                    }))
                  }
                />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="히어로">
              <Field label="히어로 제목">
                <input
                  value={selectedPage.heroTitle}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      heroTitle: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="히어로 설명">
                <textarea
                  rows={4}
                  value={selectedPage.heroDescription}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      heroDescription: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="핵심 안내">
                <textarea
                  rows={5}
                  value={selectedPage.highlights.join("\n")}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      highlights: normalizeLines(event.target.value, 1)
                    }))
                  }
                />
              </Field>
            </InspectorGroup>

            <InspectorGroup title="본문">
              <Field label="섹션 제목">
                <input
                  value={selectedPage.pointsTitle}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      pointsTitle: event.target.value
                    }))
                  }
                />
              </Field>
              <Field label="본문 문장">
                <textarea
                  rows={6}
                  value={selectedPage.points.join("\n")}
                  onChange={(event) =>
                    updatePage(selectedPath, (page) => ({
                      ...page,
                      points: normalizeLines(event.target.value, 1)
                    }))
                  }
                />
              </Field>
            </InspectorGroup>

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
