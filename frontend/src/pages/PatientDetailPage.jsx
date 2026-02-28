/**
 * PatientDetailPage — VITALGUARD 2.0
 * Full Layer 3 patient intelligence view for a single patient, routed via /patient/:id
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import {
    getPatient, getCurrentVitals, getVitalsHistory,
    runPrediction, explainPrediction, getRiskForecast,
} from '../api/client'

import VitalsDisplay from '../components/layer3/VitalsDisplay'
import VitalsTrendChart from '../components/layer3/VitalsTrendChart'
import RiskTimeline from '../components/layer3/RiskTimeline'
import RiskForecast from '../components/layer3/RiskForecast'
import ExplainableAI from '../components/layer3/ExplainableAI'

const VITALS_MS = 3000
const PREDICTION_MS = 5000

const RISK_BADGE = {
    red: 'risk-bg-red risk-red',
    yellow: 'risk-bg-yellow risk-yellow',
    green: 'risk-bg-green risk-green',
}

export default function PatientDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [patient, setPatient] = useState(null)
    const [vitals, setVitals] = useState(null)
    const [vitalsHistory, setVitalsHistory] = useState([])
    const [prediction, setPrediction] = useState(null)
    const [contributions, setContributions] = useState([])
    const [forecast, setForecast] = useState(null)
    const [riskHistory, setRiskHistory] = useState([])

    // Load patient info once
    useEffect(() => {
        getPatient(id).then(r => setPatient(r.data)).catch(console.error)
    }, [id])

    const fetchVitals = useCallback(async () => {
        try {
            const [cur, hist] = await Promise.all([getCurrentVitals(id), getVitalsHistory(id)])
            setVitals(cur.data)
            setVitalsHistory(hist.data.history || [])
        } catch (e) { console.error('[PatientDetail] Vitals:', e.message) }
    }, [id])

    const fetchPrediction = useCallback(async () => {
        try {
            const [pred, explain] = await Promise.all([runPrediction(id), explainPrediction(id)])
            setPrediction(pred.data)
            setContributions(explain.data.contributions || [])
            setRiskHistory(prev => {
                const updated = [...prev, { timestamp: pred.data.timestamp, risk_score: pred.data.risk_score, risk_level: pred.data.risk_level }]
                return updated.slice(-30)
            })
        } catch (e) { console.error('[PatientDetail] Prediction:', e.message) }
    }, [id])

    const fetchForecast = useCallback(async () => {
        try {
            const r = await getRiskForecast(id)
            setForecast(r.data)
        } catch (e) { console.error('[PatientDetail] Forecast:', e.message) }
    }, [id])

    useEffect(() => {
        fetchVitals(); fetchPrediction(); fetchForecast()
        const v = setInterval(fetchVitals, VITALS_MS)
        const p = setInterval(fetchPrediction, PREDICTION_MS)
        const f = setInterval(fetchForecast, PREDICTION_MS * 3)
        return () => { clearInterval(v); clearInterval(p); clearInterval(f) }
    }, [id])

    const riskLevel = prediction?.risk_level || patient?.risk_level || 'green'
    const badgeCls = RISK_BADGE[riskLevel] || RISK_BADGE.green

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-[var(--border)] transition-colors">
                        <ArrowLeft size={15} className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-base font-bold text-white">
                            {patient?.name || id}
                        </h1>
                        <p className="text-xs text-slate-500">{patient?.bed} · Admitted {patient?.admit_date} · Age {patient?.age}</p>
                    </div>
                    {prediction && (
                        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase ${badgeCls}`}>
                            {riskLevel} · {prediction.risk_score?.toFixed(1)}%
                        </div>
                    )}
                </div>
                <button onClick={() => { fetchVitals(); fetchPrediction(); fetchForecast() }}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white glass-card border transition-all">
                    <RefreshCw size={12} /> Refresh
                </button>
            </div>

            {/* Layer 3 label */}
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-cyan-400/50 rounded" />
                <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Layer 3 — Patient Intelligence Panel</h2>
            </div>

            {/* Feature 9+11: Vitals + Deviation */}
            <VitalsDisplay vitals={vitals} baseline={patient?.baseline} patientId={id} />

            <div className="grid grid-cols-12 gap-4">
                {/* Feature 10: Trend Chart */}
                <div className="col-span-12 lg:col-span-7">
                    <VitalsTrendChart history={vitalsHistory} />
                </div>
                {/* Feature 14: Explainable AI */}
                <div className="col-span-12 lg:col-span-5">
                    <ExplainableAI contributions={contributions} predictionResult={prediction} />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Feature 12: Risk Timeline */}
                <div className="col-span-12 lg:col-span-6">
                    <RiskTimeline riskHistory={riskHistory} />
                </div>
                {/* Feature 13: Forecast */}
                <div className="col-span-12 lg:col-span-6">
                    <RiskForecast forecast={forecast} currentRisk={prediction?.risk_score ?? 0} />
                </div>
            </div>
        </div>
    )
}
