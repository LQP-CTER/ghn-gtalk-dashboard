'use client';

import React, { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { ReportData, StaffData } from '@/lib/gtalkDataUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ComposedChart,
  Area, Cell, ReferenceLine
} from 'recharts';
import { useRouter } from 'next/navigation';

interface DashboardProps { data: ReportData; externalTab?: 'dashboard' | 'detail'; }

function safeUnique(arr: string[]): string[] {
  return [...new Set(arr)].filter(x => x && x.trim() !== '').sort();
}

function buildDownloadLoginSet(
  allDates: string[],
  activeByDate: Record<string, number[]>,
  throughDate: string | null
) {
  const endIndex = throughDate ? allDates.indexOf(throughDate) : -1;
  const dates = endIndex >= 0 ? allDates.slice(0, endIndex + 1) : [];
  const ids = new Set<number>();
  dates.forEach(date => {
    (activeByDate[date] || []).forEach(id => ids.add(Number(id)));
  });
  return ids;
}

function computeMetricsFromSet(staff: StaffData[], downloadLoginSet: Set<number>) {
  if (staff.length === 0) return { totalHc: 0, gtalkAll: 0, mappedActive: 0, pctMapped: 0 };
  const totalHc = staff.length;
  const gtalkAll = downloadLoginSet.size;
  const mappedActive = staff.filter(s => downloadLoginSet.has(Number(s.employee_id))).length;
  const pctMapped = totalHc > 0 ? (mappedActive / totalHc) * 100 : 0;
  return { totalHc, gtalkAll, mappedActive, pctMapped };
}

