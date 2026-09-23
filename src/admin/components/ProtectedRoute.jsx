import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a0504',
        color: '#e9c393',
        fontFamily: "'Poppins', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '12px' }}>Loading Admin Console...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}

