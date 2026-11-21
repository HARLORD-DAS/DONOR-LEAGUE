from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.future import select
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.models import User, DonorProfile, AttendantProfile
from app.api.auth import router as auth_router
from app.api.donors import router as donors_router
from app.api.attendants import router as attendants_router
from app.api.requests import router as requests_router
from app.api.matching import router as matching_router
from app.api.notifications import router as notifications_router
from app.api.osm_geo import router as osm_geo_router
from app.api.websocket import router as ws_router

async def seed_initial_donors():
    """Seed initial realistic donor database for immediate live testing and matching."""
    async with AsyncSessionLocal() as session:
        check_user = await session.execute(select(User).limit(1))
        if check_user.scalars().first():
            return # Already seeded

        # Realistic donors around Bangalore central hospitals (lat 12.9716, lon 77.5946)
        seed_donors = [
            {
                "name": "Arjun Mehta",
                "email": "arjun.donor@donorleague.org",
                "phone": "+919876543210",
                "blood": "O+",
                "lat": 12.9740,
                "lon": 77.5980,
                "area": "MG Road",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            },
            {
                "name": "Priya Sharma",
                "email": "priya.donor@donorleague.org",
                "phone": "+919876543211",
                "blood": "A+",
                "lat": 12.9690,
                "lon": 77.6020,
                "area": "Richmond Town",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            },
            {
                "name": "Karthik Nair",
                "email": "karthik.donor@donorleague.org",
                "phone": "+919876543212",
                "blood": "B+",
                "lat": 12.9800,
                "lon": 77.5920,
                "area": "Shivajinagar",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            },
            {
                "name": "Ananya Desai",
                "email": "ananya.donor@donorleague.org",
                "phone": "+919876543213",
                "blood": "O-",
                "lat": 12.9550,
                "lon": 77.6100,
                "area": "Koramangala",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            },
            {
                "name": "Rohan Verma",
                "email": "rohan.donor@donorleague.org",
                "phone": "+919876543214",
                "blood": "AB+",
                "lat": 12.9850,
                "lon": 77.6050,
                "area": "Ulsoor",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            },
            {
                "name": "Sneha Patil",
                "email": "sneha.donor@donorleague.org",
                "phone": "+919876543215",
                "blood": "O+",
                "lat": 12.9600,
                "lon": 77.5850,
                "area": "Lalbagh West",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "available": True
            }
        ]

        for i, d in enumerate(seed_donors):
            u = User(
                full_name=d["name"],
                email=d["email"],
                phone=d["phone"],
                password_hash=get_password_hash("DonorPass@123"),
                role="donor",
                account_status="active"
            )
            session.add(u)
            await session.flush()

            dp = DonorProfile(
                user_id=u.id,
                donor_id=f"DL-D-2026-100{i+1}",
                date_of_birth="1995-05-15",
                gender="Not Disclosed",
                blood_group=d["blood"],
                address=f"Flat {101+i}, Green View Apts, {d['area']}",
                area=d["area"],
                city=d["city"],
                district=d["district"],
                state=d["state"],
                latitude=d["lat"],
                longitude=d["lon"],
                location_accuracy=10.0,
                location_source="osm_geocode",
                is_available=d["available"],
                whatsapp_consent=True,
                sms_consent=True,
                terms_consent=True
            )
            session.add(dp)

        # Also seed a sample attendant for quick testing
        att_u = User(
            full_name="Deepak Joshi",
            email="attendant@donorleague.org",
            phone="+919811122233",
            password_hash=get_password_hash("AttendantPass@123"),
            role="attendant",
            account_status="active"
        )
        session.add(att_u)
        await session.flush()

        ap = AttendantProfile(
            user_id=att_u.id,
            attendant_id="DL-A-2026-2001",
            name=att_u.full_name,
            phone=att_u.phone,
            city="Bengaluru",
            state="Karnataka"
        )
        session.add(ap)

        await session.commit()

from fastapi.responses import JSONResponse
import traceback

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import ensure_db
    await ensure_db()
    yield
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Location-Based Blood Donor Identification & Coordination Platform",
    lifespan=lifespan
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("Unhandled Server Error:", exc)
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(donors_router, prefix=settings.API_V1_STR)
app.include_router(attendants_router, prefix=settings.API_V1_STR)
app.include_router(requests_router, prefix=settings.API_V1_STR)
app.include_router(matching_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(osm_geo_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "osm_mcp_integrated": True,
        "roles_supported": ["DONOR", "ATTENDANT"],
        "docs_url": "/docs"
    }

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "service": "donor-league-backend"}
