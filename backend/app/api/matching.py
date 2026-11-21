import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.models import BloodRequest, DonorMatch, DonorProfile, User
from app.schemas.schemas import MatchingResultsOut, MatchingDonorOut

router = APIRouter(prefix="/matching", tags=["Geographical Matching Engine"])

def protect_name(full_name: str) -> str:
    """Mask name for initial donor discovery privacy (e.g. 'Rahul Sharma' -> 'Rahul S.')."""
    parts = full_name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    return full_name

def fuzz_coordinates(lat: float, lon: float, donor_id: int) -> tuple:
    """
    Slightly offset donor coordinates (~300-600m) in a deterministic way
    to preserve donor home privacy on attendant discovery maps.
    """
    angle = (donor_id * 137.5) % 360 # Golden ratio offset
    rad = math.radians(angle)
    # Approx 0.0035 degrees is ~400 meters
    delta_lat = 0.0035 * math.sin(rad)
    delta_lon = 0.0035 * math.cos(rad)
    return round(lat + delta_lat, 5), round(lon + delta_lon, 5)

@router.get("/request/{request_id}", response_model=MatchingResultsOut)
async def get_request_matches(request_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve real-time geographical donor discovery results for a blood request.
    Includes hospital origin, search radius, approximate donor markers and proximity ranking.
    """
    stmt = select(BloodRequest).where(BloodRequest.id == request_id)
    req = (await db.execute(stmt)).scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    matches_stmt = (
        select(DonorMatch)
        .options(
            selectinload(DonorMatch.donor).selectinload(DonorProfile.user)
        )
        .where(DonorMatch.request_id == req.id)
        .order_by(DonorMatch.distance_km.asc())
    )
    matches = (await db.execute(matches_stmt)).scalars().all()

    donor_items = []
    for m in matches:
        donor = m.donor
        user = donor.user if donor else None
        if donor and user:
            fuzzed_lat, fuzzed_lon = fuzz_coordinates(donor.latitude, donor.longitude, donor.id)
            donor_items.append(
                MatchingDonorOut(
                    donor_id=donor.id,
                    donor_identifier=donor.donor_id,
                    display_name=protect_name(user.full_name),
                    blood_group=donor.blood_group,
                    distance_km=m.distance_km,
                    locality=donor.area or donor.city,
                    city=donor.city,
                    approx_latitude=fuzzed_lat,
                    approx_longitude=fuzzed_lon,
                    match_status=m.match_status,
                    notification_status="DELIVERED" if donor.whatsapp_consent or donor.sms_consent else "PENDING"
                )
            )

    return MatchingResultsOut(
        request_id=req.request_id,
        hospital_name=req.hospital_name,
        hospital_latitude=req.hospital_latitude,
        hospital_longitude=req.hospital_longitude,
        search_radius_km=req.current_search_radius_km,
        required_blood_group=req.required_blood_group,
        total_matches_found=len(donor_items),
        donors=donor_items
    )
