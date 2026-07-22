import Papa from "papaparse";
import type { Employee } from "@/types";
import type { ReportData } from "@/lib/gtalkDataUtils";

export type DashboardImportTarget = "gtalk_download" | "dau_tracking";

export type DauSnapshot = {
  employees: Employee[];
  activeByDate: Record<string, number[]>;
  allDates: string[];
};

export type ImportSnapshot = ReportData | DauSnapshot;

export type ParsedActiveUpload = {
  activeByDate: Record<string, number[]>;
  allDates: string[];
  rowCount: number;
  activeCount: number;
  inputMode: "single-date-list" | "date-matrix" | "long-table";
};

const DATE_HEADER_NAMES = new Set(["date", "active_date", "event_date", "ngay", "ngày"]);
const EMPLOYEE_ID_NAMES = new Set(["employee_id", "employeeid", "emp_id", "staff_id", "id"]);

function cleanCell(value: unknown): string {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function normalizeHeader(value: unknown): string {
  return cleanCell(value).toLowerCase().replace(/\s+/g, "_");
}

function toDateKeyFromDateInput(value?: string): string | null {
  const raw = cleanCell(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, month, day] = raw.split("-");
    return `${day}/${month}`;
  }

  return normalizeDateKey(raw);
}

function normalizeDateKey(rawValue: unknown): string | null {
  const raw = cleanCell(rawValue);
  if (!raw) return null;

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [day, month] = raw.split("/");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
  }

  if (/^\d{1,2}[/-]\d{1,2}$/.test(raw)) {
    const [day, month] = raw.replace("-", "/").split("/");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [, month, day] = raw.split("-");
    return `${day}/${month}`;
  }

  if (/^\d{13}$/.test(raw)) {
    const date = new Date(Number(raw));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
      }).format(date);
    }
  }

  return null;
}

function dateKeyToSortValue(dateKey: string): number {
  const [day, month] = dateKey.split("/").map(Number);
  if (!day || !month) return 0;
  return new Date(2026, month - 1, day).getTime();
}

export function sortDateKeys(dateKeys: string[]): string[] {
  return [...new Set(dateKeys)].sort((a, b) => dateKeyToSortValue(a) - dateKeyToSortValue(b));
}

function addEmployee(activeByDate: Record<string, Set<number>>, dateKey: string, rawId: unknown) {
  const employeeId = Number.parseInt(cleanCell(rawId), 10);
  if (!Number.isFinite(employeeId) || employeeId <= 0) return;
  activeByDate[dateKey] ||= new Set<number>();
  activeByDate[dateKey].add(employeeId);
}

function serializeActiveByDate(activeByDate: Record<string, Set<number>>): Record<string, number[]> {
  return Object.fromEntries(
    Object.entries(activeByDate).map(([dateKey, ids]) => [dateKey, [...ids].sort((a, b) => a - b)])
  );
}

export function parseActiveUpload(csvText: string, dateInput?: string): ParsedActiveUpload {
  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
  const rows = parsed.data.filter((row) => row.some((cell) => cleanCell(cell)));
  if (rows.length < 2) {
    throw new Error("File CSV không có đủ dữ liệu để import.");
  }

  const header = rows[0].map(normalizeHeader);
  const employeeIdIndex = header.findIndex((name) => EMPLOYEE_ID_NAMES.has(name));
  const dateIndex = header.findIndex((name) => DATE_HEADER_NAMES.has(name));
  const activeByDate: Record<string, Set<number>> = {};

  if (employeeIdIndex >= 0 && dateIndex >= 0) {
    rows.slice(1).forEach((row) => {
      const dateKey = normalizeDateKey(row[dateIndex]);
      if (!dateKey) return;
      addEmployee(activeByDate, dateKey, row[employeeIdIndex]);
    });
    const active = serializeActiveByDate(activeByDate);
    const allDates = sortDateKeys(Object.keys(active));
    return {
      activeByDate: active,
      allDates,
      rowCount: rows.length - 1,
      activeCount: Object.values(active).reduce((sum, ids) => sum + ids.length, 0),
      inputMode: "long-table",
    };
  }

  if (employeeIdIndex >= 0) {
    const dateKey = toDateKeyFromDateInput(dateInput);
    if (!dateKey) {
      throw new Error("File chỉ có danh sách employee_id, vui lòng chọn ngày dữ liệu trước khi upload.");
    }
    rows.slice(1).forEach((row) => addEmployee(activeByDate, dateKey, row[employeeIdIndex]));
    const active = serializeActiveByDate(activeByDate);
    return {
      activeByDate: active,
      allDates: [dateKey],
      rowCount: rows.length - 1,
      activeCount: active[dateKey]?.length ?? 0,
      inputMode: "single-date-list",
    };
  }

  const dateColumns = rows[0]
    .map((cell, colIdx) => ({ colIdx, dateKey: normalizeDateKey(cell) }))
    .filter((item): item is { colIdx: number; dateKey: string } => Boolean(item.dateKey));

  if (dateColumns.length === 0) {
    throw new Error("Không nhận diện được cột ngày hoặc cột employee_id trong file CSV.");
  }

  rows.slice(1).forEach((row) => {
    dateColumns.forEach(({ colIdx, dateKey }) => addEmployee(activeByDate, dateKey, row[colIdx]));
  });

  const active = serializeActiveByDate(activeByDate);
  const allDates = sortDateKeys(Object.keys(active));
  return {
    activeByDate: active,
    allDates,
    rowCount: rows.length - 1,
    activeCount: Object.values(active).reduce((sum, ids) => sum + ids.length, 0),
    inputMode: "date-matrix",
  };
}

