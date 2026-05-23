import { business } from "./data";

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingLink = {
  label: string;
  href: string;
};

export type LandingPageContent = {
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
  searchTerms: string[];
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

const servicePages: LandingPageDefinition[] = [
  {
    path: "/service/leak",
    categoryLabel: "서비스",
    title: "누수 수리 | 집수리클라쓰",
    description: "천장, 벽지, 욕실, 배관 누수를 사진 상담으로 먼저 확인하고 현장 범위를 좁혀 복구합니다.",
    searchTerms: ["누수", "누수복구", "천장누수", "욕실누수", "배관누수"],
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
      }
    ],
    relatedLinks: [
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "구리", href: "/area/guri" }
    ],
    pageType: "Service",
    serviceType: "누수 수리"
  },
  {
    path: "/service/bathroom",
    categoryLabel: "서비스",
    title: "욕실 수리 | 집수리클라쓰",
    description: "타일, 줄눈, 실리콘, 천장 마감, 배수 문제처럼 욕실에서 자주 생기는 불편을 집중 상담합니다.",
    searchTerms: ["욕실", "타일", "줄눈", "실리콘", "방수"],
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
        answer: "대부분은 아닙니다. 필요한 구간만 고치는 부분 수리로도 해결되는 경우가 많습니다."
      },
      {
        question: "방수 문제가 의심되면 어떻게 하나요?",
        answer: "눈에 보이는 마감만 고치기보다, 원인 확인 후 방수 보수 범위를 먼저 판단합니다."
      }
    ],
    relatedLinks: [
      { label: "누수 수리", href: "/service/leak" },
      { label: "도배", href: "/service/wallpaper" },
      { label: "하남", href: "/area/hanam" }
    ],
    pageType: "Service",
    serviceType: "욕실 수리"
  },
  {
    path: "/service/wallpaper",
    categoryLabel: "서비스",
    title: "도배 | 집수리클라쓰",
    description: "부분 도배, 전체 도배, 누수 후 벽지 복구처럼 벽면 마감이 필요한 상담을 정리합니다.",
    searchTerms: ["도배", "벽지", "부분도배", "원상복구", "누수"],
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
      }
    ],
    relatedLinks: [
      { label: "문 수리", href: "/service/door" },
      { label: "구리", href: "/area/guri" },
      { label: "서울", href: "/area/seoul" }
    ],
    pageType: "Service",
    serviceType: "도배"
  },
  {
    path: "/service/door",
    categoryLabel: "서비스",
    title: "문수리 | 집수리클라쓰",
    description: "문이 안 닫히거나 문틀, 경첩, 손잡이, 도어락 주변이 불편할 때 필요한 보수를 안내합니다.",
    searchTerms: ["문수리", "문", "문틀", "경첩", "도어락"],
    heroTitle: "문이 안 닫힐 때는 문 자체보다 주변을 봐야 합니다",
    heroDescription:
      "문수리는 문짝만 손보는 일이 아니라 문틀, 경첩, 바닥 쓸림, 잠금 장치까지 함께 확인해야 정확합니다.",
    highlights: ["문짝·문틀·경첩 점검", "도어락 주변 마감 보수", "생활 불편 최소화 우선"],
    pointsTitle: "문수리에서 자주 확인하는 것",
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
        question: "문교체가 꼭 필요한가요?",
        answer: "대부분은 조정이나 부분 보수로 해결됩니다. 교체는 손상 정도가 클 때만 검토합니다."
      }
    ],
    relatedLinks: [
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "경기", href: "/area/gyeonggi" }
    ],
    pageType: "Service",
    serviceType: "문수리"
  }
];

