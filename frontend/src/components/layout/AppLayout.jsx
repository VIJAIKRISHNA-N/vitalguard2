/**
 * AppLayout — VITALGUARD 2.0
 * Master layout: Sidebar + TopNav + page content with current page label.
 */
import React, { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNav from './TopNav'
import { getActiveAlerts } from '../../api/client'

// Human-readable page names + descriptions shown at top of every page
const PAGE_META = {
    '/dashboard': { name: 'ICU Dashboard', sub: 'Layer 1–4 · Real-Time Patient Overview' },
    '/alerts': { name: 'Alerts Center', sub: 'Layer 4 · Intelligent Alert Engine' },
    '/reports': { name: 'Reports & Analytics', sub: 'ICU Performance Metrics & 7-Day Trends' },
    '/simulation': { name: 'Crisis Simulation', sub: 'Emergency Scenario Testing Mode' },
    '/admin': { name: 'Admin Configuration', sub: 'System Settings & Thresholds' },
    '/architecture': { name: 'Architecture', sub: 'Deployment & Scalability Overview' },
    '/about': { name: 'About VITALGUARD 2.0', sub: 'Mission, Team & Technology' },
}

export default function AppLayout() {
    const [alertCount, setAlertCount] = useState(0)
    const location = useLocation()

    const page = PAGE_META[location.pathname] || PAGE_META[
        Object.keys(PAGE_META).find(k => location.pathname.startsWith(k)) || '/dashboard'
    ]

    const fetchAlerts = useCallback(async () => {
        try {
            const res = await getActiveAlerts()
            setAlertCount(Array.isArray(res.data) ? res.data.length : 0)
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchAlerts()
        const t = setInterval(fetchAlerts, 5000)
        return () => clearInterval(t)
    }, [fetchAlerts])

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <Sidebar />
            <div className="main-content flex flex-col min-h-screen">
                <TopNav alertCount={alertCount} />

                {/* ── Page Identity Banner ── */}
                <div className="px-6 pt-5 pb-2 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur">
                    <h1 className="text-lg font-black text-white">{page?.name}</h1>
                    <p className="text-[11px] text-slate-500 mt-0.5">{page?.sub}</p>
                </div>

                <main className="flex-1 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
