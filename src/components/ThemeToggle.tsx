import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/useTheme";

/**
 * 다크/라이트 전환 버튼. 사이트 전체 테마(<html data-theme>)를 토글한다.
 * className 으로 호스트(마이페이지 헤더·어드민 탑바 등)에 맞춰 스타일 보강 가능.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const isDark = resolved === "dark";
  const label = isDark ? "라이트 모드로 전환" : "다크 모드로 전환";

  return (
    <button
      type="button"
      className={className ? `theme-toggle ${className}` : "theme-toggle"}
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      <span className="theme-toggle__text">{isDark ? "라이트 모드" : "다크 모드"}</span>
    </button>
  );
}
