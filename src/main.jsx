import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Detail from './Detail.jsx'
import Portfolio from './Portfolio.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { AuthProvider } from './admin/context/AuthContext.jsx'
import ProtectedRoute from './admin/components/ProtectedRoute.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminLogin from './admin/pages/AdminLogin.jsx'
import AdminDashboard from './admin/pages/AdminDashboard.jsx'
import AdminProfile from './admin/pages/AdminProfile.jsx'
import AdminProjects from './admin/pages/AdminProjects.jsx'
import AdminProjectEditor from './admin/pages/AdminProjectEditor.jsx'
import AdminMedia from './admin/pages/AdminMedia.jsx'
import AdminExperience from './admin/pages/AdminExperience.jsx'
import AdminEducation from './admin/pages/AdminEducation.jsx'
import AdminSkills from './admin/pages/AdminSkills.jsx'
import AdminMessages from './admin/pages/AdminMessages.jsx'
import AdminSettings from './admin/pages/AdminSettings.jsx'

import './portfolio.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Portfolio Routes */}
            <Route path="/" element={<Portfolio />} />
            <Route
              path="/work/:slug"
              element={<Detail type="work" kind="Selected work" back="/#work" />}
            />
            <Route
              path="/experience/:slug"
              element={<Detail type="experience" kind="Experience" back="/#experience" />}
            />

            {/* Admin Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="projects/new" element={<AdminProjectEditor />} />
                <Route path="projects/edit/:id" element={<AdminProjectEditor />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="experience" element={<AdminExperience />} />
                <Route path="education" element={<AdminEducation />} />
                <Route path="skills" element={<AdminSkills />} />
                <Route path="messages" element={<AdminMessages />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Portfolio />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </DataProvider>
  </StrictMode>,
)
