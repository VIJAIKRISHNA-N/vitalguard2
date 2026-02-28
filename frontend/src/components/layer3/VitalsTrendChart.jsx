/**
 * Vitals Trend Chart – Layer 3, Feature 10
 * Time series chart showing HR, SpO2, and RR over time using Chart.js.
 */
import React, { useRef, useEffect } from 'react'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement,
    LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function VitalsTrendChart({ history }) {
    const timestamps = history.map(v =>
        new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    )
    // Show only every 3rd label to avoid crowding
    const labels = timestamps.map((t, i) => i % 3 === 0 ? t : '')

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Heart Rate (bpm)',
                data: history.map(v => v.hr),
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.08)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
            },
            {
                label: 'SpO₂ (%)',
                data: history.map(v => v.spo2),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                yAxisID: 'y1',
            },
            {
                label: 'Resp. Rate (br/min)',
                data: history.map(v => v.rr),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                fill: false,
                yAxisID: 'y',
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' }, boxWidth: 12 }
            },
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
                position: 'left',
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: '#475569', font: { size: 10 } },
                title: { display: true, text: 'HR / RR', color: '#475569', font: { size: 10 } },
            },
            y1: {
                position: 'right',
                grid: { drawOnChartArea: false },
                min: 80, max: 100,
                ticks: { color: '#475569', font: { size: 10 } },
                title: { display: true, text: 'SpO₂ %', color: '#475569', font: { size: 10 } },
            },
        },
    }

    return (
        <div className="glass-card p-5">
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3 flex items-center gap-2">
                <span>📈</span> Vitals Trend (Time Series)
            </div>
            <div style={{ height: '200px' }}>
                {history.length > 1 ? (
                    <Line data={chartData} options={options} />
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                        Collecting data... (polling every 3s)
                    </div>
                )}
            </div>
        </div>
    )
}
