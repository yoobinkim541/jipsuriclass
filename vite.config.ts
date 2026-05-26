import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { landingPageDefinitions, type LandingPageDefinition } from "./src/landingPages";
import { getLegacyPricePageConfigs, getSeoConfigForPath, siteName, siteUrl } from "./src/seo";
import { servicePricingRegistry } from "./src/pricing/registry";

function naverBlogApi(): Plugin {
  return {
    name: "naver-blog-api",
    configureServer(server) {
      server.middlewares.use("/api/naver-blog", async (req, res) => {
        const env = loadEnv(server.config.mode, process.cwd(), "");
        const blogId = env.NAVER_BLOG_ID || "it77khy";

        try {
          const rssResponse = await fetch(`https://rss.blog.naver.com/${blogId}.xml`, {
            headers: { Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8" }
          });

          if (!rssResponse.ok) {
            throw new Error(`Naver RSS returned ${rssResponse.status}`);
          }

          const xml = await rssResponse.text();
          const termsRaw = new URL(req.url || "", "http://localhost").searchParams.get("terms") || "";
          const terms = termsRaw.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
          const allItems = parseRssItems(xml).slice(0, 30);

          // When terms are provided, only return posts that match — never fall back to unrelated posts
          const scored = allItems.map((item) => ({
            item,
            score: scoreRssItem(item, terms)
          }));
          const pool = terms.length ? scored.filter((e) => e.score > 0) : scored;
          const ranked = pool.sort((a, b) => b.score - a.score).map((e) => e.item).slice(0, 6);

          const enrichedItems = await Promise.all(
            ranked.map(async (item) => ({
              ...item,
              image: item.image ?? (await resolveBlogImage(item.link)) ?? undefined
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

function seoStaticPages(): Plugin {
  return {
    name: "seo-static-pages",
    generateBundle(_, bundle) {
      const bundleEntries = Object.values(bundle) as any[];
      const entryChunk = bundleEntries.find((item) => item.type === "chunk" && item.isEntry) as { fileName?: string } | undefined;
      if (!entryChunk) return;

      if (!entryChunk.fileName) return;
      const scriptSrc = `/${entryChunk.fileName}`;
      const styleHrefs = bundleEntries
        .filter((item) => item.type === "asset" && typeof item.fileName === "string" && item.fileName.endsWith(".css"))
        .map((item) => `/${String(item.fileName)}`);

      const routes = [
        ...landingPageDefinitions.map((page) => ({
          path: page.path,
          seo: getSeoConfigForPath(page.path, page),
          body: renderLandingPageBody(page)
        })),
        ...Object.entries(servicePricingRegistry).map(([servicePath, config]) => ({
          path: config.pricingPagePath,
          seo: getSeoConfigForPath(config.pricingPagePath),
          body: renderPricingPageBody(servicePath, config.serviceName, config.disclaimer, config.categories)
        })),
        ...getLegacyPricePageConfigs().map((config) => ({
          path: config.path,
          seo: getSeoConfigForPath(config.path),
          body: renderLegacyPricingPageBody(config.title, config.description, config.note)
        })),
        ...[
          "/estimate",
          "/diagnosis",
          "/privacy",
          "/login",
          "/admin",
          "/admin/login",
          "/account",
          "/mypage"
        ].map((path) => ({
          path,
          seo: getSeoConfigForPath(path),
          body: renderUtilityPageBody(getSeoConfigForPath(path))
        }))
      ];

      for (const route of routes) {
        if (route.path === "/") continue;
        this.emitFile({
          type: "asset",
          fileName: routeToHtmlFile(route.path),
          source: renderStaticHtml({
            seo: route.seo,
            body: route.body,
            scriptSrc,
            styleHrefs
          })
        });
      }
    }
  };
}

function renderStaticHtml({
  seo,
  body,
  scriptSrc,
  styleHrefs
}: {
  seo: ReturnType<typeof getSeoConfigForPath>;
  body: string;
  scriptSrc: string;
  styleHrefs: string[];
}) {
  const robots = seo.noindex ? "noindex,nofollow" : "index,follow";
  const jsonLd = seo.jsonLd?.length
    ? `<script type="application/ld+json">${JSON.stringify(seo.jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";
  const styleLinks = styleHrefs.map((href) => `<link rel="stylesheet" href="${href}" />`).join("");

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${robots}" />
    <meta property="og:locale" content="ko_KR" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${escapeHtml(siteName)}" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:image" content="${escapeHtml(seo.image ?? `${siteUrl}/og-image.png`)}" />
    <meta property="og:url" content="${escapeHtml(`${siteUrl}${seo.path}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(seo.image ?? `${siteUrl}/og-image.png`)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
    <link rel="icon" type="image/png" href="/icons/icon.png" />
    <link rel="apple-touch-icon" href="/icons/icon.png" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="canonical" href="${escapeHtml(`${siteUrl}${seo.path}`)}" />
    <title>${escapeHtml(seo.title)}</title>
    ${styleLinks}
    ${jsonLd}
  </head>
  <body>
    <div id="root">${body}</div>
    <script type="module" src="${scriptSrc}"></script>
  </body>
</html>`;
}

function renderLandingPageBody(page: LandingPageDefinition) {
  return `
    <main data-static-route="${escapeHtml(page.path)}">
      <section>
        <p>${escapeHtml(page.categoryLabel)}</p>
        <h1>${escapeHtml(page.heroTitle)}</h1>
        <p>${escapeHtml(page.heroDescription)}</p>
        <ul>${page.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
      <section>
        <h2>${escapeHtml(page.pointsTitle)}</h2>
        <ol>${page.points.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </section>
      <section>
        <h2>자주 묻는 질문</h2>
        ${page.faq
          .map(
            (item) => `
              <article>
                <h3>${escapeHtml(item.question)}</h3>
                <p>${escapeHtml(item.answer)}</p>
              </article>`
          )
          .join("")}
      </section>
      <section>
        <h2>관련 페이지</h2>
        <ul>${page.relatedLinks.map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`).join("")}</ul>
      </section>
    </main>`;
}

function renderPricingPageBody(
  servicePath: string,
  serviceName: string,
  disclaimer: string,
  categories: Array<{ title: string; note?: string; items: Array<{ name: string; unit: string; priceLabel: string; materialNote: string | null }> }>
) {
  return `
    <main data-static-route="${escapeHtml(servicePath)}">
      <section>
        <p>가격표</p>
        <h1>${escapeHtml(serviceName)} 가격표</h1>
        <p>${escapeHtml(disclaimer)}</p>
      </section>
      ${categories
        .map(
          (category) => `
            <section>
              <h2>${escapeHtml(category.title)}</h2>
              ${category.note ? `<p>${escapeHtml(category.note)}</p>` : ""}
              <ul>
                ${category.items
                  .map(
                    (item) => `
                      <li>
                        <strong>${escapeHtml(item.name)}</strong>
                        <span>${escapeHtml(item.priceLabel)}</span>
                        <span>${escapeHtml(item.unit)}</span>
                        ${item.materialNote ? `<small>자재 ${escapeHtml(item.materialNote)}</small>` : ""}
                      </li>`
                  )
                  .join("")}
              </ul>
            </section>`
        )
        .join("")}
    </main>`;
}

function renderLegacyPricingPageBody(title: string, description: string, note?: string) {
  return `
    <main>
      <section>
        <p>가격표</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        ${note ? `<p>${escapeHtml(note)}</p>` : ""}
      </section>
    </main>`;
}

function renderUtilityPageBody(seo: ReturnType<typeof getSeoConfigForPath>) {
  return `
    <main>
      <section>
        <h1>${escapeHtml(seo.title)}</h1>
        <p>${escapeHtml(seo.description)}</p>
      </section>
    </main>`;
}

function routeToHtmlFile(pathname: string) {
  const trimmed = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `${trimmed}/index.html` : "index.html";
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
  plugins: [react(), naverBlogApi(), inquiryApi(), naverGeocodeApi(), seoStaticPages()]
});
