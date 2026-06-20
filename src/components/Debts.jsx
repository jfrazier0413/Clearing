import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, todayStr } from '../utils/helpers'
import Modal from './Modal'

function DebtModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: '',
    ...initial,
    originalBalance: initial?.originalBalance != null ? String(initial.originalBalance) : '',
    currentBalance: initial?.currentBalance != null ? String(initial.currentBalance) : '',
    minimumPayment: initial?.minimumPayment != null ? String(initial.minimumPayment) : '',
  }))
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      ...form,
      originalBalance: Number(form.originalBalance),
      currentBalance: initial ? Number(form.currentBalance) : Number(form.originalBalance),
      minimumPayment: Number(form.minimumPayment),
    })
  }
  return (
    <Modal title={initial ? 'Edit Debt' : 'Add Debt'} onClose={onClose} formId="debt-form" saveLabel={initial ? 'Save' : 'Add'}>
      <form id="debt-form" onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label className="form-label">Debt Name</label>
          <input className="form-input" type="text" placeholder="e.g. Student Loan" value={form.name} required onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Original Balance ($)</label>
            <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.originalBalance} required onChange={e => set('originalBalance', e.target.value)} style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
          </div>
          {initial && (
            <div className="form-group">
              <label className="form-label">Current Balance ($)</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.currentBalance} required onChange={e => set('currentBalance', e.target.value)} style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
            </div>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Min. Monthly Payment ($)</label>
          <input className="form-input" type="number" min="0" step="0.01" placeholder="0.00" value={form.minimumPayment} onChange={e => set('minimumPayment', e.target.value)} style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
        </div>
      </form>
    </Modal>
  )
}

function PaymentModal({ debt, onSave, onClose }) {
  const [form, setForm] = useState({ amount: String(debt.minimumPayment || ''), date: todayStr() })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) return
    onSave(Number(form.amount), form.date)
  }
  return (
    <Modal title={`Log Payment — ${debt.name}`} onClose={onClose} formId="payment-form" saveLabel="Log">
      <form id="payment-form" onSubmit={handleSubmit} className="form-grid">
        <div style={{ background: 'var(--cream-dark)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Current Balance</p>
          <p className="amount amount-expense" style={{ fontSize: '1.4rem' }}>{formatCurrency(debt.currentBalance)}</p>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Amount ($)</label>
            <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} required onChange={e => set('amount', e.target.value)} style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} required onChange={e => set('date', e.target.value)} />
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
          This will create a "Debt Payments" expense transaction and reduce the balance.
        </p>
      </form>
    </Modal>
  )
}

export default function Debts() {
  const { state, addDebt, updateDebt, deleteDebt, logDebtPayment } = useApp()
  const [debtModal, setDebtModal] = useState(null)
  const [payModal, setPayModal] = useState(null)

  const totalOriginal = state.debts.reduce((s, d) => s + Number(d.originalBalance), 0)
  const totalCurrent = state.debts.reduce((s, d) => s + Number(d.currentBalance), 0)

  function handleSaveDebt(data) {
    if (debtModal.mode === 'add') addDebt(data)
    else updateDebt(debtModal.debt.id, data)
    setDebtModal(null)
  }

  function handleDelete(id) {
    if (confirm('Delete this debt? This cannot be undone.')) deleteDebt(id)
  }

  function handlePayment(amount, date) {
    logDebtPayment(payModal.debt.id, amount, date)
    setPayModal(null)
  }

  return (
    <div>
      {/* Summary */}
      {state.debts.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: 4 }}>TOTAL REMAINING</p>
              <p className="amount amount-expense" style={{ fontSize: '1.6rem' }}>{formatCurrency(totalCurrent)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: 4 }}>PAID OFF</p>
              <p className="amount amount-income" style={{ fontSize: '1.2rem' }}>{formatCurrency(totalOriginal - totalCurrent)}</p>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div className="progress-bar">
              <div
                className="progress-fill progress-ok"
                style={{ width: `${totalOriginal > 0 ? Math.min(100, ((totalOriginal - totalCurrent) / totalOriginal) * 100) : 0}%` }}
              />
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 6 }}>
              of {formatCurrency(totalOriginal)} original
            </p>
          </div>
        </div>
      )}

      {/* Debt list */}
      {state.debts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CreditCard size={36} />
            <p style={{ fontWeight: 500 }}>No debts tracked</p>
            <p>Add debts to track your payoff progress.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setDebtModal({ mode: 'add' })}>
              <Plus size={14} /> Add Debt
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 80 }}>
          {state.debts.map(debt => {
            const paid = Number(debt.originalBalance) - Number(debt.currentBalance)
            const pct = debt.originalBalance > 0 ? (paid / debt.originalBalance) * 100 : 0
            return (
              <div key={debt.id} className="card debt-card">
                <div className="debt-card-header">
                  <div>
                    <p className="debt-name">{debt.name}</p>
                    {debt.minimumPayment > 0 && (
                      <p className="debt-min">Min. {formatCurrency(debt.minimumPayment)}/mo</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-ghost icon-btn btn-icon" onClick={() => setDebtModal({ mode: 'edit', debt })}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn-ghost icon-btn btn-icon" onClick={() => handleDelete(debt.id)} style={{ color: 'var(--rose)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span className="amount amount-expense" style={{ fontSize: '1.3rem' }}>{formatCurrency(debt.currentBalance)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                    {Math.round(pct)}% paid off
                  </span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 12 }}>
                  <div className="progress-fill progress-ok" style={{ width: `${pct}%` }} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setPayModal({ debt })}
                >
                  <DollarSign size={14} /> Log Payment
                </button>
              </div>
            )
          })}
        </div>
      )}

      <button className="fab" onClick={() => setDebtModal({ mode: 'add' })} aria-label="Add debt">
        <Plus size={22} />
      </button>

      {debtModal && <DebtModal initial={debtModal.debt} onSave={handleSaveDebt} onClose={() => setDebtModal(null)} />}
      {payModal && <PaymentModal debt={payModal.debt} onSave={handlePayment} onClose={() => setPayModal(null)} />}
    </div>
  )
}
