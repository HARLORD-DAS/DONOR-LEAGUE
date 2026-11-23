import asyncio
import subprocess
import time
import sys
import os
import urllib.request

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from test_backend import run_tests

def wait_for_server(url="http://127.0.0.1:8000/api/v1/health", timeout=15):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False

if __name__ == "__main__":
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--log-level", "warning"],
        cwd=os.path.abspath(os.path.dirname(__file__))
    )
    server_ready = wait_for_server()
    if not server_ready:
        proc.terminate()
        raise RuntimeError("FastAPI server failed to start within timeout.")
    try:
        asyncio.run(run_tests())
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()


