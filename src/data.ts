import {
  Bath,
  Bolt,
  Building2,
  Droplets,
  Hammer,
  Home,
  LampCeiling,
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
import { images } from "./assets/images";

/**
 * 운영 정보 편집 구역
 * 실제 전화번호, 카카오톡 채널, 사업자 정보가 생기면 이 객체만 먼저 수정하세요.
 */
export const business: BusinessProfile = {
  name: "집수리클라쓰",
  introduction:
    "모든 공사에 품격을 더하는 종합 집수리·설비공사업체 집수리클라쓰입니다. 7개의 국가공인 건축자격이 있는 대표가 모든 공사에 직접 함께하며, 고객님의 니즈에 맞는 품격 있는 시공을 약속드립니다.",
  strengths: ["대표 직접 참여 시공", "7개 국가공인 건축자격 보유", "사진 상담 후 필요한 작업만 안내"],
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
    "필름",
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
  kakaoUrl: "http://pf.kakao.com/_xmygxmxb/chat",
  naverBlogUrl: "https://m.blog.naver.com/it77khy?tab=1",
  area: "서울·경기 및 수도권 협의",
  hours: "08:00 - 21:00 / 매주 일요일 휴무",
  registrationNumber: "사업자등록번호 633-25-01331",
  owner: "대표자 이보미",
  address: "경기도 남양주시 화도읍 경춘로 1790-2 106호",
  mapUrl: "https://naver.me/FRLt7TOJ"
};

export const navItems: NavItem[] = [
  { label: "소개", href: "#about" },
  { label: "서비스", href: "#services" },
  { label: "가능작업", href: "#specialties" },
  { label: "현장사례", href: "#cases" },
  { label: "작업절차", href: "#process" },
  { label: "블로그", href: "#blog" },
  { label: "오시는길", href: "#location" },
  { label: "문의", href: "#contact" },
  { label: "자가진단", href: "/diagnosis" },
  { label: "견적상담", href: "/estimate" }
];

/**
 * 서비스 카테고리 편집 구역
 * 홈 화면의 "생활 집수리 서비스" 카드에 그대로 표시됩니다.
 */
export const services: ServiceCategory[] = [
  { title: "부분·전체 리모델링", icon: Ruler, text: "공간 상태와 예산에 맞춘 인테리어 리모델링 공사", href: "/estimate" },
  { title: "종합 설비", icon: Droplets, text: "누수탐지, 상하수도 공사, 막힘 해결, 해빙 작업", href: "/service/plumbing" },
  { title: "방수·타일", icon: Bath, text: "옥상방수, 욕실·주방 타일 시공과 파손 부위 보수", href: "/service/waterproofing-tile" },
  { title: "목공", icon: Home, text: "문, 문틀, 몰딩, 걸레받이, 수납 등 생활 목공 보수", href: "/service/carpentry" },
  { title: "전기", icon: LampCeiling, text: "스위치, 콘센트, 조명 교체와 생활 전기 점검", href: "/service/electric" },
  { title: "도배·바닥", icon: PaintRoller, text: "도배, 장판, 바닥 마감, 오염·들뜸 부분 복구", href: "/service/wallpaper-floor" },
  { title: "도장·페인트", icon: Building2, text: "실내외 페인트, 도장 마감, 보수 도색 작업", href: "/service/paint" },
  { title: "인테리어 필름", icon: Wrench, text: "문, 몰딩, 가구, 싱크대 표면 필름 시공과 리폼", href: "/service/film" }
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
    title: "욕실 천장 누수 복구",
    area: "아파트 욕실",
    problem: "윗층 배관 누수 후 천장 마감 손상",
    solution: "누수 흔적 확인, 손상 면 정리, 마감재 교체",
    link: business.naverBlogUrl,
    image: images.cases.bathroomLeak
  },
  {
    title: "주방 싱크대 배수 보수",
    area: "빌라 주방",
    problem: "배수 냄새와 하부장 습기",
    solution: "배수 부속 교체, 하부장 내부 건조와 실리콘 마감",
    link: business.naverBlogUrl,
    image: images.cases.kitchenRepair
  },
  {
    title: "벽지 들뜸 부분 복구",
    area: "원룸 거실",
    problem: "누수 이후 벽지 들뜸과 얼룩",
    solution: "기초면 정리, 부분 도배, 마감 라인 보정",
    link: business.naverBlogUrl,
    image: images.cases.wallRepair
  },
  {
    title: "베란다 방수 보수",
    area: "아파트 베란다",
    problem: "비 온 뒤 바닥면에 남는 누수 자국",
    solution: "방수층 점검, 취약 구간 보수, 재마감",
    link: business.naverBlogUrl,
    image: images.cases.bathroomLeak
  },
  {
    title: "창가 실리콘 재시공",
    area: "주택 창가",
    problem: "창틀 주변 미세 누수와 실리콘 노후",
    solution: "기존 실리콘 제거, 주변면 정리, 재시공",
    link: business.naverBlogUrl,
    image: images.cases.kitchenRepair
  }
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
    link: business.naverBlogUrl,
    image: cases[0].image
  },
  {
    title: "퇴거 전 원상복구와 부분 도배 작업",
    description: "임대차 종료 전 자주 발생하는 훼손 부위를 필요한 만큼만 정리했습니다.",
    date: "대표 사례",
    link: business.naverBlogUrl,
    image: cases[2].image
  },
  {
    title: "베란다 누수 흔적 정리와 방수 보수",
    description: "비가 올 때마다 반복되던 자국을 확인하고 방수 보수로 정리한 사례입니다.",
    date: "대표 사례",
    link: business.naverBlogUrl,
    image: cases[3].image
  },
  {
    title: "창가 실리콘 노후 구간 재시공",
    description: "창틀 주변 미세한 스며듦을 잡기 위해 실리콘 라인을 다시 정리했습니다.",
    date: "대표 사례",
    link: business.naverBlogUrl,
    image: cases[4].image
  },
  {
    title: "주방 배수 보수와 하부장 건조 작업",
    description: "냄새와 습기가 반복되던 배수 부위를 점검해 필요한 부속만 교체했습니다.",
    date: "대표 사례",
    link: business.naverBlogUrl,
    image: cases[1].image
  }
];

export const process: WorkProcessStep[] = [
  { title: "사진 상담", text: "증상과 현장 사진을 먼저 확인합니다.", icon: Hammer, image: images.process.consultation },
  { title: "증상 확인", text: "누수, 파손, 오염 등 원인을 좁힙니다.", icon: ShieldCheck, image: images.process.leakCheck },
  { title: "현장 방문", text: "필요 시 방문해 범위와 자재를 확인합니다.", icon: Home, image: images.process.plumbing },
  { title: "견적 안내", text: "작업 범위와 비용을 투명하게 안내합니다.", icon: Ruler, image: images.process.wallRepair },
  { title: "시공·확인", text: "마감 상태와 재발 가능성을 함께 점검합니다.", icon: Bolt, image: images.process.completion }
];
