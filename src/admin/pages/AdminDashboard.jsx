import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminDashboard() {
  const { authFetch } = useAuth()
  const [stats, setStats] = useState({
    projects: 0,
    experience: 0,
    education: 0,
    skills: 0,
    messages: 0,
    unreadMessages: 0,
  })
  const [recentMessages, setRecentMessages] = useState([])
  const [dbStatus, setDbStatus] = useState('Checking...')
  const [cloudinaryStatus, setCloudinaryStatus] = useState('Checking...')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        // Fetch content bundle
        const contentRes = await fetch('/api/content')
        if (contentRes.ok) {
          const json = await contentRes.json()
          if (json.success && json.data) {
            setStats((prev) => ({
              ...prev,
              projects: json.data.projects?.length || 0,
              experience: json.data.experience?.length || 0,
              education: json.data.education?.length || 0,
              skills: json.data.skills?.length || 0,
            }))
          }
        }

        // Fetch health
        const healthRes = await fetch('/api/health')
        if (healthRes.ok) {
          const h = await healthRes.json()
          setDbStatus(h.database || 'Active')
          setCloudinaryStatus(h.cloudinary || 'Local storage')
        }

        // Fetch messages
        const msgRes = await authFetch('/api/messages')
        if (msgRes.ok) {
          const mJson = await msgRes.json()
          if (mJson.success && Array.isArray(mJson.data)) {
            setStats((prev) => ({
              ...prev,
              messages: mJson.data.length,
              unreadMessages: mJson.data.filter((m) => !m.read).length,
            }))
            setRecentMessages(mJson.data.slice(0, 3))
          }
        }
      } catch (err) {
        console.error('Dashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [authFetch])

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
          Portfolio Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
          Manage your portfolio content, inquiries, credentials, and settings.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="adm-grid-4">
        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span className="adm-stat-title">Projects</span>
            <span className="adm-stat-icon">💼</span>
          </div>
          <div className="adm-stat-value">{stats.projects}</div>
          <div className="adm-stat-sub">Active showcased works</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span className="adm-stat-title">Experience</span>
            <span className="adm-stat-icon">📈</span>
          </div>
          <div className="adm-stat-value">{stats.experience}</div>
          <div className="adm-stat-sub">Timeline entries</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span className="adm-stat-title">Education</span>
            <span className="adm-stat-icon">🎓</span>
          </div>
          <div className="adm-stat-value">{stats.education}</div>
          <div className="adm-stat-sub">Academic degrees & schools</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-header">
            <span className="adm-stat-title">Messages</span>
            <span className="adm-stat-icon">📬</span>
          </div>
          <div className="adm-stat-value" style={{ color: stats.unreadMessages > 0 ? '#e9c393' : undefined }}>
            {stats.messages}
          </div>
          <div className="adm-stat-sub">
            {stats.unreadMessages > 0 ? `${stats.unreadMessages} unread inquiries` : 'All caught up'}
          </div>
        </div>
      </div>

      {/* Quick Actions & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="adm-box">
          <div className="adm-box-header">
            <h3>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/admin/projects" className="adm-btn adm-btn-secondary" style={{ justifyContent: 'flex-start' }}>
              ➕ Add or Edit Projects
            </Link>
            <Link to="/admin/profile" className="adm-btn adm-btn-secondary" style={{ justifyContent: 'flex-start' }}>
              ✏️ Update Profile, Bio & Contact Details
            </Link>
            <Link to="/admin/skills" className="adm-btn adm-btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🛠 Manage Toolkit & Tech Skills
            </Link>
            <Link to="/admin/messages" className="adm-btn adm-btn-secondary" style={{ justifyContent: 'flex-start' }}>
              📬 View Contact Messages ({stats.unreadMessages} new)
            </Link>
          </div>
        </div>

        <div className="adm-box">
          <div className="adm-box-header">
            <h3>System & Storage Status</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(251,241,230,0.06)' }}>
              <span style={{ color: 'rgba(251,241,230,0.6)' }}>Storage Engine:</span>
              <span style={{ color: '#e9c393', fontWeight: '500' }}>{dbStatus}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(251,241,230,0.06)' }}>
              <span style={{ color: 'rgba(251,241,230,0.6)' }}>Cloudinary Media:</span>
              <span style={{ color: cloudinaryStatus.includes('Active') ? '#4ecba5' : 'rgba(251,241,230,0.7)', fontWeight: '500' }}>
                {cloudinaryStatus}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(251,241,230,0.06)' }}>
              <span style={{ color: 'rgba(251,241,230,0.6)' }}>API Status:</span>
              <span style={{ color: '#4ecba5', fontWeight: '500' }}>● Online & Healthy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(251,241,230,0.06)' }}>
              <span style={{ color: 'rgba(251,241,230,0.6)' }}>Frontend Sync:</span>
              <span style={{ color: '#fbf1e6' }}>Instant Live Update + Offline Fallback</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              <Link to="/admin/settings" className="adm-btn adm-btn-secondary adm-btn-sm" style={{ width: '100%' }}>
                ⚙️ Database Backup & Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Recent Contact Inquiries</h3>
          <Link to="/admin/messages" className="adm-btn adm-btn-secondary adm-btn-sm">
            View All Inquiries →
          </Link>
        </div>

        {recentMessages.length === 0 ? (
          <p style={{ color: 'rgba(251,241,230,0.5)', fontSize: '13px', margin: '10px 0' }}>
            No inquiries received yet.
          </p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentMessages.map((msg) => (
                  <tr key={msg.id}>
                    <td>
                      <div style={{ fontWeight: '500' }}>{msg.name}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(251,241,230,0.5)' }}>{msg.email}</div>
                    </td>
                    <td>{msg.subject}</td>
                    <td style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)' }}>
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: msg.read ? 'rgba(251,241,230,0.1)' : 'rgba(233,195,147,0.2)',
                          color: msg.read ? 'rgba(251,241,230,0.6)' : '#e9c393',
                        }}
                      >
                        {msg.read ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td>
                      <Link to="/admin/messages" className="adm-btn adm-btn-secondary adm-btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

