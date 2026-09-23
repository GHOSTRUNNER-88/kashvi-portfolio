import { db } from '../config/db.js'
import { cloudinary, checkCloudinary } from '../config/cloudinary.js'

export async function getMedia(req, res) {
  try {
    let list = db.get('media')
    if (!Array.isArray(list)) list = []

    // If media is empty, add any existing project covers or character frames as initial items
    if (list.length === 0) {
      const projects = db.get('projects') || []
      projects.forEach((p) => {
        if (p.cover) {
          db.insert('media', {
            id: `media_${p.id || p.slug}`,
            url: p.cover,
            filename: `${p.title} Cover`,
            provider: p.cover.startsWith('http') ? 'external' : 'local',
            createdAt: new Date().toISOString(),
          })
        }
      })
      list = db.get('media') || []
    }

    // Sort newest first
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )
    return res.json({ success: true, data: sorted })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch media assets' })
  }
}

export async function saveMedia(req, res) {
  try {
    const { url, public_id, filename, size, width, height, provider } = req.body

    if (!url) {
      return res.status(400).json({ success: false, message: 'Image URL is required' })
    }

    const newItem = db.insert('media', {
      url,
      public_id: public_id || null,
      filename: filename || url.split('/').pop() || 'image',
      size: size || null,
      width: width || null,
      height: height || null,
      provider: provider || (public_id ? 'cloudinary' : 'local'),
      createdAt: new Date().toISOString(),
    })

    return res.status(201).json({ success: true, message: 'Media registered successfully', data: newItem })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to save media record' })
  }
}

export async function deleteMedia(req, res) {
  try {
    const { id } = req.params
    const item = db.findOne('media', (m) => m.id === id || m.public_id === id)

    if (!item) {
      return res.status(404).json({ success: false, message: 'Media asset not found' })
    }

    const { isConfigured } = checkCloudinary()

    // If Cloudinary asset, delete from Cloudinary
    if (item.public_id && isConfigured) {
      try {
        await cloudinary.uploader.destroy(item.public_id)
      } catch (cErr) {
        console.warn('Cloudinary delete warning:', cErr.message)
      }
    }

    db.remove('media', item.id)

    return res.json({ success: true, message: 'Media asset deleted successfully' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete media asset' })
  }
}

export function getCloudinaryConfig(req, res) {
  try {
    const { isConfigured, cloudName, apiKey } = checkCloudinary()
    return res.json({
      success: true,
      data: {
        isConfigured,
        cloudName,
        apiKey,
      },
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to get Cloudinary config' })
  }
}

export function signCloudinaryUpload(req, res) {
  try {
    const { isConfigured } = checkCloudinary()
    if (!isConfigured) {
      return res.status(400).json({ success: false, message: 'Cloudinary is not configured' })
    }

    const { paramsToSign } = req.body
    if (!paramsToSign || typeof paramsToSign !== 'object') {
      return res.status(400).json({ success: false, message: 'paramsToSign is required' })
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET,
    )

    return res.json({ success: true, signature })
  } catch (err) {
    console.error('Signature error:', err)
    return res.status(500).json({ success: false, message: 'Failed to sign request' })
  }
}


