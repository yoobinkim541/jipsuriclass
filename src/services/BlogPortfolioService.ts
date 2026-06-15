import type { NaverBlogItem, PortfolioPost } from "../types";

type NaverBlogResponse = {
  items?: NaverBlogItem[];
};

type CacheEntry = {
  posts: PortfolioPost[];
  timestamp: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 네이버 블로그 연동의 단일 진입점입니다.
 * API 응답 정제, 실패 fallback, 표시용 날짜 포맷을 이 클래스 안에 묶어
 * UI 컴포넌트가 외부 데이터 형식에 직접 의존하지 않도록 합니다.
 * 24시간 localStorage 캐시로 매일 1회 자동 갱신됩니다.
 */
export class BlogPortfolioService {
  constructor(
    private readonly endpoint: string,
    private readonly fallbackPosts: PortfolioPost[],
    private readonly maxPosts = 8
  ) {}

  async loadLatestPortfolioPosts(): Promise<{ posts: PortfolioPost[]; source: "naver" | "fallback" }> {
    const result = await this.fetchFromApi("latest");
    if (result.source === "naver") {
      return result;
    }

    return this.fallbackResult();
  }

  /**
   * 블로그에 지금까지 작성된 모든 글을 가벼운 카드(썸네일+요약문)로 불러온다.
   * 전용 mode=all 응답이라 maxPosts 제한을 적용하지 않는다. 24시간 캐시.
   */
  async loadAllPortfolioPosts(): Promise<{ posts: PortfolioPost[]; source: "naver" | "fallback" }> {
    const cacheKey = "blog-cache:all";
    const cached = this.readCache(cacheKey);
    if (cached) {
      return { posts: cached, source: "naver" };
    }

    try {
      const url = new URL(this.endpoint, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      url.searchParams.set("mode", "all");

      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error("Naver blog endpoint unavailable");

      const data = (await response.json()) as NaverBlogResponse;
      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        return this.loadLatestPortfolioPosts();
      }

      const posts = items.map((item, index) => this.toPortfolioPost(item, index));
      this.writeCache(cacheKey, posts);
      return { source: "naver", posts };
    } catch {
      return this.fallbackResult();
    }
  }

  async loadPortfolioPosts(
    terms: string[] = [],
    categoryNos: number[] = []
  ): Promise<{ posts: PortfolioPost[]; source: "naver" | "fallback" }> {
    const cacheKey = this.buildCacheKey("matching", terms, categoryNos);
    const cached = this.readCache(cacheKey);
    if (cached) {
      return { posts: cached, source: "naver" };
    }

    const result = await this.fetchFromApi("matching", terms, categoryNos);
    if (result.source === "naver" && result.posts.length === 0) {
      return this.loadLatestPortfolioPosts();
    }

    if (result.source === "naver" && result.posts.length) {
      this.writeCache(cacheKey, result.posts);
    }
    return result;
  }

  private async fetchFromApi(
    mode: "latest" | "matching",
    terms?: string[],
    categoryNos?: number[]
  ): Promise<{ posts: PortfolioPost[]; source: "naver" | "fallback" }> {
    try {
      const url = new URL(this.endpoint, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      url.searchParams.set("mode", mode);
      if (Array.isArray(terms) && terms.length) {
        url.searchParams.set("terms", terms.join(","));
      }
      if (Array.isArray(categoryNos) && categoryNos.length) {
        url.searchParams.set("categoryNos", categoryNos.join(","));
      }

      const response = await fetch(url.toString(), { cache: "no-store" });
      if (!response.ok) throw new Error("Naver blog endpoint unavailable");

      const data = (await response.json()) as NaverBlogResponse;
      const naverItems = Array.isArray(data.items) ? data.items.slice(0, this.maxPosts) : [];
      if (!naverItems.length) {
        if (mode === "matching") {
          return { source: "naver", posts: [] };
        }

        return this.fallbackResult();
      }

      return {
        source: "naver",
        posts: naverItems.map((item, index) => this.toPortfolioPost(item, index))
      };
    } catch {
      return this.fallbackResult();
    }
  }

  private buildCacheKey(mode: "latest" | "matching", terms: string[] = [], categoryNos: number[] = []) {
    if (mode === "latest") {
      return "blog-cache:latest";
    }
    const normalizedTerms = terms.slice().sort().join(",");
    const normalizedCategories = categoryNos.slice().sort((left, right) => left - right).join(",");
    return `blog-cache:${normalizedTerms}|${normalizedCategories}`;
  }

  private readCache(key: string): PortfolioPost[] | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      return entry.posts;
    } catch {
      return null;
    }
  }

  private writeCache(key: string, posts: PortfolioPost[]) {
    try {
      const entry: CacheEntry = { posts, timestamp: Date.now() };
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore storage errors (quota exceeded, private mode, etc.)
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
      imageCandidates: Array.isArray(item.imageCandidates)
        ? item.imageCandidates.map((candidate) => this.normalizeImage(candidate)).filter((candidate): candidate is string => Boolean(candidate))
        : undefined,
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
