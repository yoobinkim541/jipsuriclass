import { useMemo, useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronLeft, MessageCircle, Phone } from "lucide-react";
import { business } from "../data";
import { symptomCategories, type SymptomCategory } from "../data";
import { diagnosisTopics, getDiagnosisTopicById, getDiagnosisTopicByTrigger, type DiagnosisTopic } from "./diagnosisData";

export function DiagnosisPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);

  const initialCategory = useMemo<SymptomCategory | null>(() => {
    const catId = query.get("category");
    return catId ? (symptomCategories.find((c) => c.id === catId) ?? symptomCategories[0]) : symptomCategories[0];
  }, [query]);

  const initialTopic = useMemo<DiagnosisTopic>(() => {
    const issue = query.get("issue") ?? query.get("topic");
    if (issue) return getDiagnosisTopicByTrigger(issue) ?? getDiagnosisTopicById(issue);
    return diagnosisTopics[0];
  }, [query]);

  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory>(initialCategory ?? symptomCategories[0]);
  const [selectedTopic, setSelectedTopic] = useState<DiagnosisTopic>(initialTopic);

  function pickCategory(cat: SymptomCategory) {
    setSelectedCategory(cat);
    const first = diagnosisTopics.find((t) => t.id === cat.symptoms[0]?.id);
    if (first) setSelectedTopic(first);
  }

  function pickTopic(id: string) {
    const topic = getDiagnosisTopicById(id);
    if (topic) setSelectedTopic(topic);
  }

  return (
    <>
      <header className="site-header diagnosis-header">
        <a className="brand" href="#top" aria-label="집수리클라쓰 홈">
          <img className="brand-mark" src="/icons/brand-icon.png" alt="" aria-hidden="true" />
          <span>{business.name}</span>
        </a>
        <a className="header-call" href={business.phoneHref}>
          <Phone size={18} />
          {business.phone}
        </a>
      </header>

      <main className="diagnosis-page" id="top">
        <section className="diagnosis-hero section" aria-labelledby="diagnosis-title">
          <span className="landing-kicker">간편 자기진단</span>
          <div className="diagnosis-hero-grid">
            <div className="diagnosis-hero-copy">
              <h1 id="diagnosis-title">증상을 클릭하면 바로 원인과 다음 행동이 보입니다</h1>
              <p>
                "문이 좀 뻑뻑해요" 같은 생활 증상을 먼저 고르고, 원인 후보와 자가 점검 포인트를 확인한 뒤
                필요한 경우 바로 상담으로 이어갑니다.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href={business.phoneHref}>
                  <Phone size={20} />
                  전화 상담
                </a>
                <a className="secondary-button" href={business.kakaoUrl} target="_blank" rel="noreferrer">
                  <MessageCircle size={20} />
                  카카오톡
                </a>
                <a className="secondary-button" href="/estimate">
                  <ArrowUpRight size={20} />
                  견적상담
                </a>
              </div>
            </div>
            <aside className="diagnosis-hero-panel">
              <span className="landing-panel-label">빠른 흐름</span>
              <ul className="landing-highlight-list">
                <li>카테고리 선택</li>
                <li>증상 클릭</li>
                <li>원인 확인 후 상담 연결</li>
              </ul>
            </aside>
          </div>
        </section>

        {/* 1단: 카테고리 */}
        <section className="diagnosis-section section" aria-labelledby="diagnosis-cat-title">
          <div className="section-heading">
            <h2 id="diagnosis-cat-title">어떤 부분이 문제인가요?</h2>
            <p>해당하는 카테고리를 먼저 선택하세요.</p>
          </div>
          <div className="diagnosis-cat-grid">
            {symptomCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`diagnosis-cat-card${selectedCategory.id === cat.id ? " active" : ""}`}
                onClick={() => pickCategory(cat)}
              >
                <span className="diagnosis-cat-icon">{cat.icon}</span>
                <span className="diagnosis-cat-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 2단: 세부 증상 */}
        <section className="diagnosis-section section" aria-labelledby="diagnosis-list-title">
          <div className="section-heading">
            <h2 id="diagnosis-list-title">어떤 증상인가요?</h2>
            <p>가장 비슷한 증상을 클릭하세요.</p>
          </div>
          <div className="diagnosis-topic-grid">
            {selectedCategory.symptoms.map((s) => {
              const topic = diagnosisTopics.find((t) => t.id === s.id);
              if (!topic) return null;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`diagnosis-topic-card${selectedTopic.id === topic.id ? " active" : ""}`}
                  onClick={() => pickTopic(topic.id)}
                >
                  <span>{topic.trigger}</span>
                  <strong>{topic.title}</strong>
                  <p>{topic.summary}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 답변 */}
        <section className="diagnosis-section section" aria-labelledby="diagnosis-answer-title">
          <div className="section-heading">
            <h2 id="diagnosis-answer-title">답변</h2>
            <p>선택한 증상에 따라 바로 확인해야 할 포인트를 정리합니다.</p>
          </div>

          <article className="diagnosis-answer-card">
            <div className="diagnosis-answer-header">
              <span className="admin-kicker">
                <CheckCircle2 size={16} />
                {selectedTopic.trigger}
              </span>
              <h3>{selectedTopic.title}</h3>
              <p>{selectedTopic.summary}</p>
            </div>

            <div className="diagnosis-answer-grid">
              <div className="diagnosis-answer-panel">
                <strong>가능한 원인</strong>
                <ul>
                  {selectedTopic.likelyCauses.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="diagnosis-answer-panel">
                <strong>먼저 확인할 것</strong>
                <ul>
                  {selectedTopic.firstChecks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="diagnosis-answer-note">
              <strong>이럴 때 상담하세요</strong>
              <p>{selectedTopic.whenToCall}</p>
            </div>

            <div className="hero-actions">
              <a className="primary-button" href={selectedTopic.ctaHref}>
                <ArrowUpRight size={20} />
                {selectedTopic.ctaLabel}
              </a>
              <a className="secondary-button" href="/estimate">
                견적상담 페이지
              </a>
            </div>
          </article>
        </section>
      </main>
      <button
        className="diagnosis-back-float"
        type="button"
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
            return;
          }
          window.location.href = "/";
        }}
        aria-label="이전 페이지로 돌아가기"
      >
        <ChevronLeft size={18} />
        이전 페이지
      </button>
    </>
  );
}