// ── Sidebar filter select ─────────────────────────────────────────────────────
function FilterSelect({
  label, options, values, onChange
}: { label: string; options: string[]; values: string[]; onChange: (v: string[]) => void }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const toggle = (val: string) =>
    onChange(values.includes(val) ? values.filter(v => v !== val) : [...values, val]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  const count = values.length;

  if (options.length === 0) return (
    <div style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#94a3b8", border: "1px solid rgba(15,23,42,0.07)", borderRadius: 8 }}>
      {label}: Không có dữ liệu
    </div>
  );

  return (
    <div className="filter-group">
      <button
        className="filter-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={count > 0 ? { color: "#6366f1", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.04)" } : {}}
      >
        <span>{label}{count > 0 && <span style={{ marginLeft: 6, background: "#6366f1", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{count}</span>}</span>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
      </button>

      {isOpen && (
        <div className="sidebar-multiselect">
          <input 
            type="text" 
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: "192px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {filteredOptions.length === 0
              ? <div style={{ fontSize: "0.78rem", color: "#94a3b8", padding: "4px 8px" }}>Không tìm thấy</div>
              : filteredOptions.map(opt => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    checked={values.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={opt}>
                    {opt}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}
      {values.length > 0 && (
        <div className="text-[0.65rem] text-blue-600 mt-1 ml-1 font-medium">{values.length} mục đã chọn</div>
      )}
    </div>
  );
}

// ── Single Date Select (Scrollable) ───────────────────────────────────────────
function DateSelect({
  label, options, value, onChange
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const visibleOptions = useMemo(() => [...options].reverse(), [options]);
  const filteredOptions = visibleOptions.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="filter-group mb-6">
      <div className="sidebar-label">{label}</div>
      <button
        className="filter-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: "#6366f1", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.04)" }}
      >
        <span className="font-bold">{value}</span>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
      </button>

      {isOpen && (
        <div className="sidebar-multiselect">
          <input 
            type="text" 
            placeholder="Tìm kiếm ngày..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ maxHeight: "192px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {filteredOptions.length === 0
              ? <div style={{ fontSize: "0.78rem", color: "#94a3b8", padding: "4px 8px" }}>Không tìm thấy</div>
              : filteredOptions.map(opt => (
                <label key={opt}>
                  <input
                    type="radio"
                    name="date_select"
                    checked={value === opt}
                    onChange={() => { onChange(opt); setIsOpen(false); }}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={opt}>
                    {opt}
                  </span>
                </label>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, delta, deltaText, tone }: {
  label: string; value: string; sub: string; delta: number; deltaText: string; tone: 'default' | 'green' | 'red' | 'blue';
}) {
  return (
    <div className={`kpi-card ${tone === 'default' ? '' : tone}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-meta-row">
        {deltaText && (
          <span className={`metric-delta ${delta > 0 ? 'is-positive' : delta < 0 ? 'is-negative' : ''}`}>
            {deltaText}
          </span>
        )}
        <span className="kpi-sub">{sub}</span>
      </div>
    </div>
  );
}
// ── Inline percent bar ────────────────────────────────────────────────────────
function MiniBar({ pct }: { pct: number }) {
  return (
    <div className="bg-slate-100 h-2 rounded-full w-24 overflow-hidden shadow-inner">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function DeltaCell({ val, isPercent = false }: { val: number; isPercent?: boolean }) {
  const cls = val > 0 ? 'text-emerald-600 bg-emerald-50/50' : val < 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400';
  const sign = val > 0 ? '+' : '';
  return (
    <span className={`inline-block font-semibold px-2 py-0.5 rounded ${cls}`}>
      {sign}{isPercent ? val.toFixed(1) + 'pp' : val.toLocaleString()}
    </span>
  );
}

// ── Breakdown table ───────────────────────────────────────────────────────────
type BreakdownRow = {
  name: string; total: number; active: number; inactive: number;
  pctCurr: number; pctPrev: number; deltaPct: number; deltaAbs: number;
};

function BreakdownTable({ rows, colLabel }: { rows: BreakdownRow[]; colLabel: string }) {
  const totalHC = rows.reduce((s, r) => s + r.total, 0);
  const totalAc = rows.reduce((s, r) => s + r.active, 0);
  const totalInac = rows.reduce((s, r) => s + r.inactive, 0);
  const totalPct = totalHC > 0 ? totalAc / totalHC * 100 : 0;
  const totalPctP = rows.reduce((s, r) => s + r.pctPrev * r.total, 0) / (totalHC || 1);
  return (
    <div className="overflow-auto max-h-[520px] rounded-xl border border-slate-200/60 bg-white custom-scrollbar shadow-sm">
      <table className="modern-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{colLabel}</th>
            <th className="text-right">Total HC</th>
            <th className="text-right text-emerald-600">Active</th>
            <th className="text-right text-rose-500">Chưa</th>
            <th className="text-right">% Active</th>
            <th></th>
            <th className="text-right">% Prev</th>
            <th className="text-right">Δ%</th>
            <th className="text-right">Δ Abs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name}>
              <td className="text-slate-400 text-[0.7rem]">{i + 1}</td>
              <td className="text-slate-800 font-medium max-w-[240px] truncate" title={r.name}>{r.name || 'Chưa xác định'}</td>
              <td className="text-right tabular-nums">{r.total.toLocaleString()}</td>
              <td className="text-right tabular-nums font-semibold text-emerald-700">{r.active.toLocaleString()}</td>
              <td className="text-right tabular-nums text-rose-500">{r.inactive.toLocaleString()}</td>
              <td className="text-right font-bold text-slate-800 tabular-nums">{r.pctCurr.toFixed(1)}%</td>
              <td><MiniBar pct={r.pctCurr} /></td>
              <td className="text-right tabular-nums text-slate-500">{r.pctPrev.toFixed(1)}%</td>
              <td className="text-right"><DeltaCell val={r.deltaPct} isPercent /></td>
              <td className="text-right"><DeltaCell val={r.deltaAbs} /></td>
            </tr>
          ))}
          <tr className="total-row">
            <td></td>
            <td>TỔNG CỘNG</td>
            <td className="text-right tabular-nums">{totalHC.toLocaleString()}</td>
            <td className="text-right tabular-nums text-emerald-700">{totalAc.toLocaleString()}</td>
            <td className="text-right tabular-nums text-rose-600">{totalInac.toLocaleString()}</td>
            <td className="text-right">{totalPct.toFixed(1)}%</td>
            <td></td>
            <td className="text-right text-slate-500">{totalPctP.toFixed(1)}%</td>
            <td></td><td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ data, externalTab = 'dashboard' }: DashboardProps) {
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const { staffList, activeByDate, allDates } = data;

  const [selectedDate, setSelectedDate] = useState(allDates[allDates.length - 1] || '');
  const [selDiv, setSelDiv] = useState<string[]>([]);
  const [selDept, setSelDept] = useState<string[]>([]);
  const [selSec, setSelSec] = useState<string[]>([]);
  const [selTeam, setSelTeam] = useState<string[]>([]);
  const [breakdownLevel, setBreakdownLevel] = useState<'division' | 'department' | 'section' | 'team'>('division');
  const [detailSearch, setDetailSearch] = useState('');
  const [detailStatusFilter, setDetailStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    setNow(new Date().toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }));
  }, []);

  // Cascade filter base (sidebar)
  const sidebarStaff = useMemo(() => {
    let f = staffList;
    if (selDiv.length > 0) f = f.filter(s => selDiv.includes(s.division_name_vn));
    if (selDept.length > 0) f = f.filter(s => selDept.includes(s.department_name_vn));
    if (selSec.length > 0) f = f.filter(s => selSec.includes(s.section_name_vn));
    if (selTeam.length > 0) f = f.filter(s => selTeam.includes(s.team_name_vn));
    return f;
  }, [staffList, selDiv, selDept, selSec, selTeam]);

  const allDivisions = useMemo(() => safeUnique(staffList.map(s => s.division_name_vn)), [staffList]);
  const allDepts = useMemo(() => safeUnique(
    staffList.filter(s => selDiv.length === 0 || selDiv.includes(s.division_name_vn)).map(s => s.department_name_vn)
  ), [staffList, selDiv]);
  const allSecs = useMemo(() => safeUnique(
    staffList.filter(s =>
      (selDiv.length === 0 || selDiv.includes(s.division_name_vn)) &&
      (selDept.length === 0 || selDept.includes(s.department_name_vn))
    ).map(s => s.section_name_vn)
  ), [staffList, selDiv, selDept]);
  const allTeams = useMemo(() => safeUnique(
    staffList.filter(s =>
      (selDiv.length === 0 || selDiv.includes(s.division_name_vn)) &&
      (selDept.length === 0 || selDept.includes(s.department_name_vn)) &&
      (selSec.length === 0 || selSec.includes(s.section_name_vn))
    ).map(s => s.team_name_vn)
  ), [staffList, selDiv, selDept, selSec]);

  const currentIdx = allDates.indexOf(selectedDate);
  const prevDate = currentIdx > 0 ? allDates[currentIdx - 1] : null;
  const firstDate = allDates[0];

  const currDownloadSet = useMemo(
    () => buildDownloadLoginSet(allDates, activeByDate, selectedDate),
    [allDates, activeByDate, selectedDate]
  );
  const prevDownloadSet = useMemo(
    () => buildDownloadLoginSet(allDates, activeByDate, prevDate),
    [allDates, activeByDate, prevDate]
  );
  const firstDownloadSet = useMemo(
    () => buildDownloadLoginSet(allDates, activeByDate, firstDate),
    [allDates, activeByDate, firstDate]
  );

  const curr = useMemo(() => computeMetricsFromSet(sidebarStaff, currDownloadSet), [sidebarStaff, currDownloadSet]);
  const prev = useMemo(() => computeMetricsFromSet(sidebarStaff, prevDownloadSet), [sidebarStaff, prevDownloadSet]);
  const first = useMemo(() => computeMetricsFromSet(sidebarStaff, firstDownloadSet), [sidebarStaff, firstDownloadSet]);

  const deltaActive = curr.mappedActive - prev.mappedActive;
  const deltaPct = curr.pctMapped - prev.pctMapped;
  const cumulativeGrowth = curr.pctMapped - first.pctMapped;

  // Trend data: Gtalk Download is cumulative up to each report date, unlike DAU daily usage.
  const trendData = useMemo(() => allDates.map((d, i) => {
    const currentSet = buildDownloadLoginSet(allDates, activeByDate, d);
    const previousSet = i > 0 ? buildDownloadLoginSet(allDates, activeByDate, allDates[i - 1]) : new Set<number>();
    const m = computeMetricsFromSet(sidebarStaff, currentSet);
    const mPrev = i > 0 ? computeMetricsFromSet(sidebarStaff, previousSet) : null;
    return {
      date: d,
      active: m.mappedActive,
      pct: parseFloat(m.pctMapped.toFixed(2)),
      newUsers: mPrev ? m.mappedActive - mPrev.mappedActive : 0,
    };
  }), [allDates, sidebarStaff, activeByDate]);

  // Division chart data
  const divisionData = useMemo(() => {
    const activeSet = currDownloadSet;
    const activeSetPrev = prevDownloadSet;
    return safeUnique(sidebarStaff.map(s => s.division_name_vn)).map(div => {
      const staff = sidebarStaff.filter(s => s.division_name_vn === div);
      const total = staff.length;
      const active = staff.filter(s => activeSet.has(Number(s.employee_id))).length;
      const activePrev = staff.filter(s => activeSetPrev.has(Number(s.employee_id))).length;
      const pctCurr = total > 0 ? active / total * 100 : 0;
      const pctPrev = total > 0 ? activePrev / total * 100 : 0;
      return { name: div, total, active, activePrev, pctCurr: parseFloat(pctCurr.toFixed(1)), pctPrev: parseFloat(pctPrev.toFixed(1)) };
    }).sort((a, b) => a.pctCurr - b.pctCurr);
  }, [sidebarStaff, currDownloadSet, prevDownloadSet]);

  // Breakdown table rows
  const breakdownRows = useMemo((): BreakdownRow[] => {
    const activeSet = currDownloadSet;
    const activeSetPrev = prevDownloadSet;
    const keyFn = (s: StaffData) => {
      if (breakdownLevel === 'division') return s.division_name_vn;
      if (breakdownLevel === 'department') return `${s.division_name_vn} › ${s.department_name_vn}`;
      if (breakdownLevel === 'section') return `${s.division_name_vn} › ${s.department_name_vn} › ${s.section_name_vn}`;
      return `${s.division_name_vn} › ${s.department_name_vn} › ${s.section_name_vn} › ${s.team_name_vn}`;
    };
    const map = new Map<string, { total: number; active: number; prev: number }>();
    sidebarStaff.forEach(s => {
      const key = keyFn(s);
      const id = Number(s.employee_id);
      if (!map.has(key)) map.set(key, { total: 0, active: 0, prev: 0 });
      const r = map.get(key)!;
      r.total++;
      if (activeSet.has(id)) r.active++;
      if (activeSetPrev.has(id)) r.prev++;
    });
    return [...map.entries()]
      .map(([name, v]) => {
        const pctCurr = v.total > 0 ? v.active / v.total * 100 : 0;
        const pctPrev = v.total > 0 ? v.prev / v.total * 100 : 0;
        return {
          name,
          total: v.total,
          active: v.active,
          inactive: v.total - v.active,
          pctCurr: parseFloat(pctCurr.toFixed(1)),
          pctPrev: parseFloat(pctPrev.toFixed(1)),
          deltaPct: parseFloat((pctCurr - pctPrev).toFixed(1)),
          deltaAbs: v.active - v.prev,
        };
      })
      .sort((a, b) => b.pctCurr - a.pctCurr);
  }, [sidebarStaff, currDownloadSet, prevDownloadSet, breakdownLevel]);

  // Detail tab: per-person list
  const detailRows = useMemo(() => {
    const activeSet = currDownloadSet;
    return sidebarStaff
      .map(s => ({ ...s, isActive: activeSet.has(Number(s.employee_id)) }))
      .filter(s => {
        if (detailStatusFilter === 'active' && !s.isActive) return false;
        if (detailStatusFilter === 'inactive' && s.isActive) return false;
        
        if (!detailSearch) return true;
        const q = detailSearch.toLowerCase();
        return (
          String(s.employee_id).includes(q) ||
          s.division_name_vn?.toLowerCase().includes(q) ||
          s.department_name_vn?.toLowerCase().includes(q) ||
          s.section_name_vn?.toLowerCase().includes(q) ||
          s.team_name_vn?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));
  }, [sidebarStaff, currDownloadSet, detailSearch, detailStatusFilter]);

  const handleDownloadDetailRows = useCallback(() => {
    if (detailRows.length === 0) return;

    const csvEscape = (value: string | number | null | undefined) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const header = [
      'Employee ID',
      'Division',
      'Department',
      'Section',
      'Team',
      'Download/Login Status',
      'Report Date',
    ];

    const rows = detailRows.map(s => [
      s.employee_id,
      s.division_name_vn,
      s.department_name_vn,
      s.section_name_vn,
      s.team_name_vn,
      s.isActive ? 'Da tai/login' : 'Chua tai/login',
      selectedDate,
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(csvEscape).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GtalkDownload_ListUser_${selectedDate.replace(/\//g, '-')}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [detailRows, selectedDate]);
  const resetFilters = useCallback(() => {
    setSelDiv([]); setSelDept([]); setSelSec([]); setSelTeam([]);
  }, []);

  const levelLabels = { division: 'Khối (Division)', department: 'Phòng Ban (Department)', section: 'Bộ Phận (Section)', team: 'Team' };

  return (
    <div className="layout report-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div>
            <div className="app-title">Gtalk Download</div>
            <div className="app-sub">Gtalk Download Sheet</div>
          </div>
        </div>

        <div className="sidebar-body">
          {/* Reload */}
          <button
            onClick={() => startRefreshTransition(() => router.push('/?refresh=true&t=' + Date.now()))}
            className="sidebar-reload-btn"
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            {isRefreshing ? "Đang tải dữ liệu..." : "Tải lại dữ liệu"}
          </button>
          <div className={`reload-status ${isRefreshing ? 'is-loading' : 'is-ready'}`} role="status" aria-live="polite">
            {isRefreshing ? "Đang lấy dữ liệu mới từ Gtalk Download Sheet" : `Sẵn sàng · Cập nhật gần nhất ${now || 'vừa xong'}`}
          </div>

          <DateSelect 
            label="Ngày báo cáo" 
            options={allDates} 
            value={selectedDate} 
            onChange={setSelectedDate} 
          />

          {/* Filters header */}
          <div className="sidebar-label" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Bộ Lọc</span>
          </div>

          <FilterSelect label="Khối (Division)" options={allDivisions} values={selDiv} onChange={v => { setSelDiv(v); setSelDept([]); setSelSec([]); setSelTeam([]); }} />
          <FilterSelect label="Phòng Ban (Department)" options={allDepts} values={selDept} onChange={v => { setSelDept(v); setSelSec([]); setSelTeam([]); }} />
          <FilterSelect label="Bộ Phận (Section)" options={allSecs} values={selSec} onChange={v => { setSelSec(v); setSelTeam([]); }} />
          <FilterSelect label="Team" options={allTeams} values={selTeam} onChange={setSelTeam} />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main custom-scrollbar overflow-y-auto">
        {/* Header */}
        <header className="report-header mb-2">
          <div>
            <h1>GTALK DOWNLOAD & LOGIN OVERVIEW</h1>
            <div className="header-sub">
              Nguồn Gtalk Download riêng · Theo dõi ID đã tải và login vào Gtalk · Ngày <strong>{selectedDate}</strong> · Đã tải/login: {curr.mappedActive.toLocaleString()} / {curr.totalHc.toLocaleString()} ({curr.pctMapped.toFixed(1)}%)
            </div>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {now ? `Cập nhật: ${now}` : ''}
          </div>
        </header>

        <div className="content">
          {externalTab === 'dashboard' && (
            <div className="space-y-6">
              {/* KPI Row */}
              <div className="kpi-grid">
                <KPICard label="Tổng Nhân Sự" value={curr.totalHc.toLocaleString()} sub="Tổng HC trong sheet Download" delta={0} deltaText="" tone="default" />
                <KPICard label="Đã tải/login" value={curr.mappedActive.toLocaleString()} sub={`Tăng lũy kế đến kỳ trước (${prevDate || '—'})`} delta={deltaActive} deltaText={`${Math.abs(deltaActive).toLocaleString()} người`} tone="green" />
                <KPICard label="Chưa tải/login" value={(curr.totalHc - curr.mappedActive).toLocaleString()} sub="Cần hành động" delta={-(curr.totalHc - curr.mappedActive)} deltaText="thiếu" tone="red" />
                <KPICard label="Tỷ lệ tải/login" value={`${curr.pctMapped.toFixed(1)}%`} sub={`So mốc đầu: ${cumulativeGrowth >= 0 ? '+' : ''}${cumulativeGrowth.toFixed(1)}pp`} delta={deltaPct} deltaText={`${Math.abs(deltaPct).toFixed(1)}pp`} tone="blue" />
              </div>

              {/* Trend */}
              <div className="section">
                <h3 className="section-title">Xu hướng tải/login Gtalk theo thời gian</h3>
                <div className="text-[0.75rem] text-blue-700/80 bg-blue-50/50 border border-blue-100 px-4 py-2.5 rounded-lg mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                  {trendData.length >= 2
                    ? <span>Tỷ lệ tải/login lũy kế tăng từ <strong>{trendData[0].pct}%</strong> lên <strong>{trendData[trendData.length - 1].pct}%</strong> (+{(trendData[trendData.length - 1].pct - trendData[0].pct).toFixed(1)}pp) qua {allDates.length} kỳ báo cáo.</span>
                    : 'Chưa đủ dữ liệu để vẽ xu hướng'}
                </div>
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trendData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#cbd5e1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={v => `${v}%`} domain={[0, 105]} tick={{ fontSize: 11, fill: '#3b82f6', fontWeight: 600 }} axisLine={false} tickLine={false} dx={10} />
                      <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '13px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} />
                      <Bar yAxisId="left" dataKey="newUsers" name="ID tải/login mới" fill="url(#barColor)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      <Area yAxisId="right" type="monotone" dataKey="pct" stroke="none" fill="url(#colorPct)" />
                      <Line yAxisId="right" type="monotone" dataKey="pct" name="% Download/Login" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Division breakdown */}
              <div className="section">
                <h3 className="section-title">Phân Tích Theo Khối (Division)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr] gap-6 items-start">
                  <div className="flex-1 min-w-0" style={{ minHeight: Math.max(220, divisionData.length * 36) }}>
                    <ResponsiveContainer width="100%" height={Math.max(220, divisionData.length * 36)}>
                      <BarChart data={divisionData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }} barSize={10}>
                        <CartesianGrid horizontal={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                        <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 500 }} width={90} tickFormatter={(v) => v.length > 14 ? v.substring(0, 12) + '…' : v} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="pctPrev" name={`Kỳ trước (${prevDate || '—'})`} fill="#cbd5e1" radius={[0, 3, 3, 0]} />
                        <Bar dataKey="pctCurr" name={`Hiện tại (${selectedDate})`} fill="#3b82f6" radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full">
                    <div className="overflow-auto max-h-[500px] rounded-xl border border-slate-200/60 bg-white custom-scrollbar shadow-sm">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Khối</th>
                            <th className="text-right">HC</th>
                            <th className="text-right text-emerald-600">Active</th>
                            <th className="text-right text-blue-600">%</th>
                            <th className="text-right">Δ%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...divisionData].sort((a, b) => b.pctCurr - a.pctCurr).map(r => {
                            const delta = r.pctCurr - r.pctPrev;
                            return (
                              <tr key={r.name}>
                                <td className="font-medium max-w-[200px] truncate" title={r.name}>{r.name}</td>
                                <td className="text-right tabular-nums">{r.total.toLocaleString()}</td>
                                <td className="text-right tabular-nums text-emerald-600 font-medium">{r.active.toLocaleString()}</td>
                                <td className="text-right font-bold text-slate-800">{r.pctCurr.toFixed(1)}%</td>
                                <td className="text-right"><DeltaCell val={delta} isPercent /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drill-down breakdown */}
              <div className="section">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <h3 className="section-title !mb-0">Chi Tiết Phân Bổ (Drill-Down)</h3>
                  <div className="flex gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 mt-4 md:mt-0">
                    {(['division', 'department', 'section', 'team'] as const).map(lv => (
                      <button
                        key={lv}
                        onClick={() => setBreakdownLevel(lv)}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                          breakdownLevel === lv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                        }`}
                      >
                        {levelLabels[lv]}
                      </button>
                    ))}
                  </div>
                </div>
                <BreakdownTable rows={breakdownRows} colLabel={levelLabels[breakdownLevel]} />
              </div>
            </div>
          )}

          {externalTab === 'detail' && (
            <div className="chart-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="section-title" style={{ marginBottom: 0 }}>
                  Danh sách chi tiết User (Ngày {selectedDate})
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <select
                    value={detailStatusFilter}
                    onChange={e => setDetailStatusFilter(e.target.value as any)}
                    className="modern-select"
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      outline: "none",
                      fontSize: "0.85rem",
                      backgroundColor: "white",
                      color: "#334155"
                    }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đã tải/login (Màu Xanh)</option>
                    <option value="inactive">Chưa tải/login (Màu Đỏ)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Tìm theo ID, tên, phòng ban..."
                    value={detailSearch}
                    onChange={e => setDetailSearch(e.target.value)}
                    className="modern-search-input"
                  />
                  <button
                    type="button"
                    onClick={handleDownloadDetailRows}
                    disabled={detailRows.length === 0}
                    className="download-file-btn"
                  >
                    Tải file CSV
                  </button>
                </div>
              </div>

              <div className="section-msg">
                Tổng số: <strong>{detailRows.length.toLocaleString()}</strong> user
                {detailSearch && " (trong kết quả tìm kiếm)"}
                <span className="text-slate-300 mx-2">|</span>
                <span className="text-emerald-600 font-bold">{detailRows.filter(r => r.isActive).length.toLocaleString()} AC</span>
                <span className="text-slate-300 mx-2">|</span>
                <span className="text-rose-500 font-bold">{detailRows.filter(r => !r.isActive).length.toLocaleString()} Inac</span>
              </div>

              <div className="modern-table-wrap">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Khối</th>
                      <th>Phòng Ban</th>
                      <th>Bộ Phận</th>
                      <th>Team</th>
                      <th className="text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.slice(0, 500).map((s, i) => (
                      <tr key={i}>
                        <td className="tabular-nums font-mono font-medium text-slate-500">{s.employee_id}</td>
                        <td className="max-w-[150px] truncate" title={s.division_name_vn}>{s.division_name_vn}</td>
                        <td className="max-w-[150px] truncate" title={s.department_name_vn}>{s.department_name_vn}</td>
                        <td className="max-w-[120px] truncate" title={s.section_name_vn}>{s.section_name_vn}</td>
                        <td className="max-w-[120px] truncate" title={s.team_name_vn}>{s.team_name_vn}</td>
                        <td className="text-center">
                          <span style={{ 
                            color: s.isActive ? "#16a34a" : "#f43f5e", 
                            fontWeight: 700, 
                            fontSize: "0.75rem",
                            background: s.isActive ? "#f0fdf4" : "#fff1f2",
                            padding: "4px 8px",
                            borderRadius: "12px"
                          }}>
                            {s.isActive ? 'ĐÃ TẢI/LOGIN' : 'CHƯA TẢI/LOGIN'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {detailRows.length > 500 && (
                  <div className="text-center py-4 text-xs font-medium text-slate-400 border-t border-slate-100 bg-slate-50/50">
                    Hiển thị 500/{detailRows.length.toLocaleString()} kết quả — File tải về vẫn bao gồm toàn bộ kết quả sau lọc
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
