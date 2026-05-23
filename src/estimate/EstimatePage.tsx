import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Phone, Send, ShieldCheck } from "lucide-react";
import { images } from "../assets/images";
import { business } from "../data";
import { InquiryService } from "../services/InquiryService";
import { MediaService } from "../services/MediaService";

const inquiryService = new InquiryService();
const mediaService = new MediaService();

const spaceOptions = ["아파트", "빌라", "단독주택", "오피스텔"];
const areaOptions = ["10~20평대", "30평대", "40평대", "50평대 이상"];
const propertyStatusOptions = [
  "짐보관 후 살면서 공사예정",
  "현재 공실",
  "시공 시 공실 예정",
  "신축입주",
  "기타 (부동산 미계약 상태)"
];
const reasonOptions = ["집을 구매하여 리모델링 계획 중", "사는 집을 새롭게 바꾸기 위해", "매매나 임대를 위한 리모델링", "기타"];
const roomOptions = ["키친", "바스", "수납", "마루", "중문", "도어", "창호", "필름", "벽지", "조명", "타일", "기타 입력"];
const budgetOptions = ["5백만원 이하", "1천만원 이하", "2천만원 이하", "3천만원 이하", "4천만원 이하", "5천만원 이하", "6천만원 이하", "7천만원 이하", "1억원 이하", "아직 미정이에요"];
const timingOptions = ["1개월 이내", "2개월 이내", "3개월 이내", "3개월 이후", "6개월 이후"];

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

const surveySteps = [
  {
    title: "인테리어 상담신청",
    label: "반갑습니다. 고객님!",
    question: "인테리어가 필요한 공간은 어디인가요?",
    count: "1 / 8",
    mode: "single" as const,
    field: "spaceType" as const,
    options: spaceOptions
  },
  {
    title: "인테리어 상담신청",
    label: "평수 선택",
    question: "인테리어 공간의 평수를 선택해주세요.",
    count: "2 / 8",
    mode: "single" as const,
    field: "areaBand" as const,
    options: areaOptions
  },
  {
    title: "인테리어 상담신청",
    label: "집 상태",
    question: "인테리어 할 집은 어떤 상태인가요?",
    count: "3 / 8",
    mode: "single" as const,
    field: "propertyStatus" as const,
    options: propertyStatusOptions
  },
  {
    title: "인테리어 상담신청",
    label: "상담 이유",
    question: "인테리어를 고려하시게 된 주요 이유를 선택해주세요.",
    count: "4 / 8",
    mode: "single" as const,
    field: "reason" as const,
    options: reasonOptions
  },
  {
    title: "인테리어 상담신청",
    label: "상담 공간",
    question: "인테리어가 필요한 공간을 모두 골라주세요.",
    helper:
      '특정 공간 내 상품 부분교체만 원하시는 경우 "기타 입력"으로 신청해주세요. 예시) 싱크대 수전, 아일랜드장, 양변기, 도배/마루(거실만) 등',
    count: "5 / 8",
    mode: "multi" as const,
    field: "selectedRooms" as const,
    options: roomOptions
  },
  {
    title: "인테리어 상담신청",
    label: "예산",
    question: "인테리어 예산은 총 얼마를 생각하시나요?",
    helper: "예산 선택 시 더 정확한 상담이 가능해요. (상담 시 변경 가능)",
    count: "6 / 8",
    mode: "single" as const,
    field: "budget" as const,
    options: budgetOptions
  },
  {
    title: "인테리어 상담신청",
    label: "시공 일정",
    question: "인테리어가 언제 시작되길 희망하시나요?",
    helper: "신청일 기준으로 알려주시면 일정 조율이 더 빨라집니다.",
    count: "7 / 8",
    mode: "single" as const,
    field: "startTiming" as const,
    options: timingOptions
  },
  {
    title: "인테리어 상담신청",
    label: "연락 정보",
    question: "이름과 연락처, 주소를 입력해주세요.",
    count: "8 / 8",
    mode: "final" as const
  }
] as const;

