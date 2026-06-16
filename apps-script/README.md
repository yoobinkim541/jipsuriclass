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
