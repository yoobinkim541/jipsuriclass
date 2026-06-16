/**
 * 집수리클라쓰 — 견적서 자동 생성 Apps Script 웹앱 (양식 그대로 채우기 버전)
 *
 * 사이트(/api/create-quote-sheet)가 POST로 견적 데이터를 보내면
 * '견적완료건' 템플릿을 복제해, 토큰 치환 + 공종별 행 자동 삽입으로
 * 상단 요약표 / 하단 상세내역(소계 포함)을 채우고 시트·PDF 링크를 돌려준다.
 *
 * ── 템플릿 준비(한 번만): 아래 토큰을 템플릿 셀에 넣어두세요 ──
 *   고객 연락처 칸     → {{phone}}
 *   주소 칸           → {{address}}
 *   견적 대상 칸       → {{target}}
 *   (선택) 공사 규모 칸 → {{scale}}
 *   (선택) 총 공사기간 칸 → {{period}}
 *   (선택) 발행일 칸   → {{date}}
 *   상단 요약표 첫 행의 '코드' 칸 → {{summary}}   (그 행에 공종별 [코드,공사명, ,금액]이 채워짐)
 *   상세내역 첫 데이터 행의 '코드' 칸 → {{detail}}  (공종별 헤더+항목+소계가 채워짐)
 *   공사비합계 금액칸  → {{workCost}}
 *   이윤 금액칸       → {{profit}}     (이윤율 표기칸 → {{profitPct}})
 *   절삭 금액칸       → {{rounding}}
 *   합계(부가세 별도) → {{subtotal}}
 *   부가세 칸         → {{vat}}
 *   계약금 칸         → {{deposit}}
 *   잔금 칸           → {{balance}}
 *   (선택) 메모 칸     → {{memo}}
 *   ※ 토큰만 단독으로 들어있는 금액칸은 '숫자'로 채워집니다(수식 대신 값). 문장 안에 섞어 써도 됩니다.
 *
 * ── 배포 ──
 *   배포 > 새 배포 > 웹 앱 / 실행: 나 / 액세스: 모든 사용자 → URL(.../exec)을 사이트에 등록
 */

// ===== 설정 =====
// 비밀키는 소스에 박지 않고 스크립트 속성(파일 > 프로젝트 속성 > 스크립트 속성, 키 'SECRET')에 둔다.
// 미설정 시 빈 값 → doPost가 fail-closed로 막는다(공개 기본키로 실수 배포 방지).
var SECRET = PropertiesService.getScriptProperties().getProperty('SECRET') || '';
var TEMPLATE_ID = 'TEMPLATE_SPREADSHEET_ID';   // 토큰을 넣어둔 템플릿 스프레드시트 ID
var DEST_FOLDER_ID = 'DEST_FOLDER_ID';         // 생성본 저장 폴더(견적완료건) ID
var SHEET_TAB = '';                            // 값 채울 탭(비우면 첫 번째 탭)
// PDF는 시트 생성과 분리된 별도 동작이다(action:'pdf'). 시트 생성 시 자동 PDF는 만들지 않는다.

// 상세내역/요약표가 시작하는 '열'(템플릿 기준). 기본 B열(=2): 코드,공사명,(요약:빈칸,금액 / 상세:내용,단가,수량,단위,금액)
var DETAIL_START_COL = 2; // B
var SUMMARY_START_COL = 2; // B

function doPost(e) {
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!SECRET) return json_({ error: '서버 설정 오류: 스크립트 속성 SECRET 미설정' });
    if (body.secret !== SECRET) return json_({ error: '인증 실패(secret 불일치)' });

    // PDF 생성은 시트 생성과 분리된 별도 동작 — 기존 시트를 PDF로 내보낸다.
    if (body.action === 'pdf') return makePdf_(body);

    // 기본 동작: 시트만 생성(자동 PDF 없음).
    var folder = DriveApp.getFolderById(DEST_FOLDER_ID);
    var fileName = body.fileName || ('견적서 ' + today_());
    var copy = DriveApp.getFileById(TEMPLATE_ID).makeCopy(fileName, folder);
    var ss = SpreadsheetApp.openById(copy.getId());
    var sheet = SHEET_TAB ? ss.getSheetByName(SHEET_TAB) : ss.getSheets()[0];

    fillTemplate_(sheet, body);
    SpreadsheetApp.flush();

    return json_({ sheetUrl: ss.getUrl(), sheetId: copy.getId(), pdfUrl: null });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

// 기존 시트를 PDF로 내보내 같은 폴더에 저장한다(시트 생성과 분리 호출).
function makePdf_(body) {
  var sheetId = body.sheetId || extractSheetId_(body.sheetUrl || '');
  if (!sheetId) return json_({ error: 'PDF로 만들 시트를 찾을 수 없습니다(sheetId 또는 sheetUrl 필요).' });
  var ss = SpreadsheetApp.openById(sheetId);
  var file = DriveApp.getFileById(sheetId);
  var parents = file.getParents();
  var folder = parents.hasNext() ? parents.next() : DriveApp.getFolderById(DEST_FOLDER_ID);
  var pdf = folder.createFile(ss.getAs('application/pdf').setName(ss.getName() + '.pdf'));
  return json_({ pdfUrl: pdf.getUrl() });
}

