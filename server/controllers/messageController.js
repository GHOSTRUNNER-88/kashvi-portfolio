import { db } from '../config/db.js'

export function submitMessage(req, res) {
  try {
    const { name, email, subject, message } = req.body

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required fields.',
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      })
    }

    const newMessage = db.insert('messages', {
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'New portfolio inquiry').trim(),
      message: message.trim(),
      read: false,
      ip: req.ip || req.connection?.remoteAddress,
    })

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully! Thank you for reaching out.',
      data: { id: newMessage.id, createdAt: newMessage.createdAt },
    })
  } catch (err) {
    console.error('Submit message error:', err)
    return res.status(500).json({ success: false, message: 'Failed to send message.' })
  }
}

export function getMessages(req, res) {
  try {
    const messages = db.get('messages')
    // Return sorted newest first
    const sorted = [...messages].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )
    return res.json({ success: true, data: sorted })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages' })
  }
}

export function markMessageRead(req, res) {
  try {
    const { id } = req.params
    const { read } = req.body

    const updated = db.update('messages', id, { read: read !== undefined ? !!read : true })
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }

    return res.json({ success: true, message: 'Message status updated', data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update message' })
  }
}

export function deleteMessage(req, res) {
  try {
    const { id } = req.params
    const removed = db.remove('messages', id)
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Message not found' })
    }
    return res.json({ success: true, message: 'Message deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete message' })
  }
}

