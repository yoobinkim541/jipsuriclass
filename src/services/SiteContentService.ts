import { business, cases as defaultCases, defaultCertifications, navItems, pinnedPosts, process as defaultProcess, services as defaultServices, symptoms as defaultSymptoms } from "../data";
import { images } from "../assets/images";
import { defaultLandingPageContent, getLandingPageDefaultContent, landingPageDefinitions, mergeLandingPageContent, type LandingPageContent } from "../landingPages";
import { defaultHomepageSectionOrder, normalizeSectionOrder } from "../contentSections";
import { supabase } from "../lib/supabaseClient";
import { diagnosisTopics } from "../diagnosis/diagnosisData";
import type {
  AccountPageContent,
  DiagnosisPageContent,
  DiagnosisTopicContent,
  EstimatePageContent,
  EstimateSurveyStepContent,
  HomepageContent,
  SiteSettingsContent,
  HomepageHeroProof,
  HomepageHeroTrustItem,
  PrivacyPageContent
} from "../types";

type SiteContentRow = {
  payload: unknown;
  updated_at: string;
};

const CONTENT_IDS = {
  homepage: "homepage",
  account: "account",
  estimate: "estimate",
  landingPages: "landing-pages",
  privacy: "privacy",
  diagnosis: "diagnosis",
  siteSettings: "site-settings"
} as const;

export type LandingPagesContent = Record<string, LandingPageContent>;

export const defaultLandingPagesContent: LandingPagesContent = Object.fromEntries(
  landingPageDefinitions.map((page) => [page.path, getLandingPageDefaultContent(page.path) ?? defaultLandingPageContent[page.path]])
);

export const defaultHomepageContent: HomepageContent = {
  sections: defaultHomepageSectionOrder,
  navLabels: navItems.map((item) => item.label),
  hero: {
    title: "클라쓰가 다른 종합집수리",
    description:
      "사진 상담으로 증상을 먼저 확인하고, 필요한 작업만 설명합니다. 생활 집수리, 누수 복구, 원상복구까지 현장 중심으로 처리합니다.",
    image: images.heroFallback,
    imagePosition: "center center",
    imageScale: 1,
    mediaNote: "현장 사진 확인 후 작업 범위를 안내합니다",
    primaryActionLabel: "전화 상담",
    secondaryActionLabel: "카카오톡 상담",
    tertiaryActionLabel: "견적 상담",
    rotatorWords: ["한 통의 전화", "사진 몇 장", "5분의 상담", "한 번의 방문"],
    proofs: [
      { label: "진행 과정", value: "전화·문자 상담 → 현장 방문 → 상세 견적 → 공사 진행" },
      { label: "작업 범위", value: "부분수리부터 전체 리모델링까지" },
      { label: "현장 기록", value: "네이버 블로그 포트폴리오" }
    ],
    trust: [
      { num: "7", label: "국가공인 자격", sub: "대표 직접 보유 · 직접 시공" },
      { num: "31", label: "가능 작업", sub: "생활 보수부터 전체 리모델링까지" },
      { num: "13시간", label: "운영 시간", sub: "월~토 08:00 – 21:00" }
    ],
    slides: []
  },
  about: {
    eyebrow: business.name,
    title: "작은 불편도 현장에서 끝까지 확인합니다",
    description: business.introduction,
    strengths: business.strengths
  },
  symptoms: defaultSymptoms,
  specialties: business.specialties,
  services: defaultServices.map((service) => ({
    title: service.title,
    text: service.text
  })),
  cases: defaultCases.map((item) => ({
    title: item.title,
    area: item.area,
    problem: item.problem,
    solution: item.solution,
    image: item.image,
    link: item.link
  })),
  blog: pinnedPosts.slice(0, 5).map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    link: post.link,
    image: post.image
  })),
  process: defaultProcess.map((item) => ({
    title: item.title,
    text: item.text,
    image: item.image
  })),
  contact: {
    title: "사진을 보내주시면 작업 가능 여부부터 확인합니다",
    description:
      "급한 누수, 부분 파손, 퇴거 전 복구처럼 상황이 명확할수록 상담이 빠릅니다. 모바일에서는 하단 버튼으로 바로 연락할 수 있습니다."
  }
};

