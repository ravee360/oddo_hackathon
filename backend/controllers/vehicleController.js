const db = require('../models/jsonDb');

exports.getVehicles = (req, res) => {
  const { type, status, search } = req.query;
  let list = db.getAll('vehicles');

  if (type) {
    list = list.filter(v => v.type === type);
  }
  if (status) {
    list = list.filter(v => v.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(v => v.regNo.toLowerCase().includes(s) || v.name.toLowerCase().includes(s));
  }

  res.status(200).json(list);
};

exports.addVehicle = (req, res) => {
  const { regNo, name, type, maxCapacity, odometer, acquisitionCost, status } = req.body;

  if (!regNo || !name || !type || !maxCapacity || odometer === undefined || acquisitionCost === undefined || !status) {
    return res.status(400).json({ error: 'Missing required vehicle registry fields.' });
  }

  const cleanReg = regNo.toUpperCase().trim();
  if (!db.isRegNoUnique(cleanReg)) {
    return res.status(409).json({ error: `Registration Number ${cleanReg} already exists.` });
  }

  const record = db.add('vehicles', {
    regNo: cleanReg,
    name: name.trim(),
    type,
    maxCapacity: Number(maxCapacity),
    odometer: Number(odometer),
    acquisitionCost: Number(acquisitionCost),
    status
  });

  res.status(201).json(record);
};

exports.updateVehicle = (req, res) => {
  const { id } = req.params;
  const { name, type, maxCapacity, odometer, acquisitionCost, status } = req.body;

  const existing = db.getById('vehicles', id);
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle asset not found.' });
  }

  const updated = db.update('vehicles', id, {
    name: name.trim(),
    type,
    maxCapacity: Number(maxCapacity),
    odometer: Number(odometer),
    acquisitionCost: Number(acquisitionCost),
    status
  });

  res.status(200).json(updated);
};

exports.deleteVehicle = (req, res) => {
  const { id } = req.params;
  const existing = db.getById('vehicles', id);
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle asset not found.' });
  }

  db.delete('vehicles', id);
  res.status(200).json({ success: true, message: `Asset ${existing.regNo} deleted.` });
};