export function mergeActiveUpload(target: DashboardImportTarget, current: ImportSnapshot | null, upload: ParsedActiveUpload) {
  if (target === "gtalk_download") {
    const currentReport = current as ReportData | null;
    if (!currentReport?.staffList?.length) {
      throw new Error("Chưa có workforce của Gtalk Download trong database. Vui lòng seed dữ liệu nền trước.");
    }

    const activeByDate = { ...(currentReport.activeByDate || {}), ...upload.activeByDate };
    return {
      staffList: currentReport.staffList,
      activeByDate,
      allDates: sortDateKeys(Object.keys(activeByDate)),
    } satisfies ReportData;
  }

  const currentDau = current as DauSnapshot | null;
  if (!currentDau?.employees?.length) {
    throw new Error("Chưa có workforce của DAU trong database. Vui lòng seed dữ liệu nền trước.");
  }

  const activeByDate = { ...(currentDau.activeByDate || {}), ...upload.activeByDate };
  return {
    employees: currentDau.employees,
    activeByDate,
    allDates: sortDateKeys(Object.keys(activeByDate)),
  } satisfies DauSnapshot;
}

export function removeDateFromSnapshot(target: DashboardImportTarget, current: ImportSnapshot | null, dateKey: string) {
  const normalizedDate = toDateKeyFromDateInput(dateKey);
  if (!normalizedDate) {
    throw new Error("Ngày cần xóa không hợp lệ.");
  }

  if (target === "gtalk_download") {
    const currentReport = current as ReportData | null;
    if (!currentReport?.staffList?.length) {
      throw new Error("Chưa có dữ liệu Gtalk Download trong database.");
    }
    if (!currentReport.activeByDate?.[normalizedDate]) {
      throw new Error(`Không tìm thấy ngày ${normalizedDate} trong dashboard Gtalk Download.`);
    }

    const activeByDate = { ...(currentReport.activeByDate || {}) };
    const removedUsers = activeByDate[normalizedDate]?.length ?? 0;
    delete activeByDate[normalizedDate];

    return {
      snapshot: {
        staffList: currentReport.staffList,
        activeByDate,
        allDates: sortDateKeys(Object.keys(activeByDate)),
      } satisfies ReportData,
      removedDate: normalizedDate,
      removedUsers,
    };
  }

  const currentDau = current as DauSnapshot | null;
  if (!currentDau?.employees?.length) {
    throw new Error("Chưa có dữ liệu DAU trong database.");
  }
  if (!currentDau.activeByDate?.[normalizedDate]) {
    throw new Error(`Không tìm thấy ngày ${normalizedDate} trong dashboard DAU.`);
  }

  const activeByDate = { ...(currentDau.activeByDate || {}) };
  const removedUsers = activeByDate[normalizedDate]?.length ?? 0;
  delete activeByDate[normalizedDate];

  return {
    snapshot: {
      employees: currentDau.employees,
      activeByDate,
      allDates: sortDateKeys(Object.keys(activeByDate)),
    } satisfies DauSnapshot,
    removedDate: normalizedDate,
    removedUsers,
  };
}
