import { Phone, ShieldCheck } from "lucide-react";
import { business, defaultCertifications } from "../data";
import { NaverMapEmbed } from "./NaverMapEmbed";

export function BusinessInfoList() {
  return (
    <ul className="business-list">
      <li>영업지역: {business.area}</li>
      <li>상담시간: {business.hours}</li>
    </ul>
  );
}

export function OfficeSection({ certifications = defaultCertifications }: { certifications?: string[] }) {
  const certs = certifications.filter((cert) => cert && cert.trim());
  return (
    <section className="office section" id="location" aria-labelledby="location-title">
      <div className="section-heading">
        <h2 id="location-title">오시는 길</h2>
        <p>사무실 위치는 네이버 지도로 바로 확인할 수 있습니다.</p>
      </div>
      <div className="office-grid">
        <div className="office-card">
          <span className="office-label">사무실</span>
          <h3>{business.address}</h3>
          <p>{business.area}</p>
          <p>{business.hours}</p>
          <div className="office-actions">
            <a className="primary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
              네이버 지도 열기
            </a>
            <a className="secondary-button" href={business.phoneHref}>
              <Phone size={20} />
              전화 상담
            </a>
          </div>
          <BusinessInfoList />
          {certs.length ? (
            <div className="office-certs">
              <span className="office-certs__label">
                <ShieldCheck size={15} />
                대표 보유 국가공인 자격증
              </span>
              <ul className="office-certs__list">
                {certs.map((cert) => (
                  <li key={cert}>{cert}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <NaverMapEmbed address={business.address} title={business.name} />
      </div>
    </section>
  );
}
