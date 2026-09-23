import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  profile as defaultProfile,
  projects as defaultProjects,
  experience as defaultExperience,
  education as defaultEducation,
  skills as defaultSkills,
} from '../content.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [profile, setProfile] = useState(defaultProfile)
  const [projects, setProjects] = useState(defaultProjects)
  const [experience, setExperience] = useState(defaultExperience)
  const [education, setEducation] = useState(defaultEducation)
  const [skills, setSkills] = useState(defaultSkills)
  const [loading, setLoading] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/content')
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          if (json.data.profile) setProfile(json.data.profile)
          if (json.data.projects) setProjects(json.data.projects)
          if (json.data.experience) setExperience(json.data.experience)
          if (json.data.education) setEducation(json.data.education)
          if (json.data.skills) setSkills(json.data.skills)
          setIsLive(true)
        }
      }
    } catch (err) {
      console.info('Backend not reachable yet, using static default content.', err.message)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const submitContact = async (formData) => {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to submit contact message')
    }
    return data
  }

  return (
    <DataContext.Provider
      value={{
        profile,
        projects,
        experience,
        education,
        skills,
        loading,
        isLive,
        refreshData: fetchData,
        submitContact,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function usePortfolioData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error('usePortfolioData must be used within a DataProvider')
  }
  return ctx
}

