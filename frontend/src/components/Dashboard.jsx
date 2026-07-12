import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus]); // refetch when filters change

  const fetchData = async () => {
    try {
      const vRes = await fetch(`/api/vehicles?type=${filterType}&status=${filterStatus}`);
      const tRes = await fetch('/api/trips');
      const dRes = await fetch('/api/drivers');

      if (vRes.ok && tRes.ok && dRes.ok) {
        setVehicles(await vRes.json());
        setTrips(await tRes.json());
        setDrivers(await dRes.json());
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    }
  };

  // Filter vehicles by region locally
  const filteredVehicles = vehicles.filter(v => {
    let matchesRegion = true;
    if (filterRegion) {
      if (filterRegion === 'North') matchesRegion = v.regNo.includes('VAN-02') || v.regNo.includes('BOX-04');
      else if (filterRegion === 'South') matchesRegion = v.regNo.includes('TRK-01');
      else matchesRegion = v.regNo.includes('VAN-05') || v.regNo.includes('SE-09') || v.regNo.includes('MINI-03');
    }
    return matchesRegion;
  });

  const total = filteredVehicles.length;
  const avail = filteredVehicles.filter(v => v.status === 'Available').length;
  const ontrip = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const inshop = filteredVehicles.filter(v => v.status === 'In Shop').length;
  const retired = filteredVehicles.filter(v => v.status === 'Retired').length;

  const getPercent = (count) => {
    return total > 0 ? `${Math.round((count / total) * 100)}%` : '0%';
  };

  const recentTrips = [...trips].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <div id="dashboard-sec" className="page-section active">
      {/* Filters */}
      <div className="dashboard-filters">
        <div className="select-wrapper">
          <select
            id="dash-filter-type"
            className="role-select"
            title="Filter dashboard metrics by vehicle type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Vehicle Type: All</option>
            <option value="Van">Van</option>
            <option value="Box Truck">Box Truck</option>
            <option value="Heavy Truck">Heavy Truck</option>
          </select>
        </div>
        <div className="select-wrapper">
          <select
            id="dash-filter-status"
            className="role-select"
            title="Filter dashboard metrics by vehicle status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Status: All</option>
            <option value="Available">Available</option>
            <option value="On Trip">On Trip</option>
            <option value="In Shop">In Shop</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
        <div className="select-wrapper">
          <select
            id="dash-filter-region"
            className="role-select"
            title="Filter dashboard metrics by region"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="">Region: All</option>
            <option value="North">North Region</option>
            <option value="South">South Region</option>
            <option value="West">West Region</option>
            <option value="East">East Region</option>
          </select>
        </div>
      </div>

      {/* Split Layout */}
      <div className="dashboard-layout">
        {/* Left panel: Recent Trips Table */}
        <div className="glass-panel">
          <div className="panel-title">Recent Trips</div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody id="recent-trips-tbody">
                {recentTrips.map(t => {
                  const v = vehicles.find(item => item.id === t.vehicleId) || { regNo: '--' };
                  const d = drivers.find(item => item.id === t.driverId) || { name: '--' };
                  let etaText = '--';
                  if (t.status === 'Dispatched') etaText = '45 min';
                  else if (t.status === 'Draft') etaText = 'Awaiting vehicle';

                  return (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.id.toUpperCase()}</td>
                      <td style={{ fontWeight: 500 }}>{v.regNo}</td>
                      <td>{d.name.split(' ')[0]}</td>
                      <td><span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{etaText}</td>
                    </tr>
                  );
                })}
                {recentTrips.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No recent dispatches logged.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: Vehicle Status Progress Bars */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="panel-title">Vehicle Status</div>
            <div className="vehicle-status-widget">
              <div className="status-bar-item">
                <div className="status-bar-header">
                  <span>Available</span>
                  <span id="bar-val-avail">{avail}</span>
                </div>
                <div className="status-bar-track">
                  <div id="bar-fill-avail" className="status-bar-fill fill-available" style={{ width: getPercent(avail) }}></div>
                </div>
              </div>
              <div className="status-bar-item">
                <div className="status-bar-header">
                  <span>On Trip</span>
                  <span id="bar-val-ontrip">{ontrip}</span>
                </div>
                <div className="status-bar-track">
                  <div id="bar-fill-ontrip" className="status-bar-fill fill-ontrip" style={{ width: getPercent(ontrip) }}></div>
                </div>
              </div>
              <div className="status-bar-item">
                <div className="status-bar-header">
                  <span>In Shop</span>
                  <span id="bar-val-inshop">{inshop}</span>
                </div>
                <div className="status-bar-track">
                  <div id="bar-fill-inshop" className="status-bar-fill fill-inshop" style={{ width: getPercent(inshop) }}></div>
                </div>
              </div>
              <div className="status-bar-item">
                <div className="status-bar-header">
                  <span>Retired</span>
                  <span id="bar-val-retired">{retired}</span>
                </div>
                <div className="status-bar-track">
                  <div id="bar-fill-retired" className="status-bar-fill fill-retired" style={{ width: getPercent(retired) }}></div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-info-circle"></i> Stats reflect non-retired fleet distribution.
          </div>
        </div>
      </div>
    </div>
  );
}
