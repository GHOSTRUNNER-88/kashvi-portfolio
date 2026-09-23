import { useState } from 'react'
import { usePortfolioData } from '../context/DataContext.jsx'

export default function ContactModal({ isOpen, onClose }) {
  const { submitContact } = usePortfolioData()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState({ state: 'idle', message: '' }) // idle | loading | success | error

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ state: 'loading', message: '' })
    try {
      await submitContact(formData)
      setStatus({
        state: 'success',
        message: 'Your message has been sent successfully. Thank you for reaching out!',
      })
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => {
        onClose()
        setStatus({ state: 'idle', message: '' })
      }, 2500)
    } catch (err) {
      setStatus({
        state: 'error',
        message: err.message || 'Failed to send message. Please try again or email directly.',
      })
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(10, 2, 2, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#200705',
          border: '1px solid rgba(233, 195, 147, 0.3)',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          color: '#fbf1e6',
          fontFamily: "'Poppins', system-ui, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'rgba(251, 241, 230, 0.5)',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        <div style={{ marginBottom: '20px' }}>
          <p
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#e9c393',
              margin: '0 0 6px',
            }}
          >
            Direct Contact
          </p>
          <h2 style={{ fontSize: '22px', fontWeight: '400', margin: 0 }}>
            Send a message
          </h2>
        </div>

        {status.state === 'success' ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              backgroundColor: 'rgba(78, 203, 165, 0.1)',
              border: '1px solid #4ecba5',
              borderRadius: '8px',
              color: '#4ecba5',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✓</div>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5 }}>
              {status.message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {status.state === 'error' && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(224, 93, 93, 0.15)',
                  border: '1px solid #e05d5d',
                  borderRadius: '6px',
                  color: '#e05d5d',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {status.message}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(251,241,230,0.6)', marginBottom: '4px' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 3, 2, 0.8)',
                    border: '1px solid rgba(251, 241, 230, 0.12)',
                    color: '#fbf1e6',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(251,241,230,0.6)', marginBottom: '4px' }}>
                  Your Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(15, 3, 2, 0.8)',
                    border: '1px solid rgba(251, 241, 230, 0.12)',
                    color: '#fbf1e6',
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(251,241,230,0.6)', marginBottom: '4px' }}>
                Subject
              </label>
              <input
                type="text"
                placeholder="Project discussion, internship, inquiry..."
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 3, 2, 0.8)',
                  border: '1px solid rgba(251, 241, 230, 0.12)',
                  color: '#fbf1e6',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(251,241,230,0.6)', marginBottom: '4px' }}>
                Message
              </label>
              <textarea
                required
                rows={4}
                placeholder="Tell me about your project or opportunity..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(15, 3, 2, 0.8)',
                  border: '1px solid rgba(251, 241, 230, 0.12)',
                  color: '#fbf1e6',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: '1px solid rgba(251, 241, 230, 0.15)',
                  backgroundColor: 'transparent',
                  color: 'rgba(251, 241, 230, 0.7)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status.state === 'loading'}
                style={{
                  padding: '9px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#e9c393',
                  color: '#140403',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: status.state === 'loading' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background-color 0.2s',
                }}
              >
                {status.state === 'loading' ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

