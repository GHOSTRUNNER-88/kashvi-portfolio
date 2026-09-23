import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminEducation() {
  const { authFetch } = useAuth()
  const showToast = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const emptyItem = {
    title: '',
    meta: '',
    summary: '',
  }

  const [formData, setFormData] = useState(emptyItem)

  const loadEducation = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/education')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setList(json.data)
        }
      }
    } catch (err) {
      showToast('Failed to load education', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEducation()
  }, [])

  const openCreateModal = () => {
    setEditingId(null)
    setFormData(emptyItem)
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id || item.title)
    setFormData({
      title: item.title || '',
      meta: item.meta || '',
      summary: item.summary || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      let res
      if (editingId) {
        res = await authFetch(`/api/education/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
      } else {
        res = await authFetch('/api/education', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
      }

      const json = await res.json()
      if (res.ok && json.success) {
        showToast(
          editingId ? 'Education updated' : 'Education created',
          'success',
        )
        setModalOpen(false)
        loadEducation()
      } else {
        throw new Error(json.message || 'Failed to save education')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete education entry "${title}"?`)) return
    try {
      const res = await authFetch(`/api/education/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Education deleted', 'success')
        loadEducation()
      }
    } catch (err) {
      showToast('Failed to delete', 'error')
    }
  }

  const handleMove = async (index, direction) => {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= list.length) return
    const reordered = [...list]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIdx, 0, moved)
    setList(reordered)

    try {
      await authFetch('/api/education/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((x) => x.id || x.title) }),
      })
    } catch {
      loadEducation()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Education & Academics
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            Manage your degrees, university, high school, and qualifications.
          </p>
        </div>
        <button onClick={openCreateModal} className="adm-btn adm-btn-primary">
          ➕ New Entry
        </button>
      </div>

      <div className="adm-box">
        {loading ? (
          <div style={{ color: '#e9c393' }}>Loading education...</div>
        ) : list.length === 0 ? (
          <p style={{ color: 'rgba(251,241,230,0.5)' }}>No education records found.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Institution</th>
                  <th>Degree / Details</th>
                  <th>Period</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={item.id || item.title + idx}>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '2px 6px' }}
                        >
                          ↑
                        </button>
                        <button
                          disabled={idx === list.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{ padding: '2px 6px' }}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500', color: '#fbf1e6', fontSize: '14px' }}>
                        {item.title}
                      </div>
                    </td>
                    <td style={{ color: 'rgba(251,241,230,0.8)', fontSize: '13px' }}>
                      {item.summary}
                    </td>
                    <td style={{ color: '#e9c393', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {item.meta}
                    </td>
                    <td>
                      <div className="adm-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item.title, item.title)}
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

      {/* Modal */}
      {modalOpen && (
        <div className="adm-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h3>{editingId ? `Edit: ${formData.title}` : 'Add Education Record'}</h3>
              <button className="adm-modal-close" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal-body">
                <div className="adm-form-group">
                  <label className="adm-label">Institution / School Name</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. KIIT University"
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Duration / Period</label>
                  <input
                    type="text"
                    className="adm-input"
                    value={formData.meta}
                    onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                    placeholder="e.g. 2024 — 2028 or Class XII"
                    required
                  />
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Degree / Field of Study</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="e.g. B.Tech in Engineering — Computer Science."
                    required
                  />
                </div>
              </div>

              <div className="adm-modal-footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="adm-btn adm-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

