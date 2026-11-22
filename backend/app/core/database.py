import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()
_initialized = False
_init_lock = None

def _get_init_lock():
    global _init_lock
    if _init_lock is None:
        _init_lock = asyncio.Lock()
    return _init_lock

async def ensure_db():
    global _initialized
    if _initialized:
        return

    async with _get_init_lock():
        if _initialized:
            return

        import app.models.models  # Register all models on Base.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Demo accounts use published sample credentials. Never seed them in
        # production unless the operator explicitly opts in.
        if settings.SEED_DEMO_DATA:
            async with AsyncSessionLocal() as session:
                from app.core.seed import seed_initial_donors_data
                await seed_initial_donors_data(session)

        _initialized = True

async def get_db():
    await ensure_db()
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
