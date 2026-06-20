import { useEffect } from 'react'

export default function Modal({ title, onClose, formId, saveLabel = 'Save', children }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-handle" />
        {/* iOS-style header — always above keyboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ fontSize: '0.95rem', color: 'var(--text-medium)', fontWeight: 500, minWidth: 60 }}
          >
            Cancel
          </button>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-dark)', textAlign: 'center' }}>
            {title}
          </p>
          {formId
            ? <button type="submit" form={formId} style={{ fontSize: '0.95rem', color: 'var(--terracotta)', fontWeight: 700, minWidth: 60, textAlign: 'right' }}>{saveLabel}</button>
            : <div style={{ minWidth: 60 }} />
          }
        </div>
        {children}
      </div>
    </div>
  )
}
