"""
Real packet capture using Scapy.
Requires: sudo on Linux/macOS  |  Npcap on Windows.
Run backend with: sudo uvicorn app.main:app --reload --port 8000
"""
import asyncio
import threading
import time
from datetime import datetime
from collections import defaultdict, deque
from typing import Optional

# ── Scapy import ──────────────────────────────────────────────────────────────
try:
    from scapy.all import sniff, get_if_list, conf
    from scapy.layers.inet import IP, TCP, UDP, ICMP
    from scapy.layers.dns import DNS
    SCAPY_OK = True
except ImportError:
    SCAPY_OK = False
    print("[WARN] Scapy not installed. Run: pip install scapy")

# ── In-memory state ───────────────────────────────────────────────────────────
packet_buffer: deque = deque(maxlen=1000)
alert_buffer:  deque = deque(maxlen=500)
stats_window:  deque = deque(maxlen=60)

ip_pkt_count:   dict = defaultdict(int)    # per-second counters
port_scan_map:  dict = defaultdict(set)    # IP → ports seen this window
ssh_ftp_count:  dict = defaultdict(int)

_window_packets = []   # packets collected in current 1-second window
_alert_id  = 1
_packet_id = 1
_running   = False
_iface     = None      # active interface (None = Scapy default)


# ── Public helpers ────────────────────────────────────────────────────────────
def list_interfaces() -> list:
    if not SCAPY_OK:
        return []
    try:
        return get_if_list()
    except Exception:
        return []


def set_interface(iface: str):
    global _iface
    _iface = iface
    print(f"[Capture] Interface set → {iface}")


def get_recent_packets(limit: int = 50) -> list:
    return list(packet_buffer)[-limit:][::-1]


def get_recent_alerts(limit: int = 200) -> list:
    return list(alert_buffer)[-limit:][::-1]


def get_traffic_timeline() -> list:
    return list(stats_window)


def get_protocol_stats() -> list:
    counts: dict = defaultdict(int)
    for p in packet_buffer:
        counts[p["protocol"]] += 1
    total = sum(counts.values()) or 1
    return [{"name": k, "value": round(v / total * 100, 1)} for k, v in sorted(counts.items(), key=lambda x: -x[1])]


def get_top_ips(n: int = 5) -> list:
    counts: dict = defaultdict(int)
    for p in packet_buffer:
        counts[p["src_ip"]] += 1
    top = sorted(counts.items(), key=lambda x: x[1], reverse=True)[:n]
    return [{"ip": ip, "count": c} for ip, c in top]


def get_alert_severity_counts() -> dict:
    counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for a in alert_buffer:
        if a["severity"] in counts:
            counts[a["severity"]] += 1
    return counts


# ── Packet parsing ────────────────────────────────────────────────────────────
def _parse_scapy_packet(pkt) -> Optional[dict]:
    global _packet_id
    if not pkt.haslayer(IP):
        return None

    ip = pkt[IP]
    proto = "OTHER"
    src_port = dst_port = None
    flags = ""

    if pkt.haslayer(TCP):
        tcp = pkt[TCP]
        src_port, dst_port = tcp.sport, tcp.dport
        proto = "HTTPS" if dst_port == 443 or src_port == 443 else \
                "HTTP"  if dst_port == 80  or src_port == 80  else \
                "SSH"   if dst_port == 22  or src_port == 22  else \
                "FTP"   if dst_port == 21  or src_port == 21  else "TCP"
        flag_map = {0x02: "SYN", 0x10: "ACK", 0x12: "SYN-ACK",
                    0x04: "RST", 0x01: "FIN", 0x18: "PSH-ACK"}
        flags = flag_map.get(int(tcp.flags), str(tcp.flags))

    elif pkt.haslayer(UDP):
        udp = pkt[UDP]
        src_port, dst_port = udp.sport, udp.dport
        proto = "DNS" if dst_port == 53 or src_port == 53 else "UDP"

    elif pkt.haslayer(ICMP):
        proto = "ICMP"

    size = len(pkt)
    rec = {
        "id": _packet_id,
        "src_ip": ip.src,
        "dst_ip": ip.dst,
        "src_port": src_port,
        "dst_port": dst_port,
        "protocol": proto,
        "size": size,
        "flags": flags,
        "timestamp": datetime.utcnow().isoformat(),
        "is_suspicious": False,
    }
    _packet_id += 1
    return rec


