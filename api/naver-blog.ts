import type { VercelRequest, VercelResponse } from "@vercel/node";

type NaverBlogItem = {
  title: string;
  description: string;
  link: string;
  postdate?: string;
  image?: string;
};

/**
 * Production serverless endpoint for Naver Blog portfolio cards.
 * Keeps NAVER_CLIENT_SECRET off the browser and returns the same shape as the local Vite dev proxy.
 */
export default async function handler(_request: VercelRequest, response: VercelResponse) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const blogId = process.env.NAVER_BLOG_ID || "it77khy";

  if (!clientId || !clientSecret) {
    response.status(503).json({ items: [], source: "fallback", reason: "missing_naver_credentials" });
    return;
  }

  try {
    const rssResponse = await fetch(`https://rss.blog.naver.com/${blogId}.xml`, {
      headers: {
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8"
      }
    });

    if (!rssResponse.ok) {
      throw new Error(`Naver RSS returned ${rssResponse.status}`);
    }

    const rssXml = await rssResponse.text();
    const items = parseRssItems(rssXml).slice(0, 6);
    const enrichedItems = await Promise.all(items.map(async (item) => ({ ...item, image: await resolveBlogImage(item.link) })));
    response.status(200).json({ items: enrichedItems, source: "naver" });
  } catch (error) {
    try {
      const query = encodeURIComponent(`${blogId} 집수리 누수 복구`);
      const naverResponse = await fetch(
        `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=6&sort=date`,
        {
          headers: {
            "X-Naver-Client-Id": clientId,
            "X-Naver-Client-Secret": clientSecret
          }
        }
      );

      if (!naverResponse.ok) {
        throw new Error(`Naver API returned ${naverResponse.status}`);
      }

      const data = (await naverResponse.json()) as { items?: NaverBlogItem[] };
      const items = Array.isArray(data.items) ? data.items.slice(0, 6) : [];
      const enrichedItems = await Promise.all(items.map(async (item) => ({ ...item, image: await resolveBlogImage(item.link) })));
      response.status(200).json({ items: enrichedItems, source: "naver" });
    } catch (fallbackError) {
      response.status(502).json({ items: [], source: "fallback", reason: String(error ?? fallbackError) });
    }
  }
}

function parseRssItems(xml: string): NaverBlogItem[] {
  const items: NaverBlogItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml))) {
    const itemXml = match[1];
    const title = decodeXml(extractTagValue(itemXml, "title"));
    const description = decodeXml(extractTagValue(itemXml, "description"));
    const link = decodeXml(extractTagValue(itemXml, "link"));
    const pubDate = extractTagValue(itemXml, "pubDate");
    const postdate = formatRssDate(pubDate);

    if (!title || !link) continue;

    items.push({ title, description, link, postdate });
  }

  return items;
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

function formatRssDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const year = String(parsed.getFullYear());
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

async function resolveBlogImage(link: string) {
  try {
    const blogResponse = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!blogResponse.ok) return undefined;

    const html = await blogResponse.text();
    return pickBestBlogImage(extractImageCandidates(html));
  } catch {
    return undefined;
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
      const url = decodeHtml(match[1]);
      if (!isLikelyBlogImage(url)) continue;
      candidates.add(url);
    }
  }

  return Array.from(candidates);
}

function pickBestBlogImage(candidates: string[]) {
  return candidates.find((url) => !isLikelyPlaceholderImage(url)) ?? candidates[0];
}

function isLikelyBlogImage(url: string) {
  return (
    !/blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url) &&
    /^https?:\/\//i.test(url)
  );
}

function isLikelyPlaceholderImage(url: string) {
  return /blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url);
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
