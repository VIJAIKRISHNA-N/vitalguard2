/**
 * LandingPage — VITALGUARD 2.0
 * Premium product landing page with hero, feature cards, stats, and CTA.
 */
import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Brain, Bell, Shield, TrendingUp, Server, ArrowRight, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
    { icon: Brain, color: 'blue', title: 'AI-Powered Risk Prediction', desc: 'XGBoost classifier processes 9 engineered vital features to compute risk probability 0–100% every 5 seconds.' },
    { icon: Activity, color: 'cyan', title: 'Real-Time Vitals Monitoring', desc: 'Continuous simulation of HR, SpO₂, BP, RR, and Temperature with baseline deviation detection across 8 ICU beds.' },
    { icon: Bell, color: 'orange', title: 'Intelligent Alert Engine', desc: 'Multi-layer threshold crossing, spike detection, and confidence-filtered alerting with clinical suppression logic.' },
    { icon: Shield, color: 'green', title: 'Explainable AI (XAI)', desc: 'Feature contribution breakdown shows clinicians exactly which vitals are driving the risk score at any moment.' },
    { icon: TrendingUp, color: 'purple', title: '15–30 Min Risk Forecast', desc: 'Trend extrapolation projects patient deterioration up to 30 minutes ahead with growing uncertainty bounds.' },
    { icon: Server, color: 'red', title: 'Crisis Simulation Mode', desc: 'Trigger a live ICU emergency — watch 3 patients deteriorate simultaneously as the AI decision engine responds.' },
]

const STATS = [
    { value: '< 5s', label: 'Prediction Latency' },
    { value: '99%+', label: 'Model AUC Score' },
    { value: '8', label: 'ICU Beds Monitored' },
    { value: '16', label: 'System Features' },
]

const COLOR_MAP = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
    orange: 'from-orange-500/20 to-orange-600/5 border-orange-500/20 text-orange-400',
    green: 'from-green-500/20 to-green-600/5 border-green-500/20 text-green-400',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
}

export default function LandingPage() {
    const navigate = useNavigate()
    const { user } = useAuth()

    // If already logged in, redirect to dashboard
    useEffect(() => { if (user) navigate('/dashboard') }, [user])

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

            {/* ── NAVBAR ────────────────────────────────────────────────── */}
            <nav className="fixed top-0 inset-x-0 z-50 px-8 py-4 flex items-center justify-between header">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                        <Activity size={16} className="text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">VITALGUARD<span className="text-blue-400"> 2.0</span></span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 hidden sm:block">AI-Based Remote ICU Monitoring</span>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all duration-200 flex items-center gap-2">
                        Enter System <ArrowRight size={12} />
                    </button>
                </div>
            </nav>

            {/* ── HERO ──────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Background glow orbs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/8 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/6 rounded-full blur-3xl" />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.02]"
                    style={{ backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">


                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                        AI-Powered
                        <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            ICU Intelligence
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        VITALGUARD 2.0 transforms ICU care with real-time patient monitoring,
                        XGBoost-powered risk prediction, and an intelligent multi-layer alert engine —
                        giving clinicians every second of advance warning.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button onClick={() => navigate('/login')}
                            className="group px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                            Enter ICU System
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 flex items-center gap-2">
                            Explore Features <ChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
                    <ChevronDown size={20} className="text-slate-600" />
                </div>
            </section>

            {/* ── STATS BAR ─────────────────────────────────────────────── */}
            <section className="border-y border-[var(--border)] py-10 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map(({ value, label }) => (
                        <div key={label} className="text-center">
                            <div className="text-3xl font-black text-white mb-1">{value}</div>
                            <div className="text-xs text-slate-500 font-medium">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES GRID ─────────────────────────────────────────── */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="text-xs font-bold text-blue-400 tracking-widest uppercase mb-3">System Capabilities</div>
                        <h2 className="text-3xl font-black text-white mb-4">16 Production-Ready Features</h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-sm">Built across 4 architectural layers — from ICU command center to intelligent alert engine.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FEATURES.map(({ icon: Icon, color, title, desc }) => {
                            const cls = COLOR_MAP[color]
                            return (
                                <div key={title} className={`glass-card p-6 bg-gradient-to-br ${cls} border glass-card-hover`}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cls} border flex items-center justify-center mb-4`}>
                                        <Icon size={18} className={cls.split(' ').at(-1)} />
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>



            {/* ── CTA ───────────────────────────────────────────────────── */}
            <section className="py-24 px-6">
                <div className="max-w-2xl mx-auto text-center glass-card p-12 border-blue-500/20 glow-blue">
                    <div className="text-4xl mb-4">🏥</div>
                    <h2 className="text-2xl font-black text-white mb-4">Ready to Experience the System?</h2>
                    <p className="text-slate-400 text-sm mb-8">Login as Doctor, Nurse, or Admin and explore the full ICU command center.</p>
                    <button onClick={() => navigate('/login')}
                        className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg shadow-blue-600/25 hover:-translate-y-0.5">
                        Access VITALGUARD 2.0 <ArrowRight size={16} />
                    </button>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────── */}
            <footer className="border-t border-[var(--border)] py-6 px-8 text-center text-xs text-slate-600">
                VITALGUARD 2.0 — AI-Based Remote ICU Monitoring & Predictive Triage System · Smart India Hackathon 2024
            </footer>
        </div>
    )
}
