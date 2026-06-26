import {
  Bath,
  Building2,
  Camera,
  ClipboardList,
  Droplets,
  Hammer,
  Headphones,
  Home,
  LampCeiling,
  Layers,
  PaintRoller,
  Ruler,
  ShieldCheck,
  Wrench
} from "lucide-react";
import type {
  BusinessProfile,
  ConstructionCase,
  NavItem,
  PortfolioPost,
  ServiceCategory,
  WorkProcessStep
} from "./types";

/**
 * 운영 정보 편집 구역
 * 실제 전화번호, 카카오톡 채널, 사업자 정보가 생기면 이 객체만 먼저 수정하세요.
 */
export const business: BusinessProfile = {
  name: "집수리클라쓰",
  introduction:
    "7개의 국가공인 건축자격을 보유한 대표가 모든 현장을 직접 시공하는 종합 집수리·설비 업체입니다. 불필요한 공사를 권하지 않고, 꼭 필요한 작업만 정직하게 견적내어 생활 집수리부터 전체 리모델링까지 책임지고 진행합니다.",
  strengths: ["대표 직접 참여 시공", "7개 국가공인 건축자격 보유", "네이버·카카오톡 집수리클라쓰 검색"],
  specialties: [
    "수도 배관",
    "전기 배선",
    "커튼/블라인드",
    "줄눈",
    "조명",
    "열쇠/도어락",
    "방충망",
    "창문/샷시",
    "문 설치/수리",
    "중문",
    "바닥재",
    "도배",
    "페인트",
    "타일",
    "방풍시공",
    "온수기 설치/수리",
    "환풍기",
    "주방후드",
    "가구 조립",
    "방범창",
    "욕실 리모델링",
    "싱크대 교체",
    "붙박이장",
    "주방 리모델링",
    "옥상 방수",
    "전동 빨래건조대",
    "실리콘 시공",
    "탄성코트 시공",
    "집 전체 리모델링",
    "냉장고장 설치",
    "단열시공"
  ],
  phone: "010-3323-9677",
  phoneHref: "tel:010-3323-9677",
  kakaoUrl: "https://pf.kakao.com/_xmygxmxb/chat",
  naverBlogUrl: "https://m.blog.naver.com/it77khy?tab=1",
  area: "서울·경기 및 수도권 협의",
  hours: "08:00 - 21:00 / 매주 일요일 휴무",
  registrationNumber: "사업자등록번호 633-25-01331",
  owner: "대표자 이보미",
  address: "경기도 남양주시 화도읍 경춘로 1790-2 106호",
  mapUrl: "https://naver.me/FRLt7TOJ",
  // 검증된 프로필 — sameAs로 사이트↔프로필 엔티티 연결(로컬 검색 신뢰도). 네이버 플레이스=mapUrl, 구글=googleProfileUrl.
  googleProfileUrl: "https://share.google/wC6tnqeUgrRiY2kkx"
};

/** 런타임 사이트 설정값(business 외). 공개 SPA가 로드 후 채우고, 컴포넌트가 읽는다. */
export const liveSiteSettings: { certifications: string[] } = { certifications: [] };

/** 대표 보유 국가공인 자격증(관리자 사이트 설정에서 편집 가능). */
export const defaultCertifications: string[] = [
  "건축기능사",
  "건축도장기능사",
  "도배기능사",
  "실내건축기능사",
  "타일기능사",
  "방수기능사",
  "전산응용건축제도기능사"
];

// 기본 자격증으로 런타임 값 초기화(사이트 설정 로드 전 표시용).
liveSiteSettings.certifications = [...defaultCertifications];

/**
 * 관리자에서 저장한 영업 정보를 런타임에 business 객체에 반영한다.
 * 공개 페이지는 client:only React SPA라 SSR/hydration 충돌 없이 안전하게 덮어쓸 수 있다.
 * (모든 모듈이 같은 business 참조를 공유하므로, 적용 후 리렌더하면 전역에 반영된다.)
 */
