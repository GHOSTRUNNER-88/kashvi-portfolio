import { db } from '../config/db.js'

export function exportBackup(req, res) {
  try {
    const data = db.exportAll()
    // Strip sensitive password hash from client export for safety
    const safeData = {
      ...data,
      admin: {
        username: data.admin?.username || 'admin',
        email: data.admin?.email || 'kashvijain2910@gmail.com',
      },
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=kashvi-portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`,
    )
    return res.send(JSON.stringify(safeData, null, 2))
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to export backup' })
  }
}

export function importBackup(req, res) {
  try {
    const rawData = req.body
    if (!rawData || typeof rawData !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid JSON data for backup restore' })
    }

    // Preserve existing admin password if not provided in restore
    const currentAdmin = db.get('admin')
    const toImport = {
      ...rawData,
      admin: {
        ...rawData.admin,
        passwordHash: rawData.admin?.passwordHash || currentAdmin.passwordHash,
      },
    }

    const imported = db.importAll(toImport)
    return res.json({ success: true, message: 'Backup restored successfully', data: imported })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to import backup: ' + err.message })
  }
}

export function resetToDefaults(req, res) {
  try {
    const resetData = db.reset()
    return res.json({ success: true, message: 'Portfolio reset to default content successfully', data: resetData })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reset portfolio data' })
  }
}

export function getFullContent(req, res) {
  try {
    const profile = db.get('profile')
    const projects = db.get('projects')
    const experience = db.get('experience')
    const education = db.get('education')
    const skills = db.get('skills')

    return res.json({
      success: true,
      data: {
        profile,
        projects,
        experience,
        education,
        skills,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load full content bundle' })
  }
}

