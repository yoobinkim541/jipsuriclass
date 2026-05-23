import { ExternalLink, MapPin } from "lucide-react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  return (
    <div className="office-map-shell">
      <a className="office-map office-map-link-card" href={business.mapUrl} target="_blank" rel="noreferrer" aria-label={`${title} 네이버 지도 열기`}>
        <div className="office-map-link-visual" aria-hidden="true">
          <MapPin size={42} />
        </div>
        <div className="office-map-link-content">
          <span className="office-label">NAVER MAP</span>
          <strong>{title}</strong>
          <p>{address}</p>
        </div>
        <span className="office-map-link-action">
          네이버 지도 열기
          <ExternalLink size={18} />
        </span>
      </a>
    </div>
  );
}
