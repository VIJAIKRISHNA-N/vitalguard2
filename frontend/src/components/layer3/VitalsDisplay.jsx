/**
 * Vitals Display – Layer 3, Feature 9
 * Shows real-time Heart Rate, SpO₂, Blood Pressure, Respiration Rate, Temperature
 * with baseline deviation indicators.
 *
 * ALL 5 vital cards are CLICKABLE → each opens its full expansion panel below.
 */
import React, { useState } from 'react'
import BPExpansionPanel from './BPExpansionPanel'
import VitalExpansionPanel from './VitalExpansionPanel'
import { getHRAnalysis, getSpO2Analysis, getRRAnalysis, getTempAnalysis } from '../../api/client'

const VITALS_CONFIG = [
    { key: 'hr', label: 'Heart Rate', unit: 'bpm', icon: '❤️', color: '#f43f5e', normal: [60, 100], baseline_key: 'hr', expandable: true },
    { key: 'spo2', label: 'SpO₂', unit: '%', icon: '🫁', color: '#06b6d4', normal: [95, 100], baseline_key: 'spo2', expandable: true },
    { key: 'sbp', label: 'Sys. BP', unit: 'mmHg', icon: '🩸', color: '#8b5cf6', normal: [90, 140], baseline_key: 'sbp', expandable: true },
    { key: 'rr', label: 'Resp. Rate', unit: 'br/min', icon: '💨', color: '#10b981', normal: [12, 20], baseline_key: 'rr', expandable: true },
    { key: 'temp', label: 'Temp', unit: '°C', icon: '🌡️', color: '#f59e0b', normal: [36.1, 37.2], baseline_key: 'temp', expandable: true },
]

function getDeviation(value, baseline) {
    if (!baseline) return null
    return ((value - baseline) / baseline) * 100
}

function VitalCard({ config, value, baseline, onClick, isExpanded }) {
    const dev = getDeviation(value, baseline)
    const isAbnormal = value !== undefined && (value < config.normal[0] || value > config.normal[1])
    return (
        <div
            className={`glass-card p-4 relative overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg ${isExpanded ? 'ring-2' : ''
                }`}
            style={{
                borderColor: isAbnormal ? config.color + '60' : undefined,
                ...(isExpanded ? { boxShadow: `0 0 0 2px ${config.color}50` } : {}),
            }}
            onClick={onClick}
        >
            {isAbnormal && <div className="absolute inset-0 opacity-5 rounded-xl" style={{ background: config.color }} />}
            <div className="flex items-start justify-between mb-2 relative">
                <div>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        {config.label}
                        <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: config.color + '15', color: config.color, border: `1px solid ${config.color}20` }}>
                            CLICK
                        </span>
                    </div>
                    <div className="vital-value mt-1" style={{ color: config.color, fontSize: '1.5rem' }}>
                        {value !== undefined ? value.toFixed(value === Math.floor(value) ? 0 : 1) : '—'}
                        <span className="text-xs font-normal ml-1 opacity-70">{config.unit}</span>
                    </div>
                </div>
                <span className="text-xl">{config.icon}</span>
            </div>
            {dev !== null && (
                <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs" style={{ color: Math.abs(dev) > 10 ? '#ef4444' : '#94a3b8' }}>
                        {dev > 0 ? '↑' : dev < 0 ? '↓' : '='} {Math.abs(dev).toFixed(1)}% from baseline
                    </span>
                </div>
            )}
            {isAbnormal && (
                <div className="text-xs font-semibold mt-1 flex items-center gap-1" style={{ color: config.color }}>
                    ⚠ Out of range ({config.normal[0]}–{config.normal[1]} {config.unit})
                </div>
            )}
        </div>
    )
}

