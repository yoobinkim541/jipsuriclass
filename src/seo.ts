import { business } from "./data";
import { buildLandingPageJsonLd, type LandingPageDefinition } from "./landingPages";

export const siteUrl = "https://www.jipsuriclass.kr";
export const siteName = business.name;
export const defaultDescription = "서울·경기 집수리, 누수 복구, 부분수리 상담을 사진 기반으로 빠르게 안내합니다.";
export const defaultImage = `${siteUrl}/og-image.png`;

export type SeoConfig = {
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
};

export type LegacyPricePageConfig = SeoConfig & {
  note?: string;
};

const legacyPricePages: Record<string, LegacyPricePageConfig> = {
  "/service/electric/price": {
    path: "/service/electric/price",
    title: `전기공사 가격표 | ${siteName}`,
    description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `전기공사 가격표 | ${siteName}`,
        url: `${siteUrl}/service/electric/price`,
        description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
      }
    ]
  },
  "/service/waterproofing-tile/price": {
    path: "/service/waterproofing-tile/price",
    title: `방수·타일 가격표 | ${siteName}`,
    description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `방수·타일 가격표 | ${siteName}`,
        url: `${siteUrl}/service/waterproofing-tile/price`,
        description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
      }
    ]
  },
  "/service/waterproofing/price": {
    path: "/service/waterproofing/price",
    title: `방수 보수 가격표 | ${siteName}`,
    description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `방수 보수 가격표 | ${siteName}`,
        url: `${siteUrl}/service/waterproofing/price`,
        description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
      }
    ]
  },
  "/service/tile/price": {
    path: "/service/tile/price",
    title: `타일 가격표 | ${siteName}`,
    description: "집수리클라쓰 타일 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `타일 가격표 | ${siteName}`,
        url: `${siteUrl}/service/tile/price`,
        description: "집수리클라쓰 타일 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
      }
    ]
  }
};

export function getSeoConfigForPath(pathname: string, landingPage?: LandingPageDefinition | null): SeoConfig {
  if (pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/mypage") || pathname.startsWith("/login")) {
    return {
      path: pathname,
      title: `${siteName} | 내부 페이지`,
      description: defaultDescription,
      image: defaultImage,
      noindex: true
    };
  }

  if (pathname === "/privacy") {
    return {
      path: "/privacy",
      title: `개인정보 처리방침 | ${siteName}`,
      description: "집수리클라쓰 개인정보 처리방침입니다.",
      image: defaultImage,
      noindex: true
    };
  }

  if (pathname === "/estimate" || pathname === "/diagnosis") {
    return {
      path: pathname,
      title: pathname === "/estimate" ? `견적 상담 | ${siteName}` : `자가진단 | ${siteName}`,
      description: defaultDescription,
      image: defaultImage,
      noindex: true
    };
  }

  if (pathname in legacyPricePages) {
    return legacyPricePages[pathname]!;
  }

  if (pathname.startsWith("/service/") && pathname.endsWith("/pricing")) {
    const serviceName = getServicePricingTitle(pathname);
    return {
      path: pathname,
      title: `${serviceName} 가격표 | ${siteName}`,
      description: `집수리클라쓰 ${serviceName} 서비스의 항목별 기준 단가와 모의 견적을 확인해보세요.`,
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${serviceName} 가격표 | ${siteName}`,
          url: `${siteUrl}${pathname}`,
          description: `집수리클라쓰 ${serviceName} 서비스의 항목별 기준 단가와 모의 견적을 제공합니다.`
        }
      ]
    };
  }

  if (landingPage) {
    return {
      path: landingPage.path,
      title: landingPage.title,
      description: landingPage.description,
      image: defaultImage,
      jsonLd: buildLandingPageJsonLd(landingPage, siteUrl)
    };
  }

  return {
    path: "/",
    title: `집수리클라쓰 | 서울·경기 집수리·누수·부분수리`,
    description: defaultDescription,
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        name: siteName,
        url: siteUrl,
        telephone: business.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: business.address,
          addressCountry: "KR"
        },
        areaServed: business.area,
        description: business.introduction
      }
    ]
  };
}

export function getLegacyPricePagePaths() {
  return Object.keys(legacyPricePages);
}

export function getLegacyPricePageConfigs() {
  return Object.values(legacyPricePages);
}

function getServicePricingTitle(pathname: string) {
  const service = pathname.split("/").filter(Boolean)[1] ?? "서비스";
  switch (service) {
    case "plumbing":
      return "종합 설비";
    case "electric":
      return "전기";
    case "leak":
      return "누수 탐지·보수";
    case "bathroom":
      return "욕실 수리";
    case "door":
      return "도어 수리";
    case "window":
      return "창문·방충망";
    case "carpentry":
      return "목공·인테리어";
    case "wallpaper":
      return "도배";
    case "wallpaper-floor":
      return "도배·바닥";
    case "tile":
      return "타일";
    case "paint":
      return "페인트";
    case "exterior":
      return "외부 부분보수";
    default:
      return "가격";
  }
}
