import asyncio
import uvicorn
import multiprocessing
import time
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from test_backend import run_tests

def start_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

if __name__ == "__main__":
    proc = multiprocessing.Process(target=start_server)
    proc.start()
    time.sleep(2) # Wait for server startup
    try:
        asyncio.run(run_tests())
    finally:
        proc.terminate()
        proc.join()
