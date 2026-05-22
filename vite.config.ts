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
        const blogId = env.NAVER_BLOG_ID || "it77khy";
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

function inquiryApi(): Plugin {
  return {
    name: "inquiry-api",
    configureServer(server) {
      server.middlewares.use("/api/inquiries", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }

        const env = loadEnv(server.config.mode, process.cwd(), "");
        const supabaseUrl = env.VITE_SUPABASE_URL;
        const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const resendApiKey = env.RESEND_API_KEY;
        const adminEmail = env.ADMIN_EMAIL;

        if (!supabaseUrl || !supabasePublishableKey) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Missing Supabase configuration" }));
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        let payload: {
          name?: string;
          phone?: string;
          serviceArea?: string;
          message?: string;
          userId?: string | null;
          userEmail?: string | null;
        } = {};

        try {
          payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Invalid JSON payload" }));
          return;
        }

        const name = String(payload.name || "").trim();
        const phone = String(payload.phone || "").trim();
        const serviceArea = String(payload.serviceArea || "").trim();
        const message = String(payload.message || "").trim();
        const userId = payload.userId ? String(payload.userId).trim() : null;
        const userEmail = payload.userEmail ? String(payload.userEmail).trim() : null;

        if (!name || !phone || !message) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "Required fields missing" }));
          return;
        }

        const authorization =
          typeof req.headers.authorization === "string" && req.headers.authorization
            ? req.headers.authorization
            : `Bearer ${supabasePublishableKey}`;

        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/inquiries`, {
          method: "POST",
          headers: {
            apikey: supabasePublishableKey,
            Authorization: authorization,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            name,
            phone,
            service_area: serviceArea || null,
            message,
            user_id: userId,
            user_email: userEmail,
            status: "new",
            source: "website"
          })
        });

        if (!insertResponse.ok) {
          res.statusCode = insertResponse.status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: await insertResponse.text() }));
          return;
        }

        let emailSent = false;
        if (resendApiKey && adminEmail) {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: "집수리클라쓰 <onboarding@resend.dev>",
              to: [adminEmail],
              subject: `새 견적 문의: ${name}`,
              html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                  <h2 style="margin: 0 0 12px;">새 견적 문의</h2>
                  <p><strong>이름:</strong> ${escapeHtml(name)}</p>
                  <p><strong>연락처:</strong> ${escapeHtml(phone)}</p>
                  <p><strong>지역:</strong> ${escapeHtml(serviceArea || "-")}</p>
                  <p><strong>이메일:</strong> ${escapeHtml(userEmail || "-")}</p>
                  <p><strong>문의내용:</strong></p>
                  <pre style="white-space: pre-wrap; background: #f9fafb; padding: 12px; border-radius: 8px;">${escapeHtml(message)}</pre>
                </div>
              `
            })
          });
          emailSent = emailResponse.ok;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ ok: true, emailSent }));
      });
    }
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default defineConfig({
  plugins: [react(), naverBlogApi(), inquiryApi()]
});
