const db = require('../models/jsonDb');

exports.getExpenses = (req, res) => {
  const fuelLogs = db.getAll('fuelLogs');
  const expenses = db.getAll('expenses');
  res.status(200).json({ fuelLogs, expenses });
};

exports.addFuelLog = (req, res) => {
  const { vehicleId, liters, cost, date } = req.body;

  if (!vehicleId || !liters || !cost || !date) {
    return res.status(400).json({ error: 'Missing required fuel log parameters.' });
  }

  const record = db.add('fuelLogs', {
    vehicleId,
    liters: Number(liters),
    cost: Number(cost),
    date
  });

  res.status(201).json(record);
};

exports.addOtherExpense = (req, res) => {
  const { vehicleId, tripId, toll, cost, date } = req.body;

  if (!vehicleId || date === undefined) {
    return res.status(400).json({ error: 'Vehicle ID and Date are required.' });
  }

  const record = db.add('expenses', {
    vehicleId,
    tripId: tripId || '',
    toll: Number(toll) || 0,
    cost: Number(cost) || 0,
    date
  });

  res.status(201).json(record);
};
