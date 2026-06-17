import type { LucideIcon } from "lucide-react";
import type { HomepageSectionId, LandingSectionId } from "./contentSections";

export type BusinessProfile = {
  name: string;
  introduction: string;
  strengths: string[];
  specialties: string[];
  phone: string;
  phoneHref: string;
  kakaoUrl: string;
  naverBlogUrl: string;
  area: string;
  hours: string;
  registrationNumber: string;
  owner: string;
  address: string;
  mapUrl: string;
};

/** 관리자 '사이트 설정'에서 편집하는 영업 정보 + 대표 자격증 목록.
 * 저장 시 site_content(id="site-settings")에 보관되고, 공개 SPA가 로드해 business에 덮어쓴다. */
export type SiteSettingsContent = {
  name: string;
  owner: string;
  phone: string;
  address: string;
  hours: string;
  area: string;
  kakaoUrl: string;
  naverBlogUrl: string;
  mapUrl: string;
  registrationNumber: string;
  certifications: string[];
};

export type NavItem = {
  label: string;
  href: string;
};

export type ServiceCategory = {
  title: string;
  icon: LucideIcon;
  text: string;
  href: string;
};

export type ConstructionCase = {
  title: string;
  area: string;
  problem: string;
  solution: string;
  image: string;
  link: string;
};

export type PortfolioPost = {
  title: string;
  description: string;
  date: string;
  link: string;
  image: string;
  imageCandidates?: string[];
  cardTitle?: string;
  summary?: string[];
  keywords?: string[];
  /** 인기도 점수(공감 + 댓글*2). '블로그 인기글' 정렬용. */
  popularity?: number;
};

export type NaverBlogItem = {
  title: string;
  description: string;
  link: string;
  postdate?: string;
  image?: string;
  imageCandidates?: string[];
  cardTitle?: string;
  summary?: string[];
  keywords?: string[];
  popularity?: number;
};

export type WorkProcessStep = {
  title: string;
  text: string;
  icon: LucideIcon;
  image?: string;
};

export type EditableServiceCard = {
  title: string;
  text: string;
};

export type EditableCaseCard = {
  title: string;
  area: string;
  problem: string;
  solution: string;
  image: string;
  link: string;
};

export type EditableBlogPost = {
  title: string;
  description: string;
  date: string;
  link: string;
  image: string;
  imageCandidates?: string[];
};

export type EditableProcessStep = {
  title: string;
  text: string;
  image?: string;
};

export type HomepageHeroSlide = {
  image: string;
  position: string;
  scale: number;
};

export type HomepageHeroProof = {
  label: string;
  value: string;
};

export type HomepageHeroTrustItem = {
  num: string;
  label: string;
  sub: string;
};

export type HomepageContent = {
  sections: HomepageSectionId[];
  navLabels: string[];
  hero: {
    title: string;
    description: string;
    image: string;
    imagePosition: string;
    imageScale: number;
    mediaNote: string;
    primaryActionLabel: string;
    secondaryActionLabel: string;
    tertiaryActionLabel: string;
    rotatorWords: string[];
    proofs: HomepageHeroProof[];
    trust: HomepageHeroTrustItem[];
    slides: HomepageHeroSlide[];
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    strengths: string[];
  };
  symptoms: string[];
  specialties: string[];
  services: EditableServiceCard[];
  cases: EditableCaseCard[];
  blog: EditableBlogPost[];
  process: EditableProcessStep[];
  contact: {
    title: string;
    description: string;
  };
};

export type AccountPageContent = {
  hero: {
    kicker: string;
    title: string;
    description: string;
    notes: string[];
  };
  auth: {
    loadingText: string;
    currentLoginLabel: string;
    collapseLabel: string;
    expandLabel: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordSaveLabel: string;
    googleConnectLabel: string;
    passwordSavingLabel: string;
    googleConnectingLabel: string;
    accountMessageEmptyText: string;
    collapsedNote: string;
    noSessionLabel: string;
    noSessionTitle: string;
    noSessionDescription: string;
    loginLinkLabel: string;
  };
  summary: Array<{
    label: string;
    description: string;
  }>;
  list: {
    kicker: string;
    title: string;
    description: string;
    loadingText: string;
    emptyText: string;
    detailToggleLabel: string;
    editLabel: string;
    cancelLabel: string;
    saveLabel: string;
    nameLabel: string;
    phoneLabel: string;
    areaLabel: string;
    messageLabel: string;
    sourceLabel: string;
    attachmentLabel: string;
    notifiedLabel: string;
    noAreaText: string;
  };
  intakeLabels: {
    propertyType: string;
    projectType: string;
    address: string;
    preferredTime: string;
    budget: string;
  };
};

export type EstimateSurveyStepContent = {
  title: string;
  label: string;
  question: string;
  helper: string;
  count: string;
  field: "spaceType" | "areaBand" | "propertyStatus" | "reason" | "selectedRooms" | "budget" | "startTiming" | "final";
  mode: "single" | "multi" | "final";
  options: string[];
};

