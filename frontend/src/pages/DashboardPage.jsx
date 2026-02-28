/**
 * DashboardPage — VITALGUARD 2.0
 * Complete 4-layer ICU command dashboard.
 * Layer 1 (Command Center) always visible.
 * Layer 2 (Smart Triage Core) shown inline when a patient is selected.
 * Layer 3 (Patient Intelligence) shown inline below Layer 2.
 * Layer 4 (Alert Engine) always visible at the bottom.
 * Clicking a patient in the dashboard selects them and inline panels appear.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
    getPatients, getICUSummary, getCurrentVitals, getVitalsHistory,
    runPrediction, explainPrediction, getRiskForecast, getActiveAlerts, getAlertLog,
} from '../api/client'

import SummaryMetrics from '../components/layer1/SummaryMetrics'
import RiskIndex from '../components/layer1/RiskIndex'
import BedHeatmap from '../components/layer1/BedHeatmap'
import PatientDashboard from '../components/layer1/PatientDashboard'
import VitalsDisplay from '../components/layer3/VitalsDisplay'
import VitalsTrendChart from '../components/layer3/VitalsTrendChart'
import RiskTimeline from '../components/layer3/RiskTimeline'
import RiskForecast from '../components/layer3/RiskForecast'
import ExplainableAI from '../components/layer3/ExplainableAI'
import RiskExplanationCard from '../components/layer3/RiskExplanationCard'
import AlertPanel from '../components/layer4/AlertPanel'
import AlertLog from '../components/layer4/AlertLog'
import { useAlarm } from '../hooks/useAlarm'

const VITALS_POLL_MS = 3000
const PREDICTION_POLL_MS = 5000
const ALERTS_POLL_MS = 4000
const SUMMARY_POLL_MS = 8000

const RISK_BADGE = {
    red: { cls: 'risk-bg-red glow-red text-[var(--risk-red)]', label: 'CRITICAL' },
    yellow: { cls: 'risk-bg-yellow glow-yellow text-[var(--risk-yellow)]', label: 'MODERATE' },
    green: { cls: 'risk-bg-green text-[var(--risk-green)]', label: 'STABLE' },
}

export default function DashboardPage() {
    // ── Layer 1 state ────────────────────────────────────────────────────────
    const [patients, setPatients] = useState([])
    const [summary, setSummary] = useState(null)
    const [summaryLoading, setSummaryLoading] = useState(true)
    const [selectedId, setSelectedId] = useState(null)

    // ── Layer 3 state ────────────────────────────────────────────────────────
    const [vitals, setVitals] = useState(null)
    const [vitalsHistory, setVitalsHistory] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [contributions, setContributions] = useState([])
    const [forecast, setForecast] = useState(null)
    const [riskHistory, setRiskHistory] = useState([])
    const [selectedBaseline, setSelectedBaseline] = useState(null)

    // ── Layer 4 state ────────────────────────────────────────────────────────
    const [activeAlerts, setActiveAlerts] = useState([])
    const [alertLog, setAlertLog] = useState([])
    const [alarmBanner, setAlarmBanner] = useState(null)

    // Alarm fires reactively whenever patients array changes (every poll)
    useAlarm(patients, (name) => {
        setAlarmBanner(name)
        setTimeout(() => setAlarmBanner(null), 8000)
    })

    // ── Fetchers ─────────────────────────────────────────────────────────────
    const fetchICUData = useCallback(async () => {
        try {
            const [pRes, sRes] = await Promise.all([getPatients(), getICUSummary()])
            setPatients(pRes.data)
            setSummary(sRes.data)
            setSummaryLoading(false)
            if (!selectedId && pRes.data.length > 0) {
                setSelectedId(pRes.data[0].id)
            }
        } catch (e) { console.error('[ICU Summary]', e.message) }
    }, [selectedId])

    const fetchVitals = useCallback(async () => {
        if (!selectedId) return
        try {
            const [curRes, histRes] = await Promise.all([
                getCurrentVitals(selectedId), getVitalsHistory(selectedId)
            ])
            setVitals(curRes.data)
            setVitalsHistory(histRes.data.history || [])
        } catch (e) { console.error('[Vitals]', e.message) }
    }, [selectedId])

    const fetchPrediction = useCallback(async () => {
        if (!selectedId) return
        try {
            const [predRes, explainRes] = await Promise.all([
                runPrediction(selectedId), explainPrediction(selectedId)
            ])
            const pred = predRes.data
            setPrediction(pred)
            setContributions(explainRes.data.contributions || [])
            setRiskHistory(prev => [...prev, {
                timestamp: pred.timestamp,
                risk_score: pred.risk_score,
                risk_level: pred.risk_level,
            }].slice(-30))
        } catch (e) { console.error('[Prediction]', e.message) }
    }, [selectedId])

    const fetchForecast = useCallback(async () => {
        if (!selectedId) return
        try { setForecast((await getRiskForecast(selectedId)).data) }
        catch (e) { console.error('[Forecast]', e.message) }
    }, [selectedId])

    const fetchAlerts = useCallback(async () => {
        try {
            const [aRes, lRes] = await Promise.all([getActiveAlerts(), getAlertLog()])
            setActiveAlerts(aRes.data)
            setAlertLog(lRes.data)
        } catch (e) { console.error('[Alerts]', e.message) }
    }, [])

    // ── Patient click handler ─────────────────────────────────────────────
    const handleSelect = (id) => {
        setSelectedId(id)
        setVitals(null); setVitalsHistory([]); setPrediction(null)
        setContributions([]); setForecast(null); setRiskHistory([])
        const p = patients.find(pt => pt.id === id)
        if (p) setSelectedBaseline(p.baseline)
    }

    // ── Polling effects ───────────────────────────────────────────────────
    useEffect(() => { fetchICUData() }, [])
    useEffect(() => {
        const t = setInterval(fetchICUData, SUMMARY_POLL_MS)
        return () => clearInterval(t)
    }, [fetchICUData])

    useEffect(() => {
        if (!selectedId) return
        const p = patients.find(pt => pt.id === selectedId)
        if (p) setSelectedBaseline(p.baseline)
        fetchVitals(); fetchPrediction(); fetchForecast()
        const v = setInterval(fetchVitals, VITALS_POLL_MS)
        const pr = setInterval(fetchPrediction, PREDICTION_POLL_MS)
        const fo = setInterval(fetchForecast, PREDICTION_POLL_MS * 3)
        return () => { clearInterval(v); clearInterval(pr); clearInterval(fo) }
    }, [selectedId])

    useEffect(() => {
        fetchAlerts()
        const t = setInterval(fetchAlerts, ALERTS_POLL_MS)
        return () => clearInterval(t)
    }, [fetchAlerts])

    const selectedPatient = patients.find(p => p.id === selectedId)
    const riskLevel = prediction?.risk_level || selectedPatient?.risk_level || 'green'
    const badge = RISK_BADGE[riskLevel] || RISK_BADGE.green

    return (
        <div className="space-y-8">

            {/* ── CRITICAL ALARM BANNER ──────────────────────────────────── */}
            {alarmBanner && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-600/40 animate-bounce">
                    <span className="text-xl">🚨</span>
                    <span className="font-bold text-sm">CRITICAL — {alarmBanner} crossed 98% risk threshold!</span>
                    <button onClick={() => setAlarmBanner(null)} className="ml-2 text-red-200 hover:text-white">✕</button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  LAYER 1 — ICU COMMAND CENTER                                 */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-0.5 bg-blue-400/50 rounded" />
                    <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase">Layer 1 — ICU Command Center</h2>
                </div>

                <SummaryMetrics summary={summary} loading={summaryLoading} />

                <div className="mt-4 grid grid-cols-12 gap-4">
                    <div className="col-span-12 lg:col-span-2">
                        <RiskIndex summary={summary} />
                    </div>
                    <div className="col-span-12 lg:col-span-4">
                        <BedHeatmap patients={patients} selectedId={selectedId} onSelect={handleSelect} />
                    </div>
                    <div className="col-span-12 lg:col-span-6">
                        <PatientDashboard patients={patients} selectedId={selectedId} onSelect={handleSelect} loading={summaryLoading} />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  LAYER 2 — SMART TRIAGE CORE  (shows when patient selected)  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {selectedId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-5 h-0.5 bg-violet-400/50 rounded" />
                        <h2 className="text-xs font-bold text-violet-400 tracking-widest uppercase">
                            Layer 2 — Smart Triage Core
                        </h2>
                    </div>

                    {/* XGBoost Prediction Result Card */}
                    <div className="glass-card p-5 border mb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">
                                    Selected Patient · {selectedPatient?.name} · {selectedPatient?.bed}
                                </p>
                                <h3 className="text-sm font-bold text-white">XGBoost Risk Prediction</h3>
                            </div>

                            {prediction ? (
                                <div className="flex items-center gap-5 flex-wrap">
                                    {/* Risk Score */}
                                    <div className="text-center">
                                        <div className={`text-4xl font-black ${badge.cls.includes('red') ? 'text-red-400' : badge.cls.includes('yellow') ? 'text-yellow-400' : 'text-green-400'}`}>
                                            {prediction.risk_score?.toFixed(1)}%
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Risk Score</div>
                                    </div>

                                    {/* Risk Level Badge */}
                                    <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${badge.cls}`}>
                                        {badge.label}
                                    </div>

                                    {/* Confidence */}
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">
                                            {(prediction.confidence * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">Model Confidence</div>
                                    </div>

                                    {/* Risk bar */}
                                    <div className="w-40">
                                        <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                                            <span>0%</span><span>50%</span><span>100%</span>
                                        </div>
                                        <div className="risk-bar">
                                            <div className="risk-bar-fill"
                                                style={{
                                                    width: `${prediction.risk_score}%`,
                                                    background: riskLevel === 'red' ? 'var(--risk-red)' : riskLevel === 'yellow' ? 'var(--risk-yellow)' : 'var(--risk-green)',
                                                }} />
                                        </div>
                                        {/* Threshold markers */}
                                        <div className="relative h-2 mt-1">
                                            <div className="absolute left-[40%] w-px h-2 bg-yellow-500/50" title="Moderate threshold (40%)" />
                                            <div className="absolute left-[70%] w-px h-2 bg-red-500/50" title="Critical threshold (70%)" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    Running XGBoost prediction...
                                </div>
                            )}
                        </div>

                        {/* Risk classification legend */}
                        <div className="mt-4 flex gap-5 flex-wrap border-t border-[var(--border)] pt-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-xs text-slate-400">Stable: 0–40%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-xs text-slate-400">Moderate: 40–70%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-xs text-slate-400">Critical: 70–100%</span>
                            </div>
                            {prediction && (
                                <div className="ml-auto text-[11px] text-slate-600 font-mono">
                                    Last updated: {new Date(prediction.timestamp).toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  LAYER 3 — PATIENT INTELLIGENCE PANEL                         */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {selectedId && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-5 h-0.5 bg-cyan-400/50 rounded" />
                        <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">
                            Layer 3 — Patient Intelligence: {selectedPatient?.name} ({selectedId}) · {selectedPatient?.bed}
                        </h2>
                    </div>

                    {/* Feature 9 + 11: Real-Time Vitals + Deviation */}
                    <VitalsDisplay vitals={vitals} baseline={selectedBaseline} patientId={selectedId} />

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

                    {/* Feature 12+13: Risk Timeline + Forecast */}
                    <div className="mt-4 grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-6">
                            <RiskTimeline riskHistory={riskHistory} />
                        </div>
                        <div className="col-span-12 lg:col-span-6">
                            <RiskForecast forecast={forecast} currentRisk={prediction?.risk_score ?? 0} />
                        </div>
                    </div>

                    {/* Feature NEW: Clinical Risk Explanation */}
                    <div className="mt-4">
                        <RiskExplanationCard
                            vitals={vitals}
                            contributions={contributions}
                            predictionResult={prediction}
                            patientName={selectedPatient?.name}
                        />
                    </div>
                </section>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/*  LAYER 4 — INTELLIGENT ALERT ENGINE                           */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-0.5 bg-orange-400/50 rounded" />
                    <h2 className="text-xs font-bold text-orange-400 tracking-widest uppercase">Layer 4 — Intelligent Alert Engine</h2>
                </div>

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
    )
}
