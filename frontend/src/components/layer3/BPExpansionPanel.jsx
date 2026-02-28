/**
 * BPExpansionPanel — VITALGUARD 2.0
 * Expandable BP vital module showing:
 *  1. Sub-parameters (systolic, diastolic, PP, MAP, HR, sodium, age, BMI)
 *  2. Risk scoring (weighted composite 0-100%)
 *  3. Prescription (rule-based medication plan)
 *  4. Medication history
 *  5. 24-hour prediction (worsen/stable/improve)
 *  6. Visual variance (systolic/diastolic trend + risk trend charts)
 *  7. BP-specific alerts
 */
import React, { useState, useEffect, useCallback } from 'react'
import { getBPAnalysis } from '../../api/client'
import {
    Heart, Droplets, Activity, Thermometer, Scale, Clock,
    AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
    Pill, ChevronDown, ChevronUp, RefreshCw, X, FileText,
} from 'lucide-react'

const POLL_MS = 5000

// ── Color helpers ──────────────────────────────────────────────────────────
const RISK_COLORS = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', fill: '#22c55e' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', fill: '#eab308' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', fill: '#f97316' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', fill: '#ef4444' },
}

const TREND_COLORS = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
}

// ── Sub-Parameter Display ──────────────────────────────────────────────────
function SubParamGrid({ params }) {
    if (!params) return null
    const items = [
        { label: 'Systolic', value: params.systolic, unit: 'mmHg', icon: '🩸', color: params.systolic >= 140 ? 'red' : params.systolic >= 130 ? 'yellow' : 'green' },
        { label: 'Diastolic', value: params.diastolic, unit: 'mmHg', icon: '💉', color: params.diastolic >= 90 ? 'red' : params.diastolic >= 80 ? 'yellow' : 'green' },
        { label: 'Pulse Pressure', value: params.pulse_pressure, unit: 'mmHg', icon: '📈', color: params.pulse_pressure > 60 ? 'orange' : 'green', derived: true },
        { label: 'MAP', value: params.map, unit: 'mmHg', icon: '🎯', color: params.map >= 100 ? 'orange' : params.map < 65 ? 'red' : 'green', derived: true },
        { label: 'Heart Rate', value: params.heart_rate, unit: 'bpm', icon: '❤️', color: params.heart_rate > 100 ? 'red' : 'green' },
        { label: 'Sodium', value: params.sodium, unit: 'mEq/L', icon: '🧪', color: params.sodium > 145 ? 'red' : 'green' },
        { label: 'Age', value: params.age, unit: 'yrs', icon: '👤', color: params.age > 60 ? 'yellow' : 'green' },
        { label: 'BMI', value: params.bmi, unit: 'kg/m²', icon: '⚖️', color: params.bmi > 30 ? 'orange' : 'green' },
    ]
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Droplets size={13} /> BP Sub-Parameters
            </h4>
            <div className="grid grid-cols-4 gap-2">
                {items.map(({ label, value, unit, icon, color, derived }) => {
                    const c = RISK_COLORS[color] || RISK_COLORS.green
                    return (
                        <div key={label} className={`p-3 rounded-xl border ${c.bg} ${c.border} relative`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                                <span className="text-sm">{icon}</span>
                            </div>
                            <div className={`text-lg font-black ${c.text}`}>
                                {value}
                                <span className="text-[10px] font-normal ml-1 opacity-60">{unit}</span>
                            </div>
                            {derived && (
                                <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    auto
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Risk Score Display ─────────────────────────────────────────────────────
function RiskScoreSection({ risk }) {
    if (!risk) return null
    const c = RISK_COLORS[risk.color] || RISK_COLORS.green
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={13} /> BP Risk Assessment
            </h4>
            <div className={`p-5 rounded-xl border ${c.bg} ${c.border}`}>
                <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                        <div className={`text-4xl font-black ${c.text}`}>{risk.percentage}%</div>
                        <div className="text-[10px] text-slate-500 mt-1">Risk Score</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${c.bg} ${c.border} ${c.text}`}>
                        {risk.category}
                    </div>
                    <div className="text-xs text-slate-500">
                        Raw: {risk.raw_score} / {risk.max_possible}
                    </div>
                </div>
                {/* Risk bar */}
                <div className="h-3 rounded-full bg-white/5 mb-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${risk.percentage}%`, background: c.fill }} />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{risk.interpretation}</p>
                {/* Breakdown */}
                {risk.breakdown && risk.breakdown.length > 0 && (
                    <div className="border-t border-[var(--border)] pt-3 space-y-1.5">
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-1">Contributing Factors</div>
                        {risk.breakdown.map(({ factor, points }, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">⚠ {factor}</span>
                                <span className={`text-xs font-bold ${c.text}`}>+{points} pts</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Prescription Display ───────────────────────────────────────────────────
function MedicationCard({ med }) {
    return (
        <div className="p-3 rounded-lg bg-white/3 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
                <Pill size={13} className="text-blue-400" />
                <span className="text-sm font-bold text-white">{med.medication}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{med.dosage}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <div className="text-slate-500">Frequency: <span className="text-slate-300">{med.frequency}</span></div>
                <div className="text-slate-500">Timing: <span className="text-slate-300">{med.timing}</span></div>
                <div className="text-slate-500">Period: <span className="text-slate-300">{med.meal_period}</span></div>
                <div className="text-slate-500">Duration: <span className="text-slate-300">{med.duration_days} days</span></div>
                <div className="text-slate-500">Start: <span className="text-slate-300 font-mono">{med.start_date}</span></div>
                <div className="text-slate-500">End: <span className="text-slate-300 font-mono">{med.end_date}</span></div>
            </div>
        </div>
    )
}

function PrescriptionSection({ prescription }) {
    if (!prescription || prescription.stage === 'NORMAL') return null
    const stageColors = {
        'STAGE 1': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'STAGE 2': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'SEVERE': 'text-red-400 bg-red-500/10 border-red-500/20',
    }
    const cls = stageColors[prescription.stage] || stageColors['STAGE 1']
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={13} /> Prescription Plan
            </h4>
            <div className="glass-card p-5 border">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${cls}`}>{prescription.stage}</span>
                    <span className="text-[10px] text-slate-600">Generated: {new Date(prescription.generated_at).toLocaleString()}</span>
                </div>
                <div className="space-y-2 mb-4">
                    <div className="text-[10px] text-slate-600 font-bold uppercase">Primary Plan</div>
                    {prescription.primary_plan.map((med, i) => <MedicationCard key={i} med={med} />)}
                </div>
                {prescription.alternative_plan && (
                    <div className="space-y-2 mb-4">
                        <div className="text-[10px] text-slate-600 font-bold uppercase">Alternative Plan</div>
                        {prescription.alternative_plan.map((med, i) => <MedicationCard key={i} med={med} />)}
                    </div>
                )}
                <div className="border-t border-[var(--border)] pt-3">
                    <p className="text-xs text-slate-400 italic">📋 {prescription.clinical_notes}</p>
                </div>
            </div>
        </div>
    )
}

// ── Medication History ─────────────────────────────────────────────────────
function MedHistorySection({ history }) {
    if (!history || history.length === 0) return null
    const recent = history.slice(-3).reverse()
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={13} /> Currently Prescribed Medications
            </h4>
            <div className="space-y-2">
                {recent.map((entry, i) => (
                    <div key={i} className="glass-card p-4 border">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-slate-600 font-mono">{new Date(entry.prescribed_at).toLocaleString()}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{entry.stage}</span>
                        </div>
                        <div className="space-y-1">
                            {entry.medications.map((m, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs">
                                    <Pill size={11} className="text-blue-400" />
                                    <span className="text-white font-medium">{m.medication} {m.dosage}</span>
                                    <span className="text-slate-500">— {m.timing}, {m.meal_period}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Prediction Engine (Enhanced with Medication Correlation) ────────────────
function PredictionSection({ prediction }) {
    if (!prediction) return null
    const bars = [
        { label: 'Worsening', pct: prediction.prob_worsening, color: '#ef4444' },
        { label: 'Stabilization', pct: prediction.prob_stabilization, color: '#eab308' },
        { label: 'Improvement', pct: prediction.prob_improvement, color: '#22c55e' },
    ]
    const trendIcon = prediction.trend === 'Worsening' ? <TrendingUp size={14} /> : prediction.trend === 'Improving' ? <TrendingDown size={14} /> : <Activity size={14} />
    const tc = TREND_COLORS[prediction.trend_color] || 'text-slate-400'
    const meds = prediction.medication_inputs || []
    const hasBeforeAfter = prediction.risk_before_medication !== undefined

    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={13} /> 24-Hour BP Prediction (Correlated: Sub-Parameters + Medication)
            </h4>
            <div className="glass-card p-5 border space-y-5">

                {/* A. MEDICATION INPUTS USED FOR PREDICTION */}
                {meds.length > 0 && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2 flex items-center gap-1.5">
                            <Pill size={11} /> Medication Inputs Used in Prediction
                        </div>
                        <div className="space-y-2">
                            {meds.map((med, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                        <Pill size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{med.medication}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{med.drug_class}</span>
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{med.status}</span>
                                        </div>
                                        <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                                            <span>Dosage: <span className="text-slate-300">{med.dosage}</span></span>
                                            <span>Timing: <span className="text-slate-300">{med.timing}</span></span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-green-400 font-bold">↓ {med.expected_sys_reduction} sys</div>
                                        <div className="text-[10px] text-cyan-400 font-bold">↓ {med.expected_dia_reduction} dia</div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                                <span className="text-[10px] text-slate-500 font-bold">Total Medication Effect:</span>
                                <span className="text-xs text-green-400 font-bold">↓ {prediction.total_sys_reduction} mmHg Systolic</span>
                                <span className="text-xs text-cyan-400 font-bold">↓ {prediction.total_dia_reduction} mmHg Diastolic</span>
                            </div>
                        </div>
                    </div>
                )}

                {meds.length === 0 && (
                    <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/15">
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <Pill size={11} /> No medications active — prediction based on raw sub-parameters only
                        </div>
                    </div>
                )}

                {/* B. BEFORE vs AFTER MEDICATION RISK COMPARISON */}
                {hasBeforeAfter && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">Before → After Medication Risk</div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Before Medication</div>
                                <div className="text-2xl font-black text-red-400">{prediction.risk_before_medication}%</div>
                                <div className="text-[9px] text-slate-500 mt-1">Raw Risk (no drugs)</div>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center flex flex-col items-center justify-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Risk Reduction</div>
                                <div className="text-2xl font-black text-emerald-400">
                                    {prediction.risk_reduction > 0 ? '↓' : '='} {Math.abs(prediction.risk_reduction)}%
                                </div>
                                <div className="text-[9px] text-emerald-400 mt-1">Medication Impact</div>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15 text-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">After Medication</div>
                                <div className="text-2xl font-black text-green-400">{prediction.risk_after_medication}%</div>
                                <div className="text-[9px] text-slate-500 mt-1">Projected Risk</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* C. PROJECTED VITALS AFTER MEDICATION */}
                {prediction.projected_sys_after_med && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">Projected Vitals After Medication</div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
                                <div className="text-[9px] text-slate-500">Systolic</div>
                                <div className="text-lg font-black text-violet-400">{prediction.projected_sys_after_med} <span className="text-[9px] font-normal">mmHg</span></div>
                            </div>
                            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-center">
                                <div className="text-[9px] text-slate-500">Diastolic</div>
                                <div className="text-lg font-black text-cyan-400">{prediction.projected_dia_after_med} <span className="text-[9px] font-normal">mmHg</span></div>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                                <div className="text-[9px] text-slate-500">MAP</div>
                                <div className="text-lg font-black text-amber-400">{prediction.projected_map_after_med} <span className="text-[9px] font-normal">mmHg</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* D. INPUT PARAMETERS TABLE */}
                {prediction.input_parameters && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">Input Parameters Used</div>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(prediction.input_parameters).map(([key, val]) => (
                                <div key={key} className="p-2 rounded-lg bg-white/2 border border-[var(--border)] text-center">
                                    <div className="text-[8px] text-slate-600 uppercase">{key.replace('_', ' ')}</div>
                                    <div className="text-xs font-bold text-slate-300">{typeof val === 'number' ? val.toFixed?.(1) ?? val : val}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* E. FINAL CORRELATED OUTCOME */}
                <div className="border-t border-[var(--border)] pt-4">
                    <div className="text-[10px] text-slate-600 font-bold uppercase mb-3">Final Correlated Prediction (Sub-Params + Medication)</div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${RISK_COLORS[prediction.trend_color]?.bg || ''} ${RISK_COLORS[prediction.trend_color]?.border || ''} ${tc}`}>
                            {trendIcon} {prediction.trend}
                        </div>
                        <span className="text-[10px] text-slate-600">Horizon: {prediction.horizon}</span>
                    </div>
                    <div className="space-y-3">
                        {bars.map(({ label, pct, color }) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-400">{label}</span>
                                    <span className="font-bold" style={{ color }}>{pct}%</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, background: color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Visual Variance (Mini Chart) ───────────────────────────────────────────
function VarianceChart({ data, title, dataKey, color, zone }) {
    if (!data || data.length < 2) return <div className="text-[10px] text-slate-600 text-center py-4">Collecting data...</div>
    const values = data.map(d => d[dataKey])
    const minV = Math.min(...values) - 5
    const maxV = Math.max(...values) + 5
    const range = maxV - minV || 1
    const W = 100
    const H = 50

    const points = values.map((v, i) => {
        const x = (i / (values.length - 1)) * W
        const y = H - ((v - minV) / range) * H
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="glass-card p-4 border">
            <div className="text-[10px] text-slate-500 font-bold mb-2">{title}</div>
            <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-16" preserveAspectRatio="none">
                {/* Danger zone */}
                {zone && (
                    <rect x="0" y={H - ((zone.hi - minV) / range) * H} width={W}
                        height={((zone.hi - zone.lo) / range) * H}
                        fill={zone.color} opacity="0.08" />
                )}
                <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
                {/* Dots for last 3 points */}
                {values.slice(-3).map((v, i) => {
                    const idx = values.length - 3 + i
                    const x = (idx / (values.length - 1)) * W
                    const y = H - ((v - minV) / range) * H
                    return <circle key={i} cx={x} cy={y} r="2" fill={color} />
                })}
            </svg>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>{data.length > 0 ? new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <span>{data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
        </div>
    )
}

function VarianceDashboard({ data }) {
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={13} /> BP Variance Dashboard
            </h4>
            <div className="grid grid-cols-2 gap-3">
                <VarianceChart data={data} title="Systolic Trend" dataKey="systolic" color="#8b5cf6"
                    zone={{ lo: 140, hi: 180, color: '#ef4444' }} />
                <VarianceChart data={data} title="Diastolic Trend" dataKey="diastolic" color="#06b6d4"
                    zone={{ lo: 90, hi: 120, color: '#ef4444' }} />
                <VarianceChart data={data} title="MAP Trend" dataKey="map" color="#f59e0b"
                    zone={{ lo: 0, hi: 65, color: '#ef4444' }} />
                <VarianceChart data={data} title="Risk Score Trend" dataKey="risk_pct" color="#ef4444"
                    zone={{ lo: 75, hi: 100, color: '#ef4444' }} />
            </div>
        </div>
    )
}

// ── BP Alerts ──────────────────────────────────────────────────────────────
function BPAlertBadges({ alerts }) {
    if (!alerts || alerts.length === 0) return null
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={13} /> BP Alerts
            </h4>
            <div className="space-y-2">
                {alerts.map((a, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${a.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                        <AlertTriangle size={14} className={a.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'} />
                        <span className="text-xs text-slate-300 flex-1">{a.message}</span>
                        <span className="text-[10px] text-slate-600 font-mono">{new Date(a.timestamp).toLocaleTimeString()}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT: BPExpansionPanel
// ═══════════════════════════════════════════════════════════════════════════════
export default function BPExpansionPanel({ patientId, onClose }) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchBP = useCallback(async () => {
        try {
            const res = await getBPAnalysis(patientId)
            setData(res.data)
            setError(null)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => {
        fetchBP()
        const t = setInterval(fetchBP, POLL_MS)
        return () => clearInterval(t)
    }, [fetchBP])

    if (loading) {
        return (
            <div className="glass-card p-8 border text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <div className="text-xs text-slate-500">Loading BP Analysis for {patientId}...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="glass-card p-6 border text-center">
                <AlertTriangle size={20} className="text-red-400 mx-auto mb-2" />
                <div className="text-xs text-red-400">BP Module Error: {error}</div>
            </div>
        )
    }

    return (
        <div className="glass-card border overflow-hidden animate-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-violet-600/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                        🩸
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Blood Pressure Analysis</h3>
                        <p className="text-[10px] text-slate-500">
                            {data?.patient_name} · {data?.bed} · Auto-refresh every {POLL_MS / 1000}s
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchBP} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <RefreshCw size={14} />
                    </button>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content — all 9 features */}
            <div className="p-5 space-y-6">
                {/* 1. Sub-parameters */}
                <SubParamGrid params={data?.bp_sub_parameters} />

                {/* 2. Risk Score */}
                <RiskScoreSection risk={data?.risk_score} />

                {/* 7. BP Alerts */}
                <BPAlertBadges alerts={data?.bp_alerts} />

                {/* 5. 24-Hour Prediction */}
                <PredictionSection prediction={data?.prediction_output} />

                {/* 6. Visual Variance Dashboard */}
                <VarianceDashboard data={data?.hourly_variance_data} />

                {/* 3. Prescription */}
                <PrescriptionSection prescription={data?.prescription_plan} />

                {/* 4. Medication History */}
                <MedHistorySection history={data?.medication_history} />
            </div>
        </div>
    )
}
