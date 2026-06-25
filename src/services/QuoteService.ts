import type jsPDF from "jspdf";
import { servicePricingRegistry } from "../pricing/registry";
import { waterproofingTilePriceCategories, waterproofingPriceCategories } from "../waterproofingTilePriceData";
import type {
  InquiryIntake,
  InquiryQuoteCharge,
  InquiryQuoteLineItem,
  InquiryQuoteSnapshot,
  InquiryQuoteSource,
  InquiryRow
} from "../types";

type QuoteSourceCategory = {
  title: string;
  items: QuoteSourceItem[];
};

type QuoteSourceItem = {
  sourceId: string | null;
  name: string;
  unit: string;
  price: number;
  materialNote: string | null;
  note: string | null;
};

type QuoteSourceDefinition = {
  servicePath: string;
  pricingPath: string;
  serviceLabel: string;
  categories: QuoteSourceCategory[];
};

type QuoteTotals = {
  workSubtotal: number;
  materialSubtotal: number;
  extraSubtotal: number;
  workCost: number;
  profit: number;
  rounding: number;
  subtotal: number;
  vat: number;
  total: number;
  deposit: number;
  balance: number;
};

type QuoteDownloadContext = {
  inquiry: InquiryRow;
  quote: InquiryQuoteSnapshot;
  totals: QuoteTotals;
};

// registry(공개 /pricing 표)를 가격 정본으로 단일화한다. electric·tile은 registry에 동일
// 서비스가 있어 여기서 제거 — 과거 legacy 카탈로그와 숫자가 드리프트해 '공개 표 ≠ 어드민
// 견적' 버그를 만들었다(예: 다운라이트 공개 60,000 vs 견적 30,000). 제거 후 두 서비스의
// 견적은 registry(공개 표)에서만 나온다. registry에 없는 방수·방수타일만 견적용으로 유지한다.
const EXTRA_SOURCE_DEFINITIONS: QuoteSourceDefinition[] = [
  {
    servicePath: "/service/waterproofing",
    pricingPath: "/service/waterproofing/price",
    serviceLabel: "방수 보수 서비스",
    categories: normalizeCustomCategories(waterproofingPriceCategories)
  },
  {
    servicePath: "/service/waterproofing-tile",
    pricingPath: "/service/waterproofing-tile/price",
    serviceLabel: "방수·타일 서비스",
    categories: normalizeCustomCategories(waterproofingTilePriceCategories)
  }
];

const quoteSourceDefinitions: QuoteSourceDefinition[] = [
  ...Object.entries(servicePricingRegistry).map(([servicePath, config]) => ({
    servicePath,
    pricingPath: config.pricingPagePath,
    serviceLabel: config.serviceName,
      categories: config.categories.map((category) => ({
        title: category.title,
        items: category.items.map((item) => ({
          sourceId: null,
          name: item.name,
          unit: item.unit,
          price: item.price,
          materialNote: item.materialNote === "별도" ? "별도" : null,
          note: (item as { note?: string }).note ?? null
        }))
      }))
  })),
  ...EXTRA_SOURCE_DEFINITIONS
];

const quoteSourceByPricingPath = new Map(quoteSourceDefinitions.map((source) => [source.pricingPath, source]));
const quoteSourceByServicePath = new Map(quoteSourceDefinitions.map((source) => [source.servicePath, source]));

export type QuotePriceCatalogItem = {
  sourceId: string | null;
  name: string;
  unit: string;
  price: number;
  materialNote: string | null;
  note: string | null;
};

export type QuotePriceCatalogGroup = {
  serviceLabel: string;
  servicePath: string;
  items: QuotePriceCatalogItem[];
};

/** 웹 가격표(서비스별) 전체 항목을 편집기에서 '골라 담기' 위해 평탄화해 제공한다. */
export function getQuotePriceCatalog(): QuotePriceCatalogGroup[] {
  return quoteSourceDefinitions.map((source) => ({
    serviceLabel: source.serviceLabel,
    servicePath: source.servicePath,
    items: source.categories.flatMap((category) =>
      category.items.map((item) => ({
        sourceId: item.sourceId,
        name: category.title && category.title !== item.name ? `${item.name}` : item.name,
        unit: item.unit,
        price: item.price,
        materialNote: item.materialNote,
        note: item.note
      }))
    )
  }));
}
const fontCache = { promise: null as Promise<string> | null };
const koreanFontUrl = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf";

export function buildEstimateHref(options: {
  works?: string[];
  workIds?: string[];
  sourceServicePath?: string | null;
  sourcePricingPath?: string | null;
  project?: string;
  issue?: string;
}) {
  const params = new URLSearchParams();

  if (options.works?.length) {
    params.set("works", options.works.join(","));
  }
  if (options.workIds?.length) {
    params.set("workIds", options.workIds.join(","));
  }
  if (options.sourceServicePath) {
    params.set("sourceService", options.sourceServicePath);
  }
  if (options.sourcePricingPath) {
    params.set("sourcePricing", options.sourcePricingPath);
  }
  if (options.project) {
    params.set("project", options.project);
  }
  if (options.issue) {
    params.set("issue", options.issue);
  }

  const query = params.toString();
  return query ? `/estimate?${query}` : "/estimate";
}

/** 거주 상태가 '거주중/살면서 공사'면 보양작업이 필요하다고 본다(공실·신축입주는 제외). */
function isOccupiedDuringWork(propertyStatus?: string | null): boolean {
  const status = typeof propertyStatus === "string" ? propertyStatus : "";
  if (!status) return false;
  if (/공실|신축입주/.test(status)) return false;
  return /거주중|살면서/.test(status);
}

