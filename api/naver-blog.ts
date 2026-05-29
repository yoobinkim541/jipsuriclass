import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadNaverBlogCandidates } from "../src/services/NaverBlogSource";

type NaverBlogItem = {
  title: string;
  description: string;
  link: string;
  postdate?: string;
  image?: string;
  cardTitle?: string;
  summary?: string[];
  keywords?: string[];
};

type BlogSummary = {
  index: number;
  cardTitle: string;
  summary: string[];
  keywords: string[];
};

type GeminiSummaryResponse = {
  posts?: BlogSummary[];
};

type EnrichedBlogItem = NaverBlogItem & {
  index: number;
  contentText?: string;
};

const PORTFOLIO_LIMIT = 8;
const RSS_FETCH_LIMIT = 30;
const FALLBACK_BLOG_IMAGE = "/assets/consult-hero.png";
const ALLOWED_IMAGE_HOSTS = ["pstatic.net", "naver.net", "naver.com"];

/**
 * Production serverless endpoint for Naver Blog portfolio cards.
 * Keeps NAVER_CLIENT_SECRET off the browser and returns the same shape as the local Vite dev proxy.
 */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const blogId = process.env.NAVER_BLOG_ID || "it77khy";
  const mode = parseMode(_request.query.mode);
  const terms = parseTerms(_request.query.terms);
  const categoryNos = parseCategoryNos(_request.query.categoryNos);

  try {
    const latestMode = mode === "latest";
    const items = await loadLatestBlogItems(
      blogId,
      latestMode ? [] : terms,
      latestMode ? [] : categoryNos,
      latestMode
    );
    response.setHeader(
      "Cache-Control",
      latestMode
        ? "no-store"
        : "s-maxage=86400, stale-while-revalidate=86400"
    );
    response.status(200).json({ items, source: "naver" });
  } catch (error) {
    response.status(502).json({ items: [], source: "fallback", reason: String(error) });
  }
}

function parseMode(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value ?? "";
  return raw === "latest" ? "latest" : "matching";
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

type RankedBlogCandidate = {
  item: NaverBlogItem;
  sources: Set<"rss" | "search-date" | "search-sim">;
};

function parseTerms(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw
    .split(/[,\s]+/)
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseCategoryNos(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw
    .split(/[,\s]+/)
    .map((term) => Number.parseInt(term.trim(), 10))
    .filter((term): term is number => Number.isInteger(term) && term > 0)
    .slice(0, 8);
}

async function loadLatestBlogItems(blogId: string, terms: string[], categoryNos: number[], latestMode: boolean) {
  try {
    return await loadNaverBlogCandidates({ blogId, terms, categoryNos, limit: PORTFOLIO_LIMIT });
  } catch {
    if (latestMode || !categoryNos.length) {
      return [];
    }

    return await loadNaverBlogCandidates({ blogId, terms, categoryNos: [], limit: PORTFOLIO_LIMIT });
  }
}


function addRankedCandidate(
  map: Map<string, RankedBlogCandidate>,
  item: NaverBlogItem,
  source: "rss" | "search-date" | "search-sim"
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
    postdate: incoming.postdate || existing.postdate,
    image: incoming.image || existing.image,
    cardTitle: incoming.cardTitle || existing.cardTitle,
    summary: incoming.summary?.length ? incoming.summary : existing.summary,
    keywords: incoming.keywords?.length ? incoming.keywords : existing.keywords
  };
}

function rankCandidates(candidates: RankedBlogCandidate[], terms: string[]) {
  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreCandidate(candidate.item, candidate.sources, terms)
  }));

  // When search terms are provided, only return posts that actually match.
  // Never fall back to unrelated posts — returning empty is better than wrong content.
  const pool = terms.length ? scored.filter((entry) => entry.score > 0) : scored;

  return pool
    .sort((left, right) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff) return scoreDiff;
      return parseDateValue(right.candidate.item.postdate) - parseDateValue(left.candidate.item.postdate);
    })
    .map((entry) => entry.candidate);
}

