import type { NaverBlogItem, PortfolioPost } from "../types";

type NaverBlogResponse = {
  items?: NaverBlogItem[];
};

/**
 * 네이버 블로그 연동의 단일 진입점입니다.
 * API 응답 정제, 실패 fallback, 표시용 날짜 포맷을 이 클래스 안에 묶어
 * UI 컴포넌트가 외부 데이터 형식에 직접 의존하지 않도록 합니다.
 */
export class BlogPortfolioService {
  constructor(
    private readonly endpoint: string,
    private readonly fallbackPosts: PortfolioPost[],
    private readonly maxPosts = 6
  ) {}

  async loadPortfolioPosts(): Promise<{ posts: PortfolioPost[]; source: "naver" | "fallback" }> {
    try {
      const response = await fetch(this.endpoint);
      if (!response.ok) throw new Error("Naver blog endpoint unavailable");

      const data = (await response.json()) as NaverBlogResponse;
      const naverItems = Array.isArray(data.items) ? data.items.slice(0, this.maxPosts) : [];
      if (!naverItems.length) return this.fallbackResult();

      return {
        source: "naver",
        posts: naverItems.map((item, index) => this.toPortfolioPost(item, index))
      };
    } catch {
      return this.fallbackResult();
    }
  }

  private fallbackResult() {
    return { source: "fallback" as const, posts: this.fallbackPosts };
  }

  private toPortfolioPost(item: NaverBlogItem, index: number): PortfolioPost {
    return {
      title: this.stripHtml(item.title),
      description: this.stripHtml(item.description),
      date: this.formatPostDate(item.postdate),
      link: item.link,
      image:
        this.normalizeImage(item.image) ??
        this.fallbackPosts[index % this.fallbackPosts.length]?.image ??
        this.fallbackPosts[0]?.image ??
        "/assets/consult-hero.png",
      cardTitle: item.cardTitle ? this.stripHtml(item.cardTitle) : undefined,
      summary: Array.isArray(item.summary) ? item.summary.map((line) => this.stripHtml(line)).filter(Boolean) : undefined,
      keywords: Array.isArray(item.keywords) ? item.keywords.map((keyword) => this.stripHtml(keyword)).filter(Boolean) : undefined
    };
  }

  private normalizeImage(value?: string) {
    const image = typeof value === "string" ? value.trim() : "";
    return image || undefined;
  }

  private stripHtml(value: string) {
    return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  }

  private formatPostDate(value?: string) {
    if (!value || value.length !== 8) return "네이버 블로그";
    return `${value.slice(0, 4)}.${value.slice(4, 6)}.${value.slice(6)}`;
  }
}
