import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_LAT = 37.6522095;
const DEFAULT_LNG = 127.3007050;
const DEFAULT_WIDTH = 960;
const DEFAULT_HEIGHT = 640;
const DEFAULT_LEVEL = 16;

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildStaticMapRequestUrl(latitude: number, longitude: number, width: number, height: number, level: number) {
  const params = new URLSearchParams({
    center: `${longitude},${latitude}`,
    w: String(width),
    h: String(height),
    level: String(level),
    maptype: "basic",
    format: "png",
    scale: "2",
    markers: `type:d|size:mid|color:Red|pos:${longitude} ${latitude}`
  });

  return `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?${params.toString()}`;
}

function buildFallbackSvg(title: string, address: string) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const safeAddress = address.replace(/[<>&"]/g, "");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eef2f7" />
      <stop offset="100%" stop-color="#d9e3ee" />
    </linearGradient>
  </defs>
  <rect width="960" height="640" fill="url(#bg)" />
  <rect x="64" y="64" width="832" height="512" rx="24" fill="#ffffff" opacity="0.92" />
  <text x="112" y="160" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#0f172a">NAVER MAP</text>
  <text x="112" y="220" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#0f172a">${safeTitle}</text>
  <text x="112" y="290" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#334155">${safeAddress}</text>
  <text x="112" y="360" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#64748b">지도 이미지를 불러오지 못했습니다.</text>
  <text x="112" y="408" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#64748b">네이버 지도 열기 버튼으로 이동할 수 있습니다.</text>
  <circle cx="784" cy="244" r="78" fill="#0ea5e9" opacity="0.12" />
  <circle cx="784" cy="244" r="40" fill="#0ea5e9" opacity="0.28" />
</svg>`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  const title = String(request.query.title || "집수리클라쓰").trim();
  const address = String(request.query.address || "").trim();
  const latitude = toFiniteNumber(request.query.lat, DEFAULT_LAT);
  const longitude = toFiniteNumber(request.query.lng, DEFAULT_LNG);
  const width = Math.min(1024, Math.max(240, toFiniteNumber(request.query.w, DEFAULT_WIDTH)));
  const height = Math.min(1024, Math.max(240, toFiniteNumber(request.query.h, DEFAULT_HEIGHT)));
  const level = Math.min(20, Math.max(0, toFiniteNumber(request.query.level, DEFAULT_LEVEL)));

  if (!clientId || !clientSecret) {
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.status(200).send(buildFallbackSvg(title, address));
    return;
  }

  try {
    const upstream = await fetch(buildStaticMapRequestUrl(latitude, longitude, width, height, level), {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
        Accept: "image/png"
      }
    });

    if (!upstream.ok) {
      throw new Error(`Naver static map returned ${upstream.status}`);
    }

    const image = await upstream.arrayBuffer();
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "image/png");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800");
    response.status(200).send(Buffer.from(image));
  } catch (error) {
    response.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    response.status(200).send(buildFallbackSvg(title, address));
  }
}