/** 거주중 현장 보양작업 기본 항목(코드 100·식·3만원, 자재비 포함). */
function buildProtectionLineItem(): InquiryQuoteLineItem {
  return {
    id: `protection-${Date.now()}`,
    sourceId: null,
    name: "거주중\n- 비닐 커버링, 바닥 시트\n- 자재비 포함",
    unit: "식",
    qty: 1,
    unitPrice: 30000,
    categoryTitle: "보양작업",
    note: null,
    materialNote: null
  };
}

// 공과 잡비(식사 및 음료) 1식 단가 및 식수 산정 기준.
const MEAL_UNIT_PRICE = 20000;
const MEAL_COST_PER_UNIT = 500000; // 공사비 약 50만원당 1식(소요 규모 비례 추정)

/**
 * '기타'의 공과 잡비(식사 및 음료) 항목 — 예상 공사 규모(공사비 합계)에 비례해 식수를
 * 자동 산정한다(약 50만원당 1식, 1~10식). 소요 시간 필드가 없어 규모를 대용 지표로 쓴다.
 */
function buildMealAllowanceLineItem(workCost: number): InquiryQuoteLineItem {
  const meals = Math.min(10, Math.max(1, Math.round(workCost / MEAL_COST_PER_UNIT)));
  return {
    id: `meal-${Date.now()}`,
    sourceId: null,
    name: "공과 잡비 (식사 및 음료)",
    unit: "식",
    qty: meals,
    unitPrice: MEAL_UNIT_PRICE,
    categoryTitle: "기타",
    note: null,
    materialNote: null
  };
}

export function buildQuoteDraftFromInquiry(inquiry: InquiryRow): InquiryQuoteSnapshot {
  const intake = inquiry.intake ?? {};
  const existing = isQuoteSnapshot(intake.quoteSnapshot) ? intake.quoteSnapshot : null;

  if (existing) {
    return normalizeQuoteSnapshot(existing, inquiry);
  }

  const source = resolveQuoteSource({
    sourceServicePath: getStringField(intake.quoteSource?.servicePath),
    sourcePricingPath: getStringField(intake.quoteSource?.pricingPath) ?? null,
    workIds: ensureStringArray(intake.selectedWorkIds),
    works: ensureStringArray(intake.selectedWorks)
  });

  const selectedWorks = ensureStringArray(intake.selectedWorks);
  const selectedWorkIds = ensureStringArray(intake.selectedWorkIds);
  const resolvedItems = resolveQuoteItems({
    source,
    sourceServicePath: source?.servicePath ?? null,
    sourcePricingPath: source?.pricingPath ?? null,
    workIds: selectedWorkIds,
    works: selectedWorks
  });

  const lineItems = resolvedItems.map((item, index) => createQuoteLineItem(item, index));
  // 거주중(살면서 공사)이면 보양작업을 첫 줄(코드 100)에 자동 추가 — 대표님 표준 견적서 관행.
  // 초안에만 넣으므로 담당자가 편집기에서 수정·삭제할 수 있고, 저장본에는 중복되지 않는다.
  if (isOccupiedDuringWork(intake.propertyStatus)) {
    lineItems.unshift(buildProtectionLineItem());
  }
  // '기타' 공과 잡비(식사 및 음료)를 공사 규모에 비례해 마지막 줄에 자동 추가.
  const workCostBase = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  if (workCostBase > 0) {
    lineItems.push(buildMealAllowanceLineItem(workCostBase));
  }

  return normalizeQuoteSnapshot(
    {
      sourceServicePath: source?.servicePath ?? null,
      sourcePricingPath: source?.pricingPath ?? null,
      sourceServiceLabel: source?.serviceLabel ?? null,
      confirmedAt: null,
      selectedWorks,
      selectedWorkIds,
      lineItems,
      materialCharges: [],
      extraCharges: [],
      vatRate: 0,
      profitRate: 0.08,
      deposit: 0,
      // 공사 규모는 상담 정보(공간형태·면적)로 프리필, 담당자가 편집기에서 수정 가능.
      workScale: [getStringField(intake.spaceType), getStringField(intake.areaBand)].filter(Boolean).join(" · "),
      workPeriod: "",
      memo: "",
      updatedAt: null
    },
    inquiry
  );
}

export function mergeQuoteIntoIntake(intake: InquiryIntake | null, quote: InquiryQuoteSnapshot): InquiryIntake {
  return {
    ...(intake ?? {}),
    selectedWorks: quote.selectedWorks,
    selectedWorkIds: quote.selectedWorkIds,
    quoteSource: {
      servicePath: quote.sourceServicePath,
      pricingPath: quote.sourcePricingPath,
      works: quote.selectedWorks,
      workIds: quote.selectedWorkIds
    },
    quoteSnapshot: quote
  };
}

// 부가가치세율 — 정책상 항상 합계(부가세 별도)의 10%.
const VAT_RATE = 0.1;

