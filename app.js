// TransitOps - Application Controller

// Constant Anchor Date for Hackathon Context
const CURRENT_DATE = '2026-07-12';

// State variables
let activeTab = 'dashboard-sec';
let currentRole = 'Fleet Manager';
let roiChart = null;
let statusChart = null;
let auditLogs = [
  { id: 1, time: '10:15', message: 'Vehicle BOX-04 was sent to maintenance shop.' },
  { id: 2, time: '09:30', message: 'Trip t2 completed by Driver Alex Rivera.' },
  { id: 3, time: '08:00', message: 'Driver Michael Chen marked Available.' }
];

// Document attachments simulation store
let vehicleDocs = {
  v1: [
    { id: 'doc1', name: 'Compliance Certificate 2026', type: 'Safety' },
    { id: 'doc2', name: 'Comprehensive Insurance Policy', type: 'Insurance' }
  ],
  v2: [
    { id: 'doc3', name: 'Heavy Vehicle Permit', type: 'Registration' }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupTabRouting();
  setupEventListeners();
  applyRolePermissions();
  refreshUI();
});

// Theme Setup
function initTheme() {
  const savedTheme = localStorage.getItem('transitops_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('transitops_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// Tab Switching Routing
function setupTabRouting() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  
  // Update nav links active state
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Toggle pages
  document.querySelectorAll('.page-section').forEach(sec => {
    if (sec.id === tabId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // Re-render target sections specifically if needed
  refreshTabContent(tabId);
}

function refreshTabContent(tabId) {
  switch (tabId) {
    case 'dashboard-sec':
      renderDashboard();
      break;
    case 'vehicles-sec':
      renderVehicles();
      break;
    case 'drivers-sec':
      renderDrivers();
      break;
    case 'trips-sec':
      renderTrips();
      break;
    case 'maintenance-sec':
      renderMaintenance();
      break;
    case 'expenses-sec':
      renderExpenses();
      break;
    case 'reports-sec':
      renderReports();
      break;
  }
}

// Global Event listeners Setup
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Database Reset
  document.getElementById('reset-db').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the database to default seed data? All custom entries will be lost.')) {
      db.reset();
      showToast('Database reset successfully!', 'success');
      refreshUI();
    }
  });

  // Role Switcher Selector
  document.getElementById('role-selector').addEventListener('change', (e) => {
    currentRole = e.target.value;
    applyRolePermissions();
    showToast(`Role switched to: ${currentRole}`, 'info');
    refreshUI();
  });

  // Search & Filters inputs
  document.getElementById('vehicle-search').addEventListener('input', renderVehicles);
  document.getElementById('vehicle-filter-type').addEventListener('change', renderVehicles);
  document.getElementById('vehicle-filter-status').addEventListener('change', renderVehicles);

  document.getElementById('driver-search').addEventListener('input', renderDrivers);
  document.getElementById('driver-filter-status').addEventListener('change', renderDrivers);

  document.getElementById('trip-filter-status').addEventListener('change', renderTrips);

  // Modal Open Handlers
  document.getElementById('add-vehicle-btn').addEventListener('click', () => openVehicleModal());
  document.getElementById('add-driver-btn').addEventListener('click', () => openDriverModal());
  document.getElementById('create-trip-btn').addEventListener('click', () => openTripModal());

  // Modal Close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Forms Submissions Handlers
  document.getElementById('vehicle-form').addEventListener('submit', handleVehicleSubmit);
  document.getElementById('driver-form').addEventListener('submit', handleDriverSubmit);
  document.getElementById('trip-form').addEventListener('submit', handleTripSubmit);
  document.getElementById('complete-trip-form').addEventListener('submit', handleCompleteTripSubmit);
  document.getElementById('maintenance-form').addEventListener('submit', handleMaintenanceSubmit);
  document.getElementById('fuel-log-form').addEventListener('submit', handleFuelSubmit);
  document.getElementById('expense-log-form').addEventListener('submit', handleExpenseSubmit);
  document.getElementById('document-upload-form').addEventListener('submit', handleDocumentUpload);

  // Reports Exports
  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
  document.getElementById('export-pdf-btn').addEventListener('click', exportPDF);
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
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
}

// Modal open/close controls
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Audit Logs Logger
function logAudit(message) {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const id = auditLogs.length + 1;
  auditLogs.unshift({ id, time, message });
  if (auditLogs.length > 25) auditLogs.pop(); // keep last 25
  renderAuditFeed();
}

function renderAuditFeed() {
  const feed = document.getElementById('audit-feed');
  feed.innerHTML = auditLogs.map(log => `
    <li class="audit-item">
      <span class="audit-time">${log.time}</span>
      <span>${log.message}</span>
    </li>
  `).join('');
}

