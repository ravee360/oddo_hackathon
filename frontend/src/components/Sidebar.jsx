import React from 'react';

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

export default function Sidebar({ activeTab, onTabChange, role, onResetDatabase, isOpen, onClose }) {
  const permissions = RBAC_MATRIX[role] || {};

  const menuItems = [
    { id: 'dashboard-sec', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'vehicles-sec', label: 'Fleet', icon: 'fa-bus' },
    { id: 'drivers-sec', label: 'Drivers', icon: 'fa-id-card' },
    { id: 'trips-sec', label: 'Trips', icon: 'fa-route' },
    { id: 'maintenance-sec', label: 'Maintenance', icon: 'fa-screwdriver-wrench' },
    { id: 'expenses-sec', label: 'Fuel & Expenses', icon: 'fa-file-invoice-dollar' },
    { id: 'reports-sec', label: 'Analytics', icon: 'fa-chart-pie' },
    { id: 'settings-sec', label: 'Settings', icon: 'fa-sliders' }
  ];

  return (
    <aside className={isOpen ? 'open' : ''}>
      <div>
        <div className="aside-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <i className="fa-solid fa-truck-fast"></i>
            <h2>TransitOps</h2>
          </div>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{ display: 'none', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
            title="Close Menu"
          >
            &times;
          </button>
        </div>
        <nav>
          <ul>
            {menuItems.map(item => {
              const access = permissions[item.id];
              if (access === 'hide') return null;

              return (
                <li key={item.id} id={`menu-${item.id}`}>
                  <a
                    href="#"
                    className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onTabChange(item.id);
                      if (onClose) onClose();
                    }}
                  >
                    <i className={`fa-solid ${item.icon}`}></i> {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="aside-footer">
        <span>TransitOps &copy; 2026</span>
        <button
          onClick={onResetDatabase}
          className="btn btn-secondary btn-icon-only"
          style={{ border: 'none', background: 'transparent' }}
          title="Reset Database"
        >
          <i className="fa-solid fa-rotate-left"></i>
        </button>
      </div>
    </aside>
  );
}
