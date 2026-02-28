/** Utility: get risk color classes based on risk level string */

export const getRiskColor = (level) => {
    switch (level) {
        case 'red': return 'risk-red'
        case 'yellow': return 'risk-yellow'
        case 'green': return 'risk-green'
        default: return 'text-slate-400'
    }
}

export const getRiskBg = (level) => {
    switch (level) {
        case 'red': return 'risk-bg-red border'
        case 'yellow': return 'risk-bg-yellow border'
        case 'green': return 'risk-bg-green border'
        default: return 'bg-slate-800 border-slate-700 border'
    }
}

export const getRiskGlow = (level) => {
    switch (level) {
        case 'red': return 'glow-red'
        case 'yellow': return 'glow-yellow'
        case 'green': return 'glow-green'
        default: return ''
    }
}

export const getRiskHex = (level) => {
    switch (level) {
        case 'red': return '#ef4444'
        case 'yellow': return '#f59e0b'
        case 'green': return '#22c55e'
        default: return '#64748b'
    }
}

export const getRiskLabel = (level) => {
    switch (level) {
        case 'red': return 'Critical'
        case 'yellow': return 'Moderate'
        case 'green': return 'Stable'
        default: return 'Unknown'
    }
}

export const getBedColor = (score) => {
    if (score >= 70) return { bg: 'rgba(239,68,68,0.2)', border: 'rgba(239,68,68,0.5)', text: '#ef4444' }
    if (score >= 40) return { bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)', text: '#f59e0b' }
    return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#22c55e' }
}