type EditableBusinessKey =
  | "name"
  | "owner"
  | "phone"
  | "address"
  | "hours"
  | "area"
  | "kakaoUrl"
  | "naverBlogUrl"
  | "mapUrl"
  | "registrationNumber";

export function applySiteSettings(settings: Partial<Record<EditableBusinessKey, string>>) {
  const editableKeys: EditableBusinessKey[] = [
    "name",
    "owner",
    "phone",
    "address",
    "hours",
    "area",
    "kakaoUrl",
    "naverBlogUrl",
    "mapUrl",
    "registrationNumber"
  ];
  for (const key of editableKeys) {
    const value = settings[key];
    if (typeof value === "string" && value.trim()) {
      business[key] = value;
    }
  }
  // 전화번호가 바뀌면 tel: 링크도 함께 갱신.
  if (typeof settings.phone === "string" && settings.phone.trim()) {
    business.phoneHref = `tel:${settings.phone.replace(/[^0-9+]/g, "")}`;
  }
}

export const navItems: NavItem[] = [
  { label: "소개", href: "#about" },
  { label: "자가진단", href: "#symptoms" },
  { label: "서비스", href: "#services" },
  { label: "가능작업", href: "#specialties" },
  { label: "현장사례", href: "#cases" },
  { label: "작업절차", href: "#process" },
  { label: "블로그", href: "#blog" },
  { label: "오시는길", href: "#location" },
  { label: "문의", href: "#contact" },
  { label: "견적상담", href: "/estimate" }
];

/**
 * 서비스 카테고리 편집 구역
 * 홈 화면의 "생활 집수리 서비스" 카드에 그대로 표시됩니다.
 */
export const services: ServiceCategory[] = [
  { title: "부분·전체 리모델링", icon: Ruler, text: "공간 상태와 예산에 맞춘 인테리어 리모델링 공사", href: "/estimate" },
  { title: "종합 설비", icon: Droplets, text: "누수탐지, 상하수도 공사, 막힘 해결, 해빙 작업", href: "/service/plumbing" },
  { title: "방수·타일", icon: Layers, text: "옥상방수, 욕실·주방 타일 시공과 파손 부위 보수", href: "/service/waterproofing-tile" },
  { title: "욕실 수리", icon: Bath, text: "수전·세면기·양변기·욕조 교체, 욕실 타일 보수", href: "/service/bathroom" },
  { title: "목공", icon: Home, text: "문, 문틀, 몰딩, 걸레받이, 수납 등 생활 목공 보수", href: "/service/carpentry" },
  { title: "전기", icon: LampCeiling, text: "스위치, 콘센트, 조명 교체와 생활 전기 점검", href: "/service/electric" },
  { title: "도배·바닥", icon: PaintRoller, text: "도배, 장판, 바닥 마감, 오염·들뜸 부분 복구", href: "/service/wallpaper-floor" },
  { title: "도장·페인트", icon: Building2, text: "실내외 페인트, 도장 마감, 보수 도색 작업", href: "/service/paint" },
  { title: "인테리어 필름", icon: Wrench, text: "문, 몰딩, 가구, 싱크대 표면 필름 시공과 리폼", href: "/service/film" },
  { title: "외부 부분보수", icon: Hammer, text: "외벽 파손, 드라이비트, 데킹, 난간, 어닝 보수", href: "/service/exterior" }
];

export const symptoms = [
  "물이 샌다",
  "벽지가 들뜬다",
  "타일이 깨졌다",
  "문이 안 닫힌다",
  "곰팡이가 생겼다",
  "수전·배수가 불편하다"
];

export type SymptomItem = { text: string; id: string };
export type SymptomCategory = { id: string; label: string; icon: string; symptoms: SymptomItem[] };

