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
    User, AttendantProfile, BloodRequest, RequestTracking, DonorMatch,
    DonorProfile, Connection
)
from app.schemas.schemas import (
    BloodRequestCreate, BloodRequestOut, ExpandRadiusRequest,
    RequestTrackingStep
)
from app.api.osm_geo import haversine_distance
from app.api.notifications import NotificationService
from app.api.websocket import ws_manager

router = APIRouter(prefix="/requests", tags=["Blood Requests"])

def utc_now():
    return datetime.now(timezone.utc)

def generate_request_id() -> str:
    year = datetime.now(timezone.utc).year
    rand_num = random.randint(1000, 9999)
    return f"DL-REQ-{year}-{rand_num}"

# Blood group compatibility matrix (for donor identification discovery)
BLOOD_COMPATIBILITY = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["A-", "B-", "AB-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
}

async def execute_donor_matching(
    db: AsyncSession,
    blood_request: BloodRequest,
    radius_km: float
) -> List[DonorMatch]:
    """
    Automatic geographical donor discovery:
    1. Filter by blood group compatibility
    2. Check donor availability toggle (is_available == True)
    3. Check active account status
    4. Calculate Haversine distance from confirmed hospital coordinates
    5. Filter within radius_km
    6. Sort by proximity
    7. Save matches & trigger notifications for consenting donors
    """
    eligible_blood_groups = BLOOD_COMPATIBILITY.get(blood_request.required_blood_group, [blood_request.required_blood_group])

    stmt = (
        select(DonorProfile)
        .options(selectinload(DonorProfile.user))
        .join(User, DonorProfile.user_id == User.id)
        .where(
            User.account_status == "active",
            DonorProfile.is_available == True,
            DonorProfile.blood_group.in_(eligible_blood_groups)
        )
    )
    res = await db.execute(stmt)
    candidate_donors = res.scalars().all()

    # Existing matches for this request (to prevent duplicates)
    exist_stmt = select(DonorMatch.donor_id).where(DonorMatch.request_id == blood_request.id)
    existing_donor_ids = set((await db.execute(exist_stmt)).scalars().all())

    new_matches = []
    h_lat = blood_request.hospital_latitude
    h_lon = blood_request.hospital_longitude

    for donor in candidate_donors:
        dist = haversine_distance(h_lat, h_lon, donor.latitude, donor.longitude)
        if dist <= radius_km:
            if donor.id not in existing_donor_ids:
                match = DonorMatch(
                    request_id=blood_request.id,
                    donor_id=donor.id,
                    distance_km=dist,
                    search_radius_km=radius_km,
                    match_status="IDENTIFIED"
                )
                db.add(match)
                new_matches.append((match, donor, dist))

    await db.flush()

    # Order matches by proximity
    new_matches.sort(key=lambda x: x[2])

    # Send notifications (WhatsApp and/or SMS)
    for match, donor, dist in new_matches:
        if donor.whatsapp_consent:
            await NotificationService.send_whatsapp_request_notification(
                db=db,
                user=donor.user,
                donor_name=donor.user.full_name,
                blood_request=blood_request,
                distance_km=dist
            )
            match.match_status = "NOTIFIED"
        elif donor.sms_consent:
            await NotificationService.send_sms_notification(
                db=db,
                user=donor.user,
                blood_request=blood_request
            )
            match.match_status = "NOTIFIED"

    await db.commit()
    return [m[0] for m in new_matches]

