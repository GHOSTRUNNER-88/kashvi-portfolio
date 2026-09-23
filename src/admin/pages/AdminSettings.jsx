import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminSettings() {
  const { authFetch, user } = useAuth()
  const showToast = useToast()

  // Password form
  const [passForm, setPassForm] = useState({
    newUsername: user?.username || 'admin',
    newEmail: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [savingPass, setSavingPass] = useState(false)

  // Health
  const [health, setHealth] = useState(null)
  const [resetting, setResetting] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch('/api/health')
        if (res.ok) {
          const json = await res.json()
          setHealth(json)
        }
      } catch {
        // silent
      }
    }
    loadHealth()
  }, [])

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passForm.newPassword && passForm.newPassword !== passForm.confirmPassword) {
      return showToast('New passwords do not match', 'error')
    }

    setSavingPass(true)
    try {
      const res = await authFetch('/api/auth/update', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword || undefined,
          newUsername: passForm.newUsername,
          newEmail: passForm.newEmail,
        }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('Admin account updated successfully', 'success')
        setPassForm({
          ...passForm,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        throw new Error(json.message || 'Failed to update credentials')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingPass(false)
    }
  }

  const handleExportBackup = async () => {
    try {
      const res = await authFetch('/api/admin/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kashvi-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        showToast('Backup JSON downloaded', 'success')
      }
    } catch {
      showToast('Failed to export backup', 'error')
    }
  }

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!window.confirm('Restoring a backup will overwrite current content. Continue?')) {
      e.target.value = ''
      return
    }

    setImporting(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const res = await authFetch('/api/admin/import', {
        method: 'POST',
        body: JSON.stringify(json),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        showToast('Backup restored successfully!', 'success')
      } else {
        throw new Error(data.message || 'Restore failed')
      }
    } catch (err) {
      showToast('Error restoring backup: ' + err.message, 'error')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset all portfolio content to default? Any unsaved edits will be replaced with standard initial copy.',
      )
    ) {
      return
    }

    setResetting(true)
    try {
      const res = await authFetch('/api/admin/reset', {
        method: 'POST',
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('Portfolio reset to original content defaults', 'success')
      } else {
        throw new Error(json.message || 'Reset failed')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
          Settings & Data Management
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
          Manage your login credentials, data backups, and database configuration.
        </p>
      </div>

      {/* Admin Credentials */}
      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Admin Account & Password</h3>
        </div>

        <form onSubmit={handlePasswordSubmit}>
          <div className="adm-form-grid">
            <div className="adm-form-group">
              <label className="adm-label">Admin Username</label>
              <input
                type="text"
                className="adm-input"
                value={passForm.newUsername}
                onChange={(e) => setPassForm({ ...passForm, newUsername: e.target.value })}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Notification Email</label>
              <input
                type="email"
                className="adm-input"
                value={passForm.newEmail}
                onChange={(e) => setPassForm({ ...passForm, newEmail: e.target.value })}
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Current Password (Required to save)</label>
              <input
                type="password"
                className="adm-input"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                placeholder="Enter current password..."
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">New Password (Leave blank to keep current)</label>
              <input
                type="password"
                className="adm-input"
                value={passForm.newPassword}
                onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                placeholder="Minimum 6 characters..."
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label">Confirm New Password</label>
              <input
                type="password"
                className="adm-input"
                value={passForm.confirmPassword}
                onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password..."
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={savingPass}>
              {savingPass ? 'Updating...' : 'Save Account Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Restore */}
      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Data Backup & Restore</h3>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.7)', margin: '0 0 16px' }}>
          Download a complete JSON snapshot of all your portfolio content, projects, experience,
          and skills for safe keeping, or restore previous data.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={handleExportBackup} className="adm-btn adm-btn-secondary">
            📥 Download JSON Backup
          </button>

          <label className="adm-btn adm-btn-secondary" style={{ cursor: 'pointer' }}>
            {importing ? 'Restoring...' : '📤 Restore from JSON'}
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              style={{ display: 'none' }}
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Cloud Services & Environment */}
      <div className="adm-box">
        <div className="adm-box-header">
          <h3>Cloud Infrastructure & Vercel Deployment</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '13px' }}>
          <div style={{ padding: '14px', backgroundColor: '#080808', border: '1px solid var(--adm-border)', borderRadius: '6px' }}>
            <div style={{ fontWeight: '500', color: '#e9c393', marginBottom: '4px' }}>Cloudinary CDN Storage</div>
            <div style={{ color: 'rgba(251,241,230,0.8)' }}>
              Status: <span style={{ color: health?.cloudinary?.includes('Active') ? '#4ecba5' : '#e9c393', fontWeight: '500' }}>
                {health?.cloudinary || 'Checking...'}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(251,241,230,0.5)', marginTop: '6px', lineHeight: '1.4' }}>
              Set <code>CLOUDINARY_CLOUD_NAME</code>, <code>CLOUDINARY_API_KEY</code>, <code>CLOUDINARY_API_SECRET</code> in your Vercel Project Settings for automatic image uploads.
            </div>
          </div>

          <div style={{ padding: '14px', backgroundColor: '#080808', border: '1px solid var(--adm-border)', borderRadius: '6px' }}>
            <div style={{ fontWeight: '500', color: '#e9c393', marginBottom: '4px' }}>Database Engine</div>
            <div style={{ color: 'rgba(251,241,230,0.8)' }}>
              Status: <span style={{ color: '#4ecba5', fontWeight: '500' }}>{health?.database || 'Active'}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(251,241,230,0.5)', marginTop: '6px', lineHeight: '1.4' }}>
              For permanent database storage across Vercel serverless cold starts, set <code>MONGODB_URI</code> in Vercel Environment Variables.
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Defaults */}
      <div className="adm-box" style={{ borderColor: 'rgba(224, 93, 93, 0.3)' }}>
        <div className="adm-box-header">
          <h3 style={{ color: '#e05d5d' }}>Danger Zone</h3>
        </div>

        <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.7)', margin: '0 0 16px' }}>
          Reset your portfolio to default seed content.
        </p>

        <button
          onClick={handleResetDefaults}
          className="adm-btn adm-btn-danger"
          disabled={resetting}
        >
          {resetting ? 'Resetting...' : '⚠️ Reset to Default Content'}
        </button>
      </div>
    </div>
  )
}

