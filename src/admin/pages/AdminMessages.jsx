import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/Toast.jsx'

export default function AdminMessages() {
  const { authFetch } = useAuth()
  const showToast = useToast()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [selectedMsg, setSelectedMsg] = useState(null)

  const loadMessages = async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/messages')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data)
        }
      }
    } catch (err) {
      showToast('Failed to load messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  const toggleRead = async (msg) => {
    const newStatus = !msg.read
    try {
      const res = await authFetch(`/api/messages/${msg.id}/read`, {
        method: 'PATCH',
        body: JSON.stringify({ read: newStatus }),
      })
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, read: newStatus } : m)),
        )
        if (selectedMsg?.id === msg.id) {
          setSelectedMsg({ ...selectedMsg, read: newStatus })
        }
        showToast(newStatus ? 'Marked as read' : 'Marked as unread', 'info')
      }
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    try {
      const res = await authFetch(`/api/messages/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id))
        if (selectedMsg?.id === id) setSelectedMsg(null)
        showToast('Message deleted', 'success')
      }
    } catch {
      showToast('Failed to delete message', 'error')
    }
  }

  const openMessage = (msg) => {
    setSelectedMsg(msg)
    if (!msg.read) {
      toggleRead(msg)
    }
  }

  const filtered =
    filter === 'unread' ? messages.filter((m) => !m.read) : messages

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '500', margin: '0 0 6px', color: '#fbf1e6' }}>
            Contact Inquiries & Messages
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)', margin: 0 }}>
            Read and respond to messages submitted by visitors, recruiters, and clients.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('all')}
            className={`adm-btn ${filter === 'all' ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`adm-btn ${filter === 'unread' ? 'adm-btn-primary' : 'adm-btn-secondary'}`}
          >
            Unread ({messages.filter((m) => !m.read).length})
          </button>
        </div>
      </div>

      <div className="adm-box">
        {loading ? (
          <div style={{ color: '#e9c393' }}>Loading messages...</div>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'rgba(251,241,230,0.5)' }}>
            {filter === 'unread' ? 'No unread messages.' : 'Your inbox is empty.'}
          </p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: '30px' }}></th>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{
                      backgroundColor: msg.read ? 'transparent' : 'rgba(233, 195, 147, 0.04)',
                    }}
                  >
                    <td>
                      {!msg.read && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#e9c393',
                          }}
                          title="Unread message"
                        />
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: msg.read ? '400' : '600', color: '#fbf1e6' }}>
                        {msg.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(251,241,230,0.5)' }}>
                        {msg.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: msg.read ? '400' : '500', color: '#fbf1e6' }}>
                        {msg.subject || 'No Subject'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'rgba(251,241,230,0.5)',
                          maxWidth: '360px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {msg.message}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'rgba(251,241,230,0.5)', whiteSpace: 'nowrap' }}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div className="adm-actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openMessage(msg)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                        >
                          Read
                        </button>
                        <button
                          onClick={() => toggleRead(msg)}
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          title={msg.read ? 'Mark unread' : 'Mark read'}
                        >
                          {msg.read ? 'Mark Unread' : 'Mark Read'}
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="adm-btn adm-btn-danger adm-btn-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message View Modal */}
      {selectedMsg && (
        <div className="adm-modal-overlay" onClick={() => setSelectedMsg(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="adm-modal-header">
              <h3>{selectedMsg.subject || 'Contact Inquiry'}</h3>
              <button className="adm-modal-close" onClick={() => setSelectedMsg(null)}>
                ✕
              </button>
            </div>

            <div className="adm-modal-body">
              <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--adm-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#fbf1e6' }}>
                    From: {selectedMsg.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#e9c393' }}>
                    {new Date(selectedMsg.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(251,241,230,0.6)' }}>
                  Email: <a href={`mailto:${selectedMsg.email}`} style={{ color: '#e9c393' }}>{selectedMsg.email}</a>
                </div>
              </div>

              <div>
                <label className="adm-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Message Content
                </label>
                <div
                  style={{
                    backgroundColor: 'rgba(20, 4, 3, 0.7)',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid var(--adm-border)',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    color: '#fbf1e6',
                  }}
                >
                  {selectedMsg.message}
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <a
                href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject || 'Your inquiry')}`}
                className="adm-btn adm-btn-primary"
              >
                ✉️ Reply via Email
              </a>
              <button
                type="button"
                onClick={() => setSelectedMsg(null)}
                className="adm-btn adm-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

