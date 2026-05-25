import type { PricingCategory } from "./types";

export const bathroomPricingCategories: PricingCategory[] = [
  {
    id: "callout",
    title: "기본 출장비",
    note: "출장비는 수리비와 별도로 청구됩니다.",
    items: [
      { name: "평일 출장비", unit: "회", price: 15000, priceLabel: "15,000원", materialNote: null },
      { name: "주말·공휴일 출장비", unit: "회", price: 25000, priceLabel: "25,000원", materialNote: null },
      { name: "18시 이후 추가", unit: "회", price: 10000, priceLabel: "10,000원", materialNote: null },
    ],
  },
  {
    id: "basin",
    title: "세면기 보수",
    note: "제품 비용 별도",
    items: [
      { name: "세면기용 1홀 수전 교체", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "세면기 1피스 반다리형 교체", unit: "개", price: 100000, priceLabel: "100,000원~", materialNote: "별도" },
      { name: "세면기 1피스 하부커버형 교체", unit: "개", price: 90000, priceLabel: "90,000원~", materialNote: "별도" },
      { name: "세면기 2피스 스탠드형 교체", unit: "개", price: 70000, priceLabel: "70,000원~", materialNote: "별도" },
      { name: "원터치 팝업+트랩 교체", unit: "개", price: 45000, priceLabel: "45,000원~", materialNote: "별도" },
      { name: "수동식 팝업+트랩 교체", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "트랩 교체", unit: "개", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "트랩 청소", unit: "건", price: 30000, priceLabel: "30,000원~", materialNote: null },
      { name: "세면기 배관 막힘 보수", unit: "건", price: 80000, priceLabel: "80,000원~", materialNote: null },
    ],
  },
  {
    id: "toilet",
    title: "양변기 보수",
    note: "제품 비용 별도",
    items: [
      { name: "투피스형 양변기 교체·재설치", unit: "개", price: 90000, priceLabel: "90,000원~", materialNote: "별도" },
      { name: "투피스형 탈거 재설치", unit: "건", price: 90000, priceLabel: "90,000원~", materialNote: null },
      { name: "원피스형 양변기 교체·재설치", unit: "개", price: 120000, priceLabel: "120,000원~", materialNote: "별도" },
      { name: "탱크 부속 교체", unit: "건", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "양변기 막힘 보수", unit: "건", price: 70000, priceLabel: "70,000원~", materialNote: null },
    ],
  },
  {
    id: "shower",
    title: "욕조·샤워 관련",
    note: "제품 비용 별도",
    items: [
      { name: "샤워기·욕조 수전 교체", unit: "개", price: 80000, priceLabel: "80,000원~", materialNote: "별도" },
      { name: "욕조 설치", unit: "개", price: 330000, priceLabel: "330,000원~", materialNote: "별도" },
      { name: "욕조 철거 후 타일 마감", unit: "건", price: 500000, priceLabel: "500,000원~", materialNote: "별도" },
      { name: "샤워부스 경첩 보수", unit: "건", price: 100000, priceLabel: "100,000원~", materialNote: null },
    ],
  },
  {
    id: "tile-silicon",
    title: "타일·실리콘 보수",
    note: "타일 자재 비용 별도",
    items: [
      { name: "욕실 타일 깨짐 보수", unit: "개소당", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "욕실 실리콘 시공", unit: "개소당", price: 100000, priceLabel: "100,000원~", materialNote: null },
    ],
  },
  {
    id: "ventilation",
    title: "환풍기",
    note: "제품 비용 별도",
    items: [
      { name: "환풍기 교체 (일반형)", unit: "개", price: 40000, priceLabel: "40,000원~", materialNote: "별도" },
      { name: "환풍기 교체 (터보형)", unit: "개", price: 80000, priceLabel: "80,000원~", materialNote: "별도" },
      { name: "복합 환풍기 설치", unit: "개", price: 100000, priceLabel: "100,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "remodeling",
    title: "욕실 리모델링",
    note: "자재 비용 별도",
    items: [
      { name: "욕실 덧방 시공", unit: "식", price: 2000000, priceLabel: "2,000,000원~", materialNote: "별도" },
      { name: "욕실 올수리 (기타마감)", unit: "식", price: 2000000, priceLabel: "2,000,000원~", materialNote: "별도" },
    ],
  },
];