export const defaultAccountPageContent: AccountPageContent = {
  hero: {
    kicker: "마이페이지",
    title: "내 문의와 로그인 수단을 관리합니다",
    description: "문의 내역을 보고, 이 계정에 이메일 비밀번호나 Google 로그인 수단을 추가할 수 있습니다.",
    notes: ["실시간 문의 확인", "계정 보안 관리", "첨부 사진 포함"]
  },
  auth: {
    loadingText: "세션 확인 중",
    currentLoginLabel: "현재 로그인",
    collapseLabel: "접기",
    expandLabel: "펼치기",
    passwordLabel: "비밀번호 추가/변경",
    passwordPlaceholder: "새 비밀번호",
    passwordSaveLabel: "비밀번호 저장",
    googleConnectLabel: "Google 연결",
    passwordSavingLabel: "저장 중",
    googleConnectingLabel: "연결 중",
    accountMessageEmptyText: "",
    collapsedNote: "모바일에서는 계정 관리 영역을 접어 문의 목록이 먼저 보이도록 합니다.",
    noSessionLabel: "세션 없음",
    noSessionTitle: "로그인이 필요합니다",
    noSessionDescription: "이전에 남긴 문의를 보려면 로그인하세요.",
    loginLinkLabel: "로그인 페이지로 이동"
  },
  summary: [
    {
      label: "총 문의",
      description: "최근 100건까지 빠르게 확인합니다."
    },
    {
      label: "새 문의",
      description: "아직 처리 전인 문의만 따로 볼 수 있습니다."
    },
    {
      label: "알림 발송",
      description: "관리자 알림이 전송된 항목을 보여줍니다."
    }
  ],
  list: {
    kicker: "문의 관리",
    title: "내가 남긴 문의를 바로 수정할 수 있습니다",
    description: "상태와 첨부 파일, 메모를 한 화면에서 정리합니다.",
    loadingText: "문의를 불러오는 중",
    emptyText: "본인 명의의 문의가 없습니다.",
    detailToggleLabel: "상세",
    editLabel: "수정",
    cancelLabel: "취소",
    saveLabel: "저장",
    nameLabel: "이름",
    phoneLabel: "연락처",
    areaLabel: "지역",
    messageLabel: "문의 내용",
    sourceLabel: "출처",
    attachmentLabel: "첨부",
    notifiedLabel: "알림",
    noAreaText: "지역 미입력"
  },
  intakeLabels: {
    propertyType: "집 환경",
    projectType: "공사 유형",
    address: "주소",
    preferredTime: "상담 가능 시간",
    budget: "예산"
  }
};

const estimateSteps: EstimateSurveyStepContent[] = [
  {
    title: "인테리어 상담신청",
    label: "반갑습니다. 고객님!",
    question: "인테리어가 필요한 공간은 어디인가요?",
    count: "1 / 8",
    helper: "",
    field: "spaceType",
    mode: "single",
    options: ["아파트", "빌라", "단독주택", "오피스텔"]
  },
  {
    title: "인테리어 상담신청",
    label: "평수 선택",
    question: "인테리어 공간의 평수를 선택해주세요.",
    count: "2 / 8",
    helper: "",
    field: "areaBand",
    mode: "single",
    options: ["10~20평대", "30평대", "40평대", "50평대 이상"]
  },
  {
    title: "인테리어 상담신청",
    label: "집 상태",
    question: "인테리어 할 집은 어떤 상태인가요?",
    count: "3 / 8",
    helper: "",
    field: "propertyStatus",
    mode: "single",
    options: ["짐보관 후 살면서 공사예정", "현재 공실", "시공 시 공실 예정", "신축입주", "현재 거주중", "기타 (부동산 미계약 상태)"]
  },
  {
    title: "인테리어 상담신청",
    label: "상담 이유",
    question: "인테리어를 고려하시게 된 주요 이유를 선택해주세요.",
    count: "4 / 8",
    helper: "",
    field: "reason",
    mode: "single",
    options: ["집을 구매하여 리모델링 계획 중", "사는 집을 새롭게 바꾸기 위해", "매매나 임대를 위한 리모델링", "기타"]
  },
  {
    title: "인테리어 상담신청",
    label: "상담 공간",
    question: "인테리어가 필요한 공간을 모두 골라주세요.",
    helper: '특정 공간 내 상품 부분교체만 원하시는 경우 "기타 입력"으로 신청해주세요. 예시) 싱크대 수전, 아일랜드장, 양변기, 도배/마루(거실만) 등',
    count: "5 / 8",
    field: "selectedRooms",
    mode: "multi",
    options: ["키친", "바스", "수납", "마루", "중문", "도어", "창호", "필름", "벽지", "조명", "타일", "기타 입력"]
  },
  {
    title: "인테리어 상담신청",
    label: "예산",
    question: "인테리어 예산은 총 얼마를 생각하시나요?",
    helper: "예산 선택 시 더 정확한 상담이 가능해요. (상담 시 변경 가능)",
    count: "6 / 8",
    field: "budget",
    mode: "single",
    options: ["5백만원 이하", "1천만원 이하", "2천만원 이하", "3천만원 이하", "4천만원 이하", "5천만원 이하", "6천만원 이하", "7천만원 이하", "1억원 이하", "아직 미정이에요"]
  },
  {
    title: "인테리어 상담신청",
    label: "시공 일정",
    question: "인테리어가 언제 시작되길 희망하시나요?",
    helper: "신청일 기준으로 알려주시면 일정 조율이 더 빨라집니다.",
    count: "7 / 8",
    field: "startTiming",
    mode: "single",
    options: ["1개월 이내", "2개월 이내", "3개월 이내", "3개월 이후", "6개월 이후"]
  },
  {
    title: "인테리어 상담신청",
    label: "연락 정보",
    question: "이름과 연락처, 주소를 입력해주세요.",
    count: "8 / 8",
    helper: "",
    field: "final",
    mode: "final",
    options: []
  }
];

