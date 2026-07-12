import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Fleet from './components/Fleet';
import Drivers from './components/Drivers';
import Trips from './components/Trips';
import Maintenance from './components/Maintenance';
import Expenses from './components/Expenses';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

const RBAC_MATRIX = {
  'Fleet Manager': {
    'dashboard-sec': 'check',
    'vehicles-sec': 'check',
    'drivers-sec': 'check',
    'trips-sec': 'hide',
    'maintenance-sec': 'check',
    'expenses-sec': 'hide',
    'reports-sec': 'check',
    'settings-sec': 'check'
  },
  'Dispatcher': {
    'dashboard-sec': 'check',
    'vehicles-sec': 'View',
    'drivers-sec': 'hide',
    'trips-sec': 'check',
    'maintenance-sec': 'hide',
    'expenses-sec': 'hide',
    'reports-sec': 'hide',
    'settings-sec': 'View'
  },
  'Safety Officer': {
    'dashboard-sec': 'hide',
    'vehicles-sec': 'hide',
    'drivers-sec': 'check',
    'trips-sec': 'View',
    'maintenance-sec': 'hide',
    'expenses-sec': 'hide',
    'reports-sec': 'hide',
    'settings-sec': 'View'
  },
  'Financial Analyst': {
    'dashboard-sec': 'hide',
    'vehicles-sec': 'View',
    'drivers-sec': 'hide',
    'trips-sec': 'hide',
    'maintenance-sec': 'hide',
    'expenses-sec': 'check',
    'reports-sec': 'check',
    'settings-sec': 'View'
  }
};

