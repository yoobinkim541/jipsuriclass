import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { business } from "../data";
import { SiteContentService, defaultPrivacyPageContent } from "../services/SiteContentService";
import type { PrivacyPageContent } from "../types";

const siteContentService = new SiteContentService();

export function PrivacyPolicyPage() {
  const [content, setContent] = useState<PrivacyPageContent>(defaultPrivacyPageContent);

  useEffect(() => {
    let mounted = true;
    void siteContentService
      .loadPrivacyContent()
      .then((loaded) => {
        if (mounted) setContent(loaded);
      })
      .catch(() => {
        /* 로드 실패 시 기본 문구 유지 */
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="privacy-shell">
      <header className="privacy-header">
        <a className="admin-home" href="/">
          <ArrowLeft size={18} />
          {business.name}
        </a>
      </header>

      <section className="privacy-card">
        <span className="admin-kicker">
          <ShieldCheck size={16} />
          {content.intro.kicker}
        </span>
        <h1>{content.intro.title}</h1>
        <p>{content.intro.description}</p>

        {content.sections.map((section, index) => (
          <div className="privacy-section" key={`${section.heading}-${index}`}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </div>
        ))}
      </section>

      <footer className="privacy-footer">
        <p>{content.contactNote || business.name}</p>
        <a href="/">홈으로</a>
      </footer>
    </main>
  );
}