// Apply role based permissions (RBAC)
function applyRolePermissions() {
  const hintBox = document.getElementById('rbac-hint-box');
  
  // Reset all elements first
  document.getElementById('add-vehicle-btn').style.display = 'inline-flex';
  document.getElementById('add-driver-btn').style.display = 'inline-flex';
  document.getElementById('create-trip-btn').style.display = 'inline-flex';
  document.getElementById('maintenance-form').parentElement.style.display = 'block';
  document.getElementById('fuel-log-form').parentElement.parentElement.style.display = 'flex';

  switch (currentRole) {
    case 'Fleet Manager':
      hintBox.innerHTML = `Current Role: <strong>Fleet Manager</strong>. Full administrative permissions to configure registries, dispatch vehicles, check status, and edit assets.`;
      break;

    case 'Driver':
      hintBox.innerHTML = `Current Role: <strong>Driver / Operator</strong>. You can view trips, log trip completions, and record fuel logs. Adding or deleting vehicles/drivers is disabled.`;
      document.getElementById('add-vehicle-btn').style.display = 'none';
      document.getElementById('add-driver-btn').style.display = 'none';
      document.getElementById('maintenance-form').parentElement.style.display = 'none'; // hide maintenance logging
      break;

    case 'Safety Officer':
      hintBox.innerHTML = `Current Role: <strong>Safety Officer</strong>. Primary permissions focused on driver registry. You can edit safety scores and suspend drivers. Operations and billing details are read-only.`;
      document.getElementById('add-vehicle-btn').style.display = 'none';
      document.getElementById('create-trip-btn').style.display = 'none';
      document.getElementById('maintenance-form').parentElement.style.display = 'none';
      document.getElementById('fuel-log-form').parentElement.parentElement.style.display = 'none';
      break;

    case 'Financial Analyst':
      hintBox.innerHTML = `Current Role: <strong>Financial Analyst</strong>. Primary access to financial reporting, fuel efficiency indexes, and asset ROI comparisons. Asset registry configuration is read-only.`;
      document.getElementById('add-vehicle-btn').style.display = 'none';
      document.getElementById('add-driver-btn').style.display = 'none';
      document.getElementById('create-trip-btn').style.display = 'none';
      document.getElementById('maintenance-form').parentElement.style.display = 'none';
      break;
  }
}

// Re-render complete UI
function refreshUI() {
  calculateKPIs();
  refreshTabContent(activeTab);
  renderAuditFeed();
}

// Calculate and Render KPIs
function calculateKPIs() {
  const vehicles = db.getAll('vehicles');
  const drivers = db.getAll('drivers');
  const trips = db.getAll('trips');

  const total = vehicles.filter(v => v.status !== 'Retired').length;
  const activeV = vehicles.filter(v => v.status === 'On Trip').length;
  const availV = vehicles.filter(v => v.status === 'Available').length;
  const inShopV = vehicles.filter(v => v.status === 'In Shop').length;

  const activeT = trips.filter(t => t.status === 'Dispatched').length;
  const pendingT = trips.filter(t => t.status === 'Draft').length;

  // On duty drivers = Available + On Trip
  const onDutyD = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

  // Fleet Utilization (%) = Active Vehicles / Non-Retired Vehicles
  const utilPercent = total > 0 ? Math.round((activeV / total) * 100) : 0;

  document.getElementById('val-active-vehicles').innerText = activeV;
  document.getElementById('val-avail-vehicles').innerText = availV;
  document.getElementById('val-maint-vehicles').innerText = inShopV;
  document.getElementById('val-active-trips').innerText = activeT;
  document.getElementById('val-pending-trips').innerText = pendingT;
  document.getElementById('val-drivers-onduty').innerText = onDutyD;
  document.getElementById('val-utilization').innerText = `${utilPercent}%`;
}

// ==================== DASHBOARD VIEW ====================
function renderDashboard() {
  const vehicles = db.getAll('vehicles');
  
  // Calculate status counts
  const available = vehicles.filter(v => v.status === 'Available').length;
  const ontrip = vehicles.filter(v => v.status === 'On Trip').length;
  const inshop = vehicles.filter(v => v.status === 'In Shop').length;
  const retired = vehicles.filter(v => v.status === 'Retired').length;

  // Calculate ROIs for Chart
  const roiData = vehicles.map(v => {
    const costData = getVehicleFinances(v.id, v.acquisitionCost);
    return { regNo: v.regNo, roi: costData.roi };
  });

  // Chart 1: Status Distribution Pie Chart
  if (statusChart) statusChart.destroy();
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#f3f4f6' : '#0f172a';

  statusChart = new Chart(document.getElementById('statusChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Available', 'On Trip', 'In Shop', 'Retired'],
      datasets: [{
        data: [available, ontrip, inshop, retired],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#9ca3af'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Outfit', size: 11 } }
        }
      }
    }
  });

  // Chart 2: ROI Bar Chart
  if (roiChart) roiChart.destroy();
  roiChart = new Chart(document.getElementById('roiChart').getContext('2d'), {
    type: 'bar',
    data: {
      labels: roiData.map(d => d.regNo),
      datasets: [{
        label: 'ROI (%)',
        data: roiData.map(d => d.roi),
        backgroundColor: roiData.map(d => d.roi >= 0 ? 'rgba(16, 185, 129, 0.75)' : 'rgba(239, 68, 68, 0.75)'),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: textColor, font: { family: 'Outfit' } } },
        y: { ticks: { color: textColor, font: { family: 'Outfit' } } }
      }
    }
  });
}

