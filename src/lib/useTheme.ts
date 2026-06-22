import { useCallback, useEffect, useState } from "react";
import {
  getCurrentResolvedTheme,
  getStoredPreference,
  getSystemTheme,
  setThemePreference,
  type ResolvedTheme
} from "./theme";

/**
 * 다크/라이트 토글 훅.
 * - resolved: 현재 적용된 테마
 * - toggle(): 라이트↔다크 전환(명시 선택으로 저장됨)
 * - "system" 상태(저장값 없음)에서는 OS 설정 변경을 실시간 반영한다.
 */
export function useTheme() {
  // SSR(빌드)에서 getCurrentResolvedTheme()는 항상 "light"(document 없음)를 반환하므로,
  // 첫 렌더도 동일하게 "light"로 시작해야 하이드레이션이 일치한다. 초기화에서 DOM을 읽으면
  // 다크 사용자의 클라 첫 렌더가 서버 HTML("light")과 달라 토글 버튼이 하이드레이션 불일치.
  // 실제 테마는 아래 useEffect가 마운트 직후 반영한다(SiteHeaderIsland와 동일 패턴).
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  useEffect(() => {
    // 마운트 시 DOM 의 실제 값과 동기화(SSR 초기 상태 보정).
    setResolved(getCurrentResolvedTheme());

    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (getStoredPreference() !== "system") return;
      const next = getSystemTheme();
      document.documentElement.dataset.theme = next;
      setResolved(next);
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const toggle = useCallback(() => {
    setResolved((current) => setThemePreference(current === "dark" ? "light" : "dark"));
  }, []);

  return { resolved, toggle };
}
