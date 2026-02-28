/**
 * ICU Risk Index Panel – Layer 1, Feature 2
 * Shows average ICU risk and system stress percentage with a circular gauge.
 */
import React from 'react'

export default function RiskIndex({ summary }) {
    const stress = summary?.system_stress_pct ?? 0
    const angle = (stress / 100) * 220 - 110  // Sweep -110° to +110°

    const color = stress >= 70 ? '#ef4444' : stress >= 40 ? '#f59e0b' : '#22c55e'
    const label = stress >= 70 ? 'HIGH STRESS' : stress >= 40 ? 'MODERATE' : 'STABLE'

    // SVG arc calculation
    const r = 56, cx = 70, cy = 72
    const toRad = (deg) => (deg - 90) * Math.PI / 180
    const startAngle = -130
    const sweepAngle = 260
    const endAngle = startAngle + (sweepAngle * stress / 100)

    const x1 = cx + r * Math.cos(toRad(startAngle))
    const y1 = cy + r * Math.sin(toRad(startAngle))
    const x2 = cx + r * Math.cos(toRad(endAngle))
    const y2 = cy + r * Math.sin(toRad(endAngle))
    const large = sweepAngle * stress / 100 > 180 ? 1 : 0

    return (
        <div className="glass-card p-5 flex flex-col items-center justify-center h-full">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3">
                ICU Risk Index
            </div>

            {/* SVG Gauge */}
            <svg width="140" height="110" viewBox="0 0 140 110">
                {/* Background track */}
                <path
                    d={`M ${cx + r * Math.cos(toRad(startAngle))} ${cy + r * Math.sin(toRad(startAngle))}
              A ${r} ${r} 0 1 1 ${cx + r * Math.cos(toRad(startAngle + sweepAngle))} ${cy + r * Math.sin(toRad(startAngle + sweepAngle))}`}
                    fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"
                />
                {/* Active arc */}
                {stress > 0 && (
                    <path
                        d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                        fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'all 0.8s ease' }}
                    />
                )}
                {/* Center text */}
                <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="700"
                    fontFamily="JetBrains Mono">
                    {stress.toFixed(0)}%
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill={color} fontSize="9" fontWeight="600"
                    letterSpacing="2">
                    {label}
                </text>
            </svg>

            <div className="text-xs text-slate-500 mt-1">
                Avg risk: <span className="font-mono" style={{ color }}>{summary?.avg_risk_score?.toFixed(1)}%</span>
            </div>
        </div>
    )
}
