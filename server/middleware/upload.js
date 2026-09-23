import multer from 'multer'

// Use memory storage so buffers can be streamed directly to Cloudinary or disk
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|webp|gif|svg|pdf)$/i
  if (!file.originalname.match(allowed)) {
    return cb(new Error('Only image files (JPG, PNG, WEBP, GIF, SVG) and PDFs are allowed!'), false)
  }
  cb(null, true)
}

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
})
