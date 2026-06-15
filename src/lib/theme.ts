/**
 * 테마(다크/라이트) 제어 유틸.
 *
 * 동작 개요
 * - 사이트 전체 테마는 <html data-theme="dark|light"> 로 제어한다.
 *   styles.css / admin.css 의 다크 규칙이 :root[data-theme="dark"] 에 매여 있다.
 * - 사용자가 명시적으로 고른 값만 localStorage 에 저장한다("light"|"dark").
 *   저장값이 없으면 "system"으로 간주하고 OS/브라우저 설정(prefers-color-scheme)을 따른다.
 * - 첫 페인트 깜빡임 방지를 위해 <head> 인라인 스크립트가 같은 규칙으로 data-theme 을
 *   먼저 주입한다(BaseLayout.astro / index.html). 이 모듈은 런타임 토글·동기화를 담당.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "jsc-theme";

const THEME_COLOR = { light: "#10284a", dark: "#0b1220" } as const;

export function getStoredPreference(): ThemePreference {
  if (typeof localStorage === "undefined") return "system";
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

/** <html data-theme> 와 theme-color 메타를 실제 적용한다. */
export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[resolved]);
}

/** 사용자의 명시적 선택을 저장하고 즉시 적용한다. "system"이면 저장값을 지운다. */
export function setThemePreference(preference: ThemePreference): ResolvedTheme {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* 저장 실패(프라이빗 모드 등)해도 적용은 진행 */
  }
  const resolved = resolveTheme(preference);
  applyTheme(resolved);
  return resolved;
}

/** 현재 DOM 에 반영된 테마를 읽는다(인라인 스크립트가 이미 설정해 둠). */
export function getCurrentResolvedTheme(): ResolvedTheme {
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark") return "dark";
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "light") return "light";
  return resolveTheme(getStoredPreference());
}
