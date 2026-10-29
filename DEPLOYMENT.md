# 🚀 Complete Deployment Guide - PrepSense AI

PrepSense AI is built as a **fully self-contained, single-server web application**. The FastAPI backend automatically serves the high-performance compiled React frontend (`frontend/dist`), the SQLite database (`prepsense.db`), and the Gemini AI engine on a single unified port.

---

## 🌐 Instant Options to Run & Share

### Option A: Live on Local Wi-Fi (Instant Demo for Viva / Lab)
If you are presenting to teachers or classmates on the same Wi-Fi network:
- **Your Local Machine URL:** [http://localhost:8000](http://localhost:8000)
- **Live Phone / Tablet / Evaluator Link:** `http://192.168.12.56:8000`
*(Anyone connected to your Wi-Fi or mobile hotspot can type `http://192.168.12.56:8000` into their mobile browser to take a live mock interview!)*

---

### Option B: Permanent 24/7 Cloud Deployment on Render.com (100% Free)

Render provides free cloud hosting with a permanent HTTPS domain (`https://prepsense-ai.onrender.com`) that never sleeps while active.

#### Step 1: Create your GitHub Repository
1. Open your browser and go to: **[https://github.com/new](https://github.com/new)**
2. Set **Repository name**: `prepsense-ai`
3. Set visibility to **Public**
4. **Important**: Leave "Add a README file" **unchecked** (we already have a complete repo ready).
5. Click **Create repository**.

#### Step 2: Push your Code with 1-Click
Simply double-click:
👉 `push_to_github.bat` in your project folder!

*(Or run in PowerShell / Command Prompt):*
```powershell
git push -u origin main
```
Your entire code, frontend build, database, and configurations will be uploaded to:
`https://github.com/BhumikaSR9/prepsense-ai`

#### Step 3: Deploy on Render in 2 Minutes
1. Go to **[https://dashboard.render.com](https://dashboard.render.com)** and sign in with GitHub.
2. Click **New +** (top right) ➔ **Web Service**.
3. Select your repository: **`BhumikaSR9/prepsense-ai`**.
4. Render automatically reads our [`render.yaml`](file:///c:/Users/Bhumika/OneDrive/Desktop/python%20project/render.yaml) configuration:
   - **Name:** `prepsense-ai`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python backend/main.py`
   - **Plan:** `Free`
5. Under **Environment Variables**, click **Add Environment Variable**:
   - Key: `GEMINI_API_KEY`
   - Value: `your_gemini_api_key_here` *(copy value from your local backend/.env)*
6. Click **Deploy Web Service**!

Render will build the app and give you a public URL like:
👉 **`https://prepsense-ai.onrender.com`**

---

### Option C: 1-Click Deploy on Railway.app (Instant Docker)

Railway automatically detects our [`Dockerfile`](file:///c:/Users/Bhumika/OneDrive/Desktop/python%20project/Dockerfile):
1. Sign in to **[Railway.app](https://railway.app)** with GitHub.
2. Click **New Project** ➔ **Deploy from GitHub repo** ➔ Select `BhumikaSR9/prepsense-ai`.
3. In Railway settings, add variable: `GEMINI_API_KEY`.
4. Under **Networking**, click **Generate Public Domain**.
5. Your live app is ready at: `https://prepsense-ai.up.railway.app`!

---

### Option D: Hugging Face Spaces (Permanent Academic Host)

1. Open **[Hugging Face Spaces](https://huggingface.co/spaces)** and click **Create new Space**.
2. Space name: `prepsense-ai`
3. Space SDK: **Docker** (Blank)
4. Push your repo to the Hugging Face git remote.
5. In Space Settings ➔ **Variables and secrets**, add `GEMINI_API_KEY`.
6. Hugging Face hosts the app permanently for free!
