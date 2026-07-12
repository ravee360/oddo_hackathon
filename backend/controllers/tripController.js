const db = require('../models/jsonDb');

const CURRENT_DATE = '2026-07-12';

exports.getTrips = (req, res) => {
  const { status, search } = req.query;
  let list = db.getAll('trips');

  if (status) {
    list = list.filter(t => t.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    const vehicles = db.getAll('vehicles');
    const drivers = db.getAll('drivers');

    list = list.filter(t => {
      const v = vehicles.find(item => item.id === t.vehicleId) || { regNo: '' };
      const d = drivers.find(item => item.id === t.driverId) || { name: '' };
      return t.source.toLowerCase().includes(s) ||
             t.destination.toLowerCase().includes(s) ||
             v.regNo.toLowerCase().includes(s) ||
             d.name.toLowerCase().includes(s);
    });
  }

  res.status(200).json(list);
};

exports.addTrip = (req, res) => {
  const { source, destination, vehicleId, driverId, cargoWeight, distance, revenue } = req.body;

  if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !distance || !revenue) {
    return res.status(400).json({ error: 'Missing required trip parameters.' });
  }

  const v = db.getById('vehicles', vehicleId);
  if (!v) {
    return res.status(404).json({ error: 'Selected vehicle not found.' });
  }

  if (Number(cargoWeight) > v.maxCapacity) {
    return res.status(400).json({ error: `Cargo weight exceeds vehicle capacity limit of ${v.maxCapacity} kg.` });
  }

  const trips = db.getAll('trips');
  const nextNum = trips.length + 1;
  const tripId = `tr00${nextNum}`;

  const record = db.add('trips', {
    id: tripId,
    source: source.trim(),
    destination: destination.trim(),
    vehicleId,
    driverId,
    cargoWeight: Number(cargoWeight),
    distance: Number(distance),
    startOdo: v.odometer,
    endOdo: null,
    fuelUsed: null,
    revenue: Number(revenue),
    status: 'Draft',
    date: CURRENT_DATE
  });

  res.status(201).json(record);
};

exports.dispatchTrip = (req, res) => {
  const { id } = req.params;
  const t = db.getById('trips', id);
  if (!t) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  const v = db.getById('vehicles', t.vehicleId);
  const d = db.getById('drivers', t.driverId);

  if (v.status !== 'Available') {
    return res.status(400).json({ error: `Vehicle is currently ${v.status} and unavailable.` });
  }

  const today = new Date(CURRENT_DATE);
  const expDate = new Date(d.licenseExpiry);
  if (d.status === 'Suspended' || expDate <= today) {
    return res.status(400).json({ error: 'Driver cannot be dispatched due to expired license or suspension.' });
  }
  if (d.status === 'On Trip') {
    return res.status(400).json({ error: 'Driver is already assigned on another active trip.' });
  }

  // Set trip dispatched
  db.update('trips', id, { status: 'Dispatched' });

  // Update asset states
  db.update('vehicles', t.vehicleId, { status: 'On Trip' });
  db.update('drivers', t.driverId, { status: 'On Trip' });

  res.status(200).json({ success: true, message: `Trip ${id} dispatched successfully.` });
};

exports.completeTrip = (req, res) => {
  const { id } = req.params;
  const { endOdo, fuelUsed } = req.body;

  if (endOdo === undefined || fuelUsed === undefined) {
    return res.status(400).json({ error: 'Final odometer and fuel used are required.' });
  }

  const t = db.getById('trips', id);
  if (!t) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  const finalOdo = Number(endOdo);
  if (finalOdo < t.startOdo) {
    return res.status(400).json({ error: `Final odometer cannot be less than start odometer of ${t.startOdo} km.` });
  }

  db.update('trips', id, {
    status: 'Completed',
    endOdo: finalOdo,
    fuelUsed: Number(fuelUsed)
  });

  // Restore states
  db.update('vehicles', t.vehicleId, { 
    status: 'Available',
    odometer: finalOdo
  });
  db.update('drivers', t.driverId, { 
    status: 'Available' 
  });

  // Auto record fuel refill cost
  const cost = Number(fuelUsed) * 2.10;
  db.add('fuelLogs', {
    vehicleId: t.vehicleId,
    liters: Number(fuelUsed),
    cost,
    date: CURRENT_DATE
  });

  res.status(200).json({ success: true, message: `Trip ${id} completed.` });
};

exports.cancelTrip = (req, res) => {
  const { id } = req.params;
  const t = db.getById('trips', id);
  if (!t) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  db.update('trips', id, { status: 'Cancelled' });

  // Restore asset states
  db.update('vehicles', t.vehicleId, { status: 'Available' });
  db.update('drivers', t.driverId, { status: 'Available' });

  res.status(200).json({ success: true, message: `Trip ${id} cancelled.` });
};

exports.deleteTrip = (req, res) => {
  const { id } = req.params;
  const t = db.getById('trips', id);
  if (!t) {
    return res.status(404).json({ error: 'Trip not found.' });
  }

  db.delete('trips', id);
  res.status(200).json({ success: true, message: `Draft trip ${id} deleted.` });
};
