import type { InquiryRow, InquiryStatus } from "../types";

export type SortMode = "newest" | "oldest" | "status" | "name";
export type TimeFilter = "all" | "today" | "7d" | "30d";
export type InquiryFilter = "all" | "pending" | InquiryStatus;

export const statusOrder: Array<InquiryFilter> = ["all", "pending", "new", "contacted", "quoted", "active", "done", "spam"];
export const sortOrder: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "status", label: "상태순" },
  { value: "name", label: "이름순" }
];

export function buildAnalytics(inquiries: InquiryRow[]) {
  const total = inquiries.length;
  const byStatus = inquiries.reduce<Record<InquiryStatus, number>>(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { new: 0, contacted: 0, quoted: 0, active: 0, done: 0, spam: 0 }
  );

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const series = Array.from({ length: 7 }, (_value, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() - (6 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const count = inquiries.filter((item) => {
      const createdAt = new Date(item.created_at);
      return createdAt >= day && createdAt < next;
    }).length;

    return {
      label: new Intl.DateTimeFormat("ko-KR", { weekday: "short" }).format(day),
      dateLabel: new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit" }).format(day),
      count
    };
  });

  const last7Days = series.reduce((sum, item) => sum + item.count, 0);
  const today = series[series.length - 1]?.count ?? 0;

  return { total, byStatus, series, last7Days, today };
}

export function filterInquiries(
  inquiries: InquiryRow[],
  {
    searchQuery,
    statusFilter,
    timeFilter,
    sortMode
  }: {
    searchQuery: string;
    statusFilter: InquiryFilter;
    timeFilter: TimeFilter;
    sortMode: SortMode;
  }
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const now = new Date();
  const todayKey = now.toDateString();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const filtered = inquiries.filter((item) => {
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "pending" && (item.status === "new" || item.status === "contacted")) ||
      item.status === statusFilter;
    const createdAt = new Date(item.created_at);
    const timeMatch =
      timeFilter === "all" ||
      (timeFilter === "today" && createdAt.toDateString() === todayKey) ||
      (timeFilter === "7d" && createdAt >= sevenDaysAgo) ||
      (timeFilter === "30d" && createdAt >= thirtyDaysAgo);
    const searchMatch =
      !normalizedQuery ||
      [item.name, item.phone, item.service_area, item.message, item.user_email, item.source]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery));

    return statusMatch && timeMatch && searchMatch;
  });

  return filtered.slice().sort((left, right) => {
    if (sortMode === "name") {
      return left.name.localeCompare(right.name, "ko-KR");
    }

    if (sortMode === "status") {
      const statusDiff = statusSortValue(left.status) - statusSortValue(right.status);
      return statusDiff || new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    }

    const timeDiff = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    return sortMode === "oldest" ? timeDiff : -timeDiff;
  });
}

export function statusLabel(status: InquiryFilter) {
  const map: Record<InquiryFilter, string> = {
    all: "전체",
    pending: "미처리",
    new: "신규",
    contacted: "연락",
    quoted: "견적",
    active: "진행",
    done: "완료",
    spam: "스팸"
  };
  return map[status];
}

export function statusSortValue(status: InquiryStatus) {
  switch (status) {
    case "new":
      return 0;
    case "contacted":
      return 1;
    case "quoted":
      return 2;
    case "active":
      return 3;
    case "done":
      return 4;
    case "spam":
      return 5;
    default:
      return 6;
  }
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