export const defaultEstimatePageContent: EstimatePageContent = {
  otherRoomLabel: "기타 입력",
  header: {
    homeLinkLabel: business.name,
    phoneLabel: business.phone
  },
  intro: {
    title: "나에게 맞는 최고의 전문가를 만나보세요",
    description: "시작하기 전에 상담 신청지를 미리 작성해서 상담 대기 시간을 줄여보세요!",
    buttonLabel: "진행하기",
    heroAlt: "상담을 준비하는 리모델링 안내 이미지"
  },
  steps: estimateSteps,
  final: {
    reviewKicker: "선택 내용 확인",
    nameLabel: "이름",
    namePlaceholder: "이름 입력",
    phoneLabel: "휴대폰번호",
    phoneHelp: "숫자만 입력하면 자동으로 정리됩니다. 예: 010-1234-5678",
    phonePlaceholder: "010-1234-5678",
    addressLabel: "시공 주소",
    addressHelp: "인테리어가 필요한 지역의 전문가를 연결해 드릴 예정입니다.",
    postcodePlaceholder: "우편번호",
    postcodeButtonLabel: "우편번호 검색",
    addressPlaceholder: "주소 입력",
    detailAddressPlaceholder: "상세 주소",
    requestLabel: "요청사항 (선택)",
    requestPlaceholder: "ex) 5인가족이라 짐이 많아요. 수납공간을 넉넉하게 배치하고 싶어요.",
    requestCounterSuffix: "/ 300",
    consentLabel: "개인정보 제3자 제공 동의",
    privacyLinkLabel: "개인정보 보호 약관 보기",
    attachmentTitle: "사진 / 파일 첨부",
    attachmentHelp: "드래그앤드롭 또는 파일 선택으로 추가할 수 있습니다.",
    fileAddLabel: "파일 추가",
    fileClearLabel: "모두 삭제",
    fileReplaceLabel: "변경",
    fileDeleteLabel: "삭제",
    noAttachmentText: "아직 첨부된 파일이 없습니다.",
    backLabel: "이전",
    firstLabel: "처음으로",
    nextLabel: "다음",
    submitLabel: "견적상담 보내기",
    submittingLabel: "저장 중",
    successMessage: "문의가 저장되었습니다. 확인 후 연락드리겠습니다.",
    errorMessage: "문의 저장에 실패했습니다."
  },
  privacy: {
    kicker: "개인정보처리방침",
    title: "문의와 상담에 필요한 최소 정보만 처리합니다",
    closeLabel: "닫기",
    sections: [
      {
        heading: "수집 항목",
        body: "이름, 연락처, 지역, 문의 내용, 사진 첨부, 로그인 이메일, 문의 작성 시각과 상태 정보."
      },
      {
        heading: "이용 목적",
        body: "견적 안내, 현장 상담, 시공 관리, 고객 계정 제공, 관리자 응대, 문의 이력 보관."
      },
      {
        heading: "보관과 삭제",
        body: "상담과 시공 완료 후에도 분쟁 대응과 사후 관리가 필요한 기간 동안 보관할 수 있으며, 삭제 요청 시 관련 법령과 내부 보관 기준에 따라 처리합니다."
      },
      {
        heading: "제3자 제공",
        body: "원칙적으로 외부에 제공하지 않으며, 사용자가 선택한 저장·알림 서비스는 운영 목적 범위 내에서만 사용합니다."
      }
    ]
  },
  reviewLabels: {
    spaceType: "공간",
    areaBand: "평수",
    propertyStatus: "집 상태",
    reason: "상담 이유",
    selectedRooms: "상담 공간",
    otherRoomDetail: "기타 입력",
    budget: "예산",
    startTiming: "시공 일정",
    requestNote: "요청사항"
  }
};

export const defaultPrivacyPageContent: PrivacyPageContent = {
  intro: {
    kicker: "개인정보처리방침",
    title: "문의와 상담에 필요한 최소 정보만 처리합니다",
    description:
      "집수리클라쓰는 견적 문의, 고객 응대, 시공 상담, 사후 확인을 위해 이름, 연락처, 지역, 문의 내용, 첨부 사진, 로그인 계정 정보를 처리합니다."
  },
  sections: [
    { heading: "수집 항목", body: "이름, 연락처, 지역, 문의 내용, 사진 첨부, 로그인 이메일, 문의 작성 시각과 상태 정보." },
    { heading: "이용 목적", body: "견적 안내, 현장 상담, 시공 관리, 고객 계정 제공, 관리자 응대, 문의 이력 보관." },
    {
      heading: "보관과 삭제",
      body: "상담과 시공 완료 후에도 분쟁 대응과 사후 관리가 필요한 기간 동안 보관할 수 있으며, 삭제 요청 시 관련 법령과 내부 보관 기준에 따라 처리합니다."
    },
    {
      heading: "제3자 제공",
      body: "원칙적으로 외부에 제공하지 않으며, 사용자가 선택한 저장·알림 서비스는 운영 목적 범위 내에서만 사용합니다."
    },
    { heading: "문의", body: `개인정보 관련 문의는 전화 ${business.phone} 또는 사이트 문의 채널로 접수할 수 있습니다.` }
  ],
  contactNote: business.name
};

export const defaultDiagnosisPageContent: DiagnosisPageContent = {
  hero: {
    kicker: "간편 자가진단",
    title: "증상을 클릭하면 바로 원인과 다음 행동이 보입니다",
    description:
      '"문이 좀 뻑뻑해요" 같은 생활 증상을 먼저 고르고, 원인 후보와 자가 점검 포인트를 확인한 뒤 필요한 경우 바로 상담으로 이어갑니다.',
    quickFlow: ["카테고리 선택", "증상 클릭", "원인 확인 후 상담 연결"]
  },
  sections: {
    categoryTitle: "어떤 부분이 문제인가요?",
    categoryDescription: "해당하는 카테고리를 먼저 선택하세요.",
    symptomTitle: "어떤 증상인가요?",
    symptomDescription: "가장 비슷한 증상을 클릭하세요.",
    answerTitle: "답변",
    answerDescription: "선택한 증상에 따라 바로 확인해야 할 포인트를 정리합니다."
  },
  topics: diagnosisTopics.map((topic) => ({
    id: topic.id,
    trigger: topic.trigger,
    title: topic.title,
    summary: topic.summary,
    likelyCauses: [...topic.likelyCauses],
    firstChecks: [...topic.firstChecks],
    whenToCall: topic.whenToCall,
    ctaLabel: topic.ctaLabel,
    ctaHref: topic.ctaHref
  }))
};