export const symptomCategories: SymptomCategory[] = [
  {
    id: "door",
    label: "문·창문",
    icon: "🚪",
    symptoms: [
      { text: "문이 뻑뻑해요", id: "stiff-door" },
      { text: "삐걱 소리가 나요", id: "door-squeak" },
      { text: "틈으로 바람이 들어와요", id: "door-draft" },
      { text: "도어락이 오작동해요", id: "doorlock" },
    ],
  },
  {
    id: "leak",
    label: "물·누수",
    icon: "💧",
    symptoms: [
      { text: "천장·벽에 물자국이 생겼어요", id: "leak-stain" },
      { text: "배관에서 물이 새요", id: "pipe-leak" },
      { text: "변기 물이 계속 흘러요", id: "toilet-run" },
      { text: "수압이 갑자기 약해졌어요", id: "low-pressure" },
    ],
  },
  {
    id: "wall",
    label: "벽·바닥·천장",
    icon: "🧱",
    symptoms: [
      { text: "벽지가 들뜨거나 얼룩이 생겼어요", id: "peeling-wallpaper" },
      { text: "타일이 깨지거나 줄눈이 갈라졌어요", id: "broken-tile" },
      { text: "바닥재가 들뜨거나 삐걱거려요", id: "floor-creak" },
      { text: "천장에 금이 가거나 내려앉아요", id: "ceiling-crack" },
    ],
  },
  {
    id: "electric",
    label: "전기",
    icon: "⚡",
    symptoms: [
      { text: "조명이 깜빡이거나 안 켜져요", id: "light-flicker" },
      { text: "차단기가 자꾸 내려가요", id: "breaker-trip" },
      { text: "콘센트·스위치가 작동 안 해요", id: "outlet-fail" },
      { text: "전기 타는 냄새가 나요", id: "electric-smell" },
    ],
  },
  {
    id: "bathroom",
    label: "욕실",
    icon: "🛁",
    symptoms: [
      { text: "욕실 배수가 잘 안 돼요", id: "bath-drain" },
      { text: "변기가 잘 안 내려가요", id: "toilet-clog" },
      { text: "곰팡이가 반복해서 생겨요", id: "mold-smell" },
      { text: "샤워기 수압이 약해요", id: "shower-pressure" },
    ],
  },
  {
    id: "kitchen",
    label: "주방·설비",
    icon: "🍳",
    symptoms: [
      { text: "수전에서 물이 새요", id: "drain-trouble" },
      { text: "주방 배수가 막혔어요", id: "kitchen-drain" },
      { text: "싱크대 하부장이 젖어 있어요", id: "sink-wet" },
    ],
  },
];

/**
 * 대표 현장사례 편집 구역
 * 실제 시공사진은 public/assets/cases 같은 폴더에 넣고 image 값을 "/assets/cases/파일명.jpg"로 바꾸면 됩니다.
 */
export const cases: ConstructionCase[] = [
  {
    title: "실리콘코킹·화장실 타일 시공",
    area: "성남 분당 더헤리티지",
    problem: "주방 실리콘 변색·경화·갈라짐, 욕실 벽면 도배지로 인한 곰팡이 및 접착 불량 우려",
    solution: "주방은 낡은 실리콘 완전 제거 후 곰팡이 방지 코킹 재시공, 욕실은 도배지 전면 철거 후 하부와 자연스럽게 이어지도록 정밀 타일 시공",
    link: "https://blog.naver.com/it77khy/224246606297",
    image: "/assets/cases/case1-silicone-tile.jpg"
  },
  {
    title: "천장 결로로 인한 단열 공사",
    area: "길음뉴타운 11단지 롯데캐슬 골든힐스",
    problem: "안방·작은방의 심한 냉기와 결로 우려. 단열재 이음부 틈새와 창호 주변 빈 공간으로 외벽 온도 4~12℃까지 저하",
    solution: "뉴골드폭스보드 22T 단열재를 빈틈없이 밀착 시공하고 천장 단열폼 보강·걸레받이 재시공으로 외벽 온도 14~16℃ 이상 회복",
    link: "https://blog.naver.com/it77khy/224212491748",
    image: "/assets/cases/case2-insulation.jpg"
  },
  {
    title: "거실 LED등 및 스위치 교체",
    area: "의정부 회룡역 풍림아이원아파트",
    problem: "노후 조명과 스위치로 실내가 어둡고 안전이 우려되는 상황",
    solution: "리모컨 제어·색 변환이 가능한 LED 조명과 스위치로 교체하여 밝기와 안전성 확보",
    link: "https://blog.naver.com/it77khy/224244962003",
    image: "/assets/cases/case3-led.jpg"
  },
  {
    title: "주방 싱크볼 교체",
    area: "성남 분당 더헤리티지",
    problem: "기존 싱크볼에 누적된 물때·스크래치로 위생 불량 상태",
    solution: "관리가 쉽고 위생적인 백조 사각 싱크볼(엠보 코팅)로 교체, 수평 조절 및 실리콘 마감까지 정밀 시공",
    link: "https://blog.naver.com/it77khy/224237946902",
    image: "/assets/cases/case4-sink.jpg"
  },
  {
    title: "누수 피해 복구",
    area: "남양주 이편한세상 다산",
    problem: "누수로 인한 베란다 천장 얼룩과 도장 들뜸, 습기·곰팡이 확산 우려",
    solution: "손상된 석고보드 교체 후 결로 방지 탄성코트 시공으로 마감 복구",
    link: "https://blog.naver.com/it77khy/224246265335",
    image: "/assets/cases/case5-leak.jpg"
  },
];

