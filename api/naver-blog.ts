import type { VercelRequest, VercelResponse } from "@vercel/node";

type NaverBlogItem = {
  title: string;
  description: string;
  link: string;
  postdate?: string;
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
    response.status(200).json({ items: data.items ?? [], source: "naver" });
  } catch (error) {
    response.status(502).json({ items: [], source: "fallback", reason: String(error) });
  }
}