const DEFAULT_SETTINGS = {
  depotName: 'Gandhinagar Depot GJ14',
  currency: 'INR (Rs)',
  distanceUnit: 'Kilometers'
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard-sec');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  
  // KPI state
  const [kpiActiveVehicles, setKpiActiveVehicles] = useState(0);
  const [kpiAvailVehicles, setKpiAvailVehicles] = useState(0);
  const [kpiMaintVehicles, setKpiMaintVehicles] = useState(0);
  const [kpiActiveTrips, setKpiActiveTrips] = useState(0);
  const [kpiPendingTrips, setKpiPendingTrips] = useState(0);
  const [kpiDriversOnDuty, setKpiDriversOnDuty] = useState(0);
  const [kpiUtilization, setKpiUtilization] = useState('0%');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: '11:15', message: 'TransitOps React client running successfully.' }
  ]);

  // Load initial settings and session
  useEffect(() => {
    const savedSettings = localStorage.getItem('transitops_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {}
    }

    const savedSession = localStorage.getItem('transitops_session');
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        setCurrentUser(user);
        autoNavigate(user.role);
      } catch (e) {}
    }
  }, []);

  // Recalculate KPIs when active tab or user changes
  useEffect(() => {
    if (currentUser) {
      calculateKPIs();
    }
  }, [activeTab, currentUser]);

  const calculateKPIs = async () => {
    try {
      const vRes = await fetch('/api/vehicles');
      const dRes = await fetch('/api/drivers');
      const tRes = await fetch('/api/trips');

      if (vRes.ok && dRes.ok && tRes.ok) {
        const vehicles = await vRes.json();
        const drivers = await dRes.json();
        const trips = await tRes.json();

        const total = vehicles.filter(v => v.status !== 'Retired').length;
        const activeV = vehicles.filter(v => v.status === 'On Trip').length;
        const availV = vehicles.filter(v => v.status === 'Available').length;
        const inShopV = vehicles.filter(v => v.status === 'In Shop').length;

        const activeT = trips.filter(t => t.status === 'Dispatched').length;
        const pendingT = trips.filter(t => t.status === 'Draft').length;

        const onDutyD = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
        const utilPercent = total > 0 ? Math.round((activeV / total) * 100) : 0;

        setKpiActiveVehicles(activeV);
        setKpiAvailVehicles(availV);
        setKpiMaintVehicles(inShopV);
        setKpiActiveTrips(activeT);
        setKpiPendingTrips(pendingT);
        setKpiDriversOnDuty(onDutyD);
        setKpiUtilization(`${utilPercent}%`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const autoNavigate = (role) => {
    const matrix = RBAC_MATRIX[role] || {};
    let target = 'dashboard-sec';
    for (const tab in matrix) {
      if (matrix[tab] !== 'hide') {
        target = tab;
        break;
      }
    }
    setActiveTab(target);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('transitops_session', JSON.stringify(user));
    autoNavigate(user.role);
    showToast(`Welcome back, ${user.name}!`, 'success');
    logAudit(`User ${user.name} logged in successfully as ${user.role}.`);
  };

  const handleSignOut = () => {
    logAudit(`User ${currentUser ? currentUser.name : 'Unknown'} signed out.`);
    localStorage.removeItem('transitops_session');
    setCurrentUser(null);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('transitops_settings', JSON.stringify(newSettings));
    showToast('Preferences updated.', 'success');
    logAudit(`System configurations updated: currency: ${newSettings.currency}.`);
  };

  const handleResetDatabase = async () => {
    if (confirm('Are you sure you want to reset the database?')) {
      try {
        const res = await fetch('/api/auth/reset', { method: 'POST' });
        if (res.ok) {
          setFailedAttempts(0);
          showToast('Database reset successfully!', 'success');
          logAudit('Database seed tables reinitialized.');
          calculateKPIs();
          // force refresh of active tab content
          const prev = activeTab;
          setActiveTab('');
          setTimeout(() => setActiveTab(prev), 10);
        }
      } catch (e) {
        showToast('Connection error.', 'error');
      }
    }
  };

  const logAudit = (message) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = auditLogs.length + 1;
    setAuditLogs(prev => [{ id, time, message }, ...prev].slice(0, 25));
  };

  // Toast Notification handler
  const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'warning') iconClass = 'fa-exclamation-circle';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('transitops_theme', next);
  };

  const getCurrencySymbol = () => {
    if (settings.currency === 'INR (Rs)') return 'Rs ';
    if (settings.currency === 'USD ($)') return '$';
    if (settings.currency === 'EUR (&euro;)' || settings.currency.includes('EUR')) return '€';
    return '$';
  };

  const getDistanceUnitSymbol = () => {
    return settings.distanceUnit === 'Kilometers' ? 'km' : 'mi';
  };

  if (!currentUser) {
    return (
      <>
        <Login
          onLoginSuccess={handleLoginSuccess}
          failedAttempts={failedAttempts}
          setFailedAttempts={setFailedAttempts}
        />
        <div id="toast-container" className="toast-container"></div>
      </>
    );
  }

  const role = currentUser.role;
  const currencySymbol = getCurrencySymbol();
  const distanceUnit = getDistanceUnitSymbol();

  // Hide KPI ribbon on settings and drivers tab, matching wireframes
  const isKpiRibbonVisible = activeTab !== 'settings-sec' && activeTab !== 'drivers-sec';

  return (
    <div id="app-container" className="app-container" style={{ display: 'flex' }}>
      {/* SIDEBAR NAVIGATION */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        onResetDatabase={handleResetDatabase}
      />

      {/* CONTENT PANEL */}
      <div className="content-wrapper">
        {/* Top Bar */}
        <div className="top-bar">
          <div className="search-bar-wrapper">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              id="global-search"
              className="search-bar-input"
              placeholder="Search operations, assets..."
              onChange={(e) => {
                // Pass global search event to active panels
                const el = document.getElementById('vehicle-search') || document.getElementById('driver-search');
                if (el) {
                  el.value = e.target.value;
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
            />
          </div>

          <div className="user-profile-widget">
            <button onClick={toggleTheme} className="theme-toggle" title="Toggle Light/Dark Theme" style={{ border: 'none', background: 'transparent' }}>
              <i className="fa-solid fa-sun"></i>
            </button>

            <span style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></span>

            <div className="user-avatar" id="profile-initials">
              {currentUser.name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2)}
            </div>
            <div className="user-details">
              <span className="user-name" id="profile-name">{currentUser.name}</span>
              <span className="user-role-badge" id="profile-role">{currentUser.role}</span>
            </div>

            <span style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></span>

            <button onClick={handleSignOut} id="logout-btn" className="sign-out-btn" title="Sign out of application">
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>

        {/* Page body */}
        <div className="page-container">
          {/* KPI METRICS RIBBON */}
          {isKpiRibbonVisible && (
            <section className="kpi-container" id="global-kpi-ribbon" style={{ display: 'grid' }}>
              <div className="kpi-card" id="kpi-active-v">
                <div className="kpi-header">
                  <span className="kpi-title">Active Vehicles</span>
                  <i className="fa-solid fa-truck kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-active-vehicles">{kpiActiveVehicles}</div>
              </div>
              <div className="kpi-card kpi-available" id="kpi-avail-v">
                <div className="kpi-header">
                  <span className="kpi-title">Available Vehicles</span>
                  <i className="fa-solid fa-circle-check kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-avail-vehicles">{kpiAvailVehicles}</div>
              </div>
              <div className="kpi-card kpi-maintenance" id="kpi-shop-v">
                <div className="kpi-header">
                  <span className="kpi-title">Vehicles In Maintenance</span>
                  <i className="fa-solid fa-wrench kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-maint-vehicles">{kpiMaintVehicles}</div>
              </div>
              <div className="kpi-card kpi-trips" id="kpi-active-t">
                <div className="kpi-header">
                  <span className="kpi-title">Active Trips</span>
                  <i className="fa-solid fa-route kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-active-trips">{kpiActiveTrips}</div>
              </div>
              <div className="kpi-card" id="kpi-pend-t">
                <div className="kpi-header">
                  <span className="kpi-title">Pending Trips</span>
                  <i className="fa-solid fa-clock kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-pending-trips">{kpiPendingTrips}</div>
              </div>
              <div className="kpi-card kpi-available" id="kpi-duty-d">
                <div className="kpi-header">
                  <span className="kpi-title">Drivers On Duty</span>
                  <i className="fa-solid fa-user-check kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-drivers-onduty">{kpiDriversOnDuty}</div>
              </div>
              <div className="kpi-card kpi-utilization" id="kpi-util">
                <div className="kpi-header">
                  <span className="kpi-title">Fleet Utilization</span>
                  <i className="fa-solid fa-percent kpi-icon"></i>
                </div>
                <div className="kpi-value" id="val-utilization">{kpiUtilization}</div>
              </div>
            </section>
          )}

          {/* ACTIVE TAB DISPATCH */}
          {activeTab === 'dashboard-sec' && <Dashboard />}
          
          {activeTab === 'vehicles-sec' && (
            <Fleet
              role={role}
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'drivers-sec' && (
            <Drivers
              role={role}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'trips-sec' && (
            <Trips
              role={role}
              currencySymbol={currencySymbol}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'maintenance-sec' && (
            <Maintenance
              role={role}
              currencySymbol={currencySymbol}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'expenses-sec' && (
            <Expenses
              role={role}
              currencySymbol={currencySymbol}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'reports-sec' && (
            <Analytics
              currencySymbol={currencySymbol}
              distanceUnit={distanceUnit}
              logAudit={logAudit}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings-sec' && (
            <Settings
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDatabase={handleResetDatabase}
            />
          )}

          {/* AUDIT LOG FEED (Always visible at bottom of active page) */}
          <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <div className="panel-title" style={{ fontSize: '0.9rem', marginBottom: '0.75rem' }}>Audit Feed (System logs)</div>
            <ul className="audit-feed" id="audit-feed" style={{ maxHeight: '150px', overflowY: 'auto' }}>
              {auditLogs.map(log => (
                <li key={log.id} className="audit-item">
                  <span className="audit-time">{log.time}</span>
                  <span>{log.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div id="toast-container" className="toast-container"></div>
    </div>
  );
}
