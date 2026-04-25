import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AlertsPage from './pages/AlertsPage';
import PacketsPage from './pages/PacketsPage';
import Navbar from './components/Navbar';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('dashboard');

  // Restore session
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) setUser(JSON.parse(stored));
  }, []);

  const handleLogin = (data) => {
    setUser({ username: data.username, role: data.role });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ background: '#0a0e1a', minHeight: '100vh' }}>
      <Navbar user={user} activePage={page} setPage={setPage} onLogout={handleLogout} />
      {page === 'dashboard' && <DashboardPage />}
      {page === 'alerts'    && <AlertsPage />}
      {page === 'packets'   && <PacketsPage />}
    </div>
  );
}
