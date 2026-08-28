# 네이버 SA 텔레그램 일일 리포트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오라클 VM cron에서 네이버 검색광고 전일 성과를 조회·분석하고 집수리클라쓰 텔레그램 채팅방으로 보내며, 선택적으로 Supabase에 일별 이력을 저장한다.

**Architecture:** 네이버 SA API, 분석/포맷, Supabase REST 저장, Telegram Bot API를 작은 ESM 모듈로 분리하고 `scripts/naver-sa-report.mjs`가 이를 조합한다. 이 저장소에는 외부 VM 봇 본체가 없으므로 기존 봇 polling/webhook을 변경하지 않고 같은 봇 토큰으로 호출 가능한 독립 실행 러너를 제공한다.

**Tech Stack:** Node.js 20+ built-in `fetch`, `node:crypto`, Node test runner, Supabase PostgREST, Telegram Bot API, Naver Search Ads API.

**Spec:** `docs/superpowers/specs/2026-08-28-naver-sa-telegram-report-design.md`

## Global Constraints

- 네이버 API 서명은 `timestamp.method.uri`를 secret key로 HMAC-SHA256 후 Base64 인코딩한다.
- SA API는 조회 전용으로만 호출하며 캠페인·키워드 변경 API를 호출하지 않는다.
- `NAVER_SA_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`는 브라우저 코드나 로그에 노출하지 않는다.
- 키워드 도구는 `NAVER_SA_KEYWORD_HINTS`가 있을 때만 호출해 요청량을 제한한다.
- Supabase public 테이블은 RLS를 활성화하고 authenticated 일반 사용자 쓰기를 허용하지 않는다.
- 운영 날짜와 cron 예시는 `Asia/Seoul` 기준으로 문서화한다.

---

### Task 1: 테스트 기반 SA 클라이언트와 분석 모듈

