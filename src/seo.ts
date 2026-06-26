import { business } from "./data";
import { buildLandingPageJsonLd, getLandingPageDefinition } from "./landingPages";
import { getServicePricingConfigByPricingPath } from "./pricing/registry";

export const siteUrl = "https://www.jipsuriclass.kr";
export const siteName = business.name;
export const defaultDescription =
  "서울·경기 집수리, 누수 복구, 부분수리, 욕실·주방·도배·전기·목공 상담을 사진 기반으로 빠르게 안내합니다.";
export const defaultImage = `${siteUrl}/og-image.png`;

export type SeoConfig = {
  path: string;
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
};

export function getSeoConfigForPath(pathname: string, landingPage?: ReturnType<typeof getLandingPageDefinition>): SeoConfig {
  landingPage = landingPage ?? getLandingPageDefinition(pathname) ?? undefined;

  if (pathname.startsWith("/admin") || pathname.startsWith("/account") || pathname.startsWith("/mypage") || pathname.startsWith("/login")) {
    return {
      path: pathname,
      title: `${siteName} | 내부 페이지`,
      description: defaultDescription,
      image: defaultImage,
      noindex: true
    };
  }

  if (pathname === "/service/electric/price") {
    return {
      path: "/service/electric/price",
      title: `전기공사 가격표 | ${siteName}`,
      description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `전기공사 가격표 | ${siteName}`,
          url: `${siteUrl}/service/electric/price`,
          description: "집수리클라쓰 전기공사 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/waterproofing-tile/price") {
    return {
      path: "/service/waterproofing-tile/price",
      title: `방수·타일 가격표 | ${siteName}`,
      description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `방수·타일 가격표 | ${siteName}`,
          url: `${siteUrl}/service/waterproofing-tile/price`,
          description: "집수리클라쓰 방수·타일 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/waterproofing/price") {
    return {
      path: "/service/waterproofing/price",
      title: `방수 보수 가격표 | ${siteName}`,
      description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `방수 보수 가격표 | ${siteName}`,
          url: `${siteUrl}/service/waterproofing/price`,
          description: "집수리클라쓰 방수 보수 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  if (pathname === "/service/tile/price") {
    return {
      path: "/service/tile/price",
      title: `타일 시공·보수 가격표 | ${siteName}`,
      description: "집수리클라쓰 타일 시공·보수 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `타일 시공·보수 가격표 | ${siteName}`,
          url: `${siteUrl}/service/tile/price`,
          description: "집수리클라쓰 타일 시공·보수 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다."
        }
      ]
    };
  }

  const registryPricingConfig = getServicePricingConfigByPricingPath(pathname);
  if (registryPricingConfig) {
    return {
      path: pathname,
      title: `${registryPricingConfig.serviceName} 가격표 | ${siteName}`,
      description: `집수리클라쓰 ${registryPricingConfig.serviceName} 서비스의 항목별 표준 시공 단가를 확인하고, 모의 견적을 계산해보세요.`,
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${registryPricingConfig.serviceName} 가격표 | ${siteName}`,
          url: `${siteUrl}${pathname}`,
          description: `집수리클라쓰 ${registryPricingConfig.serviceName} 서비스의 항목별 표준 시공 단가와 모의 견적 계산기를 제공합니다.`
        }
      ]
    };
  }

  if (pathname.startsWith("/estimate")) {
    return {
      path: "/estimate",
      title: `견적상담 | ${siteName}`,
      description: "사진과 증상으로 집수리·누수 복구·부분수리 견적을 빠르게 상담하는 페이지입니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `견적상담 | ${siteName}`,
          url: `${siteUrl}/estimate`,
          description: "사진과 증상으로 집수리·누수 복구·부분수리 견적을 빠르게 상담하는 페이지입니다."
        }
      ]
    };
  }

  if (pathname.startsWith("/portfolio")) {
    return {
      path: "/portfolio",
      title: `현장사례·시공 기록 | ${siteName}`,
      description: "집수리클라쓰가 직접 다녀온 시공 현장 기록과 네이버 블로그 최신 글을 한 곳에 모았습니다. 누수·욕실·주방·도배 사례를 카테고리별로 볼 수 있습니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `현장사례·시공 기록 | ${siteName}`,
          url: `${siteUrl}/portfolio`,
          description: "집수리클라쓰의 시공 현장 기록과 블로그 사례 모음."
        }
      ]
    };
  }

  if (pathname.startsWith("/privacy")) {
    return {
      path: "/privacy",
      title: `개인정보처리방침 | ${siteName}`,
      description: "집수리클라쓰의 개인정보 수집, 이용, 보관, 제3자 제공 기준을 확인할 수 있습니다.",
      image: defaultImage,
      noindex: true,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `개인정보처리방침 | ${siteName}`,
          url: `${siteUrl}/privacy`,
          description: "집수리클라쓰의 개인정보 수집, 이용, 보관, 제3자 제공 기준을 확인할 수 있습니다."
        }
      ]
    };
  }

  if (pathname.startsWith("/diagnosis")) {
    return {
      path: "/diagnosis",
      title: `간편 자가진단 | ${siteName}`,
      description: "문이 뻑뻑하거나 물이 새는 등 생활 집수리 증상을 클릭하면 원인과 다음 행동을 바로 확인할 수 있습니다.",
      image: defaultImage,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "문이 뻑뻑해요. 어떻게 확인하나요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "경첩 처짐, 문틀 변형, 바닥 쓸림을 먼저 확인하고, 증상이 반복되면 문수리 상담이 필요합니다."
              }
            },
            {
              "@type": "Question",
              name: "물이 샌다. 바로 뭘 해야 하나요?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "전기 기기 주변이면 사용을 멈추고 물자국이 번지는 방향을 확인한 뒤 누수 상담을 받는 것이 좋습니다."
              }
            }
          ]
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

  const businessAddress = buildPostalAddress(business.address);
  const businessHoursSpec = buildOpeningHoursSpec(business.hours);

  return {
    path: "/",
    title: `${siteName} - 클라쓰가 다른 종합 집수리`,
    description: defaultDescription,
    image: defaultImage,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: siteUrl,
        description: defaultDescription
      },
      {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        name: siteName,
        url: siteUrl,
        telephone: business.phone,
        image: defaultImage,
        address: businessAddress,
        areaServed: business.area,
        ...(businessHoursSpec ? { openingHoursSpecification: businessHoursSpec } : {}),
        sameAs: [business.naverBlogUrl, business.mapUrl, business.kakaoUrl, business.googleProfileUrl],
        description: business.introduction
      }
    ]
  };
}

/** 사업자 주소 문자열을 schema.org PostalAddress 컴포넌트로 분해한다.
 *  "경기도 남양주시 화도읍 경춘로 1790-2 106호" → 시도(addressRegion)/시군구(addressLocality)/나머지(도로명+상세).
 *  구글이 한 덩어리 streetAddress보다 분리된 컴포넌트를 더 잘 파싱한다(로컬 검색). */
function buildPostalAddress(full: string): Record<string, string> {
  const parts = full.trim().split(/\s+/);
  return {
    "@type": "PostalAddress",
    streetAddress: parts.length > 2 ? parts.slice(2).join(" ") : full,
    addressLocality: parts[1] ?? "",
    addressRegion: parts[0] ?? "",
    addressCountry: "KR"
  };
}

/** 영업시간 문자열에서 opens/closes·휴무 요일을 뽑아 OpeningHoursSpecification로 변환한다.
 *  "08:00 - 21:00 / 매주 일요일 휴무" → Mo-Sa 08:00-21:00. 시간 파싱 실패 시 null(구조화 생략, 깨진 데이터 방지). */
function buildOpeningHoursSpec(hours: string): Record<string, unknown> | null {
  const time = hours.match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  if (!time) return null;
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const closedSunday = /일요일?\s*휴무|주말\s*휴무/.test(hours);
  const closedSaturday = /토요일?\s*휴무|주말\s*휴무/.test(hours);
  const dayOfWeek = allDays.filter(
    (day) => !(day === "Sunday" && closedSunday) && !(day === "Saturday" && closedSaturday)
  );
  const pad = (value: string) => (value.length === 4 ? `0${value}` : value);
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek,
    opens: pad(time[1]),
    closes: pad(time[2])
  };
}
