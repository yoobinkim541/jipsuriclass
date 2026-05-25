import type { PricingCategory } from "./types";

export const wallpaperFloorPricingCategories: PricingCategory[] = [
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
  {
    id: "floor-repair",
    title: "마루 부분보수",
    note: "자재 비용 별도",
    items: [
      { name: "마루 쪽갈이 보수 (3장 이내)", unit: "건", price: 230000, priceLabel: "230,000원~", materialNote: "별도" },
      { name: "마루 들뜸 보수 (본드 충진)", unit: "건", price: 230000, priceLabel: "230,000원~", materialNote: null },
      { name: "마루 찍힘 보수 (표면 메꿈, 10개소)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: null },
      { name: "마루 시공비 (10평 이하)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "floor-material",
    title: "마루 자재비",
    note: "시공비 별도",
    items: [
      { name: "강화마루", unit: "평당", price: 50000, priceLabel: "50,000원~", materialNote: null },
      { name: "강마루", unit: "평당", price: 90000, priceLabel: "90,000원~", materialNote: null },
      { name: "온돌마루", unit: "평당", price: 110000, priceLabel: "110,000원~", materialNote: null },
    ],
  },
  {
    id: "deco-tile",
    title: "데코타일·P타일",
    note: "자재 비용 별도",
    items: [
      { name: "데코타일 시공 (10평 이하)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "데코타일 시공 (10평 초과)", unit: "평당", price: 15000, priceLabel: "15,000원~", materialNote: "별도" },
      { name: "데코타일 자재비", unit: "평당", price: 25000, priceLabel: "25,000원~", materialNote: null },
    ],
  },
];
