import { business } from "./data";
import { defaultLandingSectionOrder, normalizeSectionOrder, type LandingSectionId } from "./contentSections";
import { getServiceBlogProfile } from "./services/BlogMatchingProfiles";

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingLink = {
  label: string;
  href: string;
};

export type LandingPageContent = {
  sections: LandingSectionId[];
  title: string;
  description: string;
  searchTerms: string[];
  heroTitle: string;
  heroDescription: string;
  highlights: string[];
  pointsTitle: string;
  points: string[];
  faq: LandingFaq[];
  relatedLinks: LandingLink[];
};

export type LandingPageDefinition = {
  path: string;
  categoryLabel: "서비스" | "지역";
  title: string;
  description: string;
  sections?: LandingSectionId[];
  searchTerms: string[];
  blogTerms?: string[];
  blogMatchTerms?: string[];
  blogQueryTerms?: string[];
  blogExcludeTerms?: string[];
  blogCategoryNos?: number[];
  heroTitle: string;
  heroDescription: string;
  highlights: string[];
  pointsTitle: string;
  points: string[];
  faq: LandingFaq[];
  relatedLinks: LandingLink[];
  pageType: "Service" | "Place";
  serviceType?: string;
  areaLabel?: string;
};

const servicePagesBase: LandingPageDefinition[] = [
  {
    path: "/service/leak",
    categoryLabel: "서비스",
    title: "누수 수리 | 집수리클라쓰",
    description: "천장, 벽지, 욕실, 배관 누수를 사진 상담으로 먼저 확인하고 현장 범위를 좁혀 복구합니다.",
    searchTerms: ["누수", "누수복구", "천장누수", "욕실누수", "배관누수", "물샘", "배관", "방수", "천장", "석고보드", "누수피해", "아랫집", "보상", "우물천장"],
    heroTitle: "누수 원인부터 복구까지 한 번에 확인합니다",
    heroDescription:
      "물이 떨어지는 위치만 보는 대신, 배관과 방수, 마감 손상 범위를 함께 살펴 필요한 작업만 안내합니다.",
    highlights: ["천장·벽지·욕실 누수 확인", "사진 상담 후 현장 범위 파악", "배관·방수·마감 복구 연계"],
    pointsTitle: "누수 상담에서 주로 보는 항목",
    points: [
      "물이 보이는 위치와 실제 누수 원인은 다를 수 있어 사진과 현장 확인을 같이 봅니다.",
      "급한 경우 임시조치와 영구복구를 나누어 설명합니다.",
      "배관, 실리콘, 방수층, 마감 손상 여부를 함께 확인하면 재발 가능성을 줄일 수 있습니다."
    ],
    faq: [
      {
        question: "사진만 보내도 상담이 되나요?",
        answer: "가능합니다. 누수 위치, 주변 마감 상태, 물이 번진 범위를 사진으로 먼저 보면 우선순위를 잡기 쉽습니다."
      },
      {
        question: "응급조치와 복구를 같이 하나요?",
        answer: "현장 상태에 따라 다릅니다. 먼저 물 번짐을 줄이는 조치가 필요한지, 바로 복구가 가능한지 구분합니다."
      },
      {
        question: "비용은 왜 달라지나요?",
        answer: "원인 위치, 마감 복구 범위, 자재 교체 여부, 작업 난이도에 따라 달라집니다."
      },
      {
        question: "눈에 보이지 않는 누수는 어떻게 찾나요?",
        answer: "육안으로 확인이 어려우면 누수탐지 장비를 사용합니다. 원인 위치를 먼저 좁혀 불필요한 철거를 줄이는 방향으로 진행합니다."
      },
      {
        question: "아랫집까지 물이 번졌는데 보상도 상담되나요?",
        answer: "누수 원인 세대와 피해 범위를 먼저 정리해 드립니다. 보수 견적과 함께 피해 부위 복구 범위도 같이 안내할 수 있습니다."
      },
      {
        question: "복구까지 보통 며칠 걸리나요?",
        answer: "원인 차단은 당일 처리되는 경우가 많지만, 마감 복구는 자재 건조 시간이 필요해 며칠 나뉠 수 있습니다."
      }
    ],
    relatedLinks: [
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "구리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "누수 수리"
  },
  {
    path: "/service/bathroom",
    categoryLabel: "서비스",
    title: "욕실 수리 | 집수리클라쓰",
    description: "타일, 줄눈, 실리콘, 천장 마감, 배수 문제처럼 욕실에서 자주 생기는 불편을 집중 상담합니다.",
    searchTerms: ["욕실", "화장실", "타일", "줄눈", "실리콘", "방수", "욕조", "세면대", "욕실장", "샤워부스", "코킹", "환풍기", "곰팡이", "백시멘트", "결로", "힌지", "힘펠"],
    heroTitle: "욕실은 작은 손상도 바로 번집니다",
    heroDescription:
      "욕실은 방수와 마감이 같이 움직이기 때문에, 타일만 보는 것보다 전체 구조를 확인해야 안전합니다.",
    highlights: ["타일·줄눈·실리콘 보수", "천장 마감과 배수 상태 점검", "부분 수리부터 복구까지"],
    pointsTitle: "욕실 수리에서 자주 확인하는 것",
    points: [
      "줄눈 갈라짐, 실리콘 들뜸, 타일 파손은 눈에 보이는 증상일 뿐 원인이 따로 있을 수 있습니다.",
      "천장 누수 흔적이 있으면 상부 배관과 방수 상태를 같이 확인합니다.",
      "배수 냄새나 물 고임은 하부 배수 부속 점검이 필요할 수 있습니다."
    ],
    faq: [
      {
        question: "타일 몇 장만 교체도 되나요?",
        answer: "가능합니다. 주변 마감과 색 차이를 고려해 부분 교체가 가능한지 먼저 봅니다."
      },
      {
        question: "욕실 전체 공사가 아니어도 되나요?",
        answer: "반드시 그렇지는 않습니다. 필요한 구간만 고치는 부분 수리로 해결되는 경우가 많습니다."
      },
      {
        question: "방수 문제가 의심되면 어떻게 하나요?",
        answer: "눈에 보이는 마감만 고치기보다, 원인 확인 후 방수 보수 범위를 먼저 판단합니다."
      },
      {
        question: "욕실 수리는 보통 며칠 걸리나요?",
        answer: "부분 수리는 반나절~하루, 전체 욕실 공사는 자재 건조 시간을 포함해 보통 3~5일 정도입니다. 현장 상태에 따라 달라집니다."
      },
      {
        question: "곰팡이와 냄새가 자꾸 반복돼요. 원인이 뭔가요?",
        answer: "환기 부족, 실리콘 들뜸, 배수 트랩 문제가 겹친 경우가 많습니다. 한 곳만 보지 않고 원인을 함께 확인합니다."
      },
      {
        question: "공사 중에도 욕실을 쓸 수 있나요?",
        answer: "부분 수리는 가능한 경우가 많지만, 방수·타일 작업은 양생 시간이 필요해 일정 동안 사용이 어렵습니다. 미리 안내해 드립니다."
      }
    ],
    relatedLinks: [
      { label: "누수 수리", href: "/service/leak" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "하남", href: "/area/hanam" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "욕실 수리"
  },
  {
    path: "/service/wallpaper",
    categoryLabel: "서비스",
    title: "도배 | 집수리클라쓰",
    description: "부분 도배, 전체 도배, 누수 후 벽지 복구처럼 벽면 마감이 필요한 상담을 정리합니다.",
    searchTerms: ["도배", "벽지", "부분도배", "원상복구", "벽", "합지도배", "실크도배", "천장도배", "석고보드", "오염"],
    heroTitle: "벽지 들뜸과 얼룩은 원인부터 봐야 합니다",
    heroDescription:
      "도배는 보기만 맞추는 작업이 아니라, 들뜸과 얼룩이 다시 생기지 않도록 바탕면 상태를 같이 확인해야 합니다.",
    highlights: ["부분 도배와 전체 도배", "누수 후 벽지 복구", "바탕면 상태와 색상 매칭"],
    pointsTitle: "도배 상담에서 자주 보는 상황",
    points: [
      "벽지 들뜸은 습기, 누수, 오래된 접착력 약화 중 하나일 수 있습니다.",
      "부분 복구는 주변 벽지 상태와 색상 차이를 함께 고려해야 합니다.",
      "퇴거 전 원상복구처럼 빠른 정리가 필요한 경우 일정 우선순위를 맞춥니다."
    ],
    faq: [
      {
        question: "부분 도배만 해도 티가 덜 나나요?",
        answer: "주변 벽지 상태가 좋다면 가능하지만, 색상과 질감 차이가 생길 수 있어 현장 확인이 필요합니다."
      },
      {
        question: "누수 흔적이 있으면 바로 도배하나요?",
        answer: "원인이 멈췄는지 먼저 확인한 뒤, 바탕면이 마른 상태에서 복구합니다."
      },
      {
        question: "원상복구도 가능한가요?",
        answer: "가능합니다. 퇴거 일정에 맞춰 필요한 범위만 우선 복구하는 방식으로 진행할 수 있습니다."
      },
      {
        question: "도배 비용은 어떻게 정해지나요?",
        answer: "벽지 종류(합지·실크), 면적, 바탕면 정리 범위에 따라 달라집니다. 면적과 현재 상태를 알려주시면 기준을 안내합니다."
      },
      {
        question: "기존 벽지를 떼지 않고 덧방해도 되나요?",
        answer: "상태가 양호하면 가능하지만, 들뜸이나 곰팡이가 있으면 제거 후 시공해야 마감이 오래갑니다."
      },
      {
        question: "합지와 실크 벽지는 어떤 차이가 있나요?",
        answer: "합지는 가격이 합리적이고, 실크는 내구성과 오염 관리가 좋습니다. 예산과 사용 환경에 맞게 안내해 드립니다."
      }
    ],
    relatedLinks: [
      { label: "문 수리", href: "/service/door" },
      { label: "구리", href: "/area/guri" },
      { label: "서울", href: "/area/seoul" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "도배"
  },
  {
    path: "/service/door",
    categoryLabel: "서비스",
    title: "문 수리 | 집수리클라쓰",
    description: "문이 안 닫히거나 문틀, 경첩, 손잡이, 도어락 주변이 불편할 때 필요한 보수를 안내합니다.",
    searchTerms: ["문수리", "문틀", "경첩", "도어락", "현관문", "방문", "중문", "중문수리", "고정핀", "안전고리", "디지털도어락", "문닫힘", "레일", "로라", "안닫힘"],
    heroTitle: "문이 안 닫힐 때는 문 자체보다 주변을 봐야 합니다",
    heroDescription:
      "문 수리는 문짝만 손보는 일이 아니라 문틀, 경첩, 바닥 쓸림, 잠금 장치까지 함께 확인해야 정확합니다.",
    highlights: ["문짝·문틀·경첩 점검", "도어락 주변 마감 보수", "생활 불편 최소화 우선"],
    pointsTitle: "문 수리에서 자주 확인하는 것",
    points: [
      "문이 닫히지 않는 이유는 경첩 처짐, 문틀 변형, 바닥 쓸림이 함께 있을 수 있습니다.",
      "도어락 주변 문제가 있으면 잠금 장치와 타공 부위 상태를 같이 봅니다.",
      "원룸, 빌라, 아파트처럼 공간 유형에 따라 자재와 수리가 달라집니다."
    ],
    faq: [
      {
        question: "문이 조금만 쓸려도 수리해야 하나요?",
        answer: "초기에는 간단한 조정으로 끝날 수 있습니다. 오래 두면 문틀과 마감 손상이 커질 수 있습니다."
      },
      {
        question: "도어락 주변 보수도 하나요?",
        answer: "가능합니다. 잠금 장치 자체보다 주변 마감과 체결 상태를 함께 봅니다."
      },
      {
        question: "문 교체가 꼭 필요한가요?",
        answer: "대부분은 조정이나 부분 보수로 해결됩니다. 교체는 손상 정도가 클 때만 검토합니다."
      },
      {
        question: "문이 안 닫히는데 한 번 방문으로 끝나나요?",
        answer: "경첩 조정이나 간단한 보수는 한 번에 끝나는 경우가 많습니다. 문틀 변형이 크면 부속 준비 후 재방문이 필요할 수 있습니다."
      },
      {
        question: "중문이나 슬라이딩 도어도 수리하나요?",
        answer: "가능합니다. 레일·로라 손상이나 처짐 등 증상을 사진으로 보내주시면 부속 교체 여부를 먼저 확인합니다."
      },
      {
        question: "디지털 도어락 설치·교체도 하나요?",
        answer: "가능합니다. 기존 타공 위치와 문 두께를 확인하면 대부분 호환되는 제품으로 안내할 수 있습니다."
      }
    ],
    relatedLinks: [
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "경기", href: "/area/gyeonggi" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" }
    ],
    pageType: "Service",
    serviceType: "문 수리"
  },
  {
    path: "/service/carpentry",
    categoryLabel: "서비스",
    title: "목공 수리 | 집수리클라쓰",
    description: "선반, 서랍, 몰딩, 걸레받이, 붙박이장 주변 목공 보수 및 제작 상담을 사진 기반으로 안내합니다.",
    searchTerms: ["목공", "선반", "서랍", "몰딩", "걸레받이", "수납", "붙박이", "석고보드", "벽구멍", "쫄대"],
    heroTitle: "목공은 작은 보수부터 맞춤 제작까지 범위가 다양합니다",
    heroDescription: "선반 처짐, 서랍 탈거, 걸레받이 들뜸처럼 작은 목공 불편도 사진으로 먼저 범위를 확인하면 더 빠르게 안내할 수 있습니다.",
    highlights: ["선반·서랍·몰딩 보수", "걸레받이·문틀 마감", "맞춤 선반 제작 상담"],
    pointsTitle: "목공 상담에서 자주 확인하는 것",
    points: [
      "선반 처짐이나 서랍 탈거는 체결부 상태와 자재 손상 범위를 함께 봐야 합니다.",
      "걸레받이나 몰딩 들뜸은 바탕면 수분이나 접착력 약화가 원인일 수 있습니다.",
      "맞춤 선반이나 간단한 수납 제작은 공간 치수와 하중 용도를 먼저 확인합니다."
    ],
    faq: [
      { question: "작은 목공 보수도 맡길 수 있나요?", answer: "가능합니다. 선반 나사 하나부터 문틀 마감까지 작은 범위도 사진 상담으로 확인합니다." },
      { question: "맞춤 제작도 하나요?", answer: "간단한 벽 선반, 수납 선반은 가능합니다. 치수와 사용 목적을 먼저 알려주시면 확인합니다." },
      { question: "목공과 도배를 같이 진행할 수 있나요?", answer: "가능합니다. 목공 보수 후 마감 도배를 같이 계획하면 더 깔끔하게 마무리됩니다." },
      { question: "벽에 생긴 구멍이나 파손도 메울 수 있나요?", answer: "가능합니다. 석고보드 보수 후 도배나 도장으로 마감하면 자연스럽게 정리됩니다." },
      { question: "선반이나 수납장은 하중을 얼마나 견디나요?", answer: "벽 구조(콘크리트·석고보드)와 고정 방식에 따라 다릅니다. 올릴 물건과 위치를 알려주시면 안전한 방식으로 안내합니다." },
      { question: "걸레받이·몰딩만 부분 교체도 되나요?", answer: "가능합니다. 들뜬 구간만 교체하거나 재고정하는 방식으로 비용을 줄일 수 있습니다." }
    ],
    relatedLinks: [
      { label: "도배", href: "/service/wallpaper" },
      { label: "문 수리", href: "/service/door" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "목공"
  },
  {
    path: "/service/waterproofing",
    categoryLabel: "서비스",
    title: "방수 보수 | 집수리클라쓰",
    description: "욕실, 옥상, 베란다, 테라스 방수층 손상을 사진 기반으로 확인하고 보수 범위를 안내합니다.",
    searchTerms: ["방수", "방수보수", "옥상방수", "욕실방수", "베란다", "옥상", "탄성코트", "코킹", "우레탄", "크랙", "균열", "방수실리콘", "탄성코팅", "물고임"],
    heroTitle: "방수는 눈에 보이는 곳보다 안 보이는 곳이 먼저입니다",
    heroDescription: "물이 번지는 위치와 실제 방수층 손상 위치는 다를 수 있어, 마감을 걷어내기 전 사진으로 먼저 원인 방향을 잡는 것이 중요합니다.",
    highlights: ["욕실·베란다·옥상 방수 확인", "방수층 손상 범위 파악", "누수 연계 복구"],
    pointsTitle: "방수 보수 상담에서 확인하는 것",
    points: [
      "물이 천장이나 벽으로 번질 때 방수층 손상이 원인인지 배관 문제인지를 먼저 구분합니다.",
      "욕실 방수는 타일 철거 없이 가능한 범위와 전면 보수가 필요한 범위를 따로 판단합니다.",
      "옥상이나 베란다 방수는 방수재 종류와 면적, 균열 상태를 함께 확인합니다."
    ],
    faq: [
      { question: "타일을 뜯지 않고도 방수 보수가 되나요?", answer: "경우에 따라 가능합니다. 손상 범위와 누수 흔적을 먼저 확인한 뒤 방법을 정합니다." },
      { question: "옥상 방수는 어떤 시기가 좋나요?", answer: "비가 없고 기온이 안정된 시기가 적합합니다. 작업 후 양생 기간도 필요합니다." },
      { question: "방수와 누수 수리는 다른 건가요?", answer: "방수는 예방과 보수를 포함하고, 누수 수리는 이미 번진 물의 원인을 찾고 막는 작업입니다. 보통 함께 진행합니다." },
      { question: "방수 작업 후 보증 기간이 있나요?", answer: "작업 범위와 자재에 따라 다릅니다. 시공 전에 보증 조건을 함께 안내해 드립니다." },
      { question: "베란다 물고임이 자꾸 생겨요. 방수만 하면 되나요?", answer: "구배(물매)나 배수구 문제가 함께 있는 경우가 많습니다. 방수와 함께 배수 상태도 확인해야 재발을 줄일 수 있습니다." },
      { question: "작업 후 언제부터 사용할 수 있나요?", answer: "방수재 양생 시간이 필요합니다. 종류에 따라 다르지만 보통 하루 이상 건조 후 사용을 권장합니다." }
    ],
    relatedLinks: [
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "서울", href: "/area/seoul" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "방수"
  },
  {
    path: "/service/paint",
    categoryLabel: "서비스",
    title: "도장 | 집수리클라쓰",
    description: "실내 벽면, 천장, 문짝, 창틀 도장과 페인트 보수 상담을 사진 기반으로 안내합니다.",
    searchTerms: ["도장", "페인트", "벽면도장", "천장도장", "내부도장", "도장공사", "디오페인트", "오일스테인", "항균", "곰팡이", "크랙", "균열", "외벽"],
    heroTitle: "도장은 색만 바꾸는 게 아니라 마감 상태를 되살리는 작업입니다",
    heroDescription: "페인트 벗겨짐, 얼룩, 갈라짐은 단순 덧칠보다 바탕면 정리가 먼저입니다. 사진으로 현재 상태를 확인하면 작업 범위를 더 정확하게 잡을 수 있습니다.",
    highlights: ["벽면·천장 페인트 보수", "바탕면 처리와 마감", "색상 매칭 상담"],
    pointsTitle: "도장 상담에서 자주 보는 상황",
    points: [
      "얼룩이나 갈라짐이 있는 면은 프라이머 처리와 메꿈 작업을 먼저 해야 도장이 오래 갑니다.",
      "누수 흔적이 있는 면은 원인을 먼저 해결한 뒤 도장해야 재발을 막을 수 있습니다.",
      "부분 도장은 주변 색과의 차이를 줄이기 위해 색상 선택을 신중하게 해야 합니다."
    ],
    faq: [
      { question: "일부 구간만 도장해도 티가 덜 나나요?", answer: "기존 색상과 재질에 따라 달라집니다. 현장 상태를 보고 맞춤 방식으로 안내합니다." },
      { question: "도장과 도배 중 어떤 걸 선택하면 좋나요?", answer: "벽면 상태, 예산, 취향에 따라 다릅니다. 두 옵션 모두 안내해드릴 수 있습니다." },
      { question: "도장 작업 중 생활이 가능한가요?", answer: "냄새와 환기 문제가 있어 작업 중과 건조 시간 동안은 자리를 비우는 것이 좋습니다." },
      { question: "페인트는 몇 번 칠하나요? 한 번이면 되나요?", answer: "바탕면 처리 후 보통 2회 이상 도포합니다. 색상과 바탕 상태에 따라 횟수가 달라집니다." },
      { question: "곰팡이가 있던 자리에 도장해도 되나요?", answer: "곰팡이 제거와 방균 처리를 먼저 한 뒤 도장해야 재발을 막을 수 있습니다. 원인 습기도 함께 확인합니다." },
      { question: "친환경(저VOC) 페인트로도 가능한가요?", answer: "가능합니다. 실내 공간이나 아이 방처럼 냄새가 신경 쓰이는 경우 저VOC 제품으로 안내해 드립니다." }
    ],
    relatedLinks: [
      { label: "도배", href: "/service/wallpaper" },
      { label: "목공 수리", href: "/service/carpentry" },
      { label: "경기", href: "/area/gyeonggi" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" }
    ],
    pageType: "Service",
    serviceType: "도장"
  },
  {
    path: "/service/window",
    categoryLabel: "서비스",
    title: "창호 수리 | 집수리클라쓰",
    description: "창문, 샷시, 방충망, 창틀 실리콘, 단열 문제 등 창호 관련 보수 상담을 사진 기반으로 안내합니다.",
    searchTerms: ["창호", "샷시", "창문", "방충망", "단열", "창틀", "유리교체", "이중창", "로이유리", "모헤어", "알루미늄방충망", "미세망", "샷시유리", "렉산"],
    heroTitle: "창문 틈새, 샷시 노화, 방충망까지 창호 전반을 확인합니다",
    heroDescription: "바람이 들어오거나 창이 잘 안 열리거나 방충망이 찢어진 경우, 사진으로 현재 상태를 보내주시면 보수 범위를 먼저 파악합니다.",
    highlights: ["샷시·창틀 실리콘 보수", "방충망 교체", "단열 틈새 처리"],
    pointsTitle: "창호 상담에서 자주 확인하는 것",
    points: [
      "창문 틈새 바람은 실리콘 노화나 창틀 뒤틀림이 원인일 수 있어 먼저 상태를 봅니다.",
      "방충망 교체는 창 크기와 종류에 따라 현장 실측이 필요한 경우가 있습니다.",
      "샷시 전체 교체가 아닌 부분 보수로 해결되는 경우도 많아 사진으로 먼저 확인합니다."
    ],
    faq: [
      { question: "창문 틈새만 막아도 되나요?", answer: "가능합니다. 실리콘 재시공이나 기밀 테이프로 해결되는 경우가 많습니다." },
      { question: "샷시 전체 교체 없이 보수가 되나요?", answer: "대부분의 경우 전체 교체 없이 부분 보수로 해결됩니다. 사진을 보내주시면 확인하겠습니다." },
      { question: "방충망만 교체도 가능한가요?", answer: "네, 방충망만 따로 교체 가능합니다. 창 종류와 크기를 먼저 알려주세요." },
      { question: "결로(이슬 맺힘)도 창호 교체로 줄일 수 있나요?", answer: "이중창·로이유리로 단열을 높이면 결로가 줄지만, 환기와 습도 관리도 함께 봐야 효과가 큽니다." },
      { question: "창문에서 바람 소리가 나요. 원인이 뭔가요?", answer: "모헤어(틈막이) 노후나 창틀 뒤틀림이 흔한 원인입니다. 부분 교체로 해결되는 경우가 많습니다." },
      { question: "유리만 깨졌는데 유리만 교체되나요?", answer: "가능합니다. 유리 종류와 규격을 확인하면 창틀 교체 없이 유리만 교체할 수 있는 경우가 많습니다." }
    ],
    relatedLinks: [
      { label: "문 수리", href: "/service/door" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "하남", href: "/area/hanam" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "창호"
  },
  {
    path: "/service/electric",
    categoryLabel: "서비스",
    title: "전기 수리 | 집수리클라쓰",
    description: "콘센트, 스위치, 형광등·LED 교체, 누전 점검 등 간단한 가정용 전기 작업 상담을 안내합니다.",
    searchTerms: ["전기", "콘센트", "스위치", "전등", "누전", "조명", "LED", "형광등", "전선", "센서등", "환풍기", "기판", "모듈", "리모컨", "도어락", "펜던트", "에어컨", "거실등"],
    heroTitle: "콘센트, 스위치, 전등 교체는 빠르게 처리할 수 있습니다",
    heroDescription: "작동이 안 되거나 스파크가 튀는 전기 문제는 빠른 확인이 중요합니다. 사진으로 현재 상태를 보내주시면 안전 범위를 먼저 안내합니다.",
    highlights: ["콘센트·스위치 교체", "전등·LED 교체", "간단 전기 점검"],
    pointsTitle: "전기 작업 상담에서 확인하는 것",
    points: [
      "콘센트나 스위치가 작동하지 않을 때 배선 문제인지 부품 문제인지를 먼저 구분합니다.",
      "전등 교체는 기존 소켓 종류와 천장 구조를 확인해야 작업 방식이 결정됩니다.",
      "누전이나 트립이 반복되는 경우 원인 회로를 먼저 파악하는 것이 중요합니다."
    ],
    faq: [
      { question: "콘센트 하나만 교체도 가능한가요?", answer: "가능합니다. 현장 확인 후 빠르게 처리할 수 있습니다." },
      { question: "전기 공사는 자격증이 필요한가요?", answer: "일부 전기 공사는 자격이 있는 전기공사업자가 필요합니다. 범위에 따라 안내드립니다." },
      { question: "누전 차단기가 자꾸 내려가는데 왜 그런가요?", answer: "특정 회로에 과부하나 누전이 있을 가능성이 높습니다. 어느 시점에 내려가는지 알려주시면 원인을 좁혀드립니다." },
      { question: "에어컨이나 인덕션 전용선 작업도 하나요?", answer: "전용 회로 증설은 가능 여부와 분전반 상태를 먼저 확인해야 합니다. 분전반과 설치 위치 사진을 보내주세요." },
      { question: "센서등이나 LED로 교체하고 싶어요.", answer: "기존 배선과 천장 구조를 확인하면 대부분 교체 가능합니다. 원하는 조명 종류를 알려주시면 안내합니다." },
      { question: "콘센트에서 탄 냄새가 나요. 위험한가요?", answer: "과열이나 접촉 불량 신호일 수 있어 사용을 멈추고 빠른 점검이 필요합니다. 사진과 함께 연락 주세요." }
    ],
    relatedLinks: [
      { label: "문 수리", href: "/service/door" },
      { label: "목공 수리", href: "/service/carpentry" },
      { label: "구리", href: "/area/guri" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "전기"
  },
  {
    path: "/service/tile",
    categoryLabel: "서비스",
    title: "타일 시공·보수 | 집수리클라쓰",
    description: "주방, 욕실, 현관 타일 교체 및 줄눈 보수, 깨진 타일 부분 교체 상담을 안내합니다.",
    searchTerms: ["타일", "줄눈", "타일교체", "현관타일", "주방타일", "욕실타일", "화장실타일", "코킹", "들뜸", "세라믹"],
    heroTitle: "타일 한 장부터 전체 교체까지 범위에 맞게 확인합니다",
    heroDescription: "깨진 타일, 탈락한 줄눈, 들뜬 타일은 방치하면 주변까지 손상이 번질 수 있습니다. 사진을 보내주시면 교체 가능한 범위와 방법을 먼저 안내합니다.",
    highlights: ["부분 타일 교체", "줄눈 재시공·보수", "현관·주방·욕실 타일"],
    pointsTitle: "타일 보수 상담에서 자주 확인하는 것",
    points: [
      "타일 몇 장만 깨진 경우, 같은 제품을 구하기 어려울 수 있어 대안을 같이 검토합니다.",
      "줄눈 갈라짐은 수분 침투 우려가 있어 타일 상태와 함께 방수 여부를 확인합니다.",
      "들뜬 타일은 아래 접착층 상태에 따라 재접착 또는 철거 후 재시공이 필요할 수 있습니다."
    ],
    faq: [
      { question: "타일 한 장만 교체도 되나요?", answer: "가능합니다. 주변 색상과 크기에 맞는 자재를 찾을 수 있는지가 관건입니다." },
      { question: "줄눈만 따로 새로 시공할 수 있나요?", answer: "네, 줄눈만 제거 후 재시공이 가능합니다. 면적과 기존 색상을 알려주시면 더 정확하게 안내드립니다." },
      { question: "타일 교체 중 생활이 가능한가요?", answer: "욕실이나 주방은 작업 중 사용이 어렵고, 자재 건조 시간도 필요합니다. 일정 조율이 중요합니다." },
      { question: "타일이 들떠서 통통 소리가 나요. 위험한가요?", answer: "접착층이 떨어진 상태로, 방치하면 파손이나 물 침투로 번질 수 있습니다. 재접착 또는 부분 재시공으로 확인합니다." },
      { question: "같은 타일을 못 구하면 어떻게 하나요?", answer: "단종된 경우 비슷한 색·크기로 대체하거나, 포인트 타일로 자연스럽게 처리하는 방법을 함께 제안합니다." },
      { question: "줄눈 색이 누렇게 변했어요. 새로 할 수 있나요?", answer: "기존 줄눈을 제거하고 재시공하면 색이 깔끔해집니다. 곰팡이가 있으면 함께 처리합니다." }
    ],
    relatedLinks: [
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "방수 보수", href: "/service/waterproofing" },
      { label: "하남", href: "/area/hanam" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "타일"
  },
  {
    path: "/service/plumbing",
    categoryLabel: "서비스",
    title: "종합 설비 | 집수리클라쓰",
    description: "누수탐지, 상하수도, 막힘 해결, 해빙 작업처럼 생활 설비 전반의 점검과 보수를 안내합니다.",
    searchTerms: ["배관", "수도", "누수", "막힘", "해빙", "변기", "수전", "하수", "동파", "온수", "설비", "상하수도", "양변기", "환풍기", "세면대", "샤워부스", "싱크대", "고압호스"],
    heroTitle: "설비 문제는 원인과 현장을 함께 봐야 정확합니다",
    heroDescription:
      "보이는 증상만 따라가기보다 배관, 배수, 막힘, 온수, 동결 여부를 함께 확인하면 필요한 작업만 더 정확하게 안내할 수 있습니다.",
    highlights: ["누수탐지·배관 점검", "막힘·해빙·상하수도", "생활 설비 전반 상담"],
    pointsTitle: "종합 설비 상담에서 자주 보는 것",
    points: [
      "물이 새거나 막히는 위치와 실제 원인이 다른 경우가 많아 사진과 현장 확인을 함께 봅니다.",
      "배관, 배수, 온수, 해빙, 부속 교체를 따로 나누어 필요한 작업만 안내합니다.",
      "급한 증상은 임시조치와 복구 계획을 분리해 설명합니다."
    ],
    faq: [
      {
        question: "누수탐지도 가능한가요?",
        answer: "가능합니다. 물이 보이는 위치와 원인 위치가 다를 수 있어 현장 확인과 함께 범위를 봅니다."
      },
      {
        question: "막힘만 해결해도 되나요?",
        answer: "상황에 따라 가능합니다. 막힘 원인과 반복 여부를 확인한 뒤 필요한 범위만 처리합니다."
      },
      {
        question: "동파나 해빙 작업도 하나요?",
        answer: "네. 급한 경우 임시조치와 해빙 작업, 이후 복구 범위를 나누어 안내합니다."
      },
      {
        question: "변기나 세면대 부속만 교체해도 되나요?",
        answer: "가능합니다. 물 내림 불량이나 미세 누수 같은 증상은 부속 교체로 해결되는 경우가 많습니다."
      },
      {
        question: "겨울철 동파 예방은 어떻게 하나요?",
        answer: "노출 배관 보온과 취약 구간 점검을 미리 하면 동파 위험을 줄일 수 있습니다. 동파 시 해빙 작업도 가능합니다."
      },
      {
        question: "배수구에서 냄새가 올라와요. 해결되나요?",
        answer: "트랩 마름, 봉수 부족, 배관 연결부 문제 등이 원인일 수 있습니다. 위치와 증상을 보내주시면 원인을 좁혀 안내합니다."
      }
    ],
    relatedLinks: [
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "방수·타일", href: "/service/waterproofing-tile" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "종합 설비"
  },
  {
    path: "/service/waterproofing-tile",
    categoryLabel: "서비스",
    title: "방수·타일 | 집수리클라쓰",
    description: "옥상 방수, 욕실·주방 타일 시공, 줄눈과 파손 부위 보수까지 함께 보는 상담 페이지입니다.",
    searchTerms: ["방수", "타일", "방수보수", "타일시공", "줄눈", "실리콘", "코킹", "우레탄", "크랙", "탄성코트", "욕조"],
    heroTitle: "방수와 타일은 따로보다 함께 봐야 더 정확합니다",
    heroDescription:
      "겉면의 타일 문제처럼 보여도 방수층이나 실리콘 손상이 함께 있을 수 있어, 사진 기반으로 범위를 먼저 확인한 뒤 필요한 작업만 안내합니다.",
    highlights: ["욕실·주방 타일 보수", "옥상·베란다 방수 확인", "줄눈·실리콘 마감 점검"],
    pointsTitle: "방수·타일 상담에서 자주 보는 것",
    points: [
      "타일 파손은 같은 제품 여부와 주변 마감 상태를 함께 봐야 교체 범위를 판단할 수 있습니다.",
      "방수 흔적이 있으면 표면만 보는 대신 하부 상태와 누수 방향을 같이 확인합니다.",
      "줄눈과 실리콘은 작은 틈이라도 재발 가능성이 있어 함께 점검하는 편이 좋습니다."
    ],
    faq: [
      {
        question: "타일 몇 장만 교체할 수 있나요?",
        answer: "가능합니다. 같은 제품 수급과 주변 마감 상태를 먼저 확인한 뒤 부분 교체 여부를 안내합니다."
      },
      {
        question: "방수와 타일을 같이 해야 하나요?",
        answer: "상황에 따라 함께 진행하는 것이 좋을 때가 많습니다. 누수 원인이 있으면 방수부터 확인해야 합니다."
      },
      {
        question: "줄눈만 다시 해도 되나요?",
        answer: "가능한 경우가 많지만, 하부 방수와 타일 상태에 따라 범위를 같이 판단하는 것이 안전합니다."
      },
      {
        question: "공사 후 바로 물을 사용할 수 있나요?",
        answer: "방수재와 타일 접착제, 줄눈의 양생 시간이 필요합니다. 보통 하루 이상 건조 후 사용을 권장합니다."
      },
      {
        question: "비용은 면적 기준으로 정해지나요?",
        answer: "면적과 철거 범위, 자재 종류에 따라 달라집니다. 현재 상태 사진과 대략적인 면적을 알려주시면 기준을 안내합니다."
      },
      {
        question: "방수와 타일을 따로 맡기는 것보다 같이 하면 좋나요?",
        answer: "한 번에 진행하면 철거·양생 일정이 겹쳐 더 효율적이고, 하자 책임 구분도 명확해집니다."
      }
    ],
    relatedLinks: [
      { label: "가격표", href: "/service/waterproofing-tile/price" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "종합 설비", href: "/service/plumbing" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "방수·타일"
  },
  {
    path: "/service/wallpaper-floor",
    categoryLabel: "서비스",
    title: "도배·바닥 | 집수리클라쓰",
    description: "도배, 장판, 바닥 마감, 들뜸과 오염 복구처럼 실내 마감 전반을 한 번에 상담합니다.",
    searchTerms: ["도배", "바닥", "장판", "도배바닥", "부분도배", "원상복구", "합지도배", "실크도배", "마루", "오염", "들뜸"],
    heroTitle: "벽과 바닥의 마감은 함께 보면 더 깔끔하게 맞습니다",
    heroDescription:
      "도배와 바닥은 각각도 중요하지만, 색감과 마감선이 맞아야 공간이 정돈됩니다. 사진으로 상태를 보내주시면 필요한 범위를 먼저 안내합니다.",
    highlights: ["부분·전체 도배", "장판·바닥 마감", "오염·들뜸 복구"],
    pointsTitle: "도배·바닥 상담에서 자주 보는 것",
    points: [
      "벽지와 바닥 색상이 함께 어울려야 해서 시공 순서와 범위를 같이 봅니다.",
      "누수 흔적이 있으면 바닥보다 바탕면 건조와 복구가 먼저일 수 있습니다.",
      "퇴거 전 원상복구처럼 일정이 촉박한 경우 우선순위부터 정리합니다."
    ],
    faq: [
      {
        question: "도배만 하고 바닥은 나중에 해도 되나요?",
        answer: "가능하지만, 전체 분위기와 마감선이 맞는지 같이 보는 편이 더 깔끔합니다."
      },
      {
        question: "장판 교체도 가능한가요?",
        answer: "가능합니다. 현재 바닥 상태와 면적에 따라 부분 교체 또는 전체 교체를 안내합니다."
      },
      {
        question: "원상복구도 상담 가능한가요?",
        answer: "네. 퇴거 전 필요한 범위만 먼저 정리하는 방식으로 상담할 수 있습니다."
      },
      {
        question: "바닥은 장판과 마루 중 어떤 게 좋나요?",
        answer: "예산, 사용 환경, 습기 여부에 따라 다릅니다. 두 옵션의 장단점을 함께 안내해 드립니다."
      },
      {
        question: "이사 전 비어 있는 집도 시공 가능한가요?",
        answer: "가능합니다. 오히려 가구가 없을 때 작업이 빠르고 깔끔합니다. 일정만 맞으면 됩니다."
      },
      {
        question: "도배와 바닥 중 어느 것을 먼저 하나요?",
        answer: "보통 도배를 먼저 하고 바닥을 마감해 오염을 줄입니다. 현장 상황에 따라 순서를 조율합니다."
      }
    ],
    relatedLinks: [
      { label: "도장·페인트", href: "/service/paint" },
      { label: "목공", href: "/service/carpentry" },
      { label: "방수·타일", href: "/service/waterproofing-tile" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "도배·바닥"
  },
  {
    path: "/service/film",
    categoryLabel: "서비스",
    title: "인테리어 필름 | 집수리클라쓰",
    description: "문, 몰딩, 가구, 싱크대 표면 필름 시공과 리폼을 사진 기반으로 안내합니다.",
    searchTerms: ["인테리어필름", "필름", "싱크대필름", "문필름", "가구리폼", "시트지", "싱크대", "리폼", "걸레받이보수", "들뜸", "까짐"],
    heroTitle: "필름 시공은 표면만이 아니라 마감선까지 봐야 합니다",
    heroDescription:
      "문짝, 몰딩, 가구, 싱크대 표면의 상태를 먼저 확인하고 재질과 색감을 맞춰야 더 자연스럽게 마감됩니다.",
    highlights: ["문·몰딩·가구 필름", "싱크대·수납 리폼", "부분 교체·보수 상담"],
    pointsTitle: "인테리어 필름 상담에서 자주 보는 것",
    points: [
      "표면 손상과 들뜸이 있으면 기초면 정리와 자재 선택이 중요합니다.",
      "색상과 광택 차이가 크게 나면 주변 마감과 함께 조합을 봐야 합니다.",
      "문, 몰딩, 싱크대처럼 맞닿는 면은 연결선이 자연스러운지 같이 확인합니다."
    ],
    faq: [
      {
        question: "문 한 장만 필름 시공도 가능한가요?",
        answer: "가능합니다. 부분 시공도 가능하지만 주변 색상과 마감선을 같이 확인하는 편이 좋습니다."
      },
      {
        question: "싱크대 리폼도 가능한가요?",
        answer: "네. 표면 상태와 수납 구조를 보고 필름 시공 또는 부분 교체로 안내할 수 있습니다."
      },
      {
        question: "기존 필름 위에도 시공할 수 있나요?",
        answer: "상태가 좋으면 가능하지만, 들뜸이나 손상이 있으면 먼저 제거와 보수가 필요합니다."
      },
      {
        question: "필름 시공은 얼마나 오래가나요?",
        answer: "생활 환경에 따라 다르지만 시공면 정리를 제대로 하면 수년간 유지됩니다. 모서리 들뜸은 보수로 관리할 수 있습니다."
      },
      {
        question: "가구를 교체하는 것보다 필름이 저렴한가요?",
        answer: "대부분 새로 교체하는 것보다 비용이 적게 듭니다. 상태에 따라 교체가 나은 경우도 함께 안내합니다."
      },
      {
        question: "주방 싱크대처럼 물이 닿는 곳도 괜찮나요?",
        answer: "방수성이 있는 필름과 마감 처리를 사용하면 가능합니다. 사용 환경에 맞는 자재로 안내합니다."
      }
    ],
    relatedLinks: [
      { label: "목공", href: "/service/carpentry" },
      { label: "도장·페인트", href: "/service/paint" },
      { label: "도배·바닥", href: "/service/wallpaper-floor" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "인테리어 필름"
  },
  {
    path: "/service/exterior",
    categoryLabel: "서비스",
    title: "외부 부분보수 | 집수리클라쓰",
    description: "외벽 파손, 드라이비트, 데킹, 난간, 어닝 등 건물 외부 부분보수를 사진 상담으로 빠르게 확인합니다.",
    searchTerms: ["외벽보수", "드라이비트", "스톤코트", "외부보수", "데킹", "난간", "어닝", "주차장", "외벽", "칼라강판", "방수도색", "건물외부"],
    heroTitle: "외부 손상은 빠르게 확인할수록 범위를 줄입니다",
    heroDescription:
      "외벽 파손, 도색 벗겨짐, 난간·데킹 손상은 사진으로 먼저 보면 현장 방문 전에 작업 범위를 파악할 수 있습니다.",
    highlights: ["외벽·드라이비트 보수", "데킹·난간·어닝 설치", "주차장 시설 보수"],
    pointsTitle: "외부 보수 상담에서 주로 확인하는 것",
    points: [
      "드라이비트, 스톤코트, 칼라강판 등 외장재 종류에 따라 보수 방법이 달라집니다.",
      "외벽 도색 벗겨짐은 방수 기능 저하와 연결될 수 있어 상태를 같이 확인합니다.",
      "데킹·난간은 재질(방부목·WPC)과 부식 범위에 따라 부분 교체와 전체 교체를 구분합니다."
    ],
    faq: [
      {
        question: "외벽 사진만으로 상담이 가능한가요?",
        answer: "가능합니다. 손상 위치와 범위, 외장재 종류가 보이면 대략적인 작업 범위를 먼저 안내할 수 있습니다."
      },
      {
        question: "드라이비트와 일반 외벽 도색은 어떻게 다른가요?",
        answer: "드라이비트는 단열재와 마감재가 일체형이라 보수 방법이 다릅니다. 사진으로 확인 후 적합한 방법을 안내합니다."
      },
      {
        question: "고층 외벽 작업도 가능한가요?",
        answer: "고층 작업은 장비 사용료가 추가됩니다. 현장 상황에 따라 안내드립니다."
      },
      {
        question: "외벽 균열(크랙)을 방치하면 어떻게 되나요?",
        answer: "균열 사이로 물이 스며 단열 저하나 누수 문제로 번질 수 있습니다. 초기 보수가 비용을 줄입니다."
      },
      {
        question: "겨울에도 외부 작업이 가능한가요?",
        answer: "도장·방수는 기온과 습도 영향을 받아 시기 조율이 필요합니다. 가능한 작업과 적정 시기를 안내해 드립니다."
      },
      {
        question: "데킹이나 난간은 부분 교체도 되나요?",
        answer: "가능합니다. 부식·손상 범위를 확인해 부분 교체와 전체 교체를 구분해 안내합니다."
      }
    ],
    relatedLinks: [
      { label: "도장·페인트", href: "/service/paint" },
      { label: "방수", href: "/service/waterproofing" },
      { label: "누수 탐지·보수", href: "/service/leak" },
      { label: "남양주 집수리", href: "/area/namyangju" },
      { label: "구리 집수리", href: "/area/guri" },
      { label: "하남 집수리", href: "/area/hanam" },
      { label: "강동 집수리", href: "/area/gangdong" },
      { label: "서울 집수리", href: "/area/seoul" },
      { label: "경기 집수리", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "외부 부분보수"
  }
];

const areaPages: LandingPageDefinition[] = [
  {
    path: "/area/namyangju",
    categoryLabel: "지역",
    title: "남양주 집수리 | 집수리클라쓰",
    description: "남양주에서 누수, 욕실 수리, 도배, 문 수리 상담이 필요한 분들을 위한 지역 안내 페이지입니다.",
    searchTerms: ["남양주", "화도읍", "마석", "진접", "별내", "평내", "이편한세상", "라온프라이빗", "화도", "녹촌", "금남", "다산", "마젤란", "서희", "신명", "라폴리움", "아띠랑"],
    heroTitle: "남양주 집수리 상담을 빠르게 정리합니다",
    heroDescription:
      "남양주 화도읍을 기반으로 서울·경기 권역의 현장 상담을 조율합니다. 사진을 보내주시면 범위를 먼저 확인합니다.",
    highlights: ["남양주 현장 상담", "누수·욕실·도배·문 수리", "사진 기반 사전 확인"],
    pointsTitle: "남양주 상담에서 자주 보는 내용",
    points: [
      "아파트, 빌라, 단독주택처럼 주거 형태에 따라 수리 범위가 달라질 수 있습니다.",
      "급한 물 샘이나 부분 파손은 사진 상담 후 필요한 경우 현장 방문으로 이어집니다.",
      "주소와 증상을 함께 보내주시면 출동 가능 여부와 우선순위를 빠르게 확인할 수 있습니다."
    ],
    faq: [
      {
        question: "남양주 전 지역을 가나요?",
        answer: "현장 상태와 일정에 따라 조율합니다. 상담 시 주소를 보내주시면 가능 여부를 먼저 확인합니다."
      },
      {
        question: "남양주에서 바로 문의하려면 어떻게 하나요?",
        answer: "전화나 카카오톡으로 증상 사진을 보내주시면 됩니다. 급한 경우 전화가 가장 빠릅니다."
      },
      {
        question: "얼마나 빨리 상담 연결이 되나요?",
        answer: "사진을 먼저 보내주시면 당일 상담 내용 확인이 가능합니다. 현장 방문은 일정 조율 후 진행합니다."
      },
      {
        question: "남양주는 출장비가 따로 드나요?",
        answer: "거리와 작업 범위에 따라 출장비가 있을 수 있습니다. 주소를 알려주시면 미리 안내해 드립니다."
      },
      {
        question: "여러 곳을 한 번에 수리할 수 있나요?",
        answer: "가능합니다. 누수·도배·욕실처럼 연계 작업은 한 번 방문으로 묶으면 더 효율적입니다."
      }
    ],
    relatedLinks: [
      { label: "구리", href: "/area/guri" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "남양주"
  },
  {
    path: "/area/guri",
    categoryLabel: "지역",
    title: "구리 집수리 | 집수리클라쓰",
    description: "구리 지역에서 필요한 누수, 욕실수리, 도배, 문 수리 상담을 빠르게 연결하는 페이지입니다.",
    searchTerms: ["구리", "구리시", "인창", "갈매", "교문"],
    heroTitle: "구리에서 자주 찾는 집수리 항목을 한곳에 모았습니다",
    heroDescription:
      "구리에서 문의가 많은 누수, 욕실, 도배, 문 수리를 중심으로 상담 흐름을 정리했습니다.",
    highlights: ["구리 지역 상담", "생활 집수리 중심", "사진 먼저 확인"],
    pointsTitle: "구리 상담에서 유용한 정보",
    points: [
      "증상 사진과 주소를 같이 보내면 현장 판단이 더 빠릅니다.",
      "부분 수리 여부는 손상 범위와 자재 상태를 먼저 봅니다.",
      "구리 지역의 빌라나 다가구는 공용 배관 인접 세대 수리 시 범위 확인이 중요합니다."
    ],
    faq: [
      {
        question: "구리에서도 바로 상담 가능한가요?",
        answer: "일정에 따라 조율합니다. 사진을 먼저 보내주시면 가능한 범위부터 확인합니다."
      },
      {
        question: "현장 방문 없이도 견적이 나오나요?",
        answer: "간단한 범위는 가능하지만, 정확한 견적은 현장 확인이 필요한 경우가 많습니다."
      },
      {
        question: "빌라 공용 배관 문제인지 개인 배관 문제인지 어떻게 구분하나요?",
        answer: "증상 위치와 시점을 보고 파악합니다. 사진을 함께 보내주시면 확인이 빠릅니다."
      },
      {
        question: "현장 방문 견적도 무료인가요?",
        answer: "간단한 사진 상담은 무료입니다. 현장 실측이 필요한 경우 방문 조건을 미리 안내해 드립니다."
      },
      {
        question: "구리에서 당일 상담도 되나요?",
        answer: "사진을 먼저 보내주시면 당일 내용 확인이 가능합니다. 방문 일정은 상황에 따라 조율합니다."
      }
    ],
    relatedLinks: [
      { label: "남양주", href: "/area/namyangju" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "문 수리", href: "/service/door" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "구리"
  },
  {
    path: "/area/hanam",
    categoryLabel: "지역",
    title: "하남 집수리 | 집수리클라쓰",
    description: "하남에서 필요한 누수, 욕실수리, 도배, 문 수리 상담을 위한 지역 검색 페이지입니다.",
    searchTerms: ["하남", "하남시", "미사", "강일", "위례"],
    heroTitle: "하남 집수리 상담도 사진부터 빠르게 확인합니다",
    heroDescription:
      "현장 증상, 주소, 희망 시기를 함께 받으면 상담과 출동 가능 여부를 더 빠르게 정리할 수 있습니다.",
    highlights: ["하남 지역 상담", "증상·주소·시기 확인", "생활 집수리 중심"],
    pointsTitle: "하남 상담에서 보는 기준",
    points: [
      "아파트와 빌라, 상가처럼 공간 유형에 따라 필요한 작업이 다릅니다.",
      "누수나 욕실 문제는 마감과 구조를 같이 보는 게 중요합니다.",
      "도배나 문 수리처럼 작은 작업도 증상 정리가 잘 되면 상담이 빠릅니다."
    ],
    faq: [
      {
        question: "하남은 어떤 증상부터 상담하면 좋나요?",
        answer: "물이 샌다, 벽지가 들뜬다, 문이 안 닫힌다처럼 눈에 보이는 증상부터 보내주세요."
      },
      {
        question: "하남은 출동까지 얼마나 걸리나요?",
        answer: "일정에 따라 달라집니다. 사진 상담 후 가능한 날짜를 먼저 안내합니다."
      },
      {
        question: "긴급한 경우 어떻게 하나요?",
        answer: "전화 상담이 가장 빠릅니다. 사진도 함께 보내주시면 판단이 더 쉬워집니다."
      },
      {
        question: "미사·위례 지역도 출장 가능한가요?",
        answer: "가능합니다. 주소와 증상을 보내주시면 출동 일정을 먼저 확인합니다."
      },
      {
        question: "주말에도 작업이 가능한가요?",
        answer: "일정에 따라 조율 가능합니다. 미리 희망 날짜를 알려주시면 맞춰드립니다."
      }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "하남"
  },
  {
    path: "/area/seoul",
    categoryLabel: "지역",
    title: "서울 집수리 | 집수리클라쓰",
    description: "서울 지역의 누수, 욕실수리, 도배, 문 수리 상담을 위한 대표 지역 페이지입니다.",
    searchTerms: ["서울", "서울시", "중랑구", "광진구", "강동구", "송파구", "용산", "서초구", "중화동", "올림픽"],
    heroTitle: "서울 집수리 상담은 증상 기준으로 빠르게 정리합니다",
    heroDescription:
      "서울 전역 문의는 증상과 주소를 함께 보고, 필요한 작업만 먼저 정리하는 방식으로 상담합니다.",
    highlights: ["서울 전역 상담", "누수·욕실·도배·문 수리", "필요한 작업만 안내"],
    pointsTitle: "서울 상담에서 주로 보는 것",
    points: [
      "동네와 건물 유형에 따라 출동 시간과 작업 방식이 달라질 수 있습니다.",
      "서울 각 자치구마다 건물 유형과 연식이 달라 증상과 지역을 함께 확인해야 수리 방식이 결정됩니다.",
      "출동 전 사진으로 상태를 먼저 보내주시면 필요한 작업 범위를 빠르게 정리합니다."
    ],
    faq: [
      {
        question: "서울 현장 방문도 가능한가요?",
        answer: "권역과 일정에 따라 조율합니다. 문의 시 주소를 보내주시면 우선순위를 확인합니다."
      },
      {
        question: "서울 어느 구든 상담이 가능한가요?",
        answer: "상담은 전 지역에서 가능합니다. 현장 방문은 거리와 일정에 따라 달라지므로, 주소를 보내주시면 더 정확하게 안내드립니다."
      },
      {
        question: "오래된 건물과 신축 건물 수리 방식이 다른가요?",
        answer: "구축은 배관·방수층 노후 확인이, 신축은 마감 보수와 하자 점검이 중심입니다. 연식을 함께 알려주시면 더 빠릅니다."
      },
      {
        question: "서울은 출장비가 어떻게 되나요?",
        answer: "권역과 작업 내용에 따라 다릅니다. 주소를 알려주시면 출장 조건을 먼저 안내합니다."
      },
      {
        question: "아파트 관리사무소 협의가 필요한 작업도 도와주나요?",
        answer: "공용부나 누수 관련은 관리사무소 협의가 필요할 수 있습니다. 진행 절차를 함께 안내해 드립니다."
      }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "문 수리", href: "/service/door" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "서울"
  },
  {
    path: "/area/gyeonggi",
    categoryLabel: "지역",
    title: "경기 집수리 | 집수리클라쓰",
    description: "경기권에서 누수, 욕실수리, 도배, 문 수리 상담이 필요할 때 참고할 지역 안내 페이지입니다.",
    searchTerms: ["경기", "경기도", "부천", "안양", "파주", "고양", "의정부", "성남", "수원"],
    heroTitle: "경기권 집수리 상담을 한 페이지에 모았습니다",
    heroDescription:
      "경기 지역은 출동 범위와 일정 조율이 중요하므로, 지역명과 증상을 함께 보내주시면 빠르게 확인합니다.",
    highlights: ["경기권 상담", "지역·증상 동시 확인", "출동 범위 조율"],
    pointsTitle: "경기 상담에서 확인하는 기준",
    points: [
      "광역 지역은 거리보다 실제 출동 동선과 일정이 더 중요합니다.",
      "경기 지역은 누수, 욕실, 도배, 창호처럼 항목별로 상담 방식이 다르므로 증상을 먼저 구분해 주시면 빠릅니다.",
      "아파트, 빌라, 단독주택처럼 주거 유형이 다양해 수리 방식과 자재도 달라질 수 있습니다."
    ],
    faq: [
      {
        question: "경기권이면 어디든 가능한가요?",
        answer: "현장 위치와 일정에 따라 달라집니다. 문의를 주시면 가능 범위를 먼저 확인합니다."
      },
      {
        question: "경기 외곽 지역도 출동이 가능한가요?",
        answer: "가능한 지역과 일정은 주소를 보내주시면 확인합니다. 거리보다 출동 동선 조율이 먼저입니다."
      },
      {
        question: "여러 작업을 한 번에 맡길 수 있나요?",
        answer: "가능합니다. 누수, 도배, 욕실처럼 연계가 필요한 작업은 한 번에 계획하면 더 효율적입니다."
      },
      {
        question: "경기 외곽도 출장비가 많이 드나요?",
        answer: "거리보다 출동 동선과 일정이 더 영향을 줍니다. 주소를 보내주시면 합리적으로 안내합니다."
      },
      {
        question: "견적 후 추가 비용이 생기기도 하나요?",
        answer: "현장에서 숨은 손상이 발견되면 사전에 설명하고 동의를 받은 뒤 진행합니다. 임의로 추가하지 않습니다."
      }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "하남", href: "/area/hanam" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "경기"
  },
  {
    path: "/area/yangpyeong",
    categoryLabel: "지역",
    title: "양평 집수리 | 집수리클라쓰",
    description: "양평에서 누수, 욕실수리, 도배, 목공, 창호 수리 상담을 빠르게 연결하는 지역 안내 페이지입니다.",
    searchTerms: ["양평", "양평군", "서종", "강상", "양서", "양동"],
    heroTitle: "양평 집수리 상담도 사진으로 빠르게 확인합니다",
    heroDescription: "양평 지역 단독주택, 전원주택, 빌라 수리는 출동 전 사진 상담으로 작업 범위를 먼저 파악하는 것이 중요합니다.",
    highlights: ["양평 지역 상담", "단독·전원주택 수리", "사진 먼저 확인"],
    pointsTitle: "양평 상담에서 자주 보는 내용",
    points: [
      "전원주택이나 단독주택은 아파트와 자재 구조가 달라 수리 방식을 따로 확인해야 합니다.",
      "양평은 출동 일정 조율이 중요하므로 주소와 증상을 함께 보내주시면 더 빠릅니다.",
      "누수나 방수 문제는 외벽과 지붕까지 연계되는 경우가 있어 범위를 넓게 봅니다."
    ],
    faq: [
      { question: "양평까지 출동 가능한가요?", answer: "일정에 따라 조율합니다. 주소와 증상을 먼저 보내주시면 가능 여부를 확인합니다." },
      { question: "전원주택 수리도 하나요?", answer: "가능합니다. 구조에 맞게 상담 방식을 조정합니다." },
      { question: "급한 누수는 어떻게 하나요?", answer: "사진과 함께 전화 주시면 우선 임시조치 방법을 먼저 안내합니다." },
      { question: "양평 전원주택도 출장 가능한가요?", answer: "가능합니다. 단독·전원주택은 구조가 달라 사진 상담으로 범위를 먼저 확인합니다." },
      { question: "거리가 먼데 출장비 부담이 큰가요?", answer: "일정과 동선을 조율해 합리적으로 안내합니다. 여러 작업을 묶으면 더 효율적입니다." }
    ],
    relatedLinks: [
      { label: "하남", href: "/area/hanam" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "양평"
  },
  {
    path: "/area/uijeongbu",
    categoryLabel: "지역",
    title: "의정부 집수리 | 집수리클라쓰",
    description: "의정부에서 집수리, 누수, 욕실수리, 도배, 문 수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["의정부", "의정부시", "회룡", "풍림", "호원"],
    heroTitle: "의정부 집수리 상담을 빠르게 연결합니다",
    heroDescription: "의정부 지역의 아파트, 빌라, 단독주택 수리 상담을 사진 기반으로 먼저 확인하고 작업 범위를 정리합니다.",
    highlights: ["의정부 지역 상담", "아파트·빌라·단독 수리", "사진 기반 사전 확인"],
    pointsTitle: "의정부 상담에서 유용한 정보",
    points: [
      "의정부는 아파트와 빌라가 많아 공용부 관련 수리 범위를 구분하는 것이 중요합니다.",
      "세입자 수리는 집주인과의 범위 조율이 필요한 경우가 많으니 미리 확인하세요.",
      "사진으로 증상을 보내주시면 현장 방문 전에도 우선순위를 잡을 수 있습니다."
    ],
    faq: [
      { question: "의정부도 상담 가능한가요?", answer: "네, 일정에 따라 조율합니다. 사진 상담 먼저 진행합니다." },
      { question: "공용부 수리는 어떻게 하나요?", answer: "공용부는 관리사무소 협의가 필요할 수 있습니다. 범위 확인 후 안내드립니다." },
      { question: "빠른 상담 방법이 있나요?", answer: "전화나 카카오톡으로 사진을 보내주시면 가장 빠르게 확인할 수 있습니다." },
      { question: "세입자도 수리를 의뢰할 수 있나요?", answer: "가능합니다. 다만 집주인과 수리 범위·비용 부담을 미리 정리하시면 진행이 수월합니다." },
      { question: "공용부 누수는 누가 비용을 부담하나요?", answer: "원인 위치에 따라 다릅니다. 원인을 먼저 확인하고 관리사무소 협의가 필요한지 안내해 드립니다." }
    ],
    relatedLinks: [
      { label: "남양주", href: "/area/namyangju" },
      { label: "경기", href: "/area/gyeonggi" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "의정부"
  },
  {
    path: "/area/seongnam",
    categoryLabel: "지역",
    title: "성남 집수리 | 집수리클라쓰",
    description: "성남·분당·판교에서 누수, 욕실수리, 도배, 타일, 목공 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["성남", "분당", "판교", "미켈란", "헤리티지", "수정구", "중원구"],
    heroTitle: "성남·분당·판교 집수리 상담도 사진으로 먼저 확인합니다",
    heroDescription: "성남 분당구, 수정구, 중원구를 포함해 판교까지 사진 상담 후 현장 범위를 정리해 드립니다.",
    highlights: ["성남·분당·판교 상담", "누수·욕실·타일 수리", "사진 사전 확인"],
    pointsTitle: "성남 상담에서 자주 보는 내용",
    points: [
      "분당 신도시 아파트는 시공 연도가 오래된 배관이나 방수층 교체 문의가 많습니다.",
      "판교 타운하우스나 빌라는 공간 구조에 따라 목공·타일 범위가 달라집니다.",
      "수정구·중원구 빌라는 누수와 도배 연계 수리 문의가 자주 들어옵니다."
    ],
    faq: [
      { question: "성남 분당도 가능한가요?", answer: "일정에 따라 가능합니다. 주소와 증상을 보내주시면 확인합니다." },
      { question: "판교 타운하우스도 수리하나요?", answer: "가능합니다. 구조 특성을 감안해 상담 방식을 조정합니다." },
      { question: "오래된 아파트 배관 교체도 상담 가능한가요?", answer: "가능합니다. 배관 상태와 연동된 방수·마감 범위를 같이 확인합니다." },
      { question: "분당 신도시 아파트도 출장 가능한가요?", answer: "가능합니다. 분당구·수정구·중원구 모두 주소를 알려주시면 일정을 확인합니다." },
      { question: "여러 작업을 한 번에 의뢰할 수 있나요?", answer: "가능합니다. 누수·욕실·타일처럼 연계 작업을 묶으면 일정 조율이 더 효율적입니다." }
    ],
    relatedLinks: [
      { label: "하남", href: "/area/hanam" },
      { label: "서울", href: "/area/seoul" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "성남"
  },
  {
    path: "/area/gangnam",
    categoryLabel: "지역",
    title: "강남·서초 집수리 | 집수리클라쓰",
    description: "강남구·서초구에서 누수, 욕실수리, 도배, 타일, 목공, 도장 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["강남", "서초", "강남구", "서초구", "한남", "반포", "청담"],
    heroTitle: "강남·서초 집수리 상담도 사진 기반으로 빠르게 안내합니다",
    heroDescription: "강남구, 서초구의 아파트, 주상복합, 빌라 수리 상담을 사진으로 먼저 확인하고 필요한 작업만 안내합니다.",
    highlights: ["강남·서초 지역 상담", "아파트·주상복합 수리", "타일·목공·도장"],
    pointsTitle: "강남 상담에서 자주 확인하는 것",
    points: [
      "강남권 고층 아파트는 실내 인테리어 마감이 세밀한 경우가 많아 자재 선택을 신중하게 합니다.",
      "서초구 빌라나 다세대는 욕실·배관 문제가 반복되는 경우가 있어 근본 원인을 함께 봅니다.",
      "일정 맞춤이 중요한 지역이므로 희망 날짜와 증상을 함께 알려주시면 빠릅니다."
    ],
    faq: [
      { question: "강남 아파트도 방문 상담이 가능한가요?", answer: "일정 조율 후 가능합니다. 사진 상담을 먼저 진행합니다." },
      { question: "인테리어 마감 수준에 맞게 작업하나요?", answer: "현장 수준에 맞는 방식으로 안내합니다. 자재 선택도 함께 상담할 수 있습니다." },
      { question: "서초구도 가능한가요?", answer: "네, 일정에 따라 가능합니다." },
      { question: "강남권은 출장비가 더 비싼가요?", answer: "지역으로 더 받지 않습니다. 작업 범위와 자재에 따라 견적을 산정합니다." },
      { question: "고급 마감에 맞춰 자재를 고를 수 있나요?", answer: "가능합니다. 현장 수준에 맞는 자재와 마감 방식을 함께 상담합니다." }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "강동·송파", href: "/area/gangdong" },
      { label: "도장", href: "/service/paint" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" }
    ],
    pageType: "Place",
    areaLabel: "강남"
  },
  {
    path: "/area/gangdong",
    categoryLabel: "지역",
    title: "강동·송파 집수리 | 집수리클라쓰",
    description: "강동구·송파구에서 누수, 욕실수리, 도배, 타일, 목공 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["강동", "송파", "강동구", "송파구", "암사", "명일", "천호", "잠실"],
    heroTitle: "강동·송파 집수리 상담을 한곳에서 빠르게 확인합니다",
    heroDescription: "강동구, 송파구의 아파트와 빌라 수리 상담을 사진으로 먼저 정리하고 필요한 작업만 안내합니다.",
    highlights: ["강동·송파 지역 상담", "아파트·빌라 수리", "누수·욕실·도배"],
    pointsTitle: "강동·송파 상담에서 자주 보는 내용",
    points: [
      "강동구 구축 아파트는 배관 노후와 방수층 손상 문의가 많습니다.",
      "송파구 신도시 아파트는 타일 줄눈이나 마감 보수 문의가 자주 들어옵니다.",
      "사진과 주소를 함께 보내주시면 현장 방문 전에도 우선순위를 정할 수 있습니다."
    ],
    faq: [
      { question: "강동구 전 지역 가능한가요?", answer: "일정에 따라 가능합니다. 주소 확인 후 안내드립니다." },
      { question: "구축 아파트 배관 수리도 하나요?", answer: "가능합니다. 배관 상태와 연동된 방수 범위를 같이 봅니다." },
      { question: "송파구에서 빠른 상담 방법은요?", answer: "카카오톡이나 전화로 사진을 보내주시면 가장 빠릅니다." },
      { question: "강동·송파 전 지역 출장 가능한가요?", answer: "가능합니다. 주소를 확인한 뒤 출동 일정을 안내해 드립니다." },
      { question: "잠실 고층 아파트도 작업하나요?", answer: "가능합니다. 고층 실내 작업은 일정만 맞으면 동일하게 진행됩니다." }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "하남", href: "/area/hanam" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "강동"
  },
  {
    path: "/area/nowon",
    categoryLabel: "지역",
    title: "노원·도봉 집수리 | 집수리클라쓰",
    description: "노원구·도봉구에서 누수, 욕실수리, 도배, 문 수리, 타일 수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["노원", "도봉", "노원구", "도봉구", "중계", "상계", "쌍문", "방학"],
    heroTitle: "노원·도봉 집수리 상담도 사진으로 먼저 확인합니다",
    heroDescription: "노원구, 도봉구의 아파트, 다세대 수리 상담을 사진 기반으로 먼저 정리하고 필요한 작업만 안내합니다.",
    highlights: ["노원·도봉 지역 상담", "아파트·다세대 수리", "사진 기반 확인"],
    pointsTitle: "노원·도봉 상담에서 자주 보는 내용",
    points: [
      "노원구 구축 아파트는 욕실 방수와 타일 줄눈 문제가 자주 발생합니다.",
      "도봉구 빌라나 다세대는 창호 단열과 도배 연계 수리 문의가 많습니다.",
      "급한 물 샘은 사진과 함께 연락주시면 임시조치 방법을 먼저 안내합니다."
    ],
    faq: [
      { question: "노원구 아파트 욕실 수리 가능한가요?", answer: "가능합니다. 사진으로 먼저 상태를 보내주시면 범위를 확인합니다." },
      { question: "도봉구 다세대도 상담 가능한가요?", answer: "네, 일정에 따라 가능합니다." },
      { question: "구축 아파트 전체 욕실 교체도 상담하나요?", answer: "가능합니다. 부분 수리부터 리모델링까지 범위에 맞게 안내드립니다." },
      { question: "노원·도봉 전 지역 출장 가능한가요?", answer: "중계·상계·쌍문·방학 등 가능합니다. 주소를 알려주시면 일정을 확인합니다." },
      { question: "다세대 창호 단열 작업도 되나요?", answer: "가능합니다. 창호 종류와 상태를 사진으로 보내주시면 확인합니다." }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "의정부", href: "/area/uijeongbu" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "노원"
  },
  {
    path: "/area/suwon",
    categoryLabel: "지역",
    title: "수원 집수리 | 집수리클라쓰",
    description: "수원에서 누수, 욕실수리, 도배, 문 수리, 타일 수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["수원", "수원시", "영통", "권선", "장안", "팔달"],
    heroTitle: "수원 집수리 상담을 사진으로 빠르게 안내합니다",
    heroDescription: "수원 지역 아파트, 빌라, 오피스텔의 집수리 상담을 사진 기반으로 먼저 확인하고 필요한 작업만 정리합니다.",
    highlights: ["수원 지역 상담", "아파트·빌라·오피스텔 수리", "사진 사전 확인"],
    pointsTitle: "수원 상담에서 자주 보는 내용",
    points: [
      "수원 구도심 빌라는 누수와 도배 연계 수리 문의가 많습니다.",
      "신도시 아파트는 타일과 욕실 마감 보수 문의가 주로 들어옵니다.",
      "출동 범위와 일정을 먼저 조율하는 게 중요하므로 주소를 함께 알려주세요."
    ],
    faq: [
      { question: "수원 전 지역 상담 가능한가요?", answer: "일정에 따라 가능합니다. 주소 확인 후 안내드립니다." },
      { question: "수원 빌라 누수 상담 방법은요?", answer: "카카오톡이나 전화로 사진을 먼저 보내주세요." },
      { question: "수원 신도시 아파트 욕실 보수도 하나요?", answer: "가능합니다. 사진으로 현재 상태를 확인한 후 범위를 안내합니다." },
      { question: "수원 전 지역 출장 가능한가요?", answer: "영통·권선·장안·팔달 등 가능합니다. 주소를 알려주시면 일정을 확인합니다." },
      { question: "오피스텔도 수리하나요?", answer: "가능합니다. 관리 규정상 작업 시간 제한이 있을 수 있어 미리 확인합니다." }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "성남", href: "/area/seongnam" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "수원"
  },
  {
    path: "/area/goyang",
    categoryLabel: "지역",
    title: "고양·일산 집수리 | 집수리클라쓰",
    description: "고양시·일산에서 누수, 욕실수리, 도배, 문 수리, 창호 수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["고양", "일산", "고양시", "일산동구", "일산서구", "파주", "가람마을", "한양수자인", "덕양", "행신"],
    heroTitle: "고양·일산 집수리 상담을 빠르게 정리합니다",
    heroDescription: "고양시 일산동구, 일산서구, 덕양구의 아파트와 빌라 수리 상담을 사진으로 먼저 확인합니다.",
    highlights: ["고양·일산 지역 상담", "누수·욕실·창호 수리", "사진 기반 확인"],
    pointsTitle: "고양·일산 상담에서 자주 보는 내용",
    points: [
      "일산 1기 신도시 아파트는 배관 노후와 창호 교체 문의가 많습니다.",
      "덕양구 신축 빌라는 타일이나 목공 마감 보수 문의가 자주 들어옵니다.",
      "증상과 주소를 함께 보내주시면 출동 가능 범위를 먼저 확인합니다."
    ],
    faq: [
      { question: "일산 아파트 창호 교체 상담 가능한가요?", answer: "가능합니다. 창호 종류와 상태를 사진으로 먼저 보내주세요." },
      { question: "고양 덕양구도 출동하나요?", answer: "일정에 따라 가능합니다. 주소 확인 후 안내드립니다." },
      { question: "배관 교체와 욕실 리모델링을 같이 할 수 있나요?", answer: "가능합니다. 배관 상태를 먼저 확인한 뒤 연계 작업을 계획합니다." },
      { question: "일산 1기 신도시 배관 노후 상담도 되나요?", answer: "가능합니다. 배관 상태와 연계된 욕실·방수 범위를 함께 봅니다." },
      { question: "고양 전 지역 출장 가능한가요?", answer: "일산동·서구, 덕양구 모두 가능합니다. 주소 확인 후 안내합니다." }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "의정부", href: "/area/uijeongbu" },
      { label: "창호 수리", href: "/service/window" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "고양"
  },
  {
    path: "/area/bucheon",
    categoryLabel: "지역",
    title: "부천 집수리 | 집수리클라쓰",
    description: "부천에서 도배, 전기, 방충망, 싱크대 교체 등 생활 집수리 상담을 빠르게 연결하는 지역 안내 페이지입니다.",
    searchTerms: ["부천", "부천시", "고강동", "대하에버그린", "소사", "원미"],
    heroTitle: "부천 집수리 상담을 사진으로 빠르게 확인합니다",
    heroDescription: "부천 지역 아파트, 빌라, 다세대 수리 상담을 사진 기반으로 먼저 확인하고 필요한 작업만 정리합니다.",
    highlights: ["부천 지역 상담", "도배·전기·창호 수리", "사진 기반 사전 확인"],
    pointsTitle: "부천 상담에서 자주 보는 내용",
    points: [
      "부천 구도심 빌라는 도배, 방충망, 전기 교체 문의가 많습니다.",
      "아파트 단지는 욕실 타일과 실리콘 보수 문의가 자주 들어옵니다.",
      "출동 전 사진과 주소를 함께 보내주시면 작업 범위를 빠르게 파악합니다."
    ],
    faq: [
      { question: "부천 전 지역 상담 가능한가요?", answer: "일정에 따라 가능합니다. 주소 확인 후 안내드립니다." },
      { question: "부천 빌라 도배 상담은 어떻게 하나요?", answer: "카카오톡이나 전화로 사진을 먼저 보내주세요." },
      { question: "전기와 방충망을 같이 의뢰할 수 있나요?", answer: "가능합니다. 여러 항목을 한 번에 상담하면 일정 조율이 더 효율적입니다." },
      { question: "부천 빌라 도배 견적은 어떻게 받나요?", answer: "면적과 현재 벽 상태 사진을 보내주시면 기준 견적을 안내합니다." },
      { question: "부천 전 지역 출장 가능한가요?", answer: "소사·원미·고강동 등 가능합니다. 주소를 알려주시면 일정을 확인합니다." }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "고양·일산", href: "/area/goyang" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "부천"
  },
  {
    path: "/area/paju",
    categoryLabel: "지역",
    title: "파주 집수리 | 집수리클라쓰",
    description: "파주에서 문 수리, 욕실장 교체, 베란다 도장, 방충망 수리 등 생활 집수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["파주", "파주시", "가람마을", "한양수자인", "운정", "교하"],
    heroTitle: "파주 집수리 상담도 사진으로 빠르게 확인합니다",
    heroDescription: "파주 운정, 교하 지역의 아파트와 빌라 수리 상담을 사진 기반으로 먼저 확인하고 필요한 작업만 안내합니다.",
    highlights: ["파주 지역 상담", "문 수리·방충망·도장", "사진 기반 확인"],
    pointsTitle: "파주 상담에서 자주 보는 내용",
    points: [
      "파주 운정 신도시 아파트는 문 수리와 욕실 마감 보수 문의가 많습니다.",
      "교하·가람마을 단지는 방충망과 베란다 관련 수리 문의가 자주 들어옵니다.",
      "주소와 증상을 함께 알려주시면 출동 가능 범위와 일정을 빠르게 확인합니다."
    ],
    faq: [
      { question: "파주 운정까지 출동 가능한가요?", answer: "일정에 따라 가능합니다. 주소와 증상을 먼저 보내주시면 확인합니다." },
      { question: "파주 아파트 방충망 교체 상담은요?", answer: "사진과 창 크기를 보내주시면 빠르게 안내드립니다." },
      { question: "베란다 도장과 방충망을 같이 의뢰할 수 있나요?", answer: "가능합니다. 여러 항목을 한 번에 진행하면 더 효율적입니다." },
      { question: "운정·교하까지 출장 가능한가요?", answer: "가능합니다. 주소와 증상을 보내주시면 출동 일정을 먼저 확인합니다." },
      { question: "파주는 거리가 먼데 출장비 부담이 큰가요?", answer: "동선과 일정을 조율해 합리적으로 안내합니다. 여러 작업을 묶으면 더 효율적입니다." }
    ],
    relatedLinks: [
      { label: "고양·일산", href: "/area/goyang" },
      { label: "경기", href: "/area/gyeonggi" },
      { label: "창호 수리", href: "/service/window" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "파주"
  },
  {
    path: "/area/anyang",
    categoryLabel: "지역",
    title: "안양 집수리 | 집수리클라쓰",
    description: "안양·평촌에서 목공, 욕실, 도배, 누수 수리 상담을 위한 지역 안내 페이지입니다.",
    searchTerms: ["안양", "안양시", "평촌", "어바인", "동안구"],
    heroTitle: "안양·평촌 집수리 상담을 사진으로 빠르게 확인합니다",
    heroDescription: "안양 동안구 평촌 지역의 아파트, 빌라 수리 상담을 사진 기반으로 먼저 확인하고 필요한 작업만 정리합니다.",
    highlights: ["안양·평촌 지역 상담", "목공·욕실·도배 수리", "사진 기반 확인"],
    pointsTitle: "안양 상담에서 자주 보는 내용",
    points: [
      "평촌 신도시 아파트는 목공 보수와 벽 구멍 메우기 문의가 많습니다.",
      "빌라나 다세대는 욕실과 도배 연계 수리 문의가 자주 들어옵니다.",
      "주소와 증상을 함께 보내주시면 출동 가능 여부를 빠르게 확인합니다."
    ],
    faq: [
      { question: "안양 평촌도 상담 가능한가요?", answer: "일정에 따라 가능합니다. 주소 확인 후 안내드립니다." },
      { question: "벽 구멍 메우기 같은 작은 목공도 되나요?", answer: "가능합니다. 사진으로 먼저 상태를 보내주시면 범위를 확인합니다." },
      { question: "도배와 욕실 수리를 같이 의뢰할 수 있나요?", answer: "가능합니다. 연계 작업은 한 번에 상담하면 더 효율적입니다." },
      { question: "평촌도 출장 가능한가요?", answer: "가능합니다. 동안구 평촌 일대 주소를 알려주시면 일정을 확인합니다." },
      { question: "작은 목공 보수만도 맡길 수 있나요?", answer: "가능합니다. 벽 구멍 메우기나 선반 고정 같은 소규모 작업도 상담합니다." }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "수원", href: "/area/suwon" },
      { label: "목공 수리", href: "/service/carpentry" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "설비 수리", href: "/service/plumbing" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "전기 수리", href: "/service/electric" },
      { label: "타일 시공", href: "/service/tile" },
      { label: "문 수리", href: "/service/door" },
      { label: "페인트", href: "/service/paint" }
    ],
    pageType: "Place",
    areaLabel: "안양"
  }
];

const servicePagesWithBlog = servicePagesBase.map((page) => ({
  ...page,
  ...(() => {
    const profile = getServiceBlogProfile(page.path);
    return {
      blogTerms: profile?.fetchTerms ?? page.searchTerms,
      blogMatchTerms: profile?.matchTerms ?? profile?.fetchTerms ?? page.searchTerms,
      blogCategoryNos: profile?.categoryNos,
      blogQueryTerms: profile?.queryTerms,
      blogExcludeTerms: profile?.excludeTerms
    };
  })()
}));

// 연관 페이지 자동 연결 ---------------------------------------------------------
// 서비스 하위 페이지는 "비슷한 서비스"끼리, 지역 하위 페이지는 "다른 지역"끼리
// 연결한다. 아래 우선순위 맵으로 관련도가 높은 순서를 잡고, 부족하면 같은
// 카테고리의 나머지 페이지로 채운다(MAX_RELATED 개까지). 우선순위 맵에 항목이
// 없으면 각 정의에 하드코딩된 relatedLinks 중 같은 카테고리 링크를 시드로 쓴다.
// (관리자 override가 있으면 mergeLandingPageContent 단계에서 대체된다.)
const MAX_RELATED = 6;

// 서비스 → 비슷한 서비스 (관련도 높은 순)
const SERVICE_RELATED: Record<string, string[]> = {
  "/service/leak": ["/service/plumbing", "/service/waterproofing", "/service/bathroom", "/service/waterproofing-tile"],
  "/service/bathroom": ["/service/tile", "/service/waterproofing", "/service/leak", "/service/plumbing", "/service/waterproofing-tile"],
  "/service/wallpaper": ["/service/wallpaper-floor", "/service/paint", "/service/film", "/service/carpentry"],
  "/service/door": ["/service/carpentry", "/service/window", "/service/film", "/service/electric"],
  "/service/carpentry": ["/service/door", "/service/film", "/service/wallpaper", "/service/window"],
  "/service/waterproofing": ["/service/waterproofing-tile", "/service/leak", "/service/tile", "/service/exterior", "/service/bathroom"],
  "/service/paint": ["/service/wallpaper", "/service/film", "/service/exterior", "/service/wallpaper-floor"],
  "/service/window": ["/service/door", "/service/exterior", "/service/film", "/service/carpentry"],
  "/service/electric": ["/service/door", "/service/carpentry", "/service/window"],
  "/service/tile": ["/service/waterproofing-tile", "/service/bathroom", "/service/waterproofing", "/service/leak"],
  "/service/plumbing": ["/service/leak", "/service/bathroom", "/service/waterproofing-tile", "/service/waterproofing"],
  "/service/waterproofing-tile": ["/service/waterproofing", "/service/tile", "/service/bathroom", "/service/leak", "/service/plumbing"],
  "/service/wallpaper-floor": ["/service/wallpaper", "/service/paint", "/service/film", "/service/carpentry"],
  "/service/film": ["/service/carpentry", "/service/paint", "/service/wallpaper-floor", "/service/door"],
  "/service/exterior": ["/service/paint", "/service/waterproofing", "/service/window", "/service/waterproofing-tile"]
};

// 지역 → 인근/연관 지역 (거리·생활권 가까운 순)
const AREA_RELATED: Record<string, string[]> = {
  "/area/namyangju": ["/area/guri", "/area/hanam", "/area/uijeongbu", "/area/yangpyeong", "/area/seoul"],
  "/area/guri": ["/area/namyangju", "/area/hanam", "/area/gangdong", "/area/seoul", "/area/uijeongbu"],
  "/area/hanam": ["/area/gangdong", "/area/guri", "/area/namyangju", "/area/seongnam", "/area/seoul"],
  "/area/seoul": ["/area/gangdong", "/area/gangnam", "/area/nowon", "/area/guri", "/area/gyeonggi"],
  "/area/gyeonggi": ["/area/seongnam", "/area/suwon", "/area/goyang", "/area/bucheon", "/area/anyang", "/area/uijeongbu"],
  "/area/yangpyeong": ["/area/namyangju", "/area/guri", "/area/hanam", "/area/uijeongbu", "/area/gyeonggi"],
  "/area/uijeongbu": ["/area/nowon", "/area/namyangju", "/area/goyang", "/area/seoul", "/area/gyeonggi"],
  "/area/seongnam": ["/area/gangnam", "/area/hanam", "/area/suwon", "/area/anyang", "/area/seoul"],
  "/area/gangnam": ["/area/gangdong", "/area/seoul", "/area/seongnam", "/area/hanam", "/area/suwon"],
  "/area/gangdong": ["/area/seoul", "/area/gangnam", "/area/hanam", "/area/guri", "/area/namyangju"],
  "/area/nowon": ["/area/uijeongbu", "/area/seoul", "/area/gangdong", "/area/namyangju", "/area/goyang"],
  "/area/suwon": ["/area/seongnam", "/area/anyang", "/area/gyeonggi", "/area/bucheon", "/area/gangnam"],
  "/area/goyang": ["/area/paju", "/area/bucheon", "/area/uijeongbu", "/area/gyeonggi", "/area/seoul"],
  "/area/bucheon": ["/area/goyang", "/area/anyang", "/area/suwon", "/area/gyeonggi", "/area/paju"],
  "/area/paju": ["/area/goyang", "/area/uijeongbu", "/area/bucheon", "/area/gyeonggi", "/area/seoul"],
  "/area/anyang": ["/area/suwon", "/area/seongnam", "/area/bucheon", "/area/gyeonggi", "/area/gangnam"]
};

function relatedLinkLabel(def: LandingPageDefinition): string {
  if (def.categoryLabel === "지역") {
    return def.areaLabel ?? getLandingPageShortLabel(def);
  }
  return def.serviceType ?? getLandingPageShortLabel(def);
}

function buildRelatedLinks(page: LandingPageDefinition, priority: string[], pool: LandingPageDefinition[]): LandingLink[] {
  const byPath = new Map(pool.map((item) => [item.path, item]));
  const seen = new Set<string>([page.path]);
  const ordered: string[] = [];

  const pushPath = (path: string) => {
    if (seen.has(path) || !byPath.has(path) || ordered.length >= MAX_RELATED) return;
    seen.add(path);
    ordered.push(path);
  };

  // 1) 명시적 우선순위 맵
  priority.forEach(pushPath);
  // 2) 우선순위 맵에 없을 때를 대비한 시드 — 기존 정의의 같은 카테고리 링크
  page.relatedLinks.forEach((link) => pushPath(link.href));
  // 3) 같은 카테고리의 나머지 페이지로 채움
  pool.forEach((item) => pushPath(item.path));

  return ordered.map((path) => {
    const target = byPath.get(path)!;
    return { label: relatedLinkLabel(target), href: target.path };
  });
}

const servicePages = servicePagesWithBlog.map((page) => ({
  ...page,
  relatedLinks: buildRelatedLinks(page, SERVICE_RELATED[page.path] ?? [], servicePagesWithBlog)
}));

const areaPagesLinked = areaPages.map((page) => ({
  ...page,
  relatedLinks: buildRelatedLinks(page, AREA_RELATED[page.path] ?? [], areaPages)
}));

export const landingPageDefinitions = [...servicePages, ...areaPagesLinked];

export const defaultLandingPageContent: Record<string, LandingPageContent> = Object.fromEntries(
  landingPageDefinitions.map((page) => [
    page.path,
    {
      sections: page.sections ?? defaultLandingSectionOrder,
      title: page.title,
      description: page.description,
      searchTerms: page.searchTerms,
      heroTitle: page.heroTitle,
      heroDescription: page.heroDescription,
      highlights: page.highlights,
      pointsTitle: page.pointsTitle,
      points: page.points,
      faq: page.faq,
      relatedLinks: page.relatedLinks
    }
  ])
);

export function getLandingPageDefinition(pathname: string) {
  return landingPageDefinitions.find((page) => page.path === pathname);
}

export function mergeLandingPageContent(page: LandingPageDefinition, override?: Partial<LandingPageContent> | null): LandingPageDefinition {
  if (!override) {
    return page;
  }

  return {
    ...page,
    sections: normalizeSectionOrder(override.sections, page.sections ?? defaultLandingSectionOrder),
    title: typeof override.title === "string" ? override.title : page.title,
    description: typeof override.description === "string" ? override.description : page.description,
    searchTerms: Array.isArray(override.searchTerms)
      ? override.searchTerms.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : page.searchTerms,
    heroTitle: typeof override.heroTitle === "string" ? override.heroTitle : page.heroTitle,
    heroDescription: typeof override.heroDescription === "string" ? override.heroDescription : page.heroDescription,
    highlights: Array.isArray(override.highlights)
      ? override.highlights.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : page.highlights,
    pointsTitle: typeof override.pointsTitle === "string" ? override.pointsTitle : page.pointsTitle,
    points: Array.isArray(override.points) ? override.points.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : page.points,
    faq: Array.isArray(override.faq)
      ? override.faq.filter(
          (item): item is LandingFaq =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.question === "string" &&
            typeof item.answer === "string" &&
            item.question.trim().length > 0 &&
            item.answer.trim().length > 0
        )
      : page.faq,
    relatedLinks: Array.isArray(override.relatedLinks)
      ? override.relatedLinks.filter(
          (item): item is LandingLink =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.label === "string" &&
            typeof item.href === "string" &&
            item.label.trim().length > 0 &&
            item.href.trim().length > 0
        )
      : page.relatedLinks
  };
}

export function getLandingPageIndexLinks() {
  return {
    services: servicePages,
    areas: areaPagesLinked
  };
}

export function getLandingPageDefaultContent(pathname: string) {
  return defaultLandingPageContent[pathname];
}

export function buildLandingPageJsonLd(page: LandingPageDefinition, siteUrl: string) {
  const base = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    url: `${siteUrl}${page.path}`,
    description: page.description
  };

  // 자주 묻는 질문 → FAQPage 구조화 데이터(검색결과 FAQ 리치 스니펫 대응)
  const faqLd = page.faq.length
    ? [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          url: `${siteUrl}${page.path}`,
          mainEntity: page.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer
            }
          }))
        }
      ]
    : [];

  if (page.pageType === "Service") {
    return [
      base,
      {
        "@context": "https://schema.org",
        "@type": "Service",
        name: page.title,
        serviceType: page.serviceType ?? page.title,
        provider: {
          "@type": "HomeAndConstructionBusiness",
          name: business.name,
          telephone: business.phone,
          url: siteUrl,
          address: {
            "@type": "PostalAddress",
            streetAddress: business.address,
            addressCountry: "KR"
          },
          areaServed: business.area
        },
        areaServed: business.area
      },
      ...faqLd
    ];
  }

  return [
    base,
    {
      "@context": "https://schema.org",
      "@type": "Place",
      name: page.areaLabel ?? page.title,
      address: {
        "@type": "PostalAddress",
        streetAddress: business.address,
        addressCountry: "KR"
      },
      areaServed: page.areaLabel ?? business.area,
      url: `${siteUrl}${page.path}`
    },
    ...faqLd
  ];
}

export function getLandingPageShortLabel(page: LandingPageDefinition) {
  return page.title.replace(" | 집수리클라쓰", "");
}
