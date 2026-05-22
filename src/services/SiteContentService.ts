import { business, cases as defaultCases, process as defaultProcess, services as defaultServices, symptoms as defaultSymptoms } from "../data";
import { supabase } from "../lib/supabaseClient";
import type { HomepageContent } from "../types";

type SiteContentRow = {
  payload: unknown;
  updated_at: string;
};

const CONTENT_ID = "homepage";

export const defaultHomepageContent: HomepageContent = {
  hero: {
    title: "누수부터 부분수리까지, 집 문제를 정확히 고칩니다",
    description:
      "사진 상담으로 증상을 먼저 확인하고, 필요한 작업만 설명합니다. 생활 집수리, 누수 복구, 원상복구까지 현장 중심으로 처리합니다.",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1100&q=80",
    mediaNote: "현장 사진 확인 후 작업 범위를 안내합니다"
  },
  about: {
    eyebrow: business.name,
    title: "작은 불편도 현장에서 끝까지 확인합니다",
    description: business.introduction,
    strengths: business.strengths
  },
  symptoms: defaultSymptoms,
  services: defaultServices.map((service) => ({
    title: service.title,
    text: service.text
  })),
  cases: defaultCases.map((item) => ({
    title: item.title,
    area: item.area,
    problem: item.problem,
    solution: item.solution,
    image: item.image
  })),
  process: defaultProcess.map((item) => ({
    title: item.title,
    text: item.text
  })),
  contact: {
    title: "사진을 보내주시면 작업 가능 여부부터 확인합니다",
    description:
      "급한 누수, 부분 파손, 퇴거 전 복구처럼 상황이 명확할수록 상담이 빠릅니다. 모바일에서는 하단 버튼으로 바로 연락할 수 있습니다."
  }
};

export class SiteContentService {
  async loadHomepageContent(): Promise<HomepageContent> {
    if (!supabase) {
      return defaultHomepageContent;
    }

    const { data, error } = await supabase
      .from("site_content")
      .select("payload, updated_at")
      .eq("id", CONTENT_ID)
      .maybeSingle();

    if (error || !data) {
      return defaultHomepageContent;
    }

    const row = data as SiteContentRow;
    return mergeHomepageContent(defaultHomepageContent, row.payload);
  }

  async saveHomepageContent(content: HomepageContent) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    const { error } = await supabase
      .from("site_content")
      .update({ payload: content })
      .eq("id", CONTENT_ID);

    if (error) {
      throw error;
    }
  }
}

export function mergeHomepageContent(base: HomepageContent, override: unknown): HomepageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<HomepageContent>;

  return {
    hero: { ...base.hero, ...(input.hero ?? {}) },
    about: {
      ...base.about,
      ...(input.about ?? {}),
      strengths: Array.isArray(input.about?.strengths) ? input.about!.strengths : base.about.strengths
    },
    symptoms: Array.isArray(input.symptoms) ? input.symptoms.filter((item): item is string => typeof item === "string") : base.symptoms,
    services: Array.isArray(input.services)
      ? input.services.map((item, index) => ({
          title: typeof item?.title === "string" ? item.title : base.services[index]?.title ?? "",
          text: typeof item?.text === "string" ? item.text : base.services[index]?.text ?? ""
        }))
      : base.services,
    cases: Array.isArray(input.cases)
      ? input.cases.map((item, index) => ({
          title: typeof item?.title === "string" ? item.title : base.cases[index]?.title ?? "",
          area: typeof item?.area === "string" ? item.area : base.cases[index]?.area ?? "",
          problem: typeof item?.problem === "string" ? item.problem : base.cases[index]?.problem ?? "",
          solution: typeof item?.solution === "string" ? item.solution : base.cases[index]?.solution ?? "",
          image: typeof item?.image === "string" ? item.image : base.cases[index]?.image ?? ""
        }))
      : base.cases,
    process: Array.isArray(input.process)
      ? input.process.map((item, index) => ({
          title: typeof item?.title === "string" ? item.title : base.process[index]?.title ?? "",
          text: typeof item?.text === "string" ? item.text : base.process[index]?.text ?? ""
        }))
      : base.process,
    contact: {
      ...base.contact,
      ...(input.contact ?? {})
    }
  };
}
