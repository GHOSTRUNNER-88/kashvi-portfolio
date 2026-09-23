import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { initDb } from './config/db.js'
import apiRouter from './routes/api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))

// Initialize Database on request if not already initialized
app.use(async (req, res, next) => {
  try {
    await initDb()
    next()
  } catch (err) {
    console.error('Database initialization error:', err)
    next()
  }
})

// Static uploads directory (for local dev)
const uploadsDir = path.join(__dirname, '../public/uploads')
app.use('/uploads', express.static(uploadsDir))

// API Routes
app.use('/api', apiRouter)

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack || err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

export default app

