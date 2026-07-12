const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Serving the static frontend assets
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
}

// API Routes imports
const authRoutes = require('./routes/authRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const maintRoutes = require('./routes/maintRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

// Binds API router links
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintRoutes);
app.use('/api/expenses', expenseRoutes);

// Fallback to index.html for frontend routing
app.get('*', (req, res) => {
  const distIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`TransitOps server successfully running at http://localhost:${PORT}`);
});
