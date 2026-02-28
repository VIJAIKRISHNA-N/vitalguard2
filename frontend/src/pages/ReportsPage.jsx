/**
 * ReportsPage — VITALGUARD 2.0
 * ICU analytics: 7-day stress trend, alert distribution, patient risk breakdown, KPI cards.
 */
import React, { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js'
import api from '../api/client'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const CHART_DEFAULTS = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a2a47', titleColor: '#94a3b8', bodyColor: '#e2e8f0', borderColor: '#1e3058', borderWidth: 1 } },
    scales: {
        x: { grid: { color: 'rgba(30,48,88,0.4)' }, ticks: { color: '#64748b', font: { size: 11 } } },
        y: { grid: { color: 'rgba(30,48,88,0.4)' }, ticks: { color: '#64748b', font: { size: 11 } } },
    },
}

export default function ReportsPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/reports/summary')
            .then(r => { setData(r.data); setLoading(false) })
            .catch(e => { console.error(e); setLoading(false) })
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
    if (!data) return <div className="text-slate-500 text-center py-16">Failed to load reports.</div>

    const { stress_trend, risk_distribution, alert_distribution, kpis } = data

    const lineData = {
        labels: stress_trend.map(d => d.date),
        datasets: [{
            label: 'ICU Stress %',
            data: stress_trend.map(d => d.avg_risk),
            borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
            tension: 0.4, fill: true, pointBackgroundColor: '#3b82f6', pointRadius: 4,
        }]
    }

    const alertBarData = {
        labels: ['Threshold', 'Spike', 'Suppressed'],
        datasets: [{
            data: [alert_distribution.threshold, alert_distribution.spike, alert_distribution.suppressed],
            backgroundColor: ['rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'rgba(100,116,139,0.7)'],
            borderRadius: 6,
        }]
    }

    const riskDoughnut = {
        labels: ['Stable (Green)', 'Moderate (Yellow)', 'Critical (Red)'],
        datasets: [{
            data: [risk_distribution.green, risk_distribution.yellow, risk_distribution.red],
            backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'],
            borderWidth: 0,
        }]
    }

    const KPI_CARDS = [
        { label: 'Avg ICU Stress', value: `${kpis.avg_icu_stress}%`, color: 'text-blue-400', icon: '📊' },
        { label: 'Total Alerts', value: kpis.total_alerts, color: 'text-orange-400', icon: '🔔' },
        { label: 'Suppression Rate', value: `${kpis.suppression_rate_pct}%`, color: 'text-green-400', icon: '✅' },
        { label: 'Critical Patients', value: kpis.patients_critical, color: 'text-red-400', icon: '🔴' },
        { label: 'Stable Patients', value: kpis.patients_stable, color: 'text-green-400', icon: '🟢' },
    ]

    return (
        <div className="space-y-6">
            {/* Label */}
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-purple-400/50 rounded" />
                <h2 className="text-xs font-bold text-purple-400 tracking-widest uppercase">Reports & Analytics — ICU Performance Metrics</h2>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {KPI_CARDS.map(({ label, value, color, icon }) => (
                    <div key={label} className="glass-card p-4 border text-center">
                        <div className="text-2xl mb-1">{icon}</div>
                        <div className={`text-2xl font-black mb-0.5 ${color}`}>{value}</div>
                        <div className="text-[11px] text-slate-500">{label}</div>
                    </div>
                ))}
            </div>

            {/* 7-Day Trend */}
            <div className="glass-card p-6 border">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-sm font-bold text-white">ICU Stress Index — 7 Day Trend</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Average patient risk score across all beds per day</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">Rolling 7 Days</span>
                </div>
                <div style={{ height: 220 }}>
                    <Line data={lineData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }} />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4">
                {/* Alert Type Breakdown */}
                <div className="col-span-12 lg:col-span-7 glass-card p-6 border">
                    <h3 className="text-sm font-bold text-white mb-1">Alert Distribution by Type</h3>
                    <p className="text-[11px] text-slate-500 mb-5">Threshold crossing vs sudden risk spike vs suppressed</p>
                    <div style={{ height: 200 }}>
                        <Bar data={alertBarData} options={{
                            ...CHART_DEFAULTS,
                            scales: { x: CHART_DEFAULTS.scales.x, y: { ...CHART_DEFAULTS.scales.y, beginAtZero: true } }
                        }} />
                    </div>
                </div>

                {/* Patient Risk Distribution */}
                <div className="col-span-12 lg:col-span-5 glass-card p-6 border">
                    <h3 className="text-sm font-bold text-white mb-1">Current Risk Distribution</h3>
                    <p className="text-[11px] text-slate-500 mb-5">Green / Yellow / Red across all 8 beds</p>
                    <div style={{ height: 200 }} className="flex items-center justify-center">
                        <Doughnut data={riskDoughnut} options={{
                            ...CHART_DEFAULTS,
                            scales: {},
                            cutout: '65%',
                            plugins: { ...CHART_DEFAULTS.plugins, legend: { display: true, position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } }
                        }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