function extractSheetId_(url) {
  var m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

function fillTemplate_(sheet, body) {
  var t = body.totals || {};
  var c = body.customer || {};
  var groups = groupRows_(body.rows || []);

  // 1) 행을 늘리는 마커(detail/summary)를 '아래쪽 먼저' 처리해 위쪽 마커 행번호가 안 꼬이게 한다.
  var markers = findMarkers_(sheet).sort(function (a, b) { return b.row - a.row; });
  markers.forEach(function (m) {
    if (m.token === '{{detail}}') writeDetail_(sheet, m.row, groups);
    else if (m.token === '{{summary}}') writeSummary_(sheet, m.row, groups);
  });

  // 2) 스칼라 토큰 치환(행 삽입 후 위치가 바뀌었어도 전체 재스캔)
  replaceScalars_(sheet, {
    '{{phone}}': c.phone,
    '{{address}}': c.address,
    '{{target}}': body.target,
    '{{name}}': c.name,
    '{{scale}}': body.scale,
    '{{period}}': body.period,
    '{{date}}': today_(),
    '{{memo}}': body.memo,
    '{{workCost}}': t.workCost,
    '{{profit}}': t.profit,
    '{{profitPct}}': Math.round((t.profitRate || 0) * 100) + '%',
    '{{rounding}}': t.rounding,
    '{{subtotal}}': t.subtotal,
    '{{vat}}': t.vat,
    '{{total}}': t.total,
    '{{deposit}}': t.deposit,
    '{{balance}}': t.balance
  });
}

// 공종(group)별로 묶기 — 입력 순서 유지
function groupRows_(rows) {
  var map = {}, order = [];
  rows.forEach(function (r) {
    var key = r.group || '공사';
    if (!map[key]) { map[key] = { name: key, total: 0, lines: [] }; order.push(key); }
    map[key].lines.push(r);
    map[key].total += Number(r.amount) || 0;
  });
  return order.map(function (k) { return map[k]; });
}

// 상세내역: 공종별 [코드,공사명] 헤더 → 각 줄 [ , ,내용,단가,수량,단위,금액,비고] → [소계,…,금액]
// 8열: B코드 C공사명 D내용 E단가 F수량 G단위 H금액 I비고
function writeDetail_(sheet, row, groups) {
  var out = [];
  groups.forEach(function (g, gi) {
    out.push([(gi + 1) * 100, safe_(g.name), '', '', '', '', '', '']);
    g.lines.forEach(function (l) {
      out.push(['', '', safe_(l.detail || ''), num_(l.unitPrice), num_(l.qty), safe_(l.unit || ''), num_(l.amount), safe_(l.remark || '')]);
    });
    out.push(['소계', '', '', '', '', '', g.total, '']);
  });
  if (!out.length) { sheet.getRange(row, DETAIL_START_COL).setValue(''); return; }
  if (out.length > 1) sheet.insertRowsAfter(row, out.length - 1);
  sheet.getRange(row, DETAIL_START_COL, out.length, 8).setValues(out);
}

// 상단 요약표: 공종별 [코드,공사명,빈칸,금액]
function writeSummary_(sheet, row, groups) {
  if (!groups.length) { sheet.getRange(row, SUMMARY_START_COL).setValue(''); return; }
  var out = groups.map(function (g, gi) { return [(gi + 1) * 100, safe_(g.name), '', g.total]; });
  if (out.length > 1) sheet.insertRowsAfter(row, out.length - 1);
  sheet.getRange(row, SUMMARY_START_COL, out.length, 4).setValues(out);
}

function findMarkers_(sheet) {
  var vals = sheet.getDataRange().getValues();
  var out = [];
  for (var r = 0; r < vals.length; r++) {
    for (var c = 0; c < vals[r].length; c++) {
      var v = vals[r][c];
      if (typeof v !== 'string') continue;
      if (v.indexOf('{{detail}}') >= 0) out.push({ row: r + 1, col: c + 1, token: '{{detail}}' });
      else if (v.indexOf('{{summary}}') >= 0) out.push({ row: r + 1, col: c + 1, token: '{{summary}}' });
    }
  }
  return out;
}

function replaceScalars_(sheet, map) {
  var range = sheet.getDataRange();
  var vals = range.getValues();
  var changed = false;
  for (var r = 0; r < vals.length; r++) {
    for (var c = 0; c < vals[r].length; c++) {
      var v = vals[r][c];
      if (typeof v !== 'string' || v.indexOf('{{') < 0) continue;
      if (map.hasOwnProperty(v)) {
        // 토큰만 단독 → 원래 타입(숫자)은 그대로, 문자열은 수식주입 방지 이스케이프
        vals[r][c] = map[v] == null ? '' : safe_(map[v]);
        changed = true;
      } else {
        var nv = v;
        for (var key in map) {
          if (nv.indexOf(key) >= 0) nv = nv.split(key).join(map[key] == null ? '' : String(map[key]));
        }
        if (nv !== v) { vals[r][c] = safe_(nv); changed = true; }
      }
    }
  }
  if (changed) range.setValues(vals);
}

function num_(v) { var n = Number(v); return isNaN(n) ? (v || '') : n; }
// 수식/CSV 주입 방지: =,+,-,@,탭,CR로 시작하는 문자열은 작은따옴표를 붙여 '텍스트'로 강제한다.
// (setValues는 '='로 시작하는 값을 수식으로 평가 → 대표님이 시트 열 때 =IMPORTXML 등이 실행될 수 있음)
function safe_(v) { return (typeof v === 'string' && /^[=+\-@\t\r]/.test(v)) ? "'" + v : v; }
function today_() { return Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy.MM.dd'); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json_({ ok: true }); }
