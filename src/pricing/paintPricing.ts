import type { PricingCategory } from "./types";

export const paintPricingCategories: PricingCategory[] = [
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
    id: "indoor-paint",
    title: "실내 페인트",
    note: "자재 비용 별도",
    items: [
      { name: "기능성 페인트 (곰팡이 방지, 기본 10㎡)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "발코니 수성페인트 (기본 20㎡)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: "별도" },
      { name: "발코니 수성페인트 (추가)", unit: "㎡당", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "exterior-paint",
    title: "외부 부분 도색",
    note: "자재 비용 별도",
    items: [
      { name: "외벽 수성페인트 부분 도색 (기본 30㎡)", unit: "식", price: 150000, priceLabel: "150,000원~", materialNote: "별도" },
      { name: "드라이비트 파손 보수·도색 (1㎡ 이내)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: "별도" },
      { name: "스톤코트 파손 보수·도색 (1㎡ 이내)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: "별도" },
    ],
  },
];
