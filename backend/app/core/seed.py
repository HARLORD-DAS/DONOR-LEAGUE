from sqlalchemy.future import select
from app.models.models import User, DonorProfile, AttendantProfile
from app.core.security import get_password_hash

async def seed_initial_donors_data(session):
    """Seed initial realistic donor database for immediate live testing and matching."""
    check_user = await session.execute(select(User).limit(1))
    if check_user.scalars().first():
        return

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