// ==================== VEHICLE REGISTRY ====================
function renderVehicles() {
  const tbody = document.getElementById('vehicle-table-body');
  const searchVal = document.getElementById('vehicle-search').value.toLowerCase();
  const filterType = document.getElementById('vehicle-filter-type').value;
  const filterStatus = document.getElementById('vehicle-filter-status').value;

  const vehicles = db.getAll('vehicles');
  
  const filtered = vehicles.filter(v => {
    const matchesSearch = v.regNo.toLowerCase().includes(searchVal) || v.name.toLowerCase().includes(searchVal);
    const matchesType = !filterType || v.type === filterType;
    const matchesStatus = !filterStatus || v.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  tbody.innerHTML = filtered.map(v => {
    const docCount = (vehicleDocs[v.id] || []).length;
    const isDeletable = currentRole === 'Fleet Manager';
    const isEditable = currentRole === 'Fleet Manager';

    return `
      <tr>
        <td style="font-weight: 600;">${v.regNo}</td>
        <td>${v.name}</td>
        <td>${v.type}</td>
        <td>${v.maxCapacity} kg</td>
        <td>${v.odometer.toLocaleString()} km</td>
        <td>$${v.acquisitionCost.toLocaleString()}</td>
        <td><span class="badge badge-${v.status.toLowerCase().replace(' ', '')}">${v.status}</span></td>
        <td>
          <button onclick="openDocsModal('${v.id}')" class="btn btn-secondary btn-icon-only" title="Documents Management">
            <i class="fa-solid fa-folder-open"></i>
          </button>
          <span style="font-size:0.75rem; color:var(--text-secondary); margin-left: 4px;">(${docCount})</span>
        </td>
        <td>
          <button onclick="openVehicleModal('${v.id}')" class="btn btn-secondary btn-icon-only" ${isEditable ? '' : 'disabled'} title="Edit Asset">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deleteVehicle('${v.id}')" class="btn btn-danger btn-icon-only" ${isDeletable ? '' : 'disabled'} title="Delete Asset">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No matching assets found in registry.</td></tr>`;
  }
}

// Vehicle Modal Form Action
function openVehicleModal(id = null) {
  const form = document.getElementById('vehicle-form');
  form.reset();

  if (id) {
    document.getElementById('vehicle-modal-title').innerText = 'Edit Fleet Asset';
    const v = db.getById('vehicles', id);
    document.getElementById('vehicle-id').value = v.id;
    document.getElementById('vehicle-reg').value = v.regNo;
    document.getElementById('vehicle-reg').disabled = true; // regNo is immutable once registered
    document.getElementById('vehicle-name').value = v.name;
    document.getElementById('vehicle-type').value = v.type;
    document.getElementById('vehicle-capacity').value = v.maxCapacity;
    document.getElementById('vehicle-odometer').value = v.odometer;
    document.getElementById('vehicle-cost').value = v.acquisitionCost;
    document.getElementById('vehicle-status').value = v.status;
  } else {
    document.getElementById('vehicle-modal-title').innerText = 'Register New Asset';
    document.getElementById('vehicle-id').value = '';
    document.getElementById('vehicle-reg').disabled = false;
  }
  openModal('vehicle-modal');
}

function handleVehicleSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('vehicle-id').value;
  const regNo = document.getElementById('vehicle-reg').value.toUpperCase().trim();
  
  const record = {
    regNo,
    name: document.getElementById('vehicle-name').value.trim(),
    type: document.getElementById('vehicle-type').value,
    maxCapacity: Number(document.getElementById('vehicle-capacity').value),
    odometer: Number(document.getElementById('vehicle-odometer').value),
    acquisitionCost: Number(document.getElementById('vehicle-cost').value),
    status: document.getElementById('vehicle-status').value
  };

  if (id) {
    // Edit
    db.update('vehicles', id, record);
    logAudit(`Vehicle ${regNo} parameters updated.`);
    showToast('Asset specifications updated successfully.', 'success');
  } else {
    // Add
    if (!db.isRegNoUnique(regNo)) {
      showToast(`Registration Number ${regNo} already exists in registry!`, 'error');
      return;
    }
    db.add('vehicles', record);
    logAudit(`Registered new asset ${regNo} (${record.name}).`);
    showToast('New asset successfully added to registry.', 'success');
  }

  closeModal('vehicle-modal');
  refreshUI();
}

function deleteVehicle(id) {
  const v = db.getById('vehicles', id);
  if (confirm(`Are you sure you want to delete vehicle ${v.regNo}?`)) {
    db.delete('vehicles', id);
    logAudit(`Deleted vehicle asset ${v.regNo}.`);
    showToast(`Asset ${v.regNo} deleted.`, 'warning');
    refreshUI();
  }
}

// ==================== DRIVER MANAGEMENT ====================
function renderDrivers() {
  const tbody = document.getElementById('driver-table-body');
  const alertContainer = document.getElementById('license-expiry-alerts');
  const searchVal = document.getElementById('driver-search').value.toLowerCase();
  const filterStatus = document.getElementById('driver-filter-status').value;

  const drivers = db.getAll('drivers');

  // Handle License Expiry Checks
  const today = new Date(CURRENT_DATE);
  const alertsHtml = [];

  const filtered = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchVal) || d.licenseNo.toLowerCase().includes(searchVal);
    const matchesStatus = !filterStatus || d.status === filterStatus;
    
    // Check expiry
    const expDate = new Date(d.licenseExpiry);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      alertsHtml.push(`
        <div class="warning-banner">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Driver <strong>${d.name}</strong>'s license (${d.licenseNo}) has <strong>Expired</strong> (Expired on ${d.licenseExpiry}). Dispatch is blocked.</span>
        </div>
      `);
    } else if (diffDays <= 30) {
      alertsHtml.push(`
        <div class="warning-banner" style="background-color: var(--warning-bg); border-color: rgba(245, 158, 11, 0.25); color: var(--warning-color);">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Driver <strong>${d.name}</strong>'s license (${d.licenseNo}) will expire soon in <strong>${diffDays} days</strong> (${d.licenseExpiry}).</span>
        </div>
      `);
    }

    return matchesSearch && matchesStatus;
  });

  alertContainer.innerHTML = alertsHtml.join('');

  tbody.innerHTML = filtered.map(d => {
    const expDate = new Date(d.licenseExpiry);
    const isExpired = expDate <= today;
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = diffDays > 0 && diffDays <= 30;

    let licenseClass = '';
    if (isExpired) licenseClass = 'badge-expired';
    else if (isExpiringSoon) licenseClass = 'badge-inshop'; // yellow style

    const isDeletable = currentRole === 'Fleet Manager';
    const isEditable = currentRole === 'Fleet Manager' || currentRole === 'Safety Officer';

    return `
      <tr>
        <td style="font-weight:600;">${d.name}</td>
        <td>${d.licenseNo}</td>
        <td>${d.licenseCategory}</td>
        <td>
          <span class="badge ${licenseClass}">${d.licenseExpiry}</span>
          ${isExpired ? '<span style="font-size:0.7rem; color:var(--danger-color); display:block; font-weight:600;">EXPIRED</span>' : ''}
          ${isExpiringSoon ? `<span style="font-size:0.7rem; color:var(--warning-color); display:block; font-weight:600;">EXPIRING IN ${diffDays}d</span>` : ''}
        </td>
        <td>${d.contact}</td>
        <td style="font-weight:600; color: ${d.safetyScore >= 90 ? 'var(--success-color)' : (d.safetyScore >= 70 ? 'var(--warning-color)' : 'var(--danger-color)')}">${d.safetyScore}/100</td>
        <td><span class="badge badge-${d.status.toLowerCase().replace(' ', '')}">${d.status}</span></td>
        <td>
          <button onclick="openDriverModal('${d.id}')" class="btn btn-secondary btn-icon-only" ${isEditable ? '' : 'disabled'} title="Edit Driver">
            <i class="fa-solid fa-user-gear"></i>
          </button>
          <button onclick="deleteDriver('${d.id}')" class="btn btn-danger btn-icon-only" ${isDeletable ? '' : 'disabled'} title="Delete Profile">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No driver records match filtering guidelines.</td></tr>`;
  }
}

