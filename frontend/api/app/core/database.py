import os
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

_initialized = False
_init_lock = asyncio.Lock()

async def ensure_db():
    global _initialized
    if not _initialized:
        async with _init_lock:
            if not _initialized:
                # Import models module so all models are registered on Base
                import app.models.models
                async with engine.begin() as conn:
                    await conn.run_sync(Base.metadata.create_all)
                
                async with AsyncSessionLocal() as session:
                    try:
                        from app.core.seed import seed_initial_donors_data
                        await seed_initial_donors_data(session)
                    except Exception as e:
                        print(f"Seed error: {e}")
                
                _initialized = True

async def get_db():
    await ensure_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
