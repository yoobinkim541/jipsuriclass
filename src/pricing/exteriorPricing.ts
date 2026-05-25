import type { PricingCategory } from "./types";

export const exteriorPricingCategories: PricingCategory[] = [
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
    id: "exterior-wall",
    title: "외벽 보수",
    note: "자재 비용 별도. 고층 작업 시 장비 사용료 추가",
    items: [
      { name: "화강석·대리석 벽체 파손 보수", unit: "건", price: 90000, priceLabel: "90,000원~", materialNote: "별도" },
      { name: "칼라강판 판넬 교체", unit: "개당", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "드라이비트 파손 보수 (1㎡ 이내)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: "별도" },
      { name: "스톤코트 파손 보수 (1㎡ 이내)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: "별도" },
      { name: "외벽 수성페인트 부분 도색 (기본 30㎡)", unit: "식", price: 150000, priceLabel: "150,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "parking",
    title: "주차장·외부 시설",
    items: [
      { name: "SMC 천장 교체 (3장 이내)", unit: "건", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "주차 스토퍼 설치 (기본 2개)", unit: "건", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "점자블럭 교체", unit: "장당", price: 3000, priceLabel: "3,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "decking",
    title: "데킹·난간",
    note: "자재 비용 별도",
    items: [
      { name: "천연방부목 데킹 (3개 이내)", unit: "건", price: 130000, priceLabel: "130,000원~", materialNote: "별도" },
      { name: "WPC 합성목재 데킹 (3개 이내)", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "외부 난간 보수", unit: "M당", price: 100000, priceLabel: "100,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "awning",
    title: "어닝 설치",
    note: "제품 제작 비용 별도",
    items: [
      { name: "어닝 설치비", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: null },
      { name: "어닝 제작비 (1M당)", unit: "M당", price: 120000, priceLabel: "120,000원~", materialNote: null },
    ],
  },
];
