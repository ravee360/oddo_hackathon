import React, { useState, useEffect } from 'react';

export default function Settings({ settings, onSaveSettings, onResetDatabase }) {
  const [depot, setDepot] = useState(settings.depotName);
  const [currency, setCurrency] = useState(settings.currency);
  const [distance, setDistance] = useState(settings.distanceUnit);

  useEffect(() => {
    setDepot(settings.depotName);
    setCurrency(settings.currency);
    setDistance(settings.distanceUnit);
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      depotName: depot,
      currency,
      distanceUnit: distance
    });
  };

  return (
    <div id="settings-sec" className="page-section active">
      <div className="dispatcher-grid" style={{ gridTemplateColumns: '1fr 1.3fr' }}>
        {/* Left: General Configurations */}
        <div className="glass-panel">
          <div className="panel-title">General</div>
          <form onSubmit={handleSubmit} id="settings-general-form">
            <div className="form-group">
              <label htmlFor="set-depot">Depot Name</label>
              <input
                type="text"
                id="set-depot"
                className="form-control"
                placeholder="e.g. Gandhinagar Depot GJ14"
                value={depot}
                onChange={(e) => setDepot(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="set-currency">Currency</label>
              <div className="select-wrapper">
                <select
                  id="set-currency"
                  className="form-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="INR (Rs)">INR (Rs)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (&euro;)">EUR (&euro;)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="set-distance">Distance Unit</label>
              <div className="select-wrapper">
                <select
                  id="set-distance"
                  className="form-control"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required
                >
                  <option value="Kilometers">Kilometers (km)</option>
                  <option value="Miles">Miles (mi)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-color)' }}>
              Save changes
            </button>
          </form>
        </div>

        {/* Right: RBAC Grid */}
        <div className="glass-panel">
          <div className="panel-title">Role-Based Access Control (RBAC) Matrix</div>
          <div className="table-responsive">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Fleet</th>
                  <th>Drivers</th>
                  <th>Trips</th>
                  <th>Maint.</th>
                  <th>Expenses</th>
                  <th>Analytics</th>
                  <th>Settings</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Fleet Manager</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>—</td>
                  <td>View</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Dispatcher</td>
                  <td>View</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>View</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Safety Officer</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>View</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>View</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Financial Analyst</td>
                  <td>View</td>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                  <td>✓</td>
                  <td>✓</td>
                  <td>View</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            <strong>Legend:</strong><br />
            • <strong>✓</strong> : Write access (Add, edit, dispatch, complete, modify settings).<br />
            • <strong>View</strong> : Read-only access (Displays parameters but disables write forms/buttons).<br />
            • <strong>—</strong> : Hidden access (Completely hides the tab from the sidebar menu).
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel danger-zone" style={{ marginTop: '2rem' }}>
        <div className="panel-title" style={{ color: 'var(--danger-color)' }}>Danger Zone</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resetting the database clears all customized vehicles, driver safety scores, active dispatches, and logs. It restores the system to the default seed files.</p>
        <button
          onClick={onResetDatabase}
          className="btn btn-danger"
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', marginTop: '0.5rem' }}
          id="settings-reset-db-btn"
        >
          <i className="fa-solid fa-triangle-exclamation"></i> Reset TransitOps Database
        </button>
      </div>
    </div>
  );
}