export function calculateQuoteTotals(quote: InquiryQuoteSnapshot): QuoteTotals {
  const workSubtotal = quote.lineItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const materialSubtotal = quote.materialCharges.reduce((sum, item) => sum + item.amount, 0);
  const extraSubtotal = quote.extraCharges.reduce((sum, item) => sum + item.amount, 0);
  // 공사비합계 = 공임(작업) + 자재 + 부대비용
  const workCost = workSubtotal + materialSubtotal + extraSubtotal;

  // 이윤(기본 8%, 직원 조정 가능). [0,1] 밖(예: 500% 오타)은 기본값으로 차단(normalizeRate 재사용).
  const profitRate = normalizeRate(quote.profitRate, 0.08);
  const profit = Math.round(workCost * profitRate);
  const beforeRounding = workCost + profit;
  // 천원이하 절삭: roundingAdjust 지정 시 그 값, 미지정 시 만원 미만 자동 절삭(음수)
  const rounding = typeof quote.roundingAdjust === "number" ? quote.roundingAdjust : -(beforeRounding % 10000);
  // 합계(부가세 별도). 절삭 입력 실수로 음수가 되지 않도록 0 하한.
  const subtotal = Math.max(0, beforeRounding + rounding);

  // 부가가치세: 기본은 항상 합계의 10%. 단, 직접입력 모드면 저장된 vatRate를 사용.
  const vatRate = quote.vatManual ? normalizeRate(quote.vatRate, VAT_RATE) : VAT_RATE;
  const vat = Math.round(subtotal * vatRate);
  const total = subtotal + vat;
  // 계약금: 기본은 총액(부가세 포함)의 30%를 만원 단위로 올림. 직접입력 모드면 저장값 사용.
  const deposit = quote.depositManual
    ? Math.max(0, typeof quote.deposit === "number" ? quote.deposit : 0)
    : Math.ceil((total * 0.3) / 10000) * 10000;
  // 잔금 = 총액 − 계약금. 계약금이 더 커도 음수가 되지 않도록 0 하한.
  const balance = Math.max(0, total - deposit);

  return { workSubtotal, materialSubtotal, extraSubtotal, workCost, profit, rounding, subtotal, vat, total, deposit, balance };
}

export type QuoteSheetPayload = {
  fileName: string;
  customer: { name: string; phone: string; address: string };
  target: string;
  scale: string;
  period: string;
  rows: Array<{ kind: "work" | "material" | "extra"; group: string; detail: string; remark: string; unit: string; qty: number; unitPrice: number; amount: number }>;
  totals: { workCost: number; profit: number; profitRate: number; rounding: number; subtotal: number; vat: number; total: number; deposit: number; balance: number };
  memo: string;
  /** 이미 발행한 시트가 있으면 그 ID — Apps Script가 새로 만들지 않고 이 시트를 갱신한다. */
  sheetId?: string;
};

/** 견적 스냅샷을 Apps Script(구글시트 생성)로 보낼 페이로드로 변환한다. */
export function buildQuoteSheetPayload(inquiry: InquiryRow, quote: InquiryQuoteSnapshot): QuoteSheetPayload {
  const totals = calculateQuoteTotals(quote);
  // 시트에 찍히는 이윤율(%)도 합계 계산과 동일하게 [0,1]로 정규화(불일치 방지).
  const profitRate = normalizeRate(quote.profitRate, 0.08);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  const target = quote.selectedWorks.length
    ? quote.selectedWorks.join(", ")
    : quote.lineItems.map((item) => item.name).filter(Boolean).slice(0, 4).join(", ") || "부분 공사";
  const fileName = `${date} ${inquiry.name ?? "현장"} ${target}`.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

  const rows: QuoteSheetPayload["rows"] = [
    ...quote.lineItems.map((item) => ({
      kind: "work" as const,
      group: item.categoryTitle ?? "공사",
      detail: item.name, // 내용(D)
      remark: item.note ?? "", // 비고(I) — 편집기 비고 입력값
      unit: item.unit,
      qty: item.qty,
      unitPrice: item.unitPrice,
      amount: item.qty * item.unitPrice
    })),
    ...quote.materialCharges.map((charge) => ({
      kind: "material" as const,
      // 자재비는 지정된 공종에 묶이고(상세내역에서 해당 작업 그룹에 합쳐짐), 미지정 시 '자재'.
      group: charge.group?.trim() ? charge.group.trim() : "자재",
      detail: charge.label,
      remark: "자재 별도",
      unit: "",
      qty: charge.qty,
      unitPrice: charge.unitPrice,
      amount: charge.amount
    })),
    ...quote.extraCharges.map((charge) => ({
      kind: "extra" as const,
      group: "기타",
      detail: charge.label,
      remark: "",
      unit: "",
      qty: 1,
      unitPrice: charge.amount,
      amount: charge.amount
    }))
  ];

  // '기타' 공종은 항상 맨 뒤에(다른 공종 먼저, 기타를 마지막에) — 코드도 자연히 마지막 번호.
  const orderedRows = [...rows.filter((row) => row.group !== "기타"), ...rows.filter((row) => row.group === "기타")];

  // 이미 발행한 시트가 있으면 그 ID를 함께 보낸다 → 재발행 시 새 파일을 만들지 않고 같은 시트를 갱신.
  const existingSheetId = quote.sheetUrl ? extractGoogleSheetId(quote.sheetUrl) : null;

  return {
    fileName,
    ...(existingSheetId ? { sheetId: existingSheetId } : {}),
    customer: { name: inquiry.name ?? "", phone: inquiry.phone ?? "", address: inquiry.service_area ?? "" },
    target,
    scale: quote.workScale ?? "",
    period: quote.workPeriod ?? "",
    rows: orderedRows,
    totals: {
      workCost: totals.workCost,
      profit: totals.profit,
      profitRate,
      rounding: totals.rounding,
      subtotal: totals.subtotal,
      vat: totals.vat,
      total: totals.total,
      deposit: totals.deposit,
      balance: totals.balance
    },
    memo: quote.memo ?? ""
  };
}

/**
 * 견적을 구글시트(견적완료건 템플릿)로 발행한다.
 * /api/create-quote-sheet 가 대표님 계정의 Apps Script 웹앱을 호출해 시트를 생성하고 링크를 돌려준다.
 */
