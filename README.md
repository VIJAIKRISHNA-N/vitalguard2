# 🏥 VitalGuard 2.0 — AI-Based Remote ICU Monitoring System

> **AI-Powered Predictive Triage & Real-Time Vital Signs Monitoring Platform for ICU Environments**

---

## 📌 Overview

**VitalGuard 2.0** is a full-stack AI-driven ICU monitoring system that continuously tracks patient vital signs, predicts health risk in real time using an XGBoost ML model, and triggers intelligent alerts — all through a modern React dashboard.

---

## 🧠 System Architecture — 4-Layer ICU Intelligence Platform

| Layer | Name | Description |
|-------|------|-------------|
| Layer 1 | **ICU Command Center** | Central dashboard for all patients |
| Layer 2 | **Smart Triage Core** | XGBoost-based risk prediction engine |
| Layer 3 | **Patient Intelligence Panel** | Per-patient detailed vitals & trends |
| Layer 4 | **Intelligent Alert Engine** | Real-time alert generation & logging |

**Data Flow:**
```
Vitals Simulation → Feature Engineering → XGBoost Prediction
→ Risk Classification → Alert Engine → Dashboard Display
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite**
- **React Router DOM** — Client-side routing
- **Chart.js** + **react-chartjs-2** — Vitals trend charts
- **Tailwind CSS** — Styling
- **Axios** — API communication
- **Lucide React** — Icons

### Backend
- **FastAPI** — REST API framework
- **Uvicorn** — ASGI server
- **XGBoost** — ML risk prediction model
- **Scikit-learn** + **Pandas** + **NumPy** — Data processing
- **Firebase Admin** — (Authentication / DB integration)
- **Pydantic** — Data validation

---

## 📁 Project Structure

```
vitalguard2/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── requirements.txt         # Python dependencies
│   ├── data/                    # Sample vitals data
│   ├── ml/                      # Model training scripts
│   ├── models/                  # Pydantic schemas & XGBoost model
│   ├── routers/                 # API route handlers (vitals, alerts, etc.)
│   └── services/                # Business logic engines
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components (layers 1–4)
│   │   ├── pages/               # Page-level components
│   │   ├── context/             # Auth context
│   │   ├── hooks/               # Custom React hooks
│   │   ├── router/              # App routing
│   │   └── utils/               # Utility functions
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.9+

---

### 1. Clone the Repository

```bash
git clone https://github.com/VIJAIKRISHNA-N/vitalguard2.git
cd vitalguard2
```

---

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

- API runs at: **http://localhost:8000**
- Swagger docs: **http://localhost:8000/docs**

---

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

- App runs at: **http://localhost:5173**

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | System status |
| GET/POST | `/patients` | Patient management |
| GET | `/vitals` | Real-time vitals |
| GET | `/prediction` | XGBoost risk prediction |
| GET | `/alerts` | Alert log |
| GET | `/forecast` | Vitals forecasting |
| GET | `/simulation` | Vitals simulation |
| GET | `/reports` | Report generation |

---

## 🤖 ML Model

- **Algorithm**: XGBoost Classifier
- **Input**: Patient vitals (HR, BP, SpO₂, RR, Temperature)
- **Output**: Risk score + classification (Low / Medium / High / Critical)
- **Model file**: `backend/ml/model.pkl`

---

## 👤 Author

**Vijai Krishna N**
- GitHub: [@VIJAIKRISHNA-N](https://github.com/VIJAIKRISHNA-N)

---

## 📄 License

This project is for academic and research purposes.
