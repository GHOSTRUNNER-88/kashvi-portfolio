import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { initialData } from '../data/seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let envLoaded = false
function loadEnv() {
  if (envLoaded) return
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
  dotenv.config({ path: path.resolve(__dirname, '../../.env') })
  dotenv.config({ path: path.resolve(process.cwd(), '.env') })
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') })
  envLoaded = true
}
loadEnv()

// On Vercel, root filesystem is read-only, so use /tmp
const isVercel = Boolean(process.env.VERCEL)
const DB_FILE = isVercel
  ? path.join('/tmp', 'db.json')
  : path.join(__dirname, '../data/db.json')

let memoryDb = null
let isMongoConnected = false
let initPromise = null

// Mongoose Schema for persistent cloud storage
const portfolioSchema = new mongoose.Schema(
  {
    storeId: { type: String, default: 'main_portfolio', unique: true, index: true },
    admin: { type: Object, default: {} },
    profile: { type: Object, default: {} },
    projects: { type: Array, default: [] },
    experience: { type: Array, default: [] },
    education: { type: Array, default: [] },
    skills: { type: Array, default: [] },
    media: { type: Array, default: [] },
    messages: { type: Array, default: [] },
  },
  { strict: false, timestamps: true },
)

const PortfolioModel =
  mongoose.models.PortfolioStore ||
  mongoose.model('PortfolioStore', portfolioSchema)

async function syncToMongo(data) {
  if (!isMongoConnected) return
  try {
    const cleanData = { ...data }
    delete cleanData._id
    delete cleanData.__v
    await PortfolioModel.findOneAndUpdate(
      { storeId: 'main_portfolio' },
      { $set: cleanData },
      { upsert: true, new: true },
    )
  } catch (err) {
    console.warn('⚠️ MongoDB background sync warning:', err.message)
  }
}

export async function initDb() {
  if (initPromise) return initPromise

  initPromise = (async () => {
    loadEnv()
    const mongoUri = process.env.MONGODB_URI

    if (mongoUri && mongoUri.trim()) {
      try {
        if (mongoose.connection.readyState !== 1) {
          await mongoose.connect(mongoUri.trim(), {
            serverSelectionTimeoutMS: 5000,
          })
        }
        isMongoConnected = true
        console.log('📦 Connected to MongoDB successfully.')

        // Check if MongoDB already has data
        let doc = await PortfolioModel.findOne({ storeId: 'main_portfolio' })
        if (!doc) {
          // Seed Kashvi's actual CV data into MongoDB
          const defaultSeed = initialData()
          doc = await PortfolioModel.create({
            storeId: 'main_portfolio',
            ...defaultSeed,
          })
          memoryDb = doc.toObject()
          console.log("🌱 Seeded Kashvi's actual CV data to MongoDB.")
        } else {
          memoryDb = doc.toObject()
          console.log('📂 Loaded existing portfolio data from MongoDB.')
        }

        saveDbSync()
        return memoryDb
      } catch (err) {
        console.warn(
          '⚠️ MongoDB connection failed, falling back to local JSON database storage:',
          err.message,
        )
        isMongoConnected = false
      }
    } else {
      console.log(`📁 Using persistent JSON database storage (${DB_FILE}).`)
    }

    // Ensure directory exists
    try {
      const dataDir = path.dirname(DB_FILE)
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }
    } catch {
      // ignore
    }

    // Load local JSON DB or create from Kashvi's CV seed
    if (!fs.existsSync(DB_FILE)) {
      memoryDb = initialData()
      saveDbSync()
      console.log("🌱 Seeded Kashvi's actual CV data into local DB.")
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8')
        memoryDb = JSON.parse(raw)
      } catch (e) {
        console.error('Error reading db.json, re-seeding with CV data:', e)
        memoryDb = initialData()
        saveDbSync()
      }
    }

    return memoryDb
  })()

  return initPromise
}

export function getDb() {
  if (!memoryDb) {
    if (fs.existsSync(DB_FILE)) {
      try {
        memoryDb = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
      } catch {
        memoryDb = initialData()
      }
    } else {
      memoryDb = initialData()
    }
  }
  return memoryDb
}

export function saveDbSync() {
  try {
    const dataDir = path.dirname(DB_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8')
  } catch (err) {
    console.error('Error saving db.json:', err.message)
  }
}

export const db = {
  isMongo: () => isMongoConnected,

  get(collection) {
    const current = getDb()
    return current[collection] || []
  },

  set(collection, data) {
    const current = getDb()
    current[collection] = data
    current.updatedAt = new Date().toISOString()
    saveDbSync()
    syncToMongo(current)
    return current[collection]
  },

  findOne(collection, filterFn) {
    const list = this.get(collection)
    if (Array.isArray(list)) {
      return list.find(filterFn) || null
    }
    return null
  },

  find(collection, filterFn = () => true) {
    const list = this.get(collection)
    if (Array.isArray(list)) {
      return list.filter(filterFn)
    }
    return []
  },

  insert(collection, item) {
    const current = getDb()
    if (!current[collection]) {
      current[collection] = []
    }
    const newItem = {
      id:
        item.id ||
        item.slug ||
        `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    }
    current[collection].push(newItem)
    current.updatedAt = new Date().toISOString()
    saveDbSync()
    syncToMongo(current)
    return newItem
  },

  update(collection, idOrSlug, updates) {
    const current = getDb()
    if (!current[collection]) return null

    if (Array.isArray(current[collection])) {
      const idx = current[collection].findIndex(
        (x) => x.id === idOrSlug || x.slug === idOrSlug,
      )
      if (idx === -1) return null
      current[collection][idx] = {
        ...current[collection][idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      current.updatedAt = new Date().toISOString()
      saveDbSync()
      syncToMongo(current)
      return current[collection][idx]
    } else if (typeof current[collection] === 'object') {
      current[collection] = {
        ...current[collection],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      current.updatedAt = new Date().toISOString()
      saveDbSync()
      syncToMongo(current)
      return current[collection]
    }
    return null
  },

  remove(collection, idOrSlug) {
    const current = getDb()
    if (!current[collection] || !Array.isArray(current[collection])) return false

    const initialLen = current[collection].length
    current[collection] = current[collection].filter(
      (x) => x.id !== idOrSlug && x.slug !== idOrSlug,
    )
    if (current[collection].length !== initialLen) {
      current.updatedAt = new Date().toISOString()
      saveDbSync()
      syncToMongo(current)
      return true
    }
    return false
  },

  reorder(collection, orderedIds) {
    const current = getDb()
    if (!current[collection] || !Array.isArray(current[collection])) return []

    const itemMap = new Map(
      current[collection].map((item) => [item.id || item.slug, item]),
    )
    const newItems = []

    for (const id of orderedIds) {
      if (itemMap.has(id)) {
        newItems.push(itemMap.get(id))
        itemMap.delete(id)
      }
    }
    for (const leftover of itemMap.values()) {
      newItems.push(leftover)
    }

    current[collection] = newItems
    current.updatedAt = new Date().toISOString()
    saveDbSync()
    syncToMongo(current)
    return current[collection]
  },

  exportAll() {
    return getDb()
  },

  importAll(fullData) {
    if (!fullData || typeof fullData !== 'object') {
      throw new Error('Invalid backup data format')
    }
    memoryDb = {
      ...fullData,
      updatedAt: new Date().toISOString(),
    }
    saveDbSync()
    syncToMongo(memoryDb)
    return memoryDb
  },

  reset() {
    memoryDb = initialData()
    saveDbSync()
    syncToMongo(memoryDb)
    return memoryDb
  },
}

