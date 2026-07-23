import { Employee, ActiveByDate, Metrics, TrendPoint, DivisionRow, DrillRow } from "@/types";

// ─── Compute metrics for a given date + employee subset ───────────────────────
export function computeMetrics(
  targetDate: string | null,
  employees: Employee[],
  activeByDate: ActiveByDate
): Metrics {
  if (!targetDate || employees.length === 0) {
    return { totalHc: 0, activeCount: 0, inactiveCount: 0, pct: 0 };
  }
  const activeSet = activeByDate[targetDate] ?? new Set<number>();
  const totalHc = employees.length;
  const activeCount = employees.filter((e) => activeSet.has(e.employee_id)).length;
  const inactiveCount = totalHc - activeCount;
  const pct = totalHc > 0 ? (activeCount / totalHc) * 100 : 0;
  return { totalHc, activeCount, inactiveCount, pct };
}


export interface PeriodMetrics extends Metrics {
  dateCount: number;
  startDate: string | null;
  endDate: string | null;
}

function dateKeyToMs(dateKey: string): number {
  const [day, month] = dateKey.split("/").map(Number);
  if (!day || !month) return Number.NaN;
  return new Date(2026, month - 1, day).getTime();
}

export function computeRollingActiveMetrics(
  targetDate: string | null,
  windowDays: number,
  allDates: string[],
  employees: Employee[],
  activeByDate: ActiveByDate
): PeriodMetrics {
  if (!targetDate || employees.length === 0 || allDates.length === 0) {
    return { totalHc: employees.length, activeCount: 0, inactiveCount: employees.length, pct: 0, dateCount: 0, startDate: null, endDate: targetDate };
  }

  const targetMs = dateKeyToMs(targetDate);
  if (!Number.isFinite(targetMs)) {
    return { totalHc: employees.length, activeCount: 0, inactiveCount: employees.length, pct: 0, dateCount: 0, startDate: null, endDate: targetDate };
  }

  const startMs = targetMs - (windowDays - 1) * 24 * 60 * 60 * 1000;
  const windowDates = allDates.filter((date) => {
    const dateMs = dateKeyToMs(date);
    return Number.isFinite(dateMs) && dateMs >= startMs && dateMs <= targetMs;
  });

  const activeIds = new Set<number>();
  windowDates.forEach((date) => {
    const activeSet = activeByDate[date] ?? new Set<number>();
    activeSet.forEach((employeeId) => activeIds.add(Number(employeeId)));
  });

  const totalHc = employees.length;
  const activeCount = employees.filter((employee) => activeIds.has(employee.employee_id)).length;
  const inactiveCount = totalHc - activeCount;
  const pct = totalHc > 0 ? (activeCount / totalHc) * 100 : 0;

  return {
    totalHc,
    activeCount,
    inactiveCount,
    pct,
    dateCount: windowDates.length,
    startDate: windowDates[0] ?? null,
    endDate: targetDate,
  };
}
// ─── Build trend data across all dates ────────────────────────────────────────
export function buildTrendData(
  allDates: string[],
  employees: Employee[],
  activeByDate: ActiveByDate
): TrendPoint[] {
  return allDates.map((date, i) => {
    const { activeCount, pct } = computeMetrics(date, employees, activeByDate);
    const prevDate = i > 0 ? allDates[i - 1] : null;
    const { activeCount: prevActive } = computeMetrics(prevDate, employees, activeByDate);
    return {
      date,
      active: activeCount,
      pct: Math.round(pct * 10) / 10,
      newUsers: i > 0 ? activeCount - prevActive : 0,
    };
  });
}

// ─── Build division/department breakdown ──────────────────────────────────────
export function buildDivisionData(
  employees: Employee[],
  currDate: string,
  prevDate: string | null,
  activeByDate: ActiveByDate,
  groupKey: keyof Employee = "division_name"
): DivisionRow[] {
  const currSet = activeByDate[currDate] ?? new Set<number>();
  const prevSet = prevDate ? (activeByDate[prevDate] ?? new Set<number>()) : new Set<number>();

  const groups = new Map<string, { total: number; activeCurr: number; activePrev: number }>();
  for (const emp of employees) {
    const key = (emp[groupKey] as string) || "Chưa xác định";
    if (!groups.has(key)) groups.set(key, { total: 0, activeCurr: 0, activePrev: 0 });
    const g = groups.get(key)!;
    g.total++;
    if (currSet.has(emp.employee_id)) g.activeCurr++;
    if (prevSet.has(emp.employee_id)) g.activePrev++;
  }

  return Array.from(groups.entries())
    .map(([name, g]) => {
      const pctCurr = g.total > 0 ? Math.round((g.activeCurr / g.total) * 1000) / 10 : 0;
      const pctPrev = g.total > 0 ? Math.round((g.activePrev / g.total) * 1000) / 10 : 0;
      return {
        name,
        total: g.total,
        activeCurr: g.activeCurr,
        activePrev: g.activePrev,
        pctCurr,
        pctPrev,
        deltaPct: Math.round((pctCurr - pctPrev) * 10) / 10,
        deltaAbs: g.activeCurr - g.activePrev,
      };
    })
    .filter((r) => r.total >= 1)
    .sort((a, b) => b.pctCurr - a.pctCurr);
}

// ─── Build drill-down table ───────────────────────────────────────────────────
export type DrillLevel = "division_name" | "department_name" | "section_name" | "team_name";

export function buildDrillData(
  employees: Employee[],
  currDate: string,
  prevDate: string | null,
  activeByDate: ActiveByDate,
  level: DrillLevel
): DrillRow[] {
  const rows = buildDivisionData(employees, currDate, prevDate, activeByDate, level);
  return rows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    total: r.total,
    activeC: r.activeCurr,
    activeP: r.activePrev,
    inactive: r.total - r.activeCurr,
    pctC: r.pctCurr,
    pctP: r.pctPrev,
    deltaPct: r.deltaPct,
    deltaAbs: r.deltaAbs,
  }));
}

// ─── Get unique values for filter dropdowns ───────────────────────────────────
export function getUniqueValues(employees: Employee[], key: keyof Employee): string[] {
  const vals = employees
    .map((e) => e[key] as string)
    .filter((v) => v && v.trim() !== "");
  return [...new Set(vals)].sort();
}

// ─── Apply filters to employee list ──────────────────────────────────────────
export function applyFilters(
  employees: Employee[],
  filters: {
    divisions?: string[];
    departments?: string[];
    sections?: string[];
    teams?: string[];
  }
): Employee[] {
  let result = employees;
  if (filters.divisions?.length) result = result.filter((e) => filters.divisions!.includes(e.division_name));
  if (filters.departments?.length) result = result.filter((e) => filters.departments!.includes(e.department_name));
  if (filters.sections?.length) result = result.filter((e) => filters.sections!.includes(e.section_name));
  if (filters.teams?.length) result = result.filter((e) => filters.teams!.includes(e.team_name));
  return result;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function fmtNumber(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function fmtDelta(n: number, isPct = false): { text: string; cls: string } {
  const suffix = isPct ? "pp" : "";
  if (n > 0) return { text: `▲ +${isPct ? n.toFixed(1) : fmtNumber(n)}${suffix}`, cls: "pos" };
  if (n < 0) return { text: `▼ ${isPct ? n.toFixed(1) : fmtNumber(n)}${suffix}`, cls: "neg" };
  return { text: `— 0${suffix}`, cls: "neutral" };
}
