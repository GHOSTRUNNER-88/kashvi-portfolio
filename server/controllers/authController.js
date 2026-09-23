import bcrypt from 'bcryptjs'
import { db } from '../config/db.js'
import { generateToken } from '../middleware/auth.js'

export async function login(req, res) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      })
    }

    const admin = db.get('admin')

    // Allow login by matching username or email
    const usernameMatch =
      admin.username.toLowerCase() === username.trim().toLowerCase() ||
      admin.email.toLowerCase() === username.trim().toLowerCase()

    if (!usernameMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      })
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      })
    }

    const token = generateToken({
      username: admin.username,
      email: admin.email,
    })

    return res.json({
      success: true,
      token,
      admin: {
        username: admin.username,
        email: admin.email,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ success: false, message: 'Server error during login.' })
  }
}

export async function verifySession(req, res) {
  try {
    const admin = db.get('admin')
    return res.json({
      success: true,
      valid: true,
      admin: {
        username: admin.username,
        email: admin.email,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Verification error.' })
  }
}

export async function updatePassword(req, res) {
  try {
    const { currentPassword, newPassword, newUsername, newEmail } = req.body

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required.',
      })
    }

    const admin = db.get('admin')
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      })
    }

    const updates = {}
    if (newPassword && newPassword.length >= 6) {
      updates.passwordHash = await bcrypt.hash(newPassword, 10)
    } else if (newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      })
    }

    if (newUsername && newUsername.trim()) {
      updates.username = newUsername.trim()
    }
    if (newEmail && newEmail.trim()) {
      updates.email = newEmail.trim()
    }

    const updated = db.update('admin', 'admin', updates)

    return res.json({
      success: true,
      message: 'Admin settings updated successfully.',
      admin: {
        username: updated.username,
        email: updated.email,
      },
    })
  } catch (err) {
    console.error('Update password error:', err)
    return res.status(500).json({ success: false, message: 'Failed to update credentials.' })
  }
}

