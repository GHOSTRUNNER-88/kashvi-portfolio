import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminMedia() {
  const { authFetch } = useAuth()
  const showToast = useToast()

  const [mediaList, setMediaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [cloudinaryConfig, setCloudinaryConfig] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef(null)

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
    loadCloudinaryConfig()
    fetchMedia()
  }, [authFetch, fetchMedia])

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
      } else {
        throw new Error(json.message || 'Upload failed')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const openCloudinaryWidget = () => {
    if (!window.cloudinary) {
      return showToast('Cloudinary script loading...', 'info')
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
                showToast('Cloudinary image saved to Media Library!', 'success')
                await fetchMedia()
                setSelectedItem(saveJson.data)
              }
            } catch (err) {
              console.error('Failed to register Cloudinary upload:', err)
            }
          }
        },
      )
      widget.open()
    } catch (wErr) {
      showToast('Error opening widget: ' + wErr.message, 'error')
    }
  }

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Permanently delete "${item.filename || 'this image'}"?`)) return
    try {
      const res = await authFetch(`/api/media/${item.id || item.public_id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Image deleted', 'success')
        setMediaList((prev) => prev.filter((m) => m.id !== item.id))
        setSelectedItem(null)
      }
    } catch {
      showToast('Failed to delete media', 'error')
    }
  }

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url)
    showToast('Image URL copied to clipboard', 'info')
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Media Library
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            WordPress-style asset manager for portfolio project covers, screenshots, and artwork.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="adm-btn adm-btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : '➕ Upload New Media'}
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
            style={{ color: '#e9c393', borderColor: 'rgba(233, 195, 147, 0.3)' }}
          >
            ☁️ Cloudinary Widget
          </button>
        </div>
      </div>

      {/* Drag & Drop Quick Zone */}
      <div
        style={{
          border: `1.5px dashed ${isDragOver ? '#e9c393' : 'rgba(255, 255, 255, 0.12)'}`,
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: isDragOver ? 'rgba(233, 195, 147, 0.04)' : '#070707',
          marginBottom: '24px',
          transition: 'all 0.2s ease',
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
        <span style={{ fontSize: '13px', color: 'rgba(251,241,230,0.7)' }}>
          Drag and drop images here to upload instantly to your library (Max 10 MB).
        </span>
      </div>

      {/* Main Grid + Sidebar Container */}
      <div
        className="adm-box"
        style={{
          padding: 0,
          display: 'flex',
          minHeight: '520px',
          overflow: 'hidden',
        }}
      >
        {/* Left: Gallery Grid */}
        <div
          style={{
            flex: 1,
            padding: '20px 24px',
            borderRight: '1px solid var(--adm-border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
            }}
          >
            <input
              type="text"
              className="adm-input"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '280px', padding: '7px 12px', fontSize: '12.5px' }}
            />
            <span style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)' }}>
              Showing {filteredList.length} of {mediaList.length} items
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#e9c393' }}>
              Loading media library...
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
              No images found. Drag & drop files above to populate your library!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '14px',
                overflowY: 'auto',
                paddingBottom: '20px',
              }}
            >
              {filteredList.map((item) => {
                const isSelected = selectedItem?.id === item.id || selectedItem?.url === item.url
                return (
                  <div
                    key={item.id || item.url}
                    onClick={() => setSelectedItem(item)}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      cursor: 'pointer',
                      backgroundColor: '#111',
                      border: `2px solid ${isSelected ? '#e9c393' : 'rgba(255, 255, 255, 0.08)'}`,
                      boxShadow: isSelected ? '0 0 16px rgba(233, 195, 147, 0.3)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.filename || 'media asset'}
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
                          top: '6px',
                          right: '6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#e9c393',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
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

        {/* Right: Attachment Details */}
        <div
          style={{
            width: '320px',
            backgroundColor: '#070707',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#e9c393' }}>
            Attachment Details
          </h3>

          {selectedItem ? (
            <>
              <div
                style={{
                  width: '100%',
                  height: '190px',
                  backgroundColor: '#111',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--adm-border)',
                }}
              >
                <img
                  src={selectedItem.url}
                  alt="Selected preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>

              <div style={{ fontSize: '12.5px', color: 'rgba(251,241,230,0.7)', display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <div style={{ fontWeight: '500', color: '#fbf1e6', wordBreak: 'break-all' }}>
                  {selectedItem.filename || 'Image File'}
                </div>
                <div>Uploaded: {new Date(selectedItem.createdAt || Date.now()).toLocaleDateString()}</div>
                {selectedItem.size && <div>Size: {(selectedItem.size / 1024).toFixed(1)} KB</div>}
                {selectedItem.width && selectedItem.height && (
                  <div>Dimensions: {selectedItem.width} × {selectedItem.height}</div>
                )}
                <div>
                  Provider: <span style={{ color: '#e9c393', textTransform: 'capitalize' }}>{selectedItem.provider || 'Local'}</span>
                </div>
              </div>

              <div>
                <label className="adm-label" style={{ fontSize: '11px' }}>Direct Image URL</label>
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

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--adm-border)' }}>
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
            <div style={{ fontSize: '13px', color: 'rgba(251,241,230,0.4)', marginTop: '20px' }}>
              Select an image from the gallery to view file metadata and URL.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

