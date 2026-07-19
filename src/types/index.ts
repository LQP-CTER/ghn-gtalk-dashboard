// ─── Workforce Employee ──────────────────────────────────────────────────────
export interface Employee {
  employee_id: number;
  employee_name: string;
  status: number;
  jobtitle_name: string;
  jobtitle_name_vn: string;
  team_name: string;
  section_name: string;
  department_name: string;
  division_name: string;
  bu_name: string;
}

// ─── Active snapshot by date ──────────────────────────────────────────────────
// { "17/06": Set<number>, "18/06": Set<number>, ... }
export type ActiveByDate = Record<string, Set<number>>;

// ─── Computed Metrics ─────────────────────────────────────────────────────────
export interface Metrics {
  totalHc: number;
  activeCount: number;
  inactiveCount: number;
  pct: number;
}

// ─── Trend data point ─────────────────────────────────────────────────────────
export interface TrendPoint {
  date: string;
  active: number;
  pct: number;
  newUsers: number;
}

// ─── Division / Department breakdown ─────────────────────────────────────────
export interface DivisionRow {
  name: string;
  total: number;
  activeCurr: number;
  activePrev: number;
  pctCurr: number;
  pctPrev: number;
  deltaPct: number;
  deltaAbs: number;
}

// ─── Drill-down table row ─────────────────────────────────────────────────────
export interface DrillRow {
  rank: number;
  name: string;
  total: number;
  activeC: number;
  activeP: number;
  inactive: number;
  pctC: number;
  pctP: number;
  deltaPct: number;
  deltaAbs: number;
}

// ─── Filters state ───────────────────────────────────────────────────────────
export interface FilterState {
  selectedDate: string;
  divisions: string[];
  departments: string[];
  sections: string[];
  teams: string[];
}

// ─── App data loaded ─────────────────────────────────────────────────────────
export interface DauData {
  employees: Employee[];
  activeByDate: ActiveByDate;
  allDates: string[];
  loading: boolean;
  error: string | null;
}

