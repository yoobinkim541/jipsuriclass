import * as XLSX from "xlsx";
import type jsPDF from "jspdf";
import { electricPriceCategories } from "../electricPriceData";
import { servicePricingRegistry } from "../pricing/registry";
import { waterproofingTilePriceCategories, waterproofingPriceCategories, tilePriceCategories } from "../waterproofingTilePriceData";
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
  vat: number;
  total: number;
};

type QuoteDownloadContext = {
  inquiry: InquiryRow;
  quote: InquiryQuoteSnapshot;
  totals: QuoteTotals;
};

const EXTRA_SOURCE_DEFINITIONS: QuoteSourceDefinition[] = [
  {
    servicePath: "/service/electric",
    pricingPath: "/service/electric/price",
    serviceLabel: "전기공사 서비스",
    categories: normalizeCustomCategories(electricPriceCategories)
  },
  {
    servicePath: "/service/waterproofing",
    pricingPath: "/service/waterproofing/price",
    serviceLabel: "방수 보수 서비스",
    categories: normalizeCustomCategories(waterproofingPriceCategories)
  },
  {
    servicePath: "/service/tile",
    pricingPath: "/service/tile/price",
    serviceLabel: "타일 시공·보수 서비스",
    categories: normalizeCustomCategories(tilePriceCategories)
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

  return normalizeQuoteSnapshot(
    {
      sourceServicePath: source?.servicePath ?? null,
      sourcePricingPath: source?.pricingPath ?? null,
      sourceServiceLabel: source?.serviceLabel ?? null,
      confirmedAt: null,
      selectedWorks,
      selectedWorkIds,
      lineItems: resolvedItems.map((item, index) => createQuoteLineItem(item, index)),
      materialCharges: [],
      extraCharges: [],
      vatRate: 0.1,
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

export function calculateQuoteTotals(quote: InquiryQuoteSnapshot): QuoteTotals {
  const workSubtotal = quote.lineItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const materialSubtotal = quote.materialCharges.reduce((sum, item) => sum + item.amount, 0);
  const extraSubtotal = quote.extraCharges.reduce((sum, item) => sum + item.amount, 0);
  const vat = Math.round((workSubtotal + materialSubtotal + extraSubtotal) * quote.vatRate);

  return {
    workSubtotal,
    materialSubtotal,
    extraSubtotal,
    vat,
    total: workSubtotal + materialSubtotal + extraSubtotal + vat
  };
}

export async function importQuoteFromXlsx(input: { inquiry: InquiryRow; file: File }): Promise<InquiryQuoteSnapshot> {
  const buffer = await input.file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("엑셀 파일에 시트가 없습니다. 샘플 템플릿 형식으로 다시 저장해 주세요.");
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error("엑셀 시트를 읽지 못했습니다. 샘플 템플릿을 내려받아 같은 형식으로 작성해 주세요.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "", blankrows: false }) as Array<
    Array<string | number>
  >;

  if (!rows.length) {
    throw new Error("엑셀 시트가 비어 있습니다. 샘플 템플릿을 내려받아 작성한 뒤 업로드해 주세요.");
  }

  return normalizeQuoteSnapshot(parseQuoteRows(rows), input.inquiry);
}

export async function downloadQuoteTemplateAsXlsx() {
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
    ["공급가액", "", "", "", totals.workSubtotal + totals.materialSubtotal + totals.extraSubtotal, ""],
    ["부가세", "", "", "", totals.vat, ""],
    ["합계", "", "", "", totals.total, ""],
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

  const summaryY = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? materialStart) + 18;
  doc.setFont("NotoSansKR", "bold");
  doc.setFontSize(11);
  doc.text(`공급가액: ${formatCurrency(totals.workSubtotal + totals.materialSubtotal + totals.extraSubtotal)}`, margin, summaryY);
  doc.text(`부가세: ${formatCurrency(totals.vat)}`, margin, summaryY + 16);
  doc.text(`합계: ${formatCurrency(totals.total)}`, margin, summaryY + 32);
  doc.setFont("NotoSansKR", "normal");
  doc.setFontSize(9);
  doc.text(`메모: ${input.quote.memo || "-"}`, margin, summaryY + 54);

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
    memo: typeof snapshot.memo === "string" ? snapshot.memo : "",
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
        : normalizeNonNegativeNumber(item.amount, 0)
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
    vatRate: 0.1,
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
  return Number.isFinite(next) && next >= 0 && next <= 1 ? next : 0.1;
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
