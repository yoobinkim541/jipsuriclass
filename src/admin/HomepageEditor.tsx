import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  PencilLine,
  Phone,
  RotateCcw,
  Save
} from "lucide-react";
import { business, navItems, process as defaultProcess, services as defaultServices } from "../data";
import { SiteContentService, defaultHomepageContent } from "../services/SiteContentService";
import { MediaService } from "../services/MediaService";
import type { HomepageContent } from "../types";

const siteContentService = new SiteContentService();
const mediaService = new MediaService();
const AUTOSAVE_DELAY = 1200;

const emptyStrengths = ["", "", ""];
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type EditorSection = "hero" | "about" | "services" | "cases" | "blog" | "process" | "contact";

const sectionLabels: Record<EditorSection, string> = {
  hero: "히어로",
  about: "소개",
  services: "서비스",
  cases: "사례",
  blog: "블로그",
  process: "작업 절차",
  contact: "문의"
};

const imagePositionOptions = [
  { label: "가운데", value: "center center" },
  { label: "위", value: "center top" },
  { label: "아래", value: "center bottom" },
  { label: "왼쪽", value: "left center" },
  { label: "오른쪽", value: "right center" },
  { label: "좌상", value: "left top" },
  { label: "우상", value: "right top" },
  { label: "좌하", value: "left bottom" },
  { label: "우하", value: "right bottom" }
] as const;

