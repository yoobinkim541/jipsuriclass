import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { business } from "../data";
import { geocodeNaverAddress, loadNaverMapsSdk } from "../services/NaverMapsService";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

type NaverMapsNamespace = {
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
  Marker: new (options: Record<string, unknown>) => unknown;
  Position?: { TOP_LEFT?: unknown };
  ZoomControlStyle?: { SMALL?: unknown };
};

type NaverMapsWindow = Window & {
  naver?: {
    maps?: NaverMapsNamespace;
  };
};

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  // SSR/하이드레이션 일치: 서버는 항상 false(데스크탑)로 렌더하므로 첫 클라 렌더도 false로 시작해야 한다.
  // 초기화에서 window.innerWidth를 읽으면 모바일 클라 첫 렌더가 true가 되어 `if (isMobile) return null`로
  // 서버(지도 렌더)와 클라(null)가 어긋나 서브트리 하이드레이션 불일치가 난다. 실제 뷰포트는 아래 useEffect가 반영.
  const [isMobile, setIsMobile] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      setMapStatus("unavailable");
      return;
    }

    let cancelled = false;
    setMapStatus("loading");

    Promise.all([loadNaverMapsSdk(clientId), geocodeNaverAddress(address)])
      .then(([, coords]) => {
        if (cancelled) return;

        const maps = (window as NaverMapsWindow).naver?.maps;
        const container = mapRef.current;
        if (!maps || !container) {
          throw new Error("Naver Maps SDK is unavailable.");
        }

        const center = new maps.LatLng(coords.lat, coords.lng);
        const map = new maps.Map(container, {
          center,
          zoom: 16,
          zoomControl: true,
          zoomControlOptions: {
            position: maps.Position?.TOP_LEFT,
            style: maps.ZoomControlStyle?.SMALL
          }
        });

        new maps.Marker({
          position: center,
          map,
          title
        });

        setMapStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setMapStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [address, isMobile, title]);

  // 모바일·태블릿(≤720px)에서는 지도 임베드가 불안정한 데다, 옆의 사무실 카드에 이미 주소와
  // '네이버 지도 열기' 버튼이 있어 폴백 카드가 중복이므로 지도 영역을 아예 표시하지 않는다.
  if (isMobile) return null;

  return (
    <div className="office-map-shell">
      <div className="office-map office-map-embed-card" aria-label={`${title} 네이버 지도`}>
        <div className="office-map-stage">
          <div className="office-map-live" ref={mapRef} role="img" aria-label={`${title} 위치 지도`} />
          {mapStatus !== "ready" ? (
            <div className="office-map-fallback office-map-status" aria-live="polite">
              <strong>{mapStatus === "loading" ? "지도를 불러오는 중입니다" : "지도를 바로 열어 확인해 주세요"}</strong>
              <p>{address}</p>
              <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
                네이버 지도 열기
                <ExternalLink size={16} />
              </a>
            </div>
          ) : null}
        </div>
        <div className="office-map-footer office-map-embed-footer">
          <small>{address}</small>
          <a href={business.mapUrl} target="_blank" rel="noreferrer">
            네이버 지도 열기
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
