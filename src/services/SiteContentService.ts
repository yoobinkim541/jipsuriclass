import { business, cases as defaultCases, pinnedPosts, process as defaultProcess, services as defaultServices, symptoms as defaultSymptoms } from "../data";
import { images } from "../assets/images";
import { supabase } from "../lib/supabaseClient";
import type { HomepageContent } from "../types";

type SiteContentRow = {
  payload: unknown;
  updated_at: string;
};

const CONTENT_ID = "homepage";

export const defaultHomepageContent: HomepageContent = {
  hero: {
    title: "클라쓰가 다른 종합집수리",
    description:
      "사진 상담으로 증상을 먼저 확인하고, 필요한 작업만 설명합니다. 생활 집수리, 누수 복구, 원상복구까지 현장 중심으로 처리합니다.",
    image: images.heroFallback,
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
    image: item.image,
    link: item.link
  })),
  blog: pinnedPosts.slice(0, 3).map((post) => ({
    title: post.title,
    description: post.description,
    date: post.date,
    link: post.link,
    image: post.image
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
    const merged = mergeHomepageContent(defaultHomepageContent, row.payload);
    return isHomepageContent(merged) ? merged : defaultHomepageContent;
  }

  async saveHomepageContent(content: HomepageContent) {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured");
    }

    if (!isHomepageContent(content)) {
      throw new Error("Invalid homepage content schema");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isServiceCard(value: unknown): value is HomepageContent["services"][number] {
  return isRecord(value) && isString(value.title) && isString(value.text);
}

function isCaseCard(value: unknown): value is HomepageContent["cases"][number] {
  return (
    isRecord(value) &&
    isString(value.title) &&
    isString(value.area) &&
    isString(value.problem) &&
    isString(value.solution) &&
    isString(value.image) &&
    isString(value.link)
  );
}

function isBlogPost(value: unknown): value is HomepageContent["blog"][number] {
  return isRecord(value) && isString(value.title) && isString(value.description) && isString(value.date) && isString(value.link) && isString(value.image);
}

function isProcessStep(value: unknown): value is HomepageContent["process"][number] {
  return isRecord(value) && isString(value.title) && isString(value.text);
}

function isHomepageContent(value: unknown): value is HomepageContent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecord(value.hero) &&
    isString(value.hero.title) &&
    isString(value.hero.description) &&
    isString(value.hero.image) &&
    isString(value.hero.mediaNote) &&
    isRecord(value.about) &&
    isString(value.about.eyebrow) &&
    isString(value.about.title) &&
    isString(value.about.description) &&
    isStringArray(value.about.strengths) &&
    Array.isArray(value.symptoms) &&
    value.symptoms.every((item) => typeof item === "string") &&
    Array.isArray(value.services) &&
    value.services.every(isServiceCard) &&
    Array.isArray(value.cases) &&
    value.cases.every(isCaseCard) &&
    Array.isArray(value.blog) &&
    value.blog.every(isBlogPost) &&
    Array.isArray(value.process) &&
    value.process.every(isProcessStep) &&
    isRecord(value.contact) &&
    isString(value.contact.title) &&
    isString(value.contact.description)
  );
}

export function mergeHomepageContent(base: HomepageContent, override: unknown): HomepageContent {
  if (!override || typeof override !== "object") {
    return base;
  }

  const input = override as Partial<HomepageContent>;

  function mergeTextArray<T>(
    source: unknown,
    baseItems: T[],
    createItem: (item: Record<string, unknown>, index: number) => T,
    isItem: (value: unknown) => value is Record<string, unknown>
  ): T[] {
    if (!Array.isArray(source)) {
      return baseItems;
    }

    const length = Math.max(baseItems.length, source.length);
    return Array.from({ length }, (_, index) => {
      const incoming = source[index];
      if (isItem(incoming)) {
        return createItem(incoming, index);
      }

      return baseItems[index] ?? createItem({}, index);
    });
  }

  return {
    hero: { ...base.hero, ...(input.hero ?? {}) },
    about: {
      ...base.about,
      ...(input.about ?? {}),
      strengths: Array.isArray(input.about?.strengths) ? input.about!.strengths : base.about.strengths
    },
    symptoms: Array.isArray(input.symptoms) ? input.symptoms.filter((item): item is string => typeof item === "string") : base.symptoms,
    services: mergeTextArray(
      input.services,
      base.services,
      (item, index) => ({
        title: typeof item.title === "string" ? item.title : base.services[index]?.title ?? "",
        text: typeof item.text === "string" ? item.text : base.services[index]?.text ?? ""
      }),
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null
    ),
    cases: mergeTextArray(
      input.cases,
      base.cases,
      (item, index) => ({
        title: typeof item.title === "string" ? item.title : base.cases[index]?.title ?? "",
        area: typeof item.area === "string" ? item.area : base.cases[index]?.area ?? "",
        problem: typeof item.problem === "string" ? item.problem : base.cases[index]?.problem ?? "",
        solution: typeof item.solution === "string" ? item.solution : base.cases[index]?.solution ?? "",
        image: typeof item.image === "string" ? item.image : base.cases[index]?.image ?? "",
        link: typeof item.link === "string" ? item.link : base.cases[index]?.link ?? ""
      }),
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null
    ),
    blog: mergeTextArray(
      input.blog,
      base.blog,
      (item, index) => ({
        title: typeof item.title === "string" ? item.title : base.blog[index]?.title ?? "",
        description: typeof item.description === "string" ? item.description : base.blog[index]?.description ?? "",
        date: typeof item.date === "string" ? item.date : base.blog[index]?.date ?? "",
        link: typeof item.link === "string" ? item.link : base.blog[index]?.link ?? "",
        image: typeof item.image === "string" ? item.image : base.blog[index]?.image ?? ""
      }),
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null
    ),
    process: mergeTextArray(
      input.process,
      base.process,
      (item, index) => ({
        title: typeof item.title === "string" ? item.title : base.process[index]?.title ?? "",
        text: typeof item.text === "string" ? item.text : base.process[index]?.text ?? ""
      }),
      (value): value is Record<string, unknown> => typeof value === "object" && value !== null
    ),
    contact: {
      ...base.contact,
      ...(input.contact ?? {})
    }
  };
}