function scoreCandidate(item: NaverBlogItem, sources: Set<"rss" | "search-date" | "search-sim">, terms: string[]) {
  const title = sanitizeText(item.title).toLowerCase();
  const description = sanitizeText(item.description).toLowerCase();
  const combined = `${title} ${description}`;

  if (!terms.length) {
    return getSourcePriority(sources) * 1000 + parseDateValue(item.postdate) / 1_000_000;
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

  score += getSourcePriority(sources) * 6;
  return score;
}

function getSourcePriority(sources: Set<"rss" | "search-date" | "search-sim">) {
  if (sources.has("rss")) return 1;
  return 0;
}

function parseDateValue(value?: string) {
  if (!value || value.length !== 8) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extractTagValue(xml: string, tag: string) {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(pattern);
  return match?.[1]?.trim() ?? "";
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

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatRssDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function enrichItemsWithSummary(items: NaverBlogItem[], blogId: string) {
  const preparedItems = await Promise.all(
    items.map(async (item, index) => {
      const page = await loadBlogPage(item.link);
      return {
        ...item,
        index,
        image: normalizeImageUrl(page.image) ?? normalizeImageUrl(item.image) ?? FALLBACK_BLOG_IMAGE,
        contentText: page.text
      };
    })
  );

  const summaries = await summarizeItems(preparedItems);
  return preparedItems.map(({ contentText: _contentText, index, ...item }) => {
    const summary = summaries.get(index);
    return {
      ...item,
      cardTitle: summary?.cardTitle,
      summary: summary?.summary,
      keywords: summary?.keywords
    };
  });
}

async function loadBlogPage(link: string) {
  try {
    const blogResponse = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!blogResponse.ok) {
      return {};
    }

    const html = await blogResponse.text();
    return {
      image: pickBestBlogImage(extractImageCandidates(html)),
      text: extractReadableText(html)
    };
  } catch {
    return {};
  }
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

function extractRssImage(itemXml: string, descriptionHtml: string) {
  const candidates = [
    extractAttributeValue(itemXml, /<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i),
    extractAttributeValue(itemXml, /<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i),
    ...extractInlineImageCandidates(descriptionHtml),
    ...extractInlineImageCandidates(itemXml)
  ].filter((url): url is string => Boolean(url));

  return pickBestBlogImage(candidates);
}

function extractAttributeValue(source: string, pattern: RegExp) {
  const match = source.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : undefined;
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

function extractReadableText(html: string) {
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const target = articleMatch?.[0] ?? html;

  const text = decodeHtml(
    target
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(br|p|div|li|h[1-6]|tr|section|article|blockquote|figcaption|summary)[^>]*>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article|blockquote|figcaption|summary)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " ")
  )
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text.slice(0, 3200);
}

async function summarizeItems(items: EnrichedBlogItem[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_BLOG_SUMMARY_MODEL || "gemini-2.5-flash-lite";
  if (!apiKey || !items.length) return new Map<number, BlogSummary>();

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildSummarizationPrompt(items)
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.25,
          responseMimeType: "application/json",
          responseJsonSchema: buildSummarySchema(items.length)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini returned ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) {
      throw new Error("Gemini returned empty text");
    }

    const parsed = JSON.parse(text) as GeminiSummaryResponse;
    const summaries = new Map<number, BlogSummary>();
    for (const item of parsed.posts ?? []) {
      const normalized = normalizeSummary(item, items[item.index]);
      summaries.set(item.index, normalized);
    }
    return summaries;
  } catch {
    return new Map<number, BlogSummary>();
  }
}

function buildSummarySchema(length: number) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      posts: {
        type: "array",
        minItems: length,
        maxItems: length,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            index: { type: "integer" },
            cardTitle: { type: "string", description: "카드에 표시할 1줄 제목" },
            summary: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: { type: "string", description: "카드용 3줄 요약의 한 줄" }
            },
            keywords: {
              type: "array",
              minItems: 2,
              maxItems: 4,
              items: { type: "string", description: "짧은 핵심 키워드" }
            }
          },
          required: ["index", "cardTitle", "summary", "keywords"]
        }
      }
    },
    required: ["posts"]
  };
}

