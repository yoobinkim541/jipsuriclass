// 견적용 레거시 가격 데이터의 공용 타입.
// 전기 가격 데이터(electricPriceCategories)는 제거됨 — 전기 가격은 이제 공개 가격표와
// 동일하게 registry(src/pricing/electricPricing.ts) 단일 소스에서만 나온다.
// 이 타입은 아직 방수·방수타일 레거시 데이터(waterproofingTilePriceData.ts)와
// App.tsx 가격표 컴포넌트가 공유한다.
export type PriceItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  materialNote?: boolean;
  note?: string;
};

export type PriceCategory = {
  id: string;
  title: string;
  items: PriceItem[];
};
