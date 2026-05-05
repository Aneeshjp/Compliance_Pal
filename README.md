# GST Compass — AI-Powered GST Compliance & ITC Reconciliation

A production-grade full-stack web application for Indian MSME GST compliance, featuring OCR invoice processing, automated validation, ITC reconciliation with fuzzy matching, and an AI assistant powered by Google Gemini.

## ✨ Features

| Feature | Description |
|---|---|
| 📥 Invoice OCR | Upload PDF/JPG/PNG invoices — automatic data extraction via pytesseract + easyocr |
| 🧠 8-Rule Validation | GSTIN checksum, tax math, duplicate detection, rate slab verification |
| 🔄 ITC Reconciliation | Fuzzy match invoices against GSTR-2B records using rapidfuzz |
| 📊 Dashboard & Analytics | KPI cards, monthly charts, vendor breakdown, ITC trend analysis |
| 🤖 AI Assistant | Context-aware GST advisor powered by Gemini 1.5 Flash with streaming |
| 🔐 JWT Auth | Access + refresh token rotation with bcrypt password hashing |
| 🌱 Demo Seeder | One-click demo data with 12 realistic invoices + mock GST records |
| 🎨 Premium UI | Dark glassmorphism design, 3D hero, Framer Motion animations |

## 🏗️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber, Recharts
- **Backend:** FastAPI, Python 3.11+, Pydantic v2, Motor (async MongoDB)
- **Database:** MongoDB Atlas
- **AI:** Google Gemini 1.5 Flash (streaming)
- **OCR:** pytesseract (primary), easyocr (fallback)

## 📋 Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+
- **MongoDB Atlas** account (or local MongoDB)
- **Tesseract OCR** installed on system ([install guide](https://github.com/tesseract-ocr/tesseract))
- **Poppler** (for PDF processing) — [Windows binary](https://github.com/oschwartz10612/poppler-windows/releases)
- **Google Gemini API Key** (for AI assistant)

## ⚙️ Environment Setup

All configuration lives in a **single `.env` file** at the project root:

```env
# === MongoDB ===
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=gst_compliance

# === JWT ===
JWT_SECRET=your-secret-key-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# === Google Gemini AI ===
GEMINI_API_KEY=your-gemini-api-key

# === File Storage ===
UPLOAD_DIR=./backend/uploads
DEMO_DOCS_DIR=./backend/demo_documents

# === Frontend ===
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=GST Compass
```

## 🚀 Quick Start

### Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# → open http://localhost:3000
```

## 📄 Adding Demo Documents

Place sample invoice files (PDF, JPG, PNG) in `/backend/demo_documents/`. When you first log in, click **"Load Demo Data"** to:

1. Scan and OCR all files in the demo folder
2. Generate matching/mismatching GST records (60% matched, 25% mismatch, 15% missing)
3. Run validation and reconciliation automatically

If no files are present, 12 built-in demo invoices will be used instead.

## 📁 Project Structure

```
├── .env                     ← Single config file for entire app
├── backend/
│   ├── app/
│   │   ├── api/routes/      # FastAPI route handlers
│   │   ├── core/            # Config, database, security
│   │   ├── models/          # Pydantic models
│   │   ├── services/        # Business logic (OCR, validation, reconciliation, AI)
│   │   └── main.py          # FastAPI entry point
│   ├── demo_documents/      # Place sample invoices here
│   ├── uploads/             # Uploaded file storage
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # React components (UI, Three.js, Charts, Layout)
│   │   └── lib/             # API client, hooks, utilities
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/invoices/upload` | Upload invoice with OCR |
| GET | `/api/invoices` | List invoices (paginated) |
| POST | `/api/validate/{id}` | Validate single invoice |
| POST | `/api/validate/bulk` | Validate all pending |
| POST | `/api/reconcile/run` | Run ITC reconciliation |
| GET | `/api/reconcile/results` | Latest run summary |
| GET | `/api/analytics/summary` | KPI dashboard data |
| POST | `/api/assistant/query` | AI assistant (SSE stream) |
| POST | `/api/seed/demo` | Load demo data |

## 📜 License

MIT