function openDriverModal(id = null) {
  const form = document.getElementById('driver-form');
  form.reset();

  if (id) {
    document.getElementById('driver-modal-title').innerText = 'Modify Driver Profile';
    const d = db.getById('drivers', id);
    document.getElementById('driver-id').value = d.id;
    document.getElementById('driver-name').value = d.name;
    document.getElementById('driver-license').value = d.licenseNo;
    document.getElementById('driver-category').value = d.licenseCategory;
    document.getElementById('driver-expiry').value = d.licenseExpiry;
    document.getElementById('driver-safety').value = d.safetyScore;
    document.getElementById('driver-contact').value = d.contact;
    document.getElementById('driver-status').value = d.status;
  } else {
    document.getElementById('driver-modal-title').innerText = 'Register Driver Card';
    document.getElementById('driver-id').value = '';
  }
  openModal('driver-modal');
}

function handleDriverSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('driver-id').value;
  
  const record = {
    name: document.getElementById('driver-name').value.trim(),
    licenseNo: document.getElementById('driver-license').value.trim(),
    licenseCategory: document.getElementById('driver-category').value.trim(),
    licenseExpiry: document.getElementById('driver-expiry').value,
    safetyScore: Number(document.getElementById('driver-safety').value),
    contact: document.getElementById('driver-contact').value.trim(),
    status: document.getElementById('driver-status').value
  };

  if (id) {
    db.update('drivers', id, record);
    logAudit(`Driver ${record.name}'s profile parameters updated.`);
    showToast('Driver profile updated successfully.', 'success');
  } else {
    db.add('drivers', record);
    logAudit(`Registered driver profile for ${record.name}.`);
    showToast('Driver registered successfully in registry.', 'success');
  }

  closeModal('driver-modal');
  refreshUI();
}

function deleteDriver(id) {
  const d = db.getById('drivers', id);
  if (confirm(`Are you sure you want to delete profile for driver ${d.name}?`)) {
    db.delete('drivers', id);
    logAudit(`Deleted driver profile for ${d.name}.`);
    showToast(`Driver ${d.name} deleted.`, 'warning');
    refreshUI();
  }
}

