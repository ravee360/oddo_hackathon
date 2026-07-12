import React, { useState, useEffect } from 'react';

const CURRENT_DATE = '2026-07-12';

export default function Drivers({ role, logAudit, showToast }) {
  const [drivers, setDrivers] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Modal forms
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [sentEmailLogs, setSentEmailLogs] = useState([]);
  const [showEmailLogsModal, setShowEmailLogsModal] = useState(false);
  const [dId, setDId] = useState('');
  const [dName, setDName] = useState('');
  const [dLicense, setDLicense] = useState('');
  const [dCategory, setDCategory] = useState('');
  const [dExpiry, setDExpiry] = useState('');
  const [dSafety, setDSafety] = useState('');
  const [dContact, setDContact] = useState('');
  const [dStatus, setDStatus] = useState('Available');

  useEffect(() => {
    fetchDrivers();
  }, [searchVal]);

  const fetchDrivers = async () => {
    try {
      const res = await fetch(`/api/drivers?search=${searchVal}`);
      if (res.ok) {
        setDrivers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setDId('');
    setDName('');
    setDLicense('');
    setDCategory('');
    setDExpiry('');
    setDSafety('90');
    setDContact('');
    setDStatus('Available');
    setShowDriverModal(true);
  };

  const handleOpenEdit = (d) => {
    setDId(d.id);
    setDName(d.name);
    setDLicense(d.licenseNo);
    setDCategory(d.licenseCategory);
    setDExpiry(d.licenseExpiry);
    setDSafety(d.safetyScore);
    setDContact(d.contact);
    setDStatus(d.status);
    setShowDriverModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const record = {
      name: dName.trim(),
      licenseNo: dLicense.trim(),
      licenseCategory: dCategory.trim(),
      licenseExpiry: dExpiry,
      safetyScore: Number(dSafety),
      contact: dContact.trim(),
      status: dStatus
    };

    try {
      let res;
      if (dId) {
        res = await fetch(`/api/drivers/${dId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
      } else {
        res = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
      }

      if (res.ok) {
        logAudit(`Driver ${dName} details saved.`);
        showToast('Driver profile saved successfully.', 'success');
        setShowDriverModal(false);
        fetchDrivers();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save driver profile.', 'error');
      }
    } catch (error) {
      showToast('Database connection error.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (confirm(`Remove driver card for ${name}?`)) {
      try {
        const res = await fetch(`/api/drivers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          logAudit(`Deleted driver record for ${name}.`);
          showToast('Driver deleted.', 'warning');
          if (selectedDriverId === id) setSelectedDriverId(null);
          fetchDrivers();
        }
      } catch (e) {
        showToast('Database connection error.', 'error');
      }
    }
  };

  const handleOverrideStatus = async (newStatus) => {
    if (!selectedDriverId) return;
    try {
      const res = await fetch(`/api/drivers/${selectedDriverId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const d = drivers.find(item => item.id === selectedDriverId);
        logAudit(`Override status for ${d ? d.name : ''} to ${newStatus}.`);
        showToast(`Driver status overridden to ${newStatus}.`, 'success');
        fetchDrivers();
      }
    } catch (e) {
      showToast('Database connection error.', 'error');
    }
  };

  const handleSendReminders = async () => {
    setIsSendingEmails(true);
    try {
      const res = await fetch('/api/drivers/send-reminders', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        logAudit(`Triggered license expiry checks. Sent ${data.sentCount} email reminders.`);
        showToast(`Scan complete. Sent ${data.sentCount} simulated emails.`, 'success');
        setSentEmailLogs(data.emails);
        setShowEmailLogsModal(true);
      } else {
        showToast('Failed to send email reminders.', 'error');
      }
    } catch (e) {
      showToast('Network connection error.', 'error');
    } finally {
      setIsSendingEmails(false);
    }
  };

  const isEditable = role === 'Fleet Manager' || role === 'Safety Officer';
  const isDeletable = role === 'Fleet Manager';
  const today = new Date(CURRENT_DATE);

  // License Expiry Alerts rendering
  const alerts = drivers.map(d => {
    const expDate = new Date(d.licenseExpiry);
    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      return (
        <div key={d.id} className="warning-banner">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>Driver <strong>{d.name}</strong>'s license ({d.licenseNo}) is <strong>EXPIRED</strong> (Expired on {d.licenseExpiry}). Dispatch is blocked.</span>
        </div>
      );
    } else if (diffDays <= 30) {
      return (
        <div key={d.id} className="warning-banner" style={{ backgroundColor: 'var(--warning-bg)', borderColor: 'rgba(245, 158, 11, 0.25)', color: 'var(--warning-color)' }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>Driver <strong>{d.name}</strong>'s license ({d.licenseNo}) expires in <strong>{diffDays} days</strong> ({d.licenseExpiry}).</span>
        </div>
      );
    }
    return null;
  }).filter(Boolean);

  const selectedDriver = drivers.find(item => item.id === selectedDriverId);

  return (
    <div id="drivers-sec" className="page-section active">
      {/* Expiry Alerts */}
      <div id="license-expiry-alerts">{alerts}</div>

      <div className="glass-panel">
        <div className="section-header">
          <div className="section-title">
            <i className="fa-solid fa-id-card"></i>
            <span>Drivers & Safety Profiles</span>
          </div>
          <div className="section-actions">
            <input
              type="text"
              id="driver-search"
              className="form-control"
              style={{ width: '240px', padding: '0.45rem 0.75rem' }}
              placeholder="Search driver name..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {isEditable && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSendReminders} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }} disabled={isSendingEmails}>
                  <i className="fa-solid fa-envelope"></i> {isSendingEmails ? 'Sending...' : 'Send Email Reminders'}
                </button>
                <button onClick={handleOpenAdd} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <i className="fa-solid fa-plus"></i> Add Driver
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>License No.</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Contact</th>
                <th>Trip Compl.</th>
                <th>Safety</th>
                <th>Status</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="driver-table-body">
              {drivers.map(d => {
                const expDate = new Date(d.licenseExpiry);
                const isExpired = expDate <= today;
                const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = diffDays > 0 && diffDays <= 30;

                let licenseClass = '';
                let expiryLabel = d.licenseExpiry;
                if (isExpired) {
                  licenseClass = 'badge-expired';
                  expiryLabel += ' EXPIRED';
                } else if (isExpiringSoon) {
                  licenseClass = 'badge-inshop';
                  expiryLabel += ` EXPIRING (${diffDays}d)`;
                }

                return (
                  <tr
                    key={d.id}
                    style={{ backgroundColor: selectedDriverId === d.id ? 'rgba(217,119,6,0.05)' : '' }}
                    onClick={() => setSelectedDriverId(d.id)}
                  >
                    <td style={{ fontWeight: 600, cursor: 'pointer' }}>{d.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{d.licenseNo}</td>
                    <td>{d.licenseCategory}</td>
                    <td>
                      <span className={`badge ${licenseClass}`}>{expiryLabel}</span>
                    </td>
                    <td>{d.contact}</td>
                    <td style={{ fontWeight: 500 }}>96%</td>
                    <td style={{ fontWeight: 600, color: d.safetyScore >= 90 ? 'var(--success-color)' : (d.safetyScore >= 70 ? 'var(--warning-color)' : 'var(--danger-color)') }}>
                      {d.safetyScore}
                    </td>
                    <td><span className={`badge badge-${d.status.toLowerCase().replace(' ', '')}`}>{d.status}</span></td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(d); }}
                        className="btn btn-secondary btn-icon-only"
                        disabled={!isEditable}
                        title="Edit Profile"
                      >
                        <i className="fa-solid fa-user-gear"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(d.id, d.name); }}
                        className="btn btn-danger btn-icon-only"
                        disabled={!isDeletable}
                        title="Delete Profile"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No drivers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick status override panel */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Quick Status Override</h4>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} id="driver-status-override-toggles">
            {selectedDriver ? (
              <>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: '0.5rem' }}>Override Status for {selectedDriver.name}:</span>
                <button onClick={() => handleOverrideStatus('Available')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: selectedDriver.status === 'Available' ? 'var(--success-bg)' : '', color: selectedDriver.status === 'Available' ? 'var(--success-color)' : '' }}>Available</button>
                <button onClick={() => handleOverrideStatus('On Trip')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: selectedDriver.status === 'On Trip' ? 'var(--info-bg)' : '', color: selectedDriver.status === 'On Trip' ? 'var(--info-color)' : '' }}>On Trip</button>
                <button onClick={() => handleOverrideStatus('Off Duty')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: selectedDriver.status === 'Off Duty' ? 'var(--retired-bg)' : '', color: selectedDriver.status === 'Off Duty' ? 'var(--retired-color)' : '' }}>Off Duty</button>
                <button onClick={() => handleOverrideStatus('Suspended')} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', backgroundColor: selectedDriver.status === 'Suspended' ? 'var(--danger-bg)' : '', color: selectedDriver.status === 'Suspended' ? 'var(--danger-color)' : '' }}>Suspended</button>
              </>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select a driver row above to quickly override status.</span>
            )}
          </div>
        </div>

        <span className="notice-label">Rule: Expired license or Suspended status &rarr; blocked from trip assignment</span>
      </div>

      {/* Add/Edit Driver Modal */}
      {showDriverModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">{dId ? 'Modify Driver Profile' : 'Register Driver Card'}</span>
              <button onClick={() => setShowDriverModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} id="driver-form">
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="driver-name">Driver Name</label>
                  <input
                    type="text"
                    id="driver-name"
                    className="form-control"
                    placeholder="e.g. Alex Rivera"
                    value={dName}
                    onChange={(e) => setDName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-license">License Number</label>
                  <input
                    type="text"
                    id="driver-license"
                    className="form-control"
                    placeholder="e.g. DL-9847291"
                    value={dLicense}
                    onChange={(e) => setDLicense(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-category">License Category</label>
                  <input
                    type="text"
                    id="driver-category"
                    className="form-control"
                    placeholder="e.g. Commercial (Class A)"
                    value={dCategory}
                    onChange={(e) => setDCategory(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-expiry">Expiration Date</label>
                  <input
                    type="date"
                    id="driver-expiry"
                    className="form-control"
                    value={dExpiry}
                    onChange={(e) => setDExpiry(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-safety">Safety Score (0 - 100)</label>
                  <input
                    type="number"
                    id="driver-safety"
                    className="form-control"
                    min="0"
                    max="100"
                    placeholder="90"
                    value={dSafety}
                    onChange={(e) => setDSafety(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-contact">Contact Number</label>
                  <input
                    type="text"
                    id="driver-contact"
                    className="form-control"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={dContact}
                    onChange={(e) => setDContact(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="driver-status">Status</label>
                  <div className="select-wrapper">
                    <select
                      id="driver-status"
                      className="form-control"
                      value={dStatus}
                      onChange={(e) => setDStatus(e.target.value)}
                      required
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowDriverModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sent Email Outbox Preview Modal */}
      {showEmailLogsModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <span className="modal-title">Sent Reminders Outbox (Simulated)</span>
              <button onClick={() => setShowEmailLogsModal(false)} className="modal-close">&times;</button>
            </div>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                The safety system scanned all licenses and sent simulated emails to the following drivers:
              </p>
              {sentEmailLogs.map(email => (
                <div key={email.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                    <span>To: <strong>{email.recipient}</strong></span>
                    <span>Status: <span style={{ color: 'var(--success-color)' }}>{email.status}</span></span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Subject: {email.subject}</div>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: '4px', lineHeight: '1.4' }}>{email.body}</pre>
                </div>
              ))}
              {sentEmailLogs.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>All driver licenses are valid. No reminders needed!</p>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEmailLogsModal(false)} className="btn btn-secondary">Close Outbox</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
