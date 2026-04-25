# Open-SIEM-Tool-
# ▶️ How to Run Open-SIEM (LIVE Packet Capture)

Scapy captures REAL packets from your network card.
It needs admin/root permission — this is normal for any network tool (Wireshark does the same).

---

## ✅ Linux / Kali Linux (Recommended)

### Step 1 — Install dependencies
```bash
cd open-siem/backend
pip install -r requirements.txt
```

### Step 2 — Start backend WITH SUDO (required for raw socket access)
```bash
sudo uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

You'll see:
```
[Capture] Starting REAL packet capture on interface: default (all)
✅ Open-SIEM started — LIVE packet capture running.
[Capture] 42 pkts/s | 0 alerts | total_pkts=42
[Capture] 67 pkts/s | 1 alerts | total_pkts=109
```

### Step 3 — Start frontend (new terminal, no sudo needed)
```bash
cd open-siem/frontend
npm install
npm start
```

### Step 4 — Open browser
- Dashboard → http://localhost:3000
- API Docs  → http://localhost:8000/docs

---

## ✅ Windows

### Step 1 — Install Npcap (REQUIRED — Scapy needs this driver)
Download from: https://npcap.com/#download
Install it with default options.

### Step 2 — Install Python packages
```cmd
cd open-siem\backend
pip install -r requirements.txt
```

### Step 3 — Run as Administrator
Right-click your terminal → "Run as Administrator"
```cmd
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4 — Start frontend
```cmd
cd open-siem\frontend
npm install
npm start
```

---

## 🔌 Select Network Interface

In the dashboard Navbar, there is an **Interface dropdown**.
Click it to see all interfaces on your machine (eth0, wlan0, lo, etc.) and switch capture.

Or via API:
```bash
# List interfaces
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/dashboard/interfaces

# Switch to wlan0
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/dashboard/interfaces/wlan0
```

---

## 🐳 Docker (Linux only — needs --network=host for raw sockets)

```bash
docker-compose up --build
```

For real packet capture in Docker on Linux:
```bash
docker run --network=host --cap-add=NET_ADMIN --cap-add=NET_RAW siem-backend
```

---

## 🧪 Run Tests

```bash
cd backend
pytest tests/ -v
```

---

## 🔑 Login Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin123 | Admin |
| analyst  | analyst123 | Analyst |

---

## ❓ Common Errors

| Error | Fix |
|---|---|
| `Operation not permitted` | Run with `sudo` on Linux |
| `No module named scapy` | `pip install scapy` |
| `Npcap not found` | Install Npcap on Windows |
| `WebSocket Reconnecting` | Make sure backend is running |
| `CORS error` | Backend must be on port 8000 |