// ==================== TRIP MANAGEMENT ====================
function renderTrips() {
  const tbody = document.getElementById('trip-table-body');
  const filterStatus = document.getElementById('trip-filter-status').value;

  const trips = db.getAll('trips');
  const vehicles = db.getAll('vehicles');
  const drivers = db.getAll('drivers');

  const filtered = trips.filter(t => !filterStatus || t.status === filterStatus);

  tbody.innerHTML = filtered.map(t => {
    const v = vehicles.find(item => item.id === t.vehicleId) || { regNo: 'Unknown', name: 'N/A' };
    const d = drivers.find(item => item.id === t.driverId) || { name: 'Unknown' };

    let actionButtons = '';
    const isDispatchAllowed = currentRole === 'Fleet Manager' || currentRole === 'Driver';

    if (t.status === 'Draft') {
      actionButtons = `
        <button onclick="dispatchTrip('${t.id}')" class="btn btn-primary btn-sm" ${isDispatchAllowed ? '' : 'disabled'} style="font-size:0.75rem; padding:0.35rem 0.65rem;">
          <i class="fa-solid fa-paper-plane"></i> Dispatch
        </button>
        <button onclick="deleteTrip('${t.id}')" class="btn btn-danger btn-sm" ${isDispatchAllowed ? '' : 'disabled'} style="font-size:0.75rem; padding:0.35rem 0.65rem;">
          <i class="fa-solid fa-trash-can"></i> Delete
        </button>
      `;
    } else if (t.status === 'Dispatched') {
      actionButtons = `
        <button onclick="openCompleteTripModal('${t.id}')" class="btn btn-primary btn-sm" ${isDispatchAllowed ? '' : 'disabled'} style="font-size:0.75rem; padding:0.35rem 0.65rem; background-color: var(--success-color);">
          <i class="fa-solid fa-check-double"></i> Complete
        </button>
        <button onclick="cancelTrip('${t.id}')" class="btn btn-danger btn-sm" ${isDispatchAllowed ? '' : 'disabled'} style="font-size:0.75rem; padding:0.35rem 0.65rem;">
          <i class="fa-solid fa-xmark"></i> Cancel
        </button>
      `;
    }

    return `
      <tr>
        <td style="font-family: monospace; font-weight: 600;">${t.id}</td>
        <td>
          <span style="font-weight: 600; display:block;">${t.source}</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-solid fa-arrow-right"></i> ${t.destination}</span>
        </td>
        <td>
          <span style="font-weight: 600; display:block;">${v.regNo} (${v.name})</span>
          <span style="font-size:0.75rem; color:var(--text-secondary);"><i class="fa-solid fa-user-astronaut"></i> ${d.name}</span>
        </td>
        <td>${t.cargoWeight} kg</td>
        <td>${t.distance} km</td>
        <td>
          ${t.endOdo ? `<span style="font-family: monospace;">${t.startOdo} - ${t.endOdo}</span>` : `<span style="font-family: monospace;">Starts: ${t.startOdo}</span>`}
        </td>
        <td>${t.fuelUsed ? `${t.fuelUsed} L` : '<span style="color:var(--text-muted);">--</span>'}</td>
        <td style="font-weight: 600; color:var(--success-color);">$${t.revenue.toLocaleString()}</td>
        <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 0.35rem; justify-content: center;">
            ${actionButtons || '<span style="color:var(--text-muted); font-size:0.8rem;">Operational Closed</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">No trip dispatch structures logged.</td></tr>`;
  }
}

function openTripModal() {
  const form = document.getElementById('trip-form');
  form.reset();

  const vehicles = db.getAll('vehicles');
  const drivers = db.getAll('drivers');

  // Filter Available Vehicles (must be Available status only)
  const availVehicles = vehicles.filter(v => v.status === 'Available');
  const vehicleSelect = document.getElementById('trip-vehicle-select');
  vehicleSelect.innerHTML = `<option value="">-- Choose Available Asset --</option>` + 
    availVehicles.map(v => `<option value="${v.id}" data-capacity="${v.maxCapacity}">${v.regNo} (${v.name}) [Max: ${v.maxCapacity}kg, Odo: ${v.odometer}km]</option>`).join('');

  // Filter Eligible Drivers (Available, license not expired, not suspended)
  const today = new Date(CURRENT_DATE);
  const eligibleDrivers = drivers.filter(d => {
    const isAvail = d.status === 'Available';
    const isNotSuspended = d.status !== 'Suspended';
    const expDate = new Date(d.licenseExpiry);
    const isNotExpired = expDate > today;
    return isAvail && isNotSuspended && isNotExpired;
  });

  const driverSelect = document.getElementById('trip-driver-select');
  driverSelect.innerHTML = `<option value="">-- Choose Eligible Driver --</option>` +
    eligibleDrivers.map(d => `<option value="${d.id}">${d.name} [Category: ${d.licenseCategory}]</option>`).join('');

  // Real-time capacity validation hints
  vehicleSelect.addEventListener('change', () => {
    const selected = vehicleSelect.options[vehicleSelect.selectedIndex];
    const capacity = selected.getAttribute('data-capacity');
    const hint = document.getElementById('vehicle-load-hint');
    if (capacity) {
      hint.innerHTML = `Selected vehicle max payload limit is <strong>${capacity} kg</strong>.`;
    } else {
      hint.innerText = '';
    }
  });

  openModal('trip-modal');
}

function handleTripSubmit(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('trip-vehicle-select').value;
  const driverId = document.getElementById('trip-driver-select').value;
  const cargoWeight = Number(document.getElementById('trip-cargo').value);
  const distance = Number(document.getElementById('trip-distance').value);
  const revenue = Number(document.getElementById('trip-revenue').value);
  
  if (!vehicleId || !driverId) {
    showToast('Please select both a valid vehicle and a driver.', 'error');
    return;
  }

  const v = db.getById('vehicles', vehicleId);
  const d = db.getById('drivers', driverId);

  // Business Rule: Cargo Weight <= Vehicle Maximum Load
  if (cargoWeight > v.maxCapacity) {
    showToast(`Cargo Weight (${cargoWeight} kg) exceeds vehicle payload limit (${v.maxCapacity} kg)!`, 'error');
    return;
  }

  const record = {
    source: document.getElementById('trip-source').value.trim(),
    destination: document.getElementById('trip-dest').value.trim(),
    vehicleId,
    driverId,
    cargoWeight,
    distance,
    startOdo: v.odometer,
    endOdo: null,
    fuelUsed: null,
    revenue,
    status: 'Draft',
    date: CURRENT_DATE
  };

  db.add('trips', record);
  logAudit(`Created draft trip to ${record.destination}. Ready for dispatch.`);
  showToast('Trip created as Draft.', 'success');
  closeModal('trip-modal');
  refreshUI();
}

// Dispatching Trip Workflow
function dispatchTrip(id) {
  const t = db.getById('trips', id);
  const v = db.getById('vehicles', t.vehicleId);
  const d = db.getById('drivers', t.driverId);

  // Re-validate business conditions
  if (v.status !== 'Available') {
    showToast(`Vehicle ${v.regNo} is currently ${v.status} and cannot be dispatched!`, 'error');
    return;
  }
  
  const today = new Date(CURRENT_DATE);
  const expDate = new Date(d.licenseExpiry);
  if (d.status === 'Suspended' || expDate <= today) {
    showToast(`Driver ${d.name} cannot be dispatched (License Expired or Suspended)!`, 'error');
    return;
  }
  if (d.status === 'On Trip') {
    showToast(`Driver ${d.name} is already assigned on active trip!`, 'error');
    return;
  }

  // Update Trip status
  db.update('trips', id, { status: 'Dispatched' });

  // Mandatory transitions: Change both vehicle and driver status to On Trip
  db.update('vehicles', t.vehicleId, { status: 'On Trip' });
  db.update('drivers', t.driverId, { status: 'On Trip' });

  logAudit(`Dispatched Vehicle ${v.regNo} with Driver ${d.name} to ${t.destination}.`);
  showToast(`Trip ${id} dispatched successfully!`, 'success');
  refreshUI();
}

// Cancel Dispatched Trip
function cancelTrip(id) {
  const t = db.getById('trips', id);

  if (confirm('Are you sure you want to cancel this trip? Both driver and vehicle will be restored to Available.')) {
    // Transition trip status
    db.update('trips', id, { status: 'Cancelled' });

    // Mandatory transitions: Restore both to Available
    db.update('vehicles', t.vehicleId, { status: 'Available' });
    db.update('drivers', t.driverId, { status: 'Available' });

    logAudit(`Cancelled dispatch for trip ${id}. Assets restored to Available.`);
    showToast(`Trip ${id} Cancelled.`, 'warning');
    refreshUI();
  }
}

// Open Completion Trip Modal
function openCompleteTripModal(id) {
  const t = db.getById('trips', id);
  const v = db.getById('vehicles', t.vehicleId);
  
  document.getElementById('complete-trip-id').value = t.id;
  document.getElementById('complete-trip-summary').innerHTML = `
    Finalizing trip <strong>${t.id}</strong> from <strong>${t.source}</strong> to <strong>${t.destination}</strong>.<br>
    Vehicle: <strong>${v.regNo}</strong>. Current Start Odometer: <strong>${t.startOdo} km</strong>. Planned distance: <strong>${t.distance} km</strong>.
  `;
  
  // Suggest final odometer
  const suggestOdo = t.startOdo + t.distance;
  document.getElementById('complete-odo').value = suggestOdo;
  document.getElementById('complete-odo').min = t.startOdo;
  document.getElementById('complete-odo-hint').innerHTML = `Must be equal or greater than start odometer ${t.startOdo} km.`;
  document.getElementById('complete-fuel').value = Math.round(t.distance * 0.25); // estimate 0.25 L per km

  openModal('complete-trip-modal');
}

function handleCompleteTripSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('complete-trip-id').value;
  const endOdo = Number(document.getElementById('complete-odo').value);
  const fuelUsed = Number(document.getElementById('complete-fuel').value);

  const t = db.getById('trips', id);
  
  if (endOdo < t.startOdo) {
    showToast(`Final odometer cannot be less than start odometer (${t.startOdo} km)!`, 'error');
    return;
  }

  // Update Trip
  db.update('trips', id, {
    status: 'Completed',
    endOdo,
    fuelUsed
  });

  // Mandatory transitions: restore vehicle and driver status back to Available
  db.update('vehicles', t.vehicleId, { 
    status: 'Available',
    odometer: endOdo // Update vehicle odometer
  });
  db.update('drivers', t.driverId, { 
    status: 'Available' 
  });

  // Automatically record a fuel log based on the fuel used
  const fuelPricePerLiter = 2.0; // Simulated $2.0 per liter
  const fuelCost = fuelUsed * fuelPricePerLiter;
  
  db.add('fuelLogs', {
    vehicleId: t.vehicleId,
    liters: fuelUsed,
    cost: fuelCost,
    date: CURRENT_DATE
  });

  logAudit(`Completed trip ${id}. Vehicle odometer updated to ${endOdo} km. Recorded fuel log ($${fuelCost}).`);
  showToast(`Trip Completed! Recorded fuel log.`, 'success');
  closeModal('complete-trip-modal');
  refreshUI();
}

