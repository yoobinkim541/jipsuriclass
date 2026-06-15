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
    const live = await fetchFirstLiveImage(url.toString());
    if (!live) {
      throw new Error("No live image variant");
    }
    response.setHeader("Content-Type", live.contentType);
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
    response.status(200).send(live.body);
  } catch (error) {
    // 502로 응답해 <img> onError가 발동 → 클라이언트가 다음 후보 사진/기본 이미지로 폴백한다.
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.status(502).send("Image fetch failed");
  }
}

function isAllowedBlogImageHost(hostname: string) {
  return ALLOWED_IMAGE_HOSTS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

// type 파라미터가 없는 mblogthumb URL은 그대로면 404가 나므로 type=w966을 붙인 변형을 먼저 시도.
async function fetchFirstLiveImage(rawUrl: string): Promise<{ body: Buffer; contentType: string } | null> {
  const referers = ["https://blog.naver.com/", "https://m.blog.naver.com/"];
  for (const candidateUrl of buildImageUrlVariants(rawUrl)) {
    for (const referer of referers) {
      try {
        const upstream = await fetch(candidateUrl, {
          headers: {
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            Referer: referer,
            "User-Agent": "Mozilla/5.0"
          }
        });
        const contentType = upstream.headers.get("content-type") || "";
        if (upstream.ok && contentType.startsWith("image/")) {
          return { body: Buffer.from(await upstream.arrayBuffer()), contentType };
        }
      } catch {
        /* 다음 변형/Referer로 재시도 */
      }
    }
  }
  return null;
}

function buildImageUrlVariants(rawUrl: string): string[] {
  const variants = new Set<string>();
  variants.add(withImageType(rawUrl));
  variants.add(rawUrl);
  return [...variants];
}

function withImageType(value: string) {
  try {
    const url = new URL(value);
    const isPstatic = /(?:^|\.)pstatic\.net$/i.test(url.hostname);
    const type = url.searchParams.get("type");
    if (type && /^w\d*(?:_?blur)?$/i.test(type)) {
      url.searchParams.set("type", "w966");
    } else if (!type && isPstatic) {
      // 썸네일 CDN은 type 파라미터가 없으면 이미지를 주지 않는다.
      url.searchParams.set("type", "w966");
    }
    return url.toString();
  } catch {
    return value;
  }
}
