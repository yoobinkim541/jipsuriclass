import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LoaderCircle,
  PencilLine,
  Phone,
  RotateCcw,
  Save
} from "lucide-react";
import { business, cases as defaultCases, pinnedPosts, process as defaultProcess, services as defaultServices, symptoms as defaultSymptoms } from "../data";
import { SiteContentService, defaultHomepageContent } from "../services/SiteContentService";
import type { HomepageContent } from "../types";

const siteContentService = new SiteContentService();
const AUTOSAVE_DELAY = 1200;

const emptyStrengths = ["", "", ""];
type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type EditorSection = "hero" | "about" | "services" | "cases" | "process" | "contact";

const sectionLabels: Record<EditorSection, string> = {
  hero: "히어로",
  about: "소개",
  services: "서비스",
  cases: "사례",
  process: "작업 절차",
  contact: "문의"
};

export function HomepageEditor({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveNote, setSaveNote] = useState<string>("편집 내용을 불러오는 중입니다.");
  const [draft, setDraft] = useState<HomepageContent>(defaultHomepageContent);
  const [selectedSection, setSelectedSection] = useState<EditorSection>("hero");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const draftRef = useRef(draft);
  const lastSavedRef = useRef(JSON.stringify(defaultHomepageContent));
  const autosaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

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

  function updateHero(field: keyof HomepageContent["hero"], value: string) {
    setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));
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
      cases[index] = { ...(cases[index] ?? { title: "", area: "", problem: "", solution: "", image: "" }), [field]: value };
      return { ...current, cases };
    });
    setSelectedSection("cases");
    setSelectedIndex(index);
    markEdited();
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

  const currentItemCount =
    selectedSection === "services"
      ? draft.services.length
      : selectedSection === "cases"
        ? draft.cases.length
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
              <HeroPreview content={draft.hero} onSelect={() => setSelectedSection("hero")} />

              <PreviewSectionLabel label="소개" active={selectedSection === "about"} onClick={() => setSelectedSection("about")} />
              <AboutPreview content={draft.about} onSelect={() => setSelectedSection("about")} />

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

              <PreviewSectionLabel label="블로그" active={false} onClick={() => undefined} />
              <BlogPreview />

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
              <ContactPreview content={draft.contact} onSelect={() => setSelectedSection("contact")} />
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
                <Field label="제목">
                  <input value={draft.hero.title} onChange={(event) => updateHero("title", event.target.value)} />
                </Field>
                <Field label="설명">
                  <textarea rows={5} value={draft.hero.description} onChange={(event) => updateHero("description", event.target.value)} />
                </Field>
                <Field label="대표 이미지 URL">
                  <input value={draft.hero.image} onChange={(event) => updateHero("image", event.target.value)} />
                </Field>
                <Field label="이미지 설명">
                  <input value={draft.hero.mediaNote} onChange={(event) => updateHero("mediaNote", event.target.value)} />
                </Field>
              </InspectorGroup>
            ) : null}

            {selectedSection === "about" ? (
              <InspectorGroup title="소개">
                <Field label="배지">
                  <input value={draft.about.eyebrow} onChange={(event) => updateAbout("eyebrow", event.target.value)} />
                </Field>
                <Field label="제목">
                  <input value={draft.about.title} onChange={(event) => updateAbout("title", event.target.value)} />
                </Field>
                <Field label="설명">
                  <textarea rows={7} value={draft.about.description} onChange={(event) => updateAbout("description", event.target.value)} />
                </Field>
                <Field label="강점 항목">
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
  onSelect
}: {
  content: HomepageContent["hero"];
  onSelect: () => void;
}) {
  const heroSlides = useMemo(() => [content.image, ...defaultCases.slice(0, 2).map((item) => item.image)].filter(Boolean), [content.image]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (heroSlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  return (
    <section className="hero hero-fullbleed editor-preview-section" aria-label="히어로 미리보기">
      <button className="preview-edit-trigger" type="button" onClick={onSelect}>
        편집
      </button>
      <div className="hero-carousel" aria-hidden="true">
        {heroSlides.map((image, index) => (
          <img
            key={image}
            className={index === activeSlide ? "hero-background hero-slide active" : "hero-background hero-slide"}
            src={image}
            alt=""
          />
        ))}
      </div>
      <div className="hero-overlay" />
      <div className="hero-copy">
        <span className="hero-kicker">{content.mediaNote}</span>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <div className="hero-actions">
          <span className="primary-button preview-static-button">
            <Phone size={20} />
            전화 상담
          </span>
          <span className="secondary-button preview-static-button">
            <ExternalLink size={20} />
            카카오톡 상담
          </span>
        </div>
      </div>
      {heroSlides.length > 1 ? (
        <div className="hero-carousel-controls" aria-label="히어로 이미지 전환">
          <button type="button" onClick={() => setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length)}>
            <ChevronLeft size={18} />
          </button>
          <div className="hero-carousel-dots">
            {heroSlides.map((image, index) => (
              <button
                key={image}
                type="button"
                className={index === activeSlide ? "hero-dot active" : "hero-dot"}
                onClick={() => setActiveSlide(index)}
                aria-label={`슬라이드 ${index + 1}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => setActiveSlide((current) => (current + 1) % heroSlides.length)}>
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function AboutPreview({
  content,
  onSelect
}: {
  content: HomepageContent["about"];
  onSelect: () => void;
}) {
  return (
    <section className="about section editor-preview-section" aria-labelledby="about-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={onSelect}>
        편집
      </button>
      <div className="about-copy">
        <span>{content.eyebrow}</span>
        <h2 id="about-preview-title">{content.title}</h2>
        <p>{content.description}</p>
      </div>
      <ul className="about-strengths">
        {content.strengths.map((item) => (
          <li key={item}>
            <CheckCircle2 size={20} />
            {item}
          </li>
        ))}
      </ul>
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
    <section className="services section editor-preview-section" aria-labelledby="services-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div className="section-heading">
        <h2 id="services-preview-title">생활 집수리 서비스</h2>
        <p>큰 공사보다 당장 불편한 문제를 해결하는 실용적인 작업을 중심으로 합니다.</p>
      </div>
      <div className="service-grid">
        {defaultServices.map((service, index) => {
          const item = services[index] ?? { title: service.title, text: service.text };
          const active = index === activeIndex;
          return (
            <button
              className={active ? "service-card preview-card active" : "service-card preview-card"}
              key={item.title}
              type="button"
              onClick={() => onSelect(index)}
            >
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
    <section className="cases section editor-preview-section" aria-labelledby="cases-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div className="section-heading row-heading">
        <div>
          <h2 id="cases-preview-title">대표 현장사례</h2>
          <p>실제 사진이 준비되면 이 영역에 바로 교체할 수 있습니다.</p>
        </div>
      </div>
      <div className="case-grid">
        {cases.map((item, index) => (
          <button
            className={index === activeIndex ? "case-card preview-card active" : "case-card preview-card"}
            key={item.title}
            type="button"
            onClick={() => onSelect(index)}
          >
            <img src={item.image} alt={item.title} />
            <div>
              <span>{item.area}</span>
              <h3>{item.title}</h3>
              <p>
                <strong>문제</strong> {item.problem}
              </p>
              <p>
                <strong>해결</strong> {item.solution}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function BlogPreview() {
  return (
    <section className="blog section editor-preview-section" aria-labelledby="blog-preview-title">
      <div className="section-heading row-heading">
        <div>
          <h2 id="blog-preview-title">네이버 블로그 포트폴리오</h2>
          <p>네이버 블로그 최신 현장 글을 자동으로 가져와 사진 카드로 보여줍니다.</p>
        </div>
        <a className="naver-link" href={business.naverBlogUrl} target="_blank" rel="noreferrer">
          N 블로그 <ExternalLink size={17} />
        </a>
      </div>
      <div className="blog-card-grid">
        {pinnedPosts.slice(0, 3).map((post) => (
          <a className="blog-card" href={post.link} target="_blank" rel="noreferrer" key={post.title}>
            <img className="blog-card-image" src={post.image} alt={post.title} />
            <div className="blog-card-body">
              <div className="blog-card-meta">
                <span className="naver-mark">N</span>
                <time>{post.date}</time>
              </div>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
              <span className="blog-card-link">
                자세히 보기 <ExternalLink size={16} />
              </span>
            </div>
          </a>
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
  return (
    <section className="process section editor-preview-section" aria-labelledby="process-preview-title">
      <button className="preview-edit-trigger" type="button" onClick={() => onSelect(0)}>
        편집
      </button>
      <div className="section-heading">
        <h2 id="process-preview-title">작업 절차</h2>
        <p>불필요한 공사를 늘리지 않도록 사진, 현장, 견적 순서로 확인합니다.</p>
      </div>
      <div className="process-line">
        {defaultProcess.map((baseStep, index) => {
          const step = steps[index] ?? { title: baseStep.title, text: baseStep.text };
          return (
          <button
            className={index === activeIndex ? "preview-step-card active" : "preview-step-card"}
            key={step.title}
            type="button"
            onClick={() => onSelect(index)}
          >
            <span>{index + 1}</span>
            <baseStep.icon size={24} />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </button>
          );
        })}
      </div>
    </section>
  );
}

function ContactPreview({
  content,
  onSelect
}: {
  content: HomepageContent["contact"];
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
            <input value="홍길동" readOnly />
          </label>
          <label>
            연락처
            <input value="010-0000-0000" readOnly />
          </label>
          <label>
            지역
            <input value="예: 서울 강동구" readOnly />
          </label>
          <label>
            문의 내용
            <textarea rows={5} value="증상, 건물 유형, 사진 보유 여부를 적어주세요." readOnly />
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
