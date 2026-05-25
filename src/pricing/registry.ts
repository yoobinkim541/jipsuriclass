import type { ServicePricingConfig } from "./types";
import { plumbingPricingCategories } from "../plumbing/plumbingPricing";
import { electricPricingCategories } from "./electricPricing";
import { leakPricingCategories } from "./leakPricing";
import { bathroomPricingCategories } from "./bathroomPricing";
import { doorPricingCategories } from "./doorPricing";
import { windowPricingCategories } from "./windowPricing";
import { carpentryPricingCategories } from "./carpentryPricing";
import { wallpaperPricingCategories } from "./wallpaperPricing";
import { wallpaperFloorPricingCategories } from "./wallpaperFloorPricing";
import { tilePricingCategories } from "./tilePricing";
import { paintPricingCategories } from "./paintPricing";
import { exteriorPricingCategories } from "./exteriorPricing";

export const servicePricingRegistry: Record<string, ServicePricingConfig> = {
  "/service/plumbing": {
    serviceName: "종합 설비",
    pricingPagePath: "/service/plumbing/pricing",
    categories: plumbingPricingCategories,
    disclaimer:
      "배관 공사·막힘 보수·분배기·동파해빙을 다룹니다. 누수 탐지·보수는 누수 탐지·보수 서비스를 이용해 주세요. 부속자재(배관 자재, 밸브, 피팅 등) 비용은 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/electric": {
    serviceName: "전기",
    pricingPagePath: "/service/electric/pricing",
    categories: electricPricingCategories,
    disclaimer:
      "LED·스마트 제품 등 자재 비용은 별도입니다. 출장비(평일 25,000원, 주말 35,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/leak": {
    serviceName: "누수 탐지·보수",
    pricingPagePath: "/service/leak/pricing",
    categories: leakPricingCategories,
    disclaimer:
      "누수 탐지비(진단비)는 출장비와 별도로 청구됩니다. 보수 후 마감 복구 비용은 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/bathroom": {
    serviceName: "욕실 수리",
    pricingPagePath: "/service/bathroom/pricing",
    categories: bathroomPricingCategories,
    disclaimer:
      "세면기·양변기·욕조 등 제품 비용은 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/door": {
    serviceName: "도어 수리",
    pricingPagePath: "/service/door/pricing",
    categories: doorPricingCategories,
    disclaimer:
      "경첩·손잡이·도어락 등 부속자재 비용은 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/window": {
    serviceName: "창문·방충망",
    pricingPagePath: "/service/window/pricing",
    categories: windowPricingCategories,
    disclaimer:
      "롤러·모헤어·방충망 망 등 자재 비용은 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/carpentry": {
    serviceName: "목공·인테리어",
    pricingPagePath: "/service/carpentry/pricing",
    categories: carpentryPricingCategories,
    disclaimer:
      "마루·단열재·도배지 등 자재 비용은 별도입니다. 제품(후드, 수전 등) 가격도 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/wallpaper": {
    serviceName: "도배",
    pricingPagePath: "/service/wallpaper/pricing",
    categories: wallpaperPricingCategories,
    disclaimer:
      "벽지 자재(소합·광합·실크지 등) 비용은 시공비와 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/wallpaper-floor": {
    serviceName: "도배·바닥",
    pricingPagePath: "/service/wallpaper-floor/pricing",
    categories: wallpaperFloorPricingCategories,
    disclaimer:
      "벽지·마루·데코타일 등 자재 비용은 시공비와 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/tile": {
    serviceName: "타일",
    pricingPagePath: "/service/tile/pricing",
    categories: tilePricingCategories,
    disclaimer:
      "타일 자재 비용은 시공비와 별도입니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/paint": {
    serviceName: "페인트",
    pricingPagePath: "/service/paint/pricing",
    categories: paintPricingCategories,
    disclaimer:
      "페인트 자재 비용은 시공비와 별도입니다. 고층 작업 시 장비 사용료가 추가됩니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
  "/service/exterior": {
    serviceName: "외부 부분보수",
    pricingPagePath: "/service/exterior/pricing",
    categories: exteriorPricingCategories,
    disclaimer:
      "자재(외장재, 데킹재 등) 비용은 별도입니다. 고층 작업 시 장비 사용료가 추가됩니다. 출장비(평일 15,000원, 주말 25,000원)는 수리비와 별도 청구됩니다. 부가세 별도.",
  },
};

export function getServicePricingConfig(servicePath: string): ServicePricingConfig | null {
  return servicePricingRegistry[servicePath] ?? null;
}

export function getServicePricingConfigByPricingPath(pricingPath: string): ServicePricingConfig | null {
  return Object.values(servicePricingRegistry).find((c) => c.pricingPagePath === pricingPath) ?? null;
}
