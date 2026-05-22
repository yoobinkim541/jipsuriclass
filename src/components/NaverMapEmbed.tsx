import { Phone } from "lucide-react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

function buildStaticMapUrl() {
  const lat = Number(import.meta.env.VITE_NAVER_MAP_LAT ?? "37.6522095");
  const lng = Number(import.meta.env.VITE_NAVER_MAP_LNG ?? "127.3007050");
  const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;
  const query = new URLSearchParams({
    w: "960",
    h: "540",
    center: `${lng},${lat}`,
    level: "16",
    ...(clientId ? { "X-NCP-APIGW-API-KEY-ID": clientId } : {})
  });

  return `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster-cors?${query.toString()}`;
}

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  const staticMapUrl = buildStaticMapUrl();

  return (
    <div className="office-map-shell">
      <div className="office-map" aria-label="네이버 지도에서 사무실 위치">
        <img className="office-map-image" src={staticMapUrl} alt={`${title} 지도`} loading="lazy" />
        <div className="office-map-overlay">
          <span className="office-label">NAVER MAP</span>
          <strong>{title}</strong>
          <p>{address}</p>
          <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
            <Phone size={18} />
            네이버 지도 열기
          </a>
        </div>
        <div className="office-map-footer">
          <small>네이버 지도에서 위치를 확인할 수 있습니다.</small>
        </div>
      </div>
    </div>
  );
}