**Files:**
- Create: `scripts/lib/naver-search-ad.mjs`
- Create: `scripts/lib/naver-sa-report.mjs`
- Create: `tests/naver-sa-report.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `createNaverSearchAdClient(config)`, `signRequest({ timestamp, method, uri, secretKey })`, `summarizeCampaignStats(campaigns, stats)`, `buildRecommendations(summary, history)`, `formatReportMessage(report)`, `formatKstDate(date)`.
- `getStats({ ids, since, until })`는 `{ data: Array<Record<string, unknown>> }` 응답을 내부적으로 처리하고 통계 행 배열을 반환한다.

- [x] **Step 1: Write the failing tests**

  `tests/naver-sa-report.test.mjs`에 다음 동작을 먼저 작성한다.

  ```js
  test('signs the method and URI without query parameters', () => {
    assert.equal(
      signRequest({ timestamp: '1700000000000', method: 'GET', uri: '/stats', secretKey: 'test-secret' }),
      'asZJ8mLjcxcEUkTtL6JvKk2WEPrOg6EVKOxuU5K5lC8='
    );
  });

  test('serializes repeated ids and JSON stats fields', async () => {
    const requests = [];
    const client = createNaverSearchAdClient({
      accessLicense: 'license', secretKey: 'secret', customerId: '123', now: () => 1700000000000,
      fetchImpl: async (url, options) => {
        requests.push({ url, options });
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      },
    });
    await client.getStats({ ids: ['cmp-1', 'cmp-2'], since: '2026-08-27', until: '2026-08-27' });
    assert.match(requests[0].url, /ids=cmp-1&ids=cmp-2/);
    assert.match(requests[0].url, /fields=%5B%22impCnt%22/);
    assert.equal(requests[0].options.headers['X-Customer'], '123');
  });

  test('aggregates campaign stats and recalculates CTR and CPC', () => {
    const summary = summarizeCampaignStats(
      [{ nccCampaignId: 'cmp-1', name: '누수 캠페인' }],
      [{ id: 'cmp-1', impCnt: 1000, clkCnt: 20, salesAmt: 5000, ccnt: 2 }],
    );
    assert.deepEqual(summary.totals, {
      impressions: 1000, clicks: 20, cost: 5000, conversions: 2,
      ctr: 2, cpc: 2500, costPerConversion: 2500,
    });
  });

  test('recommends landing and tracking checks when traffic has no conversion', () => {
    const recommendations = buildRecommendations({
      totals: { impressions: 500, clicks: 8, cost: 16000, conversions: 0, ctr: 1.6, cpc: 2000 },
      campaigns: [],
    }, []);
    assert.ok(recommendations.some((item) => item.includes('전환')));
  });

  test('formats a bounded Korean report message', () => {
    const message = formatReportMessage({
      reportDate: '2026-08-27',
      summary: { totals: { impressions: 100, clicks: 2, cost: 1000, conversions: 0, ctr: 2, cpc: 500, costPerConversion: 0 }, campaigns: [] },
      recommendations: ['전환 추적을 확인하세요.'], keywordIdeas: [],
    });
    assert.match(message, /네이버 광고 일일 리포트/);
    assert.match(message, /전환 추적/);
    assert.ok(message.length <= 4096);
  });
  ```

- [x] **Step 2: Run tests to verify they fail**

  Run `npm run test:naver-sa`.

  Expected: FAIL because the new modules and package script do not exist yet. If the signature fixture does not match the implementation-independent HMAC value, correct the fixture by calculating it once with the documented algorithm before implementing production code.

- [x] **Step 3: Implement the minimal modules**

  In `scripts/lib/naver-search-ad.mjs`, use `createHmac('sha256', secretKey)` with the raw secret string, sign only `timestamp.method.uri`, create `X-Timestamp`, `X-API-KEY`, `X-Customer`, and `X-Signature`, and encode query arrays as repeated parameters. Implement `listCampaigns`, `getStats`, and `getRelatedKeywords`; retry 429/5xx twice with injectable sleep and never print headers.

  In `scripts/lib/naver-sa-report.mjs`, parse numeric API values safely, map `nccCampaignId` to names, sum `impCnt`, `clkCnt`, `salesAmt`, and `ccnt`, then recompute CTR/CPC/CPA. Add recommendations for zero impressions, impressions without clicks, cost with zero conversions, low CTR with enough impressions, and a material cost/click deterioration versus supplied history. Format a Korean plain-text message capped at 4096 characters.

  Add `test:naver-sa` and `report:naver-sa` scripts to `package.json` without adding a dependency.

- [x] **Step 4: Run tests to verify they pass**

  Run `npm run test:naver-sa` and then `npm run build`.

  Expected: all new tests pass and the Astro production build remains successful.

### Task 2: Telegram transport, Supabase storage, and CLI runner

**Files:**
- Create: `scripts/lib/telegram.mjs`
- Create: `scripts/lib/report-storage.mjs`
- Create: `scripts/naver-sa-report.mjs`
- Modify: `tests/naver-sa-report.test.mjs`

**Interfaces:**
- Produces `sendTelegramMessage({ token, chatId, text, fetchImpl })`, `createReportStorage({ supabaseUrl, serviceRoleKey, fetchImpl })`, and `runReport({ env, argv, fetchImpl, now })`.
- `runReport` reads `NAVER_SA_*`, `TELEGRAM_REPORT_CHAT_ID` (falling back to `TELEGRAM_CHAT_ID`), and optional `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`; `--dry-run` prints the report and skips Telegram and storage writes.

- [x] **Step 1: Write failing transport and runner tests**

  Add tests that provide a fake fetch and assert Telegram receives a `POST` with `{ chat_id, text, disable_web_page_preview: true }`, while a `--dry-run` run performs SA reads but no Telegram request. Add a storage test that asserts the Supabase upsert uses `Prefer: resolution=merge-duplicates` and does not include a service key in the request body.

- [x] **Step 2: Run tests to verify they fail**

  Run `npm run test:naver-sa`.

  Expected: FAIL with missing transport/storage/runner exports.

- [x] **Step 3: Implement transport, storage, and runner**

  Keep Telegram as a one-way Bot API call so it can coexist with the existing bot only when that bot has one polling/webhook consumer. Use `POST https://api.telegram.org/bot<token>/sendMessage` and throw sanitized errors for non-2xx responses.

  Store one row per `report_date` and customer ID. Before upsert, read at most seven prior rows for trend comparison. Skip storage only when both Supabase variables are absent; fail when only one is configured. Use KST yesterday by default, accept `--date=YYYY-MM-DD`, and allow `--dry-run`.

  The runner must call only `listCampaigns`, one `getStats`, and optional one `getRelatedKeywords`, then persist before sending Telegram. Exit non-zero on missing required credentials or failed external calls.

