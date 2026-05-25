import type { PricingCategory } from "./types";

export const electricPricingCategories: PricingCategory[] = [
  {
    id: "callout",
    title: "기본 출장비",
    note: "출장비는 수리비와 별도로 청구됩니다.",
    items: [
      { name: "평일 출장비", unit: "회", price: 25000, priceLabel: "25,000원", materialNote: null },
      { name: "주말·공휴일 출장비", unit: "회", price: 35000, priceLabel: "35,000원", materialNote: null },
      { name: "18시 이후 추가", unit: "회", price: 10000, priceLabel: "10,000원", materialNote: null },
    ],
  },
  {
    id: "switch",
    title: "스위치 교체",
    items: [
      { name: "스위치 교체 (일반형)", unit: "개", price: 35000, priceLabel: "35,000원~", materialNote: null },
      { name: "스위치 교체 (스마트형)", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: null },
      { name: "융스위치 교체", unit: "개", price: 40000, priceLabel: "40,000원~", materialNote: null },
      { name: "타임렉 설치", unit: "개", price: 30000, priceLabel: "30,000원~", materialNote: null },
    ],
  },
  {
    id: "lighting",
    title: "조명 교체·설치",
    note: "LED 제품 비용 별도",
    items: [
      { name: "LED 메인등 교체 (방등·1등용)", unit: "개", price: 40000, priceLabel: "40,000원~", materialNote: "별도" },
      { name: "LED 메인등 교체 (거실등·2등용)", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "LED 주방등 교체 (일자형)", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "다운라이트 교체", unit: "개", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "현관 센서등 설치", unit: "개", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "outlet",
    title: "콘센트 교체·추가",
    items: [
      { name: "콘센트 교체 (2구/16A, 3개 기준)", unit: "식", price: 50000, priceLabel: "50,000원~", materialNote: null },
      { name: "인터넷 콘센트 교체", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: null },
      { name: "콘센트 추가 (석고벽, 3M 이내)", unit: "개", price: 150000, priceLabel: "150,000원~", materialNote: "별도" },
      { name: "콘센트 추가 (옹벽, 3M 이내)", unit: "개", price: 180000, priceLabel: "180,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "wiring",
    title: "배선·분전함 공사",
    note: "자재 비용 별도",
    items: [
      { name: "배선 교체 (공실, 전열)", unit: "평", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "배선 교체 (거주중, 전열)", unit: "평", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "분전함 교체 (6회로 이내)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "ceiling-fan",
    title: "실링팬·기타",
    note: "제품 비용 별도",
    items: [
      { name: "실링팬 설치 (일반형, 기존 연결)", unit: "개", price: 120000, priceLabel: "120,000원~", materialNote: "별도" },
      { name: "실링팬 설치 (일반형, 상시전원)", unit: "개", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "leakage",
    title: "누전 진단·보수",
    note: "누전보수 출장비: 평일 45,000원 / 주말 60,000원",
    items: [
      { name: "전등라인 누전 진단", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: null },
      { name: "콘센트라인 누전 진단", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: null },
      { name: "세대 메인차단기 교체", unit: "개", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "분기용 누전차단기 교체", unit: "개", price: 80000, priceLabel: "80,000원~", materialNote: "별도" },
      { name: "전등·전열 배선 교체 (1구간)", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
    ],
  },
];
