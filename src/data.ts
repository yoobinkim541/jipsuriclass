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

/**
 * 운영 정보 편집 구역
 * 실제 전화번호, 카카오톡 채널, 사업자 정보가 생기면 이 객체만 먼저 수정하세요.
 */
export const business: BusinessProfile = {
  name: "집수리 클라쓰",
  phone: "010-0000-0000",
  phoneHref: "tel:010-0000-0000",
  kakaoUrl: "https://pf.kakao.com/",
  naverBlogUrl: "https://blog.naver.com/",
  area: "서울·경기 및 수도권 협의",
  hours: "평일 09:00 - 19:00 / 긴급 상담 협의",
  registrationNumber: "사업자등록번호 입력 예정",
  owner: "대표자 입력 예정",
  address: "사업장 주소 입력 예정"
};

export const navItems: NavItem[] = [
  { label: "서비스", href: "#services" },
  { label: "현장사례", href: "#cases" },
  { label: "블로그", href: "#blog" },
  { label: "작업절차", href: "#process" },
  { label: "문의", href: "#contact" }
];

/**
 * 서비스 카테고리 편집 구역
 * 홈 화면의 "생활 집수리 서비스" 카드에 그대로 표시됩니다.
 */
export const services: ServiceCategory[] = [
  { title: "누수·복구", icon: Droplets, text: "천장, 욕실, 배관 누수 원인 확인과 손상 부위 복구" },
  { title: "욕실·타일", icon: Bath, text: "깨진 타일, 실리콘, 줄눈, 욕실 부속 보수" },
  { title: "도배·장판", icon: PaintRoller, text: "들뜸, 오염, 곰팡이 흔적, 부분 교체와 마감 정리" },
  { title: "문·몰딩", icon: Home, text: "문틀, 방문, 몰딩, 걸레받이 파손과 뒤틀림 보수" },
  { title: "싱크대·주방", icon: Wrench, text: "상판, 수전, 경첩, 배수, 주방 수납 부속 교체" },
  { title: "전기·조명", icon: LampCeiling, text: "스위치, 콘센트, 조명 교체와 생활 전기 점검" },
  { title: "원상복구", icon: Building2, text: "임대차 퇴거 전 부분 복구, 훼손 부위 정리" },
  { title: "소규모 리모델링", icon: Ruler, text: "생활 불편을 줄이는 실용 중심의 부분 공사" }
];

export const symptoms = [
  "물이 샌다",
  "벽지가 들뜬다",
  "타일이 깨졌다",
  "문이 안 닫힌다",
  "곰팡이가 생겼다",
  "수전·배수가 불편하다"
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
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "주방 싱크대 배수 보수",
    area: "빌라 주방",
    problem: "배수 냄새와 하부장 습기",
    solution: "배수 부속 교체, 하부장 내부 건조와 실리콘 마감",
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "벽지 들뜸 부분 복구",
    area: "원룸 거실",
    problem: "누수 이후 벽지 들뜸과 얼룩",
    solution: "기초면 정리, 부분 도배, 마감 라인 보정",
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80"
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
    link: business.naverBlogUrl
  },
  {
    title: "퇴거 전 원상복구와 부분 도배 작업",
    description: "임대차 종료 전 자주 발생하는 훼손 부위를 필요한 만큼만 정리했습니다.",
    date: "대표 사례",
    link: business.naverBlogUrl
  }
];

export const process: WorkProcessStep[] = [
  { title: "사진 상담", text: "증상과 현장 사진을 먼저 확인합니다.", icon: Hammer },
  { title: "증상 확인", text: "누수, 파손, 오염 등 원인을 좁힙니다.", icon: ShieldCheck },
  { title: "현장 방문", text: "필요 시 방문해 범위와 자재를 확인합니다.", icon: Home },
  { title: "견적 안내", text: "작업 범위와 비용을 투명하게 안내합니다.", icon: Ruler },
  { title: "시공·확인", text: "마감 상태와 재발 가능성을 함께 점검합니다.", icon: Bolt }
];
