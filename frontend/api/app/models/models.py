from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(30), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'donor' or 'attendant'
    account_status = Column(String(20), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    donor_profile = relationship("DonorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    attendant_profile = relationship("AttendantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class DonorProfile(Base):
    __tablename__ = "donor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    donor_id = Column(String(30), unique=True, index=True, nullable=False)  # e.g. DL-D-2026-1001
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), index=True, nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    address = Column(String(255), nullable=False)
    area = Column(String(100), nullable=True)
    city = Column(String(100), index=True, nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    latitude = Column(Float, index=True, nullable=False)
    longitude = Column(Float, index=True, nullable=False)
    location_accuracy = Column(Float, nullable=True)
    location_source = Column(String(50), default="osm_geocode")  # gps, osm_geocode, map_pin, manual
    
    # Dedicated availability toggle
    is_available = Column(Boolean, default=True, index=True, nullable=False)
    
    whatsapp_consent = Column(Boolean, default=True, nullable=False)
    sms_consent = Column(Boolean, default=True, nullable=False)
    terms_consent = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="donor_profile")
    matches = relationship("DonorMatch", back_populates="donor", cascade="all, delete-orphan")
    responses = relationship("DonorResponse", back_populates="donor", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="donor", cascade="all, delete-orphan")
    donation_history = relationship("DonationHistory", back_populates="donor", cascade="all, delete-orphan")


class AttendantProfile(Base):
    __tablename__ = "attendant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    attendant_id = Column(String(30), unique=True, index=True, nullable=False)  # e.g. DL-A-2026-2001
    name = Column(String(150), nullable=False)
    phone = Column(String(30), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="attendant_profile")
    requests = relationship("BloodRequest", back_populates="attendant", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="attendant", cascade="all, delete-orphan")


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(30), unique=True, index=True, nullable=False)  # e.g. DL-REQ-2026-3001
    attendant_id = Column(Integer, ForeignKey("attendant_profiles.id", ondelete="CASCADE"), nullable=False)
    patient_reference = Column(String(150), nullable=False)
    required_blood_group = Column(String(10), index=True, nullable=False)
    units_required = Column(Integer, default=1, nullable=False)
    urgency = Column(String(30), default="NORMAL", nullable=False)  # URGENT, HIGH PRIORITY, NORMAL
    hospital_name = Column(String(200), nullable=False)
    hospital_address = Column(String(255), nullable=False)
    hospital_city = Column(String(100), nullable=False)
    hospital_district = Column(String(100), nullable=True)
    hospital_state = Column(String(100), nullable=True)
    hospital_latitude = Column(Float, nullable=False)
    hospital_longitude = Column(Float, nullable=False)
    required_date = Column(String(30), nullable=False)
    required_time = Column(String(30), nullable=False)
    instructions = Column(Text, nullable=True)
    status = Column(String(30), default="SUBMITTED", index=True, nullable=False)
    # SUBMITTED, SEARCHING, MATCHED, CONNECTED, FULFILLED, CANCELLED
    current_search_radius_km = Column(Float, default=5.0, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    attendant = relationship("AttendantProfile", back_populates="requests")
    matches = relationship("DonorMatch", back_populates="request", cascade="all, delete-orphan")
    responses = relationship("DonorResponse", back_populates="request", cascade="all, delete-orphan")
    connections = relationship("Connection", back_populates="request", cascade="all, delete-orphan")
    tracking_steps = relationship("RequestTracking", back_populates="request", cascade="all, delete-orphan", order_by="RequestTracking.timestamp")
    notifications = relationship("Notification", back_populates="request", cascade="all, delete-orphan")


class DonorMatch(Base):
    __tablename__ = "donor_matches"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    distance_km = Column(Float, nullable=False)
    search_radius_km = Column(Float, nullable=False)
    match_status = Column(String(30), default="IDENTIFIED", nullable=False)
    # IDENTIFIED, NOTIFIED, RESPONDED, EXPIRED
    created_at = Column(DateTime(timezone=True), default=utc_now)

    request = relationship("BloodRequest", back_populates="matches")
    donor = relationship("DonorProfile", back_populates="matches")


class DonorResponse(Base):
    __tablename__ = "donor_responses"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    response = Column(String(20), nullable=False)  # ACCEPTED, DECLINED
    response_timestamp = Column(DateTime(timezone=True), default=utc_now)

    request = relationship("BloodRequest", back_populates="responses")
    donor = relationship("DonorProfile", back_populates="responses")


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    connection_id = Column(String(30), unique=True, index=True, nullable=False)  # DL-CONN-2026-4001
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    attendant_id = Column(Integer, ForeignKey("attendant_profiles.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    connection_status = Column(String(30), default="CONNECTED", nullable=False)
    # CONNECTED, IN_COORDINATION, COMPLETED, CANCELLED
    contact_shared = Column(Boolean, default=True, nullable=False)
    fulfilment_status = Column(String(30), default="PENDING", nullable=False)  # PENDING, FULFILLED
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    donor = relationship("DonorProfile", back_populates="connections")
    attendant = relationship("AttendantProfile", back_populates="connections")
    request = relationship("BloodRequest", back_populates="connections")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String(20), nullable=False)  # WHATSAPP, SMS
    message_status = Column(String(20), default="QUEUED", nullable=False)  # QUEUED, SENT, DELIVERED, FAILED
    provider_reference = Column(String(100), nullable=True)
    message_text = Column(Text, nullable=False)
    secure_link = Column(String(255), nullable=True)
    sent_at = Column(DateTime(timezone=True), default=utc_now)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    user = relationship("User", back_populates="notifications")
    request = relationship("BloodRequest", back_populates="notifications")


class DonationHistory(Base):
    __tablename__ = "donation_history"

    id = Column(Integer, primary_key=True, index=True)
    donor_id = Column(Integer, ForeignKey("donor_profiles.id", ondelete="CASCADE"), nullable=False)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    hospital_name = Column(String(200), nullable=False)
    units_donated = Column(Integer, default=1, nullable=False)
    fulfilment_status = Column(String(30), default="FULFILLED", nullable=False)
    confirmation_timestamp = Column(DateTime(timezone=True), default=utc_now)

    donor = relationship("DonorProfile", back_populates="donation_history")


class RequestTracking(Base):
    __tablename__ = "request_tracking"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False)
    stage = Column(Integer, nullable=False)  # 1 to 13
    status = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now)

    request = relationship("BloodRequest", back_populates="tracking_steps")
