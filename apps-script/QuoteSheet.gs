/**
 * 집수리클라쓰 — 견적서 자동 생성 Apps Script 웹앱
 *
 * 사이트(/api/create-quote-sheet)가 POST로 견적 데이터를 보내면
 * '견적완료건' 템플릿을 복제해 값을 채우고, 시트/PDF 링크를 돌려준다.
 *
 * [배포]
 *  1) 빈 견적서 '템플릿' 스프레드시트 1개를 만들고 ID를 TEMPLATE_ID에 입력
 *  2) 생성본을 저장할 폴더(예: '견적완료건') ID를 DEST_FOLDER_ID에 입력
 *  3) SECRET을 임의의 긴 문자열로 정하고, 사이트 환경변수 QUOTE_SHEET_SECRET과 동일하게 설정
 *  4) 확장 프로그램 > Apps Script에 이 파일을 붙여넣고 저장
 *  5) 배포 > 새 배포 > 유형: 웹 앱 / 실행: 나 / 액세스: 모든 사용자
 *  6) 배포 URL(.../exec)을 사이트 환경변수 QUOTE_SHEET_WEBAPP_URL에 등록
 *
 * [셀 매핑] 아래 CELL 주소를 실제 템플릿 양식에 맞게 조정하세요.
 */

// ===== 설정 (대표님이 채워주세요) =====
var SECRET = 'CHANGE_ME_비밀키';               // 사이트 QUOTE_SHEET_SECRET과 동일하게
var TEMPLATE_ID = 'TEMPLATE_SPREADSHEET_ID';   // 빈 견적서 템플릿 스프레드시트 ID
var DEST_FOLDER_ID = 'DEST_FOLDER_ID';         // 생성본 저장 폴더(견적완료건) ID
var SHEET_TAB = '';                            // 값 채울 탭 이름(비우면 첫 번째 탭)
var EXPORT_PDF = true;                          // PDF도 함께 생성할지

// 셀 매핑 — 템플릿 양식의 실제 셀 주소로 바꿔주세요.
var CELL = {
  customerName: 'C3',
  customerPhone: 'E3',
  customerAddress: 'C4',
  target: 'C5',
  // 상세내역 첫 데이터 행의 '첫 칸'. 한 행에 [코드, 공사명, 공사내용, 단가, 수량, 단위, 금액] 순으로 채움.
  detailAnchor: 'A9',
  workCost: 'F30',
  profit: 'F31',
  rounding: 'F32',
  subtotal: 'F33',
  vat: 'F34',
  total: 'F35',
  deposit: 'F36',
  balance: 'F37',
  memo: 'A40'
};

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.secret !== SECRET) {
      return json_({ error: '인증 실패(secret 불일치)' });
    }

    var template = DriveApp.getFileById(TEMPLATE_ID);
    var folder = DriveApp.getFolderById(DEST_FOLDER_ID);
    var fileName = body.fileName || ('견적서 ' + new Date().toISOString().slice(0, 10));
    var copy = template.makeCopy(fileName, folder);

    var ss = SpreadsheetApp.openById(copy.getId());
    var sheet = SHEET_TAB ? ss.getSheetByName(SHEET_TAB) : ss.getSheets()[0];
    writeQuote_(sheet, body);
    SpreadsheetApp.flush();

    var pdfUrl = null;
    if (EXPORT_PDF) {
      var pdf = folder.createFile(ss.getAs('application/pdf').setName(fileName + '.pdf'));
      pdfUrl = pdf.getUrl();
    }
    return json_({ sheetUrl: ss.getUrl(), pdfUrl: pdfUrl });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function writeQuote_(sheet, body) {
  var c = body.customer || {};
  setCell_(sheet, CELL.customerName, c.name);
  setCell_(sheet, CELL.customerPhone, c.phone);
  setCell_(sheet, CELL.customerAddress, c.address);
  setCell_(sheet, CELL.target, body.target);

  var rows = (body.rows || []).map(function (r, i) {
    return [(i + 1) * 100, r.name, r.detail, r.unitPrice, r.qty, r.unit, r.amount];
  });
  if (rows.length && CELL.detailAnchor) {
    var anchor = sheet.getRange(CELL.detailAnchor);
    sheet.getRange(anchor.getRow(), anchor.getColumn(), rows.length, 7).setValues(rows);
  }

  var t = body.totals || {};
  setCell_(sheet, CELL.workCost, t.workCost);
  setCell_(sheet, CELL.profit, t.profit);
  setCell_(sheet, CELL.rounding, t.rounding);
  setCell_(sheet, CELL.subtotal, t.subtotal);
  setCell_(sheet, CELL.vat, t.vat);
  setCell_(sheet, CELL.total, t.total);
  setCell_(sheet, CELL.deposit, t.deposit);
  setCell_(sheet, CELL.balance, t.balance);
  setCell_(sheet, CELL.memo, body.memo);
}

function setCell_(sheet, a1, value) {
  if (!a1) return;
  sheet.getRange(a1).setValue(value == null ? '' : value);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_({ ok: true });
}
