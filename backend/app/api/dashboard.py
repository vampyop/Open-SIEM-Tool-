from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from app.services import capture
from app.core.security import oauth2_scheme
import psutil

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(token: str = Depends(oauth2_scheme)):
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    net = psutil.net_io_counters()
    return {
        "cpu_percent":      cpu,
        "ram_percent":      mem.percent,
        "ram_used_gb":      round(mem.used / 1024**3, 2),
        "ram_total_gb":     round(mem.total / 1024**3, 2),
        "bytes_sent":       net.bytes_sent,
        "bytes_recv":       net.bytes_recv,
        "total_packets":    len(capture.packet_buffer),
        "total_alerts":     len(capture.alert_buffer),
        "severity_counts":  capture.get_alert_severity_counts(),
        "protocol_stats":   capture.get_protocol_stats(),
        "top_ips":          capture.get_top_ips(),
        "traffic_timeline": capture.get_traffic_timeline(),
    }


@router.get("/packets")
def get_packets(limit: int = 100, token: str = Depends(oauth2_scheme)):
    return {"packets": capture.get_recent_packets(limit)}


@router.get("/alerts")
def get_alerts(limit: int = 100, severity: str = None, token: str = Depends(oauth2_scheme)):
    alerts = capture.get_recent_alerts(500)
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity.upper()]
    return {"alerts": alerts[:limit]}


@router.get("/alerts/export")
def export_alerts_csv(token: str = Depends(oauth2_scheme)):
    alerts = capture.get_recent_alerts(1000)
    lines = ["id,type,severity,src_ip,dst_ip,description,timestamp"]
    for a in alerts:
        lines.append(
            f"{a['id']},{a['alert_type']},{a['severity']},"
            f"{a.get('src_ip','')},{a.get('dst_ip','')},"
            f"\"{a['description']}\",{a['timestamp']}"
        )
    return PlainTextResponse(
        "\n".join(lines), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts.csv"}
    )


@router.get("/interfaces")
def list_interfaces(token: str = Depends(oauth2_scheme)):
    """Returns all available network interfaces on this machine."""
    return {"interfaces": capture.list_interfaces()}


@router.post("/interfaces/{iface}")
def set_interface(iface: str, token: str = Depends(oauth2_scheme)):
    """Switch capture to a different network interface."""
    capture.set_interface(iface)
    return {"message": f"Switched to interface: {iface}"}