export function HomepageEditor({ isAuthenticated, isActive = true }: { isAuthenticated: boolean; isActive?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState<string>("편집 내용을 불러오는 중입니다.");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draft, setDraft] = useState<HomepageContent>(defaultHomepageContent);
  const [selectedSection, setSelectedSection] = useState<EditorSection>("hero");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [contactPreview, setContactPreview] = useState({
    name: "홍길동",
    phone: "010-0000-0000",
    area: "예: 서울 강동구",
    message: "증상, 건물 유형, 사진 보유 여부를 적어주세요."
  });

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultHomepageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEditorSaveShortcut(() => void persistDraft("manual"), isAuthenticated && !loading && isActive);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadHomepageContent()
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

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void persistDraft("auto");
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
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
      await siteContentService.saveHomepageContent(payload);
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

  async function handleSave() {
    await persistDraft("manual");
  }

  function markEdited() {
    if (saveState !== "saving") {
      setSaveState("dirty");
      setSaveNote("변경 내용을 자동 저장합니다.");
    }
  }

  function updateHero(field: keyof HomepageContent["hero"], value: string | number) {
    setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));
    markEdited();
  }

  function updateNavLabel(index: number, value: string) {
    setDraft((current) => {
      const navLabels = current.navLabels.slice();
      navLabels[index] = value;
      return { ...current, navLabels };
    });
    markEdited();
  }

  function updateHeroSlide(index: number, field: "image" | "position", value: string) {
    setDraft((current) => {
      const slides = current.hero.slides.slice();
      slides[index] = { ...(slides[index] ?? { image: "", position: "center center", scale: 1 }), [field]: value };
      return { ...current, hero: { ...current.hero, slides } };
    });
    markEdited();
  }

  function updateHeroSlideScale(index: number, value: number) {
    setDraft((current) => {
      const slides = current.hero.slides.slice();
      slides[index] = { ...(slides[index] ?? { image: "", position: "center center", scale: 1 }), scale: value };
      return { ...current, hero: { ...current.hero, slides } };
    });
    markEdited();
  }

  function updateHeroPosition(value: string) {
    updateHero("imagePosition", value);
  }

  function addHeroSlide() {
    setDraft((current) => ({
      ...current,
      hero: {
        ...current.hero,
        slides: [...current.hero.slides, { image: "", position: "center center", scale: 1 }]
      }
    }));
    setSelectedSection("hero");
    markEdited();
  }

  function removeHeroSlide(index: number) {
    setDraft((current) => {
      const slides = current.hero.slides.filter((_, slideIndex) => slideIndex !== index);
      return { ...current, hero: { ...current.hero, slides } };
    });
    setSelectedSection("hero");
    setSelectedIndex(0);
    markEdited();
  }

  function updateAbout(field: keyof HomepageContent["about"], value: string) {
    setDraft((current) => ({ ...current, about: { ...current.about, [field]: value } }));
    markEdited();
  }

  function updateStrengths(value: string) {
    setDraft((current) => ({
      ...current,
      about: {
        ...current.about,
        strengths: normalizeLines(value, current.about.strengths.length || emptyStrengths.length)
      }
    }));
    markEdited();
  }

  function updateService(index: number, field: "title" | "text", value: string) {
    setDraft((current) => {
      const services = current.services.slice();
      services[index] = { ...(services[index] ?? { title: "", text: "" }), [field]: value };
      return { ...current, services };
    });
    setSelectedSection("services");
    setSelectedIndex(index);
    markEdited();
  }

  function updateCase(index: number, field: keyof HomepageContent["cases"][number], value: string) {
    setDraft((current) => {
      const cases = current.cases.slice();
      cases[index] = {
        ...(cases[index] ?? { title: "", area: "", problem: "", solution: "", image: "", link: "" }),
        [field]: value
      };
      return { ...current, cases };
    });
    setSelectedSection("cases");
    setSelectedIndex(index);
    markEdited();
  }

  function updateBlog(index: number, field: keyof HomepageContent["blog"][number], value: string) {
    setDraft((current) => {
      const blog = current.blog.slice();
      blog[index] = {
        ...(blog[index] ?? { title: "", description: "", date: "", link: "", image: "" }),
        [field]: value
      };
      return { ...current, blog };
    });
    setSelectedSection("blog");
    setSelectedIndex(index);
    markEdited();
  }

  async function uploadHeroImage(file: File) {
    setSaving(true);
    setError(null);
    setSaveNote("대표 이미지를 업로드 중입니다.");
    setSaveState("saving");

    try {
      const uploaded = await mediaService.uploadHomepageImage(file);
      updateHero("image", uploaded.url);
      setSaveNote("대표 이미지를 업로드했습니다.");
    } catch (uploadError) {
      setSaveState("error");
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.");
      setSaveNote("이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadHeroSlideImage(index: number, file: File) {
    setSaving(true);
    setError(null);
    setSaveNote("캐러셀 이미지를 업로드 중입니다.");
    setSaveState("saving");

    try {
      const uploaded = await mediaService.uploadHomepageImage(file);
      updateHeroSlide(index, "image", uploaded.url);
      setSaveNote("캐러셀 이미지를 업로드했습니다.");
    } catch (uploadError) {
      setSaveState("error");
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.");
      setSaveNote("이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProcessImage(index: number, file: File) {
    setSaving(true);
    setError(null);
    setSaveNote("작업 절차 이미지를 업로드 중입니다.");
    setSaveState("saving");

    try {
      const uploaded = await mediaService.uploadHomepageImage(file);
      setDraft((current) => {
        const proc = current.process.slice();
        proc[index] = { ...(proc[index] ?? { title: "", text: "", image: "" }), image: uploaded.url };
        return { ...current, process: proc };
      });
      markEdited();
      setSaveNote("작업 절차 이미지를 업로드했습니다.");
    } catch (uploadError) {
      setSaveState("error");
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.");
      setSaveNote("이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadBlogImage(index: number, file: File) {
    setSaving(true);
    setError(null);
    setSaveNote("블로그 이미지를 업로드 중입니다.");
    setSaveState("saving");

    try {
      const uploaded = await mediaService.uploadHomepageImage(file);
      updateBlog(index, "image", uploaded.url);
      setSaveNote("블로그 이미지를 업로드했습니다.");
    } catch (uploadError) {
      setSaveState("error");
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.");
      setSaveNote("이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadCaseImage(index: number, file: File) {
    setSaving(true);
    setError(null);
    setSaveNote("사례 이미지를 업로드 중입니다.");
    setSaveState("saving");

    try {
      const uploaded = await mediaService.uploadCaseImage(file);
      updateCase(index, "image", uploaded.url);
      setSaveNote("이미지를 업로드했습니다.");
    } catch (uploadError) {
      setSaveState("error");
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 업로드하지 못했습니다.");
      setSaveNote("이미지 업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function updateProcess(index: number, field: "title" | "text", value: string) {
    setDraft((current) => {
      const process = current.process.slice();
      process[index] = { ...(process[index] ?? { title: "", text: "" }), [field]: value };
      return { ...current, process };
    });
    setSelectedSection("process");
    setSelectedIndex(index);
    markEdited();
  }

  function updateContact(field: keyof HomepageContent["contact"], value: string) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
    setSelectedSection("contact");
    markEdited();
  }

  function resetDraft() {
    setDraft(defaultHomepageContent);
    setSelectedSection("hero");
    setSelectedIndex(0);
    setSaveState("dirty");
    setSaveNote("기본값으로 되돌렸습니다. 자동 저장됩니다.");
    setError(null);
  }

  const strengthsText = useMemo(() => draft.about.strengths.join("\n"), [draft.about.strengths]);
  const sectionNav: Array<{ key: EditorSection; label: string }> = useMemo(
    () => [
      { key: "hero", label: "히어로" },
      { key: "about", label: "소개" },
      { key: "services", label: "서비스" },
      { key: "cases", label: "사례" },
      { key: "blog", label: "블로그" },
      { key: "process", label: "작업 절차" },
      { key: "contact", label: "문의" }
    ],
    []
  );

  const currentItemCount =
    selectedSection === "services"
      ? draft.services.length
      : selectedSection === "cases"
        ? draft.cases.length
        : selectedSection === "blog"
          ? draft.blog.length
        : selectedSection === "process"
          ? draft.process.length
          : 0;

  return (
    <section className="editor-shell" aria-labelledby="homepage-editor-title">
      <div className="editor-header">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            홈페이지 편집기
          </span>
          <h2 id="homepage-editor-title">실제 화면을 보면서 바로 수정합니다</h2>
          <p>왼쪽은 현재 홈페이지와 같은 구조의 미리보기, 오른쪽은 선택한 섹션의 편집기입니다.</p>
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
          <button className="admin-primary-button" type="button" onClick={() => void handleSave()} disabled={!isAuthenticated || loading || saving}>
            {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {saving ? "저장 중" : "즉시 저장"}
          </button>
        </div>
      </div>

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      <div className="editor-section-nav" aria-label="편집 섹션 이동">
        {sectionNav.map((item) => (
          <button
            key={item.key}
            className={selectedSection === item.key ? "editor-section-chip active" : "editor-section-chip"}
            type="button"
            onClick={() => {
              setSelectedSection(item.key);
              if (item.key === "services" || item.key === "cases" || item.key === "blog" || item.key === "process") {
                setSelectedIndex(0);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          편집 내용을 불러오는 중
        </div>
      ) : (
        <div className="editor-workspace">
          <div className="editor-preview-panel">
            <div className="editor-preview-frame">
              <PreviewSectionLabel label="히어로" active={selectedSection === "hero"} onClick={() => setSelectedSection("hero")} />
              <HeroPreview content={draft.hero} cases={draft.cases} onSelect={() => setSelectedSection("hero")} />

              <PreviewSectionLabel label="소개" active={selectedSection === "about"} onClick={() => setSelectedSection("about")} />
              <AboutPreview content={draft.about} cases={draft.cases} onSelect={() => setSelectedSection("about")} />

              <PreviewSectionLabel label="서비스" active={selectedSection === "services"} onClick={() => setSelectedSection("services")} />
              <ServicesPreview
                services={draft.services}
                activeIndex={selectedSection === "services" ? selectedIndex : -1}
                onSelect={(index) => {
                  setSelectedSection("services");
                  setSelectedIndex(index);
                }}
              />

              <PreviewSectionLabel label="사례" active={selectedSection === "cases"} onClick={() => setSelectedSection("cases")} />
              <CasesPreview
                cases={draft.cases}
                activeIndex={selectedSection === "cases" ? selectedIndex : -1}
                onSelect={(index) => {
                  setSelectedSection("cases");
                  setSelectedIndex(index);
                }}
              />

              <PreviewSectionLabel label="블로그" active={selectedSection === "blog"} onClick={() => setSelectedSection("blog")} />
              <BlogPreview
                posts={draft.blog}
                activeIndex={selectedSection === "blog" ? selectedIndex : -1}
                onSelect={(index) => {
                  setSelectedSection("blog");
                  setSelectedIndex(index);
                }}
              />

              <PreviewSectionLabel label="작업 절차" active={selectedSection === "process"} onClick={() => setSelectedSection("process")} />
              <ProcessPreview
                steps={draft.process}
                activeIndex={selectedSection === "process" ? selectedIndex : -1}
                onSelect={(index) => {
                  setSelectedSection("process");
                  setSelectedIndex(index);
                }}
              />

              <PreviewSectionLabel label="문의" active={selectedSection === "contact"} onClick={() => setSelectedSection("contact")} />
              <ContactPreview
                content={draft.contact}
                preview={contactPreview}
                setPreview={setContactPreview}
                onSelect={() => setSelectedSection("contact")}
              />
            </div>
          </div>

          <aside className="editor-inspector">
            <div className="editor-inspector-head">
              <span className="editor-inspector-label">선택됨</span>
              <strong>{sectionLabels[selectedSection]}</strong>
              {currentItemCount > 0 ? <span>{selectedIndex + 1} / {currentItemCount}</span> : null}
            </div>

            {selectedSection === "hero" ? (
              <InspectorGroup title="히어로">
                <div className="editor-inspector-subgroup">
                  <h4>카드 이미지</h4>
                  <p className="editor-inline-note">히어로 카드 덱과 소개 섹션에 함께 표시됩니다.</p>
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <ImageUploadField
                        label={`카드 ${idx + 1}${draft.cases[idx]?.area ? ` — ${draft.cases[idx].area}` : ""}`}
                        previewUrl={draft.cases[idx]?.image ?? ""}
                        previewLabel={draft.cases[idx]?.title ?? `사례 ${idx + 1}`}
                        onFileSelect={(file) => void uploadCaseImage(idx, file)}
                        onClear={() => updateCase(idx, "image", "")}
                      />
                    </div>
                  ))}
                </div>
                <Field label="설명 (lede 텍스트)">
                  <textarea rows={5} value={draft.hero.description} onChange={(event) => updateHero("description", event.target.value)} />
                </Field>
                <Field label="버튼 1 (전화 상담)">
                  <input value={draft.hero.primaryActionLabel} onChange={(event) => updateHero("primaryActionLabel", event.target.value)} />
                </Field>
                <Field label="버튼 2 (카카오톡)">
                  <input value={draft.hero.secondaryActionLabel} onChange={(event) => updateHero("secondaryActionLabel", event.target.value)} />
                </Field>
                <Field label="버튼 3 (견적상담)">
                  <input value={draft.hero.tertiaryActionLabel} onChange={(event) => updateHero("tertiaryActionLabel", event.target.value)} />
                </Field>
                <div className="editor-inspector-subgroup">
                  <h4>메뉴 이름</h4>
                  <p className="editor-inline-note">이동 경로는 그대로 유지되고 표시 텍스트만 바뀝니다.</p>
                  {navItems.map((item, index) => (
                    <Field key={item.href} label={item.label}>
                      <input
                        value={draft.navLabels[index] ?? item.label}
                        onChange={(event) => updateNavLabel(index, event.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </InspectorGroup>
            ) : null}

            {selectedSection === "about" ? (
              <InspectorGroup title="소개">
                <div className="editor-inspector-subgroup">
                  <h4>섹션 이미지</h4>
                  <p className="editor-inline-note">히어로 카드 덱과 소개 섹션에 함께 표시됩니다.</p>
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <ImageUploadField
                        label={`이미지 ${idx + 1}${draft.cases[idx]?.area ? ` — ${draft.cases[idx].area}` : ""}`}
                        previewUrl={draft.cases[idx]?.image ?? ""}
                        previewLabel={draft.cases[idx]?.title ?? `사례 ${idx + 1}`}
                        onFileSelect={(file) => void uploadCaseImage(idx, file)}
                        onClear={() => updateCase(idx, "image", "")}
                      />
                    </div>
                  ))}
                </div>
                <Field label="배지">
                  <input value={draft.about.eyebrow} onChange={(event) => updateAbout("eyebrow", event.target.value)} />
                </Field>
                <Field label="제목">
                  <input value={draft.about.title} onChange={(event) => updateAbout("title", event.target.value)} />
                </Field>
                <Field label="설명">
                  <textarea rows={7} value={draft.about.description} onChange={(event) => updateAbout("description", event.target.value)} />
                </Field>
                <Field label="강점 항목 (줄 바꿈으로 구분)">
                  <textarea rows={4} value={strengthsText} onChange={(event) => updateStrengths(event.target.value)} />
                </Field>
              </InspectorGroup>
            ) : null}

            {selectedSection === "services" ? (
              <InspectorGroup title="서비스 카드">
                {draft.services.map((service, index) => (
                  <button
                    className={index === selectedIndex ? "preview-item-card active" : "preview-item-card"}
                    key={`${service.title}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <strong>{index + 1}. {service.title}</strong>
                    <span>{service.text}</span>
                  </button>
                ))}
                <Field label={`제목 (${selectedIndex + 1})`}>
                  <input
                    value={draft.services[selectedIndex]?.title ?? ""}
                    onChange={(event) => updateService(selectedIndex, "title", event.target.value)}
                  />
                </Field>
                <Field label="설명">
                  <textarea
                    rows={4}
                    value={draft.services[selectedIndex]?.text ?? ""}
                    onChange={(event) => updateService(selectedIndex, "text", event.target.value)}
                  />
                </Field>
              </InspectorGroup>
            ) : null}

            {selectedSection === "cases" ? (
              <InspectorGroup title="대표 사례">
                {draft.cases.map((item, index) => (
                  <button
                    className={index === selectedIndex ? "preview-item-card active" : "preview-item-card"}
                    key={`${item.title}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <strong>{index + 1}. {item.title}</strong>
                    <span>{item.area}</span>
                  </button>
                ))}
                <Field label={`제목 (${selectedIndex + 1})`}>
                  <input
                    value={draft.cases[selectedIndex]?.title ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "title", event.target.value)}
                  />
                </Field>
                <Field label="공간">
                  <input
                    value={draft.cases[selectedIndex]?.area ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "area", event.target.value)}
                  />
                </Field>
                <Field label="문제">
                  <textarea
                    rows={3}
                    value={draft.cases[selectedIndex]?.problem ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "problem", event.target.value)}
                  />
                </Field>
                <Field label="해결">
                  <textarea
                    rows={3}
                    value={draft.cases[selectedIndex]?.solution ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "solution", event.target.value)}
                  />
                </Field>
                <Field label="이미지 URL">
                  <input
                    value={draft.cases[selectedIndex]?.image ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "image", event.target.value)}
                  />
                </Field>
                <ImageUploadField
                  label="이미지 업로드"
                  previewUrl={draft.cases[selectedIndex]?.image ?? ""}
                  previewLabel={draft.cases[selectedIndex]?.title ?? `사례 ${selectedIndex + 1}`}
                  onFileSelect={(file) => void uploadCaseImage(selectedIndex, file)}
                  onClear={() => updateCase(selectedIndex, "image", "")}
                />
                <Field label="블로그 링크">
                  <input
                    value={draft.cases[selectedIndex]?.link ?? ""}
                    onChange={(event) => updateCase(selectedIndex, "link", event.target.value)}
                  />
                </Field>
              </InspectorGroup>
            ) : null}

            {selectedSection === "blog" ? (
              <InspectorGroup title="블로그 포스트">
                {draft.blog.map((post, index) => (
                  <button
                    className={index === selectedIndex ? "preview-item-card active" : "preview-item-card"}
                    key={`${post.title}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <strong>{index + 1}. {post.title}</strong>
                    <span>{post.date}</span>
                  </button>
                ))}
                <Field label={`제목 (${selectedIndex + 1})`}>
                  <input
                    value={draft.blog[selectedIndex]?.title ?? ""}
                    onChange={(event) => updateBlog(selectedIndex, "title", event.target.value)}
                  />
                </Field>
                <Field label="설명">
                  <textarea
                    rows={4}
                    value={draft.blog[selectedIndex]?.description ?? ""}
                    onChange={(event) => updateBlog(selectedIndex, "description", event.target.value)}
                  />
                </Field>
                <Field label="날짜">
                  <input
                    value={draft.blog[selectedIndex]?.date ?? ""}
                    onChange={(event) => updateBlog(selectedIndex, "date", event.target.value)}
                  />
                </Field>
                <Field label="링크">
                  <input
                    value={draft.blog[selectedIndex]?.link ?? ""}
                    onChange={(event) => updateBlog(selectedIndex, "link", event.target.value)}
                  />
                </Field>
                <Field label="이미지 URL">
                  <input
                    value={draft.blog[selectedIndex]?.image ?? ""}
                    onChange={(event) => updateBlog(selectedIndex, "image", event.target.value)}
                  />
                </Field>
                <ImageUploadField
                  label="이미지 업로드"
                  previewUrl={draft.blog[selectedIndex]?.image ?? ""}
                  previewLabel={draft.blog[selectedIndex]?.title ?? `블로그 ${selectedIndex + 1}`}
                  onFileSelect={(file) => void uploadBlogImage(selectedIndex, file)}
                  onClear={() => updateBlog(selectedIndex, "image", "")}
                />
              </InspectorGroup>
            ) : null}

            {selectedSection === "process" ? (
              <InspectorGroup title="작업 절차">
                {draft.process.map((item, index) => (
                  <button
                    className={index === selectedIndex ? "preview-item-card active" : "preview-item-card"}
                    key={`${item.title}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                  >
                    <strong>{index + 1}. {item.title}</strong>
                    <span>{item.text}</span>
                  </button>
                ))}
                <Field label={`제목 (${selectedIndex + 1})`}>
                  <input
                    value={draft.process[selectedIndex]?.title ?? ""}
                    onChange={(event) => updateProcess(selectedIndex, "title", event.target.value)}
                  />
                </Field>
                <Field label="설명">
                  <textarea
                    rows={3}
                    value={draft.process[selectedIndex]?.text ?? ""}
                    onChange={(event) => updateProcess(selectedIndex, "text", event.target.value)}
                  />
                </Field>
                <ImageUploadField
                  label="단계 이미지"
                  previewUrl={draft.process[selectedIndex]?.image ?? ""}
                  previewLabel={draft.process[selectedIndex]?.title ?? `절차 ${selectedIndex + 1}`}
                  onFileSelect={(file) => void uploadProcessImage(selectedIndex, file)}
                  onClear={() => {
                    setDraft((current) => {
                      const proc = current.process.slice();
                      proc[selectedIndex] = { ...(proc[selectedIndex] ?? { title: "", text: "" }), image: "" };
                      return { ...current, process: proc };
                    });
                    markEdited();
                  }}
                />
              </InspectorGroup>
            ) : null}

            {selectedSection === "contact" ? (
              <InspectorGroup title="문의 영역">
                <Field label="제목">
                  <input value={draft.contact.title} onChange={(event) => updateContact("title", event.target.value)} />
                </Field>
                <Field label="설명">
                  <textarea rows={6} value={draft.contact.description} onChange={(event) => updateContact("description", event.target.value)} />
                </Field>
              </InspectorGroup>
            ) : null}

            <div className="editor-inspector-help">
              <p>미리보기에서 섹션이나 카드를 클릭하면 오른쪽 편집 대상이 바뀝니다.</p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

function PreviewSectionLabel({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "preview-section-label active" : "preview-section-label"} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function HeroPreview({
  content,
  cases,
  onSelect
}: {
  content: HomepageContent["hero"];
  cases: HomepageContent["cases"];
  onSelect: () => void;
}) {
  const caseImages = useMemo(() => cases.filter((c) => c.image).slice(0, 3), [cases]);

  return (
    <section className="hero editor-preview-section" aria-label="히어로 미리보기" style={{ padding: "clamp(24px,4vw,48px) clamp(18px,5vw,64px)" }}>
      <button className="preview-edit-trigger" type="button" onClick={onSelect}>
        편집
      </button>
      <div className="hero__grid">
        <div>
          <h1 className="hero__title" style={{ fontSize: "clamp(28px,3.5vw,52px)" }}>
            집의 모든 불편을
            <br />
            <span className="hero__rotator"><em>한 통의 전화</em></span>으로 끝냅니다.
          </h1>
          <p className="hero__lede">{content.description || "설명 텍스트를 입력하세요."}</p>
          <div className="hero__cta" style={{ marginBottom: 0 }}>
            <span className="primary-button preview-static-button">
              <Phone size={18} />
              {content.primaryActionLabel || "전화 상담"}
            </span>
            <span className="secondary-button preview-static-button">
              <MessageCircle size={18} />
              {content.secondaryActionLabel || "카카오톡"}
            </span>
            <span className="secondary-button preview-static-button">
              <ArrowUpRight size={18} />
              {content.tertiaryActionLabel || "견적상담"}
            </span>
          </div>
        </div>
        {caseImages.length > 0 && (
          <div className="hero__deck">
            {caseImages[0] && (
              <div className="hero__card hero__card--main">
                <img src={caseImages[0].image} alt={caseImages[0].title} />
                <div className="hero__card-tag">{caseImages[0].area}</div>
              </div>
            )}
            {caseImages[1] && (
              <div className="hero__card hero__card--b">
                <img src={caseImages[1].image} alt={caseImages[1].title} />
              </div>
            )}
            {caseImages[2] && (
              <div className="hero__card hero__card--c">
                <img src={caseImages[2].image} alt={caseImages[2].title} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AboutPreview({
  content,
  cases,
  onSelect
}: {
  content: HomepageContent["about"];
  cases: HomepageContent["cases"];
  onSelect: () => void;
}) {
  const caseImages = useMemo(() => cases.filter((c) => c.image).slice(0, 3), [cases]);

  return (
    <section className="about section editor-preview-section" aria-labelledby="about-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={onSelect}>
        편집
      </button>
      <div className="about-copy">
        <span>{content.eyebrow}</span>
        <h2 id="about-preview-title">{content.title}</h2>
        <p>{content.description}</p>
        <ul className="about-strengths">
          {content.strengths.map((item) => (
            <li key={item}>
              <CheckCircle2 size={20} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="about-visual" aria-label="현장 사진 요약">
        {caseImages[0] && (
          <figure className="about-visual__hero">
            <img src={caseImages[0].image} alt={caseImages[0].title} loading="lazy" />
            <figcaption>
              <strong>{caseImages[0].area}</strong>
              <span>{caseImages[0].title}</span>
            </figcaption>
          </figure>
        )}
        <div className="about-visual__stack">
          {caseImages.slice(1, 3).map((item) => (
            <figure className="about-visual__tile" key={item.title}>
              <img src={item.image} alt={item.title} loading="lazy" />
              <figcaption>
                <strong>{item.area}</strong>
                <span>{item.title}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="about-visual__note">
          <strong>현장 사진 우선 상담</strong>
          <span>사례 섹션 이미지를 변경하면 이 사진도 함께 바뀝니다.</span>
        </div>
      </div>
    </section>
  );
}

function ServicesPreview({
  services,
  activeIndex,
  onSelect
}: {
  services: HomepageContent["services"];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="services editor-preview-section" aria-labelledby="services-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div className="sec-head" style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(18px,5vw,64px) clamp(16px,2vw,24px)" }}>
        <h2 id="services-preview-title" style={{ fontWeight: 800, fontSize: "clamp(22px,3vw,36px)", letterSpacing: "-0.03em", margin: "0 0 8px" }}>생활 집수리 서비스</h2>
        <p style={{ color: "var(--ink-2,#2a3a55)", margin: 0 }}>큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다.</p>
      </div>
      <div className="bento">
        {defaultServices.map((service, index) => {
          const item = services[index] ?? { title: service.title, text: service.text };
          const active = index === activeIndex;
          return (
            <button
              className={active ? "bento__card preview-card active" : "bento__card preview-card"}
              key={`${item.title}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              style={{ textAlign: "left" }}
            >
              <span className="bento__num">{String(index + 1).padStart(2, "0")}</span>
              <service.icon size={26} />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CasesPreview({
  cases,
  activeIndex,
  onSelect
}: {
  cases: HomepageContent["cases"];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="cases editor-preview-section" aria-labelledby="cases-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(32px,5vw,56px) clamp(18px,5vw,64px) clamp(16px,2vw,24px)" }}>
        <h2 id="cases-preview-title" style={{ fontWeight: 800, fontSize: "clamp(22px,3vw,36px)", letterSpacing: "-0.03em", margin: "0 0 6px" }}>대표 현장사례</h2>
        <p style={{ color: "var(--ink-2,#2a3a55)", margin: 0 }}>실제 현장 사진과 작업 내용을 확인하세요.</p>
      </div>
      <div className="cases__rail" style={{ paddingBottom: 24 }}>
        {cases.map((item, index) => (
          <button
            className={index === activeIndex ? "cases__card preview-card active" : "cases__card preview-card"}
            key={`${item.title}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            style={{ flex: "0 0 min(72vw, 340px)" }}
          >
            <div className="cases__media">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="cases__body">
              <h3>{item.title}</h3>
              <dl className="row">
                <dt>문제</dt>
                <dd>{item.problem}</dd>
              </dl>
              <dl className="row">
                <dt>해결</dt>
                <dd>{item.solution}</dd>
              </dl>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function BlogPreview({
  posts,
  activeIndex,
  onSelect
}: {
  posts: HomepageContent["blog"];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section className="blog editor-preview-section" aria-labelledby="blog-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div className="section-heading row-heading" style={{ padding: "clamp(24px,4vw,48px) clamp(18px,5vw,64px) clamp(12px,2vw,20px)", maxWidth: "none", margin: 0 }}>
        <div>
          <h2 id="blog-preview-title">네이버 블로그 포트폴리오</h2>
          <p>관리자 지정 포스트를 바로 교체할 수 있습니다.</p>
        </div>
        <a className="naver-link" href={business.naverBlogUrl} target="_blank" rel="noreferrer">
          N 블로그 <ExternalLink size={17} />
        </a>
      </div>
      <div className="blog-card-grid" style={{ padding: "0 clamp(18px,5vw,64px) clamp(24px,3vw,40px)", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
        {posts.map((post, index) => (
          <button
            className={index === activeIndex ? "blog-card preview-card active" : "blog-card preview-card"}
            key={`${post.title}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
          >
            <img
              className="blog-card-image"
              src={post.image}
              alt={post.title}
              loading="lazy"
              style={{ aspectRatio: "16/8" }}
              onError={(event) => {
                const image = event.currentTarget;
                if (image.dataset.fallbackApplied === "true") return;
                image.dataset.fallbackApplied = "true";
                image.src = "/assets/consult-hero.png";
              }}
            />
            <div className="blog-card-body" style={{ padding: 12 }}>
              <div className="blog-card-meta">
                <span className="naver-mark" style={{ width: 28, height: 28, fontSize: 14 }}>N</span>
                <time>{post.date}</time>
              </div>
              <h3 style={{ fontSize: 14 }}>{post.title}</h3>
              <span className="blog-card-link" style={{ fontSize: 12 }}>
                자세히 보기 <ExternalLink size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProcessPreview({
  steps,
  activeIndex,
  onSelect
}: {
  steps: HomepageContent["process"];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const activeStep = steps[activeIndex] ?? defaultProcess[activeIndex];

  return (
    <section className="process editor-preview-section" aria-labelledby="process-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div style={{ maxWidth: "var(--max,1320px)", margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(18px,5vw,64px) clamp(12px,2vw,20px)" }}>
        <h2 id="process-preview-title" style={{ fontWeight: 800, fontSize: "clamp(22px,3vw,36px)", letterSpacing: "-0.03em", margin: "0 0 6px" }}>작업 절차</h2>
        <p style={{ color: "var(--ink-2,#2a3a55)", margin: 0 }}>불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다.</p>
      </div>
      <div className="process__track">
        {defaultProcess.map((baseStep, index) => {
          const step = steps[index] ?? { title: baseStep.title, text: baseStep.text };
          return (
            <button
              className={index === activeIndex ? "process__step active" : "process__step"}
              key={`${step.title}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
            >
              <span className="step-num">0{index + 1}</span>
              <baseStep.icon size={22} />
              <h3>{step.title}</h3>
            </button>
          );
        })}
      </div>
      {activeStep && (
        <div className="process__detail">
          <div className="process__detail-card">
            <div>
              <h3>{activeStep.title}</h3>
              <p>{activeStep.text}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ContactPreview({
  content,
  preview,
  setPreview,
  onSelect
}: {
  content: HomepageContent["contact"];
  preview: {
    name: string;
    phone: string;
    area: string;
    message: string;
  };
  setPreview: Dispatch<
    SetStateAction<{
      name: string;
      phone: string;
      area: string;
      message: string;
    }>
  >;
  onSelect: () => void;
}) {
  return (
    <section className="contact section editor-preview-section" aria-labelledby="contact-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={onSelect}>
        편집
      </button>
      <div className="contact-copy">
        <h2 id="contact-preview-title">{content.title}</h2>
        <p>{content.description}</p>
        <div className="contact-actions">
          <span className="primary-button preview-static-button">
            <Phone size={20} />
            {business.phone}
          </span>
          <span className="secondary-button preview-static-button">
            <ExternalLink size={20} />
            카카오톡으로 사진 보내기
          </span>
        </div>
        <BusinessInfoPreview />
      </div>
      <div className="preview-form-shell">
        <div className="estimate-form">
          <label>
            이름
            <input value={preview.name} onChange={(event) => setPreview((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label>
            연락처
            <input value={preview.phone} onChange={(event) => setPreview((current) => ({ ...current, phone: event.target.value }))} />
          </label>
          <label>
            지역
            <input value={preview.area} onChange={(event) => setPreview((current) => ({ ...current, area: event.target.value }))} />
          </label>
          <label>
            문의 내용
            <textarea
              rows={5}
              value={preview.message}
              onChange={(event) => setPreview((current) => ({ ...current, message: event.target.value }))}
            />
          </label>
          <span className="preview-static-button primary-button">간단 견적 문의</span>
        </div>
      </div>
    </section>
  );
}

function BusinessInfoPreview() {
  return (
    <ul className="business-list">
      <li>영업지역: {business.area}</li>
      <li>상담시간: {business.hours}</li>
      <li>{business.registrationNumber}</li>
      <li>{business.owner}</li>
      <li>{business.address}</li>
    </ul>
  );
}

function InspectorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="editor-inspector-group">
      <h3>{title}</h3>
      <div className="editor-inspector-body">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ImageUploadField({
  label,
  previewUrl,
  previewLabel,
  onFileSelect,
  onClear
}: {
  label: string;
  previewUrl: string;
  previewLabel: string;
  onFileSelect: (file: File) => void;
  onClear?: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      className={dragActive ? "editor-upload-field active" : "editor-upload-field"}
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
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          onFileSelect(file);
        }
      }}
    >
      <div className="editor-field editor-upload-trigger">
        <span>{label}</span>
        <span className="editor-upload-hint">파일 선택 또는 드래그앤드롭</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) {
              onFileSelect(file);
              event.currentTarget.value = "";
            }
          }}
        />
      </div>
      {previewUrl ? (
        <figure className="editor-image-preview">
          <img src={previewUrl} alt={previewLabel} />
          <figcaption>{previewLabel}</figcaption>
          <div className="editor-image-actions">
            <button className="editor-chip" type="button" onClick={() => inputRef.current?.click()}>
              교체
            </button>
            <button
              className="editor-chip"
              type="button"
              onClick={() => {
                onClear?.();
                if (inputRef.current) {
                  inputRef.current.value = "";
                }
              }}
            >
              삭제
            </button>
          </div>
        </figure>
      ) : null}
    </div>
  );
}

function ChipPicker({
  value,
  options,
  onChange
}: {
  value: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="editor-chip-picker" role="group" aria-label="이미지 위치 선택">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "editor-chip active" : "editor-chip"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function normalizeLines(value: string, fallbackCount: number) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length) {
    return lines;
  }

  return Array.from({ length: fallbackCount }, () => "");
}

function formatEditorTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
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
