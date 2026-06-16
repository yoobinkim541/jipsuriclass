import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Send, ShieldCheck } from "lucide-react";
import { images } from "../assets/images";
import { business } from "../data";
import { InquiryService } from "../services/InquiryService";
import { MediaService } from "../services/MediaService";
import { SiteContentService, defaultEstimatePageContent } from "../services/SiteContentService";
import { buildQuoteDraftFromInquiry, mergeQuoteIntoIntake } from "../services/QuoteService";
import { trackEvent } from "../lib/analytics";
import type { EstimatePageContent, InquiryIntake, InquiryRow } from "../types";

const inquiryService = new InquiryService();
const mediaService = new MediaService();
const siteContentService = new SiteContentService();

type EstimateState = {
  spaceType: string;
  areaBand: string;
  propertyStatus: string;
  reason: string;
  selectedRooms: string[];
  otherRoomDetail: string;
  budget: string;
  startTiming: string;
  name: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  requestNote: string;
  consent: boolean;
};

const defaultDraft: EstimateState = {
  spaceType: "",
  areaBand: "",
  propertyStatus: "",
  reason: "",
  selectedRooms: [],
  otherRoomDetail: "",
  budget: "",
  startTiming: "",
  name: "",
  phone: "",
  postalCode: "",
  address: "",
  detailAddress: "",
  requestNote: "",
  consent: false
};

const stepFields = ["spaceType", "areaBand", "propertyStatus", "reason", "selectedRooms", "budget", "startTiming", undefined] as const;

