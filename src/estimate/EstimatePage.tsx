import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Home, Phone, Send, ShieldCheck } from "lucide-react";
import { images } from "../assets/images";
import { business } from "../data";
import { InquiryService } from "../services/InquiryService";
import { MediaService } from "../services/MediaService";

const inquiryService = new InquiryService();
const mediaService = new MediaService();

const environmentOptions = [
  "아파트",
  "빌라/연립",
  "단독주택",
  "상가/사무실",
  "기타"
];

const projectOptions = [
  "누수/배관",
  "욕실",
  "주방",
  "도배/바닥",
  "전기/조명",
  "문/목공",
  "방수",
  "전체 리모델링",
  "기타"
];

type EstimateState = {
  propertyType: string;
  projectType: string;
  name: string;
  phone: string;
  address: string;
  preferredTime: string;
  budget: string;
  details: string;
};

const defaultDraft: EstimateState = {
  propertyType: "",
  projectType: "",
  name: "",
  phone: "",
  address: "",
  preferredTime: "",
  budget: "",
  details: ""
};

export function EstimatePage() {
  const query = new URLSearchParams(window.location.search);
  const presetProject = query.get("project") ?? "";
  const presetIssue = query.get("issue") ?? "";
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<EstimateState>({ ...defaultDraft, projectType: presetProject });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ file: File; url: string }>>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  const canProceed = Boolean(draft.propertyType && draft.projectType);
  const summary = useMemo(
    () => [
      presetIssue && `증상: ${presetIssue}`,
      draft.propertyType && `집 환경: ${draft.propertyType}`,
      draft.projectType && `공사 유형: ${draft.projectType}`
    ].filter((value): value is string => Boolean(value)),
    [draft.propertyType, draft.projectType, presetIssue]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const uploadedAttachments =
        files.length > 0 ? await Promise.all(files.map((file) => mediaService.uploadInquiryAttachment(file))) : [];

      const message = [
        `집 환경: ${draft.propertyType}`,
        `공사 유형: ${draft.projectType}`,
        `상담 가능 시간: ${draft.preferredTime || "-"}`,
        `예산: ${draft.budget || "-"}`,
        "",
        draft.details.trim()
      ]
        .filter(Boolean)
        .join("\n");

      await inquiryService.createInquiry({
        name: draft.name,
        phone: draft.phone,
        serviceArea: draft.address,
        message,
        attachments: uploadedAttachments,
        intake: {
          propertyType: draft.propertyType,
          projectType: draft.projectType,
          address: draft.address,
          preferredTime: draft.preferredTime,
          budget: draft.budget,
          details: draft.details
        }
      });

      setDraft(defaultDraft);
      setFiles([]);
      setStep(1);
      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 4200);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "견적 문의를 저장하지 못했습니다.");
    }
  }

  return (
    <main className="estimate-shell">
      <header className="estimate-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
        <a className="estimate-phone" href={business.phoneHref}>
          <Phone size={16} />
          {business.phone}
        </a>
      </header>

      <section className="estimate-hero">
        <div className="estimate-hero-copy">
          <span className="admin-kicker">
            <ShieldCheck size={16} />
            단계형 견적 상담
          </span>
          <h1>나에게 맞는 최고의 전문가를 만나보세요</h1>
          <p>시작하기 전에 상담 신청지를 미리 작성해서 상담 대기 시간을 줄여보세요!</p>
          <div className="estimate-summary">
            {summary.length ? summary.map((item) => <span key={item}>{item}</span>) : <span>집 환경과 공사 유형을 먼저 선택하세요</span>}
          </div>
        </div>
        <div className="estimate-hero-media">
          <img
            src={images.consultHero}
            alt="상담을 준비하는 리모델링 안내 이미지"
          />
          <div className="estimate-hero-media-caption">
            <strong>상담 신청지를 미리 작성</strong>
            <span>핵심 정보를 먼저 정리하면 상담이 더 빨라집니다.</span>
          </div>
        </div>
      </section>

      <section className="estimate-grid">
        <div className="estimate-panel">
          <div className="estimate-panel-head">
            <span>STEP {step}</span>
            <strong>{step === 1 ? "집 환경과 원하는 공사 선택" : "연락처와 상세 정보 입력"}</strong>
          </div>

          {step === 1 ? (
            <>
              <ChoiceGroup
                title="집 환경"
                description="현재 집의 형태를 고르면 상담 범위를 더 빨리 잡을 수 있습니다."
                value={draft.propertyType}
                options={environmentOptions}
                onSelect={(value) => setDraft((current) => ({ ...current, propertyType: value }))}
              />
              <ChoiceGroup
                title="원하는 공사"
                description="가장 가까운 공사 유형을 먼저 고르세요."
                value={draft.projectType}
                options={projectOptions}
                onSelect={(value) => setDraft((current) => ({ ...current, projectType: value }))}
              />
              <div className="estimate-step-actions">
                <button className="primary-button" type="button" onClick={() => setStep(2)} disabled={!canProceed}>
                  다음 단계
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          ) : (
            <form className="estimate-form estimate-form-page" onSubmit={handleSubmit}>
              <button className="estimate-back" type="button" onClick={() => setStep(1)}>
                <ArrowLeft size={16} />
                이전 단계
              </button>
              <label>
                이름
                <input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="홍길동" />
              </label>
              <label>
                연락처
                <input required value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="010-0000-0000" inputMode="tel" />
              </label>
              <label>
                주소
                <input required value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} placeholder="예: 경기도 남양주시 화도읍 ..." />
              </label>
              <label>
                상담 가능 시간
                <input value={draft.preferredTime} onChange={(event) => setDraft((current) => ({ ...current, preferredTime: event.target.value }))} placeholder="예: 평일 저녁, 주말 오전" />
              </label>
              <label>
                예산
                <input value={draft.budget} onChange={(event) => setDraft((current) => ({ ...current, budget: event.target.value }))} placeholder="예: 300~500만원" />
              </label>
              <label>
                세부사항
                <textarea
                  required
                  rows={6}
                  value={draft.details}
                  onChange={(event) => setDraft((current) => ({ ...current, details: event.target.value }))}
                  placeholder="원하는 공사 내용, 현재 상태, 걱정되는 점을 적어주세요."
                />
              </label>
              <label>
                사진 첨부
                <input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.currentTarget.files ?? []))} />
              </label>
              {previews.length ? (
                <div className="attachment-preview-grid" aria-label="첨부 사진 미리보기">
                  {previews.map((item) => (
                    <figure className="attachment-preview" key={`${item.file.name}-${item.url}`}>
                      <img src={item.url} alt={item.file.name} />
                      <figcaption>{item.file.name}</figcaption>
                    </figure>
                  ))}
                </div>
              ) : null}
              <button type="submit" disabled={status === "submitting"}>
                <Send size={19} />
                {status === "submitting" ? "저장 중" : "견적 문의 보내기"}
              </button>
              {status === "success" ? <p className="form-success">문의가 저장되었습니다. 확인 후 연락드리겠습니다.</p> : null}
              {status === "error" ? <p className="form-error">{error || "문의 저장에 실패했습니다."}</p> : null}
            </form>
          )}
        </div>

        <aside className="estimate-aside">
          <div className="estimate-aside-card">
            <Home size={20} />
            <strong>선택 내용</strong>
            <ul>
              <li>집 환경: {draft.propertyType || "-"}</li>
              <li>공사 유형: {draft.projectType || "-"}</li>
              <li>주소: {draft.address || "-"}</li>
              <li>상담 가능 시간: {draft.preferredTime || "-"}</li>
              <li>예산: {draft.budget || "-"}</li>
            </ul>
          </div>
          <div className="estimate-aside-card">
            <CheckCircle2 size={20} />
            <strong>진행 방식</strong>
            <p>선택 단계에서 집 상태를 정리하고, 다음 단계에서 연락처와 상세 사진을 받습니다.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ChoiceGroup({
  title,
  description,
  value,
  options,
  onSelect
}: {
  title: string;
  description: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <section className="estimate-choice-group">
      <div className="section-heading row-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="estimate-choice-grid">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "estimate-choice active" : "estimate-choice"}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}
