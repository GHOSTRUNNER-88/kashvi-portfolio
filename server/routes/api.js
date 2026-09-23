import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'

import { login, verifySession, updatePassword } from '../controllers/authController.js'
import { getProfile, updateProfile } from '../controllers/profileController.js'
import {
  getProjects,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
} from '../controllers/projectController.js'
import {
  getExperience,
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperience,
} from '../controllers/experienceController.js'
import {
  getEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  reorderEducation,
} from '../controllers/educationController.js'
import { getSkills, updateSkills } from '../controllers/skillController.js'
import {
  submitMessage,
  getMessages,
  markMessageRead,
  deleteMessage,
} from '../controllers/messageController.js'
import { handleFileUpload } from '../controllers/uploadController.js'
import {
  getMedia,
  saveMedia,
  deleteMedia,
  getCloudinaryConfig,
  signCloudinaryUpload,
} from '../controllers/mediaController.js'
import {
  exportBackup,
  importBackup,
  resetToDefaults,
  getFullContent,
} from '../controllers/backupController.js'
import { db } from '../config/db.js'
import { isCloudinaryConfigured } from '../config/cloudinary.js'

const router = express.Router()

// ---------------------------------------------------- Health & Public Data
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db.isMongo() ? 'MongoDB (connected)' : 'JSON database storage',
    cloudinary: isCloudinaryConfigured ? 'Connected & Active' : 'Not configured (using local storage)',
  })
})

// Full content bundle for fast client hydration
router.get('/content', getFullContent)

// ---------------------------------------------------- Public Reading Routes
router.get('/profile', getProfile)
router.get('/projects', getProjects)
router.get('/projects/:slug', getProjectBySlug)
router.get('/experience', getExperience)
router.get('/education', getEducation)
router.get('/skills', getSkills)

// ---------------------------------------------------- Public Contact Form
router.post('/contact', submitMessage)

// ---------------------------------------------------- Authentication
router.post('/auth/login', login)
router.get('/auth/verify', authMiddleware, verifySession)
router.put('/auth/update', authMiddleware, updatePassword)

// ---------------------------------------------------- Admin Protected Routes
router.put('/profile', authMiddleware, updateProfile)

// Projects CRUD
router.post('/projects', authMiddleware, createProject)
router.patch('/projects/reorder', authMiddleware, reorderProjects)
router.put('/projects/:id', authMiddleware, updateProject)
router.delete('/projects/:id', authMiddleware, deleteProject)

// Experience CRUD
router.post('/experience', authMiddleware, createExperience)
router.patch('/experience/reorder', authMiddleware, reorderExperience)
router.put('/experience/:id', authMiddleware, updateExperience)
router.delete('/experience/:id', authMiddleware, deleteExperience)

// Education CRUD
router.post('/education', authMiddleware, createEducation)
router.patch('/education/reorder', authMiddleware, reorderEducation)
router.put('/education/:id', authMiddleware, updateEducation)
router.delete('/education/:id', authMiddleware, deleteEducation)

// Skills
router.put('/skills', authMiddleware, updateSkills)

// Messages / Inquiries Inbox
router.get('/messages', authMiddleware, getMessages)
router.patch('/messages/:id/read', authMiddleware, markMessageRead)
router.delete('/messages/:id', authMiddleware, deleteMessage)

// Uploads & Media Library
router.post('/upload', authMiddleware, upload.single('file'), handleFileUpload)
router.get('/media', authMiddleware, getMedia)
router.post('/media', authMiddleware, saveMedia)
router.delete('/media/:id', authMiddleware, deleteMedia)

// Cloudinary Widget Config & Signature
router.get('/cloudinary/config', authMiddleware, getCloudinaryConfig)
router.post('/cloudinary/sign', authMiddleware, signCloudinaryUpload)

// Backup & Data management
router.get('/admin/export', authMiddleware, exportBackup)
router.post('/admin/import', authMiddleware, importBackup)
router.post('/admin/reset', authMiddleware, resetToDefaults)

export default router
