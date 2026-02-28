/**
 * VitalExpansionPanel — VITALGUARD 2.0
 * Generic, reusable expansion panel for any vital module.
 * Receives data from the parent and renders:
 *  - Sub-parameters grid
 *  - Risk assessment
 *  - Alerts
 *  - Prediction (with medication/support correlation + before/after)
 *  - Variance charts
 *  - Prescription/Support plan
 *  - Medication/therapy history
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
    Activity, TrendingUp, TrendingDown, AlertTriangle,
    Pill, RefreshCw, X, FileText, Clock,
} from 'lucide-react'

const POLL_MS = 5000
const RISK_COLORS = {
    green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', fill: '#22c55e' },
    yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', fill: '#eab308' },
    orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', fill: '#f97316' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', fill: '#ef4444' },
}

// ── Sub-Parameter Grid (generic) ───────────────────────────────────────────
function SubParamGrid({ params, config }) {
    if (!params || !config) return null
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                {config.icon} {config.title} Sub-Parameters
            </h4>
            <div className="grid grid-cols-4 gap-2">
                {config.items(params).map(({ label, value, unit, icon, color, derived, flag }) => {
                    const c = RISK_COLORS[color] || RISK_COLORS.green
                    return (
                        <div key={label} className={`p-3 rounded-xl border ${c.bg} ${c.border} relative`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                                <span className="text-sm">{icon}</span>
                            </div>
                            <div className={`text-lg font-black ${c.text}`}>
                                {typeof value === 'boolean' ? (value ? '⚠ YES' : '✓ No') : value}
                                {unit && <span className="text-[10px] font-normal ml-1 opacity-60">{unit}</span>}
                            </div>
                            {derived && <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">auto</span>}
                            {flag && <span className="absolute top-1.5 right-1.5 text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">flag</span>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ── Risk Section ───────────────────────────────────────────────────────────
function RiskSection({ risk, extraMetrics }) {
    if (!risk) return null
    const c = RISK_COLORS[risk.color] || RISK_COLORS.green
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Activity size={13} /> Risk Assessment
            </h4>
            <div className={`p-5 rounded-xl border ${c.bg} ${c.border}`}>
                <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                        <div className={`text-4xl font-black ${c.text}`}>{risk.percentage}%</div>
                        <div className="text-[10px] text-slate-500 mt-1">Risk Score</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${c.bg} ${c.border} ${c.text}`}>{risk.category}</div>
                    <div className="text-xs text-slate-500">Raw: {risk.raw_score} / {risk.max_possible}</div>
                </div>
                <div className="h-3 rounded-full bg-white/5 mb-4 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${risk.percentage}%`, background: c.fill }} />
                </div>
                {/* Extra metrics (cardiac stress, arrhythmia prob, etc.) */}
                {extraMetrics && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {extraMetrics(risk).map(({ label, value, color: mc }) => (
                            <div key={label} className="p-2 rounded-lg bg-white/2 border border-[var(--border)] text-center">
                                <div className="text-[9px] text-slate-600 uppercase">{label}</div>
                                <div className={`text-sm font-bold ${mc || 'text-slate-300'}`}>{value}%</div>
                            </div>
                        ))}
                    </div>
                )}
                {risk.breakdown?.length > 0 && (
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

// ── Alert Badges ───────────────────────────────────────────────────────────
function AlertBadges({ alerts }) {
    if (!alerts || alerts.length === 0) return null
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle size={13} /> Alerts
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

// ── Prediction Section (with medication correlation) ───────────────────────
function PredictionSection({ prediction, medLabel, beforeLabel, afterLabel, projectedLabel, projectedValue, projectedUnit }) {
    if (!prediction) return null
    const bars = [
        { label: 'Worsening', pct: prediction.prob_worsening, color: '#ef4444' },
        { label: 'Stabilization', pct: prediction.prob_stabilization, color: '#eab308' },
        { label: 'Improvement', pct: prediction.prob_improvement, color: '#22c55e' },
    ]
    const trendIcon = prediction.trend === 'Worsening' ? <TrendingUp size={14} /> : prediction.trend === 'Improving' ? <TrendingDown size={14} /> : <Activity size={14} />
    const tc = prediction.trend_color === 'red' ? 'text-red-400' : prediction.trend_color === 'yellow' ? 'text-yellow-400' : 'text-green-400'
    const meds = prediction.medication_inputs || prediction.support_inputs || prediction.therapy_inputs || []
    const riskBefore = prediction.risk_before_medication ?? prediction.risk_before_support ?? prediction.risk_before_therapy
    const riskAfter = prediction.risk_after_medication ?? prediction.risk_after_support ?? prediction.risk_after_therapy
    const riskReduction = prediction.risk_reduction

    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp size={13} /> {prediction.horizon} Prediction (Sub-Parameters + {medLabel})
            </h4>
            <div className="glass-card p-5 border space-y-5">
                {/* Medication/Support Inputs */}
                {meds.length > 0 ? (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2 flex items-center gap-1.5">
                            <Pill size={11} /> {medLabel} Inputs Used
                        </div>
                        <div className="space-y-2">
                            {meds.map((med, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                                        <Pill size={14} className="text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white">{med.medication || med.support || med.therapy}</span>
                                            {(med.drug_class || med.type) && <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{med.drug_class || med.type}</span>}
                                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{med.status}</span>
                                        </div>
                                        <div className="flex gap-4 mt-1 text-[10px] text-slate-500">
                                            <span>Dosage: <span className="text-slate-300">{med.dosage || med.flow_rate}</span></span>
                                            {med.timing && <span>Timing: <span className="text-slate-300">{med.timing}</span></span>}
                                        </div>
                                    </div>
                                    <div className="text-right text-[10px] text-green-400 font-bold">
                                        {med.expected_hr_change || med.expected_improvement || (med.expected_rr_reduction ? `↓${med.expected_rr_reduction} br/min` : '') || med.expected_effect || ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/15">
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <Pill size={11} /> No {medLabel.toLowerCase()} active — prediction based on raw parameters only
                        </div>
                    </div>
                )}

                {/* Before vs After */}
                {riskBefore !== undefined && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">{beforeLabel} → {afterLabel}</div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">{beforeLabel}</div>
                                <div className="text-2xl font-black text-red-400">{riskBefore}%</div>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center flex flex-col items-center justify-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">Reduction</div>
                                <div className="text-2xl font-black text-emerald-400">{riskReduction > 0 ? '↓' : '='} {Math.abs(riskReduction)}%</div>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15 text-center">
                                <div className="text-[9px] text-slate-600 font-bold uppercase mb-1">{afterLabel}</div>
                                <div className="text-2xl font-black text-green-400">{riskAfter}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Projected Value */}
                {projectedValue !== undefined && (
                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-center">
                        <div className="text-[9px] text-slate-500">{projectedLabel}</div>
                        <div className="text-xl font-black text-violet-400">{projectedValue} <span className="text-[10px] font-normal">{projectedUnit}</span></div>
                    </div>
                )}

                {/* Input Parameters */}
                {prediction.input_parameters && (
                    <div>
                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-2">Input Parameters</div>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(prediction.input_parameters).map(([key, val]) => (
                                <div key={key} className="p-2 rounded-lg bg-white/2 border border-[var(--border)] text-center">
                                    <div className="text-[8px] text-slate-600 uppercase">{key.replace(/_/g, ' ')}</div>
                                    <div className="text-xs font-bold text-slate-300">{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : String(val)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Final Outcome */}
                <div className="border-t border-[var(--border)] pt-4">
                    <div className="text-[10px] text-slate-600 font-bold uppercase mb-3">Final Correlated Prediction</div>
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
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Mini Chart ─────────────────────────────────────────────────────────────
function VarianceChart({ data, title, dataKey, color, zone }) {
    if (!data || data.length < 2) return <div className="text-[10px] text-slate-600 text-center py-4">Collecting data...</div>
    const values = data.map(d => d[dataKey])
    const minV = Math.min(...values) - 5
    const maxV = Math.max(...values) + 5
    const range = maxV - minV || 1
    const W = 100, H = 50
    const points = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - minV) / range) * H}`).join(' ')
    return (
        <div className="glass-card p-4 border">
            <div className="text-[10px] text-slate-500 font-bold mb-2">{title}</div>
            <svg viewBox={`0 0 ${W} ${H + 4}`} className="w-full h-16" preserveAspectRatio="none">
                {zone && <rect x="0" y={H - ((zone.hi - minV) / range) * H} width={W} height={((zone.hi - zone.lo) / range) * H} fill={zone.color} opacity="0.08" />}
                <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
                {values.slice(-3).map((v, i) => {
                    const idx = values.length - 3 + i
                    return <circle key={i} cx={(idx / (values.length - 1)) * W} cy={H - ((v - minV) / range) * H} r="2" fill={color} />
                })}
            </svg>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>{data.length > 0 ? new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                <span>{data.length > 0 ? new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
            </div>
        </div>
    )
}

// ── Prescription / Support Plan ────────────────────────────────────────────
function PlanSection({ plan, planLabel, itemKey }) {
    if (!plan || plan.stage === 'NORMAL') return null
    const stageColors = {
        'STAGE 1': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'STAGE 2': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'SEVERE': 'text-red-400 bg-red-500/10 border-red-500/20',
        'TACHYCARDIA': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'SEVERE TACHYCARDIA': 'text-red-400 bg-red-500/10 border-red-500/20',
        'BRADYCARDIA': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'SEVERE BRADYCARDIA': 'text-red-400 bg-red-500/10 border-red-500/20',
        'MILD HYPOXIA': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'MODERATE HYPOXIA': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'SEVERE HYPOXIA': 'text-red-400 bg-red-500/10 border-red-500/20',
        'ELEVATED': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'TACHYPNEA': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        'SEVERE TACHYPNEA': 'text-red-400 bg-red-500/10 border-red-500/20',
        'MILD FEVER': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        'HIGH FEVER': 'text-red-400 bg-red-500/10 border-red-500/20',
        'HYPOTHERMIA': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    }
    const cls = stageColors[plan.stage] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText size={13} /> {planLabel}
            </h4>
            <div className="glass-card p-5 border">
                <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${cls}`}>{plan.stage}</span>
                    <span className="text-[10px] text-slate-600">Generated: {new Date(plan.generated_at).toLocaleString()}</span>
                </div>
                {plan.primary_plan?.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <div className="text-[10px] text-slate-600 font-bold uppercase">Primary Plan</div>
                        {plan.primary_plan.map((med, i) => {
                            const name = med[itemKey] || med.medication || med.support || med.therapy
                            return (
                                <div key={i} className="p-3 rounded-lg bg-white/3 border border-[var(--border)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Pill size={13} className="text-blue-400" />
                                        <span className="text-sm font-bold text-white">{name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{med.dosage || med.flow_rate}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                                        <div className="text-slate-500">Frequency: <span className="text-slate-300">{med.frequency}</span></div>
                                        {med.timing && <div className="text-slate-500">Timing: <span className="text-slate-300">{med.timing}</span></div>}
                                        {med.monitoring && <div className="text-slate-500">Monitoring: <span className="text-slate-300">{med.monitoring}</span></div>}
                                        <div className="text-slate-500">Duration: <span className="text-slate-300">{med.duration_days} days</span></div>
                                        <div className="text-slate-500">Start: <span className="text-slate-300 font-mono">{med.start_date}</span></div>
                                        <div className="text-slate-500">End: <span className="text-slate-300 font-mono">{med.end_date}</span></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                {plan.alternative_plan?.length > 0 && (
                    <div className="space-y-2 mb-4">
                        <div className="text-[10px] text-slate-600 font-bold uppercase">Alternative Plan</div>
                        {plan.alternative_plan.map((med, i) => {
                            const name = med[itemKey] || med.medication || med.support || med.therapy
                            return (
                                <div key={i} className="p-3 rounded-lg bg-white/3 border border-[var(--border)]">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Pill size={13} className="text-blue-400" />
                                        <span className="text-sm font-bold text-white">{name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{med.dosage || med.flow_rate}</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
                <div className="border-t border-[var(--border)] pt-3">
                    <p className="text-xs text-slate-400 italic">📋 {plan.clinical_notes}</p>
                </div>
            </div>
        </div>
    )
}

// ── History ────────────────────────────────────────────────────────────────
function HistorySection({ history, historyLabel, itemKey }) {
    if (!history || history.length === 0) return null
    const recent = history.slice(-3).reverse()
    return (
        <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock size={13} /> {historyLabel} History
            </h4>
            <div className="space-y-2">
                {recent.map((entry, i) => (
                    <div key={i} className="glass-card p-4 border">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-slate-600 font-mono">{new Date(entry.prescribed_at).toLocaleString()}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{entry.stage}</span>
                        </div>
                        <div className="space-y-1">
                            {(entry.medications || entry.supports || entry.therapies || []).map((m, j) => (
                                <div key={j} className="flex items-center gap-2 text-xs">
                                    <Pill size={11} className="text-blue-400" />
                                    <span className="text-white font-medium">{m[itemKey] || m.medication || m.support || m.therapy} {m.dosage || m.flow_rate || ''}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function VitalExpansionPanel({
    patientId, onClose, fetchFn, title, titleIcon, accentColor,
    subParamConfig, extraRiskMetrics,
    medLabel = 'Medication', beforeLabel = 'Before', afterLabel = 'After',
    projectedLabel, projectedKey, projectedUnit,
    planKey = 'prescription_plan', planLabel = 'Prescription Plan', planItemKey = 'medication',
    historyKey = 'medication_history', historyLabel = 'Medication', historyItemKey = 'medication',
    chartConfigs = [],
}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetchFn(patientId)
            setData(res.data)
            setError(null)
        } catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }, [patientId, fetchFn])

    useEffect(() => {
        fetchData()
        const t = setInterval(fetchData, POLL_MS)
        return () => clearInterval(t)
    }, [fetchData])

    if (loading) return (
        <div className="glass-card p-8 border text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <div className="text-xs text-slate-500">Loading {title} for {patientId}...</div>
        </div>
    )
    if (error) return (
        <div className="glass-card p-6 border text-center">
            <AlertTriangle size={20} className="text-red-400 mx-auto mb-2" />
            <div className="text-xs text-red-400">{title} Error: {error}</div>
        </div>
    )

    return (
        <div className="glass-card border overflow-hidden animate-in">
            <div className={`flex items-center justify-between p-4 border-b border-[var(--border)]`} style={{ background: accentColor + '08' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: accentColor + '15', border: `1px solid ${accentColor}30` }}>
                        {titleIcon}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">{title}</h3>
                        <p className="text-[10px] text-slate-500">{data?.patient_name} · {data?.bed} · Auto-refresh every {POLL_MS / 1000}s</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"><RefreshCw size={14} /></button>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"><X size={14} /></button>
                </div>
            </div>
            <div className="p-5 space-y-6">
                <SubParamGrid params={data?.sub_parameters} config={subParamConfig} />
                <RiskSection risk={data?.risk_score} extraMetrics={extraRiskMetrics} />
                <AlertBadges alerts={data?.alerts} />
                <PredictionSection
                    prediction={data?.prediction_output}
                    medLabel={medLabel} beforeLabel={beforeLabel} afterLabel={afterLabel}
                    projectedLabel={projectedLabel}
                    projectedValue={data?.prediction_output?.[projectedKey]}
                    projectedUnit={projectedUnit}
                />
                {chartConfigs.length > 0 && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <TrendingUp size={13} /> Variance Dashboard
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {chartConfigs.map((cfg, i) => (
                                <VarianceChart key={i} data={data?.hourly_variance_data} {...cfg} />
                            ))}
                        </div>
                    </div>
                )}
                <PlanSection plan={data?.[planKey]} planLabel={planLabel} itemKey={planItemKey} />
                <HistorySection history={data?.[historyKey]} historyLabel={historyLabel} historyItemKey={historyItemKey} />
            </div>
        </div>
    )
}
