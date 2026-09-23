import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminProfile() {
  const { authFetch } = useAuth()
  const showToast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    role: '',
    city: '',
    coords: '',
    status: '',
    email: '',
    phones: [''],
    intro: '',
    about: '',
    aboutNote: '',
    glance: [],
    socials: [],
  })

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            setForm({
              name: json.data.name || '',
              role: json.data.role || '',
              city: json.data.city || '',
              coords: json.data.coords || '',
              status: json.data.status || '',
              email: json.data.email || '',
              phones: Array.isArray(json.data.phones) ? json.data.phones : [''],
              intro: json.data.intro || '',
              about: json.data.about || '',
              aboutNote: json.data.aboutNote || '',
              glance: Array.isArray(json.data.glance) ? json.data.glance : [],
              socials: Array.isArray(json.data.socials) ? json.data.socials : [],
            })
          }
        }
      } catch (err) {
        showToast('Failed to load profile data', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [showToast])

  const handlePhoneChange = (index, value) => {
    const updated = [...form.phones]
    updated[index] = value
    setForm({ ...form, phones: updated })
  }

  const addPhone = () => {
    setForm({ ...form, phones: [...form.phones, ''] })
  }

  const removePhone = (index) => {
    setForm({ ...form, phones: form.phones.filter((_, i) => i !== index) })
  }

  const handleGlanceChange = (index, keyIdx, value) => {
    const updated = [...form.glance]
    updated[index][keyIdx] = value
    setForm({ ...form, glance: updated })
  }

  const addGlanceRow = () => {
    setForm({ ...form, glance: [...form.glance, ['Label', 'Value']] })
  }

  const removeGlanceRow = (index) => {
    setForm({ ...form, glance: form.glance.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        phones: form.phones.filter((p) => p.trim()),
      }
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('Profile updated successfully!', 'success')
      } else {
        throw new Error(json.message || 'Failed to save profile')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ color: '#e9c393' }}>Loading profile...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
          Profile & Bio Settings
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
          Manage your personal details, intro copy, contact information, and at-a-glance facts.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Core Info */}
        <div className="adm-box">
          <div className="adm-box-header">
            <h3>Identity & Contact Information</h3>
          </div>

          <div className="adm-form-grid">
            <div className="adm-form-group">
              <label className="adm-label">Full Name</label>
              <input
                type="text"
                className="adm-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Primary Role / Title</label>
              <input
                type="text"
                className="adm-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Email Address</label>
              <input
                type="email"
                className="adm-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Status Badge</label>
              <input
                type="text"
                className="adm-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                placeholder="e.g. Open to internships & freelance"
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Location / City</label>
              <input
                type="text"
                className="adm-input"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Coordinates</label>
              <input
                type="text"
                className="adm-input"
                value={form.coords}
                onChange={(e) => setForm({ ...form, coords: e.target.value })}
                placeholder="e.g. 27.72°N 85.32°E"
              />
            </div>
          </div>

          {/* Phone Numbers */}
          <div style={{ marginTop: '16px' }}>
            <label className="adm-label" style={{ display: 'block', marginBottom: '8px' }}>
              Phone Numbers
            </label>
            {form.phones.map((phone, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="adm-input"
                  value={phone}
                  onChange={(e) => handlePhoneChange(idx, e.target.value)}
                  placeholder="+977 986..."
                />
                <button
                  type="button"
                  onClick={() => removePhone(idx)}
                  className="adm-btn adm-btn-danger adm-btn-sm"
                  title="Remove phone"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPhone}
              className="adm-btn adm-btn-secondary adm-btn-sm"
              style={{ marginTop: '6px' }}
            >
              + Add Phone Number
            </button>
          </div>
        </div>

        {/* Bio Copy */}
        <div className="adm-box">
          <div className="adm-box-header">
            <h3>Bio & Statements</h3>
          </div>

          <div className="adm-form-group">
            <label className="adm-label">Intro Lede (Hero Section)</label>
            <textarea
              className="adm-textarea"
              rows={3}
              value={form.intro}
              onChange={(e) => setForm({ ...form, intro: e.target.value })}
            />
          </div>

          <div className="adm-form-group">
            <label className="adm-label">About Paragraph</label>
            <textarea
              className="adm-textarea"
              rows={3}
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
            />
          </div>

          <div className="adm-form-group">
            <label className="adm-label">About Note / Personal Accent</label>
            <textarea
              className="adm-textarea"
              rows={2}
              value={form.aboutNote}
              onChange={(e) => setForm({ ...form, aboutNote: e.target.value })}
            />
          </div>
        </div>

        {/* At a Glance */}
        <div className="adm-box">
          <div className="adm-box-header">
            <h3>At a Glance (Intro Flank Rows)</h3>
            <button
              type="button"
              onClick={addGlanceRow}
              className="adm-btn adm-btn-secondary adm-btn-sm"
            >
              + Add Row
            </button>
          </div>

          {form.glance.map((row, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr auto',
                gap: '12px',
                marginBottom: '10px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                className="adm-input"
                placeholder="Label (e.g. Based)"
                value={row[0] || ''}
                onChange={(e) => handleGlanceChange(idx, 0, e.target.value)}
              />
              <input
                type="text"
                className="adm-input"
                placeholder="Value (e.g. Kathmandu)"
                value={row[1] || ''}
                onChange={(e) => handleGlanceChange(idx, 1, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeGlanceRow(idx)}
                className="adm-btn adm-btn-danger adm-btn-sm"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
            {saving ? 'Saving changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

