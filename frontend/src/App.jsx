/**
 * VITALGUARD 2.0 - Main Application
 * Assembles all 4 layers into a cohesive ICU command dashboard.
 * 
 * State management:
 *  - patients: full sorted list with risk scores
 *  - selectedPatientId: which patient's detail panel is active
 *  - vitals + vitals history: polled every 3s for selected patient
 *  - prediction: XGBoost result, polled every 5s
 *  - alerts: polled every 4s
 *  - forecast: fetched on patient selection
 * 
 * Data flow: vitals → prediction → alerts → dashboard display
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
    getPatients, getICUSummary, getCurrentVitals, getVitalsHistory,
    runPrediction, explainPrediction, getRiskForecast, getActiveAlerts, getAlertLog,
} from './api/client'

import SummaryMetrics from './components/layer1/SummaryMetrics'
import RiskIndex from './components/layer1/RiskIndex'
import BedHeatmap from './components/layer1/BedHeatmap'
import PatientDashboard from './components/layer1/PatientDashboard'
import VitalsDisplay from './components/layer3/VitalsDisplay'
import VitalsTrendChart from './components/layer3/VitalsTrendChart'
import RiskTimeline from './components/layer3/RiskTimeline'
import RiskForecast from './components/layer3/RiskForecast'
import ExplainableAI from './components/layer3/ExplainableAI'
import AlertPanel from './components/layer4/AlertPanel'
import AlertLog from './components/layer4/AlertLog'

const VITALS_POLL_MS = 3000
const PREDICTION_POLL_MS = 5000
const ALERTS_POLL_MS = 4000
const SUMMARY_POLL_MS = 8000

export default function App() {
    // ── Layer 1 state ──────────────────────────────────────────────────────────
    const [patients, setPatients] = useState([])
    const [summary, setSummary] = useState(null)
    const [summaryLoading, setSummaryLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)

    // ── Layer 3 state ──────────────────────────────────────────────────────────
    const [vitals, setVitals] = useState(null)
    const [vitalsHistory, setVitalsHistory] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [contributions, setContributions] = useState([])
    const [forecast, setForecast] = useState(null)
    const [riskHistory, setRiskHistory] = useState([]) // For risk progression timeline

    // ── Layer 4 state ──────────────────────────────────────────────────────────
    const [activeAlerts, setActiveAlerts] = useState([])
    const [alertLog, setAlertLog] = useState([])

    // Track selected patient's baseline for deviation display
    const [selectedBaseline, setSelectedBaseline] = useState(null)

    // ── Fetch ICU-level data (patients + summary) ──────────────────────────────
    const fetchICUData = useCallback(async () => {
        try {
            const [pResp, sResp] = await Promise.all([getPatients(), getICUSummary()])
            setPatients(pResp.data)
            setSummary(sResp.data)
            setSummaryLoading(false)
            // Auto-select first patient if none selected
            if (!selectedId && pResp.data.length > 0) {
                setSelectedId(pResp.data[0].id)
            }
        } catch (e) {
            console.error('[ICU] Error fetching summary:', e.message)
        }
    }, [selectedId])

    // ── Fetch vitals for selected patient ─────────────────────────────────────
    const fetchVitals = useCallback(async () => {
        if (!selectedId) return
        try {
            const [currentResp, histResp] = await Promise.all([
                getCurrentVitals(selectedId),
                getVitalsHistory(selectedId),
            ])
            setVitals(currentResp.data)
            setVitalsHistory(histResp.data.history || [])
        } catch (e) {
            console.error('[Vitals] Error:', e.message)
        }
    }, [selectedId])

    // ── Run XGBoost prediction for selected patient ────────────────────────────
    const fetchPrediction = useCallback(async () => {
        if (!selectedId) return
        try {
            const [predResp, explainResp] = await Promise.all([
                runPrediction(selectedId),
                explainPrediction(selectedId),
            ])
            const pred = predResp.data
            setPrediction(pred)
            setContributions(explainResp.data.contributions || [])

            // Append to risk progression timeline (keep last 30 points)
            setRiskHistory(prev => {
                const updated = [...prev, {
                    timestamp: pred.timestamp,
                    risk_score: pred.risk_score,
                    risk_level: pred.risk_level,
                }]
                return updated.slice(-30)
            })
        } catch (e) {
            console.error('[Prediction] Error:', e.message)
        }
    }, [selectedId])

    // ── Fetch forecast for selected patient ────────────────────────────────────
    const fetchForecast = useCallback(async () => {
        if (!selectedId) return
        try {
            const resp = await getRiskForecast(selectedId)
            setForecast(resp.data)
        } catch (e) {
            console.error('[Forecast] Error:', e.message)
        }
    }, [selectedId])

    // ── Fetch alerts ───────────────────────────────────────────────────────────
    const fetchAlerts = useCallback(async () => {
        try {
            const [activeResp, logResp] = await Promise.all([getActiveAlerts(), getAlertLog()])
            setActiveAlerts(activeResp.data)
            setAlertLog(logResp.data)
        } catch (e) {
            console.error('[Alerts] Error:', e.message)
        }
    }, [])

    // ── Patient selection ──────────────────────────────────────────────────────
    const handleSelectPatient = (id) => {
        setSelectedId(id)
        setVitals(null)
        setVitalsHistory([])
        setPrediction(null)
        setContributions([])
        setForecast(null)
        setRiskHistory([])
        // Update baseline for selected patient
        const p = patients.find(pt => pt.id === id)
        if (p) setSelectedBaseline(p.baseline)
    }

    // Map patient for details
    const selectedPatient = patients.find(p => p.id === selectedId)

    // ── Polling effects ────────────────────────────────────────────────────────
    useEffect(() => { fetchICUData() }, [])
    useEffect(() => {
        const t = setInterval(fetchICUData, SUMMARY_POLL_MS)
        return () => clearInterval(t)
    }, [fetchICUData])

    useEffect(() => {
        if (!selectedId) return
        // Reset baseline when patient changes
        const p = patients.find(pt => pt.id === selectedId)
        if (p) setSelectedBaseline(p.baseline)

        fetchVitals()
        fetchPrediction()
        fetchForecast()

        const vitalsTimer = setInterval(fetchVitals, VITALS_POLL_MS)
        const predTimer = setInterval(fetchPrediction, PREDICTION_POLL_MS)
        const forecastTimer = setInterval(fetchForecast, PREDICTION_POLL_MS * 3)
        return () => {
            clearInterval(vitalsTimer)
            clearInterval(predTimer)
            clearInterval(forecastTimer)
        }
    }, [selectedId])

    useEffect(() => {
        fetchAlerts()
        const t = setInterval(fetchAlerts, ALERTS_POLL_MS)
        return () => clearInterval(t)
    }, [fetchAlerts])

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* ── HEADER ─────────────────────────────────────────────────────────── */}
            <header className="header px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-lg">🏥</span>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white tracking-tight">VITALGUARD 2.0</div>
                        <div className="text-xs text-slate-500">AI-Based Remote ICU Monitoring & Predictive Triage</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* System status indicator */}
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-slate-400">SYSTEM ONLINE</span>
                    </div>
                    {/* Alert badge */}
                    {activeAlerts.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                            <span className="text-xs font-bold text-red-400 alert-badge">
                                🔔 {activeAlerts.length} Alert{activeAlerts.length > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                    <div className="text-xs text-slate-600 font-mono">
                        {new Date().toLocaleString()}
                    </div>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* ────────────────────────────────────────────────────────────────── */}
                {/* LAYER 1: ICU Command Center                                        */}
                {/* ────────────────────────────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                        <span className="w-5 h-0.5 bg-blue-400/50 rounded" />
                        LAYER 1 — ICU Command Center
                    </h2>

                    {/* Feature 1: Summary Metrics */}
                    <SummaryMetrics summary={summary} loading={summaryLoading} />

                    <div className="mt-4 grid grid-cols-12 gap-4">
                        {/* Feature 2: ICU Risk Index */}
                        <div className="col-span-12 lg:col-span-2">
                            <RiskIndex summary={summary} />
                        </div>

                        {/* Feature 3: Bed Heatmap */}
                        <div className="col-span-12 lg:col-span-4">
                            <BedHeatmap
                                patients={patients}
                                selectedId={selectedId}
                                onSelect={handleSelectPatient}
                            />
                        </div>

                        {/* Feature 4: Multi-Patient Dashboard */}
                        <div className="col-span-12 lg:col-span-6">
                            <PatientDashboard
                                patients={patients}
                                selectedId={selectedId}
                                onSelect={handleSelectPatient}
                                loading={summaryLoading}
                            />
                        </div>
                    </div>
                </section>

                {/* ────────────────────────────────────────────────────────────────── */}
                {/* LAYER 3: Patient Intelligence Panel                                */}
                {/* ────────────────────────────────────────────────────────────────── */}
                {selectedId && (
                    <section>
                        <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                            <span className="w-5 h-0.5 bg-cyan-400/50 rounded" />
                            LAYER 3 — Patient Intelligence: {selectedPatient?.name} ({selectedId}) · {selectedPatient?.bed}
                        </h2>

                        {/* Feature 9: Real-Time Vitals */}
                        <VitalsDisplay vitals={vitals} baseline={selectedBaseline} />

                        <div className="mt-4 grid grid-cols-12 gap-4">
                            {/* Feature 10: Vitals Trend Chart */}
                            <div className="col-span-12 lg:col-span-7">
                                <VitalsTrendChart history={vitalsHistory} />
                            </div>
                            {/* Feature 14: Explainable AI */}
                            <div className="col-span-12 lg:col-span-5">
                                <ExplainableAI contributions={contributions} predictionResult={prediction} />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-12 gap-4">
                            {/* Feature 12: Risk Progression Timeline */}
                            <div className="col-span-12 lg:col-span-6">
                                <RiskTimeline riskHistory={riskHistory} />
                            </div>
                            {/* Feature 13: Short-Term Risk Forecast */}
                            <div className="col-span-12 lg:col-span-6">
                                <RiskForecast forecast={forecast} currentRisk={prediction?.risk_score ?? 0} />
                            </div>
                        </div>
                    </section>
                )}

                {/* ────────────────────────────────────────────────────────────────── */}
                {/* LAYER 4: Intelligent Alert Engine                                  */}
                {/* ────────────────────────────────────────────────────────────────── */}
                <section>
                    <h2 className="text-xs font-bold text-orange-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                        <span className="w-5 h-0.5 bg-orange-400/50 rounded" />
                        LAYER 4 — Intelligent Alert Engine
                    </h2>

                    <div className="grid grid-cols-12 gap-4">
                        {/* Feature 15: Active Alerts */}
                        <div className="col-span-12 lg:col-span-6">
                            <AlertPanel alerts={activeAlerts} onRefresh={fetchAlerts} />
                        </div>
                        {/* Feature 16: Alert Log Timeline */}
                        <div className="col-span-12 lg:col-span-6">
                            <AlertLog log={alertLog} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
