import { db } from '../config/db.js'

export function getEducation(req, res) {
  try {
    const list = db.get('education')
    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch education' })
  }
}

export function createEducation(req, res) {
  try {
    const { title, meta, summary } = req.body

    if (!title || !summary) {
      return res.status(400).json({ success: false, message: 'Title and summary are required' })
    }

    const newEdu = db.insert('education', {
      title: title.trim(),
      meta: meta?.trim() || '',
      summary: summary.trim(),
    })

    return res.status(201).json({ success: true, message: 'Education created successfully', data: newEdu })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create education' })
  }
}

export function updateEducation(req, res) {
  try {
    const { id } = req.params
    const updates = req.body

    const updated = db.update('education', id, updates)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Education item not found' })
    }

    return res.json({ success: true, message: 'Education updated successfully', data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update education' })
  }
}

export function deleteEducation(req, res) {
  try {
    const { id } = req.params
    const removed = db.remove('education', id)
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Education item not found' })
    }
    return res.json({ success: true, message: 'Education deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete education' })
  }
}

export function reorderEducation(req, res) {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' })
    }
    const reordered = db.reorder('education', orderedIds)
    return res.json({ success: true, message: 'Education reordered successfully', data: reordered })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reorder education' })
  }
}

