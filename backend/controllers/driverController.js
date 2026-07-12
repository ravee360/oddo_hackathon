const db = require('../models/jsonDb');

exports.getDrivers = (req, res) => {
  const { search } = req.query;
  let list = db.getAll('drivers');

  if (search) {
    const s = search.toLowerCase();
    list = list.filter(d => d.name.toLowerCase().includes(s) || d.licenseNo.toLowerCase().includes(s));
  }

  res.status(200).json(list);
};

exports.addDriver = (req, res) => {
  const { name, licenseNo, licenseCategory, licenseExpiry, safetyScore, contact, status } = req.body;

  if (!name || !licenseNo || !licenseCategory || !licenseExpiry || safetyScore === undefined || !contact || !status) {
    return res.status(400).json({ error: 'Missing required driver profile fields.' });
  }

  const record = db.add('drivers', {
    name: name.trim(),
    licenseNo: licenseNo.trim(),
    licenseCategory: licenseCategory.trim(),
    licenseExpiry,
    safetyScore: Number(safetyScore),
    contact: contact.trim(),
    status
  });

  res.status(201).json(record);
};

exports.updateDriver = (req, res) => {
  const { id } = req.params;
  const { name, licenseNo, licenseCategory, licenseExpiry, safetyScore, contact, status } = req.body;

  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  const updated = db.update('drivers', id, {
    name: name.trim(),
    licenseNo: licenseNo.trim(),
    licenseCategory: licenseCategory.trim(),
    licenseExpiry,
    safetyScore: Number(safetyScore),
    contact: contact.trim(),
    status
  });

  res.status(200).json(updated);
};

exports.overrideStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  const updated = db.update('drivers', id, { status });
  res.status(200).json(updated);
};

exports.deleteDriver = (req, res) => {
  const { id } = req.params;
  const existing = db.getById('drivers', id);
  if (!existing) {
    return res.status(404).json({ error: 'Driver profile not found.' });
  }

  db.delete('drivers', id);
  res.status(200).json({ success: true, message: `Driver profile for ${existing.name} deleted.` });
};
