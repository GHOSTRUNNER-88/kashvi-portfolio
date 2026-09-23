import { db } from '../config/db.js'

export function getSkills(req, res) {
  try {
    const skills = db.get('skills')
    return res.json({ success: true, data: skills })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch skills' })
  }
}

export function updateSkills(req, res) {
  try {
    const { skills } = req.body
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'Skills must be an array of strings' })
    }

    const cleaned = skills.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
    const updated = db.set('skills', cleaned)

    return res.json({ success: true, message: 'Skills updated successfully', data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update skills' })
  }
}

