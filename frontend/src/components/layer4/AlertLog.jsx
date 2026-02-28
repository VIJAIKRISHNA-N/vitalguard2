/**
 * Alert Log Timeline – Layer 4, Feature 16
 * Full chronological log of all alerts (active + suppressed).
 */
import React from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function AlertLog({ log }) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
                    Alert Log Timeline
                </h3>
                <span className="ml-auto text-xs text-slate-500">{log.length} total</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {log.length === 0 ? (
                    <div className="text-center py-4 text-slate-600 text-xs">
                        No alerts recorded yet
                    </div>
                ) : (
                    log.map((entry, i) => (
                        <div key={entry.id}
                            className={`flex items-start gap-3 p-2 rounded-lg text-xs transition-all ${entry.suppressed
                                    ? 'opacity-50 bg-slate-800/30'
                                    : 'bg-slate-800/50'
                                }`}>
                            {/* Timeline dot */}
                            <div className="mt-0.5 flex-shrink-0">
                                {entry.suppressed ? (
                                    <CheckCircle size={12} className="text-slate-500" />
                                ) : (
                                    <div className={`w-3 h-3 rounded-full ${entry.alert_type === 'spike' ? 'bg-red-500' :
                                            entry.alert_type === 'threshold' ? 'bg-orange-500' : 'bg-purple-500'
                                        }`} />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-300">{entry.patient_name}</span>
                                    <span className="text-slate-600">·</span>
                                    <span className="text-slate-500">{entry.bed}</span>
                                    {entry.suppressed && (
                                        <span className="px-1 py-0.5 rounded bg-slate-700 text-slate-500 text-xs">
                                            SUPPRESSED
                                        </span>
                                    )}
                                </div>
                                <div className={`mt-0.5 ${entry.suppressed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                                    {entry.message}
                                </div>
                                {entry.suppressed && entry.suppressed_reason && (
                                    <div className="text-slate-600 mt-0.5 italic">
                                        Reason: {entry.suppressed_reason}
                                    </div>
                                )}
                                <div className="text-slate-600 font-mono mt-0.5">
                                    {new Date(entry.timestamp).toLocaleString()}
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <div className="font-mono text-slate-400">{entry.risk_score.toFixed(0)}%</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
