import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, PencilLine, RotateCcw, Save } from "lucide-react";
import { SiteContentService, defaultHomepageContent } from "../services/SiteContentService";
import type { HomepageContent } from "../types";

const siteContentService = new SiteContentService();

const emptyStrengths = ["", "", ""];

export function HomepageEditor({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draft, setDraft] = useState<HomepageContent>(defaultHomepageContent);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadHomepageContent()
      .then((content) => {
        if (!mounted) return;
        setDraft(content);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : "편집 내용을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const strengthsText = useMemo(() => draft.about.strengths.join("\n"), [draft.about.strengths]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await siteContentService.saveHomepageContent(draft);
      setSuccess("홈페이지 내용이 저장되었습니다.");
      window.setTimeout(() => setSuccess(null), 3500);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function updateHero(field: keyof HomepageContent["hero"], value: string) {
    setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }));
  }

  function updateAbout(field: keyof HomepageContent["about"], value: string) {
    setDraft((current) => ({ ...current, about: { ...current.about, [field]: value } }));
  }

  function updateStrengths(value: string) {
    setDraft((current) => ({
      ...current,
      about: {
        ...current.about,
        strengths: normalizeLines(value, current.about.strengths.length || emptyStrengths.length)
      }
    }));
  }

  function updateService(index: number, field: "title" | "text", value: string) {
    setDraft((current) => {
      const services = current.services.slice();
      services[index] = { ...(services[index] ?? { title: "", text: "" }), [field]: value };
      return { ...current, services };
    });
  }

  function updateCase(index: number, field: keyof HomepageContent["cases"][number], value: string) {
    setDraft((current) => {
      const cases = current.cases.slice();
      cases[index] = { ...(cases[index] ?? { title: "", area: "", problem: "", solution: "", image: "" }), [field]: value };
      return { ...current, cases };
    });
  }

  function updateProcess(index: number, field: "title" | "text", value: string) {
    setDraft((current) => {
      const process = current.process.slice();
      process[index] = { ...(process[index] ?? { title: "", text: "" }), [field]: value };
      return { ...current, process };
    });
  }

  function updateContact(field: keyof HomepageContent["contact"], value: string) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
  }

  function resetDraft() {
    setDraft(defaultHomepageContent);
    setSuccess(null);
    setError(null);
  }

  return (
    <section className="editor-shell" aria-labelledby="homepage-editor-title">
      <div className="editor-header">
        <div>
          <span className="admin-kicker">
            <PencilLine size={16} />
            홈페이지 편집기
          </span>
          <h2 id="homepage-editor-title">지금 페이지에 보이는 글과 사진을 수정합니다</h2>
          <p>저장하면 홈 화면의 문구, 대표 사진, 소개, 서비스, 사례, 작업 절차, 문의 영역이 함께 바뀝니다.</p>
        </div>
        <div className="editor-actions">
          <button className="admin-ghost-button" type="button" onClick={resetDraft} disabled={!isAuthenticated || loading || saving}>
            <RotateCcw size={16} />
            기본값
          </button>
          <button className="admin-primary-button" type="button" onClick={() => void handleSave()} disabled={!isAuthenticated || loading || saving}>
            {saving ? <LoaderCircle size={16} className="spin" /> : <Save size={16} />}
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </div>

      {!isAuthenticated ? <p className="admin-banner">편집하려면 Google로 로그인한 관리자 계정이어야 합니다.</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}
      {success ? <p className="admin-banner">{success}</p> : null}

      {loading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          편집 내용을 불러오는 중
        </div>
      ) : (
        <div className="editor-grid">
          <EditorCard title="히어로">
            <Field label="제목">
              <input value={draft.hero.title} onChange={(event) => updateHero("title", event.target.value)} />
            </Field>
            <Field label="설명">
              <textarea rows={4} value={draft.hero.description} onChange={(event) => updateHero("description", event.target.value)} />
            </Field>
            <Field label="대표 이미지 URL">
              <input value={draft.hero.image} onChange={(event) => updateHero("image", event.target.value)} />
            </Field>
            <Field label="이미지 설명">
              <input value={draft.hero.mediaNote} onChange={(event) => updateHero("mediaNote", event.target.value)} />
            </Field>
            <PreviewImage src={draft.hero.image} alt={draft.hero.mediaNote} />
          </EditorCard>

          <EditorCard title="소개">
            <Field label="배지">
              <input value={draft.about.eyebrow} onChange={(event) => updateAbout("eyebrow", event.target.value)} />
            </Field>
            <Field label="제목">
              <input value={draft.about.title} onChange={(event) => updateAbout("title", event.target.value)} />
            </Field>
            <Field label="설명">
              <textarea rows={5} value={draft.about.description} onChange={(event) => updateAbout("description", event.target.value)} />
            </Field>
            <Field label="강점 항목">
              <textarea rows={4} value={strengthsText} onChange={(event) => updateStrengths(event.target.value)} />
            </Field>
          </EditorCard>

          <EditorCard title="서비스 카드">
            <div className="editor-stack">
              {draft.services.map((service, index) => (
                <div className="editor-item" key={`${service.title}-${index}`}>
                  <strong>{index + 1}. 서비스</strong>
                  <Field label="제목">
                    <input value={service.title} onChange={(event) => updateService(index, "title", event.target.value)} />
                  </Field>
                  <Field label="설명">
                    <textarea rows={3} value={service.text} onChange={(event) => updateService(index, "text", event.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard title="대표 사례">
            <div className="editor-stack">
              {draft.cases.map((item, index) => (
                <div className="editor-item" key={`${item.title}-${index}`}>
                  <strong>{index + 1}. 사례</strong>
                  <Field label="제목">
                    <input value={item.title} onChange={(event) => updateCase(index, "title", event.target.value)} />
                  </Field>
                  <Field label="공간">
                    <input value={item.area} onChange={(event) => updateCase(index, "area", event.target.value)} />
                  </Field>
                  <Field label="문제">
                    <textarea rows={2} value={item.problem} onChange={(event) => updateCase(index, "problem", event.target.value)} />
                  </Field>
                  <Field label="해결">
                    <textarea rows={2} value={item.solution} onChange={(event) => updateCase(index, "solution", event.target.value)} />
                  </Field>
                  <Field label="이미지 URL">
                    <input value={item.image} onChange={(event) => updateCase(index, "image", event.target.value)} />
                  </Field>
                  <PreviewImage src={item.image} alt={item.title} />
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard title="작업 절차">
            <div className="editor-stack">
              {draft.process.map((item, index) => (
                <div className="editor-item" key={`${item.title}-${index}`}>
                  <strong>{index + 1}. 단계</strong>
                  <Field label="제목">
                    <input value={item.title} onChange={(event) => updateProcess(index, "title", event.target.value)} />
                  </Field>
                  <Field label="설명">
                    <textarea rows={2} value={item.text} onChange={(event) => updateProcess(index, "text", event.target.value)} />
                  </Field>
                </div>
              ))}
            </div>
          </EditorCard>

          <EditorCard title="문의 영역">
            <Field label="제목">
              <input value={draft.contact.title} onChange={(event) => updateContact("title", event.target.value)} />
            </Field>
            <Field label="설명">
              <textarea rows={4} value={draft.contact.description} onChange={(event) => updateContact("description", event.target.value)} />
            </Field>
          </EditorCard>
        </div>
      )}
    </section>
  );
}

function EditorCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="editor-card">
      <h3>{title}</h3>
      <div className="editor-card-body">{children}</div>
    </article>
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

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="editor-preview">
      <img src={src} alt={alt} />
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
