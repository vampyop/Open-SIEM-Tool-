import React, { useState, useEffect } from 'react';
import { getPackets } from '../services/api';

const PROTO_COLORS = {
  TCP: '#3b82f6', UDP: '#8b5cf6', ICMP: '#f59e0b',
  HTTP: '#10b981', HTTPS: '#06b6d4', DNS: '#f97316', FTP: '#ec4899', SSH: '#ef4444',
};

export default function PacketsPage() {
  const [packets, setPackets] = useState([]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (paused) return;
      try {
        const res = await getPackets(100);
        setPackets(res.data.packets || []);
      } catch { }
    };
    fetch();
    const id = setInterval(fetch, 2000);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = filter
    ? packets.filter(p =>
      p.src_ip?.includes(filter) ||
      p.dst_ip?.includes(filter) ||
      p.protocol?.toLowerCase().includes(filter.toLowerCase())
    )
    : packets;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📦 Live Packet Capture</h2>
          <p style={styles.sub}>{filtered.length} packets • Refreshes every 2 seconds</p>
        </div>
        <div style={styles.controls}>
          <input
            style={styles.searchInput}
            placeholder="Filter by IP or protocol..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button
            onClick={() => setPaused(p => !p)}
            style={paused ? { ...styles.pauseBtn, background: '#10b98122', color: '#10b981' } : styles.pauseBtn}>
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['#', 'Source IP', 'Destination IP', 'Protocol', 'Src Port', 'Dst Port', 'Flags', 'Size', 'Time'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id || i} style={p.is_suspicious
                ? { ...styles.trBase, background: '#ef444411', borderLeft: '2px solid #ef4444' }
                : styles.trBase}>
                <td style={styles.tdId}>{p.id}</td>
                <td style={styles.tdIp}>{p.src_ip}</td>
                <td style={styles.tdIp}>{p.dst_ip}</td>
                <td style={styles.td}>
                  <span style={{
                    background: (PROTO_COLORS[p.protocol] || '#6b7280') + '22',
                    color: PROTO_COLORS[p.protocol] || '#9ca3af',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>{p.protocol}</span>
                </td>
                <td style={styles.tdPort}>{p.src_port}</td>
                <td style={styles.tdPort}>{p.dst_port}</td>
                <td style={styles.tdFlag}>{p.flags || '—'}</td>
                <td style={styles.tdPort}>{p.size}B</td>
                <td style={styles.tdTime}>{p.timestamp?.slice(11, 19)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paused && (
        <div style={styles.pausedBanner}>⏸ Capture paused — click Resume to continue live updates</div>
      )}
    </div>
  );
}

const styles = {
  page: { background: '#0a0e1a', minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { margin: 0, color: '#f9fafb', fontSize: 22, fontWeight: 700 },
  sub: { margin: '4px 0 0', color: '#6b7280', fontSize: 13 },
  controls: { display: 'flex', gap: 10, alignItems: 'center' },
  searchInput: {
    background: '#1f2937', border: '1px solid #374151', color: '#f9fafb',
    padding: '8px 14px', borderRadius: 8, fontSize: 13, width: 240, outline: 'none',
  },
  pauseBtn: {
    background: '#ef444422', border: '1px solid #374151', color: '#ef4444',
    padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
  },
  tableWrap: {
    background: '#111827', border: '1px solid #1f2937', borderRadius: 12,
    overflow: 'auto', maxHeight: 'calc(100vh - 180px)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: {
    color: '#6b7280', fontWeight: 600, padding: '10px 14px',
    textAlign: 'left', borderBottom: '1px solid #1f2937',
    background: '#0f172a', fontSize: 11, position: 'sticky', top: 0, whiteSpace: 'nowrap',
  },
  trBase: { borderBottom: '1px solid #1a2233', transition: 'background 0.2s' },
  tdId: { padding: '7px 14px', color: '#4b5563', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
  tdIp: { padding: '7px 14px', color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
  td: { padding: '7px 14px', color: '#9ca3af' },
  tdPort: { padding: '7px 14px', color: '#9ca3af', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
  tdFlag: { padding: '7px 14px', color: '#f59e0b', fontSize: 11 },
  tdTime: { padding: '7px 14px', color: '#6b7280', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
  pausedBanner: {
    marginTop: 16, background: '#f59e0b22', border: '1px solid #f59e0b44',
    color: '#f59e0b', padding: '10px 16px', borderRadius: 8, fontSize: 13, textAlign: 'center',
  },
};
