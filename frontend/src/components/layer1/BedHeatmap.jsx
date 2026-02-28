/**
 * Bed Heatmap View – Layer 1, Feature 3
 * Shows all patient beds color-coded by risk level. Clickable to select a patient.
 * Green (0-40%), Yellow (40-70%), Red (70-100%)
 */
import React from 'react'
import { getBedColor } from '../../utils/riskColors'
import { Bed } from 'lucide-react'

export default function BedHeatmap({ patients, selectedId, onSelect }) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <Bed size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Bed Heatmap</h3>
                <div className="ml-auto flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Stable
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Moderate
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {patients.map((p) => {
                    const colors = getBedColor(p.risk_score)
                    const isSelected = p.id === selectedId
                    return (
                        <div
                            key={p.id}
                            className={`bed-cell ${isSelected ? 'selected' : ''}`}
                            style={{
                                background: colors.bg,
                                borderColor: isSelected ? '#3b82f6' : colors.border,
                                padding: '12px 8px',
                                boxShadow: isSelected
                                    ? '0 0 0 2px rgba(59,130,246,0.5)'
                                    : `0 0 8px ${colors.bg}`,
                            }}
                            onClick={() => onSelect(p.id)}
                            title={`${p.name} – ${p.risk_score.toFixed(1)}% risk`}
                        >
                            {/* Bed icon indicator */}
                            <div className="text-base mb-1" style={{ textShadow: `0 0 6px ${colors.text}` }}>
                                🛏️
                            </div>
                            <div className="font-bold text-white text-xs">{p.bed}</div>
                            <div className="font-mono text-xs mt-0.5" style={{ color: colors.text }}>
                                {p.risk_score.toFixed(0)}%
                            </div>
                        </div>
                    )
                })}

                {/* Empty beds up to 12 total */}
                {[...Array(Math.max(0, 12 - patients.length))].map((_, i) => (
                    <div
                        key={`empty-${i}`}
                        className="bed-cell opacity-20"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderColor: 'rgba(255,255,255,0.08)',
                            padding: '12px 8px',
                        }}
                    >
                        <div className="text-base mb-1 opacity-30">🛏️</div>
                        <div className="text-xs text-slate-600">Empty</div>
                    </div>
                ))}
            </div>
        </div>
    )
}