export async function createQuoteSheet(input: { inquiry: InquiryRow; quote: InquiryQuoteSnapshot }): Promise<{ sheetUrl: string; pdfUrl: string | null }> {
  const payload = buildQuoteSheetPayload(input.inquiry, input.quote);
  const endpoint = new URL("/api/create-quote-sheet", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = (await response.json().catch(() => null)) as { sheetUrl?: string; pdfUrl?: string; error?: string } | null;
  if (!response.ok || !data || !data.sheetUrl) {
    // 서버가 구체적 오류를 돌려줬으면 그대로 보여준다(환경변수 미설정·401 안내 등).
    if (data && typeof data.error === "string") {
      throw new Error(data.error);
    }
    // 응답 자체가 비정상(JSON 아님·타임아웃 등).
    if (!response.ok) {
      throw new Error(`구글시트 발행 요청이 실패했습니다 (HTTP ${response.status}). 상단 '연동 점검'으로 Apps Script 상태를 확인해 주세요.`);
    }
    // 200인데 sheetUrl이 없다 = 배포된 Apps Script가 시트 링크를 돌려주지 않음(구버전 배포일 가능성).
    throw new Error(
      "Apps Script가 시트 링크를 돌려주지 않았습니다. 최신 QuoteSheet.gs(시트/PDF 분리 버전)로 '새 배포'했는지 확인해 주세요. 상단 '연동 점검'으로 상태를 점검할 수 있습니다."
    );
  }
  return { sheetUrl: data.sheetUrl, pdfUrl: data.pdfUrl ?? null };
}

/**
 * 이미 발행한 구글시트를 PDF로 내보낸다(시트 생성과 분리된 별도 동작).
 * action:'pdf'로 호출하면 Apps Script가 해당 시트를 PDF로 만들어 링크를 돌려준다.
 */
export async function createQuotePdf(input: { sheetUrl: string }): Promise<{ pdfUrl: string }> {
  const endpoint = new URL("/api/create-quote-sheet", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  const response = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "pdf", sheetUrl: input.sheetUrl })
  });
  const data = (await response.json().catch(() => ({}))) as { pdfUrl?: string; error?: string };
  if (!response.ok || !data.pdfUrl) {
    throw new Error(typeof data.error === "string" ? data.error : "PDF 생성에 실패했습니다. 먼저 구글시트를 발행했는지 확인해 주세요.");
  }
  return { pdfUrl: data.pdfUrl };
}

/**
 * 구글시트 연동 상태를 점검한다(발행 누르지 않고 확인). /api/check-quote-sheet가
 * Apps Script 웹앱에 GET 핑을 보내 정상/로그인필요/미설정/오류를 돌려준다.
 */
