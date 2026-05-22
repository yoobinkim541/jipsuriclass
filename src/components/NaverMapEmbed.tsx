import { useEffect, useRef, useState } from "react";
import { geocodeNaverAddress } from "../services/NaverMapsService";

type MapStatus = "loading" | "ready" | "error" | "missing-key";

type NaverMapEmbedProps = {
  address: string;
  title: string;
  onCoordinatesResolved?: (coordinates: { lat: number; lng: number }) => void;
};

type NaverMapWindow = Window & {
  naver?: {
    maps?: {
      Map: new (element: HTMLElement, options?: Record<string, unknown>) => any;
      Marker: new (options?: Record<string, unknown>) => any;
      LatLng: new (lat: number, lng: number) => any;
    };
  };
};

export function NaverMapEmbed({ address, title, onCoordinatesResolved }: NaverMapEmbedProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<unknown>(null);
  const markerInstance = useRef<unknown>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [message, setMessage] = useState("네이버 지도 불러오는 중");

  useEffect(() => {
    let active = true;

    async function bootstrapMap() {
      const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

      if (!clientId) {
        if (!active) return;
        setStatus("missing-key");
        setMessage("지도 API 키가 설정되지 않았습니다.");
        return;
      }

      try {
        const resolved = await geocodeNaverAddress(address);

        if (!active) return;

        onCoordinatesResolved?.(resolved);

        const naver = (window as NaverMapWindow).naver;
        const mapElement = mapRef.current;

        if (!naver?.maps || !mapElement) {
          throw new Error("Naver Maps runtime is unavailable.");
        }

        mapInstance.current = new naver.maps.Map(mapElement, {
          center: new naver.maps.LatLng(resolved.lat, resolved.lng),
          zoom: 16,
          scaleControl: false,
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: "TOP_RIGHT"
          }
        });

        markerInstance.current = new naver.maps.Marker({
          position: new naver.maps.LatLng(resolved.lat, resolved.lng),
          map: mapInstance.current,
          title
        });

        setStatus("ready");
        setMessage("");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "지도를 불러오지 못했습니다.");
      }
    }

    void bootstrapMap();

    return () => {
      active = false;
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [address, onCoordinatesResolved, title]);

  return (
    <div className="office-map-shell">
      <div className="office-map" aria-label="네이버 지도에서 사무실 위치">
        <div ref={mapRef} className="office-map-canvas" />
        <div className="office-map-overlay">
          <span className="office-label">NAVER MAP</span>
          <strong>{title}</strong>
          <p>{address}</p>
        </div>
        <div className="office-map-footer">
          <small>{status === "ready" ? "네이버 지도에서 위치를 확인할 수 있습니다." : message}</small>
        </div>
      </div>
    </div>
  );
}
