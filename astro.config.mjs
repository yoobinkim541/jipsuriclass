// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

// 마이그레이션 중에는 정적 출력이 기본이고, 미이전 경로를 받는 SPA catch-all만
// 라우트 단위로 prerender=false(온디맨드 SSR)로 둔다. (계획 D-0)
export default defineConfig({
  output: "static",
  adapter: vercel(),
  integrations: [react()],
  vite: {
    // 기존 앱이 import.meta.env.VITE_* 를 쓰므로 클라이언트 노출 prefix를 유지한다. (계획 D-1)
    envPrefix: ["VITE_", "PUBLIC_"]
  }
});