export async function checkQuoteSheetConnection(): Promise<{ ok: boolean; message: string }> {
  const endpoint = new URL("/api/check-quote-sheet", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  try {
    const response = await fetch(endpoint.toString());
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    return { ok: data.ok === true, message: typeof data.message === "string" ? data.message : "상태를 확인할 수 없습니다." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? `점검 실패: ${error.message}` : "점검 실패" };
  }
}

export async function importQuoteFromXlsx(input: { inquiry: InquiryRow; file: File }): Promise<InquiryQuoteSnapshot> {
  const buffer = await input.file.arrayBuffer();
  return parseQuoteWorkbookBuffer(buffer, input.inquiry);
}

/** 구글 시트 링크에서 spreadsheet ID를 뽑는다. */
export function extractGoogleSheetId(url: string): string | null {
  const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * 구글 시트 링크로 견적을 불러온다. 시트를 xlsx로 export하는 서버 프록시(/api/sheet-export)를
 * 거쳐 받아 동일한 템플릿 파서로 처리한다. 시트는 '링크가 있는 모든 사용자: 보기'로 공유돼 있어야 한다.
 */
export async function importQuoteFromGoogleSheetUrl(input: { inquiry: InquiryRow; url: string }): Promise<InquiryQuoteSnapshot> {
  const sheetId = extractGoogleSheetId(input.url.trim());
  if (!sheetId) {
    throw new Error("구글 시트 링크 형식이 아닙니다. https://docs.google.com/spreadsheets/d/... 링크를 붙여넣어 주세요.");
  }

  const endpoint = new URL("/api/sheet-export", typeof window !== "undefined" ? window.location.origin : "http://localhost");
  endpoint.searchParams.set("id", sheetId);

  const response = await fetch(endpoint.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("구글 시트를 불러오지 못했습니다. 시트가 '링크가 있는 모든 사용자 보기'로 공유돼 있는지 확인해 주세요.");
  }

  const buffer = await response.arrayBuffer();
  return parseQuoteWorkbookBuffer(buffer, input.inquiry);
}

async function parseQuoteWorkbookBuffer(buffer: ArrayBuffer, inquiry: InquiryRow): Promise<InquiryQuoteSnapshot> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("시트가 없습니다. 샘플 템플릿 형식으로 작성해 주세요.");
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("시트를 읽지 못했습니다. 샘플 템플릿을 내려받아 같은 형식으로 작성해 주세요.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: false }) as Array<
    Array<string | number>
  >;

  if (!rows.length) {
    throw new Error("시트가 비어 있습니다. 샘플 템플릿을 내려받아 작성한 뒤 사용해 주세요.");
  }

  return normalizeQuoteSnapshot(parseQuoteRows(rows), inquiry);
}

export async function downloadQuoteTemplateAsXlsx() {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const rows: Array<Array<string | number>> = [
    ["상담 견적서 템플릿"],
    [],
    ["작성 안내", "작업 항목 섹션의 헤더와 열 순서를 유지한 뒤 내용을 입력하세요."],
    ["작성 안내", "견적 출처와 컨펌일은 선택 사항입니다."],
    [],
    ["고객명", ""],
    ["연락처", ""],
    ["지역", ""],
    ["접수일시", ""],
    ["견적 출처", "직접 작성"],
    ["서비스 경로", ""],
    ["가격표 경로", ""],
    ["컨펌일", ""],
    ["최종수정", ""],
    [],
    ["작업 항목", "단위", "수량", "단가", "금액", "비고"],
    [],
    ["자재비", "", "", "", "", ""],
    [],
    ["부대비용", "", "", "", "", ""],
    [],
    ["공급가액", "", "", "", "", ""],
    ["부가세", "", "", "", "", ""],
    ["합계", "", "", "", "", ""],
    [],
    ["메모", ""]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 22 },
    { wch: 20 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, "상담견적");
  XLSX.writeFile(workbook, "상담_견적서_템플릿.xlsx");
}

export async function downloadQuoteAsXlsx(input: QuoteDownloadContext) {
  const XLSX = await import("xlsx");
  const documentTitle = buildQuoteDocumentTitle(input.quote);
  const workbook = XLSX.utils.book_new();
  const totals = input.totals;
  const generatedAt = formatDateTime(new Date().toISOString());
  const rows: Array<Array<string | number>> = [
    [documentTitle],
    [],
    ["고객명", input.inquiry.name],
    ["연락처", input.inquiry.phone],
    ["지역", input.inquiry.service_area ?? "-"],
    ["접수일시", formatDateTime(input.inquiry.created_at)],
    ["견적 출처", input.quote.sourceServiceLabel ?? input.quote.sourceServicePath ?? "직접 작성"],
    ["서비스 경로", input.quote.sourceServicePath ?? "-"],
    ["가격표 경로", input.quote.sourcePricingPath ?? "-"],
    ["컨펌일", input.quote.confirmedAt ? formatDateTime(input.quote.confirmedAt) : "-"],
    ["최종수정", input.quote.updatedAt ? formatDateTime(input.quote.updatedAt) : generatedAt],
    [],
    ["작업 항목", "단위", "수량", "단가", "금액", "비고"]
  ];

  input.quote.lineItems.forEach((item) => {
    rows.push([
      item.name,
      item.unit,
      item.qty,
      item.unitPrice,
      item.qty * item.unitPrice,
      item.note ?? item.materialNote ?? ""
    ]);
  });

  rows.push([], ["자재비", "", "", "", "", ""]);
  input.quote.materialCharges.forEach((item) => {
    rows.push([item.label, "", item.qty, item.unitPrice, item.amount, ""]);
  });

  rows.push([], ["부대비용", "", "", "", "", ""]);
  input.quote.extraCharges.forEach((item) => {
    rows.push([item.label, "", 1, item.amount, item.amount, ""]);
  });

  rows.push(
    [],
    ["공사비합계", "", "", "", totals.workCost, ""],
    ["이윤", "", "", "", totals.profit, ""],
    ["천원이하 절삭", "", "", "", totals.rounding, ""],
    ["합계 금액 (부가세 별도)", "", "", "", totals.subtotal, ""]
  );
  if (totals.vat > 0) {
    rows.push(["부가세", "", "", "", totals.vat, ""], ["합계 금액", "", "", "", totals.total, ""]);
  }
  rows.push(
    ["계약금(선수금)", "", "", "", totals.deposit, ""],
    ["잔금", "", "", "", totals.balance, ""],
    [],
    ["메모", input.quote.memo || "-"]
  );

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, buildQuoteSheetName(documentTitle));
  XLSX.writeFile(workbook, buildQuoteFilename(input.inquiry.name, documentTitle, "xlsx"));
}

export async function downloadQuoteAsPdf(input: QuoteDownloadContext) {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const documentTitle = buildQuoteDocumentTitle(input.quote);
  const doc = new JsPDF({ orientation: "p", unit: "pt", format: "a4" });
  await ensureKoreanFont(doc);
  const totals = input.totals;
  const margin = 40;
  let cursorY = 40;

  doc.setFont("NotoSansKR", "bold");
  doc.setFontSize(18);
  doc.text(documentTitle, margin, cursorY);
  cursorY += 22;

  doc.setFont("NotoSansKR", "normal");
  doc.setFontSize(10);
  doc.text(`고객명: ${input.inquiry.name}`, margin, cursorY);
  cursorY += 14;
  doc.text(`연락처: ${input.inquiry.phone}`, margin, cursorY);
  cursorY += 14;
  doc.text(`지역: ${input.inquiry.service_area ?? "-"}`, margin, cursorY);
  cursorY += 14;
  doc.text(`견적 출처: ${input.quote.sourceServiceLabel ?? input.quote.sourceServicePath ?? "직접 작성"}`, margin, cursorY);
  cursorY += 14;
  doc.text(`컨펌일: ${input.quote.confirmedAt ? formatDateTime(input.quote.confirmedAt) : "-"}`, margin, cursorY);
  cursorY += 14;
  doc.text(`최종수정: ${input.quote.updatedAt ? formatDateTime(input.quote.updatedAt) : formatDateTime(new Date().toISOString())}`, margin, cursorY);
  cursorY += 18;

  autoTable(doc, {
    startY: cursorY,
    head: [["작업 항목", "단위", "수량", "단가", "금액", "비고"]],
    body: input.quote.lineItems.map((item) => [
      item.name,
      item.unit,
      String(item.qty),
      formatCurrency(item.unitPrice),
      formatCurrency(item.qty * item.unitPrice),
      item.note ?? item.materialNote ?? ""
    ]),
    styles: {
      font: "NotoSansKR",
      fontSize: 9,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [16, 40, 74],
      textColor: 255
    },
    margin: { left: margin, right: margin }
  });

  const lineEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? cursorY;
  const materialStart = lineEnd + 18;

  autoTable(doc, {
    startY: materialStart,
    head: [["구분", "항목", "수량", "단가", "금액"]],
    body: [
      ...input.quote.materialCharges.map((item) => [
        "자재비",
        item.label,
        String(item.qty),
        formatCurrency(item.unitPrice),
        formatCurrency(item.amount)
      ]),
      ...input.quote.extraCharges.map((item) => ["부대비용", item.label, "", "", formatCurrency(item.amount)])
    ],
    styles: {
      font: "NotoSansKR",
      fontSize: 9,
      cellPadding: 5
    },
    headStyles: {
      fillColor: [91, 103, 129],
      textColor: 255
    },
    margin: { left: margin, right: margin }
  });

  let summaryY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? materialStart) + 18;
  doc.setFont("NotoSansKR", "bold");
  doc.setFontSize(11);
  const summaryLines: string[] = [
    `공사비합계: ${formatCurrency(totals.workCost)}`,
    `이윤: ${formatCurrency(totals.profit)}`,
    `천원이하 절삭: ${formatCurrency(totals.rounding)}`,
    `합계 금액 (부가세 별도): ${formatCurrency(totals.subtotal)}`,
    ...(totals.vat > 0 ? [`부가세: ${formatCurrency(totals.vat)}`, `합계 금액: ${formatCurrency(totals.total)}`] : []),
    `계약금(선수금): ${formatCurrency(totals.deposit)}`,
    `잔금: ${formatCurrency(totals.balance)}`
  ];
  for (const line of summaryLines) {
    doc.text(line, margin, summaryY);
    summaryY += 16;
  }
  doc.setFont("NotoSansKR", "normal");
  doc.setFontSize(9);
  doc.text("상기 견적서는 발행일로부터 약 2주간 유효합니다. 무상하자 보증 기간은 만 1년입니다.", margin, summaryY + 6);
  doc.text("입금계좌: 신한은행 110-330-187270 (김헌영) · 집수리클라쓰 김헌영 실장", margin, summaryY + 20);
  doc.text(`메모: ${input.quote.memo || "-"}`, margin, summaryY + 38);

  doc.save(buildQuoteFilename(input.inquiry.name, documentTitle, "pdf"));
}

