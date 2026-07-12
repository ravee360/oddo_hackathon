// Auth Controller - Handles Session Sign Ins
const VALID_ACCOUNTS = [
  { email: 'Raven.k@transitops.in', name: 'Raven K.', role: 'Dispatcher', password: 'password123' },
  { email: 'manager@transitops.in', name: 'Alex Manager', role: 'Fleet Manager', password: 'password123' },
  { email: 'safety@transitops.in', name: 'Safety Officer', role: 'Safety Officer', password: 'password123' },
  { email: 'finance@transitops.in', name: 'Financial Analyst', role: 'Financial Analyst', password: 'password123' }
];

exports.login = (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing credentials.' });
  }

  const matched = VALID_ACCOUNTS.find(acc => 
    acc.email.toLowerCase() === email.toLowerCase() && 
    acc.password === password && 
    acc.role === role
  );

  if (matched) {
    return res.status(200).json({
      name: matched.name,
      email: matched.email,
      role: matched.role
    });
  } else {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
};

exports.resetDatabase = (req, res) => {
  const db = require('../models/jsonDb');
  db.reset();
  res.status(200).json({ success: true, message: 'Database reset successfully.' });
};
