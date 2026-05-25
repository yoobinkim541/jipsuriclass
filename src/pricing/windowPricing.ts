import type { PricingCategory } from "./types";

export const windowPricingCategories: PricingCategory[] = [
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
    id: "window-repair",
    title: "창문 보수",
    note: "부속자재 비용 별도",
    items: [
      { name: "손잡이 교체 (크리센트)", unit: "개", price: 20000, priceLabel: "20,000원~", materialNote: "별도" },
      { name: "하부 롤러 교체 (소창)", unit: "창짝당", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "모헤어 교체 (전창)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "screen",
    title: "방충망",
    note: "자재 비용 별도",
    items: [
      { name: "방충망 (알루미늄, 소형)", unit: "개", price: 10000, priceLabel: "10,000원~", materialNote: "별도" },
      { name: "방충망 (미세망, 소형)", unit: "개", price: 10000, priceLabel: "10,000원~", materialNote: "별도" },
      { name: "출입문용 롤 방충망 (일반)", unit: "개", price: 95000, priceLabel: "95,000원~", materialNote: "별도" },
    ],
  },
];
