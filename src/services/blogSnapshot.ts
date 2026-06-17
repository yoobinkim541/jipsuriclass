import type { NaverBlogItem } from "../types";

// 블로그 스냅샷은 site_content(id="blog-snapshot")에 한 행 jsonb로 저장된다.
// 원본 mode=all은 글이 많아(현재 1000+개) 직렬화 본문이 Supabase 요청 본문 한도(~1MB, 바이트)를
// 넘으면 게이트웨이가 본문을 잘라 PostgREST가 PGRST102("Empty or invalid json", 400)를 낸다.
// 그래서 표시(BlogPortfolioService)에 쓰는 필드만 남기고, 가장 무거운 imageCandidates는 저장하지
// 않으며(폴백 카드 이미지는 image로 충분) description은 요약 길이로 자른다.
// 동기화 경로 두 곳(서버 cron `api/sync-blog-snapshot`, 관리자 수동 동기화 버튼)이 공용으로 쓴다.
export const SNAPSHOT_DESC_MAX = 100;

export function slimBlogSnapshotItems(items: readonly unknown[]): NaverBlogItem[] {
  return items.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const description = typeof item.description === "string" ? item.description : "";
    const slim: Record<string, unknown> = {
      title: typeof item.title === "string" ? item.title : "",
      description: description.length > SNAPSHOT_DESC_MAX ? description.slice(0, SNAPSHOT_DESC_MAX) : description,
      link: typeof item.link === "string" ? item.link : ""
    };
    if (item.postdate) slim.postdate = item.postdate;
    if (item.image) slim.image = item.image;
    if (item.cardTitle) slim.cardTitle = item.cardTitle;
    if (Array.isArray(item.summary)) slim.summary = item.summary;
    if (Array.isArray(item.keywords)) slim.keywords = item.keywords;
    if (typeof item.popularity === "number") slim.popularity = item.popularity;
    return slim as NaverBlogItem;
  });
}
