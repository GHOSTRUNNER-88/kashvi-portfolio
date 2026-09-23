import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminExperience() {
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
    slug: '',
    meta: '2026',
    year: '2026',
    summary: '',
    body: [''],
    highlights: [['', '']],
  }

  const [formData, setFormData] = useState(emptyItem)

  const loadExperience = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/experience')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setList(json.data)
        }
      }
    } catch (err) {
      showToast('Failed to load experience', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExperience()
  }, [])

  const openCreateModal = () => {
    setEditingId(null)
    setFormData(emptyItem)
    setModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingId(item.id || item.slug)
    setFormData({
      title: item.title || '',
      slug: item.slug || '',
      meta: item.meta || '',
      year: item.year || '',
      summary: item.summary || '',
      body: Array.isArray(item.body) && item.body.length ? item.body : [''],
      highlights:
        Array.isArray(item.highlights) && item.highlights.length
          ? item.highlights
          : [['', '']],
    })
    setModalOpen(true)
  }

  const handleBodyChange = (idx, val) => {
    const updated = [...formData.body]
    updated[idx] = val
    setFormData({ ...formData, body: updated })
  }

  const addBodyParagraph = () => {
    setFormData({ ...formData, body: [...formData.body, ''] })
  }

  const removeBodyParagraph = (idx) => {
    setFormData({ ...formData, body: formData.body.filter((_, i) => i !== idx) })
  }

  const handleHighlightChange = (idx, pos, val) => {
    const updated = [...formData.highlights]
    updated[idx][pos] = val
    setFormData({ ...formData, highlights: updated })
  }

  const addHighlight = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, ['', '']] })
  }

  const removeHighlight = (idx) => {
    setFormData({
      ...formData,
      highlights: formData.highlights.filter((_, i) => i !== idx),
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        body: formData.body.filter((p) => p.trim()),
        highlights: formData.highlights.filter((h) => h[0]?.trim() || h[1]?.trim()),
      }

      let res
      if (editingId) {
        res = await authFetch(`/api/experience/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        res = await authFetch('/api/experience', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (res.ok && json.success) {
        showToast(
          editingId ? 'Experience updated' : 'Experience created',
          'success',
        )
        setModalOpen(false)
        loadExperience()
      } else {
        throw new Error(json.message || 'Failed to save experience')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete experience entry "${title}"?`)) return
    try {
      const res = await authFetch(`/api/experience/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Experience deleted', 'success')
        loadExperience()
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
      await authFetch('/api/experience/reorder', {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds: reordered.map((x) => x.id || x.slug) }),
      })
    } catch {
      loadExperience()
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Experience & Practice
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            Manage your development history, learning milestones, and technical achievements.
          </p>
        </div>
        <button onClick={openCreateModal} className="adm-btn adm-btn-primary">
          ➕ New Experience
        </button>
      </div>

      <div className="adm-box">
        {loading ? (
          <div style={{ color: '#e9c393' }}>Loading experience...</div>
        ) : list.length === 0 ? (
          <p style={{ color: 'rgba(251,241,230,0.5)' }}>No experience entries found.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Order</th>
                  <th>Title & Period</th>
                  <th>Summary</th>
                  <th>Year</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={item.id || item.slug}>
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
                      <div style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)' }}>
                        /{item.slug} · {item.meta}
                      </div>
                    </td>
                    <td style={{ maxWidth: '340px', fontSize: '12.5px', color: 'rgba(251,241,230,0.7)' }}>
                      {item.summary}
                    </td>
                    <td style={{ color: '#e9c393', fontWeight: '500' }}>{item.year || item.meta}</td>
                    <td>
                      <div className="adm-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <a
                          href={`/experience/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          title="Preview public case study"
                        >
                          👁
                        </a>
                        <button
                          onClick={() => openEditModal(item)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id || item.slug, item.title)}
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
          <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="adm-modal-header">
              <h3>{editingId ? `Edit: ${formData.title}` : 'Add Experience Entry'}</h3>
              <button className="adm-modal-close" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="adm-modal-body">
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-label">Entry Title</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Independent project development"
                      required
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-label">URL Slug</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-label">Period / Meta</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={formData.meta}
                      onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                      placeholder="e.g. 2025 or 2024 — Present"
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-label">Year</label>
                    <input
                      type="text"
                      className="adm-input"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    />
                  </div>
                </div>

                <div className="adm-form-group">
                  <label className="adm-label">Summary</label>
                  <textarea
                    className="adm-textarea"
                    rows={2}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Short description..."
                    required
                  />
                </div>

                {/* Paragraphs */}
                <div className="adm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="adm-label">Detail Paragraphs</label>
                    <button
                      type="button"
                      onClick={addBodyParagraph}
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                    >
                      + Add Paragraph
                    </button>
                  </div>
                  {formData.body.map((para, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <textarea
                        className="adm-textarea"
                        rows={2}
                        value={para}
                        onChange={(e) => handleBodyChange(idx, e.target.value)}
                        placeholder={`Paragraph ${idx + 1}...`}
                      />
                      {formData.body.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBodyParagraph(idx)}
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          style={{ alignSelf: 'flex-start' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <div className="adm-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="adm-label">Highlights</label>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                    >
                      + Add Highlight
                    </button>
                  </div>
                  {formData.highlights.map((h, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '8px', marginBottom: '8px' }}>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Key point title"
                        value={h[0] || ''}
                        onChange={(e) => handleHighlightChange(idx, 0, e.target.value)}
                      />
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="Detail description"
                        value={h[1] || ''}
                        onChange={(e) => handleHighlightChange(idx, 1, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeHighlight(idx)}
                        className="adm-btn adm-btn-danger adm-btn-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
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
                  {saving ? 'Saving...' : editingId ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