function deleteTrip(id) {
  if (confirm('Delete this draft trip record?')) {
    db.delete('trips', id);
    logAudit(`Draft trip ${id} was deleted.`);
    showToast(`Trip ${id} deleted.`, 'warning');
    refreshUI();
  }
}

// ==================== MAINTENANCE WORKFLOW ====================
function renderMaintenance() {
  const tbody = document.getElementById('maintenance-table-body');
  const select = document.getElementById('maint-vehicle-select');
  
  const logs = db.getAll('maintenance');
  const vehicles = db.getAll('vehicles');

  // Populate vehicle selector for maintenance (all non-retired vehicles)
  const eligibleV = vehicles.filter(v => v.status !== 'Retired');
  select.innerHTML = '<option value="">-- Choose Asset --</option>' +
    eligibleV.map(v => `<option value="${v.id}">${v.regNo} (${v.name}) [Status: ${v.status}]</option>`).join('');

  tbody.innerHTML = logs.map(log => {
    const v = vehicles.find(item => item.id === log.vehicleId) || { regNo: 'Unknown' };
    const isActive = log.status === 'Active';
    const isMaintCloseAllowed = currentRole === 'Fleet Manager';

    return `
      <tr>
        <td style="font-weight:600;">${v.regNo}</td>
        <td>${log.description}</td>
        <td>${log.startDate}</td>
        <td>${log.endDate || '<span style="color:var(--text-muted); font-size:0.75rem;">Ongoing</span>'}</td>
        <td style="font-weight:600;">$${log.cost}</td>
        <td><span class="badge badge-${isActive ? 'inshop' : 'available'}">${log.status}</span></td>
        <td>
          ${isActive ? `
            <button onclick="closeMaintenance('${log.id}')" class="btn btn-secondary btn-sm" ${isMaintCloseAllowed ? '' : 'disabled'} style="font-size:0.75rem; padding:0.35rem 0.65rem;">
              <i class="fa-solid fa-lock-open"></i> Complete
            </button>
          ` : '<span style="color:var(--text-muted); font-size:0.8rem;">Archive Log</span>'}
        </td>
      </tr>
    `;
  }).join('');

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No maintenance records found.</td></tr>`;
  }
}

function handleMaintenanceSubmit(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('maint-vehicle-select').value;
  const description = document.getElementById('maint-desc').value.trim();
  const cost = Number(document.getElementById('maint-cost').value);
  const startDate = document.getElementById('maint-date').value;

  if (!vehicleId) {
    showToast('Please select a vehicle.', 'error');
    return;
  }

  // Adding a vehicle to a maintenance log automatically switches status to "In Shop"
  const v = db.getById('vehicles', vehicleId);
  if (v.status === 'On Trip') {
    if (!confirm(`Vehicle ${v.regNo} is currently On Trip. Are you sure you want to redirect it to the shop immediately?`)) {
      return;
    }
  }

  db.add('maintenance', {
    vehicleId,
    description,
    startDate,
    endDate: '',
    cost,
    status: 'Active'
  });

  // Mandatory transition
  db.update('vehicles', vehicleId, { status: 'In Shop' });

  logAudit(`Vehicle ${v.regNo} put In Shop. Triggered maintenance log.`);
  showToast(`Vehicle ${v.regNo} status updated to In Shop.`, 'success');
  document.getElementById('maintenance-form').reset();
  refreshUI();
}

function closeMaintenance(id) {
  const log = db.getById('maintenance', id);
  const v = db.getById('vehicles', log.vehicleId);

  // Closing maintenance restores vehicle to Available (unless retired)
  const nextStatus = v.status === 'Retired' ? 'Retired' : 'Available';
  
  db.update('maintenance', id, {
    status: 'Completed',
    endDate: CURRENT_DATE
  });

  db.update('vehicles', log.vehicleId, { status: nextStatus });

  logAudit(`Maintenance closed for Vehicle ${v.regNo}. Asset restored to Available.`);
  showToast(`Vehicle ${v.regNo} restored to ${nextStatus}.`, 'success');
  refreshUI();
}

// ==================== FUEL & EXPENSES ====================
function renderExpenses() {
  const tbody = document.getElementById('expense-table-body');
  const vFuelSelect = document.getElementById('fuel-vehicle-select');
  const vExpSelect = document.getElementById('expense-vehicle-select');

  const fuelLogs = db.getAll('fuelLogs');
  const expenses = db.getAll('expenses');
  const maintenance = db.getAll('maintenance');
  const vehicles = db.getAll('vehicles');

  // Populate Select fields with vehicles
  const selectOptions = vehicles.map(v => `<option value="${v.id}">${v.regNo} (${v.name})</option>`).join('');
  vFuelSelect.innerHTML = selectOptions;
  vExpSelect.innerHTML = selectOptions;

  // Merge items into a unified list
  const list = [];

  fuelLogs.forEach(f => {
    const v = vehicles.find(item => item.id === f.vehicleId) || { regNo: 'Unknown' };
    list.push({
      regNo: v.regNo,
      date: f.date,
      category: 'Fuel Refill',
      details: `${f.liters} Liters consumed`,
      cost: f.cost
    });
  });

  expenses.forEach(e => {
    const v = vehicles.find(item => item.id === e.vehicleId) || { regNo: 'Unknown' };
    list.push({
      regNo: v.regNo,
      date: e.date,
      category: `Expense (${e.type})`,
      details: `Operational surcharge`,
      cost: e.cost
    });
  });

  maintenance.forEach(m => {
    const v = vehicles.find(item => item.id === m.vehicleId) || { regNo: 'Unknown' };
    list.push({
      regNo: v.regNo,
      date: m.startDate,
      category: 'Maintenance',
      details: m.description,
      cost: m.cost
    });
  });

  // Sort by date descending
  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = list.map(item => `
    <tr>
      <td style="font-weight:600;">${item.regNo}</td>
      <td>${item.date}</td>
      <td><span class="badge badge-${getExpenseCategoryBadgeClass(item.category)}">${item.category}</span></td>
      <td style="max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.details}">${item.details}</td>
      <td style="font-weight:600; color: var(--danger-color);">$${item.cost}</td>
    </tr>
  `).join('');

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No operational expense invoices found.</td></tr>`;
  }
}

