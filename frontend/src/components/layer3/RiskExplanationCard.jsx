/**
 * RiskExplanationCard — VITALGUARD 2.0
 * Plain-English explanation of WHY a patient's risk is high.
 * Uses the XGBoost feature contributions + current vitals to generate
 * natural language sentences a clinician can actually read.
 */
import React from 'react'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

// Clinical safe ranges for each vital
const SAFE_RANGES = {
    hr: { min: 60, max: 100, unit: 'bpm', label: 'Heart Rate' },
    spo2: { min: 95, max: 100, unit: '%', label: 'Blood Oxygen (SpO₂)' },
    sbp: { min: 90, max: 140, unit: 'mmHg', label: 'Systolic Blood Pressure' },
    dbp: { min: 60, max: 90, unit: 'mmHg', label: 'Diastolic BP' },
    rr: { min: 12, max: 20, unit: '/min', label: 'Respiration Rate' },
    temp: { min: 36.1, max: 37.9, unit: '°C', label: 'Temperature' },
}

// Map feature names to human-readable messages
function generateVitalFindings(vitals) {
    if (!vitals) return []
    const findings = []

    const v = vitals
    if (v.hr > 130) findings.push({ sev: 'critical', text: `Heart Rate critically elevated at ${v.hr} bpm — Tachycardia (normal: 60–100 bpm)` })
    else if (v.hr > 100) findings.push({ sev: 'warning', text: `Heart Rate elevated at ${v.hr} bpm — above normal range` })
    else if (v.hr < 50) findings.push({ sev: 'critical', text: `Heart Rate dangerously low at ${v.hr} bpm — Bradycardia` })

    if (v.spo2 < 88) findings.push({ sev: 'critical', text: `Blood Oxygen (SpO₂) critically low at ${v.spo2}% — Severe Hypoxemia (safe: ≥95%)` })
    else if (v.spo2 < 92) findings.push({ sev: 'warning', text: `SpO₂ below safe threshold at ${v.spo2}% — Hypoxemia risk` })
    else if (v.spo2 < 95) findings.push({ sev: 'caution', text: `SpO₂ slightly low at ${v.spo2}% — monitor closely` })

    if (v.sbp < 85) findings.push({ sev: 'critical', text: `Blood Pressure critically low at ${v.sbp}/${v.dbp} mmHg — Hypotension (shock risk)` })
    else if (v.sbp > 180) findings.push({ sev: 'critical', text: `Blood Pressure critically high at ${v.sbp}/${v.dbp} mmHg — Hypertensive crisis` })
    else if (v.sbp > 160) findings.push({ sev: 'warning', text: `Elevated BP at ${v.sbp}/${v.dbp} mmHg — hypertensive range` })
    else if (v.sbp < 100) findings.push({ sev: 'warning', text: `BP low at ${v.sbp}/${v.dbp} mmHg — borderline hypotension` })

    if (v.rr > 28) findings.push({ sev: 'critical', text: `Respiration Rate critically high at ${v.rr}/min — Tachypnea (respiratory distress)` })
    else if (v.rr > 20) findings.push({ sev: 'warning', text: `Respiration Rate elevated at ${v.rr}/min — patient working harder to breathe` })
    else if (v.rr < 10) findings.push({ sev: 'critical', text: `Respiration Rate dangerously low at ${v.rr}/min — Bradypnea` })

    if (v.temp > 39.5) findings.push({ sev: 'critical', text: `High Fever at ${v.temp}°C — systemic infection or inflammatory response` })
    else if (v.temp > 38.5) findings.push({ sev: 'warning', text: `Elevated Temperature at ${v.temp}°C — Fever detected` })
    else if (v.temp < 35.5) findings.push({ sev: 'critical', text: `Hypothermia risk — Temperature at ${v.temp}°C` })

    return findings
}

