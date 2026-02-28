/**
 * Sidebar — VITALGUARD 2.0
 * Fixed left navigation sidebar with role-based menu filtering and active state.
 */
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Users, BellRing, BarChart3, Zap,
    Settings, Server, LogOut, Activity, ChevronRight, Info,
} from 'lucide-react'

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    { label: 'Alerts Center', path: '/alerts', icon: BellRing, permission: 'alerts' },
    { label: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports' },
    { label: 'Simulation', path: '/simulation', icon: Zap, permission: 'simulation' },
    { label: 'Admin Config', path: '/admin', icon: Settings, permission: 'admin' },
    { label: 'Architecture', path: '/architecture', icon: Server, permission: 'architecture' },
    { label: 'About', path: '/about', icon: Info, permission: 'dashboard' },
]

const ROLE_COLORS = {
    doctor: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    nurse: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
}

export default function Sidebar() {
    const { user, logout, hasPermission } = useAuth()
    const navigate = useNavigate()
    const colors = ROLE_COLORS[user?.role] || ROLE_COLORS.doctor

    const handleLogout = () => { logout(); navigate('/login') }

    return (
        <aside className="sidebar flex flex-col">
            {/* Logo */}
            <div className="px-5 pt-6 pb-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <Activity size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white tracking-tight">VITALGUARD</div>
                        <div className="text-[10px] text-slate-500 font-medium tracking-widest">2.0 SYSTEM</div>
                    </div>
                </div>
            </div>

            {/* User Role Card */}
            <div className="px-4 py-4 border-b border-[var(--border)]">
                <div className={`rounded-lg px-3 py-2.5 border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-2.5">
                        <span className="text-lg">{user?.avatar}</span>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                            <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>{user?.role}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">Navigation</div>
                {NAV_ITEMS.map(({ label, path, icon: Icon, permission }) => {
                    if (!hasPermission(permission)) return null
                    return (
                        <NavLink key={path} to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`
                            }>
                            {({ isActive }) => (<>
                                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                                <span className="flex-1">{label}</span>
                                {isActive && <ChevronRight size={12} className="text-blue-400/60" />}
                            </>)}
                        </NavLink>
                    )
                })}
            </nav>

            {/* System Status + Logout */}
            <div className="p-4 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">System Online</span>
                </div>
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    )
}
