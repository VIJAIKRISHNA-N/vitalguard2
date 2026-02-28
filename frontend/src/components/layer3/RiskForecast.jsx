/**
 * Short-Term Risk Forecast – Layer 3, Feature 13
 * Shows predicted risk for 5, 10, 15, 20, 25, 30 minutes ahead with confidence bands.
 */
import React from 'react'
import { Line } from 'react-chartjs-2'
import { getRiskHex } from '../../utils/riskColors'

export default function RiskForecast({ forecast, currentRisk }) {
    if (!forecast?.forecast?.length) return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3">
                Short-Term Risk Forecast (15–30 min)
            </div>
            <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
                Loading forecast...
            </div>
        </div>
    )

    const points = forecast.forecast
    const labels = ['Now', ...points.map(p => `+${p.minutes_ahead}m`)]
    const predicted = [currentRisk, ...points.map(p => p.predicted_risk)]
    const upper = [currentRisk, ...points.map(p => p.upper_bound)]
    const lower = [currentRisk, ...points.map(p => p.lower_bound)]

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Upper Bound',
                data: upper,
                borderColor: 'transparent',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                fill: '+1',
                pointRadius: 0,
                tension: 0.4,
            },
            {
                label: 'Predicted Risk',
                data: predicted,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: predicted.map(v =>
                    v >= 70 ? '#ef4444' : v >= 40 ? '#f59e0b' : '#22c55e'
                ),
                tension: 0.4,
                fill: false,
            },
            {
                label: 'Lower Bound',
                data: lower,
                borderColor: 'transparent',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                fill: false,
                pointRadius: 0,
                tension: 0.4,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(13, 21, 38, 0.95)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#475569', font: { size: 10 } },
            },
            y: {
                min: 0, max: 100,
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#475569', font: { size: 10 }, callback: v => `${v}%` },
            },
        },
    }

    // Final predicted risk at 30 min
    const finalRisk = points[points.length - 1]?.predicted_risk ?? currentRisk
    const trend = finalRisk > currentRisk ? '↑' : finalRisk < currentRisk ? '↓' : '→'

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-400 font-semibold tracking-widest uppercase">
                    Short-Term Forecast (30 min)
                </span>
                <span className="ml-auto text-sm font-mono font-bold"
                    style={{ color: finalRisk >= 70 ? '#ef4444' : finalRisk >= 40 ? '#f59e0b' : '#22c55e' }}>
                    {trend} {finalRisk.toFixed(1)}% @ 30m
                </span>
            </div>
            <div style={{ height: '160px' }}>
                <Line data={chartData} options={options} />
            </div>
            <div className="mt-2 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                    <span className="w-6 h-0.5 bg-blue-500 inline-block" /> Predicted
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-6 h-3 bg-blue-500/20 inline-block rounded" /> Confidence Band
                </span>
            </div>
        </div>
    )
}
