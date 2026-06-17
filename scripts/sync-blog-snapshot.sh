#!/usr/bin/env bash
#
# 블로그 글을 DB 스냅샷으로 동기화한다(외부 장애와 무관하게 홈·포트폴리오 표시).
# 오라클 클라우드 서버의 crontab에서 주기적으로 실행하는 용도.
#
# 환경변수:
#   BLOG_SYNC_SECRET  (필수) — Vercel의 /api/sync-blog-snapshot 의 BLOG_SYNC_SECRET 과 동일 값
#   SITE_URL          (선택) — 기본 https://www.jipsuriclass.kr
#
# 설치 예시 (오라클 서버에서):
#   1) 시크릿을 환경파일에 저장(권한 600):
#        sudo install -m 600 /dev/null /etc/jipsuri-blog-sync.env
#        echo 'BLOG_SYNC_SECRET=여기에_긴_토큰' | sudo tee /etc/jipsuri-blog-sync.env
#   2) crontab 등록 (매일 03:00 KST):
#        crontab -e
#        0 3 * * * set -a; . /etc/jipsuri-blog-sync.env; set +a; /path/to/scripts/sync-blog-snapshot.sh >> /var/log/jipsuri-blog-sync.log 2>&1
#
set -euo pipefail

SITE_URL="${SITE_URL:-https://www.jipsuriclass.kr}"

if [ -z "${BLOG_SYNC_SECRET:-}" ]; then
  echo "[sync-blog-snapshot] BLOG_SYNC_SECRET 환경변수가 필요합니다." >&2
  exit 1
fi

echo "[sync-blog-snapshot] $(date -u +%Y-%m-%dT%H:%M:%SZ) 동기화 시작 → ${SITE_URL}"

# -f: HTTP 4xx/5xx에서 실패 처리, -sS: 진행바 숨기되 에러는 표시
http_body="$(curl -fsS --max-time 60 -X POST "${SITE_URL}/api/sync-blog-snapshot" \
  -H "x-sync-secret: ${BLOG_SYNC_SECRET}")"

echo "[sync-blog-snapshot] 완료: ${http_body}"