export function EstimatePage() {
  const query = new URLSearchParams(window.location.search);
  const presetProject = query.get("project") ?? "";
  const presetIssue = query.get("issue") ?? "";
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

    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    body.style.height = "100%";
    documentElement.style.height = "100%";

    return () => {
      body.style.overflow = prevBodyOverflow;
      documentElement.style.overflow = prevHtmlOverflow;
      body.style.height = prevBodyHeight;
      documentElement.style.height = prevHtmlHeight;
    };
  }, []);

  const currentStep = surveySteps[step - 1];
  const stepOneReady = Boolean(draft.spaceType);
  const stepTwoReady = Boolean(draft.areaBand);
  const stepThreeReady = Boolean(draft.propertyStatus);
  const stepFourReady = Boolean(draft.reason);
  const stepFiveReady = draft.selectedRooms.length > 0;
  const stepSixReady = Boolean(draft.budget);
  const stepSevenReady = Boolean(draft.startTiming);
  const reviewEntries = buildReviewEntries(draft);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const uploadedAttachments =
        files.length > 0 ? await Promise.all(files.map((file) => mediaService.uploadInquiryAttachment(file))) : [];

      const roomSummary = draft.selectedRooms.join(", ");
      const addressLine = [draft.postalCode, draft.address, draft.detailAddress].filter(Boolean).join(" ").trim();
      const message = [
        `공간: ${draft.spaceType || "-"}`,
        `평수: ${draft.areaBand || "-"}`,
        `집 상태: ${draft.propertyStatus || "-"}`,
        `상담 이유: ${draft.reason || "-"}`,
        `상담 공간: ${roomSummary || "-"}`,
        draft.selectedRooms.includes("기타 입력") ? `기타 입력: ${draft.otherRoomDetail || "-"}` : null,
        `예산: ${draft.budget || "-"}`,
        `시공 희망 시점: ${draft.startTiming || "-"}`,
        `요청사항: ${draft.requestNote || "-"}`,
        "",
        `개인정보 제3자 제공 동의: ${draft.consent ? "동의" : "미동의"}`
      ]
        .filter(Boolean)
        .join("\n");

      await inquiryService.createInquiry({
        name: draft.name,
        phone: draft.phone,
        serviceArea: addressLine || draft.address,
        message,
        attachments: uploadedAttachments,
        intake: {
          spaceType: draft.spaceType,
          areaBand: draft.areaBand,
          propertyStatus: draft.propertyStatus,
          reason: draft.reason,
          selectedRooms: draft.selectedRooms,
          otherRoomDetail: draft.otherRoomDetail,
          budget: draft.budget,
          startTiming: draft.startTiming,
          name: draft.name,
          phone: draft.phone,
          postalCode: draft.postalCode,
          address: draft.address,
          detailAddress: draft.detailAddress,
          requestNote: draft.requestNote,
          consent: draft.consent
        }
      });

      setDraft({
        ...defaultDraft,
        selectedRooms: presetProject ? [presetProject] : [],
        requestNote: presetIssue
      });
      setFiles([]);
      setStep(1);
      setStage("intro");
      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 4200);
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

  function toggleRoom(option: string) {
    setDraft((current) => {
      const exists = current.selectedRooms.includes(option);
      const selectedRooms = exists ? current.selectedRooms.filter((item) => item !== option) : [...current.selectedRooms, option];

      return {
        ...current,
        selectedRooms,
        otherRoomDetail: selectedRooms.includes("기타 입력") ? current.otherRoomDetail : ""
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
          {business.name}
        </a>
        <a className="estimate-phone" href={business.phoneHref}>
          <Phone size={16} />
          {business.phone}
        </a>
      </header>

      {stage === "intro" ? (
        <section className="estimate-intro-hero" aria-labelledby="estimate-intro-title">
          <img className="estimate-intro-image" src={images.consultHero} alt="상담을 준비하는 리모델링 안내 이미지" />
          <div className="estimate-intro-overlay" />
          <div className="estimate-intro-content">
            <h1 id="estimate-intro-title">나에게 맞는 최고의 전문가를 만나보세요</h1>
            <p>시작하기 전에 상담 신청지를 미리 작성해서 상담 대기 시간을 줄여보세요!</p>
            <button
              className="primary-button estimate-intro-button"
              type="button"
              onClick={() => {
                setStage("survey");
                setStep(1);
              }}
            >
              진행하기
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

            <div className="estimate-panel-head estimate-consult-head">
              <span className="estimate-step-count">{currentStep.count}</span>
              <strong>{currentStep.label}</strong>
            </div>

            <div className="estimate-question-block">
              <h2>{currentStep.question}</h2>
              {"helper" in currentStep ? <p>{currentStep.helper}</p> : null}
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
                {draft.selectedRooms.includes("기타 입력") ? (
                  <label className="estimate-inline-field">
                    기타 입력
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
                  <span className="admin-kicker">선택 내용 확인</span>
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
                      이름
                      <input
                        required
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                        placeholder="이름 입력"
                      />
                    </label>

                    <label>
                      휴대폰번호
                      <span className="estimate-field-help">숫자만 입력하면 자동으로 정리됩니다. 예: 010-1234-5678</span>
                      <input
                        required
                        value={draft.phone}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            phone: formatPhoneNumber(event.target.value)
                          }))
                        }
                        placeholder="010-1234-5678"
                        inputMode="tel"
                        />
                    </label>

                    <label>
                      시공 주소
                      <span className="estimate-field-help">인테리어가 필요한 지역의 전문가를 연결해 드릴 예정입니다.</span>
                      <div className="estimate-postcode-row">
                        <input
                          value={draft.postalCode}
                          onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))}
                          placeholder="우편번호"
                        />
                        <button className="secondary-button" type="button" onClick={() => void handlePostcodeSearch()} disabled={postcodeLoading}>
                          {postcodeLoading ? "검색 중" : "우편번호 검색"}
                        </button>
                      </div>
                      <input
                        required
                        value={draft.address}
                        onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))}
                        placeholder="주소 입력"
                      />
                      <input
                        value={draft.detailAddress}
                        onChange={(event) => setDraft((current) => ({ ...current, detailAddress: event.target.value }))}
                        placeholder="상세 주소"
                      />
                    </label>

                    <label>
                      요청사항 (선택)
                      <textarea
                        rows={4}
                        maxLength={300}
                        value={draft.requestNote}
                        onChange={(event) => setDraft((current) => ({ ...current, requestNote: event.target.value }))}
                        placeholder="ex) 5인가족이라 짐이 많아요. 수납공간을 넉넉하게 배치하고 싶어요."
                      />
                      <span className="estimate-counter">({draft.requestNote.length} / 300)</span>
                    </label>

                    <label className="estimate-consent-box">
                      <input
                        type="checkbox"
                        required
                        checked={draft.consent}
                        onChange={(event) => setDraft((current) => ({ ...current, consent: event.target.checked }))}
                      />
                      <span>
                        <strong>(필수)</strong> 개인정보 제3자 제공 동의
                        <button className="estimate-privacy-link" type="button" onClick={() => setPrivacyOpen(true)}>
                          개인정보 보호 약관 보기
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
                          사진 / 파일 첨부
                          <span className="estimate-field-help">드래그앤드롭 또는 파일 선택으로 추가할 수 있습니다.</span>
                        </label>
                        <div className="estimate-upload-actions">
                          <button className="secondary-button" type="button" onClick={() => openFilePicker()}>
                            파일 추가
                          </button>
                          <button className="secondary-button" type="button" onClick={() => setFiles([])} disabled={!files.length}>
                            모두 삭제
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
                                  변경
                                </button>
                                <button type="button" className="ghost-button" onClick={() => removeFile(index)}>
                                  삭제
                                </button>
                              </div>
                            </figure>
                          ))}
                        </div>
                      ) : (
                        <p className="estimate-field-help">아직 첨부된 파일이 없습니다.</p>
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
                  이전
                </button>
              ) : (
                <button className="ghost-button estimate-back" type="button" onClick={() => setStage("intro")}>
                  <ArrowLeft size={16} />
                  처음으로
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
                  다음
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button className="primary-button" type="submit" disabled={status === "submitting" || !draft.consent}>
                  <Send size={19} />
                  {status === "submitting" ? "저장 중" : "견적상담 보내기"}
                </button>
              )}
            </div>

            {status === "success" ? <p className="form-success">문의가 저장되었습니다. 확인 후 연락드리겠습니다.</p> : null}
            {status === "error" ? <p className="form-error">{error || "문의 저장에 실패했습니다."}</p> : null}
          </form>

          {privacyOpen ? <PrivacyModal onClose={() => setPrivacyOpen(false)} /> : null}
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

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="estimate-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="estimate-privacy-title" onClick={onClose}>
      <div className="estimate-modal" onClick={(event) => event.stopPropagation()}>
        <div className="estimate-modal-header">
          <div>
            <span className="admin-kicker">
              <ShieldCheck size={16} />
              개인정보처리방침
            </span>
            <h3 id="estimate-privacy-title">문의와 상담에 필요한 최소 정보만 처리합니다</h3>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="estimate-modal-body">
          <section className="privacy-section">
            <h2>수집 항목</h2>
            <p>이름, 연락처, 지역, 문의 내용, 사진 첨부, 로그인 이메일, 문의 작성 시각과 상태 정보.</p>
          </section>
          <section className="privacy-section">
            <h2>이용 목적</h2>
            <p>견적 안내, 현장 상담, 시공 관리, 고객 계정 제공, 관리자 응대, 문의 이력 보관.</p>
          </section>
          <section className="privacy-section">
            <h2>보관과 삭제</h2>
            <p>상담과 시공 완료 후에도 분쟁 대응과 사후 관리가 필요한 기간 동안 보관할 수 있으며, 삭제 요청 시 관련 법령과 내부 보관 기준에 따라 처리합니다.</p>
          </section>
          <section className="privacy-section">
            <h2>제3자 제공</h2>
            <p>원칙적으로 외부에 제공하지 않으며, 사용자가 선택한 저장·알림 서비스는 운영 목적 범위 내에서만 사용합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function buildReviewEntries(draft: EstimateState) {
  const rooms = draft.selectedRooms.length ? draft.selectedRooms.join(", ") : "-";
  const roomDetail = draft.selectedRooms.includes("기타 입력") && draft.otherRoomDetail ? draft.otherRoomDetail : "-";

  return [
    { label: "공간", value: draft.spaceType || "-" },
    { label: "평수", value: draft.areaBand || "-" },
    { label: "집 상태", value: draft.propertyStatus || "-" },
    { label: "상담 이유", value: draft.reason || "-" },
    { label: "상담 공간", value: rooms },
    { label: "기타 입력", value: roomDetail },
    { label: "예산", value: draft.budget || "-" },
    { label: "시공 일정", value: draft.startTiming || "-" },
    { label: "요청사항", value: draft.requestNote || "-" }
  ];
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
