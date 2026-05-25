import type { PricingCategory } from "./types";

export const wallpaperPricingCategories: PricingCategory[] = [
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
    id: "wallpaper-repair",
    title: "도배 부분보수",
    note: "벽지 자재 비용 별도",
    items: [
      { name: "벽체 도배 보수 (기본 5평 이내)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "천장 도배 보수 (기본 5평 이내)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "wallpaper-material",
    title: "벽지 자재비",
    note: "시공비 별도",
    items: [
      { name: "벽지 (소합지)", unit: "평당", price: 7000, priceLabel: "7,000원~", materialNote: null },
      { name: "벽지 (광합지)", unit: "평당", price: 9000, priceLabel: "9,000원~", materialNote: null },
      { name: "벽지 (실크지)", unit: "평당", price: 13000, priceLabel: "13,000원~", materialNote: null },
    ],
  },
];
