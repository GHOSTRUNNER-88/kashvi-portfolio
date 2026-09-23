import app from './app.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`\n🚀 Kashvi Portfolio API server running at http://localhost:${PORT}`)
  console.log(`📡 REST API mounted at http://localhost:${PORT}/api`)
  console.log(`💾 Data storage active\n`)
})
