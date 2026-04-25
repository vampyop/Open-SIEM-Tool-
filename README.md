# 🛡️ Open-SIEM — Network Security Monitor

> A college-level Security Information & Event Management (SIEM) system built with Python FastAPI + React. Monitors network traffic, detects threats in real-time, and visualizes data through a professional dashboard.

[![CI](https://github.com/YOUR_USERNAME/open-siem/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/open-siem/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org)

---

## 📸 Features at a Glance

| Feature | Description |
|---|---|
| 🔴 Live Dashboard | Real-time charts updating every second |
| 📦 Packet Monitor | View live network packets with source/dest IPs |
| 🚨 Alert Engine | Detects port scans, DDoS bursts, brute force |
| 📊 Charts | Area, Line, Bar, Pie charts using Recharts |
| 🔐 JWT Auth | Login with Admin / Analyst roles |
| ⬇️ CSV Export | Download all alerts as CSV |
| 🐳 Docker | One-command setup with Docker Compose |
| 🤖 CI/CD | GitHub Actions runs tests automatically |

---

## 🚀 Quick Start (Recommended)

### Option 1 — Run Without Docker (Easiest for demo)

**Step 1: Clone the project**
```bash
git clone https://github.com/YOUR_USERNAME/open-siem.git
cd open-siem
```

**Step 2: Start the Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Step 3: Start the Frontend** (open a NEW terminal)
```bash
cd frontend
npm install
npm start
```

**Step 4: Open your browser**
- 🖥️ Dashboard → http://localhost:3000
- 📖 API Docs → http://localhost:8000/docs

**Login credentials:**
| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| analyst | analyst123 | Analyst |

---

### Option 2 — Docker (One command)

```bash
git clone https://github.com/YOUR_USERNAME/open-siem.git
cd open-siem
docker-compose up --build
```

Then open: http://localhost:3000

---

## 📁 Project Structure

```
open-siem/
├── backend/
│   ├── app/
│   │   ├── api/           ← REST endpoints (auth, dashboard)
│   │   ├── core/          ← Database + JWT security
│   │   ├── models/        ← SQLAlchemy database models
│   │   ├── services/      ← Packet simulator + threat detection
│   │   ├── websocket/     ← WebSocket broadcast manager
│   │   └── main.py        ← FastAPI app entry point
│   ├── tests/             ← Pytest tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/         ← Dashboard, Alerts, Packets, Login
│   │   ├── components/    ← Navbar
│   │   └── services/      ← Axios API client
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── nginx.conf
├── .github/workflows/ci.yml
├── architecture.md
└── README.md
```

---

## 🔧 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, returns JWT token |
| POST | `/api/auth/register` | No | Register new user |
| GET | `/api/auth/me` | Yes | Get current user info |
| GET | `/api/dashboard/stats` | Yes | Full dashboard statistics |
| GET | `/api/dashboard/packets?limit=50` | Yes | Recent captured packets |
| GET | `/api/dashboard/alerts?severity=HIGH` | Yes | Filter alerts by severity |
| GET | `/api/dashboard/alerts/export` | Yes | Download alerts as CSV |
| WS | `/ws/live` | No | WebSocket live data stream |

---

## 🌐 WebSocket Events

Connect to `ws://localhost:8000/ws/live`

**Event received every 1 second:**
```json
{
  "type": "live_update",
  "packets_per_sec": 42,
  "alerts_per_sec": 1,
  "cpu": 23.5,
  "ram": 61.2,
  "severity_counts": { "LOW": 5, "MEDIUM": 3, "HIGH": 2, "CRITICAL": 1 },
  "top_ips": [{ "ip": "45.33.32.156", "count": 120 }],
  "protocol_stats": [{ "name": "TCP", "value": 45.2 }],
  "traffic_timeline": [{ "time": "14:22:01", "packets": 42, "alerts": 1 }],
  "recent_packets": [...],
  "new_alerts": [...]
}
```

---

## 🛡️ Threat Detection Rules

| Rule | Trigger | Severity |
|---|---|---|
| DDoS Burst | >40 packets/sec from one IP | CRITICAL |
| Traffic Spike | >20 packets/sec from one IP | HIGH |
| Port Scan | >15 unique ports probed | HIGH |
| Brute Force SSH/FTP | >5 connection attempts | CRITICAL |

---

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

Expected output:
```
PASSED tests/test_api.py::test_root
PASSED tests/test_api.py::test_register_and_login
PASSED tests/test_api.py::test_dashboard_requires_auth
PASSED tests/test_api.py::test_dashboard_with_auth
```

---

## 🔮 Future Improvements

- [ ] Real Scapy packet capture (requires Linux + root)
- [ ] Machine Learning anomaly detection (Isolation Forest / Autoencoder)
- [ ] Email/Telegram alert notifications
- [ ] PostgreSQL for production persistence
- [ ] PDF report generation
- [ ] Geolocation map for attacker IPs
- [ ] Multi-interface monitoring
- [ ] MITRE ATT&CK framework mapping

---

## 🛠️ Troubleshooting

**Backend not starting?**
```bash
# Check Python version (needs 3.10+)
python --version

# Install missing packages
pip install -r requirements.txt
```

**Frontend not connecting to backend?**
```bash
# Create frontend/.env file:
echo "REACT_APP_API_URL=http://localhost:8000" > frontend/.env
echo "REACT_APP_WS_URL=ws://localhost:8000/ws/live" >> frontend/.env
```

**WebSocket shows "Reconnecting"?**
- Make sure backend is running on port 8000
- Check browser console for errors (F12)

**npm install fails?**
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

---

## 📜 License

MIT License — Free to use for academic projects.

---

## 👨‍💻 Team / Author

Built as a college major project demonstrating:
- Full-stack web development (Python + React)
- Network security concepts (SIEM, IDS/IPS)
- Real-time systems (WebSockets)
- DevOps (Docker, CI/CD)
- Software engineering best practices
