/**
 * AppRouter — VITALGUARD 2.0
 * Defines all 8 routes. Protected routes require auth + wrap in AppLayout.
 */
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import PatientDetailPage from '../pages/PatientDetailPage'
import AlertsCenterPage from '../pages/AlertsCenterPage'
import ReportsPage from '../pages/ReportsPage'
import SimulationPage from '../pages/SimulationPage'
import AdminPage from '../pages/AdminPage'
import DeploymentPage from '../pages/DeploymentPage'
import AboutPage from '../pages/AboutPage'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'

export default function AppRouter() {
    return (
        <Routes>
            {/* ── Public pages ─────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* ── Protected pages (inside AppLayout) ── */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/patient/:id" element={<PatientDetailPage />} />
                <Route path="/alerts" element={<AlertsCenterPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/simulation" element={<SimulationPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/architecture" element={<DeploymentPage />} />
            </Route>

            {/* ── Fallback ─────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
