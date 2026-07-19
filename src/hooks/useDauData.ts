"use client";
import { useState, useEffect, useCallback } from "react";
import Papa from "papaparse";
import { Employee, ActiveByDate, DauData } from "@/types";

const SHEET_ID = "1p6cj7feop34eqLNAWNKC1ew8bTA1vl8UUS8e6SISjiY";

// DAU Google Sheets CSV export (requires sheet to be publicly shared)
const WORKFORCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
const USER_ACTIVE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1300871074`;

async function fetchCsv(url: string): Promise<string[][]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url} (${res.status})`);
  const text = await res.text();
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  return result.data;
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
  // Handle various date formats: DD/MM/YYYY, DD/MM, DD-MM, YYYY-MM-DD etc.
  const s = raw.trim();
  // DD/MM/YYYY → DD/MM
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  // DD/MM already
  if (/^\d{1,2}\/\d{1,2}$/.test(s)) {
    const parts = s.split("/");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  // DD-MM
  if (/^\d{1,2}-\d{1,2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}`;
  }
  // YYYY-MM-DD → DD/MM
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split("-");
    return `${parts[2]}/${parts[1]}`;
  }
  return s;
}

function parseUserActive(rows: string[][]): ActiveByDate {
  if (rows.length < 1) return {};
  // Row 0 = headers (dates), subsequent rows = employee IDs (one per row, one per column = one date)
  // Format: each column is a date, each row below header is an employee_id active that day
  const header = rows[0];
  const activeByDate: ActiveByDate = {};

  // Initialize sets for each date column (skip empty headers)
  const dateMap: { colIdx: number; dateKey: string }[] = [];
  for (let c = 0; c < header.length; c++) {
    const raw = header[c]?.trim();
    if (!raw) continue;
    const dateKey = normalizeDate(raw);
    if (!activeByDate[dateKey]) activeByDate[dateKey] = new Set<number>();
    dateMap.push({ colIdx: c, dateKey });
  }

  // Fill sets
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

export function useDauData(): DauData & { reload: (force?: boolean) => void } {
  const [data, setData] = useState<DauData>({
    employees: [],
    activeByDate: {},
    allDates: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async (force = false) => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const minDelay = force ? new Promise(r => setTimeout(r, 4500)) : Promise.resolve();
      
      const workforceUrl = force ? `${WORKFORCE_URL}&t=${Date.now()}` : WORKFORCE_URL;
      const userActiveUrl = force ? `${USER_ACTIVE_URL}&t=${Date.now()}` : USER_ACTIVE_URL;

      const [workforceRows, userActiveRows] = await Promise.all([
        fetchCsv(workforceUrl),
        fetchCsv(userActiveUrl),
        minDelay
      ]);

      const employees = parseWorkforce(workforceRows);
      const activeByDate = parseUserActive(userActiveRows);

      // Sort dates: treat as DD/MM, use current year for sorting
      const allDates = Object.keys(activeByDate).sort((a, b) => {
        const toMs = (d: string) => {
          const [day, month] = d.split("/").map(Number);
          return new Date(2026, month - 1, day).getTime(); // updated to 2026
        };
        return toMs(a) - toMs(b);
      });

      setData({ employees, activeByDate, allDates, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setData((prev) => ({ ...prev, loading: false, error: msg }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, reload: load };
}