function buildSummarizationPrompt(items: EnrichedBlogItem[]) {
  const lines = [
    "너는 네이버 블로그 글을 카드형 포트폴리오로 편집하는 한국어 에디터다.",
    "각 글을 읽고 카드에 들어갈 1줄 제목, 3줄 요약, 키워드 2~4개를 JSON으로만 출력해라.",
    "반드시 입력된 순서와 index를 유지하고, 제공된 텍스트 안에서만 사실적으로 요약해라.",
    "광고성 표현, 감탄사, 과장, 홍보 문장은 금지한다.",
    "요약은 짧고 담백하게 3줄로 나누고, 각 줄은 가능한 50자 안팎으로 작성해라.",
    "키워드는 중복 없이 짧은 명사형으로 써라.",
    "",
    "입력 글:"
  ];

  for (const item of items) {
    lines.push(
      [
        `- index: ${item.index}`,
        `  title: ${cleanPromptValue(item.title)}`,
        `  description: ${cleanPromptValue(item.description)}`,
        `  article: ${cleanPromptValue(item.contentText ?? "")}`
      ].join("\n")
    );
  }

  return lines.join("\n");
}

function normalizeSummary(item: BlogSummary, source?: EnrichedBlogItem): BlogSummary {
  const summary = normalizeSummaryLines(item.summary, source);
  const keywords = normalizeKeywords(item.keywords, source);
  const cardTitle = sanitizeText(item.cardTitle) || source?.title || "";

  return {
    index: item.index,
    cardTitle,
    summary,
    keywords
  };
}

function normalizeSummaryLines(lines: string[], source?: EnrichedBlogItem) {
  const cleaned = (Array.isArray(lines) ? lines : [])
    .map((line) => sanitizeText(line))
    .filter(Boolean)
    .slice(0, 3);

  const fallbackPieces = buildFallbackSummaryPieces(source);
  while (cleaned.length < 3) {
    const next = fallbackPieces[cleaned.length] ?? source?.description ?? source?.title ?? "";
    cleaned.push(sanitizeText(next).slice(0, 90));
  }

  return cleaned.map((line) => line.slice(0, 70));
}

function normalizeKeywords(keywords: string[], source?: EnrichedBlogItem) {
  const cleaned = new Set<string>();
  for (const keyword of Array.isArray(keywords) ? keywords : []) {
    const value = sanitizeText(keyword).slice(0, 18);
    if (value) cleaned.add(value);
    if (cleaned.size >= 4) break;
  }

  if (!cleaned.size && source) {
    for (const keyword of buildFallbackKeywords(source)) {
      cleaned.add(keyword);
      if (cleaned.size >= 4) break;
    }
  }

  return Array.from(cleaned).slice(0, 4);
}

function buildFallbackSummaryPieces(source?: EnrichedBlogItem) {
  if (!source) return [];
  const title = sanitizeText(source.title);
  const description = sanitizeText(source.description);
  const content = sanitizeText(source.contentText ?? "");
  const sentences = splitSentences(`${description}. ${content}`.replace(/\s+/g, " ").trim());
  if (!sentences.length) return [title || "블로그 글 요약", description || "상세 내용을 확인해 주세요."];
  return [title || sentences[0], sentences[0], sentences[1] ?? description].filter(Boolean);
}

function buildFallbackKeywords(source: EnrichedBlogItem) {
  const raw = sanitizeText(`${source.title} ${source.description}`).toLowerCase();
  const words = raw
    .replace(/[^\w가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 2);

  const stopwords = new Set([
    "집수리",
    "블로그",
    "사례",
    "작업",
    "진행",
    "현장",
    "사진",
    "확인",
    "복구",
    "보수",
    "수리",
    "공사",
    "시공",
    "후",
    "전",
    "및"
  ]);

  const keywords = new Set<string>();
  for (const word of words) {
    if (stopwords.has(word)) continue;
    keywords.add(word);
    if (keywords.size >= 4) break;
  }

  if (!keywords.size) {
    keywords.add("현장");
    keywords.add("수리");
  }

  return Array.from(keywords).slice(0, 4);
}

function splitSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+|(?<=다)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function cleanPromptValue(value: string) {
  return sanitizeText(value).replace(/\s+/g, " ").trim().slice(0, 4000);
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

function normalizeImageUrl(value?: string) {
  const image = typeof value === "string" ? value.trim() : "";
  if (!image) return undefined;

  try {
    const normalized = image.startsWith("//") ? `https:${image}` : image;
    const url = new URL(normalized);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }

    if (!isAllowedBlogImageHost(url.hostname)) {
      return undefined;
    }

    const upgraded = upgradeNaverBlogImageUrl(url.toString());
    return `/api/blog-image?url=${encodeURIComponent(upgraded)}`;
  } catch {
    return undefined;
  }
}

function isAllowedBlogImageHost(hostname: string) {
  return ALLOWED_IMAGE_HOSTS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
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

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
