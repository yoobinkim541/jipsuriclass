import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ClipboardList,
  ExternalLink,
  Eye,
  Home,
  Image,
  LayoutGrid,
  LoaderCircle,
  PencilLine,
  Pin,
  RefreshCcw,
  Search,
  Shield,
  Stethoscope,
  UserRound
} from "lucide-react";
import { business } from "../data";
import { landingPageDefinitions, type LandingPageDefinition } from "../landingPages";
import type { InquiryRow } from "../types";
import { SiteContentEditor, type EditorPage } from "./SiteContentEditor";
import { buildDisplay } from "./InquiriesTab";

type PreviewFn = (path: string, label: string) => void;

/* ──────────── 유입 · 분석 ──────────── */

// 페이지 유입·검색 키워드·전환 흐름은 아직 수집 백엔드가 없어 예시 데이터로 표시합니다.
const sampleTopPages = [
  { name: "누수 탐지·보수 가격표", path: "/service/leak/pricing", visits: 1842, conv: "8.2%" },
  { name: "홈", path: "/", visits: 1238, conv: "6.1%" },
  { name: "욕실 가격표", path: "/service/bathroom/pricing", visits: 812, conv: "12.3%" },
  { name: "남양주 집수리", path: "/area/namyangju", visits: 698, conv: "8.8%" },
  { name: "자기진단", path: "/diagnosis", visits: 412, conv: "15.6%" }
];
const sampleKeywords = [
  { kw: "남양주 누수", visits: 642 },
  { kw: "다산 집수리", visits: 488 },
  { kw: "구리 욕실 부분 리모델링", visits: 412 },
  { kw: "하남 집수리클라쓰", visits: 384 },
  { kw: "강동구 도배 잘하는 곳", visits: 312 }
];
const sampleFunnel = [
  { step: "SEO 페이지 진입", n: 8420, w: 100 },
  { step: "내부 이동", n: 5128, w: 61 },
  { step: "상담신청 페이지", n: 1842, w: 22 },
  { step: "신청서 시작", n: 824, w: 9.8 },
  { step: "최종 제출", n: 412, w: 4.9 }
];

