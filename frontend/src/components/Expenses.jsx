import React, { useState, useEffect } from 'react';

const CURRENT_DATE = '2026-07-12';

export default function Expenses({ role, currencySymbol, logAudit, showToast }) {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  // Modals state
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states (Fuel)
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState(CURRENT_DATE);

  // Form states (Expense)
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expTripId, setExpTripId] = useState('');
  const [expToll, setExpToll] = useState('');
  const [expOther, setExpOther] = useState('');
  const [expDate, setExpDate] = useState(CURRENT_DATE);

  useEffect(() => {
    fetchExpensesData();
  }, []);

  const fetchExpensesData = async () => {
    try {
      const eRes = await fetch('/api/expenses');
      const mRes = await fetch('/api/maintenance');
      const vRes = await fetch('/api/vehicles');
      const tRes = await fetch('/api/trips');

      if (eRes.ok && mRes.ok && vRes.ok && tRes.ok) {
        const eData = await eRes.json();
        setFuelLogs(eData.fuelLogs);
        setExpenses(eData.expenses);
        setMaintenance(await mRes.json());
        setVehicles(await vRes.json());
        setTrips(await tRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses/fuel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: fuelVehicleId, liters: Number(fuelLiters), cost: Number(fuelCost), date: fuelDate })
      });
      if (res.ok) {
        logAudit(`Logged fuel refill.`);
        showToast('Fuel log recorded.', 'success');
        setShowFuelModal(false);
        setFuelVehicleId('');
        setFuelLiters('');
        setFuelCost('');
        fetchExpensesData();
      }
    } catch (error) {
      showToast('Failed to log fuel refill.', 'error');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses/other', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: expVehicleId, tripId: expTripId, toll: Number(expToll), cost: Number(expOther), date: expDate })
      });
      if (res.ok) {
        logAudit(`Logged miscellaneous expense.`);
        showToast('Expense log recorded.', 'success');
        setShowExpenseModal(false);
        setExpVehicleId('');
        setExpTripId('');
        setExpToll('');
        setExpOther('');
        fetchExpensesData();
      }
    } catch (error) {
      showToast('Failed to log expense.', 'error');
    }
  };

  // Compile other expenses (permits + tolls + maintenance costs combined)
  const otherList = [];
  expenses.forEach(e => {
    const v = vehicles.find(item => item.id === e.vehicleId) || { regNo: 'Unknown' };
    const t = trips.find(item => item.id === e.tripId) || { status: 'Available' };
    otherList.push({
      id: e.id,
      tripId: e.tripId || '—',
      regNo: v.regNo,
      toll: e.toll || 0,
      other: e.cost || 0,
      maint: 0,
      status: t.status
    });
  });

  maintenance.forEach(m => {
    const v = vehicles.find(item => item.id === m.vehicleId) || { regNo: 'Unknown' };
    otherList.push({
      id: m.id,
      tripId: '—',
      regNo: v.regNo,
      toll: 0,
      other: 0,
      maint: m.cost,
      status: m.status === 'Active' ? 'In Shop' : 'Completed'
    });
  });

  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaint = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const totalSurcharges = expenses.reduce((sum, e) => sum + (e.toll || 0) + (e.cost || 0), 0);
  const totalCost = totalFuel + totalMaint + totalSurcharges;

  const isEditable = role === 'Fleet Manager' || role === 'Financial Analyst';
  const activeTrips = trips.filter(t => t.status === 'Dispatched');

  return (
    <div id="expenses-sec" className="page-section active">
      {/* Top section actions */}
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title">
          <i className="fa-solid fa-file-invoice-dollar"></i>
          <span>Fuel & Expense Management</span>
        </div>
        {isEditable && (
          <div className="section-actions">
            <button onClick={() => setShowFuelModal(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>
              <i className="fa-solid fa-gas-pump"></i> + Log Fuel
            </button>
            <button onClick={() => setShowExpenseModal(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>
              <i className="fa-solid fa-receipt"></i> + Add Expense
            </button>
          </div>
        )}
      </div>

      {/* Split double tables layout */}
      <div className="dashboard-layout" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
        {/* Table 1: Fuel Logs */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <div className="panel-title">Fuel Logs</div>
          <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Date</th>
                  <th>Liters</th>
                  <th>Fuel Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.map(f => {
                  const v = vehicles.find(item => item.id === f.vehicleId) || { regNo: 'Unknown' };
                  return (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.regNo}</td>
                      <td>{f.date}</td>
                      <td>{f.liters} L</td>
                      <td style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{currencySymbol}{f.cost.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {fuelLogs.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No fuel logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Other Expenses */}
        <div className="glass-panel" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '440px' }}>
          <div>
            <div className="panel-title">Other Expenses (Toll / Misc)</div>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Vehicle</th>
                    <th>Toll</th>
                    <th>Other</th>
                    <th>Maint. (Linked)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {otherList.map(item => {
                    let badgeClass = 'available';
                    if (item.status === 'Completed') badgeClass = 'available';
                    else if (item.status === 'Dispatched' || item.status === 'In Shop') badgeClass = 'inshop';

                    return (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'monospace' }}>{item.tripId}</td>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.regNo}</td>
                        <td>{currencySymbol}{item.toll}</td>
                        <td>{currencySymbol}{item.other}</td>
                        <td>{currencySymbol}{item.maint}</td>
                        <td><span className={`badge badge-${badgeClass}`}>{item.status}</span></td>
                      </tr>
                    );
                  })}
                  {otherList.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        No miscellaneous expenses logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Computed Total Indicator */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Operational Cost (Auto) = Fuel + Maint
            </span>
            <span id="val-total-operational-cost" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-color)' }}>
              {currencySymbol}{totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container" style={{ width: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">Log Fuel Refill</span>
              <button onClick={() => setShowFuelModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleFuelSubmit} id="modal-fuel-form">
              <div className="modal-body">
                <div className="form-group">
                  <label>Vehicle</label>
                  <div className="select-wrapper">
                    <select
                      className="form-control"
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Asset --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.regNo}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Fuel Liters (L)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total Invoice Cost ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowFuelModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>Save Fuel Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container" style={{ width: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">Add Miscellaneous Expense</span>
              <button onClick={() => setShowExpenseModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleExpenseSubmit} id="modal-expense-form">
              <div className="modal-body">
                <div className="form-group">
                  <label>Vehicle</label>
                  <div className="select-wrapper">
                    <select
                      className="form-control"
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
                      required
                    >
                      <option value="">-- Select Asset --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.regNo}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Linked Dispatch Trip (Dispatched Only)</label>
                  <div className="select-wrapper">
                    <select
                      className="form-control"
                      value={expTripId}
                      onChange={(e) => setExpTripId(e.target.value)}
                    >
                      <option value="">-- No Linked Trip --</option>
                      {activeTrips.map(t => (
                        <option key={t.id} value={t.id}>{t.id.toUpperCase()} ({t.source.split(' ')[0]} &rarr; {t.destination.split(' ')[0]})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Toll Cost ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={expToll}
                      onChange={(e) => setExpToll(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Other/Permit Cost ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={expOther}
                      onChange={(e) => setExpOther(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
