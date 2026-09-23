import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('kashvi_admin_token') || null)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('kashvi_admin_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  const verifyToken = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) {
      setLoading(false)
      return false
    }
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${tokenToVerify}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.admin) {
          setUser(data.admin)
          localStorage.setItem('kashvi_admin_user', JSON.stringify(data.admin))
          setLoading(false)
          return true
        }
      }
      // Invalid token
      logout()
      setLoading(false)
      return false
    } catch {
      setLoading(false)
      return !!tokenToVerify
    }
  }, [])

  useEffect(() => {
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [token, verifyToken])

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid username or password')
    }
    setToken(data.token)
    setUser(data.admin)
    localStorage.setItem('kashvi_admin_token', data.token)
    localStorage.setItem('kashvi_admin_user', JSON.stringify(data.admin))
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('kashvi_admin_token')
    localStorage.removeItem('kashvi_admin_user')
  }

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      logout()
      throw new Error('Session expired. Please log in again.')
    }
    return res
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

