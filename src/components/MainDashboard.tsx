'use client';

import React, { useState } from 'react';
import Dashboard from '@/components/report/Dashboard';
import DauDashboard from '@/components/dau/DauDashboard';

type MainSection = 'report' | 'dau';
type SubTab = 'dashboard' | 'detail';

interface MainDashboardProps {
  reportData: any;
}

export default function MainDashboard({ reportData }: MainDashboardProps) {
  const [activeSection, setActiveSection] = useState<MainSection>('report');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('dashboard');
  
  // Track if DAU has been accessed to avoid running its data fetch hook before needed
  const [dauAccessed, setDauAccessed] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'dau') {
        setActiveSection('dau');
        setActiveSubTab('dashboard');
        setDauAccessed(true);
      } else if (tabParam === 'dau_list') {
        setActiveSection('dau');
        setActiveSubTab('detail');
        setDauAccessed(true);
      } else if (tabParam === 'report_list') {
        setActiveSection('report');
        setActiveSubTab('detail');
      }
    }
  }, []);

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
          <Dashboard data={reportData} externalTab={activeSubTab} />
        </div>

        {dauAccessed && (
          <div className={`app-view-panel ${activeSection === 'dau' ? 'active' : ''}`}>
            <DauDashboard externalTab={activeSubTab} />
          </div>
        )}
      </div>
    </div>
  );
}


