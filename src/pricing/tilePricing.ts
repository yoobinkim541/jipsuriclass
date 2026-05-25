import type { PricingCategory } from "./types";

export const tilePricingCategories: PricingCategory[] = [
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
    id: "tile-repair",
    title: "타일 부분 교체·보수",
    note: "타일 자재 비용 별도",
    items: [
      { name: "타일 부분 교체 (3장 이내)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "타일 추가 교체 (1장당)", unit: "장", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "욕실 타일 깨짐 보수", unit: "개소당", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "알판 보수 (1㎡ 이내)", unit: "건", price: 100000, priceLabel: "100,000원~", materialNote: null },
    ],
  },
  {
    id: "silicon",
    title: "줄눈·실리콘",
    items: [
      { name: "욕실 실리콘 시공", unit: "개소당", price: 100000, priceLabel: "100,000원~", materialNote: null },
    ],
  },
  {
    id: "art-wall",
    title: "아트월·포인트 타일",
    note: "타일 자재 비용 별도",
    items: [
      { name: "아트월 타공복 (기본 4개 이하)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: null },
      { name: "아트월 타공복 (추가 구멍 1개당)", unit: "개", price: 20000, priceLabel: "20,000원~", materialNote: null },
    ],
  },
];
