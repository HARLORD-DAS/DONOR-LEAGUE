from datetime import datetime, timezone
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import (
    User, DonorProfile, BloodRequest, DonorMatch, DonorResponse,
    Connection, DonationHistory, RequestTracking, AttendantProfile
)
from app.schemas.schemas import (
    DonorProfileOut, AvailabilityToggleRequest, DonorResponseAction,
    ConnectionOut, DonationHistoryOut
)
from app.api.websocket import ws_manager

router = APIRouter(prefix="/donors", tags=["Donor Operations"])

def utc_now():
    return datetime.now(timezone.utc)

@router.get("/profile", response_model=DonorProfileOut)
async def get_my_donor_profile(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    
    return DonorProfileOut(
        id=profile.id,
        user_id=user.id,
        donor_id=profile.donor_id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        blood_group=profile.blood_group,
        date_of_birth=profile.date_of_birth,
        gender=profile.gender,
        area=profile.area,
        city=profile.city,
        district=profile.district,
        state=profile.state,
        latitude=profile.latitude,
        longitude=profile.longitude,
        is_available=profile.is_available,
        whatsapp_consent=profile.whatsapp_consent,
        sms_consent=profile.sms_consent,
        created_at=profile.created_at
    )

@router.patch("/availability")
async def update_donor_availability(
    data: AvailabilityToggleRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle donor availability status between AVAILABLE and NOT AVAILABLE."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    profile.is_available = data.is_available
    profile.updated_at = utc_now()
    await db.commit()
    await db.refresh(profile)

    # Broadcast availability status update over websocket
    await ws_manager.broadcast_to_channel(
        f"donor_{profile.id}",
        {
            "type": "AVAILABILITY_UPDATED",
            "is_available": profile.is_available,
            "message": f"Availability updated to {'AVAILABLE' if profile.is_available else 'NOT AVAILABLE'}"
        }
    )

    return {
        "status": "success",
        "is_available": profile.is_available,
        "message": f"Your availability has been set to {'AVAILABLE' if profile.is_available else 'NOT AVAILABLE'}."
    }

@router.get("/requests/incoming")
async def get_incoming_requests(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Fetch matching blood donation requests identified for this donor."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    
    stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    # Fetch matches that haven't been responded to yet
    matches_stmt = (
        select(DonorMatch)
        .options(
            selectinload(DonorMatch.request).selectinload(BloodRequest.attendant)
        )
        .where(
            DonorMatch.donor_id == profile.id,
            DonorMatch.match_status.in_(["IDENTIFIED", "NOTIFIED"])
        )
        .order_by(DonorMatch.created_at.desc())
    )
    res = await db.execute(matches_stmt)
    matches = res.scalars().all()

    # Also check if already responded
    responses_stmt = select(DonorResponse.request_id).where(DonorResponse.donor_id == profile.id)
    responded_req_ids = set((await db.execute(responses_stmt)).scalars().all())

    items = []
    for m in matches:
        req = m.request
        if req and req.id not in responded_req_ids and req.status in ["SEARCHING", "MATCHED", "CONNECTED"]:
            items.append({
                "match_id": m.id,
                "request_id": req.id,
                "request_code": req.request_id,
                "required_blood_group": req.required_blood_group,
                "units_required": req.units_required,
                "urgency": req.urgency,
                "hospital_name": req.hospital_name,
                "hospital_address": req.hospital_address,
                "hospital_latitude": req.hospital_latitude,
                "hospital_longitude": req.hospital_longitude,
                "distance_km": m.distance_km,
                "required_date": req.required_date,
                "required_time": req.required_time,
                "instructions": req.instructions,
                "status": req.status,
                "created_at": req.created_at
            })
    return items

@router.get("/requests/{request_id}")
async def get_request_details_for_donor(
    request_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """View details of a specific blood donation request."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    
    dp_stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(dp_stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    stmt = select(BloodRequest).options(
        selectinload(BloodRequest.attendant).selectinload(AttendantProfile.user)
    ).where(BloodRequest.id == request_id)
    req = (await db.execute(stmt)).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    # Check response status
    resp_stmt = select(DonorResponse).where(
        DonorResponse.request_id == req.id,
        DonorResponse.donor_id == profile.id
    )
    my_response = (await db.execute(resp_stmt)).scalars().first()

    # Check connection status
    conn_stmt = select(Connection).where(
        Connection.request_id == req.id,
        Connection.donor_id == profile.id
    )
    connection = (await db.execute(conn_stmt)).scalars().first()

    # Distance
    match_stmt = select(DonorMatch).where(
        DonorMatch.request_id == req.id,
        DonorMatch.donor_id == profile.id
    )
    match_rec = (await db.execute(match_stmt)).scalars().first()
    distance_km = match_rec.distance_km if match_rec else 2.5

    data = {
        "id": req.id,
        "request_code": req.request_id,
        "required_blood_group": req.required_blood_group,
        "units_required": req.units_required,
        "urgency": req.urgency,
        "hospital_name": req.hospital_name,
        "hospital_address": req.hospital_address,
        "hospital_latitude": req.hospital_latitude,
        "hospital_longitude": req.hospital_longitude,
        "required_date": req.required_date,
        "required_time": req.required_time,
        "instructions": req.instructions,
        "status": req.status,
        "distance_km": distance_km,
        "my_response": my_response.response if my_response else None,
        "is_connected": connection is not None,
        "connection_id": connection.connection_id if connection else None
    }

    # Only share attendant contact if donor has accepted or request is connected
    if connection or (my_response and my_response.response == "ACCEPTED"):
        attendant_user = req.attendant.user if req.attendant else None
        data["attendant"] = {
            "name": req.attendant.name if req.attendant else "Attendant",
            "phone": attendant_user.phone if attendant_user else req.attendant.phone
        }

    return data

@router.post("/requests/{request_id}/respond")
async def respond_to_blood_request(
    request_id: int,
    action: DonorResponseAction,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Donor accepts or declines an emergency blood donation request."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    
    dp_stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(dp_stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    req_stmt = select(BloodRequest).options(
        selectinload(BloodRequest.attendant).selectinload(AttendantProfile.user)
    ).where(BloodRequest.id == request_id)
    request_obj = (await db.execute(req_stmt)).scalars().first()
    if not request_obj:
        raise HTTPException(status_code=404, detail="Blood request not found")

    if request_obj.status in ["FULFILLED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="This blood request is no longer active.")

    # Check if already responded
    existing_resp_stmt = select(DonorResponse).where(
        DonorResponse.request_id == request_obj.id,
        DonorResponse.donor_id == profile.id
    )
    existing_resp = (await db.execute(existing_resp_stmt)).scalars().first()
    if existing_resp:
        raise HTTPException(
            status_code=400,
            detail=f"You have already {existing_resp.response.lower()} this request."
        )

    # Record the response
    new_response = DonorResponse(
        request_id=request_obj.id,
        donor_id=profile.id,
        response=action.response,
        response_timestamp=utc_now()
    )
    db.add(new_response)

    # Update match status
    match_stmt = select(DonorMatch).where(
        DonorMatch.request_id == request_obj.id,
        DonorMatch.donor_id == profile.id
    )
    match_rec = (await db.execute(match_stmt)).scalars().first()
    if match_rec:
        match_rec.match_status = "RESPONDED"

    connection_data = None
    if action.response == "ACCEPTED":
        # Create connection between Donor and Attendant
        year = datetime.now(timezone.utc).year
        conn_code = f"DL-CONN-{year}-{random.randint(1000, 9999)}"
        connection = Connection(
            connection_id=conn_code,
            donor_id=profile.id,
            attendant_id=request_obj.attendant_id,
            request_id=request_obj.id,
            connection_status="CONNECTED",
            contact_shared=True,
            fulfilment_status="PENDING"
        )
        db.add(connection)

        # Update blood request status
        request_obj.status = "CONNECTED"

        # Add tracking step
        tracking_step = RequestTracking(
            request_id=request_obj.id,
            stage=8,
            status="DONOR_ACCEPTED",
            description=f"Donor {profile.donor_id} accepted the blood request. Donor-attendant coordination initiated.",
            timestamp=utc_now()
        )
        db.add(tracking_step)

        await db.commit()
        await db.refresh(connection)

        # Notify Attendant in real-time
        attendant_user = request_obj.attendant.user if request_obj.attendant else None
        if attendant_user:
            await ws_manager.broadcast_to_channel(
                f"user_{attendant_user.id}",
                {
                    "type": "DONOR_ACCEPTED",
                    "request_id": request_obj.request_id,
                    "donor_id": profile.donor_id,
                    "donor_name": user.full_name,
                    "donor_phone": user.phone,
                    "blood_group": profile.blood_group,
                    "hospital": request_obj.hospital_name,
                    "connection_id": connection.connection_id
                }
            )

        connection_data = {
            "connection_id": connection.connection_id,
            "attendant_name": request_obj.attendant.name if request_obj.attendant else "Attendant",
            "attendant_phone": attendant_user.phone if attendant_user else "",
            "hospital_name": request_obj.hospital_name,
            "hospital_address": request_obj.hospital_address,
            "hospital_latitude": request_obj.hospital_latitude,
            "hospital_longitude": request_obj.hospital_longitude,
            "acceptance_timestamp": utc_now().isoformat()
        }
    else:
        # Declined
        await db.commit()

    return {
        "status": "success",
        "action": action.response,
        "message": "You have successfully accepted the blood donation request." if action.response == "ACCEPTED" else "You have declined this request.",
        "connection": connection_data
    }

@router.get("/requests/accepted", response_model=List[ConnectionOut])
async def get_my_accepted_requests(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """View all accepted requests and active connections for this donor."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    
    dp_stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(dp_stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    stmt = (
        select(Connection)
        .options(
            selectinload(Connection.request),
            selectinload(Connection.attendant).selectinload(AttendantProfile.user)
        )
        .where(Connection.donor_id == profile.id)
        .order_by(Connection.created_at.desc())
    )
    connections = (await db.execute(stmt)).scalars().all()
    results = []
    for c in connections:
        attendant_user = c.attendant.user if c.attendant else None
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
                attendant_name=c.attendant.name if c.attendant else "Attendant",
                attendant_phone=attendant_user.phone if attendant_user else "",
                hospital_name=c.request.hospital_name if c.request else "",
                hospital_address=c.request.hospital_address if c.request else "",
                hospital_latitude=c.request.hospital_latitude if c.request else None,
                hospital_longitude=c.request.hospital_longitude if c.request else None,
                request_code=c.request.request_id if c.request else ""
            )
        )
    return results

@router.get("/history", response_model=List[DonationHistoryOut])
async def get_donation_history(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Fetch completed donation history for this donor."""
    if user.role != "donor":
        raise HTTPException(status_code=403, detail="Access reserved for donors")
    
    dp_stmt = select(DonorProfile).where(DonorProfile.user_id == user.id)
    profile = (await db.execute(dp_stmt)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    stmt = select(DonationHistory).where(DonationHistory.donor_id == profile.id).order_by(DonationHistory.confirmation_timestamp.desc())
    history = (await db.execute(stmt)).scalars().all()
    return history
