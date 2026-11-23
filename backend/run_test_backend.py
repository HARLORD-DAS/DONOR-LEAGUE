import asyncio
import sys
import os
import httpx

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.core.database import ensure_db
import test_backend

async def main():
    await ensure_db()
    test_backend.BASE_URL = "http://localhost:8000"
    transport = httpx.ASGITransport(app=app)
    
    # Patch AsyncClient to use ASGI transport
    orig_async_client = httpx.AsyncClient
    def patched_async_client(*args, **kwargs):
        kwargs["transport"] = transport
        return orig_async_client(*args, **kwargs)
    
    httpx.AsyncClient = patched_async_client
    await test_backend.run_tests()

if __name__ == "__main__":
    asyncio.run(main())
