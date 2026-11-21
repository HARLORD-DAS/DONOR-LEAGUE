from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    profile_id: int
    name: str
    identifier: str  # donor_id or attendant_id

class LoginRequest(BaseModel):
    email_or_phone: str
    password: str
    role: Optional[str] = None  # donor or attendant

class DonorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    date_of_birth: str
    gender: Optional[str] = None
    mobile_number: str = Field(..., min_length=8, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    blood_group: str = Field(..., pattern=r"^(A|B|AB|O)[+-]$")
    state: str
    district: str
    city: str
    area: Optional[str] = None
    residential_address: str
    latitude: float
    longitude: float
    location_accuracy: Optional[float] = None
    location_source: Optional[str] = "osm_geocode"
    whatsapp_consent: bool = True
    sms_consent: bool = True
    terms_consent: bool = True

class AttendantRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    mobile_number: str = Field(..., min_length=8, max_length=20)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    city: str
    state: str
    terms_consent: bool = True

# ----------------- Profile Schemas -----------------
class AvailabilityToggleRequest(BaseModel):
    is_available: bool

class DonorProfileOut(BaseModel):
    id: int
    user_id: int
    donor_id: str
    full_name: str
    email: str
    phone: str
    blood_group: str
    date_of_birth: str
    gender: Optional[str]
    area: Optional[str]
    city: str
    district: str
    state: str
    latitude: float
    longitude: float
    is_available: bool
    whatsapp_consent: bool
    sms_consent: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AttendantProfileOut(BaseModel):
    id: int
    user_id: int
    attendant_id: str
    name: str
    email: str
    phone: str
    city: str
    state: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Blood Request Schemas -----------------
class BloodRequestCreate(BaseModel):
    patient_reference: str = Field(..., min_length=2)
    required_blood_group: str = Field(..., pattern=r"^(A|B|AB|O)[+-]$")
    units_required: int = Field(1, ge=1, le=10)
    urgency: str = Field("NORMAL", pattern=r"^(URGENT|HIGH PRIORITY|NORMAL)$")
    hospital_name: str = Field(..., min_length=2)
    hospital_address: str
    hospital_city: str
    hospital_district: Optional[str] = None
    hospital_state: Optional[str] = None
    hospital_latitude: float
    hospital_longitude: float
    required_date: str
    required_time: str
    instructions: Optional[str] = None
    initial_search_radius_km: Optional[float] = 5.0

class BloodRequestOut(BaseModel):
    id: int
    request_id: str
    attendant_id: int
    patient_reference: str
    required_blood_group: str
    units_required: int
    urgency: str
    hospital_name: str
    hospital_address: str
    hospital_city: str
    hospital_latitude: float
    hospital_longitude: float
    required_date: str
    required_time: str
    instructions: Optional[str]
    status: str
    current_search_radius_km: float
    created_at: datetime
    attendant_name: Optional[str] = None
    attendant_phone: Optional[str] = None

    class Config:
        from_attributes = True

class ExpandRadiusRequest(BaseModel):
    new_radius_km: float = Field(..., ge=1, le=100)

# ----------------- Matching & Geospatial -----------------
class MatchingDonorOut(BaseModel):
    donor_id: int
    donor_identifier: str  # e.g. DL-D-1001
    display_name: str  # Protected name, e.g. "Rahul S."
    blood_group: str
    distance_km: float
    locality: str
    city: str
    approx_latitude: float  # Fuzzed/approximate for attendant privacy protection
    approx_longitude: float
    match_status: str
    notification_status: Optional[str] = None

class MatchingResultsOut(BaseModel):
    request_id: str
    hospital_name: str
    hospital_latitude: float
    hospital_longitude: float
    search_radius_km: float
    required_blood_group: str
    total_matches_found: int
    donors: List[MatchingDonorOut]

# ----------------- Response & Connection -----------------
class DonorResponseAction(BaseModel):
    response: str = Field(..., pattern=r"^(ACCEPTED|DECLINED)$")

class ConnectionOut(BaseModel):
    id: int
    connection_id: str
    donor_id: int
    attendant_id: int
    request_id: int
    connection_status: str
    contact_shared: bool
    fulfilment_status: str
    created_at: datetime
    # Authorized contact details
    donor_name: Optional[str] = None
    donor_phone: Optional[str] = None
    donor_blood_group: Optional[str] = None
    donor_locality: Optional[str] = None
    attendant_name: Optional[str] = None
    attendant_phone: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    hospital_latitude: Optional[float] = None
    hospital_longitude: Optional[float] = None
    request_code: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- Tracking & History -----------------
class RequestTrackingStep(BaseModel):
    stage: int
    status: str
    description: str
    timestamp: datetime

    class Config:
        from_attributes = True

class DonationHistoryOut(BaseModel):
    id: int
    donor_id: int
    request_id: Optional[int]
    hospital_name: str
    units_donated: int
    fulfilment_status: str
    confirmation_timestamp: datetime

    class Config:
        from_attributes = True

# ----------------- OpenStreetMap Geospatial -----------------
class GeocodeSearchResult(BaseModel):
    place_id: int
    display_name: str
    lat: float
    lon: float
    type: Optional[str] = None
    address: Optional[dict] = None

class ReverseGeocodeResult(BaseModel):
    display_name: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    road: Optional[str] = None
    suburb: Optional[str] = None
    lat: float
    lon: float
