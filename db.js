// TransitOps - Client-Side localStorage database management

const DB_KEY = 'transitops_db_state';

// Default Seed Data
const DEFAULT_DB = {
  vehicles: [
    { id: 'v1', regNo: 'VAN-05', name: 'Ford Transit Van', type: 'Van', maxCapacity: 500, odometer: 12500, acquisitionCost: 25000, status: 'Available' },
    { id: 'v2', regNo: 'TRK-01', name: 'Volvo FH16 Truck', type: 'Heavy Truck', maxCapacity: 5000, odometer: 84300, acquisitionCost: 75000, status: 'Available' },
    { id: 'v3', regNo: 'VAN-02', name: 'Mercedes Sprinter', type: 'Van', maxCapacity: 1200, odometer: 45000, acquisitionCost: 32000, status: 'On Trip' },
    { id: 'v4', regNo: 'BOX-04', name: 'Isuzu NPR Box Truck', type: 'Box Truck', maxCapacity: 3000, odometer: 62000, acquisitionCost: 45000, status: 'In Shop' },
    { id: 'v5', regNo: 'SE-09', name: 'Toyota HiAce', type: 'Van', maxCapacity: 800, odometer: 95000, acquisitionCost: 22000, status: 'Retired' }
  ],
  drivers: [
    { id: 'd1', name: 'Alex Rivera', licenseNo: 'DL-9847291', licenseCategory: 'Commercial (Class A)', licenseExpiry: '2028-05-14', contact: '+1 (555) 234-5678', safetyScore: 95, status: 'Available' },
    { id: 'd2', name: 'Sarah Jenkins', licenseNo: 'DL-3829102', licenseCategory: 'Standard (Class C)', licenseExpiry: '2027-11-20', contact: '+1 (555) 876-5432', safetyScore: 88, status: 'On Trip' },
    { id: 'd3', name: 'Michael Chen', licenseNo: 'DL-4920194', licenseCategory: 'Commercial (Class B)', licenseExpiry: '2026-02-15', contact: '+1 (555) 345-6789', safetyScore: 92, status: 'Available' },
    { id: 'd4', name: 'Marcus Brody', licenseNo: 'DL-1029384', licenseCategory: 'Commercial (Class A)', licenseExpiry: '2024-01-10', contact: '+1 (555) 901-2345', safetyScore: 78, status: 'Off Duty' }, // Expired
    { id: 'd5', name: 'Dave Miller', licenseNo: 'DL-5839201', licenseCategory: 'Standard (Class C)', licenseExpiry: '2027-08-30', contact: '+1 (555) 456-7890', safetyScore: 48, status: 'Suspended' }
  ],
  trips: [
    { id: 't1', source: 'Warehouse A (Chicago)', destination: 'Distribution Center (Detroit)', vehicleId: 'v3', driverId: 'd2', cargoWeight: 950, distance: 280, status: 'Dispatched', startOdo: 44720, endOdo: null, fuelUsed: null, revenue: 1500, date: '2026-07-12' },
    { id: 't2', source: 'Port of Seattle', destination: 'Warehouse B (Seattle)', vehicleId: 'v1', driverId: 'd1', cargoWeight: 400, distance: 45, status: 'Completed', startOdo: 12455, endOdo: 12500, fuelUsed: 12, revenue: 350, date: '2026-07-10' },
    { id: 't3', source: 'Factory C (Gary)', destination: 'Retail Outlet (Indianapolis)', vehicleId: 'v2', driverId: 'd3', cargoWeight: 4500, distance: 150, status: 'Completed', startOdo: 84150, endOdo: 84300, fuelUsed: 50, revenue: 2200, date: '2026-07-08' }
  ],
  maintenance: [
    { id: 'm1', vehicleId: 'v4', description: 'Engine Coolant Flush & Brake Pad Replacement', startDate: '2026-07-11', endDate: '', cost: 650, status: 'Active' },
    { id: 'm2', vehicleId: 'v1', description: 'Routine Oil Change & Tire Rotation', startDate: '2026-07-05', endDate: '2026-07-05', cost: 120, status: 'Completed' }
  ],
  fuelLogs: [
    { id: 'f1', vehicleId: 'v1', liters: 45, cost: 90, date: '2026-07-10' },
    { id: 'f2', vehicleId: 'v2', liters: 150, cost: 310, date: '2026-07-08' },
    { id: 'f3', vehicleId: 'v3', liters: 60, cost: 120, date: '2026-07-11' }
  ],
  expenses: [
    { id: 'e1', vehicleId: 'v3', type: 'Toll', cost: 35, date: '2026-07-12' },
    { id: 'e2', vehicleId: 'v2', type: 'Permit', cost: 120, date: '2026-07-07' }
  ]
};

// Database class
class TransitOpsDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      this.save(DEFAULT_DB);
    }
  }

  // Load the full database
  load() {
    try {
      const data = localStorage.getItem(DB_KEY);
      return JSON.parse(data) || DEFAULT_DB;
    } catch (e) {
      console.error('Error loading database, resetting to default:', e);
      return DEFAULT_DB;
    }
  }

  // Save the full database
  save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  // Generic getter
  getAll(entity) {
    const db = this.load();
    return db[entity] || [];
  }

  // Generic details getter
  getById(entity, id) {
    const list = this.getAll(entity);
    return list.find(item => item.id === id);
  }

  // Add item
  add(entity, record) {
    const db = this.load();
    if (!db[entity]) db[entity] = [];
    
    // Generate id
    record.id = entity.charAt(0) + Math.random().toString(36).substr(2, 9);
    db[entity].push(record);
    this.save(db);
    return record;
  }

  // Update item
  update(entity, id, updatedRecord) {
    const db = this.load();
    const index = db[entity].findIndex(item => item.id === id);
    if (index !== -1) {
      db[entity][index] = { ...db[entity][index], ...updatedRecord };
      this.save(db);
      return true;
    }
    return false;
  }

  // Delete item
  delete(entity, id) {
    const db = this.load();
    const initialLength = db[entity].length;
    db[entity] = db[entity].filter(item => item.id !== id);
    if (db[entity].length !== initialLength) {
      this.save(db);
      return true;
    }
    return false;
  }

  // Check unique constraints (e.g. regNo)
  isRegNoUnique(regNo, excludeId = null) {
    const vehicles = this.getAll('vehicles');
    return !vehicles.some(v => v.regNo.toUpperCase() === regNo.toUpperCase() && v.id !== excludeId);
  }

  // Reset database to defaults
  reset() {
    this.save(DEFAULT_DB);
  }
}

// Instantiate database globally
const db = new TransitOpsDB();
window.dbInstance = db; // Export to window for debugging