export function AnalyticsTab({ inquiries }: { inquiries: InquiryRow[] }) {
  const stats = useMemo(() => {
    const total = inquiries.length;
    const quotedOrLater = inquiries.filter((item) => ["quoted", "active", "done"].includes(item.status)).length;
    const done = inquiries.filter((item) => item.status === "done").length;
    const pending = inquiries.filter((item) => item.status === "new").length;
    const convRate = total ? Math.round((quotedOrLater / total) * 100) : 0;

    const tally = (pick: (row: InquiryRow) => string) => {
      const map = new Map<string, number>();
      inquiries.forEach((row) => {
        const value = (pick(row) || "기타").split(/[,/·]/)[0].trim() || "기타";
        map.set(value, (map.get(value) ?? 0) + 1);
      });
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    };

    return {
      total,
      quotedOrLater,
      done,
      pending,
      convRate,
      byWork: tally((row) => buildDisplay(row).workType),
      byRegion: tally((row) => buildDisplay(row).region)
    };
  }, [inquiries]);

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">대시보드 · 유입 분석</span>
          <h1>어느 페이지로 들어와서 어느 페이지에서 신청했나요?</h1>
          <p>상담 데이터는 실시간 집계입니다. 페이지 유입·키워드는 분석 도구 연동 전까지 예시로 표시됩니다.</p>
        </div>
      </header>

      <div className="adm-analytics-kpi">
        <article className="adm-akpi">
          <span className="adm-akpi__label">전체 상담</span>
          <strong className="adm-akpi__val">{stats.total.toLocaleString()}</strong>
          <span className="adm-akpi__sub">누적 접수</span>
        </article>
        <article className="adm-akpi">
          <span className="adm-akpi__label">견적 전환율</span>
          <strong className="adm-akpi__val">{stats.convRate}%</strong>
          <span className="adm-akpi__sub">{stats.quotedOrLater}건 견적 이상 진행</span>
        </article>
        <article className="adm-akpi">
          <span className="adm-akpi__label">시공 완료</span>
          <strong className="adm-akpi__val">{stats.done}</strong>
          <span className="adm-akpi__sub">완료 처리</span>
        </article>
        <article className="adm-akpi">
          <span className="adm-akpi__label">응대 대기</span>
          <strong className="adm-akpi__val">{stats.pending}</strong>
          <span className="adm-akpi__sub">신규 미응대</span>
        </article>
      </div>

      <div className="adm-analytics-grid">
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>작업 종류 분포</h3>
            <span>접수 상담 기준</span>
          </header>
          <RankList rows={stats.byWork} unit="건" />
        </article>
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>지역 분포</h3>
            <span>접수 상담 기준</span>
          </header>
          <RankList rows={stats.byRegion} unit="건" />
        </article>
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>유입 페이지 TOP</h3>
            <span className="adm-badge-sample">예시 데이터</span>
          </header>
          <ol className="adm-rank-list">
            {sampleTopPages.map((page) => (
              <li key={page.path}>
                <strong>{page.name}</strong> <em>{page.visits.toLocaleString()}회 · 전환 {page.conv}</em>
              </li>
            ))}
          </ol>
        </article>
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>지역 검색 키워드</h3>
            <span className="adm-badge-sample">예시 데이터</span>
          </header>
          <ol className="adm-rank-list">
            {sampleKeywords.map((keyword) => (
              <li key={keyword.kw}>
                <strong>{keyword.kw}</strong> <em>{keyword.visits.toLocaleString()}회</em>
              </li>
            ))}
          </ol>
        </article>
        <article className="adm-card adm-card--span2">
          <header className="adm-card__head">
            <h3>전환 흐름 (상담신청까지)</h3>
            <span className="adm-badge-sample">예시 데이터</span>
          </header>
          <div className="adm-funnel">
            {sampleFunnel.map((step) => (
              <div className="adm-funnel__step" key={step.step}>
                <strong>{step.step}</strong>
                <div className="adm-funnel__bar" style={{ width: `${step.w}%` }} />
                <span className="adm-funnel__num">{step.n.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function RankList({ rows, unit }: { rows: Array<[string, number]>; unit: string }) {
  if (!rows.length) return <p className="adm-rank-empty">데이터 없음</p>;
  const max = rows[0][1] || 1;
  return (
    <ol className="adm-rank-list">
      {rows.map(([name, count]) => (
        <li key={name}>
          <strong>{name}</strong> <em>{count}{unit}</em>
          <div className="adm-rank-bar" style={{ width: `${Math.round((count / max) * 100)}%` }} />
        </li>
      ))}
    </ol>
  );
}

/* ──────────── 지역 / 작업 (랜딩페이지) ──────────── */

function LandingCard({
  page,
  onPreview,
  onEdit
}: {
  page: LandingPageDefinition;
  onPreview: PreviewFn;
  onEdit: () => void;
}) {
  const shortName = page.areaLabel || page.title.split("|")[0].trim();
  return (
    <article className="adm-region-card">
      <header className="adm-region-card__head">
        <div>
          <h3 className="adm-region-card__name">{shortName}</h3>
          <span className="adm-region-card__sub">{page.path}</span>
        </div>
        <span className={`adm-region-card__tier ${page.categoryLabel === "지역" ? "adm-region-card__tier--core" : "adm-region-card__tier--ext"}`}>
          {page.categoryLabel}
        </span>
      </header>
      <p className="adm-region-card__desc">
        {page.searchTerms.slice(0, 5).join(" · ")}
        {page.searchTerms.length > 5 ? "…" : ""}
      </p>
      <div className="adm-region-card__stats">
        <span>
          <strong>{page.searchTerms.length}</strong>
          <em>검색어</em>
        </span>
        <span>
          <strong>{page.points.length}</strong>
          <em>포인트</em>
        </span>
        <span>
          <strong>{page.faq.length}</strong>
          <em>FAQ</em>
        </span>
      </div>
      <div className="adm-region-card__actions">
        <button className="adm-card-primary" type="button" onClick={onEdit}>
          <PencilLine />편집
        </button>
        <button className="adm-card-secondary" type="button" onClick={() => onPreview(page.path, shortName)}>
          <Eye />미리보기
        </button>
      </div>
    </article>
  );
}

export function RegionsTab({ onPreview, onEdit }: { onPreview: PreviewFn; onEdit: () => void }) {
  const [search, setSearch] = useState("");
  const pages = useMemo(
    () =>
      landingPageDefinitions.filter(
        (page) =>
          page.categoryLabel === "지역" &&
          (!search.trim() ||
            `${page.title} ${page.areaLabel ?? ""} ${page.searchTerms.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase()))
      ),
    [search]
  );

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">콘텐츠 · 지역 페이지</span>
          <h1>지역별 SEO 랜딩 페이지 관리</h1>
          <p>
            {landingPageDefinitions.filter((page) => page.categoryLabel === "지역").length}개 지역. 문구·FAQ·연결
            링크는 랜딩페이지 편집기에서 수정하면 즉시 반영됩니다.
          </p>
        </div>
      </header>

      <div className="adm-regions-controls">
        <div className="adm-regions-filters">
          <button className="adm-regions-filter is-active" type="button">
            전체 <span>{pages.length}</span>
          </button>
        </div>
        <label className="adm-inq-search">
          <Search />
          <input type="search" placeholder="지역명 검색" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>

      <div className="adm-region-grid">
        {pages.map((page) => (
          <LandingCard key={page.path} page={page} onPreview={onPreview} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

export function WorksTab({ onPreview, onEdit }: { onPreview: PreviewFn; onEdit: () => void }) {
  const pages = landingPageDefinitions.filter((page) => page.categoryLabel === "서비스");

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">콘텐츠 · 작업 페이지</span>
          <h1>작업별 SEO 랜딩 페이지 관리</h1>
          <p>검색량이 큰 {pages.length}가지 작업의 상세 페이지. 문구·포인트·FAQ를 랜딩페이지 편집기에서 수정합니다.</p>
        </div>
      </header>
      <div className="adm-region-grid">
        {pages.map((page) => (
          <LandingCard key={page.path} page={page} onPreview={onPreview} onEdit={onEdit} />
        ))}
      </div>
    </section>
  );
}

/* ──────────── 핵심 페이지 ──────────── */

const corePages: Array<{
  name: string;
  path: string;
  icon: typeof Home;
  desc: string;
  editor: EditorPage | null;
}> = [
  { name: "홈", path: "/", icon: Home, desc: "히어로 · 서비스 · 가능작업 · 현장사례 · 블로그 · 문의 섹션", editor: "homepage" },
  { name: "상담신청서", path: "/estimate", icon: ClipboardList, desc: "다단계 상담신청 폼. 질문·약관·첨부 안내 문구 편집", editor: "estimate" },
  { name: "마이페이지", path: "/mypage", icon: UserRound, desc: "고객 계정 화면. 로그인 안내와 문의 카드 문구 편집", editor: "account" },
  { name: "랜딩페이지", path: "/service/leak", icon: LayoutGrid, desc: "서비스·지역 랜딩 전체. 문구·FAQ·연결 링크 편집", editor: "landing" },
  { name: "자기진단", path: "/diagnosis", icon: Stethoscope, desc: "증상 선택 → 원인·다음 행동 안내 (코드에서 관리)", editor: null },
  { name: "개인정보처리방침", path: "/privacy", icon: Shield, desc: "개인정보 처리방침 본문 (코드에서 관리)", editor: null }
];

export function ContentTab({
  isAuthenticated,
  editorPage,
  onEditorPageChange,
  onPreview
}: {
  isAuthenticated: boolean;
  editorPage: EditorPage | null;
  onEditorPageChange: (page: EditorPage | null) => void;
  onPreview: PreviewFn;
}) {
  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">콘텐츠 · 핵심 페이지</span>
          <h1>홈·상담신청·마이페이지 등 핵심 화면</h1>
          <p>편집을 누르면 해당 페이지의 문구·사진 편집기가 아래에 열립니다. 변경은 자동 저장됩니다.</p>
        </div>
      </header>

      {editorPage ? (
        <div className="adm-editor-host">
          <button className="adm-editor-back" type="button" onClick={() => onEditorPageChange(null)}>
            <ArrowLeft />페이지 목록으로
          </button>
          <SiteContentEditor isAuthenticated={isAuthenticated} initialPage={editorPage} key={editorPage} />
        </div>
      ) : (
        <div className="adm-page-grid">
          {corePages.map((page) => {
            const Icon = page.icon;
            return (
              <article className="adm-page-card" key={page.path}>
                <div className="adm-page-card__thumb">
                  <Icon />
                  <span>{page.name}</span>
                </div>
                <div className="adm-page-card__body">
                  <span className="adm-page-card__file">{page.path}</span>
                  <p className="adm-page-card__desc">{page.desc}</p>
                  <div className="adm-page-card__actions">
                    {page.editor ? (
                      <button className="adm-card-primary" type="button" onClick={() => onEditorPageChange(page.editor)}>
                        <PencilLine />편집 열기
                      </button>
                    ) : null}
                    <button className="adm-card-secondary" type="button" onClick={() => onPreview(page.path, page.name)}>
                      <Eye />미리보기
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ──────────── 블로그 연동 ──────────── */

type BlogItem = {
  title: string;
  link: string;
  postdate?: string;
  image?: string | null;
  description?: string;
};

export function BlogTab({ toast }: { toast: (message: string) => void }) {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [source, setSource] = useState<string>("-");

  async function load(notify = false) {
    setLoading(true);
    try {
      const response = await fetch("/api/naver-blog");
      const payload = (await response.json()) as { items?: BlogItem[]; source?: string };
      setItems(payload.items ?? []);
      setSource(payload.source ?? "-");
      setSyncedAt(new Date().toLocaleString("ko-KR"));
      if (notify) toast(payload.items?.length ? `네이버 블로그 글 ${payload.items.length}건을 불러왔습니다.` : "블로그 글을 불러오지 못했습니다.");
    } catch {
      if (notify) toast("블로그 글을 불러오지 못했습니다 (네트워크).");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">콘텐츠 · 블로그 연동</span>
          <h1>네이버 블로그 글 자동 연동</h1>
          <p>최근 글이 메인의 블로그 카드와 랜딩페이지 참고글에 자동으로 표시됩니다. 메인 큐레이션은 홈페이지 편집기에서 관리합니다.</p>
        </div>
        <div className="adm-tab__actions">
          <a className="adm-btn adm-btn--ghost" href={business.naverBlogUrl} target="_blank" rel="noreferrer">
            <ExternalLink />네이버 블로그 열기
          </a>
          <button className="adm-btn adm-btn--primary" type="button" disabled={loading} onClick={() => void load(true)}>
            {loading ? <LoaderCircle className="spin" /> : <RefreshCcw />}지금 새로 불러오기
          </button>
        </div>
      </header>

      <div className="adm-blog-status">
        <div className="adm-blog-status__item">
          <span className="adm-blog-status__label">마지막 동기화</span>
          <strong>{syncedAt ?? "-"}</strong>
        </div>
        <div className="adm-blog-status__item">
          <span className="adm-blog-status__label">데이터 소스</span>
          <strong>{source === "naver" ? "네이버 API" : source}</strong>
        </div>
        <div className="adm-blog-status__item">
          <span className="adm-blog-status__label">노출 글</span>
          <strong>{items.length}건</strong>
        </div>
      </div>

      <div className="adm-blog-grid">
        {loading && !items.length ? (
          <p className="adm-rank-empty">불러오는 중…</p>
        ) : items.length === 0 ? (
          <p className="adm-rank-empty">표시할 블로그 글이 없습니다.</p>
        ) : (
          items.map((item) => (
            <article className="adm-blog-card" key={item.link}>
              {item.image ? (
                <img src={item.image} alt={item.title} loading="lazy" />
              ) : (
                <div className="adm-blog-card__noimg">
                  <Image />
                </div>
              )}
              <div className="adm-blog-card__body">
                <h3 className="adm-blog-card__title">{item.title}</h3>
                <span className="adm-blog-card__meta">{formatPostDate(item.postdate)}</span>
                <div className="adm-blog-card__actions">
                  <button type="button" onClick={() => toast("메인 고정은 핵심 페이지 → 홈 편집의 현장사례 구역에서 관리합니다.")}>
                    <Pin />메인 고정
                  </button>
                  <a href={item.link} target="_blank" rel="noreferrer">
                    <ExternalLink />네이버에서 보기
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function formatPostDate(postdate?: string) {
  if (!postdate) return "";
  if (/^\d{8}$/.test(postdate)) {
    return `${postdate.slice(0, 4)}.${postdate.slice(4, 6)}.${postdate.slice(6, 8)}`;
  }
  return postdate;
}

/* ──────────── 사이트 설정 ──────────── */

const certifications = [
  "건축기능사",
  "건축도장기능사",
  "도배기능사",
  "실내건축기능사",
  "타일기능사",
  "방수기능사",
  "전산응용건축제도기능사"
];

const brandColors = [
  { name: "네이비", value: "#10284a" },
  { name: "골드", value: "#d7ae6b" },
  { name: "크림", value: "#faf7f2" },
  { name: "잉크", value: "#0b1a30" }
];

export function SettingsTab({ toast }: { toast: (message: string) => void }) {
  const fields: Array<[string, string]> = [
    ["상호", business.name],
    ["대표", business.owner.replace("대표자 ", "")],
    ["전화", business.phone],
    ["주소", business.address],
    ["운영시간", business.hours],
    ["카카오톡 채널", business.kakaoUrl],
    ["네이버 블로그", business.naverBlogUrl]
  ];

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">사이트 · 설정</span>
          <h1>영업 정보, 자격, 브랜드 컬러</h1>
          <p>현재 값은 <code>src/data.ts</code> 기준입니다. 화면 저장 연동은 준비 중입니다.</p>
        </div>
      </header>
      <div className="adm-settings-grid">
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>영업 정보</h3>
            <span className="adm-badge-sample">읽기 전용</span>
          </header>
          <dl className="adm-kv">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <input value={value} readOnly />
                </dd>
              </div>
            ))}
          </dl>
          <footer className="adm-card__foot">
            <button
              className="adm-btn adm-btn--primary"
              type="button"
              onClick={() => toast("설정 저장은 아직 백엔드에 연결되지 않았습니다 — src/data.ts에서 수정해주세요.")}
            >
              저장
            </button>
            <span className="adm-card__hint">수정 시 모든 페이지의 헤더·푸터·문의 섹션에 반영됩니다.</span>
          </footer>
        </article>

        <article className="adm-card">
          <header className="adm-card__head">
            <h3>브랜드 컬러</h3>
          </header>
          <div className="adm-swatches">
            {brandColors.map((color) => (
              <label className="adm-swatch" key={color.name}>
                <span style={{ background: color.value }} />
                <strong>{color.name}</strong>
                <em>{color.value}</em>
              </label>
            ))}
          </div>
          <footer className="adm-card__foot">
            <span className="adm-card__hint">styles.css의 :root 토큰과 동기화되어 있습니다.</span>
          </footer>
        </article>

        <article className="adm-card adm-card--span2">
          <header className="adm-card__head">
            <h3>대표 자격증 (7종)</h3>
            <span>
              <Building2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              {business.registrationNumber}
            </span>
          </header>
          <div className="adm-cert-list">
            {certifications.map((cert) => (
              <span key={cert}>{cert}</span>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

/* ──────────── 편집 이력 ──────────── */

const sampleAudit = [
  { when: "2026.06.02 14:08", who: "이보미", path: "homepage.hero.title", change: "히어로 카피 수정" },
  { when: "2026.06.01 13:22", who: "이보미", path: "landing./service/leak.faq.0", change: "출장비 정책 답변 보강" },
  { when: "2026.05.30 10:14", who: "이보미", path: "estimate.terms", change: "약관 문구 다듬기" },
  { when: "2026.05.28 09:50", who: "이보미", path: "homepage.cases", change: "대표 사례 교체" }
];

export function AuditTab() {
  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">사이트 · 편집 이력</span>
          <h1>누가, 언제, 무엇을 바꿨나요?</h1>
          <p>
            편집기에서 저장된 변경 사항을 시간순으로 기록하는 기능은 준비 중입니다. 아래는 화면 구성 확인용 예시입니다.
          </p>
        </div>
        <div className="adm-tab__actions">
          <span className="adm-badge-sample" style={{ alignSelf: "center" }}>예시 데이터</span>
        </div>
      </header>
      <div className="adm-audit-list">
        {sampleAudit.map((row) => (
          <div className="adm-audit-row" key={`${row.when}-${row.path}`}>
            <span className="adm-when">{row.when}</span>
            <span className="adm-who">
              <span className="adm-who-avatar">{row.who[0]}</span>
              {row.who}
            </span>
            <span className="adm-path">{row.path}</span>
            <span className="adm-change">{row.change}</span>
            <span className="adm-undo-off">기록</span>
          </div>
        ))}
      </div>
    </section>
  );
}
