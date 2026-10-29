# 🎯 AI Interview Coach - Full Stack AI Application

An interactive, AI-powered interview practice platform that simulates real job interviews with personalized questions, live speech synthesis, audio volume dynamics, STAR method evaluation, resume roasting, and downloadable PDF performance reports.

---

## ✨ Features & Highlights

- 🤖 **Multi-Persona AI Interviewers**:
  - **Friendly Coach Fiona**: Supportive and encouraging, building confidence.
  - **Tech Lead Tyler**: Deep technical focus, system design, and clean architecture.
  - **Savage Critic Sam**: Candor, identifies verbal crutches, buzzwords, and missing metrics.
  - **Pressure Tester Paula**: Rapid-fire constraints, strict 60s countdown timer.
- 📄 **Resume Upload & AI Question Generation**: Upload your PDF resume to generate tailored, hyper-specific interview questions based on your real experience.
- 🔥 **Resume Roast Mode**: Humorous, witty, yet constructive AI roast of your resume clichés and buzzwords.
- 🎙️ **Voice Input & Speech Visualization**: Web Speech API for voice-to-text plus real-time audio amplitude and pacing waveforms.
- 🗣️ **Realistic Speech Synthesis (TTS)**: The AI interviewer reads each question aloud with voice tones matching their persona.
- ⭐ **STAR Framework Evaluation**: Detailed breakdown of Situation, Task, Action, and Result with actionable advice.
- 📊 **Interactive Performance Reports**: Score gauge, grammar clarity, filler words tracker, tone detection, and speech volume dynamics.
- 📑 **One-Click PDF Export**: Download a styled interview evaluation report via jsPDF.
- 🌓 **Dark & Light Mode**: Glassmorphism UI with smooth transitions and Framer Motion micro-interactions.
- 🚀 **Unified Full-Stack Architecture**: Single-command launcher that serves both the React SPA and FastAPI backend together on `http://localhost:8000`.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`), PyPDF, Pydantic, Python-dotenv.
- **Frontend**: React 18, Vite, TailwindCSS, Framer Motion, Axios, jsPDF, Web Speech API, Web Audio API.
- **Deployment**: Docker multi-stage build, Render Blueprint (`render.yaml`), Railway/Heroku `Procfile`.

---

## ⚡ Quick Start (Local Run)

### Option A: Windows One-Click
Double-click **`run_project.bat`**.
The launcher will start the unified server and open your browser automatically at `http://localhost:8000`.

### Option B: Universal Python Command
```bash
# 1. Activate virtual environment (if created):
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS / Linux

# 2. Run the full app:
python run.py
```
Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🧪 Testing

To run the complete full-stack integration test suite:
```bash
python test_integration.py
```
All 7 integration tests verify:
1. React SPA Static Asset Serving
2. API Health Check (`/api/health`)
3. Role Discovery (`/api/roles`)
4. Dynamic Question Generation (`/api/questions/{role}`)
5. Session Creation (`/api/session`)
6. Gemini/Heuristic AI Feedback & STAR Scoring (`/api/session/{id}/response`)
7. Final Performance Reporting (`/api/session/{id}/report`)

---

## ☁️ Deployment

For complete instructions on deploying to **Render**, **Railway**, **Fly.io**, **Hugging Face Spaces**, or via **Cloudflare Tunnel**, check out [`DEPLOYMENT.md`](DEPLOYMENT.md).

### 1-Click Render Deploy:
1. Push repository to GitHub.
2. In Render, select **New Web Service** and connect this repository.
3. Build command:
   ```bash
   pip install -r requirements.txt && cd frontend && npm install && npm run build
   ```
4. Start command:
   ```bash
   python backend/main.py
   ```
5. Set `GEMINI_API_KEY` in environment variables.
