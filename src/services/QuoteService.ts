import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export async function downloadQuoteAsXlsx(input: QuoteDownloadContext) {
  const workbook = XLSX.utils.book_new();
  const totals = input.totals;
  const generatedAt = formatDateTime(new Date().toISOString());
  const rows: Array<Array<string | number>> = [
    ["견적서"],
    [],
    ["고객명", input.inquiry.name],
    ["연락처", input.inquiry.phone],
    ["지역", input.inquiry.service_area ?? "-"],
    ["접수일시", formatDateTime(input.inquiry.created_at)],
    ["모의견적 출처", input.quote.sourceServiceLabel ?? input.quote.sourceServicePath ?? "-"],
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
    rows.push([item.label, "", 1, item.amount, item.amount, ""]);
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "견적서");
  XLSX.writeFile(workbook, buildQuoteFilename(input.inquiry.name, "xlsx"));
}

export async function downloadQuoteAsPdf(input: QuoteDownloadContext) {
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
  await ensureKoreanFont(doc);
  const totals = input.totals;
  const margin = 40;
  let cursorY = 40;

  doc.setFont("NotoSansKR", "bold");
  doc.setFontSize(18);
  doc.text("견적서", margin, cursorY);
  cursorY += 22;

  doc.setFont("NotoSansKR", "normal");
  doc.setFontSize(10);
  doc.text(`고객명: ${input.inquiry.name}`, margin, cursorY);
  cursorY += 14;
  doc.text(`연락처: ${input.inquiry.phone}`, margin, cursorY);
  cursorY += 14;
  doc.text(`지역: ${input.inquiry.service_area ?? "-"}`, margin, cursorY);
  cursorY += 14;
  doc.text(`모의견적 출처: ${input.quote.sourceServiceLabel ?? input.quote.sourceServicePath ?? "-"}`, margin, cursorY);
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
    head: [["구분", "항목", "금액"]],
    body: [
      ...input.quote.materialCharges.map((item) => ["자재비", item.label, formatCurrency(item.amount)]),
      ...input.quote.extraCharges.map((item) => ["부대비용", item.label, formatCurrency(item.amount)])
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

  doc.save(buildQuoteFilename(input.inquiry.name, "pdf"));
}

export function buildQuoteSourceLabel(snapshot: InquiryQuoteSnapshot) {
  return snapshot.sourceServiceLabel ?? snapshot.sourcePricingPath ?? snapshot.sourceServicePath ?? "모의견적";
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
    amount: normalizeNonNegativeNumber(item.amount, 0)
  }));
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

function buildQuoteFilename(name: string, extension: "xlsx" | "pdf") {
  const safeName = name.trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_") || "견적서";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeName}_${date}.${extension}`;
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