const areaPages: LandingPageDefinition[] = [
  {
    path: "/area/namyangju",
    categoryLabel: "지역",
    title: "남양주 집수리 | 집수리클라쓰",
    description: "남양주에서 누수, 욕실 수리, 도배, 문수리 상담이 필요한 분들을 위한 지역 안내 페이지입니다.",
    searchTerms: ["남양주", "화도읍", "마석", "진접", "별내"],
    heroTitle: "남양주 집수리 상담을 빠르게 정리합니다",
    heroDescription:
      "남양주 화도읍을 기반으로 서울·경기 권역의 현장 상담을 조율합니다. 사진을 보내주시면 범위를 먼저 확인합니다.",
    highlights: ["남양주 현장 상담", "누수·욕실·도배·문수리", "사진 기반 사전 확인"],
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
        question: "지역 페이지가 왜 필요한가요?",
        answer: "검색자는 지역명을 같이 넣어 찾는 경우가 많아서, 지역 정보가 분리된 페이지가 더 잘 맞습니다."
      }
    ],
    relatedLinks: [
      { label: "구리", href: "/area/guri" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "도배", href: "/service/wallpaper" }
    ],
    pageType: "Place",
    areaLabel: "남양주"
  },
  {
    path: "/area/guri",
    categoryLabel: "지역",
    title: "구리 집수리 | 집수리클라쓰",
    description: "구리 지역에서 필요한 누수, 욕실수리, 도배, 문수리 상담을 빠르게 연결하는 페이지입니다.",
    searchTerms: ["구리"],
    heroTitle: "구리에서 자주 찾는 집수리 항목을 한곳에 모았습니다",
    heroDescription:
      "구리에서 문의가 많은 누수, 욕실, 도배, 문수리를 중심으로 상담 흐름을 정리했습니다.",
    highlights: ["구리 지역 상담", "생활 집수리 중심", "사진 먼저 확인"],
    pointsTitle: "구리 상담에서 유용한 정보",
    points: [
      "증상 사진과 주소를 같이 보내면 현장 판단이 더 빠릅니다.",
      "부분 수리 여부는 손상 범위와 자재 상태를 먼저 봅니다.",
      "지역 페이지는 같은 키워드로 검색하는 사용자에게 더 잘 맞습니다."
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
        question: "구리와 남양주를 같이 묶어도 되나요?",
        answer: "가능합니다. 다만 검색어마다 따로 페이지를 두면 노출에 더 유리합니다."
      }
    ],
    relatedLinks: [
      { label: "남양주", href: "/area/namyangju" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "문수리", href: "/service/door" }
    ],
    pageType: "Place",
    areaLabel: "구리"
  },
  {
    path: "/area/hanam",
    categoryLabel: "지역",
    title: "하남 집수리 | 집수리클라쓰",
    description: "하남에서 필요한 누수, 욕실수리, 도배, 문수리 상담을 위한 지역 검색 페이지입니다.",
    searchTerms: ["하남"],
    heroTitle: "하남 집수리 상담도 사진부터 빠르게 확인합니다",
    heroDescription:
      "현장 증상, 주소, 희망 시기를 함께 받으면 상담과 출동 가능 여부를 더 빠르게 정리할 수 있습니다.",
    highlights: ["하남 지역 상담", "증상·주소·시기 확인", "생활 집수리 중심"],
    pointsTitle: "하남 상담에서 보는 기준",
    points: [
      "아파트와 빌라, 상가처럼 공간 유형에 따라 필요한 작업이 다릅니다.",
      "누수나 욕실 문제는 마감과 구조를 같이 보는 게 중요합니다.",
      "도배나 문수리처럼 작은 작업도 증상 정리가 잘 되면 상담이 빠릅니다."
    ],
    faq: [
      {
        question: "하남은 어떤 증상부터 상담하면 좋나요?",
        answer: "물이 샌다, 벽지가 들뜬다, 문이 안 닫힌다처럼 눈에 보이는 증상부터 보내주세요."
      },
      {
        question: "하남 페이지를 따로 둬야 하나요?",
        answer: "네. 지역 검색은 사용자 의도가 분명해서, 지역별로 페이지를 나누면 도움이 됩니다."
      },
      {
        question: "긴급한 경우 어떻게 하나요?",
        answer: "전화 상담이 가장 빠릅니다. 사진도 함께 보내주시면 판단이 더 쉬워집니다."
      }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "욕실 수리", href: "/service/bathroom" },
      { label: "도배", href: "/service/wallpaper" }
    ],
    pageType: "Place",
    areaLabel: "하남"
  },
  {
    path: "/area/seoul",
    categoryLabel: "지역",
    title: "서울 집수리 | 집수리클라쓰",
    description: "서울 지역의 누수, 욕실수리, 도배, 문수리 상담을 위한 대표 지역 페이지입니다.",
    searchTerms: ["서울"],
    heroTitle: "서울 집수리 상담은 증상 기준으로 빠르게 정리합니다",
    heroDescription:
      "서울 전역 문의는 증상과 주소를 함께 보고, 필요한 작업만 먼저 정리하는 방식으로 상담합니다.",
    highlights: ["서울 전역 상담", "누수·욕실·도배·문수리", "필요한 작업만 안내"],
    pointsTitle: "서울 상담에서 주로 보는 것",
    points: [
      "동네와 건물 유형에 따라 출동 시간과 작업 방식이 달라질 수 있습니다.",
      "검색자는 보통 지역명과 증상을 함께 찾으므로 둘을 같이 보여주는 것이 좋습니다.",
      "서울 페이지는 지역 신뢰 신호와 서비스 설명을 함께 담는 용도로 유용합니다."
    ],
    faq: [
      {
        question: "서울은 어디까지 가능한가요?",
        answer: "권역과 일정에 따라 조율합니다. 문의 시 주소를 보내주시면 우선순위를 확인합니다."
      },
      {
        question: "서울 페이지에는 무엇을 넣나요?",
        answer: "지역명, 상담 가능 항목, 대표 사례, 연락 방법, 자주 묻는 질문이 들어가면 좋습니다."
      },
      {
        question: "지역 페이지가 중복 콘텐츠가 되지 않나요?",
        answer: "같은 템플릿이라도 지역별 실제 안내와 질문이 다르면 충분히 구분 가능합니다."
      }
    ],
    relatedLinks: [
      { label: "경기", href: "/area/gyeonggi" },
      { label: "누수 수리", href: "/service/leak" },
      { label: "문수리", href: "/service/door" }
    ],
    pageType: "Place",
    areaLabel: "서울"
  },
  {
    path: "/area/gyeonggi",
    categoryLabel: "지역",
    title: "경기 집수리 | 집수리클라쓰",
    description: "경기권에서 누수, 욕실수리, 도배, 문수리 상담이 필요할 때 참고할 지역 안내 페이지입니다.",
    searchTerms: ["경기", "경기도"],
    heroTitle: "경기권 집수리 상담을 한 페이지에 모았습니다",
    heroDescription:
      "경기 지역은 출동 범위와 일정 조율이 중요하므로, 지역명과 증상을 함께 보내주시면 빠르게 확인합니다.",
    highlights: ["경기권 상담", "지역·증상 동시 확인", "출동 범위 조율"],
    pointsTitle: "경기 상담에서 확인하는 기준",
    points: [
      "광역 지역은 거리보다 실제 출동 동선과 일정이 더 중요합니다.",
      "집수리 항목은 누수, 욕실, 도배, 문수리처럼 검색어가 분명할수록 페이지를 나누는 편이 좋습니다.",
      "경기 페이지는 다른 지역 페이지와 연결해 지역 네트워크를 만들기 좋습니다."
    ],
    faq: [
      {
        question: "경기권이면 어디든 가능한가요?",
        answer: "현장 위치와 일정에 따라 달라집니다. 문의를 주시면 가능 범위를 먼저 확인합니다."
      },
      {
        question: "경기 페이지는 왜 필요하나요?",
        answer: "지역명 검색에서 상위 노출 가능성을 높이고, 방문자가 원하는 정보를 빠르게 보여주기 위해서입니다."
      },
      {
        question: "서비스 페이지와 함께 운영해도 되나요?",
        answer: "오히려 같이 운영하는 것이 좋습니다. 서비스 페이지와 지역 페이지가 서로 내부 링크 역할을 합니다."
      }
    ],
    relatedLinks: [
      { label: "서울", href: "/area/seoul" },
      { label: "남양주", href: "/area/namyangju" },
      { label: "하남", href: "/area/hanam" }
    ],
    pageType: "Place",
    areaLabel: "경기"
  }
];

export const landingPageDefinitions = [...servicePages, ...areaPages];

export const defaultLandingPageContent: Record<string, LandingPageContent> = Object.fromEntries(
  landingPageDefinitions.map((page) => [
    page.path,
    {
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
    areas: areaPages
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
      }
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
    }
  ];
}

export function getLandingPageShortLabel(page: LandingPageDefinition) {
  return page.title.replace(" | 집수리클라쓰", "");
}
