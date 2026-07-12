import React, { useState, useEffect } from 'react';

export default function Maintenance({ role, currencySymbol, logAudit, showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [maintLogs, setMaintLogs] = useState([]);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [desc, setDesc] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const mRes = await fetch('/api/maintenance');
      const vRes = await fetch('/api/vehicles');

      if (mRes.ok && vRes.ok) {
        setMaintLogs(await mRes.json());
        setVehicles(await vRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      showToast('Select a vehicle asset.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, description: desc, startDate: date, cost: Number(cost), status })
      });

      if (res.ok) {
        const v = vehicles.find(item => item.id === vehicleId);
        logAudit(`Logged maintenance record for ${v ? v.regNo : ''}.`);
        showToast('Maintenance recorded.', 'success');
        setVehicleId('');
        setDesc('');
        setCost('');
        setDate('');
        setStatus('Active');
        fetchLogs();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to record maintenance.', 'error');
      }
    } catch (error) {
      showToast('Connection error.', 'error');
    }
  };

  const handleCloseMaintenance = async (id, regNo) => {
    try {
      const res = await fetch(`/api/maintenance/${id}/close`, { method: 'POST' });
      if (res.ok) {
        logAudit(`Completed maintenance for ${regNo}.`);
        showToast(`Vehicle restored to Available.`, 'success');
        fetchLogs();
      }
    } catch (e) {
      showToast('Connection error.', 'error');
    }
  };

  const isEditable = role === 'Fleet Manager';
  const eligibleV = vehicles.filter(v => v.status !== 'Retired');

  return (
    <div id="maintenance-sec" className="page-section active">
      <div className="dispatcher-grid">
        {/* Left Form: Create Maintenance Record */}
        {isEditable ? (
          <div className="glass-panel">
            <div className="panel-title">Log Service Record</div>
            <form onSubmit={handleFormSubmit} id="maintenance-form">
              <div className="form-group">
                <label>Vehicle</label>
                <div className="select-wrapper">
                  <select
                    className="form-control"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Asset --</option>
                    {eligibleV.map(v => (
                      <option key={v.id} value={v.id}>{v.regNo} [{v.status}]</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Service Type</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Oil Change"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Cost</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  placeholder="e.g. 2500"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <div className="select-wrapper">
                  <select
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="Active">Active (In Shop)</option>
                    <option value="Completed">Completed (Available)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-color)' }}>
                <i className="fa-solid fa-screwdriver-wrench"></i> Save
              </button>
            </form>

            {/* State Flow Guidelines Widget */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                <span style={{ color: 'var(--success-color)' }}>Available</span>
                <span>&rarr; creating active record &rarr;</span>
                <span style={{ color: 'var(--warning-color)' }}>In Shop</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                <span style={{ color: 'var(--warning-color)' }}>In Shop</span>
                <span>&rarr; closing record &rarr;</span>
                <span style={{ color: 'var(--success-color)' }}>Available</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>Note: In Shop vehicles are removed from the dispatch pool.</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'none' }}></div>
        )}

        {/* Right Table: Service Logs */}
        <div className="glass-panel">
          <div className="panel-title">Service Logs</div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody id="maintenance-table-body">
                {maintLogs.map(log => {
                  const v = vehicles.find(item => item.id === log.vehicleId) || { regNo: 'Unknown' };
                  const isActive = log.status === 'Active';
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.regNo}</td>
                      <td>{log.description}</td>
                      <td>{currencySymbol}{log.cost.toLocaleString()}</td>
                      <td><span className={`badge badge-${isActive ? 'inshop' : 'available'}`}>{isActive ? 'In Shop' : 'Completed'}</span></td>
                      <td>
                        {isActive ? (
                          <button
                            onClick={() => handleCloseMaintenance(log.id, v.regNo)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                            disabled={!isEditable}
                          >
                            Complete
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Archived</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {maintLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No service records registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
