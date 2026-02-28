/**
 * Centralized Axios API client for VITALGUARD 2.0
 * All backend calls go through this client.
 * Base URL auto-resolves: Vite proxy forwards /api → http://127.0.0.1:8000
 */
import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
})

// ── Patients ────────────────────────────────────────────────────────────────
export const getPatients = () => api.get('/patients/')
export const getPatient = (id) => api.get(`/patients/${id}`)
export const getICUSummary = () => api.get('/patients/icu-summary')

// ── Vitals ──────────────────────────────────────────────────────────────────
export const getCurrentVitals = (id) => api.get(`/vitals/${id}/current`)
export const getVitalsHistory = (id) => api.get(`/vitals/${id}/history`)

// ── Prediction (XGBoost) ─────────────────────────────────────────────────────
export const runPrediction = (id) => api.post(`/predict/${id}`)
export const explainPrediction = (id) => api.get(`/predict/${id}/explain`)

// ── Risk Forecast ─────────────────────────────────────────────────────────────
export const getRiskForecast = (id) => api.get(`/forecast/${id}`)

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getActiveAlerts = () => api.get('/alerts/')
export const getAlertLog = () => api.get('/alerts/log')
export const suppressAlert = (alertId, reason) =>
    api.post(`/alerts/suppress/${alertId}`, { reason })

// ── Reports & Analytics ───────────────────────────────────────────────────────
export const getReportsSummary = () => api.get('/reports/summary')

// ── Crisis Simulation ─────────────────────────────────────────────────────────
export const triggerSimulation = () => api.post('/simulation/trigger')
export const resetSimulation = () => api.post('/simulation/reset')
export const getSimulationStatus = () => api.get('/simulation/status')

// ── BP Module ─────────────────────────────────────────────────────────────────
export const getBPAnalysis = (id) => api.get(`/bp/${id}`)
export const getBPHistory = (id) => api.get(`/bp/${id}/history`)
export const getBPMedications = (id) => api.get(`/bp/${id}/medications`)

// ── Heart Rate Module ─────────────────────────────────────────────────────────
export const getHRAnalysis = (id) => api.get(`/hr/${id}`)
export const getHRHistory = (id) => api.get(`/hr/${id}/history`)
export const getHRMedications = (id) => api.get(`/hr/${id}/medications`)

// ── SpO2 Module ───────────────────────────────────────────────────────────────
export const getSpO2Analysis = (id) => api.get(`/spo2/${id}`)
export const getSpO2History = (id) => api.get(`/spo2/${id}/history`)
export const getSpO2Supports = (id) => api.get(`/spo2/${id}/supports`)

// ── Respiratory Rate Module ───────────────────────────────────────────────────
export const getRRAnalysis = (id) => api.get(`/rr/${id}`)
export const getRRHistory = (id) => api.get(`/rr/${id}/history`)
export const getRRTherapies = (id) => api.get(`/rr/${id}/therapies`)

// ── Temperature Module ────────────────────────────────────────────────────────
export const getTempAnalysis = (id) => api.get(`/temp/${id}`)
export const getTempHistory = (id) => api.get(`/temp/${id}/history`)
export const getTempMedications = (id) => api.get(`/temp/${id}/medications`)

export default api
