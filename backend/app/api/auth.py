from datetime import datetime, timezone
import random
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.models.models import User, DonorProfile, AttendantProfile
from app.schemas.schemas import (
    DonorRegisterRequest, AttendantRegisterRequest, LoginRequest,
    Token, DonorProfileOut, AttendantProfileOut,
    SignUpRequest, SelectRoleRequest, DonorProfileCompletionRequest, AttendantProfileCompletionRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def generate_id(prefix: str) -> str:
    year = datetime.now(timezone.utc).year
    rand_num = random.randint(1000, 9999)
    return f"DL-{prefix}-{year}-{rand_num}"

async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token"
        )
    user_id = int(payload.get("sub"))
    stmt = select(User).options(
        selectinload(User.donor_profile),
        selectinload(User.attendant_profile)
    ).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return user

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(data: SignUpRequest, db: AsyncSession = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    clean_email = data.email.lower().strip()
    clean_phone = data.mobile_number.strip().replace(" ", "").replace("-", "")

    # Check unique email
    stmt = select(User).where(User.email == clean_email)
    existing_email = (await db.execute(stmt)).scalars().first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    # Check unique phone
    stmt = select(User).where(User.phone == clean_phone)
    existing_phone = (await db.execute(stmt)).scalars().first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="An account with this mobile number already exists")

    user = User(
        full_name=data.full_name.strip(),
        email=clean_email,
        phone=clean_phone,
        password_hash=get_password_hash(data.password),
        role="pending",
        account_status="active"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(subject=user.id, role="pending")
    return Token(
        access_token=token,
        role="pending",
        user_id=user.id,
        profile_id=0,
        name=user.full_name,
        identifier="",
        profile_completed=False
    )

@router.post("/select-role")
async def select_role(
    data: SelectRoleRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Allow authenticated user with 'pending' status to select their role ('donor' or 'attendant').
    Once a role is selected and saved permanently in the database, subsequent changes are prevented.
    """
    if user.role != "pending":
        if user.role == data.role:
            return {
                "status": "success",
                "role": user.role,
                "message": f"Role is already set to {user.role}"
            }
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role is already permanently set to '{user.role}' and cannot be changed."
        )

    user.role = data.role
    await db.commit()
    await db.refresh(user)

    new_token = create_access_token(subject=user.id, role=user.role)
    return {
        "status": "success",
        "role": user.role,
        "access_token": new_token,
        "message": f"Role successfully selected as {user.role}."
    }

@router.post("/complete-profile/donor", response_model=Token, status_code=status.HTTP_201_CREATED)
async def complete_donor_profile(
    data: DonorProfileCompletionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "donor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot complete donor profile for an account with role '{user.role}'"
        )
    
    if user.donor_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donor profile has already been completed for this account."
        )

    donor_id = generate_id("D")
    profile = DonorProfile(
        user_id=user.id,
        donor_id=donor_id,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        blood_group=data.blood_group.upper(),
        address=data.residential_address.strip(),
        area=data.area.strip() if data.area else None,
        city=data.city.strip(),
        district=data.district.strip(),
        state=data.state.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        location_accuracy=data.location_accuracy,
        location_source=data.location_source or "osm_geocode",
        is_available=True,
        whatsapp_consent=data.whatsapp_consent,
        sms_consent=data.sms_consent,
        terms_consent=data.terms_consent
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    token = create_access_token(subject=user.id, role="donor")
    return Token(
        access_token=token,
        role="donor",
        user_id=user.id,
        profile_id=profile.id,
        name=user.full_name,
        identifier=profile.donor_id,
        profile_completed=True
    )

@router.post("/complete-profile/attendant", response_model=Token, status_code=status.HTTP_201_CREATED)
async def complete_attendant_profile(
    data: AttendantProfileCompletionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if user.role != "attendant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot complete attendant profile for an account with role '{user.role}'"
        )
    
    if user.attendant_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendant profile has already been completed for this account."
        )

    attendant_id = generate_id("A")
    profile = AttendantProfile(
        user_id=user.id,
        attendant_id=attendant_id,
        name=user.full_name,
        phone=user.phone,
        city=data.city.strip(),
        state=data.state.strip()
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    token = create_access_token(subject=user.id, role="attendant")
    return Token(
        access_token=token,
        role="attendant",
        user_id=user.id,
        profile_id=profile.id,
        name=user.full_name,
        identifier=profile.attendant_id,
        profile_completed=True
    )

@router.post("/register/donor", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_donor(data: DonorRegisterRequest, db: AsyncSession = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # Check unique email
    stmt = select(User).where(User.email == data.email.lower().strip())
    existing_email = (await db.execute(stmt)).scalars().first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    # Check unique phone
    clean_phone = data.mobile_number.strip().replace(" ", "")
    stmt = select(User).where(User.phone == clean_phone)
    existing_phone = (await db.execute(stmt)).scalars().first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="An account with this mobile number already exists")

    user = User(
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=clean_phone,
        password_hash=get_password_hash(data.password),
        role="donor",
        account_status="active"
    )
    db.add(user)
    await db.flush()

    donor_id = generate_id("D")
    profile = DonorProfile(
        user_id=user.id,
        donor_id=donor_id,
        date_of_birth=data.date_of_birth,
        gender=data.gender,
        blood_group=data.blood_group.upper(),
        address=data.residential_address.strip(),
        area=data.area.strip() if data.area else None,
        city=data.city.strip(),
        district=data.district.strip(),
        state=data.state.strip(),
        latitude=data.latitude,
        longitude=data.longitude,
        location_accuracy=data.location_accuracy,
        location_source=data.location_source or "osm_geocode",
        is_available=True,
        whatsapp_consent=data.whatsapp_consent,
        sms_consent=data.sms_consent,
        terms_consent=data.terms_consent
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    await db.refresh(profile)

    token = create_access_token(subject=user.id, role="donor")
    return Token(
        access_token=token,
        role="donor",
        user_id=user.id,
        profile_id=profile.id,
        name=user.full_name,
        identifier=profile.donor_id
    )

@router.post("/register/attendant", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_attendant(data: AttendantRegisterRequest, db: AsyncSession = Depends(get_db)):
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    stmt = select(User).where(User.email == data.email.lower().strip())
    existing_email = (await db.execute(stmt)).scalars().first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists")

    clean_phone = data.mobile_number.strip().replace(" ", "")
    stmt = select(User).where(User.phone == clean_phone)
    existing_phone = (await db.execute(stmt)).scalars().first()
    if existing_phone:
        raise HTTPException(status_code=400, detail="An account with this mobile number already exists")

    user = User(
        full_name=data.full_name.strip(),
        email=data.email.lower().strip(),
        phone=clean_phone,
        password_hash=get_password_hash(data.password),
        role="attendant",
        account_status="active"
    )
    db.add(user)
    await db.flush()

    attendant_id = generate_id("A")
    profile = AttendantProfile(
        user_id=user.id,
        attendant_id=attendant_id,
        name=data.full_name.strip(),
        phone=clean_phone,
        city=data.city.strip(),
        state=data.state.strip()
    )
    db.add(profile)
    await db.commit()
    await db.refresh(user)
    await db.refresh(profile)

    token = create_access_token(subject=user.id, role="attendant")
    return Token(
        access_token=token,
        role="attendant",
        user_id=user.id,
        profile_id=profile.id,
        name=user.full_name,
        identifier=profile.attendant_id
    )

@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    query_str = data.email_or_phone.strip().lower()
    clean_phone = query_str.replace(" ", "").replace("-", "")
    stmt = select(User).options(
        selectinload(User.donor_profile),
        selectinload(User.attendant_profile)
    ).where(
        (User.email == query_str) | (User.phone == query_str) | (User.phone == clean_phone)
    )
    res = await db.execute(stmt)
    user = res.scalars().first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/phone and password."
        )

    if user.account_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive or suspended. Please contact support."
        )

    profile_id = 0
    identifier = ""
    profile_completed = False
    if user.role == "donor" and user.donor_profile:
        profile_id = user.donor_profile.id
        identifier = user.donor_profile.donor_id
        profile_completed = True
    elif user.role == "attendant" and user.attendant_profile:
        profile_id = user.attendant_profile.id
        identifier = user.attendant_profile.attendant_id
        profile_completed = True

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        role=user.role,
        user_id=user.id,
        profile_id=profile_id,
        name=user.full_name,
        identifier=identifier,
        profile_completed=profile_completed
    )

@router.get("/me")
async def get_current_user_profile(user: User = Depends(get_current_user)):
    profile_completed = False
    if user.role == "donor" and user.donor_profile:
        profile_completed = True
    elif user.role == "attendant" and user.attendant_profile:
        profile_completed = True

    data = {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "account_status": user.account_status,
        "created_at": user.created_at,
        "profile_completed": profile_completed
    }
    if user.role == "donor" and user.donor_profile:
        dp = user.donor_profile
        data["donor_profile"] = {
            "id": dp.id,
            "donor_id": dp.donor_id,
            "blood_group": dp.blood_group,
            "date_of_birth": dp.date_of_birth,
            "gender": dp.gender,
            "area": dp.area,
            "city": dp.city,
            "district": dp.district,
            "state": dp.state,
            "latitude": dp.latitude,
            "longitude": dp.longitude,
            "is_available": dp.is_available,
            "whatsapp_consent": dp.whatsapp_consent,
            "sms_consent": dp.sms_consent
        }
    elif user.role == "attendant" and user.attendant_profile:
        ap = user.attendant_profile
        data["attendant_profile"] = {
            "id": ap.id,
            "attendant_id": ap.attendant_id,
            "city": ap.city,
            "state": ap.state
        }
    return data
