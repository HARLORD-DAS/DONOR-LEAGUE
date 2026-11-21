from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        # Map user_id to list of active websockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, key: str, websocket: WebSocket):
        await websocket.accept()
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)

    def disconnect(self, key: str, websocket: WebSocket):
        if key in self.active_connections:
            if websocket in self.active_connections[key]:
                self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]

    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel in self.active_connections:
            for connection in self.active_connections[channel]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

    async def broadcast_all(self, message: dict):
        for key in list(self.active_connections.keys()):
            for connection in self.active_connections.get(key, []):
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

ws_manager = ConnectionManager()

@router.websocket("/ws/{client_type}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_type: str, client_id: str):
    """
    WebSocket endpoint for real-time live events.
    client_type: 'user', 'donor', 'attendant', 'request'
    """
    key = f"{client_type}_{client_id}"
    await ws_manager.connect(key, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or heartbeat
            try:
                payload = json.loads(data)
                if payload.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(key, websocket)
