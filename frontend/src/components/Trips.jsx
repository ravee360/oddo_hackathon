import React, { useState, useEffect } from 'react';

const CURRENT_DATE = '2026-07-12';

export default function Trips({ role, currencySymbol, logAudit, showToast }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [distance, setDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  // Active step node
  const [activeStep, setActiveStep] = useState(1);
  const [overloadError, setOverloadError] = useState('');

  // Complete modal state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [completeOdo, setCompleteOdo] = useState('');
  const [completeFuel, setCompleteFuel] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchTrips();
  }, [filterStatus]);

  const fetchTrips = async () => {
    try {
      const tRes = await fetch(`/api/trips?status=${filterStatus}`);
      const vRes = await fetch('/api/vehicles');
      const dRes = await fetch('/api/drivers');

      if (tRes.ok && vRes.ok && dRes.ok) {
        setTrips(await tRes.json());
        setVehicles(await vRes.json());
        setDrivers(await dRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time capacity check
  useEffect(() => {
    if (!vehicleId || !cargoWeight) {
      setOverloadError('');
      setActiveStep(1);
      return;
    }

    const v = vehicles.find(item => item.id === vehicleId);
    if (!v) return;

    const weight = Number(cargoWeight);
    if (weight > v.maxCapacity) {
      const diff = weight - v.maxCapacity;
      setOverloadError(`Capacity exceeded by ${diff} kg — dispatch blocked`);
      setActiveStep(4); // moves state dot to red / error
    } else {
      setOverloadError('');
      setActiveStep(2); // ready
    }
  }, [vehicleId, cargoWeight, vehicles]);

  const handleTripSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId || !driverId) {
      showToast('Select valid vehicle and driver.', 'error');
      return;
    }

    const record = {
      source: source.trim(),
      destination: destination.trim(),
      vehicleId,
      driverId,
      cargoWeight: Number(cargoWeight),
      distance: Number(distance),
      revenue: Number(revenue)
    };

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });

      if (res.ok) {
        logAudit(`Created draft trip to ${record.destination}.`);
        showToast('Trip created as Draft.', 'success');
        setSource('');
        setDestination('');
        setVehicleId('');
        setDriverId('');
        setCargoWeight('');
        setDistance('');
        setRevenue('');
        setActiveStep(1);
        fetchTrips();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create trip.', 'error');
      }
    } catch (error) {
      showToast('Connection to backend server failed.', 'error');
    }
  };

  const handleDispatch = async (id) => {
    try {
      const res = await fetch(`/api/trips/${id}/dispatch`, { method: 'POST' });
      if (res.ok) {
        logAudit(`Dispatched trip ${id}.`);
        showToast(`Trip ${id} dispatched!`, 'success');
        fetchTrips();
      } else {
        const data = await res.json();
        showToast(data.error || 'Dispatch failed.', 'error');
      }
    } catch (e) {
      showToast('Connection error.', 'error');
    }
  };

  const handleCancel = async (id) => {
    if (confirm('Cancel this dispatch trip?')) {
      try {
        const res = await fetch(`/api/trips/${id}/cancel`, { method: 'POST' });
        if (res.ok) {
          logAudit(`Cancelled dispatch trip ${id}.`);
          showToast('Trip cancelled.', 'warning');
          fetchTrips();
        }
      } catch (e) {
        showToast('Connection error.', 'error');
      }
    }
  };

  const handleOpenComplete = (t) => {
    const v = vehicles.find(item => item.id === t.vehicleId) || {};
    setSelectedTrip(t);
    setCompleteOdo(t.startOdo + t.distance);
    setCompleteFuel(Math.round(t.distance * 0.22));
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (Number(completeOdo) < selectedTrip.startOdo) {
      showToast('Final odometer cannot be less than start odometer!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endOdo: Number(completeOdo), fuelUsed: Number(completeFuel) })
      });

      if (res.ok) {
        logAudit(`Completed trip ${selectedTrip.id}. Recorded fuel refil.`);
        showToast(`Trip Completed.`, 'success');
        setShowCompleteModal(false);
        fetchTrips();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to complete trip.', 'error');
      }
    } catch (error) {
      showToast('Connection error.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete draft trip?')) {
      try {
        const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
        if (res.ok) {
          logAudit(`Deleted draft trip.`);
          showToast('Trip deleted.', 'warning');
          fetchTrips();
        }
      } catch (e) {
        showToast('Connection error.', 'error');
      }
    }
  };

  const isDispatchAllowed = role === 'Fleet Manager' || role === 'Dispatcher';

  // Dropdown options
  const availVehicles = vehicles.filter(v => v.status === 'Available');
  const eligibleDrivers = drivers.filter(d => {
    const isAvail = d.status === 'Available';
    const expDate = new Date(d.licenseExpiry);
    return isAvail && d.status !== 'Suspended' && expDate > new Date(CURRENT_DATE);
  });

  return (
    <div id="trips-sec" className="page-section active">
      <div className="dispatcher-grid">
        {/* Left Panel: Create Trip Form */}
        <div className="glass-panel">
          <div className="panel-title">Trip Dispatcher</div>
          
          {/* Timeline steps */}
          <div className="step-tracker">
            <div className={`step-node ${activeStep >= 1 ? 'active' : ''}`}>
              <div className="step-dot">1</div>
              <span className="step-label">Draft</span>
            </div>
            <div className={`step-node ${activeStep >= 2 ? 'active' : ''}`}>
              <div className="step-dot">2</div>
              <span className="step-label">Dispatched</span>
            </div>
            <div className={`step-node ${activeStep >= 3 ? 'active' : ''}`}>
              <div className="step-dot">3</div>
              <span className="step-label">Completed</span>
            </div>
            <div className={`step-node ${activeStep >= 4 ? 'active' : ''}`}>
              <div className="step-dot">4</div>
              <span className="step-label">Cancelled</span>
            </div>
          </div>

          {overloadError && (
            <div className="error-alert-banner active">
              <i className="fa-solid fa-circle-exclamation"></i>
              <span>{overloadError}</span>
            </div>
          )}

          <form onSubmit={handleTripSubmit} id="trip-form">
            <div className="form-group">
              <label>Source</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Gandhinagar Depot"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ahmedabad Hub"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Vehicle (Available Only)</label>
              <div className="select-wrapper">
                <select
                  className="form-control"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Available Asset --</option>
                  {availVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.regNo} (Max Capacity: {v.maxCapacity} kg)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Driver (Available Only)</label>
              <div className="select-wrapper">
                <select
                  className="form-control"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Eligible Driver --</option>
                  {eligibleDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseCategory})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cargo Weight (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 500"
                  value={cargoWeight}
                  onChange={(e) => setCargoWeight(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Planned Distance (km)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 38"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Contract Revenue ($)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 450"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" disabled={!!overloadError} className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--accent-color)' }}>
                <i className="fa-solid fa-paper-plane"></i> Dispatch
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource('');
                  setDestination('');
                  setVehicleId('');
                  setDriverId('');
                  setCargoWeight('');
                  setDistance('');
                  setRevenue('');
                }}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Live Board Cards */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-title">
            <span>Live Board</span>
            <div className="select-wrapper">
              <select
                id="trip-filter-status"
                className="role-select"
                style={{ fontSize: '0.75rem', padding: '0.25rem 1.5rem 0.25rem 0.5rem' }}
                title="Filter live board list"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="live-board-list" id="trip-live-board">
            {trips.map(t => {
              const v = vehicles.find(item => item.id === t.vehicleId) || { regNo: 'Unknown', name: 'N/A' };
              const d = drivers.find(item => item.id === t.driverId) || { name: 'Unknown' };

              let etaText = '';
              let actionHtml = '';

              if (t.status === 'Dispatched') {
                etaText = `ETA: 45 min`;
                actionHtml = (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                    <button onClick={() => handleOpenComplete(t)} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--success-color)' }} disabled={!isDispatchAllowed}><i className="fa-solid fa-check-double"></i> Complete</button>
                    <button onClick={() => handleCancel(t.id)} className="btn btn-danger" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} disabled={!isDispatchAllowed}><i className="fa-solid fa-xmark"></i> Cancel</button>
                  </div>
                );
              } else if (t.status === 'Draft') {
                etaText = 'Awaiting Driver';
                actionHtml = (
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
                    <button onClick={() => handleDispatch(t.id)} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--accent-color)' }} disabled={!isDispatchAllowed}><i className="fa-solid fa-paper-plane"></i> Dispatch</button>
                    <button onClick={() => handleDelete(t.id)} className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} disabled={!isDispatchAllowed}><i className="fa-solid fa-trash-can"></i> Delete</button>
                  </div>
                );
              } else if (t.status === 'Completed') {
                etaText = `Odo: ${t.startOdo} - ${t.endOdo} km`;
              } else if (t.status === 'Cancelled') {
                etaText = 'Cancelled';
              }

              return (
                <div key={t.id} className={`live-board-card status-${t.status.toLowerCase()}`}>
                  <div className="card-left">
                    <span className="card-trip-id">{t.id.toUpperCase()}</span>
                    <span className="card-route">{t.source} &rarr; {t.destination}</span>
                    <span className="card-metadata">
                      <span><i className="fa-solid fa-truck"></i> {v.regNo}</span>
                      <span><i className="fa-solid fa-user"></i> {d.name}</span>
                      <span><i className="fa-solid fa-weight-hanging"></i> {t.cargoWeight} kg</span>
                    </span>
                  </div>
                  <div className="card-right">
                    <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                    <span className="card-eta" style={{ color: t.status === 'Completed' ? 'var(--success-color)' : (t.status === 'Cancelled' ? 'var(--danger-color)' : '') }}>{etaText}</span>
                    {actionHtml}
                  </div>
                </div>
              );
            })}
            {trips.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No operational cards found.</div>
            )}
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
            On Complete: odometer &rarr; fuel log &rarr; expenses &rarr; Vehicle & Driver Available.
          </span>
        </div>
      </div>

      {/* Complete Trip Modal */}
      {showCompleteModal && selectedTrip && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container" style={{ width: '400px' }}>
            <div className="modal-header">
              <span className="modal-title">Complete Trip: {selectedTrip.id.toUpperCase()}</span>
              <button onClick={() => setShowCompleteModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleCompleteSubmit} id="complete-trip-form">
              <div className="modal-body">
                <div id="complete-trip-summary" style={{ marginBottom: '1rem', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  Finalizing trip <strong>{selectedTrip.id.toUpperCase()}</strong>.<br />
                  Start Odo: <strong>{selectedTrip.startOdo} km</strong>. Distance: <strong>{selectedTrip.distance} km</strong>.
                </div>
                <div className="form-group">
                  <label htmlFor="complete-odo">Final Odometer Reading (km)</label>
                  <input
                    type="number"
                    id="complete-odo"
                    className="form-control"
                    value={completeOdo}
                    onChange={(e) => setCompleteOdo(e.target.value)}
                    required
                  />
                  <small id="complete-odo-hint" className="form-text text-muted" style={{ display: 'block', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Must be &ge; start odometer {selectedTrip.startOdo} km.
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="complete-fuel">Refill Fuel Logged (Liters)</label>
                  <input
                    type="number"
                    id="complete-fuel"
                    className="form-control"
                    value={completeFuel}
                    onChange={(e) => setCompleteFuel(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCompleteModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success-color)' }}>Finalize Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