@router.post("", response_model=BloodRequestOut, status_code=status.HTTP_201_CREATED)
async def create_blood_request(
    data: BloodRequestCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Attendant submits a new emergency blood request with confirmed OpenStreetMap hospital coordinates.
    Immediately initiates automatic geographical donor matching.
    """
    if user.role != "attendant":
        raise HTTPException(status_code=403, detail="Only attendants can submit blood requests")

    stmt = select(AttendantProfile).where(AttendantProfile.user_id == user.id)
    attendant = (await db.execute(stmt)).scalars().first()
    if not attendant:
        raise HTTPException(status_code=404, detail="Attendant profile not found")

    request_id = generate_request_id()
    search_radius = data.initial_search_radius_km or 5.0

    blood_req = BloodRequest(
        request_id=request_id,
        attendant_id=attendant.id,
        patient_reference=data.patient_reference.strip(),
        required_blood_group=data.required_blood_group.upper(),
        units_required=data.units_required,
        urgency=data.urgency,
        hospital_name=data.hospital_name.strip(),
        hospital_address=data.hospital_address.strip(),
        hospital_city=data.hospital_city.strip(),
        hospital_district=data.hospital_district.strip() if data.hospital_district else None,
        hospital_state=data.hospital_state.strip() if data.hospital_state else None,
        hospital_latitude=data.hospital_latitude,
        hospital_longitude=data.hospital_longitude,
        required_date=data.required_date,
        required_time=data.required_time,
        instructions=data.instructions.strip() if data.instructions else None,
        status="SEARCHING",
        current_search_radius_km=search_radius
    )
    db.add(blood_req)
    await db.flush()

    # Multi-stage request tracking initialization
    steps = [
        RequestTracking(request_id=blood_req.id, stage=1, status="REQUEST_SUBMITTED", description="Blood request successfully registered in system.", timestamp=utc_now()),
        RequestTracking(request_id=blood_req.id, stage=2, status="HOSPITAL_LOCATION_CONFIRMED", description=f"Hospital coordinates confirmed: {blood_req.hospital_name} ({blood_req.hospital_latitude}, {blood_req.hospital_longitude}).", timestamp=utc_now()),
        RequestTracking(request_id=blood_req.id, stage=3, status="GEOGRAPHICAL_SEARCH_STARTED", description=f"Automatic geographical discovery initiated within {search_radius} km radius.", timestamp=utc_now())
    ]
    for s in steps:
        db.add(s)
    await db.commit()
    await db.refresh(blood_req)

    # Trigger automatic matching
    matches = await execute_donor_matching(db, blood_req, search_radius)
    
    # Update stage 4
    tracking_4 = RequestTracking(
        request_id=blood_req.id,
        stage=4,
        status="DONORS_IDENTIFIED",
        description=f"Identified {len(matches)} matching and available donors within {search_radius} km.",
        timestamp=utc_now()
    )
    db.add(tracking_4)

    # Update stage 5 & 6
    if matches:
        tracking_5 = RequestTracking(
            request_id=blood_req.id,
            stage=5,
            status="NOTIFICATIONS_DISPATCHED",
            description=f"Dispatched secure WhatsApp and SMS alert notifications to consenting donors.",
            timestamp=utc_now()
        )
        db.add(tracking_5)
        blood_req.status = "MATCHED"

    await db.commit()
    await db.refresh(blood_req)

    return BloodRequestOut(
        id=blood_req.id,
        request_id=blood_req.request_id,
        attendant_id=blood_req.attendant_id,
        patient_reference=blood_req.patient_reference,
        required_blood_group=blood_req.required_blood_group,
        units_required=blood_req.units_required,
        urgency=blood_req.urgency,
        hospital_name=blood_req.hospital_name,
        hospital_address=blood_req.hospital_address,
        hospital_city=blood_req.hospital_city,
        hospital_latitude=blood_req.hospital_latitude,
        hospital_longitude=blood_req.hospital_longitude,
        required_date=blood_req.required_date,
        required_time=blood_req.required_time,
        instructions=blood_req.instructions,
        status=blood_req.status,
        current_search_radius_km=blood_req.current_search_radius_km,
        created_at=blood_req.created_at,
        attendant_name=attendant.name,
        attendant_phone=attendant.phone
    )

@router.get("/{request_id}", response_model=BloodRequestOut)
async def get_blood_request(request_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(BloodRequest).options(
        selectinload(BloodRequest.attendant)
    ).where(BloodRequest.id == request_id)
    req = (await db.execute(stmt)).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")
    
    return BloodRequestOut(
        id=req.id,
        request_id=req.request_id,
        attendant_id=req.attendant_id,
        patient_reference=req.patient_reference,
        required_blood_group=req.required_blood_group,
        units_required=req.units_required,
        urgency=req.urgency,
        hospital_name=req.hospital_name,
        hospital_address=req.hospital_address,
        hospital_city=req.hospital_city,
        hospital_latitude=req.hospital_latitude,
        hospital_longitude=req.hospital_longitude,
        required_date=req.required_date,
        required_time=req.required_time,
        instructions=req.instructions,
        status=req.status,
        current_search_radius_km=req.current_search_radius_km,
        created_at=req.created_at,
        attendant_name=req.attendant.name if req.attendant else "",
        attendant_phone=req.attendant.phone if req.attendant else ""
    )

@router.post("/{request_id}/expand-radius")
async def expand_request_radius(
    request_id: int,
    data: ExpandRadiusRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Expand search radius (e.g. 10km, 25km, 50km) and run fresh discovery."""
    stmt = select(BloodRequest).where(BloodRequest.id == request_id)
    req = (await db.execute(stmt)).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    old_radius = req.current_search_radius_km
    req.current_search_radius_km = data.new_radius_km
    req.status = "SEARCHING"

    # Add tracking step
    track = RequestTracking(
        request_id=req.id,
        stage=3,
        status="RADIUS_EXPANDED",
        description=f"Attendant expanded search radius from {old_radius} km to {data.new_radius_km} km.",
        timestamp=utc_now()
    )
    db.add(track)
    await db.commit()

    # Execute matching for new radius
    new_matches = await execute_donor_matching(db, req, data.new_radius_km)

    return {
        "status": "success",
        "request_id": req.request_id,
        "new_radius_km": data.new_radius_km,
        "new_donors_found": len(new_matches),
        "message": f"Search radius successfully expanded to {data.new_radius_km} km."
    }

@router.get("/{request_id}/tracking", response_model=List[RequestTrackingStep])
async def get_request_tracking_steps(request_id: int, db: AsyncSession = Depends(get_db)):
    """Fetch complete live timeline of all 13 stages for a blood request."""
    stmt = select(RequestTracking).where(RequestTracking.request_id == request_id).order_by(RequestTracking.timestamp.asc())
    steps = (await db.execute(stmt)).scalars().all()
    return steps
