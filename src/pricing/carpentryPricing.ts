import type { PricingCategory } from "./types";

export const carpentryPricingCategories: PricingCategory[] = [
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
    id: "installation",
    title: "실내 설치",
    items: [
      { name: "커튼·버티컬 설치", unit: "개소당", price: 30000, priceLabel: "30,000원~", materialNote: null },
      { name: "블라인드 설치", unit: "개소당", price: 35000, priceLabel: "35,000원~", materialNote: null },
      { name: "빨래건조대 설치 (콘크리트 천장)", unit: "개", price: 100000, priceLabel: "100,000원~", materialNote: null },
      { name: "빨래건조대 설치 (석고보드 천장)", unit: "개", price: 150000, priceLabel: "150,000원~", materialNote: null },
    ],
  },
  {
    id: "partition",
    title: "가벽 설치",
    note: "자재 비용 별도",
    items: [
      { name: "목재 가벽 (폭 3M 이내)", unit: "식", price: 600000, priceLabel: "600,000원~", materialNote: "별도" },
      { name: "스터드 가벽 (폭 3M 이내)", unit: "식", price: 500000, priceLabel: "500,000원~", materialNote: "별도" },
      { name: "가벽 내 도어 개구부 신설 (900×2100)", unit: "개", price: 150000, priceLabel: "150,000원~", materialNote: "별도" },
      { name: "벽체 파손 보수+퍼티", unit: "개소당", price: 30000, priceLabel: "30,000원~", materialNote: null },
    ],
  },
  {
    id: "ceiling",
    title: "천장 보수",
    note: "자재 비용 별도",
    items: [
      { name: "천장틀 기본 (10㎡ 이내)", unit: "식", price: 500000, priceLabel: "500,000원~", materialNote: "별도" },
      { name: "천장 처짐 보수 (기본 10㎡)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
      { name: "천장 파손 보수+퍼티", unit: "개소당", price: 80000, priceLabel: "80,000원~", materialNote: null },
      { name: "천장 점검구 설치 (450×450)", unit: "개", price: 80000, priceLabel: "80,000원~", materialNote: null },
    ],
  },
  {
    id: "floor",
    title: "마루·바닥 보수",
    note: "자재 비용 별도",
    items: [
      { name: "마루 쪽갈이 보수 (3장 이내)", unit: "건", price: 230000, priceLabel: "230,000원~", materialNote: "별도" },
      { name: "마루 들뜸 보수 (본드 충진)", unit: "건", price: 230000, priceLabel: "230,000원~", materialNote: null },
      { name: "마루 찍힘 보수 (표면 메꿈, 10개소)", unit: "건", price: 180000, priceLabel: "180,000원~", materialNote: null },
      { name: "마루 시공비 (10평 이하)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: "별도" },
      { name: "데코타일 시공 (10평 이하)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "insulation",
    title: "단열·곰팡이 보수",
    note: "자재 비용 별도",
    items: [
      { name: "단열재 시공 아이소핑크 30T (10㎡)", unit: "식", price: 400000, priceLabel: "400,000원~", materialNote: "별도" },
      { name: "곰팡이 제거·중화 (기본 10㎡)", unit: "식", price: 300000, priceLabel: "300,000원~", materialNote: null },
      { name: "기능성 페인트 시공 (기본 10㎡)", unit: "식", price: 200000, priceLabel: "200,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "kitchen",
    title: "주방 가구·수전",
    note: "제품 비용 별도",
    items: [
      { name: "싱크대 원홀 수전 교체", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
      { name: "싱크대 투홀 수전 교체 (벽붙이)", unit: "개", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "배수트랩 교체", unit: "개", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "싱크 경첩 교체", unit: "문짝당", price: 30000, priceLabel: "30,000원~", materialNote: "별도" },
      { name: "싱크대 상부장 도어 교체", unit: "개", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "싱크대 하부장 도어 교체", unit: "개", price: 50000, priceLabel: "50,000원~", materialNote: "별도" },
    ],
  },
  {
    id: "hood",
    title: "렌지후드 교체",
    note: "제품 비용 별도",
    items: [
      { name: "기본형 슬라이딩 후드 교체", unit: "개", price: 60000, priceLabel: "60,000원~", materialNote: "별도" },
      { name: "박스형 후드 교체", unit: "개", price: 80000, priceLabel: "80,000원~", materialNote: "별도" },
      { name: "침니형 (굴뚝형) 후드 교체", unit: "개", price: 100000, priceLabel: "100,000원~", materialNote: "별도" },
    ],
  },
];
