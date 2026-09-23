import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

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

export function checkCloudinary() {
  loadEnv()
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const isConfigured = Boolean(
    (cloudName && apiKey && apiSecret) || process.env.CLOUDINARY_URL,
  )

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    })
  }

  return {
    isConfigured,
    cloudName: cloudName || '',
    apiKey: apiKey || '',
  }
}

export const isCloudinaryConfigured = Boolean(
  (process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET) ||
    process.env.CLOUDINARY_URL,
)

export { cloudinary }

