from contextlib import asynccontextmanager
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine
from app.api.auth import router as auth_router
from app.api.donors import router as donors_router
from app.api.attendants import router as attendants_router
from app.api.requests import router as requests_router
from app.api.matching import router as matching_router
from app.api.notifications import router as notifications_router
from app.api.osm_geo import router as osm_geo_router
from app.api.websocket import router as ws_router

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
    lifespan=lifespan,
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print("Unhandled Server Error:", exc)
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "roles_supported": ["DONOR", "ATTENDANT"],
        "docs_url": "/docs",
    }

@app.get("/api/v1/health")
def health():
    return {"status": "healthy", "service": "donor-league-backend"}