// ── Panel Configs ─────────────────────────────────────────────────────────
const HR_CONFIG = {
    subParamConfig: {
        icon: '❤️', title: 'Heart Rate',
        items: (p) => [
            { label: 'Current HR', value: p.current_hr, unit: 'bpm', icon: '❤️', color: p.current_hr > 100 ? 'red' : p.current_hr < 60 ? 'yellow' : 'green' },
            { label: 'Resting HR', value: p.resting_hr, unit: 'bpm', icon: '😴', color: 'green' },
            { label: 'HRV', value: p.hrv, unit: 'ms', icon: '📊', color: p.hrv < 10 ? 'red' : p.hrv > 40 ? 'orange' : 'green', derived: true },
            { label: 'Tachycardia', value: p.tachycardia, icon: '⚡', color: p.tachycardia ? 'red' : 'green', flag: p.tachycardia },
            { label: 'Severe Tachy', value: p.severe_tachycardia, icon: '🔴', color: p.severe_tachycardia ? 'red' : 'green', flag: p.severe_tachycardia },
            { label: 'Bradycardia', value: p.bradycardia, icon: '🐢', color: p.bradycardia ? 'yellow' : 'green', flag: p.bradycardia },
            { label: 'Age', value: p.age, unit: 'yrs', icon: '👤', color: p.age > 65 ? 'yellow' : 'green' },
            { label: 'Normal Range', value: `${p.normal_range[0]}–${p.normal_range[1]}`, unit: 'bpm', icon: '📏', color: 'green' },
        ],
    },
    extraRiskMetrics: (risk) => [
        { label: 'Cardiac Stress', value: risk.cardiac_stress_pct, color: risk.cardiac_stress_pct > 60 ? 'text-red-400' : 'text-yellow-400' },
        { label: 'Arrhythmia Prob', value: risk.arrhythmia_probability, color: risk.arrhythmia_probability > 50 ? 'text-red-400' : 'text-slate-300' },
        { label: '12h Deterioration', value: risk.deterioration_12h, color: risk.deterioration_12h > 50 ? 'text-red-400' : 'text-slate-300' },
    ],
    chartConfigs: [
        { title: 'Heart Rate Trend', dataKey: 'hr', color: '#f43f5e', zone: { lo: 100, hi: 140, color: '#ef4444' } },
        { title: 'Risk Score Trend', dataKey: 'risk_pct', color: '#ef4444', zone: { lo: 75, hi: 100, color: '#ef4444' } },
    ],
}

const SPO2_CONFIG = {
    subParamConfig: {
        icon: '🫁', title: 'SpO₂',
        items: (p) => [
            { label: 'Current SpO₂', value: p.current_spo2, unit: '%', icon: '🫁', color: p.current_spo2 < 88 ? 'red' : p.current_spo2 < 94 ? 'yellow' : 'green' },
            { label: '24h Average', value: p.avg_24h, unit: '%', icon: '📊', color: 'green', derived: true },
            { label: 'Fluctuation', value: p.fluctuation, unit: '%', icon: '📈', color: p.fluctuation > 3 ? 'orange' : 'green' },
            { label: 'Hypoxia', value: p.hypoxia, icon: '⚠️', color: p.hypoxia ? 'orange' : 'green', flag: p.hypoxia },
            { label: 'Severe Hypoxia', value: p.severe_hypoxia, icon: '🔴', color: p.severe_hypoxia ? 'red' : 'green', flag: p.severe_hypoxia },
            { label: 'Resp Rate', value: p.resp_rate, unit: 'br/min', icon: '💨', color: p.resp_rate > 25 ? 'red' : 'green' },
        ],
    },
    extraRiskMetrics: (risk) => [
        { label: 'Resp Deterioration', value: risk.respiratory_deterioration_prob, color: risk.respiratory_deterioration_prob > 50 ? 'text-red-400' : 'text-slate-300' },
        { label: 'O₂ Dependency', value: risk.oxygen_dependency_risk, color: risk.oxygen_dependency_risk > 50 ? 'text-orange-400' : 'text-slate-300' },
    ],
    chartConfigs: [
        { title: 'SpO₂ Trend', dataKey: 'spo2', color: '#06b6d4', zone: { lo: 80, hi: 92, color: '#ef4444' } },
        { title: 'Risk Score Trend', dataKey: 'risk_pct', color: '#ef4444', zone: { lo: 75, hi: 100, color: '#ef4444' } },
    ],
}

