/**
 * Explainable AI Panel – Layer 3, Feature 14
 * Shows which vital features are contributing most to the current risk score.
 * Horizontal bar chart with percentage contribution per feature.
 */
import React from 'react'

const FEATURE_COLORS = {
    'SpO₂ Deviation': '#06b6d4',
    'Heart Rate (Mean)': '#f43f5e',
    'Temperature Deviation': '#f59e0b',
    'Respiration Rate': '#10b981',
    'HR Trend (Slope)': '#8b5cf6',
    'RR Rate of Change': '#3b82f6',
    'HR Variability': '#ec4899',
    'Systolic BP': '#f97316',
    'SpO₂ (Mean)': '#06b6d4',
}

function getColor(label) {
    for (const [key, color] of Object.entries(FEATURE_COLORS)) {
        if (label.includes(key.split(' ')[0])) return color
    }
    return '#64748b'
}

export default function ExplainableAI({ contributions, predictionResult }) {
    if (!contributions?.length) return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3">
                Explainable AI – Feature Contributions
            </div>
            <div className="text-slate-500 text-sm text-center py-4">
                Run prediction to see feature contributions
            </div>
        </div>
    )

    const maxPct = Math.max(...contributions.map(c => c.pct))

    return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-4">
                Explainable AI – Feature Contributions
            </div>

            {/* Risk score summary */}
            {predictionResult && (
                <div className="mb-4 p-3 rounded-lg bg-dark-700 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-500">XGBoost Risk Score</div>
                        <div className="text-2xl font-bold font-mono"
                            style={{
                                color: predictionResult.risk_level === 'red' ? '#ef4444' :
                                    predictionResult.risk_level === 'yellow' ? '#f59e0b' : '#22c55e'
                            }}>
                            {predictionResult.risk_score?.toFixed(1)}%
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="text-xl font-mono text-slate-300">
                            {((predictionResult.confidence ?? 0) * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>
            )}

            {/* Feature contribution bars */}
            <div className="space-y-3">
                {contributions.map((c) => {
                    const color = getColor(c.label)
                    const barWidth = (c.pct / maxPct) * 100
                    return (
                        <div key={c.feature}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-300 font-medium">{c.label}</span>
                                <span className="text-xs font-mono font-bold" style={{ color }}>
                                    {c.pct.toFixed(1)}%
                                </span>
                            </div>
                            <div className="risk-bar">
                                <div
                                    className="risk-bar-fill"
                                    style={{
                                        width: `${barWidth}%`,
                                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                                        boxShadow: `0 0 4px ${color}60`,
                                    }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
