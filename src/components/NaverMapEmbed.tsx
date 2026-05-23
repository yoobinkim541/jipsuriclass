import { ExternalLink } from "lucide-react";
import { business } from "../data";

type NaverMapEmbedProps = {
  address: string;
  title: string;
};

const naverPlaceEmbedUrl = "https://map.naver.com/p/entry/place/1406150223?placePath=%2Fhome";

export function NaverMapEmbed({ address, title }: NaverMapEmbedProps) {
  return (
    <div className="office-map-shell">
      <div className="office-map office-map-embed-card" aria-label={`${title} 네이버 지도`}>
        <iframe
          className="office-map-frame"
          src={naverPlaceEmbedUrl}
          title={`${title} 네이버 지도`}
          loading="lazy"
          referrerPolicy="unsafe-url"
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
