'use client';

import React, { useMemo, useState } from 'react';
import Dashboard from '@/components/report/Dashboard';
import DauDashboard from '@/components/dau/DauDashboard';
import type { Employee } from '@/types';
import type { ReportData, StaffData } from '@/lib/gtalkDataUtils';

type MainSection = 'report' | 'dau';
type SubTab = 'dashboard' | 'detail';

type SharedStaffData = StaffData & Partial<Employee>;

interface MainDashboardProps {
  reportData: ReportData;
}

function getInitialView(): { section: MainSection; tab: SubTab; dauAccessed: boolean } {
  if (typeof window === 'undefined') return { section: 'report', tab: 'dashboard', dauAccessed: false };

  const tabParam = new URLSearchParams(window.location.search).get('tab');
  if (tabParam === 'dau') return { section: 'dau', tab: 'dashboard', dauAccessed: true };
  if (tabParam === 'dau_list') return { section: 'dau', tab: 'detail', dauAccessed: true };
  if (tabParam === 'report_list') return { section: 'report', tab: 'detail', dauAccessed: false };
  return { section: 'report', tab: 'dashboard', dauAccessed: false };
}

function toSharedEmployees(staffList: SharedStaffData[] = []): Employee[] {
  return staffList
    .map((staff) => ({
      employee_id: Number(staff.employee_id),
      employee_name: staff.employee_name || '',
      status: Number(staff.status || 0),
      jobtitle_name: staff.jobtitle_name_vn || staff.jobtitle_name || '',
      jobtitle_name_vn: staff.jobtitle_name_vn || '',
      team_name: staff.team_name || staff.team_name_vn || '',
      section_name: staff.section_name || staff.section_name_vn || '',
      department_name: staff.department_name || staff.department_name_vn || '',
      division_name: staff.division_name || staff.division_name_vn || '',
      bu_name: staff.bu_name || '',
    }))
    .filter((employee) => Number.isFinite(employee.employee_id) && employee.employee_id > 0);
}

export default function MainDashboard({ reportData }: MainDashboardProps) {
  const initialView = useMemo(() => getInitialView(), []);
  const [activeSection, setActiveSection] = useState<MainSection>(initialView.section);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>(initialView.tab);
  const sharedEmployees = useMemo(() => toSharedEmployees(reportData.staffList as SharedStaffData[]), [reportData.staffList]);
  
  // Track if DAU has been accessed to avoid running its data fetch hook before needed
  const [dauAccessed, setDauAccessed] = useState(initialView.dauAccessed);

  // When switching to DAU tab, mark as accessed
  const handleSectionChange = (section: MainSection) => {
    setActiveSection(section);
    setActiveSubTab('dashboard');
    if (section === 'dau' && !dauAccessed) {
      setDauAccessed(true);
    }
  };

  const handleSubTabChange = (tab: SubTab) => {
    setActiveSubTab(tab);
  };

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <header className="app-header">
        <div className="app-header-inner">
          {/* Logo / App Title */}
          <div className="app-brand">
            <div className="app-brand-mark" aria-hidden="true">
              G
            </div>
            <div className="app-brand-copy">
              <span className="app-brand-title">GTalk Dashboard</span>
              <span className="app-brand-subtitle">Workforce Adoption</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="app-tab-stack">
            <nav className="main-tabs app-navigation app-navigation-primary" aria-label="Nhóm báo cáo">
              {[
                { id: 'report', label: 'Gtalk Download' },
                { id: 'dau', label: 'DAU' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSectionChange(tab.id as MainSection)}
                  className={`main-tab ${activeSection === tab.id ? 'active' : ''}`}
                  aria-current={activeSection === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <nav className="main-tabs app-navigation app-navigation-secondary" aria-label={`Tab con của ${activeSection === 'report' ? 'Gtalk Download' : 'DAU'}`}>
              {[
                { id: 'dashboard', label: 'Overview' },
                { id: 'detail', label: 'List user' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleSubTabChange(tab.id as SubTab)}
                  className={`main-tab ${activeSubTab === tab.id ? 'active' : ''}`}
                  aria-current={activeSubTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area - each dashboard fills the remaining space and scrolls */}
      <div className="app-workspace">
        <div className={`app-view-panel ${activeSection === 'report' ? 'active' : ''}`}>
          <Dashboard data={reportData} externalTab={activeSection === 'report' ? activeSubTab : 'dashboard'} />
        </div>

        {dauAccessed && (
          <div className={`app-view-panel ${activeSection === 'dau' ? 'active' : ''}`}>
            <DauDashboard externalTab={activeSection === 'dau' ? activeSubTab : 'dashboard'} sharedEmployees={sharedEmployees} />
          </div>
        )}
      </div>
    </div>
  );
}
