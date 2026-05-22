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
          const items = Array.isArray(data.items) ? data.items.slice(0, 6) : [];
          const enrichedItems = await Promise.all(
            items.map(async (item: { link: string }) => ({
              ...item,
              image: await resolveBlogImage(item.link)
            }))
          );
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ items: enrichedItems, source: "naver" }));
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
          attachments?: Array<{ name?: string; url?: string; type?: string }>;
          intake?: Record<string, unknown>;
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
        const attachments = Array.isArray(payload.attachments)
          ? payload.attachments
              .map((item) => ({
                name: String(item?.name || "").trim(),
                url: String(item?.url || "").trim(),
                type: String(item?.type || "").trim()
              }))
              .filter((item) => item.url)
          : [];
        const intake = payload.intake && typeof payload.intake === "object" ? payload.intake : {};
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
            attachments,
            intake,
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
                  ${
                    formatIntakeSummary(intake)
                      ? `<p><strong>설문 요약:</strong><br />${formatIntakeSummary(intake)}</p>`
                      : ""
                  }
                  ${
                    attachments.length
                      ? `
                        <p><strong>첨부사진:</strong></p>
                        <ul style="padding-left: 18px;">
                          ${attachments
                            .map(
                              (attachment) =>
                                `<li><a href="${escapeHtml(attachment.url)}" target="_blank" rel="noreferrer">${escapeHtml(
                                  attachment.name || "첨부파일"
                                )}</a></li>`
                            )
                            .join("")}
                        </ul>
                      `
                      : ""
                  }
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

function naverGeocodeApi(): Plugin {
  return {
    name: "naver-geocode-api",
    configureServer(server) {
      server.middlewares.use("/api/naver-geocode", async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const clientId = env.NAVER_CLIENT_ID;
        const clientSecret = env.NAVER_CLIENT_SECRET;
        const address = new URL(req.url || "", "http://localhost").searchParams.get("address") || "";

        if (!clientId || !clientSecret) {
          res.statusCode = 503;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "missing_naver_credentials" }));
          return;
        }

        if (!address.trim()) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: "missing_address" }));
          return;
        }

        try {
          const response = await fetch(`https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
            headers: {
              "x-ncp-apigw-api-key-id": clientId,
              "x-ncp-apigw-api-key": clientSecret,
              Accept: "application/json"
            }
          });

          if (!response.ok) {
            throw new Error(`Naver geocode returned ${response.status}`);
          }

          const data = await response.json();
          const firstAddress = Array.isArray(data.addresses) ? data.addresses[0] : undefined;
          const lat = Number(firstAddress?.y);
          const lng = Number(firstAddress?.x);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            throw new Error("Geocoding response missing coordinates");
          }

          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ lat, lng }));
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: String(error) }));
        }
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

async function resolveBlogImage(link: string) {
  try {
    const response = await fetch(link, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) return undefined;

    const html = await response.text();
    return pickBestBlogImage(extractImageCandidates(html));
  } catch {
    return undefined;
  }
}

function extractImageCandidates(html: string) {
  const candidates = new Set<string>();
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
    /<article[\s\S]*?<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi,
    /<div[^>]+class=["'][^"']*(?:post|content|se-container)[^"']*["'][\s\S]*?<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi,
    /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html))) {
      const url = decodeHtml(match[1]);
      if (!isLikelyBlogImage(url)) continue;
      candidates.add(url);
    }
  }

  return Array.from(candidates);
}

function pickBestBlogImage(candidates: string[]) {
  return candidates.find((url) => !isLikelyPlaceholderImage(url)) ?? candidates[0];
}

function isLikelyBlogImage(url: string) {
  return (
    !/blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url) &&
    /^https?:\/\//i.test(url)
  );
}

function isLikelyPlaceholderImage(url: string) {
  return /blog\/logo|sp_blog|static\/blog\/img|profile|icon|emoji/i.test(url);
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function formatIntakeSummary(intake: Record<string, unknown>) {
  const entries = [
    ["집 환경", intake.propertyType],
    ["공사 유형", intake.projectType],
    ["상담 가능 시간", intake.preferredTime],
    ["예산", intake.budget],
    ["주소", intake.address]
  ]
    .filter(([, value]) => typeof value === "string" && String(value).trim())
    .map(([label, value]) => `${escapeHtml(String(label))}: ${escapeHtml(String(value))}`);

  return entries.join("<br />");
}

export default defineConfig({
  plugins: [react(), naverBlogApi(), inquiryApi(), naverGeocodeApi()]
});