- [x] **Step 4: Run tests to verify they pass**

  Run `npm run test:naver-sa`.

  Expected: all client, analysis, storage, Telegram, and dry-run tests pass.

### Task 3: RLS migration and environment documentation

**Files:**
- Create: `supabase/migrations/<generated-timestamp>_naver_sa_daily_reports.sql`
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces table `public.naver_sa_daily_reports` with unique `(report_date, customer_id)` and JSONB totals/campaigns/recommendations/keyword ideas.

- [x] **Step 1: Create the migration through the Supabase CLI when available**

  Run `supabase --version` and then `supabase migration new naver_sa_daily_reports` when the CLI is installed. In this workspace the CLI is unavailable, so use the repository's existing timestamped migration naming convention and record that the SQL still needs to be applied in Supabase SQL Editor.

- [x] **Step 2: Write the migration and verify its security shape**

  Add an idempotent table definition, `alter table ... enable row level security`, no anon grants, authenticated select grant, and an admin-only select policy using `private.is_admin_user()`. Keep insert/update available only to the VM service-role request. Add an index on `(customer_id, report_date desc)`.

  Review the migration for the Supabase security checklist: no service key in frontend variables, no `SECURITY DEFINER`, and no policy that grants authenticated users access without the admin predicate.

- [x] **Step 3: Document VM setup and daily operations**

  Add these variables to `.env.example` and the README:

  ```env
  NAVER_SA_ACCESS_LICENSE=
  NAVER_SA_SECRET_KEY=
  NAVER_SA_CUSTOMER_ID=
  NAVER_SA_API_BASE_URL=https://api.searchad.naver.com
  NAVER_SA_KEYWORD_HINTS=누수,화장실누수
  TELEGRAM_REPORT_CHAT_ID=
  SUPABASE_SERVICE_ROLE_KEY=
  ```

  Explain that `NAVER_SA_KEYWORD_HINTS` is optional and rate-limited, `TELEGRAM_REPORT_CHAT_ID` can be the existing `TELEGRAM_CHAT_ID`, the bot token is never put in browser env, and the external bot must not start a second `getUpdates` polling consumer. Include install, manual dry-run, real run, log inspection, cron at `03:10 KST`, retry/failure behavior, and the fact that remote VM deployment cannot be performed from this repository session.

- [x] **Step 4: Run documentation and migration checks**

  Run `npm run test:naver-sa`, `npm run build`, `git diff --check`, and inspect `git diff -- supabase/migrations .env.example README.md` for secret values and incorrect paths.

### Task 4: Work log and final verification

**Files:**
- Create or Modify: `WORK_LOG.md`

- [x] **Step 1: Record the implementation**

  Add the date, scope, new runner command, database migration requirement, verification commands, and the trade-off that the runner is intentionally read-only and requires a VM-side deployment/cron step.

- [x] **Step 2: Run the full verification set**

  Run `npm run test:naver-sa`, `npm run build`, and `git diff --check`. Confirm `git status -sb` shows only intended files and report that live SA/Telegram delivery and remote VM status were not verified without attached VM access.

- [x] **Step 3: Self-review the implementation**

  Check that all spec sections have an implementation, no secret appears in tracked files, no public endpoint exposes SA credentials, and all recommendation wording distinguishes missing conversion tracking from a confirmed zero-conversion campaign.