function getExpenseCategoryBadgeClass(category) {
  if (category === 'Fuel Refill') return 'ontrip';
  if (category === 'Maintenance') return 'inshop';
  return 'draft';
}

function handleFuelSubmit(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('fuel-vehicle-select').value;
  const liters = Number(document.getElementById('fuel-liters').value);
  const cost = Number(document.getElementById('fuel-cost').value);

  db.add('fuelLogs', {
    vehicleId,
    liters,
    cost,
    date: CURRENT_DATE
  });

  const v = db.getById('vehicles', vehicleId);
  logAudit(`Fuel Refill logged for Vehicle ${v.regNo}: ${liters}L, Cost: $${cost}.`);
  showToast(`Recorded $${cost} fuel log for ${v.regNo}.`, 'success');
  document.getElementById('fuel-log-form').reset();
  refreshUI();
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('expense-vehicle-select').value;
  const type = document.getElementById('expense-type').value;
  const cost = Number(document.getElementById('expense-cost').value);

  db.add('expenses', {
    vehicleId,
    type,
    cost,
    date: CURRENT_DATE
  });

  const v = db.getById('vehicles', vehicleId);
  logAudit(`Log expense (${type}) for Vehicle ${v.regNo}: Cost: $${cost}.`);
  showToast(`Recorded $${cost} expense for ${v.regNo}.`, 'success');
  document.getElementById('expense-log-form').reset();
  refreshUI();
}

