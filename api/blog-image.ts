import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_IMAGE_HOSTS = ["pstatic.net", "naver.net", "naver.com"];
const FALLBACK_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="블로그 이미지 미리보기">
  <rect width="1200" height="800" fill="#eef2f7" />
  <rect x="72" y="72" width="1056" height="656" rx="28" fill="#ffffff" opacity="0.9" />
  <text x="120" y="180" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700" fill="#0f172a">NAVER BLOG PHOTO</text>
  <text x="120" y="252" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#334155">이미지를 불러오는 중 문제가 발생했습니다.</text>
  <text x="120" y="302" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#334155">원본 블로그 사진이 있으면 그 경로를 프록시합니다.</text>
  <circle cx="920" cy="264" r="92" fill="#0ea5e9" opacity="0.12" />
  <circle cx="920" cy="264" r="52" fill="#0ea5e9" opacity="0.25" />
</svg>`;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const rawUrl = String(request.query.url || "").trim();

  if (!rawUrl) {
    response.status(400).setHeader("Content-Type", "text/plain; charset=utf-8").send("Missing image url");
    return;
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    response.status(400).setHeader("Content-Type", "text/plain; charset=utf-8").send("Invalid image url");
    return;
  }

  if (!isAllowedBlogImageHost(url.hostname) || (url.protocol !== "http:" && url.protocol !== "https:")) {
    response.status(403).setHeader("Content-Type", "text/plain; charset=utf-8").send("Image host is not allowed");
    return;
  }

  try {
    const upgradedUrl = upgradeNaverBlogImageUrl(url.toString());
    const upstream = await fetch(upgradedUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://blog.naver.com/",
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!upstream.ok) {
      throw new Error(`Upstream image returned ${upstream.status}`);
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    const buffer = await upstream.arrayBuffer();
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
    response.status(200).send(Buffer.from(buffer));
  } catch (error) {
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(FALLBACK_SVG);
  }
}

function isAllowedBlogImageHost(hostname: string) {
  return ALLOWED_IMAGE_HOSTS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function upgradeNaverBlogImageUrl(value: string) {
  try {
    const url = new URL(value);
    const type = url.searchParams.get("type");
    if (type && /^w\d*(?:_?blur)?$/i.test(type)) {
      url.searchParams.set("type", "w966");
    }
    return url.toString();
  } catch {
    return value;
  }
}
