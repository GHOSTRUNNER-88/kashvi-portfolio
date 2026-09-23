import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import './admin.css'

export default function AdminLayout() {
  const { user, logout, authFetch } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Fetch unread messages count periodically
  useEffect(() => {
    async function loadCount() {
      try {
        const res = await authFetch('/api/messages')
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setUnreadCount(json.data.filter((m) => !m.read).length)
          }
        }
      } catch {
        // silent
      }
    }
    loadCount()
    const timer = setInterval(loadCount, 30000)
    return () => clearInterval(timer)
  }, [authFetch, location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <ToastProvider>
      <div className="adm-body">
        <div className="adm-layout">
          {/* Sidebar */}
          <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="adm-sidebar-brand">
              <h2>Kashvi<span>Admin</span></h2>
              <button
                className="adm-mobile-toggle"
                onClick={() => setSidebarOpen(false)}
                style={{ fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <nav className="adm-nav">
              <NavLink to="/admin" end className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="dashboard">📊</span> Dashboard
              </NavLink>

              <NavLink to="/admin/profile" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="profile">👤</span> Profile & Bio
              </NavLink>

              <NavLink to="/admin/projects" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="projects">💼</span> Projects
              </NavLink>

              <NavLink to="/admin/media" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="media">🖼</span> Media Library
              </NavLink>

              <NavLink to="/admin/experience" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="experience">📈</span> Experience
              </NavLink>

              <NavLink to="/admin/education" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="education">🎓</span> Education
              </NavLink>

              <NavLink to="/admin/skills" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="skills">🛠</span> Toolkit / Skills
              </NavLink>

              <NavLink to="/admin/messages" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="messages">📬</span> Messages
                {unreadCount > 0 && <span className="adm-nav-badge">{unreadCount}</span>}
              </NavLink>

              <NavLink to="/admin/settings" className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}>
                <span role="img" aria-label="settings">⚙️</span> Settings & Backup
              </NavLink>
            </nav>

            <div className="adm-sidebar-footer">
              <div className="adm-user-pill">
                <i /> {user?.username || 'Admin'}
              </div>
              <button
                onClick={handleLogout}
                className="adm-btn adm-btn-secondary adm-btn-sm"
                title="Sign out"
              >
                Sign out
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <div className="adm-main">
            <header className="adm-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  className="adm-mobile-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  ☰
                </button>
                <div className="adm-header-title">Portfolio Control Center</div>
              </div>

              <div className="adm-header-actions">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="adm-view-site-btn"
                >
                  Live Portfolio ↗
                </a>
              </div>
            </header>

            <main className="adm-content">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ToastProvider>
  )
}

