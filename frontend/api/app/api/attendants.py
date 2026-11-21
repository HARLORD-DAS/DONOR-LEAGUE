from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import (
    User, AttendantProfile, BloodRequest, Connection, DonorProfile,
    DonationHistory, RequestTracking
)
from app.schemas.schemas import AttendantProfileOut, BloodRequestOut, ConnectionOut
from app.api.websocket import ws_manager

router = APIRouter(prefix="/attendants", tags=["Attendant Operations"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/profile", response_model=AttendantProfileOut)
async def get_attendant_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Access reserved for attendants")
    stmt = select(AttendantProfile).where(AttendantProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Attendant profile not found")

    return AttendantProfileOut(
        id=profile.id,
        user_id=user.id,
        attendant_id=profile.attendant_id,
        name=profile.name,
        email=user.email,
        phone=profile.phone,
        city=profile.city,
        state=profile.state,
        created_at=profile.created_at
    )

@router.get("/requests/active", response_model=List[BloodRequestOut])
async def get_active_requests(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Access reserved for attendants")
    stmt = select(AttendantProfile).where(AttendantProfile.user_id == user.id)
    attendant = (await db.execute(stmt)).scalars().first()
    if not attendant:
        raise HTTPException(status_code=404, detail="Attendant profile not found")

    req_stmt = (
        select(BloodRequest)
        .where(
            BloodRequest.attendant_id == attendant.id,
            BloodRequest.status.in_(["SUBMITTED", "SEARCHING", "MATCHED", "CONNECTED"])
        )
        .order_by(BloodRequest.created_at.desc())
    )
    requests = (await db.execute(req_stmt)).scalars().all()
    return [
        BloodRequestOut(
            id=r.id,
            request_id=r.request_id,
            attendant_id=r.attendant_id,
            patient_reference=r.patient_reference,
            required_blood_group=r.required_blood_group,
            units_required=r.units_required,
            urgency=r.urgency,
            hospital_name=r.hospital_name,
            hospital_address=r.hospital_address,
            hospital_city=r.hospital_city,
            hospital_latitude=r.hospital_latitude,
            hospital_longitude=r.hospital_longitude,
            required_date=r.required_date,
            required_time=r.required_time,
            instructions=r.instructions,
            status=r.status,
            current_search_radius_km=r.current_search_radius_km,
            created_at=r.created_at,
            attendant_name=attendant.name,
            attendant_phone=attendant.phone
        )
        for r in requests
    ]

@router.get("/requests/history", response_model=List[BloodRequestOut])
async def get_request_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Access reserved for attendants")
    stmt = select(AttendantProfile).where(AttendantProfile.user_id == user.id)
    attendant = (await db.execute(stmt)).scalars().first()
    if not attendant:
        raise HTTPException(status_code=404, detail="Attendant profile not found")

    req_stmt = select(BloodRequest).where(BloodRequest.attendant_id == attendant.id).order_by(BloodRequest.created_at.desc())
    requests = (await db.execute(req_stmt)).scalars().all()
    return [
        BloodRequestOut(
            id=r.id,
            request_id=r.request_id,
            attendant_id=r.attendant_id,
            patient_reference=r.patient_reference,
            required_blood_group=r.required_blood_group,
            units_required=r.units_required,
            urgency=r.urgency,
            hospital_name=r.hospital_name,
            hospital_address=r.hospital_address,
            hospital_city=r.hospital_city,
            hospital_latitude=r.hospital_latitude,
            hospital_longitude=r.hospital_longitude,
            required_date=r.required_date,
            required_time=r.required_time,
            instructions=r.instructions,
            status=r.status,
            current_search_radius_km=r.current_search_radius_km,
            created_at=r.created_at,
            attendant_name=attendant.name,
            attendant_phone=attendant.phone
        )
        for r in requests
    ]

@router.get("/connections", response_model=List[ConnectionOut])
async def get_attendant_connections(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """View all connected donors who accepted blood requests for this attendant."""
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Access reserved for attendants")
    stmt = select(AttendantProfile).where(AttendantProfile.user_id == user.id)
    attendant = (await db.execute(stmt)).scalars().first()
    if not attendant:
        raise HTTPException(status_code=404, detail="Attendant profile not found")

    conn_stmt = (
        select(Connection)
        .options(
            selectinload(Connection.request),
            selectinload(Connection.donor).selectinload(DonorProfile.user)
        )
        .where(Connection.attendant_id == attendant.id)
        .order_by(Connection.created_at.desc())
    )
    connections = (await db.execute(conn_stmt)).scalars().all()

    results = []
    for c in connections:
        donor_user = c.donor.user if c.donor else None
        donor_locality = f"{c.donor.area or c.donor.city}, {c.donor.state}" if c.donor else ""
        results.append(
            ConnectionOut(
                id=c.id,
                connection_id=c.connection_id,
                donor_id=c.donor_id,
                attendant_id=c.attendant_id,
                request_id=c.request_id,
                connection_status=c.connection_status,
                contact_shared=c.contact_shared,
                fulfilment_status=c.fulfilment_status,
                created_at=c.created_at,
                donor_name=donor_user.full_name if donor_user else "Authorized Donor",
                donor_phone=donor_user.phone if donor_user and c.contact_shared else "",
                donor_blood_group=c.donor.blood_group if c.donor else "",
                donor_locality=donor_locality,
                hospital_name=c.request.hospital_name if c.request else "",
                hospital_address=c.request.hospital_address if c.request else "",
                hospital_latitude=c.request.hospital_latitude if c.request else None,
                hospital_longitude=c.request.hospital_longitude if c.request else None,
                request_code=c.request.request_id if c.request else ""
            )
        )
    return results

@router.post("/requests/{request_id}/confirm-fulfillment")
async def confirm_blood_fulfillment(
    request_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Attendant explicitly confirms that the blood donation has been fulfilled at the hospital.
    Persists donation history record and closes request loop.
    """
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Access reserved for attendants")
    
    req_stmt = (
        select(BloodRequest)
        .options(
            selectinload(BloodRequest.connections).selectinload(Connection.donor).selectinload(DonorProfile.user)
        )
        .where(BloodRequest.id == request_id)
    )
    req = (await db.execute(req_stmt)).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    req.status = "FULFILLED"

    # Update all active connections
    for conn in req.connections:
        conn.connection_status = "COMPLETED"
        conn.fulfilment_status = "FULFILLED"

        # Record in donation history for each connected donor
        history_item = DonationHistory(
            donor_id=conn.donor_id,
            request_id=req.id,
            hospital_name=req.hospital_name,
            units_donated=1,
            fulfilment_status="FULFILLED",
            confirmation_timestamp=utc_now()
        )
        db.add(history_item)

        # Notify donor via WebSocket
        donor_user = conn.donor.user if conn.donor else None
        if donor_user:
            await ws_manager.broadcast_to_channel(
                f"user_{donor_user.id}",
                {
                    "type": "DONATION_FULFILLED",
                    "request_id": req.request_id,
                    "hospital": req.hospital_name,
                    "message": f"Thank you! Your blood donation for request {req.request_id} has been confirmed fulfilled."
                }
            )

    # Add stage 12 tracking
    track = RequestTracking(
        request_id=req.id,
        stage=12,
        status="FULFILMENT_CONFIRMED",
        description=f"Blood donation confirmed fulfilled at {req.hospital_name}. Request successfully closed.",
        timestamp=utc_now()
    )
    db.add(track)

    await db.commit()
    return {
        "status": "success",
        "message": f"Request {req.request_id} successfully confirmed as fulfilled.",
        "request_status": "FULFILLED"
    }
