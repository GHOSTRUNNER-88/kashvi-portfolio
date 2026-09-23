import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import streamifier from 'streamifier'
import { cloudinary, checkCloudinary } from '../config/cloudinary.js'
import { db } from '../config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads')

export async function handleFileUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' })
    }

    const { isConfigured } = checkCloudinary()

    // 1. If Cloudinary is configured, stream directly to Cloudinary
    if (isConfigured) {
      const uploadStreamPromise = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'kashvi_portfolio',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) return reject(error)
              resolve(result)
            },
          )
          streamifier.createReadStream(req.file.buffer).pipe(stream)
        })

      const result = await uploadStreamPromise()

      // Register in Media Library
      const mediaItem = db.insert('media', {
        url: result.secure_url,
        public_id: result.public_id,
        filename: req.file.originalname,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        provider: 'cloudinary',
      })

      return res.status(201).json({
        success: true,
        message: 'File uploaded to Cloudinary successfully',
        data: mediaItem,
      })
    }

    // 2. Fallback: Save to public/uploads or /tmp locally
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }

    const ext = path.extname(req.file.originalname).toLowerCase()
    const cleanName = path
      .basename(req.file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40)
    const uniqueName = `${cleanName}-${Date.now()}-${Math.round(Math.random() * 1e4)}${ext}`
    const targetPath = path.join(UPLOAD_DIR, uniqueName)

    fs.writeFileSync(targetPath, req.file.buffer)
    const fileUrl = `/uploads/${uniqueName}`

    // Register in Media Library
    const mediaItem = db.insert('media', {
      url: fileUrl,
      public_id: null,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      provider: 'local',
    })

    return res.status(201).json({
      success: true,
      message: 'File uploaded locally',
      data: mediaItem,
    })
  } catch (err) {
    console.error('File upload error:', err)
    return res.status(500).json({
      success: false,
      message: 'File upload failed: ' + (err.message || 'Unknown error'),
    })
  }
}
