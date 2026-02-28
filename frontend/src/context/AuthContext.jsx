/**
 * AuthContext — VITALGUARD 2.0
 * Mock auth context using localStorage. Firebase-ready: swap login() with
 * Firebase signInWithEmailAndPassword when credentials are available.
 */
import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Demo users — replace with Firebase Auth lookup after setup
const DEMO_USERS = {
    'doctor@vitalguard.ai': {
        uid: 'doc-001',
        name: 'Dr. Arjun Sharma',
        role: 'doctor',
        email: 'doctor@vitalguard.ai',
        avatar: '🩺',
        department: 'Critical Care',
    },
    'nurse@vitalguard.ai': {
        uid: 'nur-001',
        name: 'Nurse Priya Nair',
        role: 'nurse',
        email: 'nurse@vitalguard.ai',
        avatar: '👩‍⚕️',
        department: 'ICU Ward',
    },
    'admin@vitalguard.ai': {
        uid: 'adm-001',
        name: 'Admin Ravi Kumar',
        role: 'admin',
        email: 'admin@vitalguard.ai',
        avatar: '⚙️',
        department: 'System Administration',
    },
}

// Pages each role can access
export const ROLE_PERMISSIONS = {
    doctor: ['dashboard', 'patient', 'alerts', 'reports', 'simulation', 'architecture'],
    nurse: ['dashboard', 'patient', 'alerts'],
    admin: ['dashboard', 'patient', 'alerts', 'reports', 'simulation', 'admin', 'architecture'],
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // No session persistence — always start fresh at login
        setLoading(false)
    }, [])

    /**
     * Login with email + password.
     * TODO: Replace body with Firebase Auth when ready:
     *   const cred = await signInWithEmailAndPassword(auth, email, password)
     *   const role  = await getUserRole(cred.user.uid)
     */
    const login = async (email, password) => {
        const mockUser = DEMO_USERS[email]
        const validPass = password === `VG2024${mockUser?.role?.slice(0, 3)}!`
        if (mockUser && validPass) {
            setUser(mockUser)
            // localStorage removed — session clears on refresh (always starts at login)
            return mockUser
        }
        throw new Error('Invalid email or password')
    }

    /** Quick role-card click on Login Page */
    const loginAsRole = (role) => {
        const roleMap = { doctor: DEMO_USERS['doctor@vitalguard.ai'], nurse: DEMO_USERS['nurse@vitalguard.ai'], admin: DEMO_USERS['admin@vitalguard.ai'] }
        const u = roleMap[role]
        setUser(u)
        return u
    }

    const logout = () => {
        setUser(null)
    }

    const hasPermission = (page) => {
        if (!user) return false
        return ROLE_PERMISSIONS[user.role]?.includes(page) ?? false
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, loginAsRole, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
