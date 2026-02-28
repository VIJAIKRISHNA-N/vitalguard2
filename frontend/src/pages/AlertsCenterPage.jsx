/**
 * AlertsCenterPage — VITALGUARD 2.0
 * Full-page Layer 4 alert hub with filter tabs, suppress actions, and log timeline.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff, RefreshCw, Filter } from 'lucide-react'
import { getActiveAlerts, getAlertLog, suppressAlert } from '../api/client'

const FILTER_TABS = ['All', 'Threshold', 'Spike', 'Suppressed']

const ALERT_COLORS = {
    threshold: 'border-yellow-500/30 bg-yellow-500/5',
    spike: 'border-red-500/30 bg-red-500/5',
}

function AlertCard({ alert, onSuppress }) {
    const borderCls = ALERT_COLORS[alert.alert_type] || 'border-[var(--border)]'
    return (
        <div className={`glass-card p-4 border ${borderCls} ${alert.suppressed ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${alert.alert_type === 'spike' ? 'bg-red-500/15 text-red-400' : 'bg-yellow-500/15 text-yellow-400'
                            }`}>{alert.alert_type}</span>
                        <span className="text-[10px] text-slate-500">{alert.patient_name} · {alert.bed}</span>
                    </div>
                    <p className="text-sm text-white font-medium mb-1">{alert.message}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Risk: <span className="text-slate-300">{alert.risk_score?.toFixed(1)}%</span></span>
                        <span>Conf: <span className="text-slate-300">{(alert.confidence * 100).toFixed(0)}%</span></span>
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                    {alert.suppressed && (
                        <p className="text-[11px] text-slate-600 mt-1">Suppressed: {alert.suppressed_reason}</p>
                    )}
                </div>
                {!alert.suppressed && (
                    <button onClick={() => onSuppress(alert.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white glass-card border hover:border-slate-500/50 rounded-lg transition-all flex-shrink-0">
                        <BellOff size={11} /> Suppress
                    </button>
                )}
            </div>
        </div>
    )
}

export default function AlertsCenterPage() {
    const [activeAlerts, setActiveAlerts] = useState([])
    const [alertLog, setAlertLog] = useState([])
    const [filter, setFilter] = useState('All')
    const [loading, setLoading] = useState(true)

    const fetchAlerts = useCallback(async () => {
        try {
            const [aRes, lRes] = await Promise.all([getActiveAlerts(), getAlertLog()])
            setActiveAlerts(aRes.data || [])
            setAlertLog(lRes.data || [])
            setLoading(false)
        } catch (e) { console.error('[Alerts] Fetch error:', e) }
    }, [])

    useEffect(() => {
        fetchAlerts()
        const t = setInterval(fetchAlerts, 4000)
        return () => clearInterval(t)
    }, [fetchAlerts])

    const handleSuppress = async (id) => {
        try {
            await suppressAlert(id, 'Clinician reviewed — suppressed via Alerts Center')
            fetchAlerts()
        } catch (e) { console.error('[Alerts] Suppress error:', e) }
    }

    const filteredLog = alertLog.filter(a => {
        if (filter === 'All') return true
        if (filter === 'Suppressed') return a.suppressed
        return a.alert_type === filter.toLowerCase() && !a.suppressed
    })

    const suppressed = alertLog.filter(a => a.suppressed).length
    const triggered = alertLog.length

    return (
        <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Triggered', value: triggered, color: 'text-white' },
                    { label: 'Active Now', value: activeAlerts.length, color: 'text-red-400' },
                    { label: 'Suppressed', value: suppressed, color: 'text-slate-400' },
                    { label: 'Suppression Rate', value: triggered ? `${Math.round(suppressed / triggered * 100)}%` : '0%', color: 'text-green-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card p-4 border text-center">
                        <div className={`text-2xl font-black mb-0.5 ${color}`}>{value}</div>
                        <div className="text-[11px] text-slate-500">{label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Active Alerts */}
                <div className="col-span-12 lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell size={14} className="text-red-400" />
                            <h3 className="text-sm font-bold text-white">Active Alerts</h3>
                            {activeAlerts.length > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{activeAlerts.length}</span>
                            )}
                        </div>
                        <button onClick={fetchAlerts} className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
                            <RefreshCw size={11} /> Refresh
                        </button>
                    </div>
                    {loading ? (
                        <div className="glass-card p-8 border text-center text-slate-500 text-sm">Loading alerts...</div>
                    ) : activeAlerts.length === 0 ? (
                        <div className="glass-card p-8 border text-center">
                            <Bell size={24} className="text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No active alerts</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                            {activeAlerts.map(a => <AlertCard key={a.id} alert={a} onSuppress={handleSuppress} />)}
                        </div>
                    )}
                </div>

                {/* Alert Log Timeline */}
                <div className="col-span-12 lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Alert Log Timeline</h3>
                        {/* Filter tabs */}
                        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
                            {FILTER_TABS.map(tab => (
                                <button key={tab} onClick={() => setFilter(tab)}
                                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${filter === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                                        }`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                        {filteredLog.length === 0 ? (
                            <div className="glass-card p-8 border text-center text-slate-500 text-sm">No alerts in this category</div>
                        ) : filteredLog.map((a, i) => (
                            <div key={a.id} className={`glass-card p-3 border ${a.suppressed ? 'opacity-50 border-[var(--border)]' : ALERT_COLORS[a.alert_type] || ''}`}>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${a.suppressed ? 'bg-slate-500/20 text-slate-500' : 'bg-red-500/15 text-red-400'}`}>
                                        {a.suppressed ? 'SUPPRESSED' : a.alert_type?.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-slate-300 flex-1">{a.message}</span>
                                    <span className="text-[11px] text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1">{a.patient_name} · {a.bed}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
