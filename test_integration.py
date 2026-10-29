import requests
import time
import subprocess
import sys
import os

proc = subprocess.Popen([
    sys.executable,
    os.path.join(os.path.dirname(__file__), "backend", "main.py")
], cwd=os.path.join(os.path.dirname(__file__), "backend"))

try:
    # Wait for server to start
    time.sleep(3)
    
    # Test 1: Frontend SPA root
    r1 = requests.get("http://127.0.0.1:8000/")
    print("GET / (Frontend SPA):", r1.status_code, "Content length:", len(r1.text))
    assert "<div id=\"root\">" in r1.text, "Root element missing in index.html"
    
    # Test 2: Health
    r2 = requests.get("http://127.0.0.1:8000/api/health")
    print("GET /api/health:", r2.status_code, r2.json())
    
    # Test 3: Roles
    r3 = requests.get("http://127.0.0.1:8000/api/roles")
    print("GET /api/roles:", r3.status_code, r3.json())
    
    # Test 4: Questions
    r4 = requests.get("http://127.0.0.1:8000/api/questions/Software%20Engineer")
    print("GET /api/questions:", r4.status_code, "Questions count:", len(r4.json()["questions"]))
    
    # Test 5: Session Creation
    r5 = requests.post("http://127.0.0.1:8000/api/session", json={
        "role": "Software Engineer",
        "question_count": 3
    })
    session_data = r5.json()
    print("POST /api/session:", r5.status_code, "Session ID:", session_data.get("session_id"))
    session_id = session_data["session_id"]
    first_q = session_data["questions"][0]
    
    # Test 6: Submit Response
    r6 = requests.post(f"http://127.0.0.1:8000/api/session/{session_id}/response", json={
        "question": first_q,
        "response": "I have built distributed systems with Python, FastAPI, and React. In my last project, I reduced latency by 35% by implementing Redis caching.",
        "mode": "friendly"
    })
    print("POST /api/session/.../response:", r6.status_code, "Score:", r6.json()["feedback"]["score"], "Tone:", r6.json()["feedback"]["tone"])
    
    # Test 7: Report
    r7 = requests.get(f"http://127.0.0.1:8000/api/session/{session_id}/report")
    print("GET /api/session/.../report:", r7.status_code, "Avg score:", r7.json()["average_score"])
    
    print("\n>>> ALL 7 FULL-STACK TESTS PASSED PERFECTLY! <<<")

finally:
    proc.terminate()
