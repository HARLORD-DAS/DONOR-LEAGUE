import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DONOR LEAGUE"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "donor-league-super-secret-production-key-2026-v1")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./donor_league.db")
    
    # OpenStreetMap Nominatim / Overpass / OSRM
    NOMINATIM_BASE_URL: str = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
    NOMINATIM_USER_AGENT: str = "DonorLeagueApp/1.0 (contact@donorleague.org)"
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    OVERPASS_BASE_URL: str = os.getenv("OVERPASS_BASE_URL", "https://overpass-api.de/api/interpreter")
    
    # Meta WhatsApp Business Cloud API
    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "donor_league_verify_webhook_token")
    WHATSAPP_SIMULATION_MODE: bool = os.getenv("WHATSAPP_SIMULATION_MODE", "true").lower() == "true"
    
    # SMS Gateway (e.g. MSG91)
    MSG91_AUTH_KEY: str = os.getenv("MSG91_AUTH_KEY", "")
    MSG91_SENDER_ID: str = os.getenv("MSG91_SENDER_ID", "DNRLEAGUE")
    SMS_SIMULATION_MODE: bool = os.getenv("SMS_SIMULATION_MODE", "true").lower() == "true"
    
    # App public URL for notification links
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:3000")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
