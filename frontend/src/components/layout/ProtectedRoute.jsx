/**
 * ProtectedRoute — VITALGUARD 2.0
 * Redirects unauthenticated users to /login.
 * Shows a spinner while auth state is loading.
 */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: 'var(--bg-primary)' }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Loading VITALGUARD 2.0...</p>
                </div>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />
    return children
}
