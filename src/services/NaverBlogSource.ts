import type { NaverBlogItem } from "../types";

export type NaverBlogSourceOptions = {
  blogId: string;
  terms?: string[];
  categoryNos?: number[];
  limit?: number;
};

type RankedBlogCandidate = {
  item: NaverBlogItem;
  sources: Set<"rss" | "category">;
};

const RSS_FETCH_LIMIT = 30;
const CATEGORY_FETCH_LIMIT = 30;

export async function loadNaverBlogCandidates({
  blogId,
  terms = [],
  categoryNos = [],
  limit = 6
}: NaverBlogSourceOptions): Promise<NaverBlogItem[]> {
  const candidates = new Map<string, RankedBlogCandidate>();

  const rssItems = await fetchRssItems(blogId);
  for (const item of rssItems) {
    addCandidate(candidates, item, "rss");
  }

  if (categoryNos.length) {
    const categoryItems = await fetchCategoryItems(blogId, categoryNos);
    for (const item of categoryItems) {
      addCandidate(candidates, item, "category");
    }
  }

  const ranked = rankCandidates([...candidates.values()], terms, false);
  return ranked.slice(0, limit).map((entry) => entry.item);
}

function addCandidate(
  map: Map<string, RankedBlogCandidate>,
  item: NaverBlogItem,
  source: "rss" | "category"
) {
  const key = item.link.trim();
  if (!key) return;

  const existing = map.get(key);
  if (existing) {
    existing.item = mergeCandidateItem(existing.item, item);
    existing.sources.add(source);
    return;
  }

  map.set(key, {
    item: { ...item },
    sources: new Set([source])
  });
}

function mergeCandidateItem(existing: NaverBlogItem, incoming: NaverBlogItem) {
  return {
    ...incoming,
    title: incoming.title || existing.title,
    description: incoming.description || existing.description,
    link: incoming.link || existing.link,
    postdate: incoming.postdate || existing.postdate,
    image: incoming.image || existing.image
  };
}

function rankCandidates(
  candidates: RankedBlogCandidate[],
  terms: string[],
  allowUnmatched: boolean
) {
  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreCandidate(candidate.item, candidate.sources, terms, allowUnmatched)
  }));

  const pool = allowUnmatched || !terms.length ? scored : scored.filter((entry) => entry.score > 0);

  return pool
    .sort((left, right) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff) return scoreDiff;
      return parseDateValue(right.candidate.item.postdate) - parseDateValue(left.candidate.item.postdate);
    })
    .map((entry) => entry.candidate);
}

function scoreCandidate(
  item: NaverBlogItem,
  sources: Set<"rss" | "category">,
  terms: string[],
  allowUnmatched: boolean
) {
  const title = sanitizeText(item.title).toLowerCase();
  const description = sanitizeText(item.description).toLowerCase();
  const combined = `${title} ${description}`;
  const baseScore = getSourcePriority(sources) * 1000 + parseDateValue(item.postdate) / 1_000_000;

  if (!terms.length) {
    return baseScore;
  }

  let score = 0;
  for (const term of terms) {
    const normalized = term.toLowerCase();
    if (!normalized) continue;

    const titleHit = title.includes(normalized);
    const descriptionHit = description.includes(normalized);
    if (!titleHit && !descriptionHit) continue;

    if (titleHit) score += 14;
    if (descriptionHit) score += 8;
    if (combined.includes(normalized)) score += 4;
  }

  if (!score && !allowUnmatched) {
    return 0;
  }

  return baseScore + score;
}

function getSourcePriority(sources: Set<"rss" | "category">) {
  if (sources.has("category")) return 2;
  if (sources.has("rss")) return 1;
  return 0;
}

