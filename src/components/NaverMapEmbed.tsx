import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

const naverPlaceEmbedUrl = "https://map.naver.com/p/entry/place/1406150223?placePath=%2Fhome";

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 720 : false));

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // 모바일·태블릿(≤720px)에서는 지도 임베드가 불안정한 데다, 옆의 사무실 카드에 이미 주소와
  // '네이버 지도 열기' 버튼이 있어 폴백 카드가 중복이므로 지도 영역을 아예 표시하지 않는다.
  if (isMobile) return null;

  return (
    <div className="office-map-shell">
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
    </div>
  );
}
