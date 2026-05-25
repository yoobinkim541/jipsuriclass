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

export const electricPriceCategories: PriceCategory[] = [
  {
    id: "call",
    title: "출장비",
    items: [
      { id: "call-weekday", name: "평일 출장비", unit: "회", price: 25000 },
      { id: "call-weekend", name: "주말·공휴일 출장비", unit: "회", price: 35000 },
      { id: "call-evening", name: "오후 6시 이후 추가", unit: "회", price: 10000 },
    ],
  },
  {
    id: "switch",
    title: "스위치 교체",
    items: [
      { id: "switch-general", name: "일반 스위치", unit: "개", price: 35000, materialNote: true },
      { id: "switch-smart", name: "스마트 스위치", unit: "개", price: 50000, materialNote: true },
      { id: "switch-3way", name: "3로 스위치", unit: "개", price: 40000, materialNote: true },
      { id: "switch-separation", name: "분리 스위치", unit: "개", price: 100000, materialNote: true },
      { id: "switch-timer", name: "타이머 릴레이 스위치", unit: "개", price: 30000, materialNote: true },
    ],
  },
  {
    id: "lighting",
    title: "조명 교체·설치",
    items: [
      { id: "light-room-s", name: "방등 소형", unit: "개", price: 40000, materialNote: true },
      { id: "light-room-m", name: "방등 중형", unit: "개", price: 50000, materialNote: true },
      { id: "light-room-l", name: "방등 대형", unit: "개", price: 80000, materialNote: true },
      { id: "light-kitchen", name: "주방등", unit: "개", price: 50000, materialNote: true },
      { id: "light-pendant", name: "펜던트 조명", unit: "개", price: 70000, materialNote: true },
      { id: "light-downlight-bath", name: "욕실 다운라이트", unit: "개", price: 52000, materialNote: true, note: "45,000~60,000원" },
      { id: "light-downlight-room", name: "방 다운라이트", unit: "개", price: 30000, materialNote: true },
      { id: "light-sensor", name: "센서 조명", unit: "개", price: 30000, materialNote: true },
      { id: "light-balcony", name: "발코니 조명", unit: "개", price: 30000, materialNote: true },
    ],
  },
  {
    id: "outlet",
    title: "콘센트·인터넷 잭",
    items: [
      { id: "outlet-2port", name: "2구 콘센트 교체", unit: "개", price: 50000, materialNote: true },
      { id: "outlet-1port", name: "1구 콘센트 교체", unit: "개", price: 60000, materialNote: true },
      { id: "outlet-internet", name: "인터넷 잭 교체", unit: "개", price: 50000, materialNote: true },
    ],
  },
  {
    id: "wiring",
    title: "배선·분전반 공사",
    items: [
      { id: "wiring-safety", name: "안전점검", unit: "10평", price: 100000, note: "10평당" },
      { id: "wiring-empty", name: "배선 공사 (빈집)", unit: "평", price: 50000, materialNote: true, note: "평당" },
      { id: "wiring-occupied", name: "배선 공사 (거주 중)", unit: "평", price: 60000, materialNote: true, note: "평당, 빈집 대비 +10,000원" },
      { id: "wiring-panel", name: "분전반 교체 (6회로)", unit: "식", price: 300000, materialNote: true, note: "회로 추가 시 +50,000원/회로" },
      { id: "wiring-dedicated", name: "전용 라인 설치", unit: "개소", price: 550000, materialNote: true },
      { id: "wiring-outlet-add", name: "콘센트 증설 (3m)", unit: "개소", price: 150000, materialNote: true },
    ],
  },
  {
    id: "ceiling-fan",
    title: "실링팬 설치",
    items: [
      { id: "fan-install", name: "실링팬 설치", unit: "대", price: 160000, materialNote: true, note: "120,000~200,000원 (제품 크기·구조에 따라 변동)" },
    ],
  },
  {
    id: "leakage",
    title: "누전 진단·차단기",
    items: [
      { id: "leakage-diag", name: "누전 진단", unit: "회로", price: 200000, note: "회로당" },
      { id: "leakage-panel", name: "분전반 교체 (누전 포함)", unit: "식", price: 400000, materialNote: true },
      { id: "leakage-breaker", name: "분기 차단기 교체", unit: "개", price: 80000, materialNote: true },
    ],
  },
];