export function EstimatePage() {
  const query = new URLSearchParams(window.location.search);
  const presetProject = query.get("project") ?? "";
  const presetIssue = query.get("issue") ?? "";
  const presetWorks = parseQueryList(query.get("works"));
  const presetWorkIds = parseQueryList(query.get("workIds"));
  const presetSourceServicePath = query.get("sourceService") ?? "";
  const presetSourcePricingPath = query.get("sourcePricing") ?? "";
  const [content, setContent] = useState<EstimatePageContent>(defaultEstimatePageContent);
  const [stage, setStage] = useState<"intro" | "survey">("intro");
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [draft, setDraft] = useState<EstimateState>({
    ...defaultDraft,
    selectedRooms: presetProject ? [presetProject] : [],
    requestNote: presetIssue
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ file: File; url: string }>>([]);
  const [attachmentDragActive, setAttachmentDragActive] = useState(false);
  const [replaceFileIndex, setReplaceFileIndex] = useState<number | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [postcodeLoading, setPostcodeLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const surveyFormRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadEstimateContent()
      .then((loadedContent) => {
        if (mounted) {
          setContent(loadedContent);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  // 견적폼 퍼널 계측: 설문 진입(step 1) ~ 연락처 단계(step 8) 도달 단계를 기록해
  // 어느 단계에서 이탈하는지 측정. PII 없음(단계 번호만).
  useEffect(() => {
    if (stage === "survey") {
      trackEvent("estimate_step", { step });
    }
  }, [stage, step]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file)
    }));

    setPreviews(nextPreviews);
    return () => nextPreviews.forEach((item) => URL.revokeObjectURL(item.url));
  }, [files]);

  useEffect(() => {
    loadDaumPostcode().catch(() => undefined);
  }, []);

  useEffect(() => {
    surveyFormRef.current?.scrollTo({ top: 0 });
  }, [stage, step]);

  useEffect(() => {
    const { body, documentElement } = document;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevBodyHeight = body.style.height;
    const prevHtmlHeight = documentElement.style.height;
    const prevBodyPosition = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;
    const prevBodyLeft = body.style.left;
    const prevBodyRight = body.style.right;
    const prevBodyOverscrollBehavior = body.style.overscrollBehavior;
    const prevHtmlOverscrollBehavior = documentElement.style.overscrollBehavior;
    const scrollY = window.scrollY;

    if (stage === "intro") {
      body.style.overflow = "hidden";
      documentElement.style.overflow = "hidden";
      body.style.height = "100%";
      documentElement.style.height = "100%";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overscrollBehavior = "none";
      documentElement.style.overscrollBehavior = "none";
    } else {
      body.style.overflow = prevBodyOverflow;
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.height = prevBodyHeight;
      documentElement.style.height = prevHtmlHeight;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.overscrollBehavior = prevBodyOverscrollBehavior;
      documentElement.style.overscrollBehavior = prevHtmlOverscrollBehavior;
    }

    return () => {
      body.style.overflow = prevBodyOverflow;
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.height = prevBodyHeight;
      documentElement.style.height = prevHtmlHeight;
      body.style.position = prevBodyPosition;
      body.style.top = prevBodyTop;
      body.style.width = prevBodyWidth;
      body.style.left = prevBodyLeft;
      body.style.right = prevBodyRight;
      body.style.overscrollBehavior = prevBodyOverscrollBehavior;
      documentElement.style.overscrollBehavior = prevHtmlOverscrollBehavior;
      window.scrollTo(0, scrollY);
    };
  }, [stage]);

  const currentStep = {
    ...(content.steps[step - 1] ?? content.steps[0]),
    field: stepFields[step - 1]
  };
  const stepOneReady = Boolean(draft.spaceType);
  const stepTwoReady = Boolean(draft.areaBand);
  const stepThreeReady = Boolean(draft.propertyStatus);
  const stepFourReady = Boolean(draft.reason);
  const stepFiveReady = draft.selectedRooms.length > 0;
  const stepSixReady = Boolean(draft.budget);
  const stepSevenReady = Boolean(draft.startTiming);
  const reviewEntries = buildReviewEntries(draft, content.reviewLabels, content.otherRoomLabel);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const uploadedAttachments =
        files.length > 0 ? await Promise.all(files.map((file) => mediaService.uploadInquiryAttachment(file))) : [];

      const roomSummary = draft.selectedRooms.join(", ");
      const worksSummary = presetWorks.join(", ");
      const addressLine = [draft.postalCode, draft.address, draft.detailAddress].filter(Boolean).join(" ").trim();
      const message = [
        presetWorks.length ? `모의견적 선택 작업: ${worksSummary}` : null,
        `${content.reviewLabels.spaceType}: ${draft.spaceType || "-"}`,
        `${content.reviewLabels.areaBand}: ${draft.areaBand || "-"}`,
        `${content.reviewLabels.propertyStatus}: ${draft.propertyStatus || "-"}`,
        `${content.reviewLabels.reason}: ${draft.reason || "-"}`,
        `${content.reviewLabels.selectedRooms}: ${roomSummary || "-"}`,
        draft.selectedRooms.includes(content.otherRoomLabel) ? `${content.reviewLabels.otherRoomDetail}: ${draft.otherRoomDetail || "-"}` : null,
        `${content.reviewLabels.budget}: ${draft.budget || "-"}`,
        `${content.reviewLabels.startTiming}: ${draft.startTiming || "-"}`,
        `${content.reviewLabels.requestNote}: ${draft.requestNote || "-"}`,
        "",
        `${content.final.consentLabel}: ${draft.consent ? "동의" : "미동의"}`
      ]
        .filter(Boolean)
        .join("\n");

      const baseIntake: InquiryIntake = {
        spaceType: draft.spaceType,
        areaBand: draft.areaBand,
        propertyStatus: draft.propertyStatus,
        reason: draft.reason,
        selectedRooms: draft.selectedRooms,
        otherRoomDetail: draft.otherRoomDetail,
        budget: draft.budget,
        startTiming: draft.startTiming,
        selectedWorks: presetWorks,
        name: draft.name,
        phone: draft.phone,
        postalCode: draft.postalCode,
        address: draft.address,
        detailAddress: draft.detailAddress,
        requestNote: draft.requestNote,
        consent: draft.consent,
        selectedWorkIds: presetWorkIds,
        quoteSource: {
          servicePath: presetSourceServicePath || null,
          pricingPath: presetSourcePricingPath || null,
          works: presetWorks,
          workIds: presetWorkIds
        }
      };

      // 모의견적에서 작업을 선택해 온 경우, 제출 시점에 가격표 기반 견적 초안을 미리 생성해
      // intake.quoteSnapshot에 보관(미컨펌=검토대기). 직원은 열자마자 초안을 보고 자재만 채우면 된다.
      const intake =
        presetWorks.length || presetWorkIds.length
          ? mergeQuoteIntoIntake(
              baseIntake,
              buildQuoteDraftFromInquiry({ intake: baseIntake, created_at: new Date().toISOString() } as InquiryRow)
            )
          : baseIntake;

      await inquiryService.createInquiry({
        name: draft.name,
        phone: draft.phone,
        serviceArea: addressLine || draft.address,
        message,
        attachments: uploadedAttachments,
        intake
      });

      setStatus("success");
      // 전환 완료 이벤트 — 범주형 퍼널 데이터만(이름·전화·주소 등 PII는 보내지 않음)
      trackEvent("estimate_submit", {
        spaceType: draft.spaceType || null,
        areaBand: draft.areaBand || null,
        propertyStatus: draft.propertyStatus || null,
        reason: draft.reason || null,
        budget: draft.budget || null,
        startTiming: draft.startTiming || null,
        roomCount: draft.selectedRooms.length,
        hasPhotos: files.length > 0,
        fromQuote: presetWorks.length > 0,
      });
      window.setTimeout(() => {
        window.location.href = "/";
      }, 2400);
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "견적 문의를 저장하지 못했습니다.");
    }
  }

  function moveNext() {
    setStep((current) => (current < 8 ? ((current + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : current));
  }

  function movePrev() {
    setStep((current) => (current > 1 ? ((current - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8) : current));
  }

  function returnToCalculator() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  }

  function toggleRoom(option: string) {
    setDraft((current) => {
      const exists = current.selectedRooms.includes(option);
      const selectedRooms = exists ? current.selectedRooms.filter((item) => item !== option) : [...current.selectedRooms, option];

      return {
        ...current,
        selectedRooms,
        otherRoomDetail: selectedRooms.includes(content.otherRoomLabel) ? current.otherRoomDetail : ""
      };
    });
  }

  function handleFiles(nextFiles: FileList | File[], replaceIndex: number | null = replaceFileIndex) {
    const incoming = Array.from(nextFiles);
    if (!incoming.length) return;

    setFiles((current) => {
      if (replaceIndex !== null) {
        const next = current.slice();
        next.splice(replaceIndex, 1, incoming[0]);
        if (incoming.length > 1) next.push(...incoming.slice(1));
        return next;
      }

      return [...current, ...incoming];
    });

    setReplaceFileIndex(null);
  }

  function openFilePicker(index: number | null = null) {
    setReplaceFileIndex(index);
    fileInputRef.current?.click();
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setAttachmentDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  async function handlePostcodeSearch() {
    setError(null);
    setPostcodeLoading(true);

    try {
      const postcode = await loadDaumPostcode();
      postcode.open({
        oncomplete: (data) => {
          const address = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
          setDraft((current) => ({
            ...current,
            postalCode: data.zonecode,
            address
          }));
        }
      });
    } catch (postcodeError) {
      setError(postcodeError instanceof Error ? postcodeError.message : "우편번호 검색을 불러오지 못했습니다.");
    } finally {
      setPostcodeLoading(false);
    }
  }

  return (
    <main className={`estimate-shell ${stage === "intro" ? "estimate-shell-intro" : "estimate-shell-survey"}`}>
      <header className="estimate-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {content.header.homeLinkLabel}
        </a>
      </header>

      {stage === "intro" ? (
        <section className="estimate-intro-hero" aria-labelledby="estimate-intro-title">
          <img className="estimate-intro-image" src={images.consultHero} alt={content.intro.heroAlt} />
          <div className="estimate-intro-overlay" />
          <div className="estimate-intro-content">
            <h1 id="estimate-intro-title">{content.intro.title}</h1>
            <p>{content.intro.description}</p>
            {presetWorks.length > 0 ? (
              <div className="estimate-intro-summary" aria-label="모의견적에서 넘어온 작업">
                <span className="estimate-intro-summary-label">모의견적 선택 항목</span>
                <div className="estimate-summary">
                  {presetWorks.map((work) => (
                    <span key={work}>{work}</span>
                  ))}
                </div>
                <p>선택한 작업이 상담 정보에 함께 전달됩니다. 필요하면 다시 계산기로 돌아가 수정할 수 있습니다.</p>
                <button className="secondary-button estimate-intro-return" type="button" onClick={returnToCalculator}>
                  계산기로 돌아가기
                </button>
              </div>
            ) : null}
            <button
              className="primary-button estimate-intro-button"
              type="button"
              onClick={() => {
                setStage("survey");
                setStep(1);
              }}
            >
              {content.intro.buttonLabel}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      ) : (
        <section className="estimate-survey-layout">
          <aside className="estimate-survey-visual" aria-hidden="true">
            <img src={images.consultHero} alt="" />
            <div className="estimate-survey-visual-overlay" />
          </aside>

          <form ref={surveyFormRef} className="estimate-panel estimate-consult-panel estimate-survey-form" onSubmit={handleSubmit}>
            <div className="estimate-progress" aria-hidden="true">
              <span style={{ width: `${(step / 8) * 100}%` }} />
            </div>

            {presetWorks.length > 0 ? (
              <div className="estimate-survey-summary" role="note" aria-label="모의견적 선택 작업">
                <div className="estimate-survey-summary-head">
                  <span className="admin-kicker">모의견적 연동</span>
                  <button className="estimate-survey-summary-link" type="button" onClick={returnToCalculator}>
                    작업 수정
                  </button>
                </div>
                <div className="estimate-summary">
                  {presetWorks.map((work) => (
                    <span key={work}>{work}</span>
                  ))}
                </div>
                <p>이 항목이 상담 신청서에 함께 저장됩니다.</p>
              </div>
            ) : null}

            <div className="estimate-panel-head estimate-consult-head">
              <span className="estimate-step-count">{currentStep.count}</span>
              <strong>{currentStep.label}</strong>
            </div>

            <div className="estimate-question-block">
              <h2>{currentStep.question}</h2>
              {currentStep.helper ? <p>{currentStep.helper}</p> : null}
            </div>

            {currentStep.mode === "single" ? (
              <ChoiceGroup
                value={
                  currentStep.field === "spaceType"
                    ? draft.spaceType
                    : currentStep.field === "areaBand"
                      ? draft.areaBand
                      : currentStep.field === "propertyStatus"
                        ? draft.propertyStatus
                        : currentStep.field === "reason"
                          ? draft.reason
                          : currentStep.field === "budget"
                            ? draft.budget
                            : draft.startTiming
                }
                options={currentStep.options}
                onSelect={(value) => {
                  if (currentStep.field === "spaceType") {
                    setDraft((current) => ({ ...current, spaceType: value }));
                  } else if (currentStep.field === "areaBand") {
                    setDraft((current) => ({ ...current, areaBand: value }));
                  } else if (currentStep.field === "propertyStatus") {
                    setDraft((current) => ({ ...current, propertyStatus: value }));
                  } else if (currentStep.field === "reason") {
                    setDraft((current) => ({ ...current, reason: value }));
                  } else if (currentStep.field === "budget") {
                    setDraft((current) => ({ ...current, budget: value }));
                  } else if (currentStep.field === "startTiming") {
                    setDraft((current) => ({ ...current, startTiming: value }));
                  }
                }}
              />
            ) : null}

            {currentStep.mode === "multi" ? (
              <div className="estimate-room-stack">
                <div className="estimate-choice-grid estimate-choice-grid-multi">
                  {currentStep.options.map((option) => {
                    const active = draft.selectedRooms.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={active ? "estimate-choice active" : "estimate-choice"}
                        onClick={() => toggleRoom(option)}
                        aria-pressed={active}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {draft.selectedRooms.includes(content.otherRoomLabel) ? (
                  <label className="estimate-inline-field">
                    {content.otherRoomLabel}
                    <input
                      value={draft.otherRoomDetail}
                      onChange={(event) => setDraft((current) => ({ ...current, otherRoomDetail: event.target.value }))}
                      placeholder="예: 싱크대 수전, 아일랜드장, 양변기 ..."
                    />
                  </label>
                ) : null}
              </div>
            ) : null}

            {currentStep.mode === "final" ? (
              <>
                <div className="estimate-review-card">
                  <span className="admin-kicker">{content.final.reviewKicker}</span>
                  <div className="estimate-review-grid">
                    {reviewEntries.map((item) => (
                      <div className="estimate-review-item" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="estimate-final-grid">
                  <div className="estimate-final-group">
                    <label>
                      {content.final.nameLabel}
                      <input
                        required
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder={content.final.namePlaceholder}
                      />
                    </label>

                    <label>
                      {content.final.phoneLabel}
                      <span className="estimate-field-help">{content.final.phoneHelp}</span>
                      <input
                        required
                        value={draft.phone}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            phone: formatPhoneNumber(event.target.value)
                          }))
                        }
                        placeholder={content.final.phonePlaceholder}
                        inputMode="tel"
                      />
                    </label>

                    <label>
                      {content.final.addressLabel}
                      <span className="estimate-field-help">{content.final.addressHelp}</span>
                      <div className="estimate-postcode-row">
                        <input
                          value={draft.postalCode}
                          onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))}
                          placeholder={content.final.postcodePlaceholder}
                        />
                        <button className="secondary-button" type="button" onClick={() => void handlePostcodeSearch()} disabled={postcodeLoading}>
                          {postcodeLoading ? "검색 중" : content.final.postcodeButtonLabel}
                        </button>
                      </div>
                      <input
                        required
                        value={draft.address}
                        onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                        placeholder={content.final.addressPlaceholder}
                      />
                      <input
                        value={draft.detailAddress}
                        onChange={(event) => setDraft((current) => ({ ...current, detailAddress: event.target.value }))}
                        placeholder={content.final.detailAddressPlaceholder}
                      />
                    </label>

                    <label>
                      {content.final.requestLabel}
                      <textarea
                        rows={4}
                        maxLength={1000}
                        value={draft.requestNote}
                        onChange={(event) => setDraft((current) => ({ ...current, requestNote: event.target.value }))}
                        placeholder={content.final.requestPlaceholder}
                      />
                      <span className="estimate-counter">({draft.requestNote.length} {content.final.requestCounterSuffix})</span>
                    </label>

                    <label className="estimate-consent-box">
                      <input
                        type="checkbox"
                        required
                        checked={draft.consent}
                        onChange={(event) => setDraft((current) => ({ ...current, consent: event.target.checked }))}
                      />
                      <span>
                        <strong>(필수)</strong> {content.final.consentLabel}
                        <button className="estimate-privacy-link" type="button" onClick={() => setPrivacyOpen(true)}>
                          {content.final.privacyLinkLabel}
                        </button>
                      </span>
                    </label>
                  </div>

                  <div className="estimate-final-group estimate-final-upload">
                    <div
                      className={attachmentDragActive ? "editor-upload-field active" : "editor-upload-field"}
                      onDragEnter={() => setAttachmentDragActive(true)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setAttachmentDragActive(true);
                      }}
                      onDragLeave={() => setAttachmentDragActive(false)}
                      onDrop={handleFileDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.hwp,.txt"
                        multiple
                        className="sr-only-file-input"
                        onChange={(event) => {
                          handleFiles(event.currentTarget.files ?? []);
                          event.currentTarget.value = "";
                        }}
                      />
                      <div className="estimate-upload-toolbar">
                        <label className="estimate-upload-title">
                          {content.final.attachmentTitle}
                          <span className="estimate-field-help">{content.final.attachmentHelp}</span>
                        </label>
                        <div className="estimate-upload-actions">
                          <button className="secondary-button" type="button" onClick={() => openFilePicker()}>
                            {content.final.fileAddLabel}
                          </button>
                          <button className="secondary-button" type="button" onClick={() => setFiles([])} disabled={!files.length}>
                            {content.final.fileClearLabel}
                          </button>
                        </div>
                      </div>

                      {previews.length ? (
                        <div className="attachment-preview-grid" aria-label="첨부 파일 미리보기">
                          {previews.map((item, index) => (
                            <figure className="attachment-preview" key={`${item.file.name}-${item.url}`}>
                              {item.file.type.startsWith("image/") ? (
                                <img src={item.url} alt={item.file.name} />
                              ) : (
                                <div className="attachment-preview-file">{item.file.name}</div>
                              )}
                              <figcaption>{item.file.name}</figcaption>
                              <div className="attachment-preview-actions">
                                <button type="button" className="ghost-button" onClick={() => openFilePicker(index)}>
                                  {content.final.fileReplaceLabel}
                                </button>
                                <button type="button" className="ghost-button" onClick={() => removeFile(index)}>
                                  {content.final.fileDeleteLabel}
                                </button>
                              </div>
                            </figure>
                          ))}
                        </div>
                      ) : (
                        <p className="estimate-field-help">{content.final.noAttachmentText}</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            <div className="estimate-step-actions">
              {step > 1 ? (
                <button className="ghost-button estimate-back" type="button" onClick={movePrev}>
                  <ArrowLeft size={16} />
                  {content.final.backLabel}
                </button>
              ) : (
                <button className="ghost-button estimate-back" type="button" onClick={() => setStage("intro")}>
                  <ArrowLeft size={16} />
                  {content.final.firstLabel}
                </button>
              )}

              {step < 8 ? (
                <button
                  className="primary-button"
                  type="button"
                  onClick={moveNext}
                  disabled={
                    (step === 1 && !stepOneReady) ||
                    (step === 2 && !stepTwoReady) ||
                    (step === 3 && !stepThreeReady) ||
                    (step === 4 && !stepFourReady) ||
                    (step === 5 && !stepFiveReady) ||
                    (step === 6 && !stepSixReady) ||
                    (step === 7 && !stepSevenReady)
                  }
                >
                  {content.final.nextLabel}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button className="primary-button" type="submit" disabled={status === "submitting" || !draft.consent}>
                  <Send size={19} />
                  {status === "submitting" ? content.final.submittingLabel : content.final.submitLabel}
                </button>
              )}
            </div>

            {status === "success" ? <p className="form-success">{content.final.successMessage}</p> : null}
            {status === "error" ? <p className="form-error">{error || content.final.errorMessage}</p> : null}
          </form>

          {privacyOpen ? <PrivacyModal content={content.privacy} onClose={() => setPrivacyOpen(false)} /> : null}
        </section>
      )}
    </main>
  );
}

function ChoiceGroup({
  value,
  options,
  onSelect
}: {
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
}) {
  return (
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
  );
}

function PrivacyModal({
  content,
  onClose
}: {
  content: EstimatePageContent["privacy"];
  onClose: () => void;
}) {
  return (
    <div className="estimate-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="estimate-privacy-title" onClick={onClose}>
      <div className="estimate-modal" onClick={(event) => event.stopPropagation()}>
        <div className="estimate-modal-header">
          <div>
            <span className="admin-kicker">
              <ShieldCheck size={16} />
              {content.kicker}
            </span>
            <h3 id="estimate-privacy-title">{content.title}</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            {content.closeLabel}
          </button>
        </div>
        <div className="estimate-modal-body">
          {content.sections.map((section) => (
            <section className="privacy-section" key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildReviewEntries(draft: EstimateState, labels: EstimatePageContent["reviewLabels"], otherRoomLabel: string) {
  const rooms = draft.selectedRooms.length ? draft.selectedRooms.join(", ") : "-";
  const hasOtherRoom = draft.selectedRooms.includes(otherRoomLabel);

  const entries = [
    { label: labels.spaceType, value: draft.spaceType || "-" },
    { label: labels.areaBand, value: draft.areaBand || "-" },
    { label: labels.propertyStatus, value: draft.propertyStatus || "-" },
    { label: labels.reason, value: draft.reason || "-" },
    { label: labels.selectedRooms, value: rooms },
    { label: labels.budget, value: draft.budget || "-" },
    { label: labels.startTiming, value: draft.startTiming || "-" },
    { label: labels.requestNote, value: draft.requestNote || "-" }
  ];

  if (hasOtherRoom) {
    entries.splice(5, 0, { label: labels.otherRoomDetail, value: draft.otherRoomDetail || "-" });
  }

  return entries;
}

function parseQueryList(value: string | null) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  if (digits.startsWith("02")) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

type DaumPostcodeResponse = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
};

type DaumPostcodeApi = {
  open: (options: { oncomplete: (data: DaumPostcodeResponse) => void }) => void;
};

type DaumPostcodeSdkInstance = {
  open: () => void;
};

type DaumPostcodeConstructor = new (options: { oncomplete: (data: DaumPostcodeResponse) => void }) => DaumPostcodeSdkInstance;

let daumPostcodeLoader: Promise<DaumPostcodeApi> | null = null;

function loadDaumPostcode(): Promise<DaumPostcodeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("우편번호 검색은 브라우저에서만 사용할 수 있습니다."));
  }

  const existing = (window as Window & { daum?: { Postcode?: DaumPostcodeConstructor } }).daum?.Postcode;
  if (existing) {
    return Promise.resolve({
      open(options: { oncomplete: (data: DaumPostcodeResponse) => void }) {
        const instance = new existing(options);
        instance.open();
      }
    });
  }

  if (!daumPostcodeLoader) {
    daumPostcodeLoader = new Promise<DaumPostcodeApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      script.onload = () => {
        const Postcode = (window as Window & { daum?: { Postcode?: DaumPostcodeConstructor } }).daum?.Postcode;
        if (!Postcode) {
          reject(new Error("우편번호 검색 스크립트를 불러오지 못했습니다."));
          return;
        }

        resolve({
          open(options: { oncomplete: (data: DaumPostcodeResponse) => void }) {
            const instance = new Postcode(options);
            instance.open();
          }
        });
      };
      script.onerror = () => reject(new Error("우편번호 검색 스크립트를 불러오지 못했습니다."));
      document.head.appendChild(script);
    });
  }

  return daumPostcodeLoader;
}
