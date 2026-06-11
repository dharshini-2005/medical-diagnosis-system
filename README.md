# 🩺 MediDiagnose AI — MERN Stack

Full-stack medical diagnosis system with JWT auth, Rule-based engine, and RandomForest ML predictions.

---

## 📁 Project Structure

```
/
├── backend/          ← Express + MongoDB API  (deploy to Render)
├── frontend/         ← React app              (deploy to Vercel)
├── ml-service/       ← FastAPI ML service     (deploy to Render)
└── rules_dataset/    ← CSV datasets (used by backend + ml-service)
```

---

## 🚀 Local Development

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev            # runs on http://localhost:5000
```

### 2. ML Service
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# runs on http://localhost:8000
```

### 3. Frontend
```bash
cd frontend
npm install
# create .env with:  REACT_APP_API_URL=http://localhost:5000/api
npm start              # runs on http://localhost:3000
```

---

## ☁️ Deployment

### Step 1 — MongoDB Atlas (free)
1. Go to https://www.mongodb.com/atlas and create a free cluster
2. Create a database user (username + password)
3. Allow access from anywhere: Network Access → `0.0.0.0/0`
4. Copy your connection string:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/medical_diagnosis
   ```

---

### Step 2 — Deploy Backend to Render

1. Push your code to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your GitHub repo
4. Set the **Root Directory** to `backend`
5. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Add these **Environment Variables** in Render dashboard:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | your Vercel URL (add after step 3) |

7. Click **Deploy** — copy the URL e.g. `https://medical-diagnosis-backend.onrender.com`

---

### Step 3 — Deploy Frontend to Vercel

1. Go to https://vercel.com → **New Project**
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add **Environment Variable**:

| Key | Value |
|---|---|
| `REACT_APP_API_URL` | `https://medical-diagnosis-backend.onrender.com/api` |

5. Click **Deploy** — copy your Vercel URL e.g. `https://medi-diagnose.vercel.app`

---

### Step 4 — Update CORS on Render

Go back to Render → your backend service → **Environment** tab:

| Key | Value |
|---|---|
| `CLIENT_URL` | `https://medi-diagnose.vercel.app` |

Click **Save** — Render will redeploy automatically.

---

### Step 5 (Optional) — Deploy ML Service to Render

1. In Render → **New Web Service**
2. Root Directory: `ml-service`
3. **Environment:** Python 3
4. **Build Command:** `pip install -r requirements.txt`
5. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. After deploy, copy the URL and add it to backend env:

| Key | Value |
|---|---|
| `ML_SERVICE_URL` | `https://medical-diagnosis-ml.onrender.com` |

> ⚠️ Free Render services spin down after 15 mins of inactivity. First request after sleep takes ~30s. Upgrade to a paid plan for always-on.

---

## ✨ Features
- Register / Login with JWT
- Symptom search with autocomplete
- Voice input (Web Speech API)
- Rule-based diagnosis with match scores
- RandomForest ML predictions (real scikit-learn model)
- Interactive bar charts (Recharts)
- Diagnosis history saved per user
- Profile management
- Fully responsive

## 🛠️ Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, React Router 6, Recharts |
| Backend | Node.js, Express, Mongoose |
| ML Service | Python, FastAPI, scikit-learn |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
