import { useRef, useState } from 'react'
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import Modal from './Modal'

export default function Settings({ onClose }) {
  const { exportData, importData, state } = useApp()
  const fileRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result)
        if (json.transactions !== undefined && json.debts !== undefined) {
          importData(json)
          onClose()
        } else {
          alert('Invalid backup file.')
        }
      } catch {
        alert('Could not parse file.')
      }
    }
    reader.readAsText(file)
  }

  function handleReset() {
    if (confirmReset) {
      localStorage.clear()
      window.location.reload()
    } else {
      setConfirmReset(true)
    }
  }

  const txnCount = state.transactions.length
  const debtCount = state.debts.length
  const fixedCount = state.fixedExpenses.length

  return (
    <Modal title="Settings" onClose={onClose}>
      <div>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
          Data Backup
        </p>
        <div className="card">
          <div className="settings-row">
            <div>
              <p className="settings-label">Export JSON</p>
              <p className="settings-sub">{txnCount} transactions · {debtCount} debts · {fixedCount} fixed</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={exportData}>
              <Download size={14} /> Export
            </button>
          </div>
          <div className="settings-row">
            <div>
              <p className="settings-label">Import JSON</p>
              <p className="settings-sub">Overwrites all current data</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Import
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.05em', margin: '20px 0 8px' }}>
          Danger Zone
        </p>
        <div className="card">
          <div className="settings-row">
            <div>
              <p className="settings-label" style={{ color: 'var(--rose-dark)' }}>Reset All Data</p>
              <p className="settings-sub">Permanently deletes everything</p>
            </div>
            <button
              className={`btn btn-sm ${confirmReset ? 'btn-danger' : 'btn-ghost'}`}
              onClick={handleReset}
              style={confirmReset ? {} : { color: 'var(--rose)' }}
            >
              {confirmReset ? <><AlertTriangle size={14} /> Confirm</> : <><Trash2 size={14} /> Reset</>}
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 24 }}>
          All data is stored locally in your browser.<br />No accounts, no cloud, no tracking.
        </p>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  )
}
