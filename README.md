# TransitOps - Smart Transport Operations Platform

TransitOps is a professional, end-to-end transport operations management platform. It replaces manual paper tracking and spreadsheets with a modern, modular architecture featuring a **React + Vite** frontend and a **Node.js + Express** REST API backend.

## 🌐 Live Demo

The application is deployed and available at:

- https://oddohackathon-production.up.railway.app/

---

## 📁 Project Directory Structure

```text
/oddo_hackathon
  ├── backend/               # Node.js + Express backend server
  │    ├── controllers/      # Route controllers (CRUD logic, capacity weight checks)
  │    ├── routes/           # REST endpoints mapping
  │    ├── models/           # database client (jsonDb.js) mapping db.json
  │    ├── db.json           # JSON database file
  │    ├── uploads/          # Physical uploaded binary files on server disk
  │    ├── package.json      # Backend dependencies (Express, CORS)
  │    └── server.js         # Backend server gateway
  ├── frontend/              # React + Vite frontend client
  │    ├── public/
  │    ├── src/
  │    │    ├── assets/
  │    │    │    └── index.css  # Unified premium dark/light theme CSS stylesheet
  │    │    ├── components/     # Modular React components
  │    │    │    ├── Login.jsx       # Login controls & lockout countdown
  │    │    │    ├── Sidebar.jsx     # Navigation visibility based on RBAC matrix
  │    │    │    ├── Dashboard.jsx   # State progress trackers & dispatches table
  │    │    │    ├── Fleet.jsx       # Fleet registry CRUD & file upload specifications
  │    │    │    ├── Drivers.jsx     # Drivers profiles, license alerts & email scan outbox
  │    │    │    ├── Trips.jsx       # Dispatch workflows & overload block alerts
  │    │    │    ├── Maintenance.jsx # Maintenance logs & repair logs form
  │    │    │    ├── Expenses.jsx    # Refill fuel logs & miscellaneous double tables
  │    │    │    ├── Analytics.jsx   # Chart.js visual graphics canvas elements
  │    │    │    └── Settings.jsx    # Configurations save forms & RBAC matrix
  │    │    ├── App.jsx         # App routing and global state hook
  │    │    └── main.jsx        # App entry point
  │    ├── index.html        # Main template including Font Awesome and Chart.js CDNs
  │    ├── package.json      # React dependencies
  │    └── vite.config.js    # API proxy configs (redirects /api to port 8000)
```

---

## 🌟 Key Technical Features

1. **Modular Architecture**: Split into a clean MVC backend server and component-based React frontend.
2. **Interactive Visual Analytics**: Chart.js horizontal bar charts for vehicle ROI and monthly revenue columns.
3. **Role-Based Access Control (RBAC)**: Supports 4 distinct user profiles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) restricting access to forms, buttons, and side tabs.
4. **Persistent Compliance Uploads**: Supports choosing real document files (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.doc`, `.docx`). Files are uploaded as Base64 binaries, stored physically in the backend `uploads/` folder, and linked in `db.json` for persistence across page refreshes.
5. **Real-time License Reminders Scan**: safety scanner scans all driver licenses, identifies expired/expiring licenses, drafts professional alerts, and logs them in a simulated mail outbox.
6. **Real-time Capacity Checks**: Blocks dispatch creation if the cargo weight exceeds the selected vehicle's payload capacity.
7. **Client-side CSV Exporter**: Generates and downloads a real, formatted `.csv` spreadsheet of the fleet's ledger records directly from the Analytics tab.

---

## 🚀 How to Run Locally

### Option A: Single Port Mode (Express Server serves Compiled React UI)
The Express backend server dynamically checks if the compiled React bundle exists and serves it statically on port `8000`.

1. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```
2. **Start the backend server**:
   ```bash
   node server.js
   ```
3. **Open the browser**:
   Go to: **[http://localhost:8000](http://localhost:8000)** to view the complete React + Node.js application.

---

### Option B: Active Development Mode (Dual Ports with Hot Reload)
This configuration enables instant hot module replacement (HMR) for frontend files during development.

1. **Start the Express API server** (Port 8000):
   ```bash
   cd backend
   node server.js
   ```
2. **Start the Vite dev server** (Port 5173):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Open the browser**:
   Go to: **`http://localhost:5173`**. Vite will proxy all API calls (e.g. `/api/vehicles` and `/uploads/*`) to port `8000` automatically.

---

## 🔑 Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Dispatcher** | `Raven.k@transitops.in` | `password123` |
| **Fleet Manager** | `manager@transitops.in` | `password123` |
| **Safety Officer** | `safety@transitops.in` | `password123` |
| **Financial Analyst** | `finance@transitops.in` | `password123` |
