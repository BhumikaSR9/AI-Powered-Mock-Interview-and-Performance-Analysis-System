"""
AI Interview Coach - Universal Single-Command Runner
Starts both the frontend and backend unified server on http://localhost:8000
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DIST_DIR = FRONTEND_DIR / "dist"

def main():
    print("=" * 60)
    print("      🎯 AI Interview Coach - Universal Server Launcher")
    print("=" * 60)
    
    # 1. Ensure frontend is built
    if not DIST_DIR.exists() or not (DIST_DIR / "index.html").exists():
        print("\n[1/3] Building frontend assets for production...")
        try:
            # On Windows npm is npm.cmd
            npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
            subprocess.run([npm_cmd, "run", "build"], cwd=FRONTEND_DIR, check=True)
            print("✓ Frontend built successfully.")
        except Exception as e:
            print(f"Notice: Frontend build skipped or failed ({e}). Running backend API...")
    else:
        print("\n[1/3] ✓ Frontend build found in frontend/dist.")

    # 2. Check virtual environment
    python_bin = sys.executable
    venv_python = ROOT_DIR / "venv" / ("Scripts" if os.name == "nt" else "bin") / ("python.exe" if os.name == "nt" else "python")
    if venv_python.exists():
        python_bin = str(venv_python)
        print(f"[2/3] ✓ Using virtual environment Python: {python_bin}")
    else:
        print(f"[2/3] Using Python: {python_bin}")

    # 3. Launch server
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    url = f"http://localhost:{port}"

    print(f"\n[3/3] 🚀 Starting AI Interview Coach on {url}")
    print(f"      • Full-Stack App: {url}")
    print(f"      • Interactive API Docs: {url}/docs")
    print(f"      • Health Check: {url}/api/health")
    print("=" * 60)
    print("Press CTRL+C anytime to stop the server.\n")

    # Open browser automatically after a short delay
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Run uvicorn
    try:
        import uvicorn
        # Add backend directory to sys.path
        if str(BACKEND_DIR) not in sys.path:
            sys.path.insert(0, str(BACKEND_DIR))
        from main import app
        uvicorn.run(app, host=host, port=port)
    except ImportError:
        # Fallback to subprocess with python_bin
        env = os.environ.copy()
        env["PYTHONPATH"] = str(BACKEND_DIR) + os.pathsep + env.get("PYTHONPATH", "")
        subprocess.run([python_bin, "-m", "uvicorn", "main:app", "--host", host, "--port", str(port)], cwd=BACKEND_DIR, env=env)

if __name__ == "__main__":
    main()
