/**
 * Risk Progression Timeline – Layer 3, Feature 12
 * Shows how the patient's risk score has changed over the session.
 */
import React from 'react'
import { Line } from 'react-chartjs-2'

export default function RiskTimeline({ riskHistory }) {
    // riskHistory: array of { timestamp, risk_score, risk_level }
    const labels = riskHistory.map((r, i) =>
        new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    )

    // Color each point based on its risk level
    const pointColors = riskHistory.map(r =>
        r.risk_level === 'red' ? '#ef4444' :
            r.risk_level === 'yellow' ? '#f59e0b' : '#22c55e'
    )

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Risk Score (%)',
                data: riskHistory.map(r => r.risk_score),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2.5,
                pointRadius: 4,
                pointBackgroundColor: pointColors,
                pointBorderColor: 'transparent',
                tension: 0.4,
                fill: true,
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
                borderColor: 'rgba(59, 130, 246, 0.3)',
                borderWidth: 1,
                titleColor: '#e2e8f0',
                bodyColor: '#94a3b8',
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#475569', font: { size: 10 }, maxRotation: 0 },
            },
            y: {
                min: 0, max: 100,
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: {
                    color: '#475569', font: { size: 10 },
                    callback: (v) => `${v}%`
                },
            },
        },
    }

    return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3 flex items-center gap-2">
                <span>📉</span> Risk Progression Timeline
            </div>
            <div style={{ height: '160px' }}>
                {riskHistory.length > 1 ? (
                    <Line data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        Collecting risk data...
                    </div>
                )}
            </div>
        </div>
    )
}
