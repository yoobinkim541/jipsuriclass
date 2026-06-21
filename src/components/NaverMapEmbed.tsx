import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { MapPinned } from "lucide-react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

const naverPlaceEmbedUrl = "https://map.naver.com/p/entry/place/1406150223?placePath=%2Fhome";

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  // SSR/하이드레이션 일치를 위해 서버와 동일한 결정값(false=데스크탑)으로 시작하고,
  // 실제 뷰포트는 아래 useEffect가 마운트 후 갱신한다(초기화에서 window를 읽으면
  // 모바일 첫 렌더가 서버 HTML과 달라 하이드레이션 불일치가 난다).
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className="office-map-shell">
      {isMobile ? (
        <a className="office-map office-map-link-card office-map-mobile-link-card" href={business.mapUrl} target="_blank" rel="noreferrer" aria-label={`${title} 네이버 지도 열기`}>
          <span className="office-map-link-visual" aria-hidden="true">
            <MapPinned size={28} />
          </span>
          <div className="office-map-link-content">
            <strong>{title}</strong>
            <p>{address}</p>
            <p>모바일에서는 네이버 지도 앱 또는 브라우저로 여는 편이 가장 안정적입니다.</p>
          </div>
          <span className="office-map-link-action">
            네이버 지도 열기
            <ExternalLink size={16} />
          </span>
        </a>
      ) : (
        <div className="office-map office-map-embed-card" aria-label={`${title} 네이버 지도`}>
          <iframe
            className="office-map-frame"
            src={naverPlaceEmbedUrl}
            title={`${title} 네이버 지도`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="office-map-footer office-map-embed-footer">
            <small>{address}</small>
            <a href={business.mapUrl} target="_blank" rel="noreferrer">
              네이버 지도 열기
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