export const defaultSiteSettingsContent: SiteSettingsContent = {
  name: business.name,
  owner: business.owner,
  phone: business.phone,
  address: business.address,
  hours: business.hours,
  area: business.area,
  kakaoUrl: business.kakaoUrl,
  naverBlogUrl: business.naverBlogUrl,
  mapUrl: business.mapUrl,
  registrationNumber: business.registrationNumber,
  certifications: [...defaultCertifications]
};

export class SiteContentService {
  async loadHomepageContent(): Promise<HomepageContent> {
    return this.loadContent(CONTENT_IDS.homepage, defaultHomepageContent, mergeHomepageContent, isHomepageContent);
  }

  async loadAccountContent(): Promise<AccountPageContent> {
    return this.loadContent(CONTENT_IDS.account, defaultAccountPageContent, mergeAccountPageContent, isAccountPageContent);
  }

  async loadEstimateContent(): Promise<EstimatePageContent> {
    return this.loadContent(CONTENT_IDS.estimate, defaultEstimatePageContent, mergeEstimatePageContent, isEstimatePageContent);
  }

  async saveHomepageContent(content: HomepageContent) {
    await this.saveContent(CONTENT_IDS.homepage, content, isHomepageContent);
  }

  async saveAccountContent(content: AccountPageContent) {
    await this.saveContent(CONTENT_IDS.account, content, isAccountPageContent);
  }

  async saveEstimateContent(content: EstimatePageContent) {
    await this.saveContent(CONTENT_IDS.estimate, content, isEstimatePageContent);
  }

  async loadPrivacyContent(): Promise<PrivacyPageContent> {
    return this.loadContent(CONTENT_IDS.privacy, defaultPrivacyPageContent, mergePrivacyPageContent, isPrivacyPageContent);
  }

  async savePrivacyContent(content: PrivacyPageContent) {
    await this.saveContent(CONTENT_IDS.privacy, content, isPrivacyPageContent);
  }

  async loadDiagnosisContent(): Promise<DiagnosisPageContent> {
    return this.loadContent(CONTENT_IDS.diagnosis, defaultDiagnosisPageContent, mergeDiagnosisPageContent, isDiagnosisPageContent);
  }

  async saveDiagnosisContent(content: DiagnosisPageContent) {
    await this.saveContent(CONTENT_IDS.diagnosis, content, isDiagnosisPageContent);
  }

  async loadSiteSettingsContent(): Promise<SiteSettingsContent> {
    return this.loadContent(CONTENT_IDS.siteSettings, defaultSiteSettingsContent, mergeSiteSettingsContent, isSiteSettingsContent);
  }

  async saveSiteSettingsContent(content: SiteSettingsContent) {
    await this.saveContent(CONTENT_IDS.siteSettings, content, isSiteSettingsContent);
  }

  async loadLandingPagesContent(): Promise<LandingPagesContent> {
    return this.loadContent(
      CONTENT_IDS.landingPages,
      defaultLandingPagesContent,
      mergeLandingPagesContent,
      isLandingPagesContent
    );
  }

  async saveLandingPagesContent(content: LandingPagesContent) {
    await this.saveContent(CONTENT_IDS.landingPages, content, isLandingPagesContent);
  }

  private async loadContent<T>(
    id: string,
    base: T,
    merge: (base: T, override: unknown) => T,
    validate: (value: unknown) => value is T
  ): Promise<T> {
    if (!supabase) {
      return base;
    }

    const { data, error } = await supabase.from("site_content").select("payload, updated_at").eq("id", id).maybeSingle();

    if (error || !data) {
      return base;
    }

    const row = data as SiteContentRow;
    const merged = merge(base, row.payload);
    return validate(merged) ? merged : base;
  }

  private async saveContent<T>(id: string, content: T, validate: (value: unknown) => value is T) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    if (!validate(content)) {
      throw new Error("Invalid content schema");
    }

    const { error } = await supabase.from("site_content").upsert({ id, payload: content }, { onConflict: "id" });

    if (error) {
      throw error;
    }

    // 편집 이력 기록(best-effort) — 실패해도 저장 자체는 성공으로 둔다.
    await this.logContentSave(id);
  }

  /** 콘텐츠 저장을 편집 이력(content_audit)에 남긴다. */
  private async logContentSave(id: string) {
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getUser();
      const actorEmail = data.user?.email ?? null;
      await supabase.from("content_audit").insert({ content_id: id, label: contentLabel(id), actor_email: actorEmail });
    } catch {
      /* 이력 기록 실패는 무시 */
    }
  }

  /** 최근 편집 이력 조회(관리자 편집 이력 탭). */
  async listContentAudit(limit = 40): Promise<ContentAuditRow[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("content_audit")
      .select("id, content_id, label, actor_email, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data as ContentAuditRow[];
  }
}

export type ContentAuditRow = {
  id: string;
  content_id: string;
  label: string | null;
  actor_email: string | null;
  created_at: string;
};

