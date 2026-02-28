/**
 * LoginPage — VITALGUARD 2.0 (redesigned)
 * Step 1: Choose role card. Step 2: Enter credentials for that role.
 * No generic email form — each role has its own credential prompt.
 */
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowLeft, AlertCircle, Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ROLE_CARDS = [
    {
        role: 'doctor',
        avatar: '🩺',
        title: 'Doctor',
        name: 'Dr. Arjun Sharma',
        email: 'doctor@vitalguard.ai',
        password: 'VG2024doc!',
        desc: 'Full ICU access — dashboard, reports, simulation & forecasts',
        color: 'blue',
        access: ['Dashboard', 'Patient Detail', 'Alerts', 'Reports', 'Simulation'],
    },
    {
        role: 'nurse',
        avatar: '👩‍⚕️',
        title: 'Nurse',
        name: 'Nurse Priya Nair',
        email: 'nurse@vitalguard.ai',
        password: 'VG2024nur!',
        desc: 'Monitor vitals, view alerts, and access patient information',
        color: 'green',
        access: ['Dashboard', 'Patient Detail', 'Alerts'],
    },
    {
        role: 'admin',
        avatar: '⚙️',
        title: 'Admin',
        name: 'Admin Ravi Kumar',
        email: 'admin@vitalguard.ai',
        password: 'VG2024adm!',
        desc: 'Complete system access — all modules, config & system settings',
        color: 'purple',
        access: ['All Pages', 'Admin Config', 'System Settings'],
    },
]

const COLORS = {
    blue: { card: 'border-blue-500/40 bg-blue-600/5 hover:border-blue-400/70', badge: 'bg-blue-500/10 text-blue-400', btn: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25', ring: 'ring-blue-500/50', title: 'text-blue-400', glow: 'shadow-blue-500/10' },
    green: { card: 'border-green-500/40 bg-green-600/5 hover:border-green-400/70', badge: 'bg-green-500/10 text-green-400', btn: 'bg-green-600 hover:bg-green-500 shadow-green-600/25', ring: 'ring-green-500/50', title: 'text-green-400', glow: 'shadow-green-500/10' },
    purple: { card: 'border-purple-500/40 bg-purple-600/5 hover:border-purple-400/70', badge: 'bg-purple-500/10 text-purple-400', btn: 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25', ring: 'ring-purple-500/50', title: 'text-purple-400', glow: 'shadow-purple-500/10' },
}

export default function LoginPage() {
    const { login } = useAuth()
    const navigate = useNavigate()

    // Step 1 = role picker, Step 2 = credential form for chosen role
    const [selectedRole, setSelectedRole] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // When user clicks a role card → open credential form pre-filled
    const handleRolePick = (card) => {
        setSelectedRole(card)
        setEmail(card.email)       // pre-fill so user just has to verify
        setPassword(card.password)
        setError('')
    }

    const handleBack = () => {
        setSelectedRole(null)
        setEmail(''); setPassword(''); setError('')
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.message)
        } finally { setLoading(false) }
    }

    const cls = selectedRole ? COLORS[selectedRole.color] : null

    return (
        <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Background orbs */}
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Back to landing */}
            <button onClick={() => selectedRole ? handleBack() : navigate('/')}
                className="absolute top-6 left-6 flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                <ArrowLeft size={14} /> {selectedRole ? 'Back to roles' : 'Back to Home'}
            </button>

            <div className="w-full max-w-5xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-blue-600/15 border border-blue-500/25 items-center justify-center mb-5">
                        <Activity size={24} className="text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">
                        {selectedRole ? `${selectedRole.title} Login` : 'Access VITALGUARD 2.0'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {selectedRole
                            ? `Enter your credentials to access the ICU system as ${selectedRole.title}`
                            : 'Select your role to enter the ICU Command System'}
                    </p>
                </div>

                {/* ── STEP 1: Role selection ── */}
                {!selectedRole && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {ROLE_CARDS.map((card) => {
                            const c = COLORS[card.color]
                            return (
                                <button key={card.role} onClick={() => handleRolePick(card)}
                                    className={`glass-card p-6 border text-left cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${c.card} ${c.glow}`}>
                                    {/* Avatar + name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`w-13 h-13 w-12 h-12 rounded-xl ${c.badge} flex items-center justify-center text-2xl`}>
                                            {card.avatar}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${c.title}`}>{card.title}</div>
                                            <div className="text-[11px] text-slate-500">{card.name}</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4 leading-relaxed">{card.desc}</p>
                                    <div className="flex flex-wrap gap-1 mb-5">
                                        {card.access.map(a => (
                                            <span key={a} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}>{a}</span>
                                        ))}
                                    </div>
                                    <div className={`w-full py-2.5 text-xs font-bold text-white rounded-lg text-center transition-all shadow-lg ${c.btn}`}>
                                        Login as {card.title} →
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* ── STEP 2: Role-specific credential form ── */}
                {selectedRole && (
                    <div className="max-w-md mx-auto">
                        {/* Role info header */}
                        <div className={`glass-card p-5 border ${cls.card} mb-6 flex items-center gap-4`}>
                            <div className={`w-14 h-14 rounded-xl ${cls.badge} flex items-center justify-center text-3xl flex-shrink-0`}>
                                {selectedRole.avatar}
                            </div>
                            <div>
                                <div className={`text-base font-bold ${cls.title}`}>{selectedRole.title}</div>
                                <div className="text-xs text-slate-400">{selectedRole.name}</div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selectedRole.access.map(a => (
                                        <span key={a} className={`text-[10px] px-2 py-0.5 rounded-full ${cls.badge}`}>{a}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Credential form */}
                        <form onSubmit={handleLogin} className="glass-card p-7 border space-y-5">
                            {error && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                    <p className="text-xs text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                                        className="w-full pl-9 pr-4 py-3 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder={selectedRole.email} />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                                        className="w-full pl-9 pr-10 py-3 rounded-lg bg-white/5 border border-[var(--border)] text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="••••••••••" />
                                    <button type="button" onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1.5">
                                    Demo password: <span className="font-mono text-slate-500">{selectedRole.password}</span>
                                </p>
                            </div>

                            <button type="submit" disabled={loading}
                                className={`w-full py-3 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all duration-200 shadow-lg ${cls.btn}`}>
                                {loading ? 'Logging in...' : `Enter as ${selectedRole.title} →`}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
