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
  } catch (error) {
    response.status(502).json({ items: [], source: "fallback", reason: String(error) });
  }
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
