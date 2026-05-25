import type { PriceCategory } from "./electricPriceData";

const serviceCallCategory: PriceCategory = {
  id: "call",
  title: "출장비",
  items: [
    { id: "call-weekday", name: "평일 출장비", unit: "회", price: 15000 },
    { id: "call-weekend", name: "주말·공휴일 출장비", unit: "회", price: 25000 },
    { id: "call-evening", name: "오후 6시 이후 추가", unit: "회", price: 10000 },
  ],
};

export const waterproofingPriceCategories: PriceCategory[] = [
  serviceCallCategory,
  {
    id: "waterproofing-detect",
    title: "누수 탐지·진단",
    items: [
      { id: "waterproof-detect-household", name: "단독·다가구 배관누수탐지", unit: "가구당", price: 250000, materialNote: true },
      { id: "waterproof-detect-apartment", name: "빌라·아파트 배관누수탐지", unit: "세대당", price: 300000, materialNote: true },
      { id: "waterproof-detect-shared", name: "공용배관누수 탐지", unit: "층당", price: 500000, materialNote: true, note: "고시텔·모텔" },
      { id: "waterproof-detect-drone-roof", name: "드론 촬영 누수탐지", unit: "회", price: 500000, materialNote: true, note: "옥상 또는 경사지붕" },
      { id: "waterproof-detect-drone-wall", name: "외벽 누수 촬영", unit: "세대", price: 300000, materialNote: true, note: "기본 1세대" },
      { id: "waterproof-detect-report", name: "누수진단 보고서", unit: "세대", price: 600000, materialNote: true, note: "진단 200,000원 + 보고서 400,000원" },
    ],
  },
  {
    id: "waterproofing-repair",
    title: "누수 보수",
    items: [
      { id: "waterproof-ceiling-sewage", name: "욕실·화장실·세탁실 천정오수배관누수", unit: "개소", price: 800000, materialNote: true },
      { id: "waterproof-ceiling-pipe", name: "천정기타배관누수", unit: "개소", price: 600000, materialNote: true },
      { id: "waterproof-wall-pipe", name: "벽체배관누수", unit: "개소", price: 300000, materialNote: true },
      { id: "waterproof-floor-pipe", name: "바닥배관누수", unit: "개소", price: 300000, materialNote: true },
      { id: "waterproof-toilet", name: "양변기누수", unit: "개소", price: 250000, materialNote: true },
      { id: "waterproof-under-removal", name: "하부누수 탈거후 보수설치", unit: "개소", price: 200000, materialNote: true },
    ],
  },
  {
    id: "waterproofing-pipe",
    title: "배관·배수 공사",
    items: [
      { id: "waterproof-water-pipe-buried", name: "수도배관(PB-15A) 벽매립", unit: "3m 이내", price: 250000, materialNote: true },
      { id: "waterproof-water-pipe-open", name: "수도배관(PB-15A) 노출", unit: "3m 이내", price: 200000, materialNote: true },
      { id: "waterproof-water-pipe-extra", name: "수도배관 추가", unit: "1m당", price: 30000, materialNote: true },
      { id: "waterproof-hot-cold-buried", name: "냉·온수관(PB-15A) 벽매립", unit: "3m 이내", price: 250000, materialNote: true },
      { id: "waterproof-hot-cold-open", name: "냉·온수관(PB-15A) 노출", unit: "3m 이내", price: 200000, materialNote: true },
      { id: "waterproof-hot-cold-extra", name: "냉·온수관 추가", unit: "1m당", price: 30000, materialNote: true },
      { id: "waterproof-wall-drain", name: "벽 배수관 위치변경", unit: "2m 이내", price: 250000, materialNote: true },
      { id: "waterproof-floor-drain", name: "바닥 배수관+유가 위치변경", unit: "2m 이내", price: 300000, materialNote: true },
    ],
  },
  {
    id: "waterproofing-finish",
    title: "방수·마감 복구",
    items: [
      { id: "waterproof-bathroom-waterproof", name: "욕실 방수", unit: "욕실", price: 500000, materialNote: true },
      { id: "waterproof-bathroom-silicone", name: "욕실실리콘시공", unit: "욕실", price: 100000, materialNote: true, note: "욕실당" },
      { id: "waterproof-tile-repair", name: "타일 깨짐보수 (기본 3장이내)", unit: "건", price: 250000, materialNote: true, note: "기본 3장 이내" },
      { id: "waterproof-shower-tile", name: "샤워부스 경첩면 타일보수", unit: "건", price: 150000, materialNote: true },
      { id: "waterproof-bathtub-tile", name: "욕조철거후 타일마감", unit: "건", price: 500000, materialNote: true },
    ],
  },
];

export const tilePriceCategories: PriceCategory[] = [
  serviceCallCategory,
  {
    id: "tile-repair",
    title: "타일·실리콘 보수",
    items: [
      { id: "tile-break-repair", name: "타일 깨짐보수 (기본 3장이내)", unit: "건", price: 250000, materialNote: true, note: "기본 3장 이내" },
      { id: "tile-silicone", name: "욕실실리콘시공", unit: "욕실", price: 100000, materialNote: true, note: "욕실당" },
      { id: "tile-shower-hinge", name: "샤워부스 경첩면 타일보수", unit: "건", price: 150000, materialNote: true },
      { id: "tile-bathtub-finish", name: "욕조철거후 타일마감", unit: "건", price: 500000, materialNote: true },
      { id: "tile-caulking", name: "실리콘제거와 코킹작업", unit: "m", price: 10000, materialNote: true, note: "1미터당" },
    ],
  },
  {
    id: "tile-stone",
    title: "외부 마감 보수",
    items: [
      { id: "stone-wall-repair", name: "화강석, 대리석 벽체 파손보수", unit: "장", price: 350000, materialNote: true, note: "600*900 1층보수" },
      { id: "panel-colour", name: "칼라강판 판넬교체", unit: "개", price: 250000, materialNote: true },
      { id: "dryvit", name: "드라이비트 파손", unit: "㎡", price: 300000, materialNote: true, note: "1층~1.0㎡" },
      { id: "stonecoat", name: "스톤코트 파손", unit: "㎡", price: 300000, materialNote: true, note: "1층~1.0㎡" },
      { id: "paint-touchup", name: "수성페인트 부분도색", unit: "㎡", price: 350000, materialNote: true, note: "30㎡ 이하" },
    ],
  },
];

export const waterproofingTilePriceCategories: PriceCategory[] = [
  serviceCallCategory,
  ...waterproofingPriceCategories.filter((category) => category.id !== "call"),
  ...tilePriceCategories.filter((category) => category.id !== "call"),
];
