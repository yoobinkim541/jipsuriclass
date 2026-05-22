import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

function naverBlogApi(): Plugin {
  return {
    name: "naver-blog-api",
    configureServer(server) {
      server.middlewares.use("/api/naver-blog", async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const clientId = env.NAVER_CLIENT_ID;
        const clientSecret = env.NAVER_CLIENT_SECRET;
        const blogId = env.NAVER_BLOG_ID || "집수리클라쓰";
        const query = encodeURIComponent(`${blogId} 집수리 누수 복구`);

        if (!clientId || !clientSecret) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ items: [], source: "fallback", reason: "missing_naver_credentials" }));
          return;
        }

        try {
          const response = await fetch(
            `https://openapi.naver.com/v1/search/blog.json?query=${query}&display=6&sort=date`,
            {
              headers: {
                "X-Naver-Client-Id": clientId,
                "X-Naver-Client-Secret": clientSecret
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Naver API returned ${response.status}`);
          }

          const data = await response.json();
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ items: data.items ?? [], source: "naver" }));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ items: [], source: "fallback", reason: String(error) }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), naverBlogApi()]
});