/** 콘텐츠 id → 사람이 읽는 편집 영역 이름. */
export function contentLabel(id: string): string {
  const map: Record<string, string> = {
    homepage: "홈페이지",
    account: "마이페이지",
    estimate: "견적상담",
    "landing-pages": "랜딩페이지",
    privacy: "개인정보처리방침",
    diagnosis: "자기진단",
    "site-settings": "사이트 설정"
  };
  return map[id] ?? id;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isServiceCard(value: unknown): value is HomepageContent["services"][number] {
  return isRecord(value) && isString(value.title) && isString(value.text);
}

function isCaseCard(value: unknown): value is HomepageContent["cases"][number] {
  return (
    isRecord(value) &&
    isString(value.title) &&
    isString(value.area) &&
    isString(value.problem) &&
    isString(value.solution) &&
    isString(value.image) &&
    isString(value.link)
  );
}

function isBlogPost(value: unknown): value is HomepageContent["blog"][number] {
  return isRecord(value) && isString(value.title) && isString(value.description) && isString(value.date) && isString(value.link) && isString(value.image);
}

function isProcessStep(value: unknown): value is HomepageContent["process"][number] {
  return isRecord(value) && isString(value.title) && isString(value.text);
}

function isHeroSlide(value: unknown): value is HomepageContent["hero"]["slides"][number] {
  return isRecord(value) && isString(value.image) && isString(value.position) && typeof value.scale === "number";
}

function isHeroProof(value: unknown): value is HomepageHeroProof {
  return isRecord(value) && isString(value.label) && isString(value.value);
}

function isHeroTrustItem(value: unknown): value is HomepageHeroTrustItem {
  return isRecord(value) && isString(value.num) && isString(value.label) && isString(value.sub);
}

function isHomepageContent(value: unknown): value is HomepageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.navLabels) &&
    value.navLabels.every((item) => typeof item === "string") &&
    isRecord(value.hero) &&
    isString(value.hero.title) &&
    isString(value.hero.description) &&
    isString(value.hero.image) &&
    isString(value.hero.imagePosition) &&
    typeof value.hero.imageScale === "number" &&
    isString(value.hero.mediaNote) &&
    isString(value.hero.primaryActionLabel) &&
    isString(value.hero.secondaryActionLabel) &&
    isString(value.hero.tertiaryActionLabel) &&
    Array.isArray(value.hero.rotatorWords) &&
    value.hero.rotatorWords.every((item) => typeof item === "string") &&
    Array.isArray(value.hero.proofs) &&
    value.hero.proofs.every(isHeroProof) &&
    Array.isArray(value.hero.trust) &&
    value.hero.trust.every(isHeroTrustItem) &&
    Array.isArray(value.hero.slides) &&
    value.hero.slides.every(isHeroSlide) &&
    isRecord(value.about) &&
    isString(value.about.eyebrow) &&
    isString(value.about.title) &&
    isString(value.about.description) &&
    isStringArray(value.about.strengths) &&
    Array.isArray(value.sections) &&
    value.sections.every((item) => typeof item === "string") &&
    Array.isArray(value.symptoms) &&
    value.symptoms.every((item) => typeof item === "string") &&
    Array.isArray(value.specialties) &&
    value.specialties.every((item) => typeof item === "string") &&
    Array.isArray(value.services) &&
    value.services.every(isServiceCard) &&
    Array.isArray(value.cases) &&
    value.cases.every(isCaseCard) &&
    Array.isArray(value.blog) &&
    value.blog.every(isBlogPost) &&
    Array.isArray(value.process) &&
    value.process.every(isProcessStep) &&
    isRecord(value.contact) &&
    isString(value.contact.title) &&
    isString(value.contact.description)
  );
}

export function mergeHomepageContent(base: HomepageContent, override: unknown): HomepageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<HomepageContent>;

  function mergeTextArray<T>(
    source: unknown,
    baseItems: T[],
    createItem: (item: Record<string, unknown>, index: number) => T,
    isItem: (value: unknown) => value is Record<string, unknown>
  ): T[] {
    if (!Array.isArray(source)) {
      return baseItems;
    }

    const length = Math.max(baseItems.length, source.length);
    return Array.from({ length }, (_, index) => {
      const incoming = source[index];
      if (isItem(incoming)) {
        return createItem(incoming, index);
      }

      return baseItems[index] ?? createItem({}, index);
    });
  }

  return {
    sections: normalizeSectionOrder(input.sections, base.sections),
    navLabels: Array.isArray(input.navLabels) ? input.navLabels.filter((item): item is string => typeof item === "string") : base.navLabels,
    hero: {
      ...base.hero,
      ...(input.hero ?? {}),
      rotatorWords: Array.isArray(input.hero?.rotatorWords)
        ? input.hero!.rotatorWords.filter((item): item is string => typeof item === "string")
        : base.hero.rotatorWords,
      proofs: Array.isArray(input.hero?.proofs) ? input.hero!.proofs.filter(isHeroProof) : base.hero.proofs,
      trust: Array.isArray(input.hero?.trust) ? input.hero!.trust.filter(isHeroTrustItem) : base.hero.trust,
      slides: Array.isArray(input.hero?.slides)
        ? input.hero!.slides.filter(isHeroSlide)
        : base.hero.slides
    },
    about: {
      ...base.about,
      ...(input.about ?? {}),
      strengths: Array.isArray(input.about?.strengths) ? input.about!.strengths : base.about.strengths
    },
    symptoms: Array.isArray(input.symptoms) ? input.symptoms.filter((item): item is string => typeof item === "string") : base.symptoms,
    specialties: Array.isArray(input.specialties) ? input.specialties.filter((item): item is string => typeof item === "string") : base.specialties,
    services: Array.isArray(input.services) && input.services.length === base.services.length
      ? mergeTextArray(
          input.services,
          base.services,
          (item, index) => ({
            title: typeof item.title === "string" ? item.title : base.services[index]?.title ?? "",
            text: typeof item.text === "string" ? item.text : base.services[index]?.text ?? ""
          }),
          (value): value is Record<string, unknown> => typeof value === "object" && value !== null
        )
      : base.services,
    cases: base.cases,
    blog: Array.isArray(input.blog) && input.blog.length === base.blog.length
      ? mergeTextArray(
          input.blog,
          base.blog,
          (item, index) => ({
            title: typeof item.title === "string" ? item.title : base.blog[index]?.title ?? "",
            description: typeof item.description === "string" ? item.description : base.blog[index]?.description ?? "",
            date: typeof item.date === "string" ? item.date : base.blog[index]?.date ?? "",
            link: typeof item.link === "string" ? item.link : base.blog[index]?.link ?? "",
            image: base.blog[index]?.image ?? ""
          }),
          (value): value is Record<string, unknown> => typeof value === "object" && value !== null
        )
      : base.blog,
    process: mergeTextArray(
      input.process,
      base.process,
      (item, index) => ({
        title: typeof item.title === "string" ? item.title : base.process[index]?.title ?? "",
        text: typeof item.text === "string" ? item.text : base.process[index]?.text ?? "",
        image: base.process[index]?.image ?? ""
      }),
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null
    ),
    contact: {
      ...base.contact,
      ...(input.contact ?? {})
    }
  };
}

