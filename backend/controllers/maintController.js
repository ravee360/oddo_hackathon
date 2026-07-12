const db = require('../models/jsonDb');

const CURRENT_DATE = '2026-07-12';

exports.getMaintenance = (req, res) => {
  const list = db.getAll('maintenance');
  res.status(200).json(list);
};

exports.addMaintenance = (req, res) => {
  const { vehicleId, description, startDate, cost, status } = req.body;

  if (!vehicleId || !description || !startDate || cost === undefined || !status) {
    return res.status(400).json({ error: 'Missing required maintenance record fields.' });
  }

  const v = db.getById('vehicles', vehicleId);
  if (!v) {
    return res.status(404).json({ error: 'Vehicle asset not found.' });
  }

  const record = db.add('maintenance', {
    vehicleId,
    description: description.trim(),
    startDate,
    endDate: status === 'Completed' ? CURRENT_DATE : '',
    cost: Number(cost),
    status
  });

  // Switch vehicle state accordingly
  if (status === 'Active') {
    db.update('vehicles', vehicleId, { status: 'In Shop' });
  } else {
    db.update('vehicles', vehicleId, { status: 'Available' });
  }

  res.status(201).json(record);
};

exports.closeMaintenance = (req, res) => {
  const { id } = req.params;
  const log = db.getById('maintenance', id);
  if (!log) {
    return res.status(404).json({ error: 'Maintenance log not found.' });
  }

  const v = db.getById('vehicles', log.vehicleId);
  const nextStatus = (v && v.status === 'Retired') ? 'Retired' : 'Available';

  db.update('maintenance', id, {
    status: 'Completed',
    endDate: CURRENT_DATE
  });

  db.update('vehicles', log.vehicleId, { status: nextStatus });

  res.status(200).json({ success: true, message: `Maintenance for vehicle ${v ? v.regNo : ''} completed.` });
};
