"use client";
import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { Employee, ActiveByDate, DauData } from "@/types";

const SHEET_ID = "1p6cj7feop34eqLNAWNKC1ew8bTA1vl8UUS8e6SISjiY";

// DAU Google Sheets CSV export (requires sheet to be publicly shared)
const WORKFORCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const USER_ACTIVE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1300871074`;
const CACHE_KEY = "gtalk-dashboard:dau-data:v3";
const CACHE_TTL = 20 * 60 * 1000;

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);
  const text = await res.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return result.data;
}

type CachedDauData = {
  ts: number;
  employees: Employee[];
  activeByDate: Record<string, number[]>;
  allDates: string[];
};

function hasUsableWorkforce(employees?: Employee[]): employees is Employee[] {
  if (!employees || employees.length === 0) return false;
  const first = employees[0];
  return Number.isFinite(Number(first.employee_id)) && Boolean(first.division_name || first.department_name || first.team_name);
}

function readCachedDauData(sharedEmployees?: Employee[]): DauData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedDauData;
    if (!cached.ts || Date.now() - cached.ts > CACHE_TTL) return null;

    const activeByDate: ActiveByDate = {};
    Object.entries(cached.activeByDate || {}).forEach(([date, ids]) => {
      activeByDate[date] = new Set(ids.map(Number));
    });

    return {
      employees: hasUsableWorkforce(sharedEmployees) ? sharedEmployees : cached.employees || [],
      activeByDate,
      allDates: cached.allDates || [],
      loading: false,
      error: null,
    };
  } catch {
    return null;
  }
}

function writeCachedDauData(data: DauData) {
  if (typeof window === "undefined") return;
  try {
    const activeByDate: Record<string, number[]> = {};
    Object.entries(data.activeByDate).forEach(([date, ids]) => {
      activeByDate[date] = Array.from(ids);
    });
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      employees: data.employees,
      activeByDate,
      allDates: data.allDates,
    }));
  } catch {
    // Cache is only a speed-up; data rendering should not depend on it.
  }
}

function parseWorkforce(rows: string[][]): Employee[] {
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/ /g, "_"));

  const idx = (name: string) => header.indexOf(name);
  const idxEmpId = idx("employee_id");
  const idxName = idx("employee_name");
  const idxStatus = idx("status");
  const idxJobtitle = idx("jobtitle_name");
  const idxJobtitleVn = idx("jobtitle_name_vn");
  const idxTeam = idx("team_name");
  const idxTeamVn = idx("team_name_vn");
  const idxSection = idx("section_name");
  const idxSectionVn = idx("section_name_vn");
  const idxDept = idx("department_name");
  const idxDeptVn = idx("department_name_vn");
  const idxDiv = idx("division_name");
  const idxDivVn = idx("division_name_vn");
  const idxBu = idx("bu_name");

  const employees: Employee[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const empId = parseInt(r[idxEmpId]?.trim() || "0", 10);
    if (!empId || isNaN(empId)) continue;
    employees.push({
      employee_id: empId,
      employee_name: r[idxName]?.trim() || "",
      status: parseInt(r[idxStatus]?.trim() || "0", 10),
      jobtitle_name: r[idxJobtitleVn]?.trim() || r[idxJobtitle]?.trim() || "",
      jobtitle_name_vn: r[idxJobtitleVn]?.trim() || "",
      team_name: r[idxTeamVn]?.trim() || r[idxTeam]?.trim() || "",
      section_name: r[idxSectionVn]?.trim() || r[idxSection]?.trim() || "",
      department_name: r[idxDeptVn]?.trim() || r[idxDept]?.trim() || "",
      division_name: r[idxDivVn]?.trim() || r[idxDiv]?.trim() || "",
      bu_name: r[idxBu]?.trim() || "",
    });
  }
  return employees;
}

function normalizeDate(raw: string): string {
  const s = raw.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{1,2}\/\d{1,2}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{1,2}-\d{1,2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[2]}/${parts[1]}`;
  }
  return s;
}

function parseUserActive(rows: string[][]): ActiveByDate {
  if (rows.length < 1) return {};
  const header = rows[0];
  const activeByDate: ActiveByDate = {};

  const dateMap: { colIdx: number; dateKey: string }[] = [];
  for (let c = 0; c < header.length; c++) {
    const raw = header[c]?.trim();
    if (!raw) continue;
    const dateKey = normalizeDate(raw);
    if (!activeByDate[dateKey]) activeByDate[dateKey] = new Set<number>();
    dateMap.push({ colIdx: c, dateKey });
  }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    for (const { colIdx, dateKey } of dateMap) {
      const val = row[colIdx]?.trim();
      if (!val) continue;
      const empId = parseInt(val, 10);
      if (!isNaN(empId) && empId > 0) {
        activeByDate[dateKey].add(empId);
      }
    }
  }

  return activeByDate;
}

export function useDauData(sharedEmployees?: Employee[]): DauData & { reload: (force?: boolean) => void; refreshing: boolean } {
  const [data, setData] = useState<DauData>({
    employees: hasUsableWorkforce(sharedEmployees) ? sharedEmployees : [],
    activeByDate: {},
    allDates: [],
    loading: true,
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (force = false) => {
    const canReuseWorkforce = !force && hasUsableWorkforce(sharedEmployees);

    if (!force && typeof window !== "undefined") {
      const cached = readCachedDauData(sharedEmployees);
      if (cached) {
        setData(cached);
        setRefreshing(false);
        return;
      }
    }

    setRefreshing(true);
    setData((prev) => ({
      ...prev,
      employees: canReuseWorkforce ? sharedEmployees : prev.employees,
      loading: prev.employees.length === 0 && Object.keys(prev.activeByDate).length === 0,
      error: null,
    }));

    try {
      const userActiveUrl = force ? `${USER_ACTIVE_URL}&t=${Date.now()}` : USER_ACTIVE_URL;
      const workforcePromise = canReuseWorkforce
        ? Promise.resolve<string[][] | null>(null)
        : fetchCsv(force ? `${WORKFORCE_URL}&t=${Date.now()}` : WORKFORCE_URL);

      const [workforceRows, userActiveRows] = await Promise.all([
        workforcePromise,
        fetchCsv(userActiveUrl),
      ]);

      const employees = canReuseWorkforce ? sharedEmployees : parseWorkforce(workforceRows || []);
      const activeByDate = parseUserActive(userActiveRows);
      const allDates = Object.keys(activeByDate).sort((a, b) => {
        const toMs = (d: string) => {
          const [day, month] = d.split("/").map(Number);
          return new Date(2026, month - 1, day).getTime();
        };
        return toMs(a) - toMs(b);
      });

      const nextData = { employees, activeByDate, allDates, loading: false, error: null };
      setData(nextData);
      writeCachedDauData(nextData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setData((prev) => ({ ...prev, loading: false, error: msg }));
    } finally {
      setRefreshing(false);
    }
  }, [sharedEmployees]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, refreshing, reload: load };
}
