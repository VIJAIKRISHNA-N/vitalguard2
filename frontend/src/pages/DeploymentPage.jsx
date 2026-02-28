/**
 * DeploymentPage — VITALGUARD 2.0
 * Architecture & deployment story page for judges and stakeholders.
 */
import React from 'react'
import { Server, Database, Cpu, Globe, Shield, Layers } from 'lucide-react'





const COLOR_MAP = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
}

const LAYERS_INFO = [
    { n: '1', name: 'ICU Command Center', color: 'blue', desc: 'Summary metrics, risk index, bed heatmap, patient ranking dashboard' },
    { n: '2', name: 'Smart Triage Core', color: 'purple', desc: 'XGBoost prediction, risk classification, confidence scoring, patient ranking' },
    { n: '3', name: 'Patient Intelligence', color: 'cyan', desc: 'Vitals simulation, trend charts, baseline deviation, risk timeline, 30-min forecast, XAI' },
    { n: '4', name: 'Intelligent Alert Engine', color: 'orange', desc: 'Threshold crossing, spike detection, confidence filtering, alert suppression log' },
]

export default function DeploymentPage() {
    return (
        <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-cyan-400/50 rounded" />
                <h2 className="text-xs font-bold text-cyan-400 tracking-widest uppercase">Deployment Architecture — Infrastructure & Scalability</h2>
            </div>

            {/* System Overview */}
            <div className="glass-card p-8 border text-center">
                <Layers size={32} className="text-blue-400 mx-auto mb-3" />
                <h2 className="text-2xl font-black text-white mb-2">4-Layer Architecture</h2>
                <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                    VITALGUARD 2.0 is built on a modular 4-layer architecture enabling independent scaling,
                    upgrades, and deployment of each system component.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                    {LAYERS_INFO.map(({ n, name, color, desc }) => (
                        <div key={n} className={`p-4 rounded-xl border ${COLOR_MAP[color]}`}>
                            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-black mb-3 mx-auto ${COLOR_MAP[color]}`}>{n}</div>
                            <div className="text-xs font-bold text-white mb-1.5">{name}</div>
                            <div className="text-[11px] text-slate-500 leading-relaxed">{desc}</div>
                        </div>
                    ))}
                </div>
            </div>



            {/* Scalability */}
            <div className="glass-card p-6 border">
                <h3 className="text-sm font-bold text-white mb-4">Scalability & Production Readiness</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { title: 'Multi-ICU Support', desc: 'Firebase Firestore enables horizontal scaling across multiple hospital branches with isolated data namespacing per institution.', icon: '🏥' },
                        { title: 'Model Versioning', desc: 'XGBoost model artifacts stored in cloud storage with versioned endpoints. Zero-downtime model updates via blue-green deployment.', icon: '🔄' },
                        { title: 'Real-Time Streaming', desc: 'Firebase Realtime DB supports sub-second vitals sync. FastAPI WebSocket endpoints enable live dashboard push without polling.', icon: '⚡' },
                    ].map(({ title, desc, icon }) => (
                        <div key={title} className="p-4 rounded-xl bg-white/3 border border-[var(--border)]">
                            <div className="text-2xl mb-2">{icon}</div>
                            <div className="text-xs font-bold text-white mb-1.5">{title}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">{desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
