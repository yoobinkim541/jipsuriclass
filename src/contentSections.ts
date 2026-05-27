export type HomepageSectionId =
  | "hero"
  | "about"
  | "symptoms"
  | "services"
  | "specialties"
  | "cases"
  | "blog"
  | "process"
  | "location"
  | "contact";

export type LandingSectionId = "summary" | "points" | "blog" | "faq" | "relatedLinks";

export type SectionDefinition<TSectionId extends string> = {
  id: TSectionId;
  label: string;
  description: string;
};

export type HomepageEditorSectionId = Extract<HomepageSectionId, "hero" | "about" | "symptoms" | "specialties" | "contact">;

export type HomepageEditorFieldDefinition = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "list";
  rows?: number;
  hint?: string;
};

export type HomepageRepeaterSectionId = Extract<HomepageSectionId, "services" | "cases" | "blog" | "process">;

export type HomepageRepeaterFieldDefinition = {
  key: string;
  label: string;
  kind: "text" | "textarea" | "image";
  rows?: number;
  hint?: string;
};

export type HomepageRepeaterSectionDefinition = {
  id: HomepageRepeaterSectionId;
  label: string;
  description: string;
  itemLabel: (item: Record<string, string>, index: number) => string;
  itemSubtitle?: (item: Record<string, string>, index: number) => string;
  fields: HomepageRepeaterFieldDefinition[];
};

export type HomepageTupleGroupId = "trust" | "proofs" | "navLabels";

export type HomepageTupleFieldDefinition = {
  key: string;
  label: string;
  kind: "text";
};

export type HomepageTupleGroupDefinition = {
  id: HomepageTupleGroupId;
  label: string;
  description: string;
  fields: HomepageTupleFieldDefinition[];
};

export const homepageSectionDefinitions: Array<SectionDefinition<HomepageSectionId>> = [
  { id: "hero", label: "히어로", description: "대표 문구와 카드 덱" },
  { id: "about", label: "소개", description: "사업 소개와 강점" },
  { id: "symptoms", label: "증상", description: "빠른 진입 증상 버튼" },
  { id: "services", label: "서비스", description: "생활 집수리 카드" },
  { id: "specialties", label: "가능 작업", description: "세부 작업 키워드" },
  { id: "cases", label: "사례", description: "대표 현장 사례" },
  { id: "blog", label: "블로그", description: "고정 글과 최신 글" },
  { id: "process", label: "작업 절차", description: "문의부터 완료까지" },
  { id: "location", label: "오시는 길", description: "사무실과 지도" },
  { id: "contact", label: "문의", description: "빠른 연락과 상담" }
];

export const landingSectionDefinitions: Array<SectionDefinition<LandingSectionId>> = [
  { id: "summary", label: "기본 정보", description: "제목과 설명, 검색 키워드" },
  { id: "points", label: "상세 안내", description: "상담에서 확인하는 항목" },
  { id: "blog", label: "블로그", description: "사례와 가격표" },
  { id: "faq", label: "FAQ", description: "자주 묻는 질문" },
  { id: "relatedLinks", label: "연결 페이지", description: "연관 서비스와 지역" }
];

export const homepageEditorFieldSchemas: Record<HomepageEditorSectionId, HomepageEditorFieldDefinition[]> = {
  hero: [
    { key: "title", label: "제목", kind: "text" },
    { key: "description", label: "설명 (lede 텍스트)", kind: "textarea", rows: 5 },
    { key: "rotatorWords", label: "회전 문구", kind: "list", rows: 4, hint: "줄 바꿈으로 구분" },
    { key: "primaryActionLabel", label: "버튼 1 (전화 상담)", kind: "text" },
    { key: "secondaryActionLabel", label: "버튼 2 (카카오톡)", kind: "text" },
    { key: "tertiaryActionLabel", label: "버튼 3 (견적상담)", kind: "text" }
  ],
  about: [
    { key: "eyebrow", label: "배지", kind: "text" },
    { key: "title", label: "제목", kind: "text" },
    { key: "description", label: "설명", kind: "textarea", rows: 7 },
    { key: "strengths", label: "강점 항목", kind: "list", rows: 4, hint: "줄 바꿈으로 구분" }
  ],
  symptoms: [
    { key: "items", label: "증상 버튼", kind: "list", rows: 6, hint: "줄 바꿈으로 구분" }
  ],
  specialties: [
    { key: "items", label: "가능 작업", kind: "list", rows: 6, hint: "줄 바꿈으로 구분" }
  ],
  contact: [
    { key: "title", label: "제목", kind: "text" },
    { key: "description", label: "설명", kind: "textarea", rows: 6 }
  ]
};

