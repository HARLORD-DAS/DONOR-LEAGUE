import os
from pydantic_settings import BaseSettings

def normalize_database_url(url: str) -> str:
    if not url:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(base_dir, "donor_league.db").replace("\\", "/")
        return f"sqlite+aiosqlite:///{db_path}"
    clean = url.strip().strip('"').strip("'")
    if clean in ("", "sqlite+aiosqlite:///./donor_league.db"):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(base_dir, "donor_league.db").replace("\\", "/")
        return f"sqlite+aiosqlite:///{db_path}"
    if clean.startswith("postgres://"):
        return clean.replace("postgres://", "postgresql+asyncpg://", 1)
    if clean.startswith("postgresql://") and not clean.startswith("postgresql+asyncpg://"):
        return clean.replace("postgresql://", "postgresql+asyncpg://", 1)
    return clean

class Settings(BaseSettings):
    PROJECT_NAME: str = "DONOR LEAGUE"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "local-development-only-change-this-secret")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    DATABASE_URL: str = normalize_database_url(os.getenv("DATABASE_URL", ""))

    NOMINATIM_BASE_URL: str = os.getenv("NOMINATIM_BASE_URL", "https://nominatim.openstreetmap.org")
    NOMINATIM_USER_AGENT: str = os.getenv("NOMINATIM_USER_AGENT", "DonorLeagueApp/1.0")
    OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
    OVERPASS_BASE_URL: str = os.getenv("OVERPASS_BASE_URL", "https://overpass-api.de/api/interpreter")

    WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")
    WHATSAPP_PHONE_NUMBER_ID: str = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "")
    WHATSAPP_SIMULATION_MODE: bool = os.getenv("WHATSAPP_SIMULATION_MODE", "true").lower() == "true"

    MSG91_AUTH_KEY: str = os.getenv("MSG91_AUTH_KEY", "")
    MSG91_SENDER_ID: str = os.getenv("MSG91_SENDER_ID", "DNRLEAGUE")
    SMS_SIMULATION_MODE: bool = os.getenv("SMS_SIMULATION_MODE", "true").lower() == "true"

    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "http://localhost:3000")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
settings.DATABASE_URL = normalize_database_url(settings.DATABASE_URL)

# Render's managed PostgreSQL URL may use postgres:// or postgresql://.
# SQLAlchemy async engine requires the asyncpg dialect.
if settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if os.getenv("RENDER") and settings.SECRET_KEY == "local-development-only-change-this-secret":
    raise RuntimeError("Set a unique SECRET_KEY environment variable in the production backend.")
