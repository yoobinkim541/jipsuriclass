import type { VercelRequest, VercelResponse } from "@vercel/node";

const DEFAULT_LAT = 37.6522095;
const DEFAULT_LNG = 127.3007050;

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const clientId = process.env.NAVER_GEOCODE_CLIENT_ID || process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_GEOCODE_CLIENT_SECRET || process.env.NAVER_CLIENT_SECRET;
  const address = String(request.query.address || "").trim();

  if (!clientId || !clientSecret) {
    response.status(503).json({ error: "missing_naver_credentials" });
    return;
  }

  if (!address) {
    response.status(400).json({ error: "missing_address" });
    return;
  }

  try {
    const naverResponse = await fetch(`https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
        Accept: "application/json"
      }
    });

    if (!naverResponse.ok) {
      throw new Error(`Naver geocode returned ${naverResponse.status}`);
    }

    const data = (await naverResponse.json()) as { addresses?: Array<{ x?: string; y?: string }> };
    const firstAddress = Array.isArray(data.addresses) ? data.addresses[0] : undefined;
    const lat = Number(firstAddress?.y);
    const lng = Number(firstAddress?.x);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      response.status(200).json({
        lat: DEFAULT_LAT,
        lng: DEFAULT_LNG,
        source: "fallback"
      });
      return;
    }

    response.status(200).json({ lat, lng });
  } catch (error) {
    response.status(200).json({
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      source: "fallback",
      error: String(error)
    });
  }
}
