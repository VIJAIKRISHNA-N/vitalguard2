/**
 * Multi-Patient Monitoring Dashboard – Layer 1, Feature 4
 * Shows all patients sorted by descending risk (Layer 2, Feature 7).
 * Displays: Patient ID, Risk Score (%), Risk Classification (color), Status indicator.
 * Click row to select and view patient intelligence panel.
 */
import React from 'react'
import { getRiskColor, getRiskBg, getRiskLabel } from '../../utils/riskColors'
import { Shield, TrendingUp, User } from 'lucide-react'

export default function PatientDashboard({ patients, selectedId, onSelect, loading }) {
    if (loading) return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-4">Patient Rankings</div>
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-dark-700 mb-2" />
            ))}
        </div>
    )

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
                    Patient Risk Rankings
                </h3>
                <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                    <Shield size={11} /> Sorted by risk desc.
                </span>
            </div>

            <div className="space-y-2">
                {patients.map((p, idx) => {
                    const isSelected = p.id === selectedId
                    const riskClass = p.risk_level

                    return (
                        <div
                            key={p.id}
                            onClick={() => onSelect(p.id)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected
                                    ? 'bg-blue-600/20 border border-blue-500/40'
                                    : 'hover:bg-dark-600 border border-transparent'
                                }`}
                        >
                            {/* Rank badge */}
                            <div className="w-6 h-6 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center font-bold flex-shrink-0">
                                {idx + 1}
                            </div>

                            {/* Patient info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm truncate">{p.name}</span>
                                    <span className="text-xs text-slate-500 font-mono">{p.id}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-xs text-slate-500">Bed {p.bed}</span>
                                    {/* Risk progress bar mini */}
                                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden max-w-24">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{
                                                width: `${p.risk_score}%`,
                                                background: riskClass === 'red' ? '#ef4444' : riskClass === 'yellow' ? '#f59e0b' : '#22c55e',
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Risk score */}
                            <div className="text-right flex-shrink-0">
                                <div className={`font-mono font-bold text-lg ${getRiskColor(riskClass)}`}>
                                    {p.risk_score.toFixed(1)}%
                                </div>
                                <div className={`text-xs px-1.5 py-0.5 rounded font-semibold inline-block ${getRiskBg(riskClass)}`}
                                    style={{ fontSize: '10px' }}>
                                    {getRiskLabel(riskClass)}
                                </div>
                            </div>

                            {/* Confidence */}
                            <div className="text-right flex-shrink-0 w-16">
                                <div className="text-xs text-slate-500">Conf.</div>
                                <div className="text-xs font-mono text-slate-300">{(p.confidence * 100).toFixed(0)}%</div>
                            </div>

                            {/* Status dot */}
                            <div className="flex-shrink-0">
                                <div className={`w-2.5 h-2.5 rounded-full ${riskClass === 'red' ? 'bg-red-500 animate-pulse' :
                                        riskClass === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                                    }`} />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