export function buildQuoteSourceLabel(snapshot: InquiryQuoteSnapshot) {
  return snapshot.sourceServiceLabel ?? snapshot.sourcePricingPath ?? snapshot.sourceServicePath ?? "직접 작성";
}

function normalizeCustomCategories(categories: Array<{ title: string; items: Array<{ id: string; name: string; unit: string; price: number; materialNote?: boolean; note?: string }> }>): QuoteSourceCategory[] {
  return categories.map((category) => ({
    title: category.title,
    items: category.items.map((item) => ({
      sourceId: item.id,
      name: item.name,
      unit: item.unit,
      price: item.price,
      materialNote: item.materialNote ? "별도" : null,
      note: item.note ?? null
    }))
  }));
}

function resolveQuoteSource(input: {
  sourceServicePath: string | null;
  sourcePricingPath: string | null;
  workIds: string[];
  works: string[];
}) {
  if (input.sourcePricingPath && quoteSourceByPricingPath.has(input.sourcePricingPath)) {
    return quoteSourceByPricingPath.get(input.sourcePricingPath) ?? null;
  }
  if (input.sourceServicePath && quoteSourceByServicePath.has(input.sourceServicePath)) {
    return quoteSourceByServicePath.get(input.sourceServicePath) ?? null;
  }

  const resolved = resolveQuoteItems(input);
  if (!resolved.length) return null;

  return quoteSourceDefinitions.find((source) =>
    source.categories.some((category) => category.items.some((item) => resolved.some((resolvedItem) => resolvedItem.name === item.name)))
  ) ?? null;
}

function resolveQuoteItems(input: {
  source?: QuoteSourceDefinition | null;
  sourceServicePath: string | null;
  sourcePricingPath: string | null;
  workIds: string[];
  works: string[];
}) {
  const sources = input.source
    ? [input.source]
    : [
        input.sourcePricingPath ? quoteSourceByPricingPath.get(input.sourcePricingPath) : null,
        input.sourceServicePath ? quoteSourceByServicePath.get(input.sourceServicePath) : null,
        ...quoteSourceDefinitions
      ].filter((source): source is QuoteSourceDefinition => Boolean(source));

  const resolved: Array<QuoteSourceItem & { categoryTitle: string | null; servicePath: string; pricingPath: string; serviceLabel: string }> = [];
  const seen = new Set<string>();

  const addItem = (source: QuoteSourceDefinition, categoryTitle: string, item: QuoteSourceItem) => {
    const key = `${source.pricingPath}:${item.sourceId ?? item.name}`;
    if (seen.has(key)) return;
    seen.add(key);
    resolved.push({
      ...item,
      categoryTitle,
      servicePath: source.servicePath,
      pricingPath: source.pricingPath,
      serviceLabel: source.serviceLabel
    });
  };

  if (input.workIds.length > 0) {
    for (const source of sources) {
      for (const category of source.categories) {
        for (const item of category.items) {
          if (item.sourceId && input.workIds.includes(item.sourceId)) {
            addItem(source, category.title, item);
          }
        }
      }
    }
  }

  if (input.works.length > 0) {
    for (const source of sources) {
      for (const category of source.categories) {
        for (const item of category.items) {
          if (input.works.includes(item.name)) {
            addItem(source, category.title, item);
          }
        }
      }
    }
  }

  return resolved;
}

function createQuoteLineItem(
  item: QuoteSourceItem & { categoryTitle: string | null; servicePath: string; pricingPath: string; serviceLabel: string },
  index: number
): InquiryQuoteLineItem {
  return {
    id: `${item.pricingPath}:${item.sourceId ?? item.name}:${index}`,
    sourceId: item.sourceId,
    name: item.name,
    unit: item.unit,
    qty: 1,
    unitPrice: item.price,
    categoryTitle: item.categoryTitle,
    note: item.note,
    materialNote: item.materialNote
  };
}

