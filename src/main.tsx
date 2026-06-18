import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import { initContactTracking } from "./lib/analytics";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {/* Vercel Web Analytics(방문·유입·페이지뷰) + Speed Insights(웹바이탈). 익명·쿠키리스. */}
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);

// 전화·카카오톡 링크 클릭을 전역 위임 리스너로 계측(전환 경로 분석)
initContactTracking();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => undefined);
  });
}
