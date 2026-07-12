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
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Safety');
  const [docFile, setDocFile] = useState(null);
  const [docBase64, setDocBase64] = useState('');
  const [docFileName, setDocFileName] = useState('');

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
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocBase64(reader.result);
        setDocFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!docName) return;

    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: docName.trim(),
          type: docType,
          size: docFile ? `${Math.round(docFile.size / 1024)} KB` : '45 KB',
          fileData: docBase64,
          fileName: docFileName
        })
      });

      if (res.ok) {
        logAudit(`Uploaded file "${docFile ? docFile.name : 'doc'}" for vehicle ${selectedVehicle.regNo}.`);
        showToast('Document uploaded successfully.', 'success');
        setDocName('');
        setDocFile(null);
        setDocBase64('');
        setDocFileName('');
        
        const fileInput = document.getElementById('doc-file-input');
        if (fileInput) fileInput.value = '';
        fetchVehicles();
      } else {
        showToast('Failed to save document details.', 'error');
      }
    } catch (error) {
      showToast('Database connection error.', 'error');
    }
  };

  const handleRemoveDoc = async (docId) => {
    if (confirm('Delete compliance file?')) {
      try {
        const res = await fetch(`/api/vehicles/${selectedVehicle.id}/documents/${docId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          logAudit(`Document removed.`);
          showToast('Document removed.', 'warning');
          fetchVehicles();
        } else {
          showToast('Failed to delete document.', 'error');
        }
      } catch (e) {
        showToast('Connection error.', 'error');
      }
    }
  };

  const handleViewDoc = (doc) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
      logAudit(`Opened document preview for "${doc.name}" - ${selectedVehicle.regNo}.`);
      showToast('Opening uploaded document file...', 'success');
      return;
    }

    const win = window.open("", "_blank");
    if (!win) {
      showToast('Pop-up blocked! Please allow pop-ups in browser settings.', 'error');
      return;
    }
    const verificationCode = `TRANSIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    win.document.write(`
      <html>
        <head>
          <title>${doc.name} - TransitOps Compliance</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              background-color: #0f172a;
              color: #f8fafc;
              margin: 0;
              padding: 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
            }
            .certificate-container {
              border: 2px dashed #3b82f6;
              border-radius: 12px;
              padding: 3rem;
              background-color: #1e293b;
              text-align: center;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
            }
            h1 {
              color: #3b82f6;
              margin: 0 0 0.5rem 0;
              font-size: 1.8rem;
              font-weight: 700;
            }
            .subtitle {
              font-size: 1rem;
              color: #94a3b8;
              margin-bottom: 2rem;
              letter-spacing: 0.05em;
            }
            .ledger-table {
              width: 100%;
              border-collapse: collapse;
              margin: 2rem 0;
              text-align: left;
            }
            .ledger-table td {
              padding: 0.5rem 0;
              border-bottom: 1px solid #334155;
              font-size: 0.95rem;
            }
            .ledger-table td.label {
              color: #94a3b8;
              font-weight: 500;
              width: 40%;
            }
            .ledger-table td.value {
              color: #f8fafc;
              font-weight: 600;
            }
            .btn-print {
              background-color: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.9rem;
              transition: background-color 0.2s;
            }
            .btn-print:hover {
              background-color: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <h1>Compliance Registry</h1>
            <div class="subtitle">VERIFIED DIGITAL DOCUMENT</div>
            
            <table class="ledger-table">
              <tr>
                <td class="label">Vehicle Plate</td>
                <td class="value">${selectedVehicle.regNo}</td>
              </tr>
              <tr>
                <td class="label">Model Name</td>
                <td class="value">${selectedVehicle.name}</td>
              </tr>
              <tr>
                <td class="label">Document Name</td>
                <td class="value">${doc.name}</td>
              </tr>
              <tr>
                <td class="label">Category</td>
                <td class="value">${doc.type}</td>
              </tr>
              <tr>
                <td class="label">File Size</td>
                <td class="value">${doc.size || '45 KB'}</td>
              </tr>
              <tr>
                <td class="label">Status</td>
                <td class="value" style="color: #10b981;">ACTIVE / VERIFIED</td>
              </tr>
              <tr>
                <td class="label">Security Hash</td>
                <td class="value" style="font-family: monospace; font-size: 0.8rem; color: #f59e0b;">${verificationCode}</td>
              </tr>
            </table>

            <button class="btn-print" onclick="window.print()">Print / Download PDF</button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    logAudit(`Opened document preview for "${doc.name}" - ${selectedVehicle.regNo}.`);
    showToast('Compliance certificate opened in a new tab.', 'success');
  };

  const isEditable = role === 'Fleet Manager';

  const activeVehicle = selectedVehicle ? (vehicles.find(item => item.id === selectedVehicle.id) || selectedVehicle) : null;
  const docsList = activeVehicle ? (activeVehicle.documents || []) : [];

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
                const docCount = (v.documents || []).length;
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
                {docsList.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.5rem', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <i className="fa-solid fa-file-pdf" style={{ color: 'var(--danger-color)', fontSize: '1.1rem' }}></i>
                      <div>
                        <div style={{ fontWeight: 500 }}>{doc.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({doc.size || '45 KB'})</span></div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.type}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleViewDoc(doc)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '1rem' }}
                        title="View / Download PDF"
                      >
                        <i className="fa-solid fa-file-arrow-down"></i>
                      </button>
                      {isEditable && (
                        <button onClick={() => handleRemoveDoc(doc.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}><i className="fa-solid fa-trash-can"></i></button>
                      )}
                    </div>
                  </div>
                ))}
                {docsList.length === 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No compliance papers uploaded.</span>
                )}
              </div>

              {isEditable ? (
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
              ) : (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.4' }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '0.35rem' }}></i> Adding or deleting compliance documents requires **Fleet Manager** permissions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
