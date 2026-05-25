import type { PricingCategory } from "./types";

export const doorPricingCategories: PricingCategory[] = [
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
    id: "hinge",
    title: "경첩·손잡이 교체",
    note: "부속자재 비용 별도",
    items: [
      { name: "경첩 교체 (이지경첩)", unit: "문짝당", price: 40000, priceLabel: "40,000원~", materialNote: "별도" },
      { name: "경첩 교체 (나비경첩)", unit: "문짝당", price: 45000, priceLabel: "45,000원~", materialNote: "별도" },
      { name: "손잡이 교체 (기본형)", unit: "개", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "푸쉬풀 도어락 교체", unit: "개", price: 40000, priceLabel: "40,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "door-replace",
    title: "문짝·문틀 교체",
    note: "제품 비용 별도",
    items: [
      { name: "도어만 교체", unit: "개", price: 120000, priceLabel: "120,000원~", materialNote: "별도" },
      { name: "도어+문틀 신규 설치", unit: "식", price: 120000, priceLabel: "120,000원~", materialNote: "별도" },
    ],
  },
];
