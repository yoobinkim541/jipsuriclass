# 견적서 구글시트 자동 생성 — Apps Script 연동

어드민 견적 편집기에서 **「구글시트로 발행」**을 누르면, 견적 데이터가
대표님 구글 계정의 **Apps Script 웹앱**으로 전달되어 **'견적완료건' 템플릿을 복제·작성**하고
시트/PDF 링크를 돌려받습니다.

```
[어드민 편집기] → /api/create-quote-sheet (서버, 비밀키 부착)
              → Apps Script 웹앱(doPost) → 템플릿 복제 + 값 주입 + 폴더 저장 (+PDF)
              → { sheetUrl, pdfUrl } 반환 → 문의에 링크 저장
```

## 1) 준비
- **빈 견적서 템플릿** 스프레드시트 1개 (양식만, 값 비움) → 스프레드시트 ID 확보
- **저장 폴더**(예: `견적완료건`) → 폴더 ID 확보
- **비밀키** 임의의 긴 문자열 1개 (사이트와 공유)

### 템플릿에 토큰 넣기 (한 번만)
양식의 공종 수·줄 수가 견적마다 달라서, **고정 셀 대신 토큰**을 넣으면 스크립트가 행을 자동으로 늘려 채웁니다.
각 칸에 아래 토큰을 입력해 두세요(예: 연락처 칸 C3에 `{{phone}}`):

| 위치 | 토큰 |
| --- | --- |
| 연락처 / 주소 / 견적대상 | `{{phone}}` / `{{address}}` / `{{target}}` |
| 상단 **요약표 첫 행의 '코드' 칸** | `{{summary}}` (공종별 [코드, 공사명, , 금액] 자동 채움) |
| 하단 **상세내역 첫 데이터 행의 '코드' 칸** | `{{detail}}` (공종별 헤더+항목+소계 자동 채움) |
| 공사비합계 / 이윤 / 절삭 | `{{workCost}}` / `{{profit}}` / `{{rounding}}` |
| 합계(부가세 별도) / 부가세 | `{{subtotal}}` / `{{vat}}` |
| 계약금 / 잔금 | `{{deposit}}` / `{{balance}}` |
| (선택) 이윤율 표기 / 발행일 / 메모 | `{{profitPct}}` / `{{date}}` / `{{memo}}` |

> 금액칸에 **토큰만 단독**으로 두면 숫자로 채워집니다(수식 대신 값). 문장 속에 섞어 써도 됩니다.
> 상세내역/요약표는 기본적으로 **B열부터** 채웁니다(코드=B, 공사명=C, 상세는 내용=D·단가=E·수량=F·단위=G·금액=H). 다르면 `QuoteSheet.gs`의 `DETAIL_START_COL`/`SUMMARY_START_COL`을 조정하세요.

## 2) Apps Script 배포
1. 템플릿 스프레드시트에서 **확장 프로그램 → Apps Script**
2. `QuoteSheet.gs` 내용을 붙여넣고, 상단 설정값을 채움
   - `SECRET`, `TEMPLATE_ID`, `DEST_FOLDER_ID`
   - `CELL` 셀 주소를 **실제 템플릿 양식에 맞게** 조정 (고객/견적대상/상세내역 앵커/합계/계약금·잔금/메모)
3. **배포 → 새 배포 → 유형: 웹 앱**
   - 실행: **나**, 액세스: **모든 사용자**
4. 배포 URL(`https://script.google.com/macros/s/.../exec`) 복사

## 3) 사이트 환경변수 (Vercel)
| 변수 | 값 |
| --- | --- |
| `QUOTE_SHEET_WEBAPP_URL` | 위 웹앱 배포 URL (…/exec) |
| `QUOTE_SHEET_SECRET` | `QuoteSheet.gs`의 `SECRET`과 동일 |

> 두 변수가 없으면 「구글시트로 발행」은 "연동이 설정되지 않았습니다" 안내를 표시합니다(앱은 정상 동작).

## 4) 동작 확인
어드민 → 문의 → 견적 편집기 → **구글시트로 발행** → 시트/PDF 링크 생성 확인.

## 페이로드(참고)
```json
{
  "fileName": "2026.06.16 홍길동 욕실 누수",
  "customer": { "name": "", "phone": "", "address": "" },
  "target": "욕실 누수 보수",
  "rows": [{ "kind": "work|material|extra", "name": "", "detail": "", "unit": "", "qty": 1, "unitPrice": 0, "amount": 0 }],
  "totals": { "workCost": 0, "profit": 0, "profitRate": 0.08, "rounding": 0, "subtotal": 0, "vat": 0, "total": 0, "deposit": 0, "balance": 0 },
  "memo": ""
}
```
