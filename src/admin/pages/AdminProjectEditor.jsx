import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'
import MediaLibraryModal from '../components/MediaLibraryModal.jsx'

const STACK_PRESETS = [
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'AI',
  'Spring Boot',
  'Next.js',
  'TypeScript',
  'JavaScript',
  'TailwindCSS',
  'Three.js',
  'PostgreSQL',
  'Docker',
  'GraphQL',
]

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminProjectEditor() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const { authFetch } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [mediaTarget, setMediaTarget] = useState('cover') // 'cover' | 'shot'
  const [tagInput, setTagInput] = useState('')
  const [isCustomSlug, setIsCustomSlug] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    meta: 'MERN · AI',
    year: new Date().getFullYear().toString(),
    summary: '',
    stack: ['React', 'Node.js', 'Express', 'MongoDB'],
    cover: '',
    shots: [],
    body: [''],
    highlights: [['', '']],
    links: [
      { label: 'Live Demo', url: '' },
      { label: 'GitHub', url: '' },
    ],
  })

  // Load existing project if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return

    async function loadProject() {
      try {
        setLoading(true)
        const res = await fetch(`/api/projects/${id}`)
        if (res.ok) {
          const json = await res.json()
          if (json.success && json.data) {
            const p = json.data
            setForm({
              title: p.title || '',
              slug: p.slug || '',
              meta: p.meta || '',
              year: p.year || '',
              summary: p.summary || '',
              stack: Array.isArray(p.stack) ? p.stack : [],
              cover: p.cover || '',
              shots: Array.isArray(p.shots) ? p.shots : [],
              body: Array.isArray(p.body) && p.body.length ? p.body : [''],
              highlights:
                Array.isArray(p.highlights) && p.highlights.length
                  ? p.highlights
                  : [['', '']],
              links:
                Array.isArray(p.links) && p.links.length
                  ? p.links
                  : [
                      { label: 'Live Demo', url: '' },
                      { label: 'GitHub', url: '' },
                    ],
            })
            setIsCustomSlug(true)
          }
        } else {
          showToast('Project not found', 'error')
          navigate('/admin/projects')
        }
      } catch (err) {
        showToast('Failed to load project: ' + err.message, 'error')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [id, isEditMode, navigate, showToast])

  // Auto update slug when title changes (if user hasn't manually customized it)
  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setForm((prev) => ({
      ...prev,
      title: newTitle,
      slug: isCustomSlug ? prev.slug : generateSlug(newTitle),
    }))
  }

  // Tech Stack Handlers
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = tagInput.trim().replace(',', '')
      if (val && !form.stack.includes(val)) {
        setForm((prev) => ({ ...prev, stack: [...prev.stack, val] }))
      }
      setTagInput('')
    }
  }

  const addPresetTag = (tag) => {
    if (!form.stack.includes(tag)) {
      setForm((prev) => ({ ...prev, stack: [...prev.stack, tag] }))
    }
  }

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, stack: prev.stack.filter((t) => t !== tag) }))
  }

  // Body Paragraphs Handlers
  const handleBodyChange = (idx, val) => {
    const updated = [...form.body]
    updated[idx] = val
    setForm((prev) => ({ ...prev, body: updated }))
  }

  const addBodyParagraph = () => {
    setForm((prev) => ({ ...prev, body: [...prev.body, ''] }))
  }

  const removeBodyParagraph = (idx) => {
    setForm((prev) => ({
      ...prev,
      body: prev.body.filter((_, i) => i !== idx),
    }))
  }

  // Highlights Handlers
  const handleHighlightChange = (idx, pos, val) => {
    const updated = [...form.highlights]
    updated[idx][pos] = val
    setForm((prev) => ({ ...prev, highlights: updated }))
  }

  const addHighlight = () => {
    setForm((prev) => ({
      ...prev,
      highlights: [...prev.highlights, ['', '']],
    }))
  }

  const removeHighlight = (idx) => {
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== idx),
    }))
  }

  // External Links Handlers
  const handleLinkChange = (idx, field, val) => {
    const updated = [...form.links]
    updated[idx][field] = val
    setForm((prev) => ({ ...prev, links: updated }))
  }

  const addLink = () => {
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { label: '', url: '' }],
    }))
  }

  const removeLink = (idx) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== idx),
    }))
  }

  // Media Selection Handler
  const handleMediaSelect = (url) => {
    if (mediaTarget === 'cover') {
      setForm((prev) => ({ ...prev, cover: url }))
      showToast('Featured cover image selected', 'success')
    } else if (mediaTarget === 'shot') {
      setForm((prev) => ({
        ...prev,
        shots: [...(prev.shots || []), url],
      }))
      showToast('Gallery screenshot added', 'success')
    }
  }

  const removeShot = (idx) => {
    setForm((prev) => ({
      ...prev,
      shots: prev.shots.filter((_, i) => i !== idx),
    }))
  }

  // Save Project
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) {
      return showToast('Project title is required', 'error')
    }
    if (!form.summary.trim()) {
      return showToast('Project summary is required', 'error')
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        slug: (form.slug.trim() || generateSlug(form.title)),
        body: form.body.filter((p) => p.trim()),
        highlights: form.highlights.filter((h) => h[0]?.trim() || h[1]?.trim()),
        links: form.links.filter((l) => l.url?.trim()),
      }

      let res
      if (isEditMode) {
        res = await authFetch(`/api/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        res = await authFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (res.ok && json.success) {
        showToast(
          isEditMode ? 'Project updated successfully!' : 'Project created successfully!',
          'success',
        )
        navigate('/admin/projects')
      } else {
        throw new Error(json.message || 'Failed to save project')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // Delete Project
  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${form.title}"?`)) return
    try {
      const res = await authFetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Project deleted', 'success')
        navigate('/admin/projects')
      }
    } catch (err) {
      showToast('Failed to delete project', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#e9c393' }}>
        Loading project editor...
      </div>
    )
  }

  return (
    <div>
      {/* Top Header & Breadcrumbs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/admin/projects"
            className="adm-btn adm-btn-secondary adm-btn-sm"
            style={{ padding: '6px 12px' }}
          >
            ← Projects List
          </Link>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '500', margin: 0, color: '#fbf1e6' }}>
              {isEditMode ? `Edit Project: ${form.title}` : 'Create New Project'}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isEditMode && form.slug && (
            <a
              href={`/work/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              className="adm-btn adm-btn-secondary"
            >
              👁 View Public Page ↗
            </a>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            className="adm-btn adm-btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditMode ? '💾 Update Project' : '🚀 Publish Project'}
          </button>
        </div>
      </div>

      {/* Main CMS Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 340px',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* LEFT COLUMN: Main Story & Case Study */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title & Slug Box */}
            <div className="adm-box">
              <div className="adm-form-group">
                <label className="adm-label">Project Title</label>
                <input
                  type="text"
                  className="adm-input"
                  value={form.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. ResumeLab — AI Powered Builder"
                  style={{ fontSize: '18px', fontWeight: '500', padding: '12px 16px' }}
                  required
                />
              </div>

              {/* Permalink bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#070707',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--adm-border)',
                  fontSize: '12.5px',
                }}
              >
                <span style={{ color: 'rgba(251,241,230,0.5)' }}>Permalink:</span>
                <span style={{ color: '#e9c393' }}>/work/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => {
                    setIsCustomSlug(true)
                    setForm({ ...form, slug: e.target.value })
                  }}
                  className="adm-input"
                  style={{
                    padding: '3px 8px',
                    fontSize: '12px',
                    maxWidth: '240px',
                    backgroundColor: 'transparent',
                    border: '1px dashed rgba(233,195,147,0.3)',
                  }}
                  placeholder="project-slug"
                />
              </div>

              {/* Summary */}
              <div className="adm-form-group" style={{ marginTop: '18px' }}>
                <label className="adm-label">Executive Summary / Lede</label>
                <textarea
                  className="adm-textarea"
                  rows={3}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="A concise, high-impact summary shown on the portfolio card and detail page hero..."
                  required
                />
              </div>
            </div>

            {/* Case Study Paragraphs */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Case Study Story & Body Paragraphs</h3>
                <button
                  type="button"
                  onClick={addBodyParagraph}
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                >
                  + Add Paragraph
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {form.body.map((para, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#090909',
                      border: '1px solid var(--adm-border)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#e9c393', fontWeight: '500' }}>
                        Paragraph #{idx + 1}
                      </span>
                      {form.body.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBodyParagraph(idx)}
                          className="adm-btn adm-btn-danger adm-btn-sm"
                          style={{ padding: '2px 8px', fontSize: '11px' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      className="adm-textarea"
                      rows={3}
                      value={para}
                      onChange={(e) => handleBodyChange(idx, e.target.value)}
                      placeholder={`Write paragraph ${idx + 1} detailing the problem, technical implementation, or architectural decision...`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights Builder */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Key Highlights & Architecture Notes</h3>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                >
                  + Add Highlight
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {form.highlights.map((h, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 2fr auto',
                      gap: '10px',
                      alignItems: 'center',
                      backgroundColor: '#090909',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--adm-border)',
                    }}
                  >
                    <div>
                      <label className="adm-label" style={{ fontSize: '10.5px' }}>Term / Feature</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="e.g. Structured drafts"
                        value={h[0] || ''}
                        onChange={(e) => handleHighlightChange(idx, 0, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="adm-label" style={{ fontSize: '10.5px' }}>Details & Impact</label>
                      <input
                        type="text"
                        className="adm-input"
                        placeholder="e.g. Documents are state, not text, so sections reorder without rewrite."
                        value={h[1] || ''}
                        onChange={(e) => handleHighlightChange(idx, 1, e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="adm-btn adm-btn-danger adm-btn-sm"
                      style={{ marginTop: '18px' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* External Links & Demos */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Project External Links</h3>
                <button
                  type="button"
                  onClick={addLink}
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                >
                  + Add Link
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {form.links.map((link, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 1fr auto',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="Label (Live Demo, GitHub...)"
                      value={link.label}
                      onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                    />
                    <input
                      type="url"
                      className="adm-input"
                      placeholder="https://..."
                      value={link.url}
                      onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(idx)}
                      className="adm-btn adm-btn-danger adm-btn-sm"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Screenshots Gallery */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Gallery Screenshots</h3>
                <button
                  type="button"
                  onClick={() => {
                    setMediaTarget('shot')
                    setMediaModalOpen(true)
                  }}
                  className="adm-btn adm-btn-secondary adm-btn-sm"
                  style={{ color: '#e9c393' }}
                >
                  🖼 Add from Media Library
                </button>
              </div>

              {form.shots?.length === 0 ? (
                <p style={{ color: 'rgba(251,241,230,0.4)', fontSize: '13px', margin: '4px 0' }}>
                  No extra gallery screenshots attached yet.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                  {form.shots?.map((shot, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        aspectRatio: '16/10',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid var(--adm-border)',
                      }}
                    >
                      <img src={shot} alt={`shot ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => removeShot(idx)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0,0,0,0.7)',
                          color: '#ff5e5e',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Publishing & Metadata Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Publishing Box */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Publishing</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : isEditMode ? '💾 Update Project' : '🚀 Publish Project'}
                </button>

                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="adm-btn adm-btn-danger"
                    style={{ width: '100%' }}
                  >
                    🗑 Delete Project
                  </button>
                )}
              </div>
            </div>

            {/* Featured Cover Image */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Featured Cover</h3>
              </div>

              {form.cover ? (
                <div>
                  <div
                    style={{
                      width: '100%',
                      height: '180px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(233,195,147,0.3)',
                      marginBottom: '12px',
                    }}
                  >
                    <img
                      src={form.cover}
                      alt="Project Cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaTarget('cover')
                        setMediaModalOpen(true)
                      }}
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      style={{ flex: 1 }}
                    >
                      Replace Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, cover: '' })}
                      className="adm-btn adm-btn-danger adm-btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: '1.5px dashed rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    padding: '28px 16px',
                    textAlign: 'center',
                    backgroundColor: '#090909',
                  }}
                >
                  <p style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)', margin: '0 0 14px' }}>
                    No cover image set for this project.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaTarget('cover')
                      setMediaModalOpen(true)
                    }}
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    style={{ color: '#e9c393', borderColor: 'rgba(233,195,147,0.4)' }}
                  >
                    🖼 Choose from Media Library
                  </button>
                </div>
              )}
            </div>

            {/* Classification & Year */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Classification</h3>
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Category / Meta</label>
                <input
                  type="text"
                  className="adm-input"
                  value={form.meta}
                  onChange={(e) => setForm({ ...form, meta: e.target.value })}
                  placeholder="e.g. MERN · AI"
                  required
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Year</label>
                <input
                  type="text"
                  className="adm-input"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="e.g. 2025"
                  required
                />
              </div>
            </div>

            {/* Tech Stack */}
            <div className="adm-box">
              <div className="adm-box-header">
                <h3>Tech Stack</h3>
              </div>

              <div className="adm-chips" style={{ marginBottom: '12px' }}>
                {form.stack.map((tag) => (
                  <span key={tag} className="adm-chip">
                    {tag}
                    <span className="adm-chip-remove" onClick={() => removeTag(tag)}>
                      ✕
                    </span>
                  </span>
                ))}
                <input
                  type="text"
                  className="adm-chip-input"
                  placeholder="Type tag & hit enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>

              <label className="adm-label" style={{ fontSize: '10.5px', display: 'block', marginBottom: '8px' }}>
                Quick Presets:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {STACK_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => addPresetTag(p)}
                    className="adm-btn adm-btn-secondary adm-btn-sm"
                    style={{
                      padding: '2px 8px',
                      fontSize: '11px',
                      opacity: form.stack.includes(p) ? 0.4 : 1,
                    }}
                    disabled={form.stack.includes(p)}
                  >
                    +{p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* WordPress-Style Media Library Modal */}
      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        title={mediaTarget === 'cover' ? 'Set Featured Project Cover' : 'Add Gallery Screenshot'}
        actionLabel={mediaTarget === 'cover' ? 'Set as Cover' : 'Insert into Gallery'}
      />
    </div>
  )
}

