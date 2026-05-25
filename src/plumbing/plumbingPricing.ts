import type { PricingCategory } from "../pricing/types";

export const plumbingPricingCategories: PricingCategory[] = [
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
    id: "blockage",
    title: "배관 막힘·세척",
    items: [
      { name: "하수구 단순 막힘 (싱크대)", unit: "건", price: 70000, priceLabel: "70,000원~", materialNote: null },
      { name: "하수구 단순 막힘 (세면기)", unit: "건", price: 50000, priceLabel: "50,000원~", materialNote: null },
      { name: "하수구 단순 막힘 (양변기)", unit: "건", price: 70000, priceLabel: "70,000원~", materialNote: null },
      { name: "배관 역류 막힘 (빌라·아파트)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: null },
      { name: "배관 역류 막힘 (단독주택)", unit: "건", price: 400000, priceLabel: "400,000원~", materialNote: null },
      { name: "양변기 탈거 후 재설치", unit: "건", price: 150000, priceLabel: "150,000원~", materialNote: null },
      { name: "내시경 카메라 점검", unit: "건", price: 150000, priceLabel: "150,000원~", materialNote: null },
      { name: "고압세척 (기본 30M 이내)", unit: "건", price: 700000, priceLabel: "700,000원~", materialNote: null },
    ],
  },
  {
    id: "piping",
    title: "수도배관 연장·설치",
    note: "부속자재 비용 별도",
    items: [
      { name: "수도배관 벽매립 (기본 3M)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "수도배관 노출 (기본 3M)", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "수도배관 추가 (1M당)", unit: "M", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "냉온수관 벽매립 (기본 3M)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "냉온수관 노출 (기본 3M)", unit: "건", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "냉온수관 추가 (1M당)", unit: "M", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "manifold",
    title: "난방·온수 분배기",
    note: "부속자재 비용 별도",
    items: [
      { name: "난방분배기 교체 (기본 진입비)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "난방분배기 밸브 교체 (1구당)", unit: "구", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "온수분배기 밸브교체 (기본 진입비)", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
      { name: "온수분배기 밸브 (1구당)", unit: "구", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "퇴수밸브 교체 (단독 작업)", unit: "건", price: 80000, priceLabel: "80,000원~", materialNote: "별도" },
      { name: "퇴수밸브 교체 (병행 작업)", unit: "건", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "freeze",
    title: "동파·해빙",
    note: "부속자재 비용 별도",
    items: [
      { name: "수전·수도관 해빙", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: null },
      { name: "공용관 해빙", unit: "건", price: 800000, priceLabel: "800,000원~", materialNote: null },
      { name: "수도관 보수 (동파)", unit: "건", price: 400000, priceLabel: "400,000원~", materialNote: "별도" },
      { name: "수도 계량기 교체 (동파)", unit: "건", price: 400000, priceLabel: "400,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "outdoor-faucet",
    title: "부동전",
    note: "부속자재 비용 별도",
    items: [
      { name: "부동전 누수 교체", unit: "건", price: 500000, priceLabel: "500,000원~", materialNote: "별도" },
      { name: "부동전 동파 교체", unit: "건", price: 250000, priceLabel: "250,000원~", materialNote: "별도" },
    ],
  },
];
