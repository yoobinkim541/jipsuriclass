# Work Log

## 2026-08-28

### 네이버 SA 텔레그램 일일 리포트

- 네이버 Search Ads API HMAC 인증, 캠페인 목록·전일 통계·선택적 키워드 도구 조회를 VM용 Node.js runner로 추가했다.
- 노출·클릭·CTR·비용·CPC·전환을 재집계하고, 전환 추적·검색어·저CTR·비용 증가 신호를 바탕으로 규칙 기반 개선안을 생성한다.
- `--dry-run`을 제공해 Telegram 전송과 Supabase 저장 없이 인증·조회·메시지 형식을 점검할 수 있게 했다.
- `naver_sa_daily_reports` Supabase migration과 관리자 조회용 RLS 정책을 추가했다. migration은 Supabase CLI가 설치되지 않아 timestamp 규칙으로 작성했으며, SQL Editor에서 적용해야 한다.
- Oracle VM 환경변수, KST 기준 cron, 기존 Telegram polling/webhook과의 동시 운영 조건, 실패 대응 절차를 README에 구체화했다.
- 검증: `npm run test:naver-sa` 통과. 실제 SA 계정·Telegram 도착·원격 VM cron은 이 세션에 SSH/터미널이 연결되지 않아 검증하지 못했다.

### Trade-off

- 조회·저장·알림만 수행해 자동 변경 사고를 줄이는 대신, 입찰가와 예산 조정은 운영자가 직접 해야 한다.
- 규칙 기반 제안은 추가 AI 비용 없이 빠르게 동작하지만, 업종·계절성·상담 품질을 해석하지 못하므로 운영 판단을 대체하지 않는다.
- Supabase 이력 저장은 추세 비교를 가능하게 하지만 VM에 service role 키를 보관해야 하므로 `/etc/jipsuri-sa-report.env` 권한을 `600`으로 유지해야 한다.
