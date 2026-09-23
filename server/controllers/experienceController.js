import { db } from '../config/db.js'

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getExperience(req, res) {
  try {
    const list = db.get('experience')
    return res.json({ success: true, data: list })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch experience' })
  }
}

export function createExperience(req, res) {
  try {
    const { title, slug, meta, year, summary, body, highlights } = req.body

    if (!title || !summary) {
      return res.status(400).json({ success: false, message: 'Title and summary are required' })
    }

    const finalSlug = slug?.trim() || generateSlug(title)

    const newExp = db.insert('experience', {
      id: finalSlug,
      slug: finalSlug,
      title: title.trim(),
      meta: meta || 'Experience',
      year: year || new Date().getFullYear().toString(),
      summary: summary.trim(),
      body: Array.isArray(body) ? body : [body].filter(Boolean),
      highlights: Array.isArray(highlights) ? highlights : [],
    })

    return res.status(201).json({ success: true, message: 'Experience created successfully', data: newExp })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create experience' })
  }
}

export function updateExperience(req, res) {
  try {
    const { id } = req.params
    const updates = req.body

    const updated = db.update('experience', id, updates)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Experience item not found' })
    }

    return res.json({ success: true, message: 'Experience updated successfully', data: updated })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update experience' })
  }
}

export function deleteExperience(req, res) {
  try {
    const { id } = req.params
    const removed = db.remove('experience', id)
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Experience item not found' })
    }
    return res.json({ success: true, message: 'Experience deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete experience' })
  }
}

export function reorderExperience(req, res) {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' })
    }
    const reordered = db.reorder('experience', orderedIds)
    return res.json({ success: true, message: 'Experience reordered successfully', data: reordered })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reorder experience' })
  }
}

