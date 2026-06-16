import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { loadNaverBlogCandidates, loadAllBlogPosts } from "./src/services/NaverBlogSource";

function naverBlogApi(): Plugin {
  return {
    name: "naver-blog-api",
    configureServer(server) {
      server.middlewares.use("/api/naver-blog", async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const blogId = env.NAVER_BLOG_ID || "it77khy";
        const search = new URL(req.url || "", "http://localhost").searchParams;
        const mode = search.get("mode") || "";
        const terms = parseTerms(search.get("terms") || "");
        const categoryNos = parseCategoryNos(search.get("categoryNos") || "");

        try {
          if (mode === "all") {
            const { items, totalCount } = await loadAllBlogPosts(blogId);
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ items, totalCount, source: "naver" }));
          } else {
            const items = await loadNaverBlogCandidates({ blogId, terms, categoryNos, limit: 6 });
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ items, source: "naver" }));
          }
        } catch (error) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ items: [], source: "fallback", reason: String(error) }));
        }
      });

      // 네이버 블로그 이미지 프록시(dev): 핫링크 차단을 피하려고 서버에서 Referer를 붙여 받아온다.
      server.middlewares.use("/api/blog-image", async (req, res) => {
        const rawUrl = (new URL(req.url || "", "http://localhost").searchParams.get("url") || "").trim();
        if (!rawUrl) {
          res.statusCode = 400;
          res.end("Missing image url");
          return;
        }
        let target: URL;
        try {
          target = new URL(rawUrl);
        } catch {
          res.statusCode = 400;
          res.end("Invalid image url");
          return;
        }
        const allowed = ["pstatic.net", "naver.net", "naver.com"].some(
          (domain) => target.hostname === domain || target.hostname.endsWith(`.${domain}`)
        );
        if (!allowed || (target.protocol !== "http:" && target.protocol !== "https:")) {
          res.statusCode = 403;
          res.end("Image host is not allowed");
          return;
        }
        try {
          const originalUrl = target.toString();
          const upgraded = new URL(originalUrl);
          const type = upgraded.searchParams.get("type");
          const isPstatic = /(?:^|\.)pstatic\.net$/i.test(upgraded.hostname);
          if (type && /^w\d*(?:_?blur)?$/i.test(type)) {
            upgraded.searchParams.set("type", "w966");
          } else if (!type && isPstatic) {
            // 썸네일 CDN은 type 파라미터가 없으면 이미지를 반환하지 않는다.
            upgraded.searchParams.set("type", "w966");
          }
          const urlVariants = upgraded.toString() === originalUrl ? [originalUrl] : [upgraded.toString(), originalUrl];

          let upstream: Response | null = null;
          for (const attempt of urlVariants) {
            for (const referer of ["https://blog.naver.com/", "https://m.blog.naver.com/"]) {
              const candidate = await fetch(attempt, {
                headers: {
                  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
                  Referer: referer,
                  "User-Agent": "Mozilla/5.0"
                }
              });
              if (candidate.ok && (candidate.headers.get("content-type") || "").startsWith("image/")) {
                upstream = candidate;
                break;
              }
            }
            if (upstream) break;
          }
          if (!upstream) {
            throw new Error("No live image variant");
          }
          const contentType = upstream.headers.get("content-type") || "image/jpeg";
          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.end(buffer);
        } catch {
          res.statusCode = 502;
          res.end("Image fetch failed");
        }
      });

      // 구글 시트 → xlsx export 프록시(dev). 시트는 '링크가 있는 모든 사용자 보기'여야 함.
      server.middlewares.use("/api/sheet-export", async (req, res) => {
        const id = (new URL(req.url || "", "http://localhost").searchParams.get("id") || "").trim();
        if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
          res.statusCode = 400;
          res.end("Invalid sheet id");
          return;
        }
        try {
          const upstream = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, {
            redirect: "follow",
            headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*" }
          });
          const contentType = upstream.headers.get("content-type") || "";
          if (!upstream.ok || contentType.includes("text/html")) {
            throw new Error(`Sheet not accessible (${upstream.status})`);
          }
          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
          res.setHeader("Cache-Control", "no-store");
          res.end(buffer);
        } catch {
          res.statusCode = 502;
          res.end("Google Sheet is not accessible.");
        }
      });

      // 견적 → 구글시트 생성: 대표님 Apps Script 웹앱으로 프록시(dev). 비밀키는 서버에서만 부착.
      server.middlewares.use("/api/create-quote-sheet", async (req, res) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "POST만 허용됩니다." }));
          return;
        }
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const webAppUrl = env.QUOTE_SHEET_WEBAPP_URL;
        const secret = env.QUOTE_SHEET_SECRET;
        if (!webAppUrl || !secret) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: "구글시트 연동 미설정(QUOTE_SHEET_WEBAPP_URL/QUOTE_SHEET_SECRET)" }));
          return;
        }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const payload = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf-8")) : {};
          const upstream = await fetch(webAppUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret, ...payload }),
            redirect: "follow"
          });
          const text = await upstream.text();
          let data: { sheetUrl?: string; pdfUrl?: string; sheetId?: string; error?: string } | null = null;
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }
          if (!upstream.ok || !data || data.error || (!data.sheetUrl && !data.pdfUrl)) {
            throw new Error(data?.error || `Apps Script 응답 오류 (${upstream.status})`);
          }
          res.end(JSON.stringify({ sheetUrl: data.sheetUrl ?? null, sheetId: data.sheetId ?? null, pdfUrl: data.pdfUrl ?? null }));
        } catch (error) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "구글시트 생성 실패" }));
        }
      });

      server.middlewares.use("/api/check-quote-sheet", async (_req, res) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const raw = env.QUOTE_SHEET_WEBAPP_URL;
        const secret = env.QUOTE_SHEET_SECRET;
        if (!raw || !secret) {
          res.end(JSON.stringify({ ok: false, state: "unconfigured", message: "환경변수 미설정(QUOTE_SHEET_WEBAPP_URL/QUOTE_SHEET_SECRET)" }));
          return;
        }
        const url = /^https?:\/\//i.test(raw) ? raw : `https://script.google.com/macros/s/${raw.replace(/^\/+|\/+$/g, "")}/exec`;
        try {
          const upstream = await fetch(url, { method: "GET", redirect: "follow" });
          const text = await upstream.text();
          let pingedOk = false;
          try {
            pingedOk = JSON.parse(text)?.ok === true;
          } catch {
            pingedOk = false;
          }
          if (pingedOk) res.end(JSON.stringify({ ok: true, state: "ok", message: "정상 연결됨" }));
          else if (upstream.status === 401 || upstream.status === 403)
            res.end(JSON.stringify({ ok: false, state: "unauthorized", message: `로그인 필요(${upstream.status}) — 웹앱 액세스 '모든 사용자' 확인` }));
          else res.end(JSON.stringify({ ok: false, state: "error", message: `웹앱 응답 이상 (HTTP ${upstream.status})` }));
        } catch (error) {
          res.end(JSON.stringify({ ok: false, state: "error", message: error instanceof Error ? error.message : "연결 실패" }));
        }
      });
    }
  };
}

