import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from './Toast.jsx'

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select or Upload Media',
  actionLabel = 'Select Image',
}) {
  const { authFetch } = useAuth()
  const showToast = useToast()

  const [activeTab, setActiveTab] = useState('library') // 'library' | 'upload'
  const [mediaList, setMediaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef(null)

  // Fetch Media List
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/media')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setMediaList(json.data)
          if (json.data.length > 0 && !selectedItem) {
            setSelectedItem(json.data[0])
          }
        }
      }
    } catch {
      showToast('Failed to load media assets', 'error')
    } finally {
      setLoading(false)
    }
  }, [authFetch, showToast, selectedItem])

  // Fetch Cloudinary Config
  useEffect(() => {
    async function loadCloudinaryConfig() {
      try {
        const res = await authFetch('/api/cloudinary/config')
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            setCloudinaryConfig(json.data)
          }
        }
      } catch {
        // silent
      }
    }
    if (isOpen) {
      loadCloudinaryConfig()
      fetchMedia()
    }
  }, [isOpen, authFetch, fetchMedia])

  // Handle direct file upload
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return
    const file = files[0]

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showToast('Image uploaded successfully!', 'success')
        await fetchMedia()
        if (json.data) {
          setSelectedItem(json.data)
        }
        setActiveTab('library')
      } else {
        throw new Error(json.message || 'Upload failed')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  // Open Official Cloudinary Widget
  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      return showToast('Cloudinary widget script is still loading. Please try again.', 'error')
    }

    if (!cloudinaryConfig?.isConfigured) {
      return showToast(
        'Cloudinary credentials not set in .env. Using built-in local uploader.',
        'info',
      )
    }

    try {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: cloudinaryConfig.cloudName,
          apiKey: cloudinaryConfig.apiKey,
          uploadSignature: async (callback, paramsToSign) => {
            try {
              const res = await authFetch('/api/cloudinary/sign', {
                method: 'POST',
                body: JSON.stringify({ paramsToSign }),
              })
              const json = await res.json()
              if (json.success && json.signature) {
                callback(json.signature)
              }
            } catch (err) {
              console.error('Signing error:', err)
            }
          },
          folder: 'kashvi_portfolio',
          theme: 'purple',
          styles: {
            palette: {
              window: '#0a0a0a',
              windowBorder: '#e9c393',
              tabIcon: '#e9c393',
              menuIcons: '#e9c393',
              textDark: '#000000',
              textLight: '#fbf1e6',
              link: '#e9c393',
              action: '#e9c393',
              inactiveTabIcon: '#777777',
              error: '#ff5e5e',
              inProgress: '#e9c393',
              complete: '#3ee0a1',
              sourceBg: '#121212',
            },
          },
        },
        async (error, result) => {
          if (!error && result && result.event === 'success') {
            const asset = result.info
            try {
              // Register uploaded asset into DB
              const saveRes = await authFetch('/api/media', {
                method: 'POST',
                body: JSON.stringify({
                  url: asset.secure_url,
                  public_id: asset.public_id,
                  filename: asset.original_filename || 'Cloudinary Image',
                  format: asset.format,
                  size: asset.bytes,
                  width: asset.width,
                  height: asset.height,
                  provider: 'cloudinary',
                }),
              })
              const saveJson = await saveRes.json()
              if (saveJson.success) {
                showToast('Cloudinary image saved!', 'success')
                await fetchMedia()
                setSelectedItem(saveJson.data)
                setActiveTab('library')
              }
            } catch (err) {
              console.error('Failed to register Cloudinary upload:', err)
            }
          }
        },
      )
      widget.open()
    } catch (wErr) {
      showToast('Error opening Cloudinary widget: ' + wErr.message, 'error')
    }
  }

  // Delete media item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Permanently delete "${item.filename || 'this image'}"?`)) return
    try {
      const res = await authFetch(`/api/media/${item.id || item.public_id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Image deleted from library', 'success')
        setMediaList((prev) => prev.filter((m) => m.id !== item.id))
        setSelectedItem(null)
      }
    } catch {
      showToast('Failed to delete media item', 'error')
    }
  }

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    showToast('Image URL copied to clipboard', 'info')
  }

  const handleConfirmSelect = () => {
    if (!selectedItem) return
    onSelect(selectedItem.url, selectedItem)
    onClose()
  }

  const filteredList = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      m.filename?.toLowerCase().includes(q) ||
      m.url?.toLowerCase().includes(q) ||
      m.provider?.toLowerCase().includes(q)
    )
  })

  if (!isOpen) return null

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div
        className="adm-modal wp-media-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          width: '95vw',
          height: '86vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#070707',
          border: '1px solid rgba(233, 195, 147, 0.35)',
        }}
      >
        {/* WordPress-Style Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--adm-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0c0c0c',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '500', color: '#fbf1e6' }}>
              {title}
            </h3>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`adm-btn adm-btn-sm ${
                  activeTab === 'upload' ? 'adm-btn-primary' : 'adm-btn-secondary'
                }`}
              >
                Upload Files
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`adm-btn adm-btn-sm ${
                  activeTab === 'library' ? 'adm-btn-primary' : 'adm-btn-secondary'
                }`}
              >
                Media Library ({mediaList.length})
              </button>
            </div>
          </div>

          <button className="adm-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* TAB 1: UPLOAD FILES */}
          {activeTab === 'upload' && (
            <div
              style={{
                flex: 1,
                padding: '40px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#050505',
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragOver(true)
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragOver(false)
                handleUploadFiles(e.dataTransfer.files)
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: '540px',
                  border: `2px dashed ${isDragOver ? '#e9c393' : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  backgroundColor: isDragOver ? 'rgba(233, 195, 147, 0.05)' : '#0a0a0a',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '42px', marginBottom: '12px' }}>📁</div>
                <h4 style={{ fontSize: '16px', fontWeight: '500', color: '#fbf1e6', margin: '0 0 6px' }}>
                  Drop files anywhere to upload
                </h4>
                <p style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)', margin: '0 0 24px' }}>
                  Maximum upload file size: 10 MB. Supports JPG, PNG, WEBP, SVG, GIF.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="adm-btn adm-btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Select Local Files'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={openCloudinaryWidget}
                    className="adm-btn adm-btn-secondary"
                    style={{
                      borderColor: 'rgba(233, 195, 147, 0.3)',
                      color: '#e9c393',
                    }}
                  >
                    ☁️ Cloudinary Upload Widget
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDIA LIBRARY */}
          {activeTab === 'library' && (
            <div style={{ flex: 1, display: 'flex', minHeight: 0, width: '100%' }}>
              {/* Left Column: Grid & Filter */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px 20px',
                  borderRight: '1px solid var(--adm-border)',
                  overflowY: 'auto',
                }}
              >
                {/* Search & Actions Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    gap: '12px',
                  }}
                >
                  <input
                    type="text"
                    className="adm-input"
                    placeholder="Search media files by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ maxWidth: '300px', padding: '7px 12px', fontSize: '12.5px' }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={fetchMedia}
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      title="Refresh library"
                    >
                      ↻ Refresh
                    </button>
                    <button
                      type="button"
                      onClick={openCloudinaryWidget}
                      className="adm-btn adm-btn-secondary adm-btn-sm"
                      style={{ color: '#e9c393', borderColor: 'rgba(233, 195, 147, 0.3)' }}
                    >
                      ☁️ Cloudinary Widget
                    </button>
                  </div>
                </div>

                {/* Images Grid */}
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#e9c393' }}>
                    Loading library assets...
                  </div>
                ) : filteredList.length === 0 ? (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(251,241,230,0.4)',
                      fontSize: '13px',
                    }}
                  >
                    No media items found. Click &quot;Upload Files&quot; to add your first photos!
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '12px',
                      overflowY: 'auto',
                      paddingBottom: '20px',
                    }}
                  >
                    {filteredList.map((item) => {
                      const isSelected = selectedItem?.url === item.url
                      return (
                        <div
                          key={item.id || item.url}
                          onClick={() => setSelectedItem(item)}
                          style={{
                            aspectRatio: '1/1',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            backgroundColor: '#121212',
                            border: `2px solid ${isSelected ? '#e9c393' : 'rgba(255, 255, 255, 0.08)'}`,
                            boxShadow: isSelected ? '0 0 12px rgba(233, 195, 147, 0.3)' : 'none',
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <img
                            src={item.url}
                            alt={item.filename || 'media item'}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: '#e9c393',
                                color: '#000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                              }}
                            >
                              ✓
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: WordPress Attachment Details Panel */}
              <div
                style={{
                  width: '280px',
                  backgroundColor: '#090909',
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  overflowY: 'auto',
                }}
              >
                <h4 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e9c393' }}>
                  Attachment Details
                </h4>

                {selectedItem ? (
                  <>
                    <div
                      style={{
                        width: '100%',
                        height: '160px',
                        backgroundColor: '#141414',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--adm-border)',
                      }}
                    >
                      <img
                        src={selectedItem.url}
                        alt="Selected Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '12px', color: 'rgba(251,241,230,0.7)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontWeight: '500', color: '#fbf1e6', wordBreak: 'break-all' }}>
                        {selectedItem.filename || 'Image Asset'}
                      </div>
                      <div>Uploaded: {new Date(selectedItem.createdAt || Date.now()).toLocaleDateString()}</div>
                      {selectedItem.size && <div>Size: {(selectedItem.size / 1024).toFixed(1)} KB</div>}
                      {selectedItem.width && selectedItem.height && (
                        <div>Dimensions: {selectedItem.width} × {selectedItem.height}</div>
                      )}
                      <div>
                        Storage: <span style={{ color: '#e9c393', textTransform: 'capitalize' }}>{selectedItem.provider || 'Local'}</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <label className="adm-label" style={{ fontSize: '10.5px' }}>File URL</label>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <input
                          type="text"
                          readOnly
                          value={selectedItem.url}
                          className="adm-input"
                          style={{ fontSize: '11px', padding: '6px 8px' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(selectedItem.url)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--adm-border)' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(selectedItem)}
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        style={{ width: '100%' }}
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '12.5px', color: 'rgba(251,241,230,0.4)', marginTop: '20px' }}>
                    Select an image from the library on the left to view its details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* WordPress Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--adm-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0a',
          }}
        >
          <div style={{ fontSize: '12px', color: 'rgba(251,241,230,0.6)' }}>
            {selectedItem ? (
              <span>Selected: <strong style={{ color: '#e9c393' }}>{selectedItem.filename}</strong></span>
            ) : (
              'No image selected'
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="adm-btn adm-btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedItem}
              className="adm-btn adm-btn-primary"
            >
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

