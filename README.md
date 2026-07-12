# TransitOps - Smart Transport Operations Platform

TransitOps is an end-to-end transport operations management platform that replaces paper sheets and spreadsheets. Built specifically to showcase robust business logic, elegant UI/UX design, and role-based permissions in a highly constrained hackathon timeframe.

Live Demo Deployment Ready: Can be staged in seconds on **GitHub Pages**.

---

## 🌟 Key Technical Features

1. **Aesthetic Dashboard UI**: Premium design using a custom Glassmorphic Dark & Light theme, custom fonts, responsive metric grids, and dynamic layout reflow.
2. **Interactive Visual Analytics**: Integrates Chart.js for real-time bar graphs tracking vehicle ROI % and donut charts displaying fleet status distribution.
3. **localStorage State Persistence**: Simulated relational database schema implemented fully on the client side. Data survives page refreshes. Includes a reset key to wipe adjustments.
4. **Role-Based Access Control (RBAC) Switcher**: Switch user perspectives (Fleet Manager, Operator/Driver, Safety Officer, Financial Analyst) from the navigation bar. UI layout adjustments block unauthorized form inputs and display unique role hints.
5. **Driver Compliance Expiry Banners**: Scans driver registries and displays alerts for expired licenses (blocks dispatch) or licenses expiring within 30 days.
6. **Simulated Document Registry**: Document upload widget supporting file tags (Safety Check, Registration, Insurance Certificate) per vehicle with dynamic counters.
7. **CSV & Print PDF Exporting**: Dynamic CSV compiler downloads active fleet ROI reports. Supports print-formatted stylesheet for high-quality PDF creation.

---

## 💼 Mandatory Business Rules Enforced

* **Unique Identifiers**: Registration number validation guarantees no duplicates are saved.
* **Dispatch Eligibility Verification**:
  * Blocks retired or in-shop vehicles from dispatch selections.
  * Blocks drivers with expired licenses or Suspended status from trips.
  * Blocks drivers or vehicles already marked "On Trip" from assignment.
* **Capacity Constraints**: Blocks dispatch if Cargo Weight exceeds the chosen vehicle's payload capacity limit.
* **Automatic Status Transitions**:
  * Dispatching a trip transitions both vehicle and driver status to **On Trip**.
  * Completing a trip restores both vehicle and driver status back to **Available** and updates the vehicle's odometer.
  * Cancelling a dispatched trip restores both to **Available**.
* **Maintenance Logic**:
  * Logging a vehicle into maintenance switches its status to **In Shop** (removing it from dispatch pools).
  * Closing a maintenance log restores status to **Available** (unless retired).

---

## 🚀 How to Run Locally

You do not need heavy web servers, databases, or npm dependency compiling. TransitOps is fully self-contained!

### Option A: Open Directly
Double-click [index.html](file:///d:/Odoo/index.html) in your browser. All scripts and stylesheets link relatively.

### Option B: Local HTTP Server (Recommended)
From your terminal, launch a simple web server:
```bash
# Using Python
python -m http.server 8000

# Using Node (npx)
npx http-server -p 8000
```
Then visit: `http://localhost:8000` in your web browser.

---

## 👥 Hackathon Team Playbook

Refer to [hackathon_guide.md](file:///d:/Odoo/hackathon_guide.md) for the exact work division and Git collaboration guidelines.