function parseTerms(value: string) {
  return value
    .split(/[,\s]+/)
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function parseCategoryNos(value: string) {
  return value
    .split(/[,\s]+/)
    .map((term) => Number.parseInt(term.trim(), 10))
    .filter((term): term is number => Number.isInteger(term) && term > 0)
    .slice(0, 8);
}

function parseRssItems(xml: string) {
  type RssItem = { title: string; description: string; link: string; postdate?: string; image?: string };
  const items: RssItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml))) {
    const itemXml = match[1];
    const title = decodeXml(extractTagValue(itemXml, "title"));
    const descHtml = decodeXml(extractTagValue(itemXml, "description"));
    const description = stripHtml(descHtml);
    const link = decodeXml(extractTagValue(itemXml, "link"));
    const pubDate = extractTagValue(itemXml, "pubDate");
    const postdate = formatRssDate(pubDate);
    const image = extractRssImage(itemXml, descHtml);
    if (!title || !link) continue;
    items.push({ title, description, link, postdate, image });
  }

  return items;
}

function extractTagValue(xml: string, tag: string) {
  const pattern = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  return xml.match(pattern)?.[1]?.trim() ?? "";
}

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatRssDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return `${parsed.getFullYear()}${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}`;
}

function scoreRssItem(item: { title: string; description: string }, terms: string[]) {
  if (!terms.length) return 1;
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (item.title.toLowerCase().includes(term)) score += 14;
    if (item.description.toLowerCase().includes(term)) score += 8;
    if (haystack.includes(term)) score += 4;
  }
  return score;
}