export type EstimatePageContent = {
  otherRoomLabel: string;
  header: {
    homeLinkLabel: string;
    phoneLabel: string;
  };
  intro: {
    title: string;
    description: string;
    buttonLabel: string;
    heroAlt: string;
  };
  steps: EstimateSurveyStepContent[];
  final: {
    reviewKicker: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phoneHelp: string;
    phonePlaceholder: string;
    addressLabel: string;
    addressHelp: string;
    postcodePlaceholder: string;
    postcodeButtonLabel: string;
    addressPlaceholder: string;
    detailAddressPlaceholder: string;
    requestLabel: string;
    requestPlaceholder: string;
    requestCounterSuffix: string;
    consentLabel: string;
    privacyLinkLabel: string;
    attachmentTitle: string;
    attachmentHelp: string;
    fileAddLabel: string;
    fileClearLabel: string;
    fileReplaceLabel: string;
    fileDeleteLabel: string;
    noAttachmentText: string;
    backLabel: string;
    firstLabel: string;
    nextLabel: string;
    submitLabel: string;
    submittingLabel: string;
    successMessage: string;
    errorMessage: string;
  };
  privacy: {
    kicker: string;
    title: string;
    closeLabel: string;
    sections: Array<{
      heading: string;
      body: string;
    }>;
  };
  reviewLabels: {
    spaceType: string;
    areaBand: string;
    propertyStatus: string;
    reason: string;
    selectedRooms: string;
    otherRoomDetail: string;
    budget: string;
    startTiming: string;
    requestNote: string;
  };
};

export type PrivacyPageContent = {
  intro: {
    kicker: string;
    title: string;
    description: string;
  };
  sections: Array<{
    heading: string;
    body: string;
  }>;
  contactNote: string;
};

export type DiagnosisTopicContent = {
  id: string;
  trigger: string;
  title: string;
  summary: string;
  likelyCauses: string[];
  firstChecks: string[];
  whenToCall: string;
  ctaLabel: string;
  ctaHref: string;
};

export type DiagnosisPageContent = {
  hero: {
    kicker: string;
    title: string;
    description: string;
    quickFlow: string[];
  };
  sections: {
    categoryTitle: string;
    categoryDescription: string;
    symptomTitle: string;
    symptomDescription: string;
    answerTitle: string;
    answerDescription: string;
  };
  topics: DiagnosisTopicContent[];
};

export type InquiryQuoteSource = {
  servicePath: string | null;
  pricingPath: string | null;
  works: string[];
  workIds: string[];
};

export type InquiryQuoteLineItem = {
  id: string;
  sourceId: string | null;
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  categoryTitle: string | null;
  note: string | null;
  materialNote: string | null;
};

export type InquiryQuoteCharge = {
  id: string;
  label: string;
  qty: number;
  unitPrice: number;
  amount: number;
  /** 자재비를 묶을 공종(상세내역에서 해당 작업 그룹에 합쳐진다). 미지정 시 '자재'. */
  group?: string;
};

export type InquiryQuoteSnapshot = {
  sourceServicePath: string | null;
  sourcePricingPath: string | null;
  sourceServiceLabel: string | null;
  confirmedAt: string | null;
  selectedWorks: string[];
  selectedWorkIds: string[];
  lineItems: InquiryQuoteLineItem[];
  materialCharges: InquiryQuoteCharge[];
  extraCharges: InquiryQuoteCharge[];
  vatRate: number;
  /** 부가세 직접입력 모드. true면 vatRate를 그대로 쓰고, false/미지정이면 항상 10% 규칙. */
  vatManual?: boolean;
  /** 이윤율(기본 0.08). 직원이 케이스별로 조정 가능. */
  profitRate?: number;
  /** 천원/만원 절삭 보정(음수). 미지정 시 만원 미만 자동 절삭. */
  roundingAdjust?: number;
  /** 계약금(선수금). depositManual=true일 때만 사용. 기본은 총액 30%·만원 올림 규칙. */
  deposit?: number;
  /** 계약금 직접입력 모드. true면 deposit를 그대로 쓰고, false/미지정이면 30% 규칙. */
  depositManual?: boolean;
  /** 공사 규모(예: 24평 아파트 / 욕실 1개). 담당자 직접 입력. */
  workScale?: string;
  /** 총 공사기간(예: 3일 / 2주). 담당자 직접 입력. */
  workPeriod?: string;
  /** 구글시트로 발행한 견적서 시트 링크. */
  sheetUrl?: string | null;
  /** 발행한 견적서 PDF 링크. */
  pdfUrl?: string | null;
  memo: string;
  updatedAt: string | null;
};

export type InquiryIntake = {
  spaceType?: string;
  areaBand?: string;
  propertyStatus?: string;
  reason?: string;
  selectedRooms?: string[];
  otherRoomDetail?: string;
  budget?: string;
  startTiming?: string;
  name?: string;
  phone?: string;
  postalCode?: string;
  address?: string;
  detailAddress?: string;
  requestNote?: string;
  consent?: boolean;
  propertyType?: string;
  projectType?: string;
  preferredTime?: string;
  selectedWorks?: string[];
  selectedWorkIds?: string[];
  quoteSource?: InquiryQuoteSource | null;
  quoteSnapshot?: InquiryQuoteSnapshot | null;
  adminMemo?: string;
};

export type InquiryAttachment = {
  name: string;
  url: string;
  type: string;
};

export type InquiryStatus = "new" | "contacted" | "quoted" | "active" | "done" | "spam";

export type InquiryRow = {
  id: string;
  name: string;
  phone: string;
  service_area: string | null;
  message: string;
  attachments: InquiryAttachment[] | null;
  intake: InquiryIntake | null;
  status: InquiryStatus;
  source: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  notified_at: string | null;
};
