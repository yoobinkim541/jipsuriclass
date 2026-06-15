import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_IMAGE_HOSTS = ["pstatic.net", "naver.net", "naver.com"];

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
    // 사이즈 업스케일(type=w966) 변형을 먼저 시도하고, 실패하면 원본 URL로 재시도한다.
    const upgradedUrl = upgradeNaverBlogImageUrl(url.toString());
    const attempts = upgradedUrl === url.toString() ? [upgradedUrl] : [upgradedUrl, url.toString()];

    let upstream: Response | null = null;
    for (const attempt of attempts) {
      const candidate = await fetch(attempt, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: "https://blog.naver.com/",
          "User-Agent": "Mozilla/5.0"
        }
      });
      if (candidate.ok && (candidate.headers.get("content-type") || "").startsWith("image/")) {
        upstream = candidate;
        break;
      }
    }

    if (!upstream) {
      throw new Error("No live image variant");
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();
    response.setHeader("Content-Type", contentType);
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
    response.status(200).send(Buffer.from(buffer));
  } catch (error) {
    // 502로 응답해 <img> onError가 발동 → 클라이언트가 다음 후보 사진/기본 이미지로 폴백한다.
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.status(502).send("Image fetch failed");
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
