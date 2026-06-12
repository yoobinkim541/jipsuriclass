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

export type InquiryStatus = "new" | "contacted" | "done" | "spam";

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