function mergeAccountPageContent(base: AccountPageContent, override: unknown): AccountPageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<AccountPageContent>;

  return {
    hero: {
      ...base.hero,
      ...(input.hero ?? {}),
      notes: Array.isArray(input.hero?.notes) ? input.hero!.notes.filter((item): item is string => typeof item === "string") : base.hero.notes
    },
    auth: {
      ...base.auth,
      ...(input.auth ?? {})
    },
    summary: Array.isArray(input.summary)
      ? base.summary.map((item, index) => ({
          ...item,
          ...(input.summary?.[index] ?? {})
        }))
      : base.summary,
    list: {
      ...base.list,
      ...(input.list ?? {})
    },
    intakeLabels: {
      ...base.intakeLabels,
      ...(input.intakeLabels ?? {})
    }
  };
}

function mergeEstimatePageContent(base: EstimatePageContent, override: unknown): EstimatePageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<EstimatePageContent>;

  return {
    otherRoomLabel: typeof input.otherRoomLabel === "string" ? input.otherRoomLabel : base.otherRoomLabel,
    header: {
      ...base.header,
      ...(input.header ?? {})
    },
    intro: {
      ...base.intro,
      ...(input.intro ?? {})
    },
    steps: Array.isArray(input.steps)
      ? base.steps.map((item, index) => {
          const incoming = input.steps?.[index];
          if (!incoming || typeof incoming !== "object") {
            return item;
          }

          return {
            ...item,
            ...(incoming as Partial<EstimateSurveyStepContent>),
            options: Array.isArray((incoming as Partial<EstimateSurveyStepContent>).options)
              ? (incoming as Partial<EstimateSurveyStepContent>).options!.filter((option): option is string => typeof option === "string")
              : item.options
          };
        })
      : base.steps,
    final: {
      ...base.final,
      ...(input.final ?? {})
    },
    privacy: {
      ...base.privacy,
      ...(input.privacy ?? {}),
      sections: Array.isArray(input.privacy?.sections)
        ? base.privacy.sections.map((item, index) => ({
            ...item,
            ...(input.privacy?.sections?.[index] ?? {})
          }))
        : base.privacy.sections
    },
    reviewLabels: {
      ...base.reviewLabels,
      ...(input.reviewLabels ?? {})
    }
  };
}

function mergePrivacyPageContent(base: PrivacyPageContent, override: unknown): PrivacyPageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<PrivacyPageContent>;

  return {
    intro: { ...base.intro, ...(input.intro ?? {}) },
    sections: Array.isArray(input.sections)
      ? input.sections
          .filter((item): item is { heading: string; body: string } => isRecord(item) && isString(item.heading) && isString(item.body))
          .map((item) => ({ heading: item.heading, body: item.body }))
      : base.sections,
    contactNote: typeof input.contactNote === "string" ? input.contactNote : base.contactNote
  };
}

function isPrivacyPageContent(value: unknown): value is PrivacyPageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.intro) &&
    isString(value.intro.kicker) &&
    isString(value.intro.title) &&
    isString(value.intro.description) &&
    Array.isArray(value.sections) &&
    value.sections.every((item) => isRecord(item) && isString(item.heading) && isString(item.body)) &&
    isString(value.contactNote)
  );
}

