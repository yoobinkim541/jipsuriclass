import { useMemo, useState } from "react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

const FALLBACK_COORDS = {
  lat: 37.6522095,
  lng: 127.3007050
};

function resolveCoordinate(value: unknown, fallback: number) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  const [hasError, setHasError] = useState(false);
  const latitude = resolveCoordinate(import.meta.env.VITE_NAVER_MAP_LAT, FALLBACK_COORDS.lat);
  const longitude = resolveCoordinate(import.meta.env.VITE_NAVER_MAP_LNG, FALLBACK_COORDS.lng);

  const mapSrc = useMemo(() => {
    const params = new URLSearchParams({
      title,
      address,
      lat: String(latitude),
      lng: String(longitude),
      w: "960",
      h: "640",
      level: "16"
    });

    return `/api/naver-static-map?${params.toString()}`;
  }, [address, latitude, longitude, title]);

  return (
    <div className="office-map-shell">
      <div className="office-map office-map-canvas">
        {!hasError ? (
          <a href={business.mapUrl} target="_blank" rel="noreferrer" aria-label={`${title} 네이버 지도 열기`}>
            <img
              className="office-map-image"
              src={mapSrc}
              alt={`${title} 위치 지도`}
              loading="lazy"
              onError={() => setHasError(true)}
            />
          </a>
        ) : (
          <div className="office-map-fallback">
            <span className="office-label">지도 미리보기</span>
            <h3>{title}</h3>
            <p>{address}</p>
            <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
              네이버 지도 열기
            </a>
          </div>
        )}
        <div className="office-map-overlay">
          <span className="office-label">사무실 위치</span>
          <strong>{title}</strong>
          <p>{address}</p>
        </div>
        <div className="office-map-footer">
          <small>이미지를 누르면 네이버 지도에서 위치를 확인할 수 있습니다.</small>
        </div>
      </div>
      <div className="office-actions">
        <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
          네이버 지도 열기
        </a>
      </div>
    </div>
  );
}
