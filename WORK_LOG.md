# Work Log

## 2026-08-28

### 네이버 SA 텔레그램 일일 리포트

- 네이버 Search Ads API HMAC 인증, 캠페인 목록·전일 통계·선택적 키워드 도구 조회를 VM용 Node.js runner로 추가했다.
- 노출·클릭·CTR·비용·CPC·전환을 재집계하고, 전환 추적·검색어·저CTR·비용 증가 신호를 바탕으로 규칙 기반 개선안을 생성한다.
- `--dry-run`을 제공해 Telegram 전송과 Supabase 저장 없이 인증·조회·메시지 형식을 점검할 수 있게 했다.
- `naver_sa_daily_reports` Supabase migration과 관리자 조회용 RLS 정책을 추가했다. migration은 Supabase CLI가 설치되지 않아 timestamp 규칙으로 작성했으며, SQL Editor에서 적용해야 한다.
- Oracle VM 환경변수, KST 기준 cron, 기존 Telegram polling/webhook과의 동시 운영 조건, 실패 대응 절차를 README에 구체화했다.
- 검증: `npm run test:naver-sa` 통과. 실제 SA 계정·Telegram 도착·원격 VM cron은 이 세션에 SSH/터미널이 연결되지 않아 검증하지 못했다.
- Hermes VM 확인에서 `NAVER_SA_CUSTOMER_ID`가 숫자 ID가 아닌 라벨 포함 값으로 설정되어 403이 발생함을 확인했고, env/.env.local 권한을 `600`으로 낮췄다. 코드에는 숫자 전용 사전 검증을 추가했다.

### Trade-off

- 조회·저장·알림만 수행해 자동 변경 사고를 줄이는 대신, 입찰가와 예산 조정은 운영자가 직접 해야 한다.
- 규칙 기반 제안은 추가 AI 비용 없이 빠르게 동작하지만, 업종·계절성·상담 품질을 해석하지 못하므로 운영 판단을 대체하지 않는다.
- Supabase 이력 저장은 추세 비교를 가능하게 하지만 VM에 service role 키를 보관해야 하므로 `/etc/jipsuri-sa-report.env` 권한을 `600`으로 유지해야 한다.

## 2026-09-03 — 네이버 SA 리포트: 무음 실패 수정 + 크론 시각 조정

Changed files:
- `scripts/lib/naver-search-ad.mjs`, `scripts/naver-sa-report.mjs`, `tests/naver-sa-report.test.mjs`
- (git 비관리) `~/.crontab`(운영 크론), `stock-report/deploy/crontab.stock-report`

Root cause (실측 확인, 라이브 API로 재현):
- **주말에 알림이 안 옴**: 로그(`/tmp/jipsuri-sa-report.log`)에서 8/30(일)·8/31(월) 대상 리포트가 `[naver-sa-report] fetch failed`로 실패. net-level fetch 예외는 HTTP 429/5xx 재시도 로직을 안 타고 즉시 throw되며, 스크립트는 **성공했을 때만** 텔레그램을 보내는 구조라 실패가 완전 무음이었다(재시도 없음 + 실패알림 없음 + `error.cause` 로깅 없음).
- **클릭·광고비가 안 보임**: 라이브 API를 직접 조회해 확인 — 단일일(since=until=D-1) 조회 시 클릭·비용이 0으로 오지만, 같은 날짜를 포함한 더 넓은 범위(D-2~D-1)로 조회하면 정상 값이 나옴(예: 9/2 단일=클릭0/0원, 9/1~9/2 합산=클릭3/7,280원). 네이버 SA 클릭·비용 정산이 자정 직후엔 미확정이라, 크론이 KST 03:10에 조회하면 노출만 먼저 반영되고 클릭·비용은 비어 있음.

Implemented behavior:
- `naver-search-ad.mjs`: `request()`의 `fetchImpl` 호출을 try/catch로 감싸 net-level 실패(DNS·타임아웃·연결끊김 등)도 HTTP 429/5xx와 동일하게 지수백오프 재시도. 재시도 소진 시 `NaverSearchAdError`가 원본 에러를 `cause`로 보존(클래스에 `cause` 옵션 추가).
- `naver-sa-report.mjs`: 본문을 try/catch로 감싸 실패 시(dry-run 제외) 텔레그램으로 "⚠️ 네이버 광고 리포트 생성 실패 (날짜)\n원인" 알림을 시도(그 알림 자체가 실패해도 원래 에러는 그대로 던져 크론이 실패로 기록됨). 최상위 콘솔 로그도 `error.cause`를 포함하도록 변경.
- 운영 크론: `10 18 * * *`(03:10 KST) → `30 1 * * *`(10:30 KST)로 변경. `stock-report/deploy/crontab.stock-report`(단일 소스 파일) 갱신 + 실제 crontab도 안전하게 패치 적용(다른 크론 유실 없음, 라인 수 157=157로 검증). ※ 배치본 파일에 myWiki 정리 크론이 누락돼 있던 기존 드리프트를 발견(이번 작업 범위 밖이라 별도 미수정, 보고만).

Verification:
- `npm run test:naver-sa`(17건, 신규 4건 포함) 통과, `npx tsc --noEmit`·`npm run build` 통과.
- 라이브 API 직접 조회로 근본 원인 재현·확인(자격증명은 재사용만, 값 미노출).
- 크론 변경 후 `crontab -l`로 jipsuri 라인·myWiki 라인·전체 줄수 검증 완료.
