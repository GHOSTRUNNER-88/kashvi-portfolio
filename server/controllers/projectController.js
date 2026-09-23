import { db } from '../config/db.js'

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getProjects(req, res) {
  try {
    const projects = db.get('projects')
    return res.json({ success: true, data: projects })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch projects' })
  }
}

export function getProjectBySlug(req, res) {
  try {
    const { slug } = req.params
    const project = db.findOne('projects', (p) => p.slug === slug || p.id === slug)
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    return res.json({ success: true, data: project })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch project' })
  }
}

export function createProject(req, res) {
  try {
    const { title, slug, meta, year, summary, stack, cover, shots, body, highlights, links } = req.body

    if (!title || !summary) {
      return res.status(400).json({ success: false, message: 'Title and summary are required' })
    }

    const finalSlug = slug?.trim() || generateSlug(title)
    
    // Check if slug already exists
    const existing = db.findOne('projects', (p) => p.slug === finalSlug)
    if (existing) {
      return res.status(400).json({ success: false, message: `A project with slug "${finalSlug}" already exists.` })
    }

    const newProject = db.insert('projects', {
      id: finalSlug,
      slug: finalSlug,
      title: title.trim(),
      meta: meta || 'Project',
      year: year || new Date().getFullYear().toString(),
      summary: summary.trim(),
      stack: Array.isArray(stack) ? stack : [],
      cover: cover || null,
      shots: Array.isArray(shots) ? shots : [],
      body: Array.isArray(body) ? body : [body].filter(Boolean),
      highlights: Array.isArray(highlights) ? highlights : [],
      links: Array.isArray(links) ? links : [],
    })

    return res.status(201).json({ success: true, message: 'Project created successfully', data: newProject })
  } catch (err) {
    console.error('Create project error:', err)
    return res.status(500).json({ success: false, message: 'Failed to create project' })
  }
}

export function updateProject(req, res) {
  try {
    const { id } = req.params
    const updates = req.body

    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title)
    }

    const updated = db.update('projects', id, updates)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    return res.json({ success: true, message: 'Project updated successfully', data: updated })
  } catch (err) {
    console.error('Update project error:', err)
    return res.status(500).json({ success: false, message: 'Failed to update project' })
  }
}

export function deleteProject(req, res) {
  try {
    const { id } = req.params
    const removed = db.remove('projects', id)
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }
    return res.json({ success: true, message: 'Project deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete project' })
  }
}

export function reorderProjects(req, res) {
  try {
    const { orderedIds } = req.body
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: 'orderedIds array is required' })
    }
    const reordered = db.reorder('projects', orderedIds)
    return res.json({ success: true, message: 'Projects reordered successfully', data: reordered })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to reorder projects' })
  }
}

