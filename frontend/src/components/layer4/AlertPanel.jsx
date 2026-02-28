/**
 * Alert Panel – Layer 4, Feature 15
 * Shows active (non-suppressed) alerts with type badges and suppress button.
 */
import React, { useState } from 'react'
import { suppressAlert } from '../../api/client'
import { Bell, BellOff, AlertTriangle, Zap, Filter } from 'lucide-react'

const TYPE_ICON = {
    threshold: <AlertTriangle size={14} className="text-orange-400" />,
    spike: <Zap size={14} className="text-red-400" />,
    confidence: <Filter size={14} className="text-purple-400" />,
}

const TYPE_LABEL = {
    threshold: 'Threshold',
    spike: 'Risk Spike',
    confidence: 'Confidence',
}

const TYPE_COLOR = {
    threshold: 'text-orange-400 bg-orange-400/10',
    spike: 'text-red-400 bg-red-400/10',
    confidence: 'text-purple-400 bg-purple-400/10',
}

export default function AlertPanel({ alerts, onRefresh }) {
    const [suppressing, setSuppressing] = useState(null)

    const handleSuppress = async (alertId) => {
        setSuppressing(alertId)
        try {
            await suppressAlert(alertId, 'Clinician reviewed')
            onRefresh()
        } catch (e) {
            console.error('Suppress failed', e)
        } finally {
            setSuppressing(null)
        }
    }

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <Bell size={16} className="text-orange-400" />
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
                    Active Alerts
                </h3>
                {alerts.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 alert-badge">
                        {alerts.length}
                    </span>
                )}
                <button
                    onClick={onRefresh}
                    className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                        <BellOff size={24} className="mx-auto mb-2 opacity-40" />
                        No active alerts
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="p-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                            style={{ background: 'rgba(255,255,255,0.02)' }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                {/* Alert info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {TYPE_ICON[alert.alert_type]}
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${TYPE_COLOR[alert.alert_type]}`}>
                                            {TYPE_LABEL[alert.alert_type]}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">{alert.bed}</span>
                                        <span className="text-xs font-semibold text-white">{alert.patient_name}</span>
                                    </div>
                                    <div className="text-sm text-slate-200 mt-1 font-medium">{alert.message}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                        <span>Risk: <span className="font-mono text-slate-300">{alert.risk_score.toFixed(1)}%</span></span>
                                        <span>Conf: <span className="font-mono text-slate-300">{(alert.confidence * 100).toFixed(0)}%</span></span>
                                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>

                                {/* Suppress button */}
                                <button
                                    onClick={() => handleSuppress(alert.id)}
                                    disabled={suppressing === alert.id}
                                    className="flex-shrink-0 px-2 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-50"
                                >
                                    {suppressing === alert.id ? '...' : 'Suppress'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