/**
 * 네이버 API 실패 또는 미설정 시 보여줄 수동 대표글입니다.
 * 자동 최신글과 별개로 메인에 꼭 남기고 싶은 글을 넣어도 됩니다.
 */
export const pinnedPosts: PortfolioPost[] = [
  {
    title: "누수 흔적이 남은 욕실 천장 복구 사례",
    description: "사진 상담 후 현장 확인, 손상 부위 철거와 마감 복구까지 진행한 사례입니다.",
    date: "대표 사례",
    link: "https://blog.naver.com/it77khy/224246606297",
    image: cases[0].image
  },
  {
    title: "천장 결로로 인한 단열 공사",
    description: "열화상 카메라로 냉기 구간을 확인하고 단열재 밀착 시공으로 해결한 사례입니다.",
    date: "대표 사례",
    link: "https://blog.naver.com/it77khy/224212491748",
    image: cases[1].image
  },
  {
    title: "노후 조명·스위치 LED 교체 사례",
    description: "리모컨 제어 LED 조명과 스위치로 교체해 밝기와 안전성을 확보한 사례입니다.",
    date: "대표 사례",
    link: "https://blog.naver.com/it77khy/224244962003",
    image: cases[2].image
  },
  {
    title: "주방 싱크볼 교체 사례",
    description: "위생 불량 싱크볼을 새 제품으로 교체하고 수평·실리콘 마감까지 완료한 사례입니다.",
    date: "대표 사례",
    link: "https://blog.naver.com/it77khy/224237946902",
    image: cases[3].image
  },
  {
    title: "베란다 천장 누수 피해 복구 사례",
    description: "손상된 석고보드를 교체하고 탄성코트로 마감 복구한 사례입니다.",
    date: "대표 사례",
    link: "https://blog.naver.com/it77khy/224246265335",
    image: cases[4].image
  }
];

export const process: WorkProcessStep[] = [
  { title: "사진 상담", text: "증상과 현장 사진을 먼저 확인합니다.", icon: Camera, image: "/process/step1.webp" },
  { title: "증상 확인", text: "전문가가 사진과 내용을 바탕으로 증상을 정확히 진단합니다.", icon: ShieldCheck, image: "/process/step2.webp" },
  { title: "현장 방문", text: "필요 시 전문가가 직접 현장을 방문하여 정확한 상태를 확인합니다.", icon: Home, image: "/process/step3.webp" },
  { title: "견적 안내", text: "진단 내용을 바탕으로 투명하고 정확한 견적을 안내해 드립니다.", icon: ClipboardList, image: "/process/step4.webp" },
  { title: "시공·확인", text: "전문 시공팀이 안전하고 꼼꼼하게 시공하며, 완료 후 고객과 함께 최종 확인합니다.", icon: Wrench, image: "/process/step5.webp" },
  { title: "사후 관리", text: "시공 후에도 지속적인 관리와 사후 서비스를 제공합니다.", icon: Headphones, image: "/process/step6.webp" }
];
