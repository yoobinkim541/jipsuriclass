import { useEffect, useRef, useState } from "react";
import { business } from "../data";
import { loadNaverMapsSdk } from "../services/NaverMapsService";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

type NaverMapWindow = Window & {
  naver?: {
    maps?: {
      Map: new (element: HTMLElement, options?: Record<string, unknown>) => unknown;
      Marker: new (options?: Record<string, unknown>) => unknown;
      LatLng: new (lat: number, lng: number) => unknown;
      Event?: {
        addListener: (target: unknown, eventName: string, listener: () => void) => unknown;
      };
    };
  };
};

const FALLBACK_COORDS = {
  lat: 37.6522095,
  lng: 127.3007050
};

function resolveCoordinate(value: unknown, fallback: number) {
  const parsed = typeof value === "string" || typeof value === "number" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveClientId() {
  return (import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined)?.trim() || "k8fza5djz9";
}

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<unknown>(null);
  const markerInstance = useRef<unknown>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const latitude = resolveCoordinate(import.meta.env.VITE_NAVER_MAP_LAT, FALLBACK_COORDS.lat);
  const longitude = resolveCoordinate(import.meta.env.VITE_NAVER_MAP_LNG, FALLBACK_COORDS.lng);

  useEffect(() => {
    let active = true;

    async function bootstrapMap() {
      const clientId = resolveClientId();

      try {
        await loadNaverMapsSdk(clientId);
        if (!active) return;

        const naver = (window as NaverMapWindow).naver;
        const mapElement = mapRef.current;

        if (!naver?.maps || !mapElement) {
          throw new Error("Naver Maps runtime is unavailable.");
        }

        const center = new naver.maps.LatLng(latitude, longitude);

        mapInstance.current = new naver.maps.Map(mapElement, {
          center,
          zoom: 16,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: "TOP_RIGHT"
          }
        });

        markerInstance.current = new naver.maps.Marker({
          position: center,
          map: mapInstance.current,
          title
        });

        setStatus("ready");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        if (import.meta.env.DEV) {
          console.error(error);
        }
      }
    }

    void bootstrapMap();

    return () => {
      active = false;
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [latitude, longitude, title]);

  return (
    <div className="office-map-shell">
      <div className="office-map office-map-canvas" aria-label={`${title} 네이버 지도`}>
        {status !== "error" ? (
          <div ref={mapRef} className="office-map-image office-map-live" />
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
        {status === "ready" ? (
          <>
            <div className="office-map-overlay">
              <span className="office-label">사무실 위치</span>
              <strong>{title}</strong>
              <p>{address}</p>
            </div>
            <div className="office-map-footer">
              <small>지도를 움직여 사무실 위치를 확인할 수 있습니다.</small>
            </div>
          </>
        ) : null}
      </div>
      <div className="office-actions">
        <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
          네이버 지도 열기
        </a>
      </div>
    </div>
  );
}
