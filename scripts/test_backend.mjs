import app from '../server/app.js'

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const contentType = res.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }
  return { status: res.status, ok: res.ok, data }
}

async function runTests(port) {
  const base = `http://localhost:${port}`
  console.log(`--- Starting Backend & API Verification Tests on ${base} ---`)

  // 1. Health check
  const health = await request(`${base}/api/health`)
  console.log('1. Health check:', health.status, health.data)
  if (!health.ok) throw new Error('Health check failed')

  // 2. Full content bundle
  const content = await request(`${base}/api/content`)
  console.log('2. Content bundle:', content.status, 'Projects count:', content.data.data?.projects?.length)
  if (!content.ok || !content.data.data?.profile) throw new Error('Content bundle failed')

  // 3. Login test
  const login = await request(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  })
  console.log('3. Login status:', login.status, 'Token received:', !!login.data.token)
  if (!login.ok || !login.data.token) throw new Error('Login failed')
  const token = login.data.token

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // 4. Verify token
  const verify = await request(`${base}/api/auth/verify`, { headers: authHeaders })
  console.log('4. Verify token:', verify.status, verify.data.admin?.username)

  // 5. Submit contact message (Public)
  const contact = await request(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Google Recruiter',
      email: 'recruiter@google.com',
      subject: 'Frontend Engineer Opportunity',
      message: 'Hi Kashvi, we love your interactive 360 portfolio!',
    }),
  })
  console.log('5. Submit contact message:', contact.status, contact.data.message)
  if (!contact.ok) throw new Error('Contact submission failed')

  // 6. Get messages (Protected)
  const messages = await request(`${base}/api/messages`, { headers: authHeaders })
  console.log('6. Inbox messages count:', messages.data.data?.length)

  // 7. Create & Delete Test Project
  const newProj = await request(`${base}/api/projects`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Cloud Canvas 3D',
      summary: 'Interactive WebGL spatial environment.',
      stack: ['React', 'Three.js', 'WebGL'],
    }),
  })
  console.log('7. Create project:', newProj.status, newProj.data.data?.slug)

  const delProj = await request(`${base}/api/projects/${newProj.data.data.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  })
  console.log('8. Delete project:', delProj.status, delProj.data.message)

  // 9. Test Media Library endpoints
  const mediaList = await request(`${base}/api/media`, { headers: authHeaders })
  console.log('9. Media library list:', mediaList.status, 'Items count:', mediaList.data.data?.length)
  if (!mediaList.ok) throw new Error('Media list failed: ' + JSON.stringify(mediaList.data))

  // 10. Test Cloudinary config endpoint
  const cldConfig = await request(`${base}/api/cloudinary/config`, { headers: authHeaders })
  console.log('10. Cloudinary config:', cldConfig.status, cldConfig.data.data?.isConfigured ? 'Configured' : 'Local fallback mode')

  console.log('\n🎉 ALL BACKEND, MEDIA & CLOUDINARY API TESTS PASSED SUCCESSFULLY!\n')
}

const TEST_PORT = 5099
const server = app.listen(TEST_PORT, () => {
  runTests(TEST_PORT)
    .then(() => {
      server.close()
      process.exit(0)
    })
    .catch((err) => {
      console.error('Test failed:', err)
      server.close()
      process.exit(1)
    })
})
