import { readSnapshot } from "./db";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby47lJymK5vNJpqRx0mS_00YpwTsoLpBDTTBnyxo_Dkrjp3EMlUMwbNV_FMIubm0LG4/exec";

export interface StaffData {
  employee_id: number;
  division_name_vn: string;
  department_name_vn: string;
  section_name_vn: string;
  team_name_vn: string;
}

export interface ReportData {
  staffList: StaffData[];
  activeByDate: Record<string, number[]>;
  allDates: string[];
}

// ponytail: module-level cache — ceiling is process restart clears it (acceptable for this use case)
let _cache: { data: ReportData; ts: number } | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const SNAPSHOT_SOURCE = "gtalk_download";

function dateKeyToSortValue(dateKey: string): number {
  const [day, month] = dateKey.split("/").map(Number);
  if (!day || !month) return 0;
  return new Date(2026, month - 1, day).getTime();
}

function sortDateKeys(dateKeys: string[]): string[] {
  return [...new Set(dateKeys)].sort((a, b) => dateKeyToSortValue(a) - dateKeyToSortValue(b));
}

function normalizeDateKey(key: string): string {
  const raw = String(key || "").trim();
  if (!raw) return raw;

  if (/^\d{1,2}[-/]\d{1,2}$/.test(raw)) {
    const [day, month] = raw.replace("-", "/").split("/");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw)) {
    const [day, month] = raw.split("/");
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [datePart] = raw.split("T");
    const [, month, day] = datePart.split("-");
    return `${day}/${month}`;
  }

  const cleanKey = raw.split("(")[0].trim();
  const parsed = new Date(cleanKey);
  if (!Number.isNaN(parsed.getTime())) {
    // Google Sheets sometimes serializes DD/MM headers as JS Date strings using
    // MM/DD parsing. For these strings, the parsed month is the intended day and
    // the parsed day is the intended month. Example: Wed Oct 07 -> 10/07.
    const intendedDay = String(parsed.getMonth() + 1).padStart(2, "0");
    const intendedMonth = String(parsed.getDate()).padStart(2, "0");
    return `${intendedDay}/${intendedMonth}`;
  }

  return raw;
}

function normalizeReportData(data: ReportData): ReportData {
  const normalizedActiveByDate: Record<string, number[]> = {};
  const dateCandidates = new Set<string>();

  Object.entries(data.activeByDate || {}).forEach(([rawDate, ids]) => {
    const normalizedDate = normalizeDateKey(rawDate);
    dateCandidates.add(normalizedDate);
    normalizedActiveByDate[normalizedDate] = [
      ...(normalizedActiveByDate[normalizedDate] || []),
      ...(ids || []).map(Number),
    ];
  });

  (data.allDates || []).forEach((rawDate) => {
    const normalizedDate = normalizeDateKey(rawDate);
    dateCandidates.add(normalizedDate);

    if (data.activeByDate?.[rawDate]) {
      normalizedActiveByDate[normalizedDate] = [
        ...(normalizedActiveByDate[normalizedDate] || []),
        ...data.activeByDate[rawDate].map(Number),
      ];
    }
  });

  Object.keys(normalizedActiveByDate).forEach((date) => {
    normalizedActiveByDate[date] = [...new Set(normalizedActiveByDate[date])].sort((a, b) => a - b);
  });

  return {
    staffList: (data.staffList || []).map((staff) => ({
      ...staff,
      employee_id: Number(staff.employee_id),
    })),
    activeByDate: normalizedActiveByDate,
    allDates: sortDateKeys([...dateCandidates].filter(Boolean)),
  };
}

export async function fetchAndProcessData(forceRefresh = false): Promise<ReportData> {
  if (!forceRefresh && _cache && Date.now() - _cache.ts < CACHE_TTL) return _cache.data;

  const databaseData = await readSnapshot<ReportData>(SNAPSHOT_SOURCE).catch(() => null);
  if (databaseData) {
    const normalizedData = normalizeReportData(databaseData);
    _cache = { data: normalizedData, ts: Date.now() };
    return normalizedData;
  }

  const res = await fetch(APPS_SCRIPT_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Apps Script fetch failed: ${res.status}`);

  const data = await res.json() as ReportData;
  const normalizedData = normalizeReportData(data);

  _cache = { data: normalizedData, ts: Date.now() };
  return normalizedData;
}
