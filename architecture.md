# Open-SIEM — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                         │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐     │
│   │              React Frontend (Port 3000)               │     │
│   │  Dashboard │ Alerts Page │ Packets Page │ Login        │     │
│   │  Recharts (Line, Area, Bar, Pie) │ WebSocket Client   │     │
│   └──────────────┬─────────────────────────┬─────────────┘     │
│                  │ REST API (axios)         │ WS ws://          │
└──────────────────┼──────────────────────────┼───────────────────┘
                   │                          │
         ┌─────────▼──────────────────────────▼─────────┐
         │            Nginx Reverse Proxy (Port 80)      │
         │  /api/* → backend:8000  /ws/* → backend:8000  │
         └─────────┬─────────────────────────┬───────────┘
                   │                         │
         ┌─────────▼─────────────────────────▼───────────┐
         │         FastAPI Backend (Port 8000)            │
         │                                                │
         │  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
         │  │ /api/auth│  │/api/dash │  │  /ws/live   │  │
         │  │  JWT Auth│  │ Stats    │  │  WebSocket  │  │
         │  └──────────┘  └──────────┘  └──────┬──────┘  │
         │                                      │         │
         │  ┌──────────────────────────────────┐│         │
         │  │     Background Tasks (asyncio)   ││         │
         │  │  ┌────────────────┐              ││         │
         │  │  │ Packet         │  Broadcast   ││         │
         │  │  │ Simulator/     │──────────────┘│         │
         │  │  │ Capture Loop   │               │         │
         │  │  └────────────────┘               │         │
         │  │  ┌────────────────┐               │         │
         │  │  │ Threat         │               │         │
         │  │  │ Detection      │               │         │
         │  │  │ Engine         │               │         │
         │  │  └────────────────┘               │         │
         │  └──────────────────────────────────┘│         │
         └──────────────────────────────────────┼─────────┘
                                                │
                   ┌────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  SQLite / Postgres │
         │  - users table     │
         │  - packets table   │
         │  - alerts table    │
         └────────────────────┘
```

## Data Flow

1. **Packet Simulator** generates ~10-60 packets/second (mimics real Scapy capture)
2. **Threat Detection Engine** scans each batch for:
   - DDoS bursts (>40 pkts/sec from one IP)
   - Port scans (>15 unique ports probed)
   - Brute force (>5 SSH/FTP attempts)
3. **WebSocket Broadcast Loop** pushes data to all connected browsers every second
4. **React frontend** receives live data, updates charts without page refresh
5. REST API handles authentication, exports, and historical queries

## Tech Choices (for your report)

| Component       | Technology       | Why                                      |
|----------------|-----------------|------------------------------------------|
| Backend         | Python + FastAPI | Fast, async, auto API docs at /docs      |
| Real-time       | WebSockets       | Bidirectional, low latency               |
| Frontend        | React + Recharts | Component-based, great charting library  |
| Database        | SQLite → Postgres| SQLite for dev, Postgres for production  |
| Auth            | JWT tokens       | Stateless, industry standard             |
| Container       | Docker           | Same environment everywhere              |
| Detection       | Rule-based engine| Explainable, no ML needed to demo        |
