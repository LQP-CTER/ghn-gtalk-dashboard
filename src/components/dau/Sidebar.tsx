"use client";
import { useState } from "react";
import { Employee } from "@/types";
import { getUniqueValues } from "@/lib/dauDataUtils";

interface SidebarProps {
  allDates: string[];
  employees: Employee[];
  selectedDate: string;
  selectedDivisions: string[];
  selectedDepartments: string[];
  selectedSections: string[];
  selectedTeams: string[];
  onDateChange: (d: string) => void;
  onDivisionsChange: (v: string[]) => void;
  onDepartmentsChange: (v: string[]) => void;
  onSectionsChange: (v: string[]) => void;
  onTeamsChange: (v: string[]) => void;
  onReload: () => void;
  loading: boolean;
}

function MultiSelect({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const count = selected.length;

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (options.length === 0) return (
    <div style={{ padding: "10px 12px", fontSize: "0.8rem", color: "#94a3b8", border: "1px solid rgba(15,23,42,0.07)", borderRadius: 8 }}>
      {title}: Không có dữ liệu
    </div>
  );

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((x) => x !== val) : [...selected, val]);
  };

  return (
    <div className="filter-group">
      <button
        className="filter-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={count > 0 ? { color: "#6366f1", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.04)" } : {}}
      >
        <span>{title}{count > 0 && <span style={{ marginLeft: 6, background: "#6366f1", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{count}</span>}</span>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", transform: isOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
      </button>

      {isOpen && (
        <div className="sidebar-multiselect">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ maxHeight: "192px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {filteredOptions.length === 0 ? (
              <div style={{ fontSize: "0.78rem", color: "#94a3b8", padding: "4px 8px" }}>Không tìm thấy</div>
            ) : (
              filteredOptions.map((opt) => (
                <label key={opt}>
                  <input
                    type="checkbox"
                    checked={selected.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={opt}>
                    {opt}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DateSelect({
  label, options, value, onChange
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="filter-group mb-4">
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

export default function Sidebar({
  allDates, employees,
  selectedDate, selectedDivisions, selectedDepartments, selectedSections, selectedTeams,
  onDateChange, onDivisionsChange, onDepartmentsChange, onSectionsChange, onTeamsChange,
  onReload, loading,
}: SidebarProps) {

  const filteredByDiv = selectedDivisions.length
    ? employees.filter((e) => selectedDivisions.includes(e.division_name))
    : employees;
  const filteredByDept = selectedDepartments.length
    ? filteredByDiv.filter((e) => selectedDepartments.includes(e.department_name))
    : filteredByDiv;

  const divisionOptions = getUniqueValues(employees, "division_name");
  const departmentOptions = getUniqueValues(filteredByDiv, "department_name");
  const sectionOptions = getUniqueValues(filteredByDept, "section_name");
  const teamOptions = getUniqueValues(
    selectedSections.length ? filteredByDept.filter((e) => selectedSections.includes(e.section_name)) : filteredByDept,
    "team_name"
  );

  const hasFilters = selectedDivisions.length + selectedDepartments.length + selectedSections.length + selectedTeams.length > 0;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="app-title">DAU Tracking</div>
        <div className="app-sub">DAU User Tracking Sheet</div>
      </div>

      <div className="sidebar-body">
        {/* Reload */}
        <button className="sidebar-reload-btn" onClick={onReload} disabled={loading}>
          {loading ? "Đang tải..." : "Tải lại dữ liệu"}
        </button>

        {/* Date */}
        <DateSelect
          label="Ngày Báo Cáo"
          options={allDates}
          value={selectedDate}
          onChange={onDateChange}
        />

        {/* Filters header */}
        <div className="sidebar-label" style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Bộ Lọc</span>
          {hasFilters && (
            <button
              onClick={() => { onDivisionsChange([]); onDepartmentsChange([]); onSectionsChange([]); onTeamsChange([]); }}
              style={{ fontSize: "0.68rem", color: "#f43f5e", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}
            >
              Xoá tất cả
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <MultiSelect title="Khối" options={divisionOptions} selected={selectedDivisions} onChange={onDivisionsChange} />
          <MultiSelect title="Phòng Ban" options={departmentOptions} selected={selectedDepartments} onChange={onDepartmentsChange} />
          <MultiSelect title="Bộ Phận" options={sectionOptions} selected={selectedSections} onChange={onSectionsChange} />
          <MultiSelect title="Team" options={teamOptions} selected={selectedTeams} onChange={onTeamsChange} />
        </div>
      </div>
    </aside>
  );
}


