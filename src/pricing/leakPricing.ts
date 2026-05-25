import type { PricingCategory } from "./types";

export const leakPricingCategories: PricingCategory[] = [
  {
    id: "callout",
    title: "기본 출장비",
    note: "출장비는 진단비·수리비와 별도로 청구됩니다.",
    items: [
      { name: "평일 출장비", unit: "회", price: 15000, priceLabel: "15,000원", materialNote: null },
      { name: "주말·공휴일 출장비", unit: "회", price: 25000, priceLabel: "25,000원", materialNote: null },
      { name: "18시 이후 추가", unit: "회", price: 10000, priceLabel: "10,000원", materialNote: null },
    ],
  },
  {
    id: "detect-indoor",
    title: "일반장비 실내 누수 탐지",
    note: "진단비는 출장비와 별도로 청구됩니다.",
    items: [
      { name: "아파트·빌라 (실내)", unit: "세대당", price: 400000, priceLabel: "400,000원~", materialNote: null },
      { name: "단독·다가구 주택", unit: "가구당", price: 500000, priceLabel: "500,000원~", materialNote: null },
      { name: "고시원·다세대 주택", unit: "가구당", price: 600000, priceLabel: "600,000원~", materialNote: null },
      { name: "근린생활시설", unit: "해당층당", price: 400000, priceLabel: "400,000원~", materialNote: null },
      { name: "공용배관 누수탐지 (고시원·모텔)", unit: "각 층당", price: 500000, priceLabel: "500,000원~", materialNote: null },
    ],
  },
  {
    id: "detect-external",
    title: "드론장비 외부 누수 탐지",
    items: [
      { name: "옥상 누수 탐지 (500㎡ 이내)", unit: "건", price: 400000, priceLabel: "400,000원~", materialNote: null },
      { name: "경사지붕 누수 탐지 (500㎡ 이내)", unit: "건", price: 400000, priceLabel: "400,000원~", materialNote: null },
      { name: "외벽 누수 탐지", unit: "세대당", price: 400000, priceLabel: "400,000원~", materialNote: null },
    ],
  },
  {
    id: "detect-special",
    title: "특수장비 누수 탐지",
    items: [
      { name: "급수 인입관 누수 탐지", unit: "건", price: 1500000, priceLabel: "1,500,000원~", materialNote: null },
    ],
  },
  {
    id: "leak-repair",
    title: "누수 보수공사",
    note: "마감 복구 비용 별도",
    items: [
      { name: "천정 오수배관 누수", unit: "건", price: 800000, priceLabel: "800,000원~", materialNote: null },
      { name: "천정 기타배관 누수", unit: "건", price: 600000, priceLabel: "600,000원~", materialNote: null },
      { name: "벽체 배관 누수", unit: "건", price: 300000, priceLabel: "300,000원~", materialNote: null },
      { name: "바닥 배관 누수", unit: "건", price: 300000, priceLabel: "300,000원~", materialNote: null },
      { name: "양변기 누수", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: null },
      { name: "발코니·베란다 우수드레인 누수", unit: "건", price: 500000, priceLabel: "500,000원~", materialNote: null },
    ],
  },
  {
    id: "drywall",
    title: "석고보드 교체",
    items: [
      { name: "누수 천장 석고보드 교체 (15㎡ 이하)", unit: "식", price: 800000, priceLabel: "800,000원~", materialNote: null },
      { name: "누수 벽체 석고보드 교체 (10㎡ 이하)", unit: "식", price: 500000, priceLabel: "500,000원~", materialNote: null },
    ],
  },
  {
    id: "finishing",
    title: "마감 복구",
    items: [
      { name: "미장 마감", unit: "개소당", price: 80000, priceLabel: "80,000원~", materialNote: null },
      { name: "타일 마감", unit: "개소당", price: 200000, priceLabel: "200,000원~", materialNote: null },
    ],
  },
];
