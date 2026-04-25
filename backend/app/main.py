import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models.models import Base
from app.api import auth, dashboard
from app.websocket.manager import manager, ws_broadcast_loop
from app.services.capture import run_capture, stop_capture
from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import hash_password


def seed_default_users():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(username="admin", email="admin@siem.local",
                        hashed_password=hash_password("admin123"), role="admin"))
        if not db.query(User).filter(User.username == "analyst").first():
            db.add(User(username="analyst", email="analyst@siem.local",
                        hashed_password=hash_password("analyst123"), role="analyst"))
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_default_users()
    loop = asyncio.get_event_loop()
    loop.create_task(run_capture())        # ← REAL Scapy capture
    loop.create_task(ws_broadcast_loop())  # ← push to WebSocket clients
    print("✅ Open-SIEM started — LIVE packet capture running.")
    yield
    stop_capture()


app = FastAPI(
    title="Open-SIEM API",
    description="Real-time Network Security Monitor — Live Packet Capture",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Open-SIEM API — LIVE mode 🚀", "docs": "/docs"}


@app.websocket("/ws/live")
async def ws_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
