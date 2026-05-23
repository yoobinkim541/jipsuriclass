import { Phone } from "lucide-react";
import { business } from "../data";
import { NaverMapEmbed } from "./NaverMapEmbed";

export function BusinessInfoList() {
  return (
    <ul className="business-list">
      <li>영업지역: {business.area}</li>
      <li>상담시간: {business.hours}</li>
      <li>{business.registrationNumber}</li>
      <li>{business.owner}</li>
      <li>{business.address}</li>
    </ul>
  );
}

export function OfficeSection() {
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
        </div>
        <div className="office-card">
          <span className="office-label">외부 채널</span>
          <h3>같은 상호로 외부 프로필을 통일하면 검색 신호가 더 분명해집니다</h3>
          <p>네이버, 카카오, 구글에서 같은 이름·전화번호·주소를 유지하세요.</p>
          <div className="office-actions">
            <a className="secondary-button" href={business.naverBlogUrl} target="_blank" rel="noreferrer">
              네이버 블로그
            </a>
            <a className="secondary-button" href={business.mapUrl} target="_blank" rel="noreferrer">
              네이버 지도
            </a>
            <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
              카카오톡 채널
            </a>
          </div>
          <ul className="business-list">
            <li>구글 비즈니스 프로필: 같은 상호·전화번호·주소로 유지</li>
            <li>외부 리뷰와 사례 사진은 블로그와 지도 프로필에 함께 축적</li>
          </ul>
        </div>
        <NaverMapEmbed address={business.address} title={business.name} />
      </div>
    </section>
  );
}
