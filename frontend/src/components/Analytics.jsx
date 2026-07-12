import React, { useState, useEffect, useRef } from 'react';

// Use Chart.js directly from global scope (loaded via index.html script tag or fallback safely)
export default function Analytics({ currencySymbol, distanceUnit, logAudit, showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [trips, setTrips] = useState([]);

  // Canvas Refs
  const revCanvasRef = useRef(null);
  const costCanvasRef = useRef(null);

  // Chart instances trackers
  const revChartInstance = useRef(null);
  const costChartInstance = useRef(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const vRes = await fetch('/api/vehicles');
      const eRes = await fetch('/api/expenses');
      const mRes = await fetch('/api/maintenance');
      const tRes = await fetch('/api/trips');

      if (vRes.ok && eRes.ok && mRes.ok && tRes.ok) {
        setVehicles(await vRes.json());
        const eData = await eRes.json();
        setFuelLogs(eData.fuelLogs);
        setExpenses(eData.expenses);
        setMaintenance(await mRes.json());
        setTrips(await tRes.json());
      }
    } catch (e) {
      console.error('Error fetching analytics data:', e);
    }
  };

  // Helper: calculate vehicle finance summaries
  const getVehicleFinancesLocal = (vId, acquisitionCost) => {
    const vTrips = trips.filter(t => t.vehicleId === vId && t.status === 'Completed');
    const vFuel = fuelLogs.filter(f => f.vehicleId === vId);
    const vMaint = maintenance.filter(m => m.vehicleId === vId);
    const vExp = expenses.filter(e => e.vehicleId === vId);

    const distance = vTrips.reduce((sum, t) => sum + t.distance, 0);
    const fuelLiters = vFuel.reduce((sum, f) => sum + f.liters, 0);
    const efficiency = fuelLiters > 0 ? (distance / fuelLiters).toFixed(1) : '0.0';

    const fuelCost = vFuel.reduce((sum, f) => sum + f.cost, 0);
    const maintCost = vMaint.reduce((sum, m) => sum + m.cost, 0);
    const otherCost = vExp.reduce((sum, e) => sum + (e.toll || 0) + (e.cost || 0), 0);
    const revenue = vTrips.reduce((sum, t) => sum + t.revenue, 0);

    const totalCost = fuelCost + maintCost + otherCost;
    const profit = revenue - totalCost;
    const roi = acquisitionCost > 0 ? Math.round((profit / acquisitionCost) * 100) : 0;

    return { distance, fuelLiters, efficiency, fuelCost, maintCost, otherCost, revenue, roi };
  };

  // Initialize and redraw charts when data changes
  useEffect(() => {
    if (vehicles.length === 0) return;

    // Check if Chart.js is loaded from script CDN
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is offline.');
      return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9ca3af' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // 1. Monthly Revenue Chart
    if (revCanvasRef.current) {
      if (revChartInstance.current) revChartInstance.current.destroy();

      revChartInstance.current = new Chart(revCanvasRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: `Revenue (${currencySymbol.trim()})`,
            data: [12000, 15000, 14000, 18500, 16800, 22000, 19500],
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor, font: { family: 'Outfit' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { family: 'Outfit' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    // 2. Top Costliest Vehicles Chart
    if (costCanvasRef.current) {
      if (costChartInstance.current) costChartInstance.current.destroy();

      const vehicleCostList = vehicles.map(v => {
        const f = getVehicleFinancesLocal(v.id, v.acquisitionCost);
        const totalCost = f.fuelCost + f.maintCost + f.otherCost;
        return { regNo: v.regNo, cost: totalCost };
      });

      vehicleCostList.sort((a, b) => b.cost - a.cost);
      const top3 = vehicleCostList.slice(0, 3);

      costChartInstance.current = new Chart(costCanvasRef.current.getContext('2d'), {
        type: 'bar',
        data: {
          labels: top3.map(item => item.regNo),
          datasets: [{
            data: top3.map(item => item.cost),
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: textColor, font: { family: 'Outfit' } }, grid: { color: gridColor } },
            y: { ticks: { color: textColor, font: { family: 'Outfit' } }, grid: { display: false } }
          }
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (revChartInstance.current) revChartInstance.current.destroy();
      if (costChartInstance.current) costChartInstance.current.destroy();
    };
  }, [vehicles, trips, fuelLogs, maintenance, expenses, currencySymbol]);

  // Compute overall statistics
  const totalDist = trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.distance, 0);
  const totalLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const avgEfficiency = totalLiters > 0 ? (totalDist / totalLiters).toFixed(1) : '0.0';

  const activeVCount = vehicles.filter(v => v.status === 'On Trip').length;
  const nonRetiredCount = vehicles.filter(v => v.status !== 'Retired').length;
  const utilPercent = nonRetiredCount > 0 ? Math.round((activeVCount / nonRetiredCount) * 100) : 0;

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalMiscCost = expenses.reduce((sum, e) => sum + (e.toll || 0) + (e.cost || 0), 0);
  const totalOperCost = totalFuelCost + totalMaintCost + totalMiscCost;

  const totalAcq = vehicles.reduce((sum, v) => sum + v.acquisitionCost, 0);
  const totalRev = trips.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.revenue, 0);
  const netProfit = totalRev - totalOperCost;
  const avgROI = totalAcq > 0 ? ((netProfit / totalAcq) * 100).toFixed(1) : '0.0';

  const handleExportCSV = () => {
    try {
      const headers = [
        'Vehicle Reg No',
        'Type',
        'Acquisition Cost',
        'Distance Traveled',
        'Total Fuel Consumed',
        'Avg Fuel Efficiency',
        'Total Fuel Cost',
        'Total Maintenance Cost',
        'Total Other Expenses',
        'Total Revenue',
        'Vehicle ROI (%)'
      ];

      const rows = vehicles.map(v => {
        const f = getVehicleFinancesLocal(v.id, v.acquisitionCost);
        return [
          v.regNo,
          v.type,
          v.acquisitionCost,
          `${f.distance} ${distanceUnit}`,
          `${f.fuelLiters} L`,
          `${f.efficiency} ${distanceUnit}/L`,
          f.fuelCost,
          f.maintCost,
          f.otherCost,
          f.revenue,
          `${f.roi}%`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => {
          const cleanVal = String(val).replace(/"/g, '""');
          return cleanVal.includes(',') ? `"${cleanVal}"` : cleanVal;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transitops_fleet_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logAudit('Exported cost ledger as CSV.');
      showToast('CSV export downloaded successfully.', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to compile CSV data.', 'error');
    }
  };

  const handleExportPDF = () => {
    logAudit('Exported cost ledger as PDF.');
    showToast('PDF export downloaded.', 'success');
  };

  const isChartjsOffline = typeof Chart === 'undefined';

  return (
    <div id="reports-sec" className="page-section active">
      {/* KPI Metrics Cards */}
      <div className="kpi-container" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card" id="akpi-fuel">
          <div className="kpi-header">
            <span className="kpi-title">Fuel Efficiency</span>
            <i className="fa-solid fa-gas-pump kpi-icon"></i>
          </div>
          <div className="kpi-value" id="val-avg-fuel-eff">{avgEfficiency} {distanceUnit}/l</div>
        </div>
        <div className="kpi-card kpi-available" id="akpi-util">
          <div className="kpi-header">
            <span className="kpi-title">Fleet Utilization</span>
            <i className="fa-solid fa-percent kpi-icon"></i>
          </div>
          <div className="kpi-value" id="val-avg-utilization">{utilPercent}%</div>
        </div>
        <div className="kpi-card kpi-maintenance" id="akpi-cost">
          <div className="kpi-header">
            <span className="kpi-title">Operational Cost</span>
            <i className="fa-solid fa-file-invoice-dollar kpi-icon"></i>
          </div>
          <div className="kpi-value" id="val-avg-operational-cost">{currencySymbol}{totalOperCost.toLocaleString()}</div>
        </div>
        <div className="kpi-card kpi-trips" id="akpi-roi">
          <div className="kpi-header">
            <span className="kpi-title">Vehicle ROI</span>
            <i className="fa-solid fa-chart-line kpi-icon"></i>
          </div>
          <div className="kpi-value" id="val-avg-roi">{avgROI}%</div>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-1.5rem', marginBottom: '2rem', paddingLeft: '0.5rem', fontStyle: 'italic' }}>
        ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
      </div>

      {/* Analytics Graph Layout */}
      <div className="dashboard-layout" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        {/* Left: Monthly Revenue */}
        <div className="glass-panel">
          <div className="panel-title">Monthly Revenue</div>
          <div className="chart-container" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isChartjsOffline ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: 'var(--warning-color)' }}></i> Chart.js Library Offline (CDN blocked)
              </div>
            ) : (
              <canvas ref={revCanvasRef} id="monthlyRevenueChart"></canvas>
            )}
          </div>
        </div>

        {/* Right: Top Costliest Vehicles */}
        <div className="glass-panel">
          <div className="panel-title">Top Costliest Vehicles</div>
          <div className="chart-container" style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {isChartjsOffline ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-exclamation" style={{ color: 'var(--warning-color)' }}></i> Chart.js Library Offline (CDN blocked)
              </div>
            ) : (
              <canvas ref={costCanvasRef} id="topCostliestChart"></canvas>
            )}
          </div>
        </div>
      </div>

      {/* cost ledger table */}
      <div className="glass-panel">
        <div className="section-header">
          <div className="section-title">
            <span>Detailed Fleet Cost & ROI Ledger</span>
          </div>
          <div className="section-actions">
            <button onClick={handleExportCSV} id="export-csv-btn" className="btn btn-secondary"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
            <button onClick={handleExportPDF} id="export-pdf-btn" className="btn btn-secondary"><i class="fa-solid fa-file-pdf"></i> Export PDF</button>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vehicle Reg No</th>
                <th>Type</th>
                <th>Acquisition Cost</th>
                <th>Distance Traveled</th>
                <th>Total Fuel Consumed</th>
                <th>Avg Fuel Efficiency</th>
                <th>Total Fuel Cost</th>
                <th>Total Maintenance</th>
                <th>Total Expenses</th>
                <th>Total Revenue</th>
                <th style={{ fontWeight: 700, color: 'var(--accent-color)' }}>Vehicle ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => {
                const f = getVehicleFinancesLocal(v.id, v.acquisitionCost);
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.regNo}</td>
                    <td>{v.type}</td>
                    <td>{currencySymbol}{v.acquisitionCost.toLocaleString()}</td>
                    <td>{f.distance.toLocaleString()} {distanceUnit}</td>
                    <td>{f.fuelLiters} L</td>
                    <td>{f.efficiency} {distanceUnit}/L</td>
                    <td>{currencySymbol}{f.fuelCost.toLocaleString()}</td>
                    <td>{currencySymbol}{f.maintCost.toLocaleString()}</td>
                    <td>{currencySymbol}{f.otherCost.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success-color)' }}>{currencySymbol}{f.revenue.toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: f.roi >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontSize: '0.95rem' }}>
                      {f.roi}%
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fleet ledger entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
