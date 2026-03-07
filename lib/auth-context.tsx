'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { AdminSessionUser } from '~/types/admin'

interface AuthContextType {
  user: AdminSessionUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminSessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/admin/auth/session', {
        cache: 'no-store',
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Failed to refresh admin session:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || '登录失败')
    }

    setUser(data.user)
  }

  const logout = async () => {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