export const homepageRepeaterSectionDefinitions: Record<HomepageRepeaterSectionId, HomepageRepeaterSectionDefinition> = {
  services: {
    id: "services",
    label: "서비스 카드",
    description: "생활 집수리 카드",
    itemLabel: (item, index) => item.title || `서비스 ${index + 1}`,
    itemSubtitle: (item) => item.text || "",
    fields: [
      { key: "title", label: "제목", kind: "text" },
      { key: "text", label: "설명", kind: "textarea", rows: 4 }
    ]
  },
  cases: {
    id: "cases",
    label: "대표 사례",
    description: "대표 현장 사례",
    itemLabel: (item, index) => item.title || `사례 ${index + 1}`,
    itemSubtitle: (item) => item.area || "",
    fields: [
      { key: "title", label: "제목", kind: "text" },
      { key: "area", label: "공간", kind: "text" },
      { key: "problem", label: "문제", kind: "textarea", rows: 3 },
      { key: "solution", label: "해결", kind: "textarea", rows: 3 },
      { key: "image", label: "이미지 URL", kind: "image", hint: "이미지 업로드로 교체할 수 있습니다." },
      { key: "link", label: "블로그 링크", kind: "text" }
    ]
  },
  blog: {
    id: "blog",
    label: "블로그 포스트",
    description: "고정 글과 최신 글",
    itemLabel: (item, index) => item.title || `블로그 ${index + 1}`,
    itemSubtitle: (item) => item.date || "",
    fields: [
      { key: "title", label: "제목", kind: "text" },
      { key: "description", label: "설명", kind: "textarea", rows: 4 },
      { key: "date", label: "날짜", kind: "text" },
      { key: "link", label: "링크", kind: "text" },
      { key: "image", label: "이미지 URL", kind: "image", hint: "이미지 업로드로 교체할 수 있습니다." }
    ]
  },
  process: {
    id: "process",
    label: "작업 절차",
    description: "문의부터 완료까지",
    itemLabel: (item, index) => item.title || `절차 ${index + 1}`,
    itemSubtitle: (item) => item.text || "",
    fields: [
      { key: "title", label: "제목", kind: "text" },
      { key: "text", label: "설명", kind: "textarea", rows: 3 },
      { key: "image", label: "이미지 URL", kind: "image", hint: "이미지 업로드로 교체할 수 있습니다." }
    ]
  }
};

export const homepageTupleGroupDefinitions: Record<HomepageTupleGroupId, HomepageTupleGroupDefinition> = {
  trust: {
    id: "trust",
    label: "신뢰 지표",
    description: "히어로 아래의 3개 숫자 카드 문구를 바꿉니다.",
    fields: [
      { key: "num", label: "숫자", kind: "text" },
      { key: "label", label: "제목", kind: "text" },
      { key: "sub", label: "설명", kind: "text" }
    ]
  },
  proofs: {
    id: "proofs",
    label: "진행 설명",
    description: "히어로 아래의 proof 목록 문구입니다.",
    fields: [
      { key: "label", label: "항목", kind: "text" },
      { key: "value", label: "설명", kind: "text" }
    ]
  },
  navLabels: {
    id: "navLabels",
    label: "메뉴 이름",
    description: "이동 경로는 그대로 유지되고 표시 텍스트만 바뀝니다.",
    fields: [{ key: "label", label: "표시 텍스트", kind: "text" }]
  }
};

export const defaultHomepageSectionOrder: HomepageSectionId[] = homepageSectionDefinitions.map((item) => item.id);
export const defaultLandingSectionOrder: LandingSectionId[] = landingSectionDefinitions.map((item) => item.id);

export function normalizeSectionOrder<TSectionId extends string>(items: unknown, fallback: TSectionId[]) {
  if (!Array.isArray(items)) {
    return fallback;
  }

  const filtered = items.filter((item): item is TSectionId => typeof item === "string" && fallback.includes(item as TSectionId));
  return filtered.length > 0 ? filtered : fallback;
}