# ── Threat detection ──────────────────────────────────────────────────────────
def _make_alert(atype, severity, src, dst, desc) -> dict:
    global _alert_id
    a = {
        "id": _alert_id,
        "alert_type": atype,
        "severity": severity,
        "src_ip": src,
        "dst_ip": dst,
        "description": desc,
        "timestamp": datetime.utcnow().isoformat(),
        "resolved": False,
    }
    _alert_id += 1
    return a


def _detect_threats(window: list) -> list:
    alerts = []
    src_counts: dict = defaultdict(int)

    for p in window:
        src = p["src_ip"]
        src_counts[src] += 1
        port_scan_map[src].add(p.get("dst_port") or 0)
        if p["protocol"] in ("SSH", "FTP"):
            ssh_ftp_count[src] += 1

    for ip, count in src_counts.items():
        # DDoS / flood
        if count > 200:
            alerts.append(_make_alert(
                "DDoS Flood", "CRITICAL", ip, None,
                f"{count} packets/sec from {ip} — possible flood attack"))
        elif count > 80:
            alerts.append(_make_alert(
                "Traffic Spike", "HIGH", ip, None,
                f"{count} packets/sec from {ip} — abnormal burst"))

        # Port scan
        ports = len(port_scan_map[ip])
        if ports > 20:
            alerts.append(_make_alert(
                "Port Scan", "HIGH", ip, None,
                f"{ports} unique destination ports scanned from {ip}"))
            port_scan_map[ip] = set()

        # Brute force SSH/FTP
        if ssh_ftp_count[ip] > 10:
            alerts.append(_make_alert(
                "Brute Force", "CRITICAL", ip, None,
                f"{ssh_ftp_count[ip]} SSH/FTP attempts from {ip}"))
            ssh_ftp_count[ip] = 0

    return alerts


# ── Scapy sniff callback ──────────────────────────────────────────────────────
def _pkt_callback(pkt):
    rec = _parse_scapy_packet(pkt)
    if rec:
        _window_packets.append(rec)
        packet_buffer.append(rec)


# ── Per-second stats aggregator ───────────────────────────────────────────────
def _stats_loop():
    """Runs in its own thread — aggregates each 1-second window."""
    global _window_packets
    while _running:
        time.sleep(1)
        window = _window_packets[:]
        _window_packets = []

        new_alerts = _detect_threats(window)
        for a in new_alerts:
            alert_buffer.append(a)

        stats_window.append({
            "time":    datetime.utcnow().strftime("%H:%M:%S"),
            "packets": len(window),
            "alerts":  len(new_alerts),
            "bytes":   sum(p["size"] for p in window),
        })

        if window:
            print(f"[Capture] {len(window)} pkts/s | {len(new_alerts)} alerts | "
                  f"total_pkts={len(packet_buffer)}", flush=True)


# ── Start / stop ──────────────────────────────────────────────────────────────
async def run_capture():
    global _running
    if not SCAPY_OK:
        raise RuntimeError(
            "Scapy is not installed. Run: pip install scapy\n"
            "On Linux also run: sudo pip install scapy\n"
            "On Windows install Npcap from https://npcap.com"
        )

    _running = True
    iface_msg = _iface or "default (all)"
    print(f"[Capture] Starting REAL packet capture on interface: {iface_msg}")
    print("[Capture] If you see a permission error, run with sudo.")

    # Stats aggregator in background thread
    stats_thread = threading.Thread(target=_stats_loop, daemon=True)
    stats_thread.start()

    # Scapy sniff runs in a thread (it blocks)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: sniff(
            iface=_iface,
            prn=_pkt_callback,
            store=False,
            stop_filter=lambda _: not _running,
        )
    )


def stop_capture():
    global _running
    _running = False
    print("[Capture] Stopped.")
