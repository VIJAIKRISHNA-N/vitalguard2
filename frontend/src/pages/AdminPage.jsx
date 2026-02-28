/**
 * AdminPage — VITALGUARD 2.0
 * Admin-only configuration panel: system settings, thresholds, patient management.
 */
import React, { useState } from 'react'
import { Settings, Save, RefreshCw, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PATIENTS_CONFIG = [
    { id: 'P001', name: 'Arjun Mehta', bed: 'B01', sev: 2 },
    { id: 'P002', name: 'Priya Sharma', bed: 'B02', sev: 1 },
    { id: 'P003', name: 'Ravi Kumar', bed: 'B03', sev: 2 },
    { id: 'P004', name: 'Seetha Nair', bed: 'B04', sev: 0 },
    { id: 'P005', name: 'Karthik Bose', bed: 'B05', sev: 1 },
    { id: 'P006', name: 'Meena Pillai', bed: 'B06', sev: 0 },
    { id: 'P007', name: 'Vijay Reddy', bed: 'B07', sev: 2 },
    { id: 'P008', name: 'Anitha Joseph', bed: 'B08', sev: 0 },
]
const SEV_OPTIONS = [{ value: 0, label: 'Stable' }, { value: 1, label: 'Moderate' }, { value: 2, label: 'Critical' }]

export default function AdminPage() {
    const { user } = useAuth()
    const [thresholds, setThresholds] = useState({ hr_high: 130, hr_low: 40, spo2_low: 90, rr_high: 30, temp_high: 39.0, sbp_low: 85 })
    const [pollIntervals, setPollIntervals] = useState({ vitals: 3, prediction: 5, alerts: 4 })
    const [minConfidence, setMinConfidence] = useState(0.75)
    const [spikeThreshold, setSpikeThreshold] = useState(20)
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    // Redirect non-admins
    if (user?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Shield size={40} className="text-slate-600" />
                <div className="text-slate-400 text-sm font-medium">Admin access required</div>
                <div className="text-slate-600 text-xs">This page is only accessible to Admin role.</div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-2">
                <span className="w-5 h-0.5 bg-purple-400/50 rounded" />
                <h2 className="text-xs font-bold text-purple-400 tracking-widest uppercase">Admin Configuration — System Settings</h2>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Alert Thresholds */}
                <div className="col-span-12 lg:col-span-6 glass-card p-6 border space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Settings size={14} className="text-purple-400" /> Clinical Alert Thresholds
                    </h3>
                    {[
                        { key: 'hr_high', label: 'Heart Rate High (bpm)', min: 100, max: 200 },
                        { key: 'hr_low', label: 'Heart Rate Low (bpm)', min: 20, max: 60 },
                        { key: 'spo2_low', label: 'SpO₂ Low (%)', min: 70, max: 95 },
                        { key: 'rr_high', label: 'Respiration Rate High', min: 20, max: 50 },
                        { key: 'temp_high', label: 'Temperature High (°C)', min: 37, max: 42, step: 0.1 },
                        { key: 'sbp_low', label: 'Systolic BP Low (mmHg)', min: 60, max: 100 },
                    ].map(({ key, label, min, max, step = 1 }) => (
                        <div key={key}>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-xs text-slate-400">{label}</label>
                                <span className="text-xs font-mono font-bold text-white">{thresholds[key]}</span>
                            </div>
                            <input type="range" min={min} max={max} step={step} value={thresholds[key]}
                                onChange={e => setThresholds(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                                className="w-full accent-purple-500" />
                        </div>
                    ))}
                </div>

                {/* System Settings */}
                <div className="col-span-12 lg:col-span-6 space-y-4">
                    <div className="glass-card p-6 border space-y-4">
                        <h3 className="text-sm font-bold text-white">Polling Intervals (seconds)</h3>
                        {[
                            { key: 'vitals', label: 'Vitals Polling', min: 1, max: 10 },
                            { key: 'prediction', label: 'Prediction Polling', min: 3, max: 30 },
                            { key: 'alerts', label: 'Alerts Polling', min: 2, max: 15 },
                        ].map(({ key, label, min, max }) => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <label className="text-xs text-slate-400 flex-1">{label}</label>
                                <input type="number" min={min} max={max} value={pollIntervals[key]}
                                    onChange={e => setPollIntervals(p => ({ ...p, [key]: parseInt(e.target.value) }))}
                                    className="w-16 px-2 py-1.5 text-xs text-center bg-white/5 border border-[var(--border)] rounded-lg text-white focus:outline-none focus:border-blue-500/50" />
                            </div>
                        ))}
                    </div>
                    <div className="glass-card p-6 border space-y-4">
                        <h3 className="text-sm font-bold text-white">AI Model Settings</h3>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-xs text-slate-400">Min Confidence Filter</label>
                                <span className="text-xs font-mono font-bold text-white">{(minConfidence * 100).toFixed(0)}%</span>
                            </div>
                            <input type="range" min={50} max={100} step={5} value={minConfidence * 100}
                                onChange={e => setMinConfidence(e.target.value / 100)}
                                className="w-full accent-blue-500" />
                        </div>
                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="text-xs text-slate-400">Spike Detection Threshold (%)</label>
                                <span className="text-xs font-mono font-bold text-white">{spikeThreshold}%</span>
                            </div>
                            <input type="range" min={5} max={50} value={spikeThreshold}
                                onChange={e => setSpikeThreshold(parseInt(e.target.value))}
                                className="w-full accent-cyan-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Management */}
            <div className="glass-card p-6 border">
                <h3 className="text-sm font-bold text-white mb-4">Patient Severity Management</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PATIENTS_CONFIG.map(p => (
                        <div key={p.id} className="glass-card p-3 border">
                            <div className="text-xs font-medium text-white mb-0.5">{p.name.split(' ')[0]}</div>
                            <div className="text-[10px] text-slate-500 mb-2">{p.bed} · {p.id}</div>
                            <select defaultValue={p.sev} className="w-full text-[11px] px-2 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-slate-300 focus:outline-none">
                                {SEV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save */}
            <div className="flex gap-3">
                <button onClick={handleSave}
                    className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
                        }`}>
                    {saved ? <><RefreshCw size={14} /> Saved!</> : <><Save size={14} /> Save Configuration</>}
                </button>
            </div>
        </div>
    )
}
