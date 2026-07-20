import React, { useMemo, useState, useEffect } from "react";
import { Employee } from "@/types";
import { fmtNumber } from "@/lib/dauDataUtils";

interface UserDetailTableProps {
  employees: Employee[];
  activeSet: Set<number>;
  date: string;
}

export default function UserDetailTable({ employees, activeSet, date }: UserDetailTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredUsers = useMemo(() => {
    // 1. Lọc theo trạng thái active/inactive
    let filtered = employees;
    if (statusFilter === "active") {
      filtered = employees.filter((e) => activeSet.has(e.employee_id));
    } else if (statusFilter === "inactive") {
      filtered = employees.filter((e) => !activeSet.has(e.employee_id));
    }

    // 2. Lọc theo search term
    if (!searchTerm) return filtered;
    
    const lowerSearch = searchTerm.toLowerCase();
    return filtered.filter((e) => 
      e.employee_name.toLowerCase().includes(lowerSearch) ||
      e.employee_id.toString().includes(lowerSearch) ||
      e.department_name.toLowerCase().includes(lowerSearch) ||
      e.section_name.toLowerCase().includes(lowerSearch)
    );
  }, [employees, activeSet, searchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleExport = () => {
    if (filteredUsers.length === 0) return;

    let csvContent = "ID Nhan vien,Ho va Ten,Job Title,Section,Department,Trang thai\n";

    filteredUsers.forEach(e => {
      const name = `"${e.employee_name.replace(/"/g, '""')}"`;
      const title = `"${(e.jobtitle_name_vn || e.jobtitle_name || "-").replace(/"/g, '""')}"`;
      const section = `"${e.section_name.replace(/"/g, '""')}"`;
      const dept = `"${e.department_name.replace(/"/g, '""')}"`;
      const status = activeSet.has(e.employee_id) ? "Active" : "Chua Active";
      
      csvContent += `${e.employee_id},${name},${title},${section},${dept},${status}\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `DAU_ListUser_${date.replace(/\//g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="chart-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 0 }}>
          Danh sách chi tiết User (Ngày {date})
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            className="modern-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              outline: "none",
              fontSize: "0.85rem",
              fontFamily: "'Inter', sans-serif",
              backgroundColor: "white",
              color: "#334155"
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đã nhắn tin (Active)</option>
            <option value="inactive">Chưa nhắn tin</option>
          </select>

          <input
            type="text"
            className="modern-search-input"
            placeholder="Tìm theo ID, Tên, Phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleExport}
            disabled={filteredUsers.length === 0}
            style={{
              padding: "11px 18px",
              background: filteredUsers.length === 0 ? "#cbd5e1" : "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: filteredUsers.length === 0 ? "not-allowed" : "pointer",
              boxShadow: filteredUsers.length === 0 ? "none" : "0 4px 12px rgba(99, 102, 241, 0.25)",
              transition: "all 0.2s ease",
              whiteSpace: "nowrap"
            }}
          >
            Tải file CSV
          </button>
        </div>
      </div>
      
      <div className="section-msg">
        Tổng số: <strong>{fmtNumber(filteredUsers.length)}</strong> user
        {searchTerm && " (trong kết quả tìm kiếm)"}
      </div>

      <div className="modern-table-wrap">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Trạng thái</th>
              <th>Job Title</th>
              <th>Section</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  Không tìm thấy user nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((e) => {
                // Get initials for avatar (e.g. "Nguyen Van A" -> "A")
                const parts = e.employee_name.trim().split(" ");
                const initial = parts.length > 0 ? parts[parts.length - 1][0].toUpperCase() : "U";
                const isActive = activeSet.has(e.employee_id);

                return (
                  <tr key={e.employee_id}>
                    <td>
                      <div className="user-profile-cell">
                        <div className="user-avatar">{initial}</div>
                        <div className="user-info">
                          <span className="user-name">{e.employee_name}</span>
                          <span className="user-id">#{e.employee_id}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        display: "inline-block", padding: "4px 10px", borderRadius: "20px", 
                        fontSize: "0.72rem", fontWeight: 700,
                        background: isActive ? "#dcfce7" : "#fee2e2",
                        color: isActive ? "#15803d" : "#b91c1c" 
                      }}>
                        {isActive ? "Active" : "Chưa Active"}
                      </span>
                    </td>
                    <td>{e.jobtitle_name_vn || e.jobtitle_name || "-"}</td>
                    <td>{e.section_name}</td>
                    <td>{e.department_name}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, gap: 12 }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Trang {currentPage} / {Math.ceil(filteredUsers.length / itemsPerPage)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ 
                padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                background: currentPage === 1 ? '#f8fafc' : 'white', 
                color: currentPage === 1 ? '#94a3b8' : '#334155',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 500
              }}
            >
              Trước
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage)}
              style={{ 
                padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                background: currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? '#f8fafc' : 'white', 
                color: currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? '#94a3b8' : '#334155',
                cursor: currentPage === Math.ceil(filteredUsers.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', fontWeight: 500
              }}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

