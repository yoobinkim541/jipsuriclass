import { useState } from "react";
import { RefreshCcw, LoaderCircle, ArrowUpRight } from "lucide-react";
import { AdminShell } from "./AdminShell";
import { SiteContentEditor } from "./SiteContentEditor";
import { useAdminSession } from "./useAdminSession";

export function AdminEditorPage() {
  const { sessionEmail, sessionLoading, signOut } = useAdminSession();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AdminShell
      pageMeta={{
        kicker: "콘텐츠 · 페이지 편집",
        title: "홈·자기진단·상담신청 등 핵심 페이지를 편집합니다.",
        description: "페이지별 문구와 이미지, 안내 순서를 바로 수정하고 자동 저장으로 반영할 수 있습니다."
      }}
      actions={
        <>
          <button className="admin-ghost-button" type="button" onClick={() => window.location.reload()}>
            <RefreshCcw size={16} />
            동기화
          </button>
          <a className="admin-primary-button" href="/admin/inquiries">
            <ArrowUpRight size={16} />
            상담 요청 보기
          </a>
        </>
      }
      searchQuery={searchQuery}
      searchPlaceholder="홈·랜딩·마이·견적 편집 항목 검색"
      onSearchChange={setSearchQuery}
      sessionEmail={sessionEmail}
      sessionLoading={sessionLoading}
      onSignOut={signOut}
      sidebarBadges={{ inquiries: 1, analytics: 7, editor: 4 }}
    >
      {sessionLoading ? (
        <div className="admin-empty">
          <LoaderCircle size={18} className="spin" />
          세션 확인 중
        </div>
      ) : (
        <section className="admin-panel admin-panel--editor" aria-label="페이지 편집">
          <SiteContentEditor isAuthenticated={Boolean(sessionEmail)} searchQuery={searchQuery} />
        </section>
      )}
    </AdminShell>
  );
}

