import React, { useState } from 'react';
import { login } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      localStorage.setItem('token', res.data.access_token);
      localStorage.setItem('user', JSON.stringify({ username: res.data.username, role: res.data.role }));
      onLogin(res.data);
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.shield}>🛡️</span>
          <h1 style={styles.title}>Open<span style={styles.accent}>SIEM</span></h1>
          <p style={styles.sub}>Network Security Monitor</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button style={loading ? { ...styles.btn, opacity: 0.6 } : styles.btn} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login →'}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={styles.hintText}>Default credentials:</p>
          <code style={styles.code}>admin / admin123</code>
          <span style={styles.sep}>  |  </span>
          <code style={styles.code}>analyst / analyst123</code>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0a0e1a', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#111827', border: '1px solid #1f2937', borderRadius: 16,
    padding: '48px 40px', width: 380, boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  },
  logo: { textAlign: 'center', marginBottom: 36 },
  shield: { fontSize: 40 },
  title: { margin: '8px 0 4px', fontSize: 28, fontWeight: 700, color: '#f9fafb', letterSpacing: -0.5 },
  accent: { color: '#06b6d4' },
  sub: { margin: 0, color: '#6b7280', fontSize: 13 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, color: '#9ca3af', fontWeight: 500, letterSpacing: 0.3 },
  input: {
    background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
    padding: '10px 14px', color: '#f9fafb', fontSize: 14, outline: 'none',
  },
  error: { color: '#f87171', fontSize: 13, margin: 0 },
  btn: {
    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', border: 'none',
    borderRadius: 8, padding: '12px', color: '#fff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', marginTop: 4,
  },
  hint: { marginTop: 28, textAlign: 'center' },
  hintText: { color: '#6b7280', fontSize: 12, margin: '0 0 6px' },
  code: { background: '#1f2937', color: '#06b6d4', padding: '2px 8px', borderRadius: 4, fontSize: 12 },
  sep: { color: '#374151' },
};
