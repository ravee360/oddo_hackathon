import React, { useState } from 'react';

export default function Login({ onLoginSuccess, failedAttempts, setFailedAttempts }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      setErrorMessage('Login locked out. Too many failed attempts.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      if (res.ok) {
        const data = await res.json();
        setFailedAttempts(0);
        setErrorMessage('');
        onLoginSuccess(data);
      } else {
        const data = await res.json();
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setErrorMessage(data.error || `Invalid credentials. Attempt ${nextAttempts} of 5.`);
      }
    } catch (err) {
      setErrorMessage('Authentication server offline.');
    }
  };

  const isLocked = failedAttempts >= 5;

  return (
    <div id="login-screen" className="login-overlay">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-logo-section">
          <div className="login-logo">
            <i className="fa-solid fa-truck-fast"></i>
            <h2>TransitOps</h2>
          </div>
          <p style={{ fontWeight: 500, fontSize: '1rem', color: '#475569', marginTop: '-1.5rem' }}>
            Smart Transport Operations Platform
          </p>
        </div>

        <div className="login-left-content">
          <h3>One login, four roles:</h3>
          <ul>
            <li>Fleet Manager</li>
            <li>Dispatcher</li>
            <li>Safety Officer</li>
            <li>Financial Analyst</li>
          </ul>
        </div>

        <div className="login-footer">
          TransitOps &copy; 2026 • RBAC Enabled
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        {/* Error State Card */}
        <div id="login-error-card" className={`login-error-container ${errorMessage ? 'active' : ''}`}>
          <div className="login-error-title">
            <i className="fa-solid fa-circle-xmark"></i>
            <span>{isLocked ? 'Account Locked' : 'Error State'}</span>
          </div>
          <p style={{ color: '#fca5a5', fontSize: '0.75rem', marginBottom: 0 }}>
            {errorMessage}
          </p>
        </div>

        <div className="login-card">
          <h2>Sign in to your account</h2>
          <p>Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                type="email"
                id="login-email"
                className="form-control"
                placeholder="e.g. Raven.k@transitops.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                type="password"
                id="login-password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocked}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-role">Role (RBAC)</label>
              <div className="select-wrapper">
                <select
                  id="login-role"
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isLocked}
                  required
                >
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" id="login-remember" defaultChecked /> Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', backgroundColor: 'var(--accent-color)' }}
              disabled={isLocked}
            >
              <i className="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Access Scope Guides:</strong>
            • Fleet Manager &rarr; Fleet Registry, Maintenance Logs<br />
            • Dispatcher &rarr; Dashboard panels, Trip Dispatcher<br />
            • Safety Officer &rarr; Driver Profiles, Compliance Warnings<br />
            • Financial Analyst &rarr; Fuel & Expenses, ROI Analytics
          </div>
        </div>
      </div>
    </div>
  );
}
