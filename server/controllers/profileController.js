import { db } from '../config/db.js'

export function getProfile(req, res) {
  try {
    const profile = db.get('profile')
    return res.json({ success: true, data: profile })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' })
  }
}

export function updateProfile(req, res) {
  try {
    const updates = req.body
    const updated = db.set('profile', updates)
    return res.json({ success: true, message: 'Profile updated successfully', data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile' })
  }
}

