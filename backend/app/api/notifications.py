from datetime import datetime, timezone
from typing import Optional, List
import uuid
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Notification, User, BloodRequest
from app.api.websocket import ws_manager

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def utc_now():
    return datetime.now(timezone.utc)

class NotificationService:
    @staticmethod
    async def send_whatsapp_request_notification(
        db: AsyncSession,
        user: User,
        donor_name: str,
        blood_request: BloodRequest,
        distance_km: float
    ) -> Notification:
        """Send blood request alert via Meta WhatsApp Business Cloud API or Simulation mode."""
        secure_link = f"{settings.APP_BASE_URL}/donor/requests/{blood_request.id}?ref={uuid.uuid4().hex[:12]}"
        
        message_body = (
            f"🩸 *DONOR LEAGUE – BLOOD DONATION REQUEST*\n\n"
            f"Hello {donor_name},\n\n"
            f"A blood donation request matching your registered blood group has been identified near your location.\n\n"
            f"• *Required Blood Group:* {blood_request.required_blood_group}\n"
            f"• *Hospital:* {blood_request.hospital_name}\n"
            f"• *Location:* {blood_request.hospital_address}\n"
            f"• *Approximate Distance:* {distance_km} km\n"
            f"• *Urgency:* {blood_request.urgency}\n"
            f"• *Request ID:* {blood_request.request_id}\n\n"
            f"If you are available to help, please review the request using the secure link below:\n\n"
            f"{secure_link}\n\n"
            f"Thank you for saving lives."
        )

        status = "QUEUED"
        provider_ref = None
        error_msg = None

        if settings.WHATSAPP_SIMULATION_MODE or not settings.WHATSAPP_API_TOKEN:
            # Development Simulation Mode (clearly distinguished from actual carrier delivery)
            status = "SIMULATED"
            provider_ref = f"SIM-WA-{uuid.uuid4().hex[:10].upper()}"
        else:
            # Live Meta WhatsApp Business Cloud API Call
            url = f"https://graph.facebook.com/v19.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
            headers = {
                "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
                "Content-Type": "application/json"
            }
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": user.phone.replace("+", "").replace(" ", "").replace("-", ""),
                "type": "text",
                "text": {"body": message_body}
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code in [200, 201]:
                        res_data = resp.json()
                        provider_ref = res_data.get("messages", [{}])[0].get("id")
                        status = "SENT"
                    else:
                        status = "FAILED"
                        error_msg = f"HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                status = "FAILED"
                error_msg = str(e)

        notification = Notification(
            user_id=user.id,
            request_id=blood_request.id,
            channel="WHATSAPP",
            message_status=status,
            provider_reference=provider_ref,
            message_text=message_body,
            secure_link=secure_link,
            sent_at=utc_now(),
            delivered_at=utc_now() if status == "DELIVERED" else None,
            error_message=error_msg
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Broadcast real-time notification to user's websocket
        await ws_manager.broadcast_to_channel(
            f"user_{user.id}",
            {
                "type": "NEW_NOTIFICATION",
                "channel": "WHATSAPP",
                "status": status,
                "request_id": blood_request.request_id,
                "hospital": blood_request.hospital_name,
                "urgency": blood_request.urgency,
                "message": message_body,
                "secure_link": secure_link
            }
        )
        return notification

    @staticmethod
    async def send_sms_notification(
        db: AsyncSession,
        user: User,
        blood_request: BloodRequest
    ) -> Notification:
        """Send emergency SMS alert via MSG91 or Simulation mode."""
        secure_link = f"{settings.APP_BASE_URL}/donor/requests/{blood_request.id}"
        message_body = (
            f"DONOR LEAGUE: A blood request matching {blood_request.required_blood_group} "
            f"has been identified near {blood_request.hospital_name}. "
            f"Request ID: {blood_request.request_id}. Review securely: {secure_link}"
        )

        status = "QUEUED"
        provider_ref = None
        error_msg = None

        if settings.SMS_SIMULATION_MODE or not settings.MSG91_AUTH_KEY:
            status = "SIMULATED"
            provider_ref = f"SIM-SMS-{uuid.uuid4().hex[:10].upper()}"
        else:
            url = "https://control.msg91.com/api/v5/flow/"
            headers = {
                "authkey": settings.MSG91_AUTH_KEY,
                "content-type": "application/json"
            }
            payload = {
                "sender": settings.MSG91_SENDER_ID,
                "route": "4",
                "country": "91",
                "sms": [
                    {
                        "message": message_body,
                        "to": [user.phone.replace("+", "").replace(" ", "").replace("-", "")]
                    }
                ]
            }
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code in [200, 201]:
                        status = "SENT"
                        provider_ref = "MSG91-SENT"
                    else:
                        status = "FAILED"
                        error_msg = f"HTTP {resp.status_code}: {resp.text}"
            except Exception as e:
                status = "FAILED"
                error_msg = str(e)

        notification = Notification(
            user_id=user.id,
            request_id=blood_request.id,
            channel="SMS",
            message_status=status,
            provider_reference=provider_ref,
            message_text=message_body,
            secure_link=secure_link,
            sent_at=utc_now(),
            delivered_at=utc_now() if status == "DELIVERED" else None,
            error_message=error_msg
        )
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        await ws_manager.broadcast_to_channel(
            f"user_{user.id}",
            {
                "type": "NEW_NOTIFICATION",
                "channel": "SMS",
                "status": status,
                "request_id": blood_request.request_id,
                "message": message_body
            }
        )
        return notification

@router.get("/user/{user_id}")
async def get_user_notifications(user_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve full notification audit log for a specific user."""
    stmt = select(Notification).where(Notification.user_id == user_id).order_by(Notification.sent_at.desc())
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    return notifications

@router.get("/webhook/whatsapp")
async def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge")
):
    """Meta WhatsApp Cloud API verification challenge."""
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return int(hub_challenge) if hub_challenge and hub_challenge.isdigit() else hub_challenge
    raise HTTPException(status_code=403, detail="Verification token mismatch")

@router.post("/webhook/whatsapp")
async def receive_whatsapp_status_update(request: Request, db: AsyncSession = Depends(get_db)):
    """Meta WhatsApp delivery status callback webhook."""
    data = await request.json()
    try:
        entries = data.get("entry", [])
        for entry in entries:
            for change in entry.get("changes", []):
                value = change.get("value", {})
                statuses = value.get("statuses", [])
                for s in statuses:
                    msg_id = s.get("id")
                    status_name = s.get("status") # sent, delivered, read, failed
                    if msg_id and status_name:
                        stmt = select(Notification).where(Notification.provider_reference == msg_id)
                        res = await db.execute(stmt)
                        notif = res.scalars().first()
                        if notif:
                            notif.message_status = status_name.upper()
                            if status_name in ["delivered", "read"]:
                                notif.delivered_at = utc_now()
                            await db.commit()
    except Exception:
        pass
    return {"status": "received"}