const RR_CONFIG = {
    subParamConfig: {
        icon: '💨', title: 'Respiratory Rate',
        items: (p) => [
            { label: 'Current RR', value: p.current_rr, unit: 'br/min', icon: '💨', color: p.current_rr > 25 ? 'red' : p.current_rr < 10 ? 'red' : p.current_rr > 20 ? 'yellow' : 'green' },
            { label: '24h Average', value: p.avg_24h, unit: 'br/min', icon: '📊', color: 'green', derived: true },
            { label: 'Tachypnea', value: p.tachypnea, icon: '⚡', color: p.tachypnea ? 'orange' : 'green', flag: p.tachypnea },
            { label: 'Severe Tachypnea', value: p.severe_tachypnea, icon: '🔴', color: p.severe_tachypnea ? 'red' : 'green', flag: p.severe_tachypnea },
            { label: 'Bradypnea', value: p.bradypnea, icon: '🐢', color: p.bradypnea ? 'yellow' : 'green', flag: p.bradypnea },
            { label: 'SpO₂', value: p.spo2, unit: '%', icon: '🫁', color: p.spo2 < 92 ? 'red' : 'green' },
        ],
    },
    extraRiskMetrics: (risk) => [
        { label: 'Resp Failure Prob', value: risk.respiratory_failure_prob, color: risk.respiratory_failure_prob > 50 ? 'text-red-400' : 'text-slate-300' },
        { label: 'ICU Escalation', value: risk.icu_escalation_pct, color: risk.icu_escalation_pct > 50 ? 'text-red-400' : 'text-slate-300' },
    ],
    chartConfigs: [
        { title: 'RR Trend', dataKey: 'rr', color: '#10b981', zone: { lo: 25, hi: 40, color: '#ef4444' } },
        { title: 'Risk Score Trend', dataKey: 'risk_pct', color: '#ef4444', zone: { lo: 75, hi: 100, color: '#ef4444' } },
    ],
}

const TEMP_CONFIG = {
    subParamConfig: {
        icon: '🌡️', title: 'Temperature',
        items: (p) => [
            { label: 'Current Temp', value: p.current_temp, unit: '°C', icon: '🌡️', color: p.current_temp > 39 ? 'red' : p.current_temp > 38 ? 'yellow' : p.current_temp < 35 ? 'red' : 'green' },
            { label: '24h Average', value: p.avg_24h, unit: '°C', icon: '📊', color: 'green', derived: true },
            { label: 'Fever', value: p.fever, icon: '🔥', color: p.fever ? 'orange' : 'green', flag: p.fever },
            { label: 'High Fever', value: p.high_fever, icon: '🔴', color: p.high_fever ? 'red' : 'green', flag: p.high_fever },
            { label: 'Hypothermia', value: p.hypothermia, icon: '❄️', color: p.hypothermia ? 'red' : 'green', flag: p.hypothermia },
            { label: 'Heart Rate', value: p.heart_rate, unit: 'bpm', icon: '❤️', color: p.heart_rate > 100 ? 'red' : 'green' },
        ],
    },
    extraRiskMetrics: (risk) => [
        { label: 'Infection Prob', value: risk.infection_progression_prob, color: risk.infection_progression_prob > 50 ? 'text-red-400' : 'text-slate-300' },
        { label: 'Sepsis Risk', value: risk.sepsis_risk_pct, color: risk.sepsis_risk_pct > 30 ? 'text-red-400' : 'text-slate-300' },
    ],
    chartConfigs: [
        { title: 'Temperature Trend', dataKey: 'temp', color: '#f59e0b', zone: { lo: 38, hi: 41, color: '#ef4444' } },
        { title: 'Risk Score Trend', dataKey: 'risk_pct', color: '#ef4444', zone: { lo: 75, hi: 100, color: '#ef4444' } },
    ],
}

