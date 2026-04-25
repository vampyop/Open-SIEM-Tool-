import React, { useState, useEffect } from 'react';
import { getAlerts } from '../services/api';

const SEV_COLORS = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async (sev) => {
    setLoading(true);
    try {
      const res = await getAlerts(200, sev === 'ALL' ? '' : sev);
      setAlerts(res.data.alerts || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(filter); }, [filter]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const id = setInterval(() => fetchAlerts(filter), 5000);
    return () => clearInterval(id);
  }, [filter]);

  const handleExport = () => {
    const token = localStorage.getItem('token');
    window.open(`http://localhost:8000/api/dashboard/alerts/export`, '_blank');
  };

  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🚨 Alert History</h2>
          <p style={styles.sub}>{alerts.length} alerts found • Auto-refreshes every 5s</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.filterRow}>
            {severities.map(s => (
              <button key={s}
                onClick={() => setFilter(s)}
                style={filter === s
                  ? { ...styles.filterBtn, background: SEV_COLORS[s] || '#06b6d4', color: '#fff', borderColor: 'transparent' }
                  : styles.filterBtn}>
                {s}
              </button>
            ))}
          </div>
          <button onClick={handleExport} style={styles.exportBtn}>⬇️ Export CSV</button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        {loading ? (
          <p style={styles.loading}>Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>✅</span>
            <p>No alerts for selected filter. System is clean!</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['#', 'Severity', 'Type', 'Source IP', 'Description', 'Timestamp'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((a, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.tdId}>{a.id}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.sevBadge, background: SEV_COLORS[a.severity] + '22', color: SEV_COLORS[a.severity], border: `1px solid ${SEV_COLORS[a.severity]}44` }}>
                      {a.severity}
                    </span>
                  </td>
                  <td style={styles.tdType}>{a.alert_type}</td>
                  <td style={styles.tdMono}>{a.src_ip || '—'}</td>
                  <td style={styles.tdDesc}>{a.description}</td>
                  <td style={styles.tdTime}>{a.timestamp?.replace('T', ' ').slice(0, 19)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#0a0e1a', minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, color: '#f9fafb', fontSize: 22, fontWeight: 700 },
  sub: { margin: '4px 0 0', color: '#6b7280', fontSize: 13 },
  headerRight: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  filterRow: { display: 'flex', gap: 6 },
  filterBtn: {
    background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  exportBtn: {
    background: '#1f2937', border: '1px solid #374151', color: '#06b6d4',
    padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },
  tableWrap: { background: '#111827', border: '1px solid #1f2937', borderRadius: 12, overflow: 'hidden' },
  loading: { color: '#6b7280', textAlign: 'center', padding: 40 },
  emptyState: { textAlign: 'center', padding: 60, color: '#6b7280' },
  emptyIcon: { fontSize: 48, display: 'block', marginBottom: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { color: '#6b7280', fontWeight: 600, padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #1f2937', background: '#0f172a', fontSize: 12 },
  trEven: { background: '#111827' },
  trOdd: { background: '#0f172a' },
  td: { padding: '10px 16px', color: '#9ca3af', verticalAlign: 'middle' },
  tdId: { padding: '10px 16px', color: '#4b5563', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
  tdType: { padding: '10px 16px', color: '#f3f4f6', fontWeight: 500 },
  tdMono: { padding: '10px 16px', color: '#06b6d4', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 },
  tdDesc: { padding: '10px 16px', color: '#9ca3af', maxWidth: 350 },
  tdTime: { padding: '10px 16px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, whiteSpace: 'nowrap' },
  sevBadge: { padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 },
};
