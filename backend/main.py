"""
VITALGUARD 2.0 – FastAPI Main Application Entry Point
AI-Based Remote ICU Monitoring & Predictive Triage System

Architecture: 4-Layer ICU Intelligence Platform
  Layer 1: ICU Command Center
  Layer 2: Smart Triage Core (XGBoost)
  Layer 3: Patient Intelligence Panel
  Layer 4: Intelligent Alert Engine

Data Flow:
  Vitals Simulation → Feature Engineering → XGBoost Prediction
  → Risk Classification → Alert Engine → Dashboard Display
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import patients, vitals, prediction, alerts, forecast, reports, simulation, bp, hr, spo2, rr, temp
from models.xgboost_model import load_model

# ─── App Initialization ────────────────────────────────────────────────────────
app = FastAPI(
    title="VITALGUARD 2.0",
    description="AI-Based Remote ICU Monitoring & Predictive Triage System",
    version="2.0.0",
    docs_url="/docs",      # Swagger UI at /docs
    redoc_url="/redoc",    # ReDoc UI at /redoc
)

# ─── CORS Middleware ───────────────────────────────────────────────────────────
# Allow frontend (React dev server + Vercel) to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: restrict to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routers ──────────────────────────────────────────────────────────
app.include_router(patients.router)
app.include_router(vitals.router)
app.include_router(prediction.router)
app.include_router(alerts.router)
app.include_router(forecast.router)
app.include_router(reports.router)
app.include_router(simulation.router)
app.include_router(bp.router)
app.include_router(hr.router)
app.include_router(spo2.router)
app.include_router(rr.router)
app.include_router(temp.router)


# ─── Startup Event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Load the XGBoost model into memory on server start."""
    print("[VITALGUARD 2.0] Starting up...")
    load_model()
    print("[VITALGUARD 2.0] Ready. Visit http://127.0.0.1:8000/docs for API reference.")


# ─── Health Check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "system": "VITALGUARD 2.0",
        "status": "operational",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
