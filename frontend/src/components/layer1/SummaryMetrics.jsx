/**
 * ICU Summary Metrics Panel – Layer 1, Feature 1
 * Displays: Total Patients, Critical, Moderate, Stable, Alerts Triggered, Alerts Suppressed
 */
import React from 'react'
import { Activity, AlertTriangle, CheckCircle, Clock, BellOff, Bell } from 'lucide-react'

const MetricCard = ({ icon: Icon, label, value, color, sublabel }) => (
    <div className="glass-card glass-card-hover p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={22} />
        </div>
        <div>
            <div className="text-2xl font-bold text-white font-mono">{value ?? '—'}</div>
            <div className="text-xs text-slate-400 mt-0.5">{label}</div>
            {sublabel && <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>}
        </div>
    </div>
)

export default function SummaryMetrics({ summary, loading }) {
    if (loading) return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-card p-5 h-24 animate-pulse bg-dark-700" />
            ))}
        </div>
    )

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 animate-fade-in">
            <MetricCard
                icon={Activity} label="Total Patients" value={summary?.total_patients}
                color="bg-blue-500/20 text-blue-400" />
            <MetricCard
                icon={AlertTriangle} label="Critical" value={summary?.critical_count}
                color="bg-red-500/20 text-red-400" sublabel="70–100% risk" />
            <MetricCard
                icon={Clock} label="Moderate" value={summary?.moderate_count}
                color="bg-yellow-500/20 text-yellow-400" sublabel="40–70% risk" />
            <MetricCard
                icon={CheckCircle} label="Stable" value={summary?.stable_count}
                color="bg-green-500/20 text-green-400" sublabel="0–40% risk" />
            <MetricCard
                icon={Bell} label="Alerts Triggered" value={summary?.alerts_triggered}
                color="bg-orange-500/20 text-orange-400" />
            <MetricCard
                icon={BellOff} label="Alerts Suppressed" value={summary?.alerts_suppressed}
                color="bg-slate-500/20 text-slate-400" />
        </div>
    )
}
