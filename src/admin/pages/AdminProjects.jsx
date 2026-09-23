import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminProjects() {
  const { authFetch } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/projects')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setProjects(json.data)
        }
      }
    } catch (err) {
      showToast('Failed to load projects: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      const res = await authFetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Project deleted successfully', 'success')
        loadProjects()
      }
    } catch {
      showToast('Failed to delete project', 'error')
    }
  }

  const handleMove = async (index, direction) => {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= projects.length) return
    const reordered = [...projects]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIdx, 0, moved)
    setProjects(reordered)

    try {
      await authFetch('/api/projects/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((p) => p.id || p.slug) }),
      })
    } catch {
      loadProjects()
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Projects Manager
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            Showcase your best software engineering works, case studies, and live projects.
          </p>
        </div>
        <Link to="/admin/projects/new" className="adm-btn adm-btn-primary">
          ➕ New Project
        </Link>
      </div>

      {/* Projects Table */}
      <div className="adm-box">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#e9c393' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: 'rgba(251,241,230,0.5)', marginBottom: '16px' }}>
              No projects found. Create your first project now!
            </p>
            <Link to="/admin/projects/new" className="adm-btn adm-btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Order</th>
                  <th style={{ width: '80px' }}>Cover</th>
                  <th>Project Title & Slug</th>
                  <th>Tech Stack</th>
                  <th>Year</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj, idx) => (
                  <tr key={proj.id || proj.slug}>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '3px 7px' }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          disabled={idx === projects.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '3px 7px' }}
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </td>

                    <td>
                      {proj.cover ? (
                        <img
                          src={proj.cover}
                          alt={proj.title}
                          style={{
                            width: '56px',
                            height: '38px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid var(--adm-border)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '56px',
                            height: '38px',
                            backgroundColor: '#141414',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: 'rgba(251,241,230,0.3)',
                          }}
                        >
                          No img
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: '500', color: '#fbf1e6', fontSize: '14px' }}>
                        <Link
                          to={`/admin/projects/edit/${proj.id || proj.slug}`}
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {proj.title}
                        </Link>
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)' }}>
                        /{proj.slug} · <span style={{ color: '#e9c393' }}>{proj.meta}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {proj.stack?.map((s) => (
                          <span
                            key={s}
                            className="adm-chip"
                            style={{ fontSize: '11px', padding: '1px 6px' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ color: '#e9c393', fontWeight: '500' }}>{proj.year}</td>

                    <td>
                      <div className="adm-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <a
                          href={`/work/${proj.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          title="Preview public case study page"
                        >
                          👁
                        </a>
                        <button
                          onClick={() => navigate(`/admin/projects/edit/${proj.id || proj.slug}`)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(proj.id || proj.slug, proj.title)}
                          className="adm-btn adm-btn-danger adm-btn-sm"
                        >
                          Delete
                        </button>
                      </div>
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
