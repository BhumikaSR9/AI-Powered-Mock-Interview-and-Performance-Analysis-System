# 🚀 Deployment Guide - AI Interview Coach

This guide details how to deploy the **AI Interview Coach** so anyone around the world can use it on mobile, tablet, or desktop.

---

## 🌟 Architecture Overview

The app is built as a unified full-stack service:
- **Frontend**: React + TailwindCSS + Framer Motion (Vite SPA)
- **Backend**: FastAPI + Google Gemini 2.5/1.5 AI + Web Audio Analysis + PDF Parser
- **Unified Server**: FastAPI serves the pre-built frontend distribution (`frontend/dist`) as a single unified service. No separate frontend hosting is required!

---

## Option 1: 1-Click Free Cloud Deployment on Render (Recommended)

[Render](https://render.com) offers free cloud hosting for web services with automatic HTTPS.

### Steps:
1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of AI Interview Coach"
   git remote add origin https://github.com/your-username/ai-interview-coach.git
   git push -u origin main
   ```

2. **Create a Free Web Service on Render:**
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **New + > Web Service**.
   - Select your GitHub repository.
   - Configure the following settings:
     - **Name**: `ai-interview-coach`
     - **Region**: Closest to you (e.g. Frankfurt, Oregon, Singapore)
     - **Branch**: `main`
     - **Root Directory**: *(leave blank)*
     - **Runtime**: `Python 3`
     - **Build Command**:
       ```bash
       pip install -r requirements.txt && cd frontend && npm install && npm run build
       ```
     - **Start Command**:
       ```bash
       python backend/main.py
       ```
     - **Instance Type**: `Free`

3. **Add Environment Variables:**
   Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio Gemini API key)*
   - `PORT`: `10000`
   - `HOST`: `0.0.0.0`

4. **Click "Deploy Web Service"**:
   - Render will build the React frontend, install dependencies, and start the server.
   - In 2–3 minutes, your live URL will be active: `https://ai-interview-coach.onrender.com`!

---

## Option 2: Docker Deployment (Railway, Fly.io, or AWS)

A production-ready `Dockerfile` is included in the project.

### Deploying to Railway.app:
1. Sign up at [railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Railway automatically detects the `Dockerfile` and builds both frontend and backend.
4. In Railway variables, add `GEMINI_API_KEY`.
5. Under Settings > Networking, click **Generate Domain**.
6. Your app is live!

### Deploying to Fly.io:
```bash
fly launch
fly secrets set GEMINI_API_KEY="your-api-key"
fly deploy
```

---

## Option 3: Hugging Face Spaces (100% Free Docker Hosting)

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Select **Docker** as the Space SDK.
3. Push your repository to the Hugging Face Git remote.
4. In Space Settings > **Variables and secrets**, add your `GEMINI_API_KEY`.
5. Hugging Face builds and hosts the app publicly with an embedded iframe or full page!

---

## Option 4: Instant Public Access via Cloudflare Tunnel or Ngrok

If you want to demo the app right now from your laptop to anyone on the internet:

### Using Cloudflare Tunnel (Free & No account needed):
```bash
# In one terminal, start the app:
python run.py

# In another terminal:
npx cloudflared tunnel --url http://localhost:8000
```
Cloudflare will give you a temporary public HTTPS link (e.g., `https://random-words.trycloudflare.com`) that anyone can open on their phone or computer!

### Using Ngrok:
```bash
ngrok http 8000
```

---

## 🛠️ Local Running & Verification

To run locally anytime:
- **Windows**: Double-click `run_project.bat`
- **Any OS**: Run:
  ```bash
  python run.py
  ```
The app will automatically launch on `http://localhost:8000` and open your default browser.