function mergeDiagnosisPageContent(base: DiagnosisPageContent, override: unknown): DiagnosisPageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<DiagnosisPageContent>;
  const overrideTopics = Array.isArray(input.topics) ? input.topics : [];

  return {
    hero: {
      ...base.hero,
      ...(input.hero ?? {}),
      quickFlow: Array.isArray(input.hero?.quickFlow)
        ? input.hero!.quickFlow.filter((item): item is string => typeof item === "string")
        : base.hero.quickFlow
    },
    sections: { ...base.sections, ...(input.sections ?? {}) },
    // 토픽은 코드의 카테고리 매핑(id 기준)과 연결되므로 id로 병합해 구조를 보존한다
    // (편집기는 텍스트만 수정하고 토픽 추가·삭제는 하지 않는다).
    topics: base.topics.map((topic) => {
      const incoming = overrideTopics.find((item) => isRecord(item) && item.id === topic.id) as
        | Partial<DiagnosisTopicContent>
        | undefined;
      if (!incoming) {
        return topic;
      }
      return {
        ...topic,
        ...incoming,
        id: topic.id,
        likelyCauses: Array.isArray(incoming.likelyCauses)
          ? incoming.likelyCauses.filter((item): item is string => typeof item === "string")
          : topic.likelyCauses,
        firstChecks: Array.isArray(incoming.firstChecks)
          ? incoming.firstChecks.filter((item): item is string => typeof item === "string")
          : topic.firstChecks
      };
    })
  };
}

function isDiagnosisTopicContent(value: unknown): value is DiagnosisTopicContent {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.trigger) &&
    isString(value.title) &&
    isString(value.summary) &&
    isStringArray(value.likelyCauses) &&
    isStringArray(value.firstChecks) &&
    isString(value.whenToCall) &&
    isString(value.ctaLabel) &&
    isString(value.ctaHref)
  );
}

function isDiagnosisPageContent(value: unknown): value is DiagnosisPageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.hero) &&
    isString(value.hero.kicker) &&
    isString(value.hero.title) &&
    isString(value.hero.description) &&
    isStringArray(value.hero.quickFlow) &&
    isRecord(value.sections) &&
    isString(value.sections.categoryTitle) &&
    isString(value.sections.categoryDescription) &&
    isString(value.sections.symptomTitle) &&
    isString(value.sections.symptomDescription) &&
    isString(value.sections.answerTitle) &&
    isString(value.sections.answerDescription) &&
    Array.isArray(value.topics) &&
    value.topics.every(isDiagnosisTopicContent)
  );
}

function mergeSiteSettingsContent(base: SiteSettingsContent, override: unknown): SiteSettingsContent {
  if (!override || typeof override !== "object") {
    return base;
  }
  const input = override as Partial<SiteSettingsContent>;
  return {
    name: isString(input.name) ? input.name : base.name,
    owner: isString(input.owner) ? input.owner : base.owner,
    phone: isString(input.phone) ? input.phone : base.phone,
    address: isString(input.address) ? input.address : base.address,
    hours: isString(input.hours) ? input.hours : base.hours,
    area: isString(input.area) ? input.area : base.area,
    kakaoUrl: isString(input.kakaoUrl) ? input.kakaoUrl : base.kakaoUrl,
    naverBlogUrl: isString(input.naverBlogUrl) ? input.naverBlogUrl : base.naverBlogUrl,
    mapUrl: isString(input.mapUrl) ? input.mapUrl : base.mapUrl,
    registrationNumber: isString(input.registrationNumber) ? input.registrationNumber : base.registrationNumber,
    certifications: isStringArray(input.certifications)
      ? input.certifications.map((item) => item.trim()).filter(Boolean)
      : base.certifications
  };
}

function isSiteSettingsContent(value: unknown): value is SiteSettingsContent {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isString(value.name) &&
    isString(value.owner) &&
    isString(value.phone) &&
    isString(value.address) &&
    isString(value.hours) &&
    isString(value.area) &&
    isString(value.kakaoUrl) &&
    isString(value.naverBlogUrl) &&
    isString(value.mapUrl) &&
    isString(value.registrationNumber) &&
    isStringArray(value.certifications)
  );
}

function isAccountPageContent(value: unknown): value is AccountPageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.hero) &&
    isString(value.hero.kicker) &&
    isString(value.hero.title) &&
    isString(value.hero.description) &&
    isStringArray(value.hero.notes) &&
    isRecord(value.auth) &&
    isString(value.auth.loadingText) &&
    isString(value.auth.currentLoginLabel) &&
    isString(value.auth.collapseLabel) &&
    isString(value.auth.expandLabel) &&
    isString(value.auth.passwordLabel) &&
    isString(value.auth.passwordPlaceholder) &&
    isString(value.auth.passwordSaveLabel) &&
    isString(value.auth.googleConnectLabel) &&
    isString(value.auth.passwordSavingLabel) &&
    isString(value.auth.googleConnectingLabel) &&
    isString(value.auth.accountMessageEmptyText) &&
    isString(value.auth.collapsedNote) &&
    isString(value.auth.noSessionLabel) &&
    isString(value.auth.noSessionTitle) &&
    isString(value.auth.noSessionDescription) &&
    isString(value.auth.loginLinkLabel) &&
    Array.isArray(value.summary) &&
    value.summary.every((item) => isRecord(item) && isString(item.label) && isString(item.description)) &&
    isRecord(value.list) &&
    isString(value.list.kicker) &&
    isString(value.list.title) &&
    isString(value.list.description) &&
    isString(value.list.loadingText) &&
    isString(value.list.emptyText) &&
    isString(value.list.detailToggleLabel) &&
    isString(value.list.editLabel) &&
    isString(value.list.cancelLabel) &&
    isString(value.list.saveLabel) &&
    isString(value.list.nameLabel) &&
    isString(value.list.phoneLabel) &&
    isString(value.list.areaLabel) &&
    isString(value.list.messageLabel) &&
    isString(value.list.sourceLabel) &&
    isString(value.list.attachmentLabel) &&
    isString(value.list.notifiedLabel) &&
    isString(value.list.noAreaText) &&
    isRecord(value.intakeLabels) &&
    isString(value.intakeLabels.propertyType) &&
    isString(value.intakeLabels.projectType) &&
    isString(value.intakeLabels.address) &&
    isString(value.intakeLabels.preferredTime) &&
    isString(value.intakeLabels.budget)
  );
}