async function fetchRssItems(blogId: string) {
  try {
    const response = await fetch(`https://rss.blog.naver.com/${blogId}.xml`, {
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Naver RSS returned ${response.status}`);
    }

    return parseRssItems(await response.text()).slice(0, RSS_FETCH_LIMIT);
  } catch {
    return [];
  }
}

async function fetchCategoryItems(blogId: string, categoryNos: number[]) {
  const uniqueCategoryNos = [...new Set(categoryNos.filter((value) => Number.isInteger(value) && value > 0))];
  const results: NaverBlogItem[] = [];

  for (const categoryNo of uniqueCategoryNos) {
    const categoryHtml = await fetchCategoryHtml(blogId, categoryNo);
    const logNos = extractCategoryLogNos(categoryHtml).slice(0, CATEGORY_FETCH_LIMIT);
    if (!logNos.length) continue;

    const posts = await Promise.all(
      logNos.map(async (logNo) => {
        const postUrl = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
        return await loadBlogPost(postUrl);
      })
    );

    for (const post of posts) {
      if (post.title && post.link) {
        results.push(post);
      }
    }
  }

  return results;
}

async function fetchCategoryHtml(blogId: string, categoryNo: number) {
  const response = await fetch(`https://blog.naver.com/PostList.naver?blogId=${blogId}&from=postList&categoryNo=${categoryNo}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`Naver category returned ${response.status}`);
  }

  return await response.text();
}

function extractCategoryLogNos(html: string) {
  return [...new Set([...html.matchAll(/&logNo=(\d{9,})/g)].map((match) => match[1]))];
}

async function loadBlogPost(link: string) {
  try {
    const response = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return {} as NaverBlogItem;
    }

    const html = await response.text();
    const title = decodeHtml(extractMetaContent(html, "og:title"));
    const description = stripHtml(decodeHtml(extractMetaContent(html, "og:description")));
    const image = pickBestBlogImage(extractImageCandidates(html));
    const postdate = formatPostDate(extractPostDate(html));

    return {
      title,
      description,
      link,
      postdate,
      image
    };
  } catch {
    return {} as NaverBlogItem;
  }
}

function parseRssItems(xml: string): NaverBlogItem[] {
  const items: NaverBlogItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml))) {
    const itemXml = match[1];
    const title = decodeXml(extractTagValue(itemXml, "title"));
    const descriptionHtml = decodeXml(extractTagValue(itemXml, "description"));
    const description = stripHtml(descriptionHtml);
    const link = decodeXml(extractTagValue(itemXml, "link"));
    const pubDate = extractTagValue(itemXml, "pubDate");
    const postdate = formatRssDate(pubDate);
    const image = extractRssImage(itemXml, descriptionHtml);

    if (!title || !link) continue;

    items.push({ title, description, link, postdate, image });
  }

  return items;
}

function extractRssImage(itemXml: string, descriptionHtml: string) {
  const candidates = [
    extractAttributeValue(itemXml, /<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i),
    extractAttributeValue(itemXml, /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i),
    ...extractInlineImageCandidates(descriptionHtml),
    ...extractInlineImageCandidates(itemXml)
  ].filter((url): url is string => Boolean(url));

  return pickBestBlogImage(candidates);
}

function extractImageCandidates(html: string) {
  const candidates = new Set<string>();
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
    /<article[\s\S]*?<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi,
    /<div[^>]+class=["'][^"']*(?:post|content|se-container)[^"']*["'][\s\S]*?<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi,
    /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const url = upgradeNaverBlogImageUrl(decodeHtml(match[1]));
      if (!isLikelyBlogImage(url)) continue;
      candidates.add(url);
    }
  }

  return Array.from(candidates);
}

function extractInlineImageCandidates(source: string) {
  const candidates: string[] = [];
  const pattern = /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source))) {
    const url = upgradeNaverBlogImageUrl(decodeHtml(match[1]));
    if (isLikelyBlogImage(url)) candidates.push(url);
  }

  return candidates;
}

function extractPostDate(html: string) {
  const match = html.match(/se_publishDate[^>]*>([\d. :]+)</i);
  return match?.[1]?.trim() ?? "";
}

function extractTagValue(xml: string, tag: string) {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function extractAttributeValue(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : undefined;
}

function extractMetaContent(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escapeRegExp(property)}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function extractTagValueFromHtml(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function formatRssDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatPostDate(value: string) {
  const match = value.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (!match) return undefined;
  return `${match[1]}${match[2].padStart(2, "0")}${match[3].padStart(2, "0")}`;
}

function parseDateValue(value?: string) {
  if (!value || value.length !== 8) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function decodeHtml(value: string) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function sanitizeText(value: string) {
  return decodeHtml(String(value ?? ""))
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestBlogImage(candidates: string[]) {
  return candidates
    .map((url) => upgradeNaverBlogImageUrl(url))
    .filter((url): url is string => Boolean(url))
    .sort((left, right) => scoreBlogImage(right) - scoreBlogImage(left))
    .find((url) => !isLikelyPlaceholderImage(url));
}

function isLikelyBlogImage(url: string) {
  return !/blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url) && /^https?:\/\//i.test(url);
}

function isLikelyPlaceholderImage(url: string) {
  return /blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url);
}

function scoreBlogImage(url: string) {
  const normalized = url.toLowerCase();
  let score = 0;

  if (normalized.includes("postfiles.pstatic.net") || normalized.includes("blogfiles.pstatic.net")) score += 40;
  if (normalized.includes("mblogthumb-phinf.pstatic.net")) score += 20;
  if (/type=w(966|1200|1280|1600)/i.test(normalized)) score += 30;
  if (/type=w\d+/i.test(normalized)) score += 18;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)) score += 8;
  if (/thumb|logo|profile|icon|emoji/i.test(normalized)) score -= 50;

  return score;
}

function upgradeNaverBlogImageUrl(value: string) {
  const image = value.trim();
  if (!image) return "";

  try {
    const url = new URL(image.startsWith("//") ? `https:${image}` : image);
    if (!isLikelyBlogImage(url.toString())) return url.toString();

    const type = url.searchParams.get("type");
    if (type && /^w\d*(?:_?blur)?$/i.test(type)) {
      url.searchParams.set("type", "w966");
    }

    return url.toString();
  } catch {
    return image;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