function extractRssImage(itemXml: string, descHtml: string) {
  const thumbMatch = itemXml.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (thumbMatch?.[1]) return pickBestBlogImage([thumbMatch[1]]);
  const encMatch = itemXml.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (encMatch?.[1]) return pickBestBlogImage([encMatch[1]]);
  const imgPattern = /<img[^>]+(?:data-lazy-src|data-src|src)=["']([^"']+)["']/gi;
  const candidates: string[] = [];
  let m: RegExpExecArray | null;
  for (const src of [descHtml, itemXml]) {
    const pat = new RegExp(imgPattern.source, "gi");
    while ((m = pat.exec(src))) {
      const url = upgradeNaverBlogImageUrl(m[1]);
      if (isLikelyBlogImage(url)) candidates.push(url);
    }
  }
  return pickBestBlogImage(candidates);
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
        const clientId = env.NAVER_GEOCODE_CLIENT_ID || env.NAVER_CLIENT_ID;
        const clientSecret = env.NAVER_GEOCODE_CLIENT_SECRET || env.NAVER_CLIENT_SECRET;
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
      const url = upgradeNaverBlogImageUrl(decodeHtml(match[1]));
      if (!isLikelyBlogImage(url)) continue;
      candidates.add(url);
    }
  }

  return Array.from(candidates);
}

function pickBestBlogImage(candidates: string[]) {
  return candidates
    .map((url) => upgradeNaverBlogImageUrl(url))
    .filter((url): url is string => Boolean(url))
    .sort((left, right) => scoreBlogImage(right) - scoreBlogImage(left))
    .find((url) => !isLikelyPlaceholderImage(url));
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

function scoreBlogImage(url: string) {
  const normalized = url.toLowerCase();
  let score = 0;

  if (normalized.includes("postfiles.pstatic.net") || normalized.includes("blogfiles.pstatic.net")) score += 40;
  if (normalized.includes("mblogthumb-phinf.pstatic.net")) score += 20;
  if (/type=w(966|1200|1280|1600)/i.test(normalized)) score += 30;
  if (/type=w\d+/i.test(normalized)) score += 18;
  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(normalized)) score += 8;
  if (/thumb|logo|profile|icon|emoji/i.test(normalized)) score -= 50;

  return score;
}

function upgradeNaverBlogImageUrl(value: string) {
  const image = value.trim();
  if (!image) return "";

  try {
    const url = new URL(image.startsWith("//") ? `https:${image}` : image);
    if (!isLikelyBlogImage(url.toString())) return url.toString();

    const type = url.searchParams.get("type");
    if (type && /^w\d*(?:_?blur)?$/i.test(type)) {
      url.searchParams.set("type", "w966");
    }

    return url.toString();
  } catch {
    return image;
  }
}

function decodeHtml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function formatIntakeSummary(intake: Record<string, unknown>) {
  const addressParts = [intake.postalCode, intake.address, intake.detailAddress]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  const address = addressParts.join(" ").trim();
  const selectedRooms = Array.isArray(intake.selectedRooms)
    ? (intake.selectedRooms as unknown[])
        .filter((r): r is string => typeof r === "string" && r.trim().length > 0)
        .join(", ")
    : "";
  const otherDetail = typeof intake.otherRoomDetail === "string" ? intake.otherRoomDetail.trim() : "";

  const entries = [
    ["공간 유형", intake.spaceType],
    ["면적", intake.areaBand],
    ["거주 상태", intake.propertyStatus],
    ["수리 이유", intake.reason],
    ["수리 항목", selectedRooms || undefined],
    ["기타 상세", otherDetail || undefined],
    ["예산", intake.budget],
    ["착수 시기", intake.startTiming],
    ["주소", address || undefined]
  ]
    .filter(([, value]) => typeof value === "string" && String(value).trim())
    .map(([label, value]) => `${escapeHtml(String(label))}: ${escapeHtml(String(value))}`);

  return entries.join("<br />");
}

export default defineConfig({
  plugins: [react(), naverBlogApi(), inquiryApi(), naverGeocodeApi()]
});
