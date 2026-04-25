import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getStats } from '../services/api';

const COLORS    = ['#06b6d4','#3b82f6','#8b5cf6','#f59e0b','#10b981','#ef4444','#f97316','#ec4899'];
const SEV_COLOR = { LOW:'#10b981', MEDIUM:'#f59e0b', HIGH:'#f97316', CRITICAL:'#ef4444' };
const WS_URL    = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/live';
const TT        = { background:'#1f2937', border:'1px solid #374151', borderRadius:8, color:'#f9fafb', fontSize:12 };

function fmt(bytes) {
  if (bytes > 1e9) return (bytes/1e9).toFixed(1)+' GB';
  if (bytes > 1e6) return (bytes/1e6).toFixed(1)+' MB';
  if (bytes > 1e3) return (bytes/1e3).toFixed(1)+' KB';
  return bytes+' B';
}

export default function DashboardPage() {
  const [live, setLive] = useState({
    cpu:0, ram:0, packets_per_sec:0, bytes_per_sec:0,
    bytes_sent:0, bytes_recv:0,
    severity_counts:{LOW:0,MEDIUM:0,HIGH:0,CRITICAL:0},
    top_ips:[], protocol_stats:[], traffic_timeline:[],
  });
  const [recentPackets, setRecentPackets] = useState([]);
  const [recentAlerts,  setRecentAlerts]  = useState([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  // Initial load
  useEffect(() => {
    getStats().then(r => {
      setLive(prev => ({ ...prev, ...r.data }));
    }).catch(() => {});
  }, []);

  // WebSocket
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen  = () => { setConnected(true); ws.send('ping'); };
      ws.onclose = () => { setConnected(false); setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type !== 'live_update') return;
        setLive({
          cpu: d.cpu, ram: d.ram,
          packets_per_sec: d.packets_per_sec,
          bytes_per_sec:   d.bytes_per_sec,
          bytes_sent:      d.bytes_sent || 0,
          bytes_recv:      d.bytes_recv || 0,
          severity_counts: d.severity_counts,
          top_ips:         d.top_ips,
          protocol_stats:  d.protocol_stats,
          traffic_timeline:d.traffic_timeline,
        });
        setRecentPackets(d.recent_packets || []);
        if (d.new_alerts?.length > 0) {
          setRecentAlerts(prev => [...d.new_alerts, ...prev].slice(0, 30));
        }
      };
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  const sev   = live.severity_counts;
  const total = Object.values(sev).reduce((a,b)=>a+b,0);
  const sevData = Object.entries(sev).map(([k,v])=>({ name:k, count:v }));

  return (
    <div style={S.page}>
      {/* Status bar */}
      <div style={S.bar}>
        <span style={S.barTitle}>🛡️ Live Network Monitor</span>
        <div style={S.barRight}>
          <span style={connected ? S.dotOn : S.dotOff}/>
          <span style={S.barTxt}>{connected ? 'WebSocket Live' : 'Reconnecting...'}</span>
          <span style={S.barSep}>|</span>
          <span style={S.pps}>{live.packets_per_sec} pkt/s</span>
          <span style={S.barSep}>|</span>
          <span style={S.bps}>{fmt(live.bytes_per_sec)}/s</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={S.cardRow}>
        <Card icon="💻" label="CPU"        value={`${live.cpu}%`}              sub="Processor"     color="#06b6d4"/>
        <Card icon="🧠" label="RAM"        value={`${live.ram}%`}              sub="Memory"        color="#8b5cf6"/>
        <Card icon="📡" label="Pkts/sec"   value={live.packets_per_sec}        sub="Captured"      color="#10b981"/>
        <Card icon="⬆️" label="Sent"       value={fmt(live.bytes_sent)}        sub="Total"         color="#3b82f6"/>
        <Card icon="⬇️" label="Received"   value={fmt(live.bytes_recv)}        sub="Total"         color="#f97316"/>
        <Card icon="🚨" label="Alerts"     value={total}                       sub="Detected"      color="#f59e0b"/>
        <Card icon="🔴" label="Critical"   value={sev.CRITICAL}                sub="Severity"      color="#ef4444"/>
      </div>

      {/* Traffic + Protocol */}
      <div style={S.row}>
        <div style={{...S.box, flex:2}}>
          <h3 style={S.boxTitle}>📈 Live Traffic — Packets/sec (Real Network)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={live.traffic_timeline} margin={{top:5,right:10,left:-20,bottom:0}}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="time" tick={{fill:'#6b7280',fontSize:10}} interval="preserveStartEnd"/>
              <YAxis tick={{fill:'#6b7280',fontSize:10}}/>
              <Tooltip contentStyle={TT}/>
              <Area type="monotone" dataKey="packets" stroke="#06b6d4" fill="url(#g1)" strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{...S.box, flex:1}}>
          <h3 style={S.boxTitle}>🥧 Protocol Mix</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={live.protocol_stats} dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {live.protocol_stats.map((_,i)=>(
                  <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={TT} formatter={v=>`${v}%`}/>
              <Legend wrapperStyle={{fontSize:11,color:'#9ca3af'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts + Top IPs + Timeline */}
      <div style={S.row}>
        <div style={{...S.box,flex:1}}>
          <h3 style={S.boxTitle}>🚨 Alert Severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sevData} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="name" tick={{fill:'#6b7280',fontSize:11}}/>
              <YAxis tick={{fill:'#6b7280',fontSize:10}}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {sevData.map((d,i)=><Cell key={i} fill={SEV_COLOR[d.name]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{...S.box,flex:1}}>
          <h3 style={S.boxTitle}>🔥 Top Source IPs</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={live.top_ips} layout="vertical" margin={{top:5,right:20,left:20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis type="number" tick={{fill:'#6b7280',fontSize:10}}/>
              <YAxis type="category" dataKey="ip" tick={{fill:'#9ca3af',fontSize:10}} width={110}/>
              <Tooltip contentStyle={TT}/>
              <Bar dataKey="count" fill="#3b82f6" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{...S.box,flex:1}}>
          <h3 style={S.boxTitle}>⏱️ Alert Rate</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={live.traffic_timeline} margin={{top:5,right:10,left:-20,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
              <XAxis dataKey="time" tick={{fill:'#6b7280',fontSize:10}} interval="preserveStartEnd"/>
              <YAxis tick={{fill:'#6b7280',fontSize:10}}/>
              <Tooltip contentStyle={TT}/>
              <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live feeds */}
      <div style={S.row}>
        {/* Alert feed */}
        <div style={{...S.box,flex:1}}>
          <h3 style={S.boxTitle}>🚨 Live Alert Feed</h3>
          <div style={S.scroll}>
            {recentAlerts.length === 0
              ? <p style={S.empty}>No threats detected. All clear ✅</p>
              : recentAlerts.map((a,i)=>(
                <div key={i} style={{...S.alertRow, borderLeftColor: SEV_COLOR[a.severity]}}>
                  <span style={{...S.sevBadge, background:SEV_COLOR[a.severity]+'22', color:SEV_COLOR[a.severity]}}>
                    {a.severity}
                  </span>
                  <div style={S.alertBody}>
                    <span style={S.alertType}>{a.alert_type}</span>
                    <span style={S.alertDesc}>{a.description}</span>
                  </div>
                  <span style={S.alertTime}>{a.timestamp?.slice(11,19)}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Packet table */}
        <div style={{...S.box,flex:2}}>
          <h3 style={S.boxTitle}>📦 Live Packet Feed — Real Network Traffic</h3>
          <div style={S.tblWrap}>
            <table style={S.tbl}>
              <thead>
                <tr>
                  {['Src IP','Dst IP','Proto','Src Port','Dst Port','Flags','Size','Time'].map(h=>(
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPackets.slice(0,15).map((p,i)=>(
                  <tr key={i} style={p.is_suspicious ? {...S.tr, background:'#ef444411'} : S.tr}>
                    <td style={S.tdIp}>{p.src_ip}</td>
                    <td style={S.tdIp}>{p.dst_ip}</td>
                    <td style={S.td}>
                      <span style={S.protoBadge}>{p.protocol}</span>
                    </td>
                    <td style={S.tdN}>{p.src_port||'—'}</td>
                    <td style={S.tdN}>{p.dst_port||'—'}</td>
                    <td style={S.tdFlag}>{p.flags||'—'}</td>
                    <td style={S.tdN}>{p.size}B</td>
                    <td style={S.tdTime}>{p.timestamp?.slice(11,19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({icon,label,value,sub,color}){
  return (
    <div style={{...S.card, borderTopColor:color}}>
      <div style={S.cardTop}>
        <span style={S.cardIcon}>{icon}</span>
        <span style={{...S.cardVal,color}}>{value}</span>
      </div>
      <p style={S.cardLabel}>{label}</p>
      <p style={S.cardSub}>{sub}</p>
    </div>
  );
}

const S = {
  page:    { background:'#0a0e1a', minHeight:'100vh', paddingBottom:40, fontFamily:"'Inter',sans-serif" },
  bar:     { background:'#111827', borderBottom:'1px solid #1f2937', padding:'8px 24px',
             display:'flex', justifyContent:'space-between', alignItems:'center' },
  barTitle:{ color:'#9ca3af', fontSize:13, fontWeight:500 },
  barRight:{ display:'flex', alignItems:'center', gap:8 },
  dotOn:   { width:8,height:8,borderRadius:'50%',background:'#10b981',display:'inline-block' },
  dotOff:  { width:8,height:8,borderRadius:'50%',background:'#ef4444',display:'inline-block' },
  barTxt:  { color:'#6b7280', fontSize:12 },
  barSep:  { color:'#374151' },
  pps:     { color:'#06b6d4', fontSize:13, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" },
  bps:     { color:'#10b981', fontSize:13, fontWeight:600, fontFamily:"'JetBrains Mono',monospace" },
  cardRow: { display:'flex', gap:12, padding:'16px 24px 0', flexWrap:'wrap' },
  card:    { flex:1, minWidth:120, background:'#111827', border:'1px solid #1f2937',
             borderTop:'3px solid', borderRadius:10, padding:'14px 16px' },
  cardTop: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  cardIcon:{ fontSize:20 },
  cardVal: { fontSize:22, fontWeight:700, fontFamily:"'JetBrains Mono',monospace" },
  cardLabel:{ margin:0, color:'#f3f4f6', fontSize:12, fontWeight:600 },
  cardSub: { margin:'2px 0 0', color:'#6b7280', fontSize:11 },
  row:     { display:'flex', gap:12, padding:'12px 24px 0' },
  box:     { background:'#111827', border:'1px solid #1f2937', borderRadius:10, padding:16 },
  boxTitle:{ margin:'0 0 12px', color:'#f3f4f6', fontSize:13, fontWeight:600 },
  scroll:  { height:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:5 },
  empty:   { color:'#6b7280', fontSize:13, textAlign:'center', marginTop:40 },
  alertRow:{ display:'flex', alignItems:'flex-start', gap:8, background:'#1f2937',
             borderRadius:6, padding:'7px 10px', borderLeft:'3px solid' },
  sevBadge:{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap', marginTop:1 },
  alertBody:{ flex:1, display:'flex', flexDirection:'column', gap:2 },
  alertType:{ color:'#f3f4f6', fontWeight:600, fontSize:12 },
  alertDesc:{ color:'#9ca3af', fontSize:11 },
  alertTime:{ color:'#6b7280', fontSize:10, fontFamily:"'JetBrains Mono',monospace", whiteSpace:'nowrap' },
  tblWrap: { overflowX:'auto', height:250, overflowY:'auto' },
  tbl:     { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:      { color:'#6b7280', fontWeight:600, padding:'6px 10px', textAlign:'left',
             borderBottom:'1px solid #1f2937', whiteSpace:'nowrap', background:'#0f172a',
             position:'sticky', top:0 },
  tr:      { borderBottom:'1px solid #1a2233' },
  td:      { padding:'5px 10px', color:'#9ca3af' },
  tdIp:   { padding:'5px 10px', color:'#60a5fa', fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
  tdN:    { padding:'5px 10px', color:'#9ca3af', fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
  tdFlag: { padding:'5px 10px', color:'#f59e0b', fontSize:11 },
  tdTime: { padding:'5px 10px', color:'#6b7280', fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
  protoBadge:{ background:'#3b82f622', color:'#60a5fa', padding:'1px 6px', borderRadius:4, fontSize:11 },
};
