/**
 * TopNav — VITALGUARD 2.0
 * Top navigation bar: page title, live clock, alert badge, user info.
 */
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
    '/dashboard': { title: 'ICU Command Center', sub: 'Layer 1 — Real-Time Overview' },
    '/alerts': { title: 'Alerts Center', sub: 'Layer 4 — Intelligent Alert Engine' },
    '/reports': { title: 'Reports & Analytics', sub: 'ICU Performance Metrics' },
    '/simulation': { title: 'Crisis Simulation Mode', sub: 'AI Decision Engine Test' },
    '/admin': { title: 'Admin Configuration', sub: 'System Settings & Management' },
    '/architecture': { title: 'Deployment Architecture', sub: 'Infrastructure & Scalability' },
}

export default function TopNav({ alertCount = 0 }) {
    const { user } = useAuth()
    const location = useLocation()
    const [now, setNow] = useState(new Date())

    // Patient detail page title
    const isPatient = location.pathname.startsWith('/patient/')
    const meta = isPatient
        ? { title: 'Patient Intelligence', sub: 'Layer 3 — Full Detail View' }
        : (PAGE_TITLES[location.pathname] || { title: 'VITALGUARD 2.0', sub: '' })

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    return (
        <header className="header px-6 py-3 flex items-center justify-between">
            {/* Page title */}
            <div>
                <h1 className="text-base font-bold text-white leading-tight">{meta.title}</h1>
                <p className="text-[11px] text-slate-500">{meta.sub}</p>
            </div>

            <div className="flex items-center gap-4">
                {/* Live clock */}
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <Clock size={12} />
                    <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-slate-700">|</span>
                    <span>{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>

                {/* Alert badge */}
                {alertCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30">
                        <Bell size={12} className="text-red-400 alert-badge" />
                        <span className="text-xs font-bold text-red-400">{alertCount} Alert{alertCount > 1 ? 's' : ''}</span>
                    </div>
                )}

                {/* User */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-sm">{user?.avatar}</span>
                    <span className="text-xs text-slate-300 font-medium hidden sm:block">{user?.name?.split(' ')[0]}</span>
                </div>
            </div>
        </header>
    )
}