// Generate top-3 contributing feature explanations
function explainContributions(contributions) {
    if (!contributions || contributions.length === 0) return []
    const FEATURE_EXPLAIN = {
        spo2_deviation: 'SpO₂ deviated far below patient\'s personal baseline — oxygen delivery compromised',
        temp_deviation: 'Temperature deviation from baseline — possible infection or metabolic disturbance',
        hr_mean: 'Mean heart rate over recent readings is elevated — cardiovascular strain detected',
        hr_trend: 'Heart rate is trending upward — patient deteriorating over time',
        hr_variability: 'Irregular heart rate variability — possible arrhythmia or autonomic dysfunction',
        spo2_mean: 'Average oxygen saturation over recent window is below safe levels',
        rr_mean: 'Average respiration rate elevated — patient breathing faster to compensate',
        rr_rate_of_change: 'Respiration rate increasing rapidly — acute respiratory decompensation',
        sbp_mean: 'Mean systolic BP outside safe range — cardiovascular compromise',
    }
    return contributions
        .filter(c => c.contribution > 5)
        .slice(0, 4)
        .map(c => ({
            feature: c.feature,
            value: c.contribution,
            text: FEATURE_EXPLAIN[c.feature] || `${c.feature} outside normal range`,
        }))
}

const SEV_STYLES = {
    critical: 'border-red-500/30 bg-red-500/8 text-red-300',
    warning: 'border-yellow-500/30 bg-yellow-500/8 text-yellow-300',
    caution: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
}
const SEV_ICONS = {
    critical: '🔴',
    warning: '🟡',
    caution: '🟠',
}

export default function RiskExplanationCard({ vitals, contributions, predictionResult, patientName }) {
    const riskScore = predictionResult?.risk_score ?? 0
    const riskLevel = predictionResult?.risk_level ?? 'green'
    const vitalFindings = generateVitalFindings(vitals)
    const aiContributions = explainContributions(contributions)

    const hasProblems = vitalFindings.length > 0

    const HEADER_COLOR = {
        red: 'border-red-500/30 from-red-900/20',
        yellow: 'border-yellow-500/30 from-yellow-900/10',
        green: 'border-green-500/20 from-green-900/5',
    }[riskLevel] || 'border-[var(--border)] from-transparent'

    return (
        <div className={`glass-card border bg-gradient-to-br ${HEADER_COLOR} to-transparent overflow-hidden`}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                    {riskLevel === 'red' ? (
                        <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
                    ) : riskLevel === 'yellow' ? (
                        <AlertTriangle size={15} className="text-yellow-400 flex-shrink-0" />
                    ) : (
                        <CheckCircle size={15} className="text-green-400 flex-shrink-0" />
                    )}
                    <h3 className="text-sm font-bold text-white">
                        Clinical Risk Explanation
                    </h3>
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${riskLevel === 'red' ? 'bg-red-500/15 text-red-400' :
                            riskLevel === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                                'bg-green-500/15 text-green-400'
                        }`}>{riskScore.toFixed(1)}% risk</span>
                </div>
                <p className="text-[11px] text-slate-500">
                    {hasProblems
                        ? `Why ${patientName || 'this patient'}'s risk ${riskLevel === 'red' ? 'is CRITICAL' : 'is elevated'}:`
                        : `${patientName || 'This patient'}'s vitals are within acceptable ranges.`}
                </p>
            </div>

            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                {/* No problems */}
                {!hasProblems && riskLevel === 'green' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                        <p className="text-xs text-green-300">All vital signs are within normal clinical ranges. Patient appears stable.</p>
                    </div>
                )}

                {/* Vital findings */}
                {vitalFindings.map((f, i) => (
                    <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${SEV_STYLES[f.sev]}`}>
                        <span className="text-sm flex-shrink-0 mt-0.5">{SEV_ICONS[f.sev]}</span>
                        <p className="leading-relaxed">{f.text}</p>
                    </div>
                ))}

                {/* AI Feature Contributions */}
                {aiContributions.length > 0 && (
                    <div>
                        <div className="flex items-center gap-1.5 mb-2 mt-3">
                            <Info size={11} className="text-blue-400" />
                            <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase">XGBoost Top Risk Drivers</span>
                        </div>
                        {aiContributions.map((c, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/5 last:border-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/70 mt-1.5 flex-shrink-0" />
                                <p className="text-[11px] text-slate-400 leading-relaxed">{c.text}</p>
                                <span className="ml-auto text-[10px] text-blue-400 font-mono flex-shrink-0">{c.value.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Bottom summary */}
                {riskLevel === 'red' && (
                    <div className="p-3 rounded-lg bg-red-900/15 border border-red-500/20 mt-2">
                        <p className="text-[11px] text-red-300 font-medium">
                            ⚠️ Immediate clinical review recommended. This patient's AI risk score is critically elevated — multiple vital signs indicate active deterioration.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