export default function VitalsDisplay({ vitals, baseline, patientId }) {
    const [expanded, setExpanded] = useState(null) // 'hr' | 'spo2' | 'sbp' | 'rr' | 'temp' | null

    const toggle = (key) => setExpanded(prev => prev === key ? null : key)

    return (
        <div>
            <div className="text-xs text-slate-400 font-semibold tracking-widest uppercase mb-3 flex items-center gap-2">
                <span>📊</span> Real-Time Vitals
                {vitals && <span className="ml-auto text-slate-600 font-mono text-xs">{new Date(vitals.timestamp).toLocaleTimeString()}</span>}
            </div>
            <div className="grid grid-cols-5 gap-3">
                {VITALS_CONFIG.map(config => (
                    <VitalCard
                        key={config.key}
                        config={config}
                        value={vitals?.[config.key]}
                        baseline={baseline?.[config.baseline_key]}
                        isExpanded={expanded === config.key}
                        onClick={() => toggle(config.key)}
                    />
                ))}
            </div>

            {/* ── Expansion Panels ── */}
            {expanded && patientId && (
                <div className="mt-4">
                    {expanded === 'sbp' && (
                        <BPExpansionPanel patientId={patientId} onClose={() => setExpanded(null)} />
                    )}
                    {expanded === 'hr' && (
                        <VitalExpansionPanel
                            patientId={patientId} onClose={() => setExpanded(null)}
                            fetchFn={getHRAnalysis} title="Heart Rate Analysis" titleIcon="❤️" accentColor="#f43f5e"
                            {...HR_CONFIG}
                            medLabel="Medication" beforeLabel="Before Medication" afterLabel="After Medication"
                            projectedLabel="Projected HR After Medication" projectedKey="projected_hr_after_med" projectedUnit="bpm"
                            planKey="prescription_plan" planLabel="Medication Plan" planItemKey="medication"
                            historyKey="medication_history" historyLabel="Medication" historyItemKey="medication"
                        />
                    )}
                    {expanded === 'spo2' && (
                        <VitalExpansionPanel
                            patientId={patientId} onClose={() => setExpanded(null)}
                            fetchFn={getSpO2Analysis} title="SpO₂ Analysis" titleIcon="🫁" accentColor="#06b6d4"
                            {...SPO2_CONFIG}
                            medLabel="O₂ Support" beforeLabel="Before Support" afterLabel="After Support"
                            projectedLabel="Projected SpO₂ After Support" projectedKey="projected_spo2_after" projectedUnit="%"
                            planKey="support_plan" planLabel="Oxygen Support Plan" planItemKey="support"
                            historyKey="support_history" historyLabel="O₂ Support" historyItemKey="support"
                        />
                    )}
                    {expanded === 'rr' && (
                        <VitalExpansionPanel
                            patientId={patientId} onClose={() => setExpanded(null)}
                            fetchFn={getRRAnalysis} title="Respiratory Rate Analysis" titleIcon="💨" accentColor="#10b981"
                            {...RR_CONFIG}
                            medLabel="Therapy" beforeLabel="Before Therapy" afterLabel="After Therapy"
                            projectedLabel="Projected RR After Therapy" projectedKey="projected_rr_after" projectedUnit="br/min"
                            planKey="therapy_plan" planLabel="Respiratory Therapy Plan" planItemKey="therapy"
                            historyKey="therapy_history" historyLabel="Therapy" historyItemKey="therapy"
                        />
                    )}
                    {expanded === 'temp' && (
                        <VitalExpansionPanel
                            patientId={patientId} onClose={() => setExpanded(null)}
                            fetchFn={getTempAnalysis} title="Temperature Analysis" titleIcon="🌡️" accentColor="#f59e0b"
                            {...TEMP_CONFIG}
                            medLabel="Medication" beforeLabel="Before Medication" afterLabel="After Medication"
                            projectedLabel="Projected Temp After Medication" projectedKey="projected_temp_after_med" projectedUnit="°C"
                            planKey="prescription_plan" planLabel="Antipyretic Plan" planItemKey="medication"
                            historyKey="medication_history" historyLabel="Medication" historyItemKey="medication"
                        />
                    )}
                </div>
            )}
        </div>
    )
}