function normalizeQuoteSnapshot(snapshot: InquiryQuoteSnapshot, inquiry: InquiryRow): InquiryQuoteSnapshot {
  const source = snapshot.sourcePricingPath
    ? quoteSourceByPricingPath.get(snapshot.sourcePricingPath) ?? null
    : snapshot.sourceServicePath
      ? quoteSourceByServicePath.get(snapshot.sourceServicePath) ?? null
      : null;

  const selectedWorks = ensureStringArray(snapshot.selectedWorks);
  const selectedWorkIds = ensureStringArray(snapshot.selectedWorkIds);
  const resolvedItems = resolveQuoteItems({
    source,
    sourcePricingPath: snapshot.sourcePricingPath,
    sourceServicePath: snapshot.sourceServicePath,
    workIds: selectedWorkIds,
    works: selectedWorks
  });
  const resolvedLineItems = snapshot.lineItems.length
    ? snapshot.lineItems.map((item, index) => ({
        ...item,
        id: item.id || `line-item-${index + 1}`,
        qty: normalizePositiveInt(item.qty, 1),
        unitPrice: normalizeNonNegativeNumber(item.unitPrice, 0)
      }))
    : resolvedItems.map((item, index) => createQuoteLineItem(item, index));

  const materialCharges = normalizeChargeList(snapshot.materialCharges, "material");
  const extraCharges = normalizeChargeList(snapshot.extraCharges, "extra");

  return {
    sourceServicePath: snapshot.sourceServicePath ?? source?.servicePath ?? null,
    sourcePricingPath: snapshot.sourcePricingPath ?? source?.pricingPath ?? null,
    sourceServiceLabel: snapshot.sourceServiceLabel ?? source?.serviceLabel ?? null,
    confirmedAt: typeof snapshot.confirmedAt === "string" ? snapshot.confirmedAt : null,
    selectedWorks: selectedWorks.length ? selectedWorks : resolvedItems.map((item) => item.name),
    selectedWorkIds: selectedWorkIds.length ? selectedWorkIds : resolvedItems.map((item) => item.sourceId ?? item.name),
    lineItems: resolvedLineItems,
    materialCharges,
    extraCharges,
    vatRate: normalizeVatRate(snapshot.vatRate),
    vatManual: snapshot.vatManual === true,
    profitRate: normalizeRate(snapshot.profitRate, 0.08),
    roundingAdjust: typeof snapshot.roundingAdjust === "number" && Number.isFinite(snapshot.roundingAdjust) ? snapshot.roundingAdjust : undefined,
    deposit: normalizeNonNegativeNumber(snapshot.deposit, 0),
    depositManual: snapshot.depositManual === true,
    workScale: typeof snapshot.workScale === "string" ? snapshot.workScale : "",
    workPeriod: typeof snapshot.workPeriod === "string" ? snapshot.workPeriod : "",
    memo: typeof snapshot.memo === "string" ? snapshot.memo : "",
    // 이전에 발행한 구글시트/PDF 링크를 보존한다 — 이게 없으면 견적을 다시 열 때마다
    // 링크가 사라져 '구글시트 재발행'이 새 시트를 만들어버린다(기존 시트와 단절).
    sheetUrl: typeof snapshot.sheetUrl === "string" ? snapshot.sheetUrl : null,
    pdfUrl: typeof snapshot.pdfUrl === "string" ? snapshot.pdfUrl : null,
    updatedAt: typeof snapshot.updatedAt === "string" ? snapshot.updatedAt : inquiry.created_at ?? null
  };
}

function normalizeChargeList(list: InquiryQuoteCharge[], kind: "material" | "extra") {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => ({
    id: item.id || `${kind}-${index + 1}`,
    label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : `${kind === "material" ? "자재" : "부대"} ${index + 1}`,
    qty: kind === "material" ? normalizePositiveInt(item.qty, 1) : 1,
    unitPrice: kind === "material"
      ? normalizeNonNegativeNumber(item.unitPrice, normalizeNonNegativeNumber(item.amount, 0))
      : normalizeNonNegativeNumber(item.unitPrice, normalizeNonNegativeNumber(item.amount, 0)),
    amount:
      kind === "material"
        ? normalizeNonNegativeNumber(
            item.amount,
            normalizePositiveInt(item.qty, 1) * normalizeNonNegativeNumber(item.unitPrice, normalizeNonNegativeNumber(item.amount, 0))
          )
        : normalizeNonNegativeNumber(item.amount, 0),
    ...(kind === "material" && typeof item.group === "string" && item.group.trim() ? { group: item.group.trim() } : {})
  }));
}

