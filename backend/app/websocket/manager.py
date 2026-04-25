import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import psutil
from app.services import capture


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)
        print(f"[WS] Client connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()
_last_alert_count = 0


async def ws_broadcast_loop():
    global _last_alert_count
    while True:
        if manager.active:
            timeline = capture.get_traffic_timeline()
            latest = timeline[-1] if timeline else {"packets": 0, "alerts": 0, "bytes": 0, "time": ""}

            # Detect new alerts since last broadcast
            current_count = len(capture.alert_buffer)
            new_alerts = []
            if current_count > _last_alert_count:
                diff = current_count - _last_alert_count
                new_alerts = list(capture.alert_buffer)[-diff:]
            _last_alert_count = current_count

            mem = psutil.virtual_memory()
            net = psutil.net_io_counters()

            payload = {
                "type":             "live_update",
                "packets_per_sec":  latest.get("packets", 0),
                "bytes_per_sec":    latest.get("bytes", 0),
                "alerts_per_sec":   latest.get("alerts", 0),
                "time":             latest.get("time", ""),
                "cpu":              psutil.cpu_percent(interval=None),
                "ram":              mem.percent,
                "bytes_sent":       net.bytes_sent,
                "bytes_recv":       net.bytes_recv,
                "new_alerts":       new_alerts,
                "recent_packets":   capture.get_recent_packets(15),
                "severity_counts":  capture.get_alert_severity_counts(),
                "top_ips":          capture.get_top_ips(),
                "protocol_stats":   capture.get_protocol_stats(),
                "traffic_timeline": list(capture.stats_window)[-30:],
            }
            await manager.broadcast(payload)

        await asyncio.sleep(1)