function isEstimatePageContent(value: unknown): value is EstimatePageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.header) &&
    isString(value.otherRoomLabel) &&
    isString(value.header.homeLinkLabel) &&
    isString(value.header.phoneLabel) &&
    isRecord(value.intro) &&
    isString(value.intro.title) &&
    isString(value.intro.description) &&
    isString(value.intro.buttonLabel) &&
    isString(value.intro.heroAlt) &&
    Array.isArray(value.steps) &&
    value.steps.length === 8 &&
    value.steps.every(
      (step) =>
        isRecord(step) &&
        isString(step.title) &&
        isString(step.label) &&
        isString(step.question) &&
        isString(step.helper) &&
        isString(step.count) &&
        isString(step.field) &&
        (step.mode === "single" || step.mode === "multi" || step.mode === "final") &&
        Array.isArray(step.options) &&
        step.options.every((option) => typeof option === "string")
    ) &&
    isRecord(value.final) &&
    isString(value.final.reviewKicker) &&
    isString(value.final.nameLabel) &&
    isString(value.final.namePlaceholder) &&
    isString(value.final.phoneLabel) &&
    isString(value.final.phoneHelp) &&
    isString(value.final.phonePlaceholder) &&
    isString(value.final.addressLabel) &&
    isString(value.final.addressHelp) &&
    isString(value.final.postcodePlaceholder) &&
    isString(value.final.postcodeButtonLabel) &&
    isString(value.final.addressPlaceholder) &&
    isString(value.final.detailAddressPlaceholder) &&
    isString(value.final.requestLabel) &&
    isString(value.final.requestPlaceholder) &&
    isString(value.final.requestCounterSuffix) &&
    isString(value.final.consentLabel) &&
    isString(value.final.privacyLinkLabel) &&
    isString(value.final.attachmentTitle) &&
    isString(value.final.attachmentHelp) &&
    isString(value.final.fileAddLabel) &&
    isString(value.final.fileClearLabel) &&
    isString(value.final.fileReplaceLabel) &&
    isString(value.final.fileDeleteLabel) &&
    isString(value.final.noAttachmentText) &&
    isString(value.final.backLabel) &&
    isString(value.final.firstLabel) &&
    isString(value.final.nextLabel) &&
    isString(value.final.submitLabel) &&
    isString(value.final.submittingLabel) &&
    isString(value.final.successMessage) &&
  isString(value.final.errorMessage) &&
    isRecord(value.privacy) &&
    isString(value.privacy.kicker) &&
    isString(value.privacy.title) &&
    isString(value.privacy.closeLabel) &&
    Array.isArray(value.privacy.sections) &&
    value.privacy.sections.every((item) => isRecord(item) && isString(item.heading) && isString(item.body)) &&
    isRecord(value.reviewLabels) &&
    isString(value.reviewLabels.spaceType) &&
    isString(value.reviewLabels.areaBand) &&
    isString(value.reviewLabels.propertyStatus) &&
    isString(value.reviewLabels.reason) &&
    isString(value.reviewLabels.selectedRooms) &&
    isString(value.reviewLabels.otherRoomDetail) &&
    isString(value.reviewLabels.budget) &&
    isString(value.reviewLabels.startTiming) &&
    isString(value.reviewLabels.requestNote)
  );
}

function isLandingPageContent(value: unknown): value is LandingPageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.sections) &&
    value.sections.every((item) => typeof item === "string") &&
    isString(value.title) &&
    isString(value.description) &&
    Array.isArray(value.searchTerms) &&
    value.searchTerms.every((item) => typeof item === "string") &&
    isString(value.heroTitle) &&
    isString(value.heroDescription) &&
    Array.isArray(value.highlights) &&
    value.highlights.every((item) => typeof item === "string") &&
    isString(value.pointsTitle) &&
    Array.isArray(value.points) &&
    value.points.every((item) => typeof item === "string") &&
    Array.isArray(value.faq) &&
    value.faq.every((item) => isRecord(item) && isString(item.question) && isString(item.answer)) &&
    Array.isArray(value.relatedLinks) &&
    value.relatedLinks.every((item) => isRecord(item) && isString(item.label) && isString(item.href))
  );
}

function isLandingPagesContent(value: unknown): value is LandingPagesContent {
  return (
    isRecord(value) &&
    landingPageDefinitions.every((page) => isLandingPageContent((value as Record<string, unknown>)[page.path]))
  );
}

function mergeLandingPagesContent(base: LandingPagesContent, override: unknown): LandingPagesContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<Record<string, Partial<LandingPageContent>>>;
  return Object.fromEntries(
    landingPageDefinitions.map((page) => {
      const merged = mergeLandingPageContent(page, input[page.path] ?? null);
      return [
        page.path,
        {
          ...merged,
          sections: merged.sections ?? page.sections ?? defaultLandingPageContent[page.path]?.sections ?? []
        }
      ];
    })
  );
}
