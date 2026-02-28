/**
 * SimulationPage — VITALGUARD 2.0
 * Crisis Simulation Mode: trigger ICU emergency and watch the AI engine respond.
 */
import React, { useState, useEffect, useRef } from 'react'
import { Zap, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import api from '../api/client'

const EVENT_STEPS = [
    { t: 500, icon: '🚨', text: 'ICU Emergency triggered — 3 patients forced to critical severity', color: 'text-red-400' },
    { t: 1500, icon: '📡', text: 'Vitals simulator applying critical physiological drift (HR +35, SpO₂ -10%)', color: 'text-orange-400' },
    { t: 3000, icon: '🧠', text: 'XGBoost model receiving new feature vectors from deteriorating vitals', color: 'text-blue-400' },
    { t: 5000, icon: '📈', text: 'Risk scores spiking — P001, P003, P007 entering RED zone (>70%)', color: 'text-red-400' },
    { t: 6500, icon: '🔀', text: 'Patient ranking reshuffling — critical patients moved to top of dashboard', color: 'text-yellow-400' },
    { t: 8000, icon: '🔔', text: 'Alert engine firing: Tachycardia + Hypoxemia + Risk Spike detected', color: 'text-orange-400' },
    { t: 9500, icon: '🛡️', text: 'Confidence filter active — only alerts with confidence > 75% are triggered', color: 'text-cyan-400' },
    { t: 11000, icon: '📊', text: 'ICU Stress Index rising — system stress above 70% threshold', color: 'text-purple-400' },
    { t: 12500, icon: '✅', text: 'All AI systems responding normally. Monitor the dashboard for live updates.', color: 'text-green-400' },
]

export default function SimulationPage() {
    const [simActive, setSimActive] = useState(false)
    const [events, setEvents] = useState([])
    const [status, setStatus] = useState('idle') // idle | running | done
    const [patStatus, setPatStatus] = useState(null)
    const timersRef = useRef([])

    const clearTimers = () => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }

    useEffect(() => {
        // Load current patient simulation status
        api.get('/simulation/status').then(r => setPatStatus(r.data)).catch(() => { })
        return () => clearTimers()
    }, [])

    const triggerSimulation = async () => {
        try {
            setStatus('running')
            setEvents([])
            setSimActive(true)
            await api.post('/simulation/trigger')

            // Schedule event log steps
            EVENT_STEPS.forEach(({ t, icon, text, color }) => {
                const timer = setTimeout(() => {
                    setEvents(prev => [...prev, { icon, text, color, time: new Date().toLocaleTimeString() }])
                    if (t === EVENT_STEPS.at(-1).t) setStatus('done')
                }, t)
                timersRef.current.push(timer)
            })

            // Refresh patient status after trigger
            setTimeout(() => {
                api.get('/simulation/status').then(r => setPatStatus(r.data)).catch(() => { })
            }, 2000)
        } catch (e) {
            console.error('[Simulation] Trigger failed:', e)
            setStatus('idle')
        }
    }

    const resetSimulation = async () => {
        clearTimers()
        try {
            await api.post('/simulation/reset')
            setSimActive(false)
            setEvents([])
            setStatus('idle')
            const r = await api.get('/simulation/status')
            setPatStatus(r.data)
        } catch (e) { console.error('[Simulation] Reset failed:', e) }
    }

    const SEV_LABELS = { 0: { label: 'Stable', cls: 'text-green-400 bg-green-500/10' }, 1: { label: 'Moderate', cls: 'text-yellow-400 bg-yellow-500/10' }, 2: { label: 'Critical', cls: 'text-red-400 bg-red-500/10' } }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Label */}
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-red-400/50 rounded" />
                <h2 className="text-xs font-bold text-red-400 tracking-widest uppercase">Crisis Simulation Mode — AI Decision Engine</h2>
            </div>

            {/* Hero Panel */}
            <div className="glass-card p-8 border border-red-500/20 bg-gradient-to-br from-red-900/10 to-transparent text-center">
                <div className="text-5xl mb-4">{simActive ? '🚨' : '⚡'}</div>
                <h2 className="text-2xl font-black text-white mb-2">
                    {simActive ? 'ICU EMERGENCY ACTIVE' : 'Simulate ICU Emergency'}
                </h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto mb-8">
                    Trigger a live crisis scenario — 3 patients deteriorate simultaneously.
                    Watch the AI engine rerank patients, fire alerts, and raise the ICU stress index in real-time.
                </p>
                <div className="flex items-center justify-center gap-4">
                    {!simActive ? (
                        <button onClick={triggerSimulation}
                            className="group px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-3 shadow-lg shadow-red-600/30 hover:-translate-y-0.5 text-sm">
                            <Zap size={18} className="group-hover:animate-ping" />
                            Simulate ICU Emergency
                        </button>
                    ) : (
                        <button onClick={resetSimulation}
                            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center gap-3 text-sm border border-slate-600">
                            <RefreshCw size={16} />
                            Reset Simulation
                        </button>
                    )}
                </div>

                {status === 'done' && (
                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <CheckCircle size={14} className="text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Simulation complete — check Dashboard for live updates</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Event Log */}
                <div className="col-span-12 lg:col-span-7 glass-card p-6 border">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock size={14} className="text-slate-400" />
                        <h3 className="text-sm font-bold text-white">AI Engine Event Log</h3>
                        {status === 'running' && (
                            <div className="w-4 h-4 border border-blue-500 border-t-transparent rounded-full animate-spin ml-1" />
                        )}
                    </div>
                    {events.length === 0 ? (
                        <div className="text-center py-10 text-slate-600 text-sm">
                            Event log will populate when simulation starts...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {events.map((e, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                                    <span className="text-lg flex-shrink-0">{e.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-medium ${e.color}`}>{e.text}</p>
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-mono flex-shrink-0">{e.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Patient Status Grid */}
                <div className="col-span-12 lg:col-span-5 glass-card p-6 border space-y-4">
                    <h3 className="text-sm font-bold text-white">Patient Severity Status</h3>
                    {patStatus ? Object.entries(patStatus).map(([pid, p]) => {
                        const sev = SEV_LABELS[p.severity] || SEV_LABELS[0]
                        return (
                            <div key={pid} className={`flex items-center justify-between p-3 rounded-lg border ${p.is_simulated && simActive ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--border)] bg-white/2'}`}>
                                <div>
                                    <div className="text-xs font-medium text-white">{p.name}</div>
                                    <div className="text-[10px] text-slate-500">{p.bed} · {pid}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.is_simulated && simActive && <AlertTriangle size={12} className="text-red-400" />}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sev.cls}`}>{sev.label}</span>
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="text-slate-600 text-xs text-center py-6">Loading patient status...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
