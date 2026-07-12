import React, { useState, useEffect } from 'react';

export default function Fleet({ role, currencySymbol, distanceUnit, logAudit, showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Form states
  const [vId, setVId] = useState('');
  const [vReg, setVReg] = useState('');
  const [vName, setVName] = useState('');
  const [vType, setVType] = useState('Van');
  const [vCapacity, setVCapacity] = useState('');
  const [vOdo, setVOdo] = useState('');
  const [vCost, setVCost] = useState('');
  const [vStatus, setVStatus] = useState('Available');

  // Documents state
  const [vehicleDocs, setVehicleDocs] = useState({
    v1: [
      { id: 'doc1', name: 'Compliance Certificate 2026', type: 'Safety' },
      { id: 'doc2', name: 'Comprehensive Insurance Policy', type: 'Insurance' }
    ],
    v2: [
      { id: 'doc3', name: 'Heavy Vehicle Permit', type: 'Registration' }
    ]
  });
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Safety');
  const [docFile, setDocFile] = useState(null);

  useEffect(() => {
    fetchVehicles();
  }, [searchVal, filterType, filterStatus]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch(`/api/vehicles?type=${filterType}&status=${filterStatus}&search=${searchVal}`);
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setVId('');
    setVReg('');
    setVName('');
    setVType('Van');
    setVCapacity('');
    setVOdo('');
    setVCost('');
    setVStatus('Available');
    setShowVehicleModal(true);
  };

  const handleOpenEdit = (v) => {
    setVId(v.id);
    setVReg(v.regNo);
    setVName(v.name);
    setVType(v.type);
    setVCapacity(v.maxCapacity);
    setVOdo(v.odometer);
    setVCost(v.acquisitionCost);
    setVStatus(v.status);
    setShowVehicleModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const record = {
      regNo: vReg,
      name: vName.trim(),
      type: vType,
      maxCapacity: Number(vCapacity),
      odometer: Number(vOdo),
      acquisitionCost: Number(vCost),
      status: vStatus
    };

    try {
      let res;
      if (vId) {
        res = await fetch(`/api/vehicles/${vId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
      } else {
        res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record)
        });
      }

      if (res.ok) {
        logAudit(`Vehicle ${vReg} specs saved.`);
        showToast('Asset specifications saved.', 'success');
        setShowVehicleModal(false);
        fetchVehicles();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to save vehicle details.', 'error');
      }
    } catch (error) {
      showToast('Database connection error.', 'error');
    }
  };

  const handleDelete = async (id, regNo) => {
    if (confirm(`Remove vehicle asset ${regNo} from registry?`)) {
      try {
        const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        if (res.ok) {
          logAudit(`Deleted vehicle asset ${regNo}.`);
          showToast('Asset deleted.', 'warning');
          fetchVehicles();
        }
      } catch (e) {
        showToast('Database connection error.', 'error');
      }
    }
  };

  // Documents Management
  const handleOpenDocs = (v) => {
    setSelectedVehicle(v);
    setDocName('');
    setDocFile(null);
    setShowDocsModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocFile(file);
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleAddDoc = (e) => {
    e.preventDefault();
    if (!docName) return;

    const vId = selectedVehicle.id;
    const newDoc = {
      id: `doc_${Math.random().toString(36).substr(2, 5)}`,
      name: docName.trim(),
      type: docType,
      size: docFile ? `${Math.round(docFile.size / 1024)} KB` : '45 KB'
    };

    setVehicleDocs(prev => ({
      ...prev,
      [vId]: [...(prev[vId] || []), newDoc]
    }));

    logAudit(`Uploaded file "${docFile ? docFile.name : 'doc'}" for vehicle ${selectedVehicle.regNo}.`);
    showToast('Document uploaded successfully.', 'success');
    setDocName('');
    setDocFile(null);
    
    const fileInput = document.getElementById('doc-file-input');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveDoc = (docId) => {
    if (confirm('Delete compliance file?')) {
      const vId = selectedVehicle.id;
      setVehicleDocs(prev => ({
        ...prev,
        [vId]: (prev[vId] || []).filter(doc => doc.id !== docId)
      }));
      logAudit(`Document removed.`);
      showToast('Document removed.', 'warning');
    }
  };

  const isEditable = role === 'Fleet Manager';

  return (
    <div id="vehicles-sec" className="page-section active">
      <div className="glass-panel">
        <div className="section-header">
          <div className="section-title">
            <i className="fa-solid fa-bus"></i>
            <span>Vehicle Registry</span>
          </div>
          <div className="section-actions">
            <div className="select-wrapper">
              <select
                id="vehicle-filter-type"
                className="role-select"
                style={{ minWidth: '130px' }}
                title="Filter by vehicle type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Type: All</option>
                <option value="Van">Van</option>
                <option value="Box Truck">Box Truck</option>
                <option value="Heavy Truck">Heavy Truck</option>
              </select>
            </div>
            <div className="select-wrapper">
              <select
                id="vehicle-filter-status"
                className="role-select"
                style={{ minWidth: '130px' }}
                title="Filter by vehicle status"
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
            <input
              type="text"
              id="vehicle-search"
              className="form-control"
              style={{ width: '200px', padding: '0.45rem 0.75rem' }}
              placeholder="Search reg. no..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {isEditable && (
              <button onClick={handleOpenAdd} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>
                <i className="fa-solid fa-plus"></i> Add Vehicle
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Reg. No. (Unique)</th>
                <th>Name/Model</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Odometer</th>
                <th>Acq. Cost</th>
                <th>Status</th>
                <th>Documents</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="vehicle-table-body">
              {vehicles.map(v => {
                const docCount = (vehicleDocs[v.id] || []).length;
                return (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.regNo}</td>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td>{v.type}</td>
                    <td>{v.maxCapacity} kg</td>
                    <td>{v.odometer.toLocaleString()} {distanceUnit}</td>
                    <td>{currencySymbol}{v.acquisitionCost.toLocaleString()}</td>
                    <td><span className={`badge badge-${v.status.toLowerCase().replace(' ', '')}`}>{v.status}</span></td>
                    <td>
                      <button onClick={() => handleOpenDocs(v)} className="btn btn-secondary btn-icon-only" title="Compliance Documents">
                        <i className="fa-solid fa-folder-open"></i>
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '2px' }}>({docCount})</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="btn btn-secondary btn-icon-only"
                        disabled={!isEditable}
                        title="Edit Specifications"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.regNo)}
                        className="btn btn-danger btn-icon-only"
                        disabled={!isEditable}
                        title="Remove Vehicle"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fleet assets match active search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <span className="notice-label">Rule: Registration No. must be unique • Retired/In Shop vehicles are hidden from Trip Dispatcher</span>
      </div>

      {/* Add/Edit Vehicle Modal */}
      {showVehicleModal && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container">
            <div className="modal-header">
              <span className="modal-title">{vId ? 'Edit Fleet Specifications' : 'Register Fleet Asset'}</span>
              <button onClick={() => setShowVehicleModal(false)} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} id="vehicle-form">
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="vehicle-reg">Registration No. (Plate)</label>
                  <input
                    type="text"
                    id="vehicle-reg"
                    className="form-control"
                    placeholder="e.g. VAN-05"
                    value={vReg}
                    onChange={(e) => setVReg(e.target.value)}
                    disabled={!!vId}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-name">Model Name</label>
                  <input
                    type="text"
                    id="vehicle-name"
                    className="form-control"
                    placeholder="e.g. Ford Transit"
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-type">Type</label>
                  <div className="select-wrapper">
                    <select
                      id="vehicle-type"
                      className="form-control"
                      value={vType}
                      onChange={(e) => setVType(e.target.value)}
                      required
                    >
                      <option value="Van">Van</option>
                      <option value="Box Truck">Box Truck</option>
                      <option value="Heavy Truck">Heavy Truck</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-capacity">Max Cargo Capacity (kg)</label>
                  <input
                    type="number"
                    id="vehicle-capacity"
                    className="form-control"
                    placeholder="e.g. 1500"
                    value={vCapacity}
                    onChange={(e) => setVCapacity(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-odometer">Current Odometer ({distanceUnit})</label>
                  <input
                    type="number"
                    id="vehicle-odometer"
                    className="form-control"
                    placeholder="e.g. 45000"
                    value={vOdo}
                    onChange={(e) => setVOdo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-cost">Acquisition Cost ($)</label>
                  <input
                    type="number"
                    id="vehicle-cost"
                    className="form-control"
                    placeholder="e.g. 35000"
                    value={vCost}
                    onChange={(e) => setVCost(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="vehicle-status">Initial Status</label>
                  <div className="select-wrapper">
                    <select
                      id="vehicle-status"
                      className="form-control"
                      value={vStatus}
                      onChange={(e) => setVStatus(e.target.value)}
                      required
                    >
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="In Shop">In Shop</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--accent-color)' }}>Save specifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {showDocsModal && selectedVehicle && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-container" style={{ width: '450px' }}>
            <div className="modal-header">
              <span className="modal-title">Compliance: {selectedVehicle.regNo}</span>
              <button onClick={() => setShowDocsModal(false)} className="modal-close">&times;</button>
            </div>
            <div className="modal-body">
              <div id="compliance-docs-list" style={{ marginBottom: '1.5rem' }}>
                {(vehicleDocs[selectedVehicle.id] || []).map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-file-pdf" style={{ color: 'var(--danger-color)', fontSize: '1.1rem' }}></i>
                      <div>
                        <div style={{ fontWeight: 500 }}>{doc.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({doc.size || '45 KB'})</span></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.type}</div>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveDoc(doc.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><i className="fa-solid fa-trash-can"></i></button>
                  </div>
                ))}
                {(vehicleDocs[selectedVehicle.id] || []).length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No compliance papers uploaded.</span>
                )}
              </div>

              <form onSubmit={handleAddDoc} id="document-upload-form" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Upload Compliance Paper</h4>
                <div className="form-group">
                  <label>Choose File</label>
                  <input
                    type="file"
                    id="doc-file-input"
                    className="form-control"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Document Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Emission Permit 2026"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category Type</label>
                  <div className="select-wrapper">
                    <select
                      className="form-control"
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <option value="Safety">Safety</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Registration">Registration</option>
                      <option value="Tax">Tax Invoice</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', backgroundColor: 'var(--accent-color)', fontSize: '0.8rem', padding: '0.45rem' }}>Upload Document</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
