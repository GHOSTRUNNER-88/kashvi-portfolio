import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminSkills() {
  const { authFetch } = useAuth()
  const showToast = useToast()
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadSkills = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/skills')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setSkills(json.data)
        }
      }
    } catch (err) {
      showToast('Failed to load skills', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSkills()
  }, [])

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault()
      const val = newSkill.trim()
      if (val && !skills.includes(val)) {
        setSkills([...skills, val])
        setNewSkill('')
      }
    }
  }

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const moveSkill = (index, direction) => {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= skills.length) return
    const updated = [...skills]
    const [moved] = updated.splice(index, 1)
    updated.splice(newIdx, 0, moved)
    setSkills(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/skills', {
        method: 'PUT',
        body: JSON.stringify({ skills }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('Toolkit skills updated successfully!', 'success')
      } else {
        throw new Error(json.message || 'Failed to save skills')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Toolkit & Skills
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            Manage the skill tags displayed in the Contact section Toolkit and sidebar tags.
          </p>
        </div>
        <button onClick={handleSave} className="adm-btn adm-btn-primary" disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Skills'}
        </button>
      </div>

      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Add New Skill</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', maxWidth: '500px' }}>
          <input
            type="text"
            className="adm-input"
            placeholder="Type skill name (e.g. Next.js, Docker, Java)..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleAddSkill}
          />
          <button type="button" onClick={handleAddSkill} className="adm-btn adm-btn-secondary">
            + Add
          </button>
        </div>
      </div>

      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Current Active Toolkit ({skills.length} skills)</h3>
        </div>

        {loading ? (
          <div style={{ color: '#e9c393' }}>Loading skills...</div>
        ) : skills.length === 0 ? (
          <p style={{ color: 'rgba(251,241,230,0.5)' }}>No skills added yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {skills.map((skill, idx) => (
              <div
                key={skill + idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  backgroundColor: 'rgba(20, 4, 3, 0.6)',
                  border: '1px solid rgba(251, 241, 230, 0.08)',
                  borderRadius: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#e9c393', minWidth: '24px' }}>
                    #{idx + 1}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: '400', color: '#fbf1e6' }}>
                    {skill}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    disabled={idx === 0}
                    onClick={() => moveSkill(idx, -1)}
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    style={{ padding: '2px 8px' }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    disabled={idx === skills.length - 1}
                    onClick={() => moveSkill(idx, 1)}
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    style={{ padding: '2px 8px' }}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => removeSkill(idx)}
                    className="adm-btn adm-btn-danger adm-btn-sm"
                    title="Remove skill"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

