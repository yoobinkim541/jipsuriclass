# 네이버 SA 텔레그램 일일 리포트 설계

## 목표

오라클 VM의 cron에서 네이버 검색광고 API를 읽기 전용으로 조회하고, 집수리클라쓰의 텔레그램 채팅방으로 전일 광고 현황과 운영 제안을 자동 전송한다. 현재 저장소에는 텔레그램 봇 본체가 없으므로 기존 봇의 polling/webhook 구현과 결합하지 않고, 같은 봇 토큰으로 호출할 수 있는 독립 Node.js 실행 파일을 제공한다.

## 사용자 흐름

1. VM cron이 `node scripts/naver-sa-report.mjs`를 매일 실행한다.
2. 실행 파일이 환경변수의 네이버 API 자격증명으로 `/ncc/campaigns`와 `/stats`를 조회한다.
3. 캠페인별 노출·클릭·CTR·비용·CPC·전환을 집계하고, 데이터가 부족하거나 비효율 신호가 있는 항목을 규칙 기반으로 제안한다.
4. Supabase 서비스 롤 키가 설정되어 있으면 일별 원본 요약과 제안을 `naver_sa_daily_reports`에 upsert한다.
5. 텔레그램 Bot API로 한 번 메시지를 전송한다. `--dry-run`에서는 외부 전송 없이 메시지만 출력한다.

## 범위

### 포함

- 네이버 Search Ads API HMAC-SHA256 인증
- 캠페인 목록과 전일 통계 조회
- 선택적 키워드 도구 조회(`NAVER_SA_KEYWORD_HINTS`가 설정된 경우만)
- 일별 캠페인 요약 및 비용·클릭·CTR·전환 기반 제안
- 선택적 Supabase 저장과 직전 데이터 기반 추세 제안
- 텔레그램 전송, 재시도, dry-run
- VM 환경변수와 cron 설치 문서

### 제외

- 캠페인·광고그룹·키워드의 생성, 수정, 입찰가 변경, 일시정지
- 웹사이트 공개 API에서 SA 비밀키를 받거나 호출하는 기능
- 외부 VM에 이미 설치된 텔레그램 봇 소스의 직접 수정
- 자동 입찰 및 자동 예산 증액

## 아키텍처

### 실행 위치

네이버 SA 비밀키와 텔레그램 봇 토큰은 브라우저나 Vercel 공개 번들에 들어가면 안 되므로 오라클 VM 환경변수에만 둔다. 문의 알림을 보내는 기존 `api/inquiries.ts` 경로는 유지하고, 광고 리포트만 VM에서 전송한다.

### 모듈 경계

- `scripts/lib/naver-search-ad.mjs`: 서명·HTTP 요청·캠페인/통계/키워드 도구 API
- `scripts/lib/naver-sa-report.mjs`: 숫자 정규화, 집계, 제안, 텔레그램 본문 포맷
- `scripts/lib/report-storage.mjs`: Supabase REST upsert 및 최근 리포트 조회
- `scripts/lib/telegram.mjs`: Bot API 메시지 전송
- `scripts/naver-sa-report.mjs`: 환경변수·CLI를 조합하는 실행 진입점

### 보안

- SA secret과 Supabase service role은 서버 전용 환경변수로만 읽는다.
- 로그와 텔레그램 본문에 자격증명, 원시 HTTP 헤더, 개인정보를 넣지 않는다.
- Supabase 테이블은 RLS를 켜고 일반 사용자 쓰기를 허용하지 않는다. 관리자 조회만 `private.is_admin_user()`로 허용한다.
- 자동화는 조회와 저장·알림만 수행하며 광고 계정 변경 API를 호출하지 않는다.

## 운영 정책

- 전일 기준 날짜는 `Asia/Seoul`로 계산한다.
- SA API 429/5xx 응답은 제한된 횟수로 지수형 지연 재시도한다.
- 키워드 도구는 호출 제한이 있으므로 환경변수가 비어 있으면 호출하지 않는다.
- Supabase 저장이 설정되어 있으면 저장 실패를 성공으로 처리하지 않고 cron을 실패시켜 누락을 알린다.
- 텔레그램 메시지는 4096자 제한에 맞춰 캠페인 상세를 제한한다.

## 성공 기준

- 고정된 테스트가 SA 서명 문자열, query 직렬화, 통계 집계, 제안 규칙, 텔레그램 요청 본문을 검증한다.
- 자격증명 없이 `--dry-run`의 순수 포맷·집계 테스트를 실행할 수 있다.
- `npm run build`와 `npm run test:naver-sa`가 통과한다.
- README에 VM 설치, 환경변수, cron, 수동 점검, 실패 대응, 같은 봇 토큰 사용 시 polling/webhook 주의사항이 구체적으로 적힌다.
