/**
 * useAlarm — VITALGUARD 2.0
 * Real-time ICU alarm using Web Audio API.
 *
 * HOW IT WORKS:
 *  - Watches the `patients` array via a useEffect (real-time, no polling gap)
 *  - Plays a hospital alarm immediately when ANY patient's risk_score >= 98%
 *  - 9-second cooldown between successive alarms to prevent spam
 *  - Works after the very first user interaction on the page (browser requirement)
 */
import { useRef, useCallback, useEffect } from 'react'

const CRITICAL_THRESHOLD = 98   // trigger when risk >= this %
const COOLDOWN_MS = 9000 // minimum gap between alarms (ms)

/**
 * Plays a two-tone hospital monitor alarm immediately.
 * Uses gain ramp (not scheduling) so it works even from a fresh AudioContext.
 */
function playAlarmNow() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()

        // Unlock AudioContext (handles browser autoplay policy)
        if (ctx.state === 'suspended') ctx.resume()

        const now = ctx.currentTime

        // Pattern: 3 sharp double-beeps (like a cardiac monitor alarm)
        const PATTERN = [
            { t: now + 0.01, freq: 987, dur: 0.18 },   // beep 1a — B5
            { t: now + 0.22, freq: 987, dur: 0.18 },   // beep 1b
            { t: now + 0.50, freq: 1174, dur: 0.18 },   // beep 2a — D6
            { t: now + 0.71, freq: 1174, dur: 0.18 },   // beep 2b
            { t: now + 0.99, freq: 987, dur: 0.18 },   // beep 3a
            { t: now + 1.20, freq: 987, dur: 0.18 },   // beep 3b
        ]

        PATTERN.forEach(({ t, freq, dur }) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.value = freq

            // Sharp attack, fast decay — clinical alarm character
            gain.gain.setValueAtTime(0.001, t)
            gain.gain.linearRampToValueAtTime(0.45, t + 0.01)
            gain.gain.setValueAtTime(0.45, t + dur - 0.03)
            gain.gain.linearRampToValueAtTime(0.001, t + dur)

            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(t)
            osc.stop(t + dur)
        })

        // Close context after final beep to free resources
        setTimeout(() => ctx.close(), 1800)
    } catch (e) {
        console.warn('[Alarm] Web Audio API error:', e.message)
    }
}

export function useAlarm(patients, onAlarm) {
    const lastAlarmRef = useRef(0)

    useEffect(() => {
        if (!patients || patients.length === 0) return

        const now = Date.now()
        if (now - lastAlarmRef.current < COOLDOWN_MS) return

        // Find highest-risk patient above threshold
        const critical = patients.find(p => {
            const score = p.risk_score ?? p.riskScore ?? 0
            return score >= CRITICAL_THRESHOLD
        })

        if (!critical) return

        // Trigger immediately
        lastAlarmRef.current = now
        playAlarmNow()
        if (onAlarm) onAlarm(critical.name || critical.id)

    }, [patients])   // runs every time patients array changes (every poll)
}