// ==================== REPORTS & ANALYTICS ====================
function getVehicleFinances(vehicleId, acquisitionCost) {
  const fuelLogs = db.getAll('fuelLogs').filter(f => f.vehicleId === vehicleId);
  const expenses = db.getAll('expenses').filter(e => e.vehicleId === vehicleId);
  const maintenance = db.getAll('maintenance').filter(m => m.vehicleId === vehicleId);
  const trips = db.getAll('trips').filter(t => t.vehicleId === vehicleId && t.status === 'Completed');

  // Sums
  const distance = trips.reduce((sum, t) => sum + t.distance, 0);
  const fuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const fuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const maintCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const otherCost = expenses.reduce((sum, e) => sum + e.cost, 0);
  const revenue = trips.reduce((sum, t) => sum + t.revenue, 0);

  // Efficiency (Distance / Fuel)
  const efficiency = fuelLiters > 0 ? (distance / fuelLiters).toFixed(2) : '0.00';
  
  // ROI = (Revenue - (Maint + Fuel + Other)) / Acquisition Cost
  const netEarnings = revenue - (maintCost + fuelCost + otherCost);
  const roi = acquisitionCost > 0 ? Math.round((netEarnings / acquisitionCost) * 100) : 0;

  return {
    distance,
    fuelLiters,
    fuelCost,
    maintCost,
    otherCost,
    revenue,
    efficiency,
    roi
  };
}

function renderReports() {
  const tbody = document.getElementById('reports-table-body');
  const vehicles = db.getAll('vehicles');

  tbody.innerHTML = vehicles.map(v => {
    const f = getVehicleFinances(v.id, v.acquisitionCost);

    return `
      <tr>
        <td style="font-weight:600;">${v.regNo}</td>
        <td>${v.type}</td>
        <td>$${v.acquisitionCost.toLocaleString()}</td>
        <td>${f.distance.toLocaleString()} km</td>
        <td>${f.fuelLiters} L</td>
        <td>${f.efficiency} km/L</td>
        <td>$${f.fuelCost.toLocaleString()}</td>
        <td>$${f.maintCost.toLocaleString()}</td>
        <td>$${f.otherCost.toLocaleString()}</td>
        <td style="font-weight:600; color:var(--success-color);">$${f.revenue.toLocaleString()}</td>
        <td style="font-weight: 700; color: ${f.roi >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-size:1rem;">
          ${f.roi}%
        </td>
      </tr>
    `;
  }).join('');
}

// Export to CSV Functionality
function exportCSV() {
  const vehicles = db.getAll('vehicles');
  
  // Header row
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Registration Number,Vehicle Type,Acquisition Cost,Distance Traveled (km),Total Fuel Consumed (L),Fuel Efficiency (km/L),Fuel Cost ($),Maintenance Cost ($),Expenses ($),Revenue ($),ROI (%)\n";

  // Rows
  vehicles.forEach(v => {
    const f = getVehicleFinances(v.id, v.acquisitionCost);
    const row = [
      v.regNo,
      v.type,
      v.acquisitionCost,
      f.distance,
      f.fuelLiters,
      f.efficiency,
      f.fuelCost,
      f.maintCost,
      f.otherCost,
      f.revenue,
      f.roi
    ];
    csvContent += row.join(",") + "\n";
  });

  // Download trigger
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "TransitOps_Fleet_ROI_Report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("CSV file downloaded successfully.", "success");
}

// Mock PDF report generation (triggers print dialog formatted layout)
function exportPDF() {
  window.print();
}

// ==================== DOCUMENT MANAGEMENT SIMULATION ====================
function openDocsModal(vehicleId) {
  document.getElementById('document-vehicle-id').value = vehicleId;
  const v = db.getById('vehicles', vehicleId);
  document.getElementById('document-modal-title').innerText = `Compliance Registry - Vehicle ${v.regNo}`;
  
  renderDocsList(vehicleId);
  openModal('document-modal');
}

function renderDocsList(vehicleId) {
  const container = document.getElementById('document-list-container');
  const docs = vehicleDocs[vehicleId] || [];

  if (docs.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; font-size:0.75rem; color:var(--text-muted); padding:1rem 0;">No document files attached.</div>`;
    return;
  }

  container.innerHTML = docs.map(doc => {
    let iconClass = 'fa-file-shield';
    if (doc.type === 'Insurance') iconClass = 'fa-file-invoice';
    if (doc.type === 'Registration') iconClass = 'fa-id-card-clip';

    return `
      <div class="doc-card">
        <button class="doc-delete" onclick="deleteDocument('${vehicleId}', '${doc.id}')" title="Remove Document">&times;</button>
        <i class="fa-solid ${iconClass}"></i>
        <div class="doc-name" title="${doc.name}">${doc.name}</div>
        <span style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">${doc.type}</span>
      </div>
    `;
  }).join('');
}

function handleDocumentUpload(e) {
  e.preventDefault();
  const vehicleId = document.getElementById('document-vehicle-id').value;
  const name = document.getElementById('doc-name-input').value.trim();
  const type = document.getElementById('doc-type-input').value;

  if (!vehicleDocs[vehicleId]) {
    vehicleDocs[vehicleId] = [];
  }

  const newDoc = {
    id: 'doc_' + Math.random().toString(36).substr(2, 9),
    name,
    type
  };

  vehicleDocs[vehicleId].push(newDoc);
  showToast(`Document uploaded successfully.`, 'success');
  document.getElementById('document-upload-form').reset();
  renderDocsList(vehicleId);
  renderVehicles(); // update counts
}

function deleteDocument(vehicleId, docId) {
  if (confirm('Are you sure you want to delete this document from registry?')) {
    vehicleDocs[vehicleId] = vehicleDocs[vehicleId].filter(doc => doc.id !== docId);
    showToast('Document removed.', 'warning');
    renderDocsList(vehicleId);
    renderVehicles(); // update counts
  }
}
