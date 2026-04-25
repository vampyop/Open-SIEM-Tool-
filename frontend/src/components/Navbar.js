import React, { useState, useEffect } from 'react';
import { getInterfaces, setInterface } from '../services/api';

export default function Navbar({ user, activePage, setPage, onLogout }) {
  const [interfaces, setInterfaces]   = useState([]);
  const [activeIface, setActiveIface] = useState('');
  const [showIfaces, setShowIfaces]   = useState(false);

  useEffect(() => {
    getInterfaces()
      .then(r => setInterfaces(r.data.interfaces || []))
      .catch(() => {});
  }, []);

  const handleIfaceSelect = async (iface) => {
    await setInterface(iface).catch(() => {});
    setActiveIface(iface);
    setShowIfaces(false);
  };

  const navItems = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'packets',   label: '📦 Packets'   },
    { id: 'alerts',    label: '🚨 Alerts'    },
  ];

  return (
    <nav style={S.nav}>
      <div style={S.brand}>
        <span style={S.shield}>🛡️</span>
        <span style={S.title}>Open<span style={S.accent}>SIEM</span></span>
        <span style={S.liveBadge}>● LIVE</span>
      </div>

      <div style={S.navItems}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={activePage === n.id ? {...S.navBtn, ...S.navBtnActive} : S.navBtn}>
            {n.label}
          </button>
        ))}
      </div>

      <div style={S.right}>
        {/* Interface selector */}
        {interfaces.length > 0 && (
          <div style={S.ifaceWrap}>
            <button onClick={() => setShowIfaces(s => !s)} style={S.ifaceBtn}>
              🔌 {activeIface || 'Interface'} ▾
            </button>
            {showIfaces && (
              <div style={S.dropdown}>
                {interfaces.map(iface => (
                  <div key={iface} onClick={() => handleIfaceSelect(iface)}
                    style={iface === activeIface ? {...S.ddItem, color: '#06b6d4'} : S.ddItem}>
                    {iface}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={S.userInfo}>
          <span style={S.userName}>{user?.username}</span>
          <span style={user?.role === 'admin' ? S.roleAdmin : S.roleAnalyst}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
        <button onClick={onLogout} style={S.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

const S = {
  nav: {
    background: '#111827', borderBottom: '1px solid #1f2937',
    padding: '0 24px', height: 60, display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 200,
  },
  brand:    { display: 'flex', alignItems: 'center', gap: 8 },
  shield:   { fontSize: 22 },
  title:    { fontSize: 18, fontWeight: 700, color: '#f9fafb' },
  accent:   { color: '#06b6d4' },
  liveBadge:{ background: '#dc262622', color: '#ef4444', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 4, letterSpacing: 1,
              animation: 'pulse 2s infinite' },
  navItems: { display: 'flex', gap: 4 },
  navBtn:   { background: 'transparent', border: 'none', color: '#9ca3af',
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  navBtnActive: { background: '#1f2937', color: '#06b6d4' },
  right:    { display: 'flex', alignItems: 'center', gap: 12 },
  ifaceWrap:{ position: 'relative' },
  ifaceBtn: { background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  dropdown: { position: 'absolute', top: '110%', right: 0, background: '#1f2937',
              border: '1px solid #374151', borderRadius: 8, minWidth: 180, zIndex: 999,
              maxHeight: 260, overflowY: 'auto' },
  ddItem:   { padding: '8px 14px', color: '#d1d5db', cursor: 'pointer', fontSize: 12,
              borderBottom: '1px solid #374151' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  userName: { color: '#f9fafb', fontSize: 13, fontWeight: 500 },
  roleAdmin:{ background: '#7c3aed22', color: '#a78bfa', fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 600 },
  roleAnalyst:{ background: '#06b6d422', color: '#06b6d4', fontSize: 10, padding: '1px 6px', borderRadius: 3, fontWeight: 600 },
  logoutBtn:{ background: '#1f2937', border: '1px solid #374151', color: '#9ca3af',
              padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
};
