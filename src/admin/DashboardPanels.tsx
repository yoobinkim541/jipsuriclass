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
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Shield,
  Stethoscope,
  Trash2,
  UserRound
} from "lucide-react";
import { applySiteSettings, business } from "../data";
import { landingPageDefinitions, type LandingPageDefinition } from "../landingPages";
import type { InquiryRow, SiteSettingsContent } from "../types";
import { SiteContentEditor, type EditorPage } from "./SiteContentEditor";
import { SiteContentService, contentLabel, defaultSiteSettingsContent, type ContentAuditRow } from "../services/SiteContentService";
import { buildDisplay } from "./InquiriesTab";

const dashboardSiteContentService = new SiteContentService();

type PreviewFn = (path: string, label: string) => void;

/* ──────────── 유입 · 분석 ──────────── */

// 방문·유입 트래픽은 Vercel Web Analytics 대시보드에서 봅니다(이 어드민에는 가짜 데이터를
// 두지 않음). 여기서는 inquiries DB에서 계산한 실데이터만 시각화합니다.
const VERCEL_ANALYTICS_URL = "https://vercel.com/yoobinkim541s-projects/jipsuriclass/analytics";

export function AnalyticsTab({ inquiries }: { inquiries: InquiryRow[] }) {
  const stats = useMemo(() => {
    const real = inquiries.filter((item) => item.status !== "spam");
    const total = real.length;
    const countAtLeast = (statuses: string[]) => real.filter((item) => statuses.includes(item.status)).length;
    const quotedOrLater = countAtLeast(["quoted", "active", "done"]);
    const done = countAtLeast(["done"]);
    const pending = real.filter((item) => item.status === "new").length;
    const convRate = total ? Math.round((quotedOrLater / total) * 100) : 0;

    const tally = (pick: (row: InquiryRow) => string) => {
      const map = new Map<string, number>();
      real.forEach((row) => {
        const value = (pick(row) || "기타").split(/[,/·]/)[0].trim() || "기타";
        map.set(value, (map.get(value) ?? 0) + 1);
      });
      return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    };

    // 상담 처리 단계 퍼널 — 각 단계는 "그 단계 이상" 누적 건수(실데이터).
    const funnel = [
      { step: "접수 (신규 포함)", n: total },
      { step: "응대 이상", n: countAtLeast(["contacted", "quoted", "active", "done"]) },
      { step: "견적 이상", n: quotedOrLater },
      { step: "시공 이상", n: countAtLeast(["active", "done"]) },
      { step: "완료", n: done }
    ];

    return {
      total,
      quotedOrLater,
      done,
      pending,
      convRate,
      byWork: tally((row) => buildDisplay(row).workType),
      byRegion: tally((row) => buildDisplay(row).region),
      funnel
    };
  }, [inquiries]);

  const funnelMax = stats.funnel[0]?.n || 1;

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">대시보드 · 상담 분석</span>
          <h1>상담이 어떻게 들어와서 어디까지 진행되나요?</h1>
          <p>접수부터 시공 완료까지 inquiries DB 기준 실시간 집계입니다. 방문·유입 트래픽과 전환 이벤트는 Vercel Web Analytics에서 확인하세요.</p>
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
            <h3>방문·유입 분석</h3>
          </header>
          <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: "var(--lh-base)", margin: 0 }}>
            방문자·페이지뷰·유입 경로·검색 키워드·웹바이탈, 그리고 전화/카카오톡 클릭·견적폼 단계·자가진단 같은 전환
            이벤트는 Vercel Web Analytics에서 집계됩니다(익명·쿠키리스).
          </p>
          <footer className="adm-card__foot">
            <a className="adm-btn adm-btn--ghost" href={VERCEL_ANALYTICS_URL} target="_blank" rel="noreferrer">
              <ExternalLink />Vercel 대시보드에서 보기
            </a>
          </footer>
        </article>
        <article className="adm-card adm-card--span2">
          <header className="adm-card__head">
            <h3>상담 처리 단계</h3>
            <span>접수 상담 기준 · 스팸 제외</span>
          </header>
          {stats.total ? (
            <div className="adm-funnel">
              {stats.funnel.map((step) => (
                <div className="adm-funnel__step" key={step.step}>
                  <strong>{step.step}</strong>
                  <div
                    className="adm-funnel__bar"
                    style={{ width: `${Math.max(2, Math.round((step.n / funnelMax) * 100))}%` }}
                  />
                  <span className="adm-funnel__num">{step.n.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="adm-rank-empty">아직 접수된 상담이 없습니다.</p>
          )}
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
  onEdit: (path: string) => void;
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
        <button className="adm-card-primary" type="button" onClick={() => onEdit(page.path)}>
          <PencilLine />편집
        </button>
        <button className="adm-card-secondary" type="button" onClick={() => onPreview(page.path, shortName)}>
          <Eye />미리보기
        </button>
      </div>
    </article>
  );
}

export function RegionsTab({ onPreview, onEdit }: { onPreview: PreviewFn; onEdit: (path: string) => void }) {
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

export function WorksTab({ onPreview, onEdit }: { onPreview: PreviewFn; onEdit: (path: string) => void }) {
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
  { name: "자기진단", path: "/diagnosis", icon: Stethoscope, desc: "증상 선택 → 원인·점검·상담 안내 문구 편집", editor: "diagnosis" },
  { name: "개인정보처리방침", path: "/privacy", icon: Shield, desc: "개인정보 처리방침 본문 섹션 편집", editor: "privacy" }
];

export function ContentTab({
  isAuthenticated,
  editorPage,
  editorLandingPath,
  onEditorPageChange,
  onPreview
}: {
  isAuthenticated: boolean;
  editorPage: EditorPage | null;
  editorLandingPath?: string | null;
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
          <SiteContentEditor
            isAuthenticated={isAuthenticated}
            initialPage={editorPage}
            initialLandingPath={editorLandingPath ?? undefined}
            key={`${editorPage}:${editorLandingPath ?? ""}`}
          />
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

const NAVER_IMAGE_HOST = /(?:^|\.)(?:pstatic\.net|naver\.net|naver\.com)$/i;

/**
 * 네이버 블로그 이미지는 브라우저에서 직접 부르면 핫링크 차단(403)으로 깨진다.
 * 같은 오리진의 /api/blog-image 프록시(서버가 Referer를 붙여 받아옴)를 거치게 한다.
 */
function toDisplayBlogImage(rawUrl: string): string {
  const url = (rawUrl || "").trim();
  if (!url || url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (NAVER_IMAGE_HOST.test(parsed.hostname)) {
      return `/api/blog-image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    return url;
  }
  return url;
}

/** 블로그 카드 썸네일 — 프록시로 불러오고, 실패하면 기본 플레이스홀더로 폴백. */
function BlogThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="adm-blog-card__noimg">
        <Image />
      </div>
    );
  }
  return <img src={toDisplayBlogImage(src)} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

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
                <BlogThumb src={item.image} alt={item.title} />
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

// 사이트 설정 필드 키 → 사람이 읽는 이름(편집 이력 변경 요약용).
const siteSettingsFieldLabels: Record<string, string> = {
  name: "상호",
  owner: "대표",
  phone: "전화",
  address: "주소",
  hours: "운영시간",
  area: "영업지역",
  kakaoUrl: "카카오톡",
  naverBlogUrl: "네이버블로그",
  mapUrl: "지도링크",
  registrationNumber: "사업자번호",
  certifications: "자격증"
};

function auditFieldLabel(contentId: string, key: string): string {
  if (contentId === "site-settings" && siteSettingsFieldLabels[key]) return siteSettingsFieldLabels[key];
  return key;
}

/** 두 스냅샷의 최상위 키 중 값(JSON)이 달라진 키 목록. */
function diffTopLevelKeys(prev: unknown, next: unknown): string[] {
  if (!prev || !next || typeof prev !== "object" || typeof next !== "object") return [];
  const prevObj = prev as Record<string, unknown>;
  const nextObj = next as Record<string, unknown>;
  const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(prevObj[key]) !== JSON.stringify(nextObj[key])) changed.push(key);
  }
  return changed;
}

/** 편집 이력 한 줄의 '무엇을 했는지' 요약 — 직전(더 오래된) 같은 영역 저장과 비교한 변경 항목. */
function describeAuditChange(row: ContentAuditRow, rows: ContentAuditRow[], index: number): string {
  const label = row.label ?? contentLabel(row.content_id);
  if (row.payload == null) return `${label} 저장`;
  // rows는 최신순 → index 이후(더 오래된)에서 같은 영역의 직전 스냅샷을 찾는다.
  const prev = rows.slice(index + 1).find((item) => item.content_id === row.content_id && item.payload != null);
  if (!prev) return `${label} 최초 저장`;
  const changed = diffTopLevelKeys(prev.payload, row.payload);
  if (!changed.length) return `${label} 재저장(변경 없음)`;
  const names = changed.map((key) => auditFieldLabel(row.content_id, key));
  const shown = names.slice(0, 4).join(", ");
  return `${label} · ${shown}${names.length > 4 ? ` 외 ${names.length - 4}건` : ""} 변경`;
}

function formatAuditTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatPostDate(postdate?: string) {
  if (!postdate) return "";
  if (/^\d{8}$/.test(postdate)) {
    return `${postdate.slice(0, 4)}.${postdate.slice(4, 6)}.${postdate.slice(6, 8)}`;
  }
  return postdate;
}

/* ──────────── 사이트 설정 ──────────── */

const brandColors = [
  { name: "네이비", value: "#10284a" },
  { name: "골드", value: "#d7ae6b" },
  { name: "크림", value: "#faf7f2" },
  { name: "잉크", value: "#0b1a30" }
];

const settingsFields: Array<{ key: keyof Omit<SiteSettingsContent, "certifications">; label: string; placeholder?: string }> = [
  { key: "name", label: "상호" },
  { key: "owner", label: "대표", placeholder: "예: 대표자 이보미" },
  { key: "phone", label: "전화", placeholder: "예: 010-0000-0000" },
  { key: "address", label: "주소" },
  { key: "hours", label: "운영시간" },
  { key: "area", label: "영업 지역" },
  { key: "kakaoUrl", label: "카카오톡 채널" },
  { key: "naverBlogUrl", label: "네이버 블로그" },
  { key: "mapUrl", label: "지도 링크" },
  { key: "registrationNumber", label: "사업자등록번호" }
];

export function SettingsTab({ toast }: { toast: (message: string) => void }) {
  const [draft, setDraft] = useState<SiteSettingsContent>(defaultSiteSettingsContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCert, setNewCert] = useState("");

  useEffect(() => {
    let mounted = true;
    void dashboardSiteContentService
      .loadSiteSettingsContent()
      .then((content) => {
        if (mounted) setDraft(content);
      })
      .catch(() => {
        /* 실패 시 기본값 유지 */
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function updateField(key: keyof Omit<SiteSettingsContent, "certifications">, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateCert(index: number, value: string) {
    setDraft((current) => ({ ...current, certifications: current.certifications.map((cert, i) => (i === index ? value : cert)) }));
  }

  function removeCert(index: number) {
    setDraft((current) => ({ ...current, certifications: current.certifications.filter((_, i) => i !== index) }));
  }

  function addCert() {
    const value = newCert.trim();
    if (!value) return;
    setDraft((current) => ({ ...current, certifications: [...current.certifications, value] }));
    setNewCert("");
  }

  async function save() {
    setSaving(true);
    try {
      const payload: SiteSettingsContent = {
        ...draft,
        certifications: draft.certifications.map((cert) => cert.trim()).filter(Boolean)
      };
      await dashboardSiteContentService.saveSiteSettingsContent(payload);
      applySiteSettings(payload); // 현재 세션의 공개 페이지에도 즉시 반영
      setDraft(payload);
      toast("영업 정보를 저장했습니다. 헤더·푸터·문의 섹션에 반영됩니다.");
    } catch (error) {
      toast(error instanceof Error ? `저장 실패: ${error.message}` : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">사이트 · 설정</span>
          <h1>영업 정보, 자격, 브랜드 컬러</h1>
          <p>영업 정보와 대표 자격증을 편집해 저장하면 헤더·푸터·문의 섹션 등 사이트 전역에 반영됩니다.</p>
        </div>
        <div className="adm-tab__actions">
          <button className="adm-btn adm-btn--primary" type="button" onClick={() => void save()} disabled={loading || saving}>
            {saving ? <LoaderCircle className="spin" /> : <Save />}
            {saving ? "저장 중" : "저장"}
          </button>
        </div>
      </header>
      <div className="adm-settings-grid">
        <article className="adm-card">
          <header className="adm-card__head">
            <h3>영업 정보</h3>
          </header>
          {loading ? (
            <div className="admin-empty">
              <LoaderCircle size={18} className="spin" />
              불러오는 중
            </div>
          ) : (
            <dl className="adm-kv">
              {settingsFields.map((field) => (
                <div key={field.key}>
                  <dt>{field.label}</dt>
                  <dd>
                    <input
                      value={draft[field.key]}
                      placeholder={field.placeholder}
                      onChange={(event) => updateField(field.key, event.target.value)}
                    />
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <footer className="adm-card__foot">
            <span className="adm-card__hint">수정 후 저장하면 모든 페이지의 헤더·푸터·문의 섹션에 반영됩니다.</span>
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
            <h3>대표 자격증 ({draft.certifications.length}종)</h3>
            <span>
              <Building2 size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              {draft.registrationNumber}
            </span>
          </header>
          <div className="adm-cert-edit-list">
            {draft.certifications.map((cert, index) => (
              <div className="adm-cert-edit-row" key={index}>
                <input value={cert} onChange={(event) => updateCert(index, event.target.value)} />
                <button type="button" onClick={() => removeCert(index)} aria-label="자격증 삭제">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="adm-cert-add">
            <input
              value={newCert}
              placeholder="자격증 추가 (예: 건축기능사)"
              onChange={(event) => setNewCert(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCert();
                }
              }}
            />
            <button className="adm-btn adm-btn--ghost" type="button" onClick={addCert}>
              <Plus size={15} />추가
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

/* ──────────── 편집 이력 ──────────── */

export function AuditTab({ toast }: { toast: (message: string) => void }) {
  const [rows, setRows] = useState<ContentAuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setRows(await dashboardSiteContentService.listContentAudit());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function rollback(row: ContentAuditRow) {
    const label = row.label ?? contentLabel(row.content_id);
    const when = formatAuditTime(row.created_at);
    if (typeof window !== "undefined" && !window.confirm(`'${label}'을(를) ${when} 시점으로 되돌릴까요?\n현재 내용은 이 스냅샷으로 덮어써집니다.`)) {
      return;
    }
    setRestoringId(row.id);
    try {
      await dashboardSiteContentService.restoreSiteContent(row.content_id, row.payload);
      toast(`'${label}'을(를) ${when} 시점으로 되돌렸습니다.`);
      await load();
    } catch (error) {
      toast(error instanceof Error ? `되돌리기 실패: ${error.message}` : "되돌리기에 실패했습니다.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <section className="adm-tab">
      <header className="adm-tab__head">
        <div>
          <span className="adm-tab__kicker">사이트 · 편집 이력</span>
          <h1>누가, 언제, 무엇을 바꿨나요?</h1>
          <p>편집기에서 콘텐츠를 저장할 때마다 기록됩니다. 각 기록의 ‘되돌리기’로 그 시점 내용으로 복원할 수 있습니다.</p>
        </div>
        <div className="adm-tab__actions">
          <button className="adm-btn adm-btn--ghost" type="button" onClick={() => void load()} disabled={loading}>
            {loading ? <LoaderCircle className="spin" /> : <RefreshCcw />}새로고침
          </button>
        </div>
      </header>
      <div className="adm-audit-list">
        {loading && !rows.length ? (
          <p className="adm-rank-empty">불러오는 중…</p>
        ) : rows.length === 0 ? (
          <p className="adm-rank-empty">아직 편집 이력이 없습니다. 편집기에서 콘텐츠를 저장하면 여기에 기록됩니다.</p>
        ) : (
          rows.map((row, index) => {
            const who = row.actor_email ?? "관리자";
            const canRestore = row.payload != null;
            const change = describeAuditChange(row, rows, index);
            return (
              <div className="adm-audit-row" key={row.id}>
                <span className="adm-when">{formatAuditTime(row.created_at)}</span>
                <span className="adm-who">
                  <span className="adm-who-avatar">{who[0]?.toUpperCase() ?? "관"}</span>
                  {who}
                </span>
                <span className="adm-path">{row.label ?? contentLabel(row.content_id)}</span>
                <span className="adm-change" title={change}>{change}</span>
                {canRestore ? (
                  <button
                    className="adm-audit-restore"
                    type="button"
                    onClick={() => void rollback(row)}
                    disabled={restoringId !== null}
                    title="이 시점의 내용으로 되돌립니다"
                  >
                    {restoringId === row.id ? <LoaderCircle size={13} className="spin" /> : <RotateCcw size={13} />}
                    되돌리기
                  </button>
                ) : (
                  <span className="adm-undo-off">기록</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
