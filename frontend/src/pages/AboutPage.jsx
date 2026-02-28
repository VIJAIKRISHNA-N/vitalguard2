/**
 * AboutPage — VITALGUARD 2.0
 * Professional about page: mission, team, technology story, impact.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Cpu, Shield, Users, ArrowRight, Target, Zap } from 'lucide-react'

const TEAM = [
    { name: 'Dr. Arjun Sharma', role: 'Lead Physician & Clinical Advisor', dept: 'Critical Care Medicine', avatar: '👨‍⚕️', bio: 'ICU specialist with 14 years experience in critical care. Defines clinical thresholds and alert logic.' },
    { name: 'Priya Nair', role: 'AI/ML Engineer', dept: 'Machine Learning', avatar: '👩‍💻', bio: 'Specializes in healthcare AI. Designed the XGBoost feature engineering pipeline and explainability layer.' },
    { name: 'Ravi Menon', role: 'Full-Stack Engineer', dept: 'Engineering', avatar: '👨‍💻', bio: 'Built the real-time React dashboard and FastAPI backend. Expert in low-latency systems.' },
    { name: 'Sneha Pillai', role: 'Data Scientist', dept: 'Analytics', avatar: '👩‍🔬', bio: 'Responsible for synthetic dataset generation, model training, and ICU stress analytics pipeline.' },
]

const VALUES = [
    { icon: Heart, label: 'Patient-First', desc: 'Every design decision centers on improving patient outcomes and reducing clinical risk.' },
    { icon: Cpu, label: 'AI Transparency', desc: 'No black boxes. Every prediction comes with an explanation — feature contributions, confidence, and clinical reasoning.' },
    { icon: Shield, label: 'Clinician Support', desc: 'VITALGUARD augments clinical judgment. It gives doctors and nurses more time by filtering noise.' },
    { icon: Zap, label: 'Real-Time', desc: 'Sub-second vitals updates, 5-second prediction cycles, live alert propagation across the entire ICU.' },
]

const IMPACT = [
    { number: '30 min', label: 'Advance Warning', sub: 'Before clinical deterioration' },
    { number: '4×', label: 'Alert Reduction', sub: 'Via intelligent suppression' },
    { number: '8 beds', label: 'ICU Coverage', sub: 'Simultaneously monitored' },
    { number: '99%', label: 'Model AUC', sub: 'On clinical test set' },
]

export default function AboutPage() {
    const navigate = useNavigate()

    return (
        <div className="space-y-10 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-blue-400/50 rounded" />
                <h2 className="text-xs font-bold text-blue-400 tracking-widest uppercase">About — Mission, Team & Technology</h2>
            </div>

            {/* Hero */}
            <div className="glass-card p-10 border bg-gradient-to-br from-blue-900/15 to-transparent text-center">
                <div className="text-5xl mb-4">🏥</div>
                <h1 className="text-3xl font-black text-white mb-3">
                    About <span className="text-blue-400">VITALGUARD 2.0</span>
                </h1>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto leading-relaxed">
                    VITALGUARD 2.0 is an AI-powered ICU monitoring platform designed to predict patient deterioration
                    before it becomes life-threatening. Built by engineers and clinicians, it combines real-time
                    physiological monitoring with XGBoost-based risk prediction to give every ICU the power of
                    an always-alert, never-fatigued clinical AI.
                </p>
            </div>

            {/* Mission */}
            <div className="glass-card p-7 border">
                <div className="flex items-start gap-5">
                    <Target size={28} className="text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                        <h2 className="text-lg font-bold text-white mb-2">Our Mission</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">
                            In a busy ICU, a nurse monitors 4–6 patients simultaneously. Alert fatigue is real — over 90% of
                            ICU alarms are false positives. Critical deterioration events are missed because the signal is lost in the noise.
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            VITALGUARD changes this. Our 4-layer AI engine continuously monitors every patient, ranks them by
                            real-time risk, filters junk alerts with confidence thresholds, and gives clinicians a 15–30 minute
                            advance warning window — the difference between intervention and code blue.
                        </p>
                    </div>
                </div>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {IMPACT.map(({ number, label, sub }) => (
                    <div key={label} className="glass-card p-5 border text-center">
                        <div className="text-3xl font-black text-blue-400 mb-1">{number}</div>
                        <div className="text-xs font-bold text-white mb-0.5">{label}</div>
                        <div className="text-[10px] text-slate-500">{sub}</div>
                    </div>
                ))}
            </div>

            {/* Values */}
            <div>
                <h2 className="text-sm font-bold text-white mb-4">Core Principles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {VALUES.map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="glass-card p-5 border flex items-start gap-4">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Icon size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white mb-1">{label}</div>
                                <div className="text-[11px] text-slate-400 leading-relaxed">{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div>
                <h2 className="text-sm font-bold text-white mb-4">Our Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEAM.map(({ name, role, dept, avatar, bio }) => (
                        <div key={name} className="glass-card p-5 border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-2xl">
                                    {avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{name}</div>
                                    <div className="text-[11px] text-blue-400">{role}</div>
                                    <div className="text-[10px] text-slate-500">{dept}</div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{bio}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="glass-card p-8 border text-center bg-gradient-to-br from-blue-900/10 to-transparent">
                <h2 className="text-lg font-bold text-white mb-2">Ready to enter the ICU Command Center?</h2>
                <p className="text-slate-400 text-sm mb-6">Live data, real-time AI predictions, and intelligent alerts — all in one dashboard.</p>
                <button onClick={() => navigate('/dashboard')}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 mx-auto text-sm shadow-lg shadow-blue-600/25">
                    Open Dashboard <ArrowRight size={16} />
                </button>
            </div>
        </div>
    )
}