function parseQuoteRows(rows: Array<Array<string | number>>): InquiryQuoteSnapshot {
  const metadata = new Map<string, string>();
  const lineItems: InquiryQuoteLineItem[] = [];
  const materialCharges: InquiryQuoteCharge[] = [];
  const extraCharges: InquiryQuoteCharge[] = [];
  const selectedWorks: string[] = [];
  const selectedWorkIds: string[] = [];
  let sourceServiceLabel: string | null = null;
  let sourceServicePath: string | null = null;
  let sourcePricingPath: string | null = null;
  let memo = "";
  let section: "lineItems" | "materialCharges" | "extraCharges" | null = null;
  let hasLineSection = false;
  let expectingLineHeader = false;

  for (const row of rows) {
    const cells = row.map((cell) => normalizeCell(cell));
    const [first, second, third, fourth, fifth, sixth] = cells;

    if (!first) continue;

    if (first === "작업 항목") {
      section = "lineItems";
      hasLineSection = true;
      expectingLineHeader = true;
      continue;
    }
    if (first === "자재비") {
      section = "materialCharges";
      continue;
    }
    if (first === "부대비용") {
      section = "extraCharges";
      continue;
    }
    if (first === "메모") {
      memo = second ?? "";
      section = null;
      continue;
    }
    if (first === "공급가액" || first === "부가세" || first === "합계") {
      section = null;
      continue;
    }

    if (section === "lineItems") {
      if (expectingLineHeader) {
        if (first !== "항목" || second !== "단위") {
          throw new Error("작업 항목 표 형식이 다릅니다. '항목, 단위, 수량, 단가, 금액, 비고' 헤더를 유지한 샘플 템플릿으로 업로드해 주세요.");
        }
        expectingLineHeader = false;
        continue;
      }
      const qty = normalizePositiveInt(third, 1);
      const unitPrice = normalizeNonNegativeNumber(fourth, 0);
      lineItems.push({
        id: `line-item-${lineItems.length + 1}`,
        sourceId: null,
        name: first,
        unit: second ?? "-",
        qty,
        unitPrice,
        categoryTitle: null,
        note: sixth || null,
        materialNote: null
      });
      continue;
    }

    if (section === "materialCharges") {
      const qty = normalizePositiveInt(third, 1);
      const unitPrice = normalizeNonNegativeNumber(fourth, normalizeNonNegativeNumber(fifth, 0) / Math.max(1, qty));
      const amount = normalizeNonNegativeNumber(fifth, qty * unitPrice);
      materialCharges.push({
        id: `material-${materialCharges.length + 1}`,
        label: first,
        qty,
        unitPrice,
        amount
      });
      continue;
    }

    if (section === "extraCharges") {
      const amount = normalizeNonNegativeNumber(fifth || third || fourth, 0);
      extraCharges.push({
        id: `extra-${extraCharges.length + 1}`,
        label: first,
        qty: 1,
        unitPrice: amount,
        amount
      });
      continue;
    }

    const label = first;
    const value = second ?? "";
    metadata.set(label, value);
  }

  if (!hasLineSection) {
    throw new Error("견적서 형식을 찾지 못했습니다. 샘플 템플릿을 내려받아 같은 구조로 업로드해 주세요.");
  }
  if (expectingLineHeader) {
    throw new Error("작업 항목 헤더가 없습니다. '항목, 단위, 수량, 단가, 금액, 비고' 줄이 있는 템플릿을 사용해 주세요.");
  }

  const sourceLabel = metadata.get("모의견적 출처") ?? metadata.get("견적 출처") ?? null;
  if (sourceLabel) {
    sourceServiceLabel = sourceLabel;
  }
  const sourceServiceValue = metadata.get("서비스 경로") ?? null;
  if (sourceServiceValue) {
    sourceServicePath = sourceServiceValue;
  }
  const sourcePricingValue = metadata.get("가격표 경로") ?? null;
  if (sourcePricingValue) {
    sourcePricingPath = sourcePricingValue;
  }
  const confirmedAt = parseDateTime(metadata.get("컨펌일"));

  if (!selectedWorks.length && lineItems.length) {
    selectedWorks.push(...lineItems.map((item) => item.name));
  }
  if (!selectedWorkIds.length && lineItems.length) {
    selectedWorkIds.push(...lineItems.map((item) => item.sourceId ?? item.name));
  }

  return {
    sourceServicePath,
    sourcePricingPath,
    sourceServiceLabel,
    selectedWorks,
    selectedWorkIds,
    lineItems,
    materialCharges,
    extraCharges,
    // 대표님 견적서는 부가세 별도(0)가 기본. 신규 견적(line 209)과 동일하게 0으로
    // (과거 0.1은 엑셀/시트에서 불러온 견적에 10% 부가세를 임의 부과하는 버그였음).
    vatRate: 0,
    memo,
    confirmedAt,
    updatedAt: metadata.get("최종수정") ?? new Date().toISOString()
  };
}

function normalizeCell(value: string | number) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return value.trim();
}

function parseDateTime(value: string | null | undefined) {
  if (!value || value === "-") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isQuoteSnapshot(value: unknown): value is InquiryQuoteSnapshot {
  if (!value || typeof value !== "object") return false;
  return Array.isArray((value as InquiryQuoteSnapshot).lineItems);
}

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function getStringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizePositiveInt(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? Math.max(1, Math.round(next)) : fallback;
}

function normalizeNonNegativeNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
}

function normalizeVatRate(value: unknown) {
  const next = Number(value);
  // 대표님 견적서는 부가세 별도(0)가 기본. 값이 없거나 잘못되면 0.
  return Number.isFinite(next) && next >= 0 && next <= 1 ? next : 0;
}

function normalizeRate(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 && next <= 1 ? next : fallback;
}

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function buildQuoteDocumentTitle(snapshot: InquiryQuoteSnapshot) {
  return snapshot.sourceServicePath || snapshot.sourcePricingPath ? "견적서" : "상담 견적서";
}

function buildQuoteSheetName(title: string) {
  return title.replace(/\s+/g, "") || "견적서";
}

function buildQuoteFilename(name: string, documentTitle: string, extension: "xlsx" | "pdf") {
  const safeName = name.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_") || "견적서";
  const safeTitle = documentTitle.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_") || "견적서";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeTitle}_${safeName}_${date}.${extension}`;
}

async function ensureKoreanFont(doc: jsPDF) {
  if (!fontCache.promise) {
    fontCache.promise = fetch(koreanFontUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Korean font download failed");
        }
        return response.arrayBuffer();
      })
      .then((buffer) => arrayBufferToBase64(buffer));
  }

  const fontBase64 = await fontCache.promise;
  doc.addFileToVFS("NotoSansKR.ttf", fontBase64);
  doc.addFont("NotoSansKR.ttf", "NotoSansKR", "normal");
  doc.addFont("NotoSansKR.ttf", "NotoSansKR", "bold");
  doc.setFont("NotoSansKR", "normal");
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
