import { useState } from 'react'
import { Plus, TrendingUp, TrendingDown, RefreshCw, Pencil, Trash2, ChevronLeft, ChevronRight, ListOrdered } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  formatCurrency, formatDate, formatMonthLabel,
  getCurrentYearMonth, prevMonth, nextMonth, todayStr, INCOME_CATEGORIES,
} from '../utils/helpers'
import Modal from './Modal'

function TransactionModal({ initial, onSave, onClose, categories, incomeCategories }) {
  const today = todayStr()
  const [form, setForm] = useState(() => ({
    type: 'expense',
    category: categories[0] ?? 'Other',
    date: today,
    description: '',
    ...initial,
    amount: initial?.amount != null ? String(initial.amount) : '',
  }))

  const cats = form.type === 'income' ? incomeCategories : categories

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) return
    if (!form.date) return
    onSave({ ...form, amount: Number(form.amount) })
  }

  return (
    <Modal title={initial ? 'Edit Transaction' : 'Add Transaction'} onClose={onClose} formId="txn-form" saveLabel={initial ? 'Save' : 'Add'}>
      <form id="txn-form" onSubmit={handleSubmit} className="form-grid">
        <div style={{ display: 'flex', gap: 8 }}>
          {['income', 'expense'].map(t => (
            <button
              type="button" key={t}
              className={`btn ${form.type === t ? (t === 'income' ? 'btn-secondary' : 'btn-danger') : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
              onClick={() => {
                set('type', t)
                set('category', t === 'income' ? incomeCategories[0] : categories[0] ?? 'Other')
              }}
            >
              {t === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {t}
            </button>
          ))}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input
              className="form-input" type="number" step="0.01" min="0.01"
              placeholder="0.00" value={form.amount} required
              onChange={e => set('amount', e.target.value)}
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={form.date} required onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input className="form-input" type="text" placeholder="What was this for?" value={form.description} required onChange={e => set('description', e.target.value)} />
        </div>

      </form>
    </Modal>
  )
}

export default function Activity() {
  const { year: cy, month: cm } = getCurrentYearMonth()
  const [year, setYear] = useState(cy)
  const [month, setMonth] = useState(cm)
  const [modal, setModal] = useState(null) // null | { mode:'add' } | { mode:'edit', txn }
  const { getMonthData, addTransaction, updateTransaction, deleteTransaction, getAllCategories, state } = useApp()

  const { transactions, income, expenses, net } = getMonthData(year, month)
  const expCats = getAllCategories()
  const incCats = INCOME_CATEGORIES

  function handlePrev() { const p = prevMonth(year, month); setYear(p.year); setMonth(p.month) }
  function handleNext() { const n = nextMonth(year, month); setYear(n.year); setMonth(n.month) }

  function handleSave(data) {
    if (modal.mode === 'add') addTransaction(data)
    else updateTransaction(modal.txn.id, data)
    setModal(null)
  }

  function handleDelete(id) {
    if (confirm('Delete this transaction?')) deleteTransaction(id)
  }

  return (
    <div>
      {/* Month nav */}
      <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="icon-btn" onClick={handlePrev}><ChevronLeft size={20} /></button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem' }}>{formatMonthLabel(year, month)}</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>
            <span style={{ color: 'var(--sage-dark)', fontFamily: 'var(--font-mono)' }}>+{formatCurrency(income)}</span>
            {' · '}
            <span style={{ color: 'var(--rose-dark)', fontFamily: 'var(--font-mono)' }}>-{formatCurrency(expenses)}</span>
          </p>
        </div>
        <button className="icon-btn" onClick={handleNext}><ChevronRight size={20} /></button>
      </div>

      {/* Transaction list */}
      <div className="card" style={{ marginBottom: 80 }}>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <ListOrdered size={32} />
            <p>No transactions this month</p>
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={14} /> Add one
            </button>
          </div>
        ) : (
          transactions.map((txn, i) => (
            <div key={txn.id} className="txn-item" style={{ flexWrap: 'wrap' }}>
              <div className={`txn-icon ${txn.isFixed ? 'txn-icon-fixed' : txn.type === 'income' ? 'txn-icon-income' : 'txn-icon-expense'}`}>
                {txn.isFixed ? <RefreshCw size={14} /> : txn.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
              <div className="txn-body">
                <p className="txn-desc">{txn.description}</p>
                <p className="txn-meta">{txn.category} · {formatDate(txn.date)}{txn.isFixed ? ' · recurring' : ''}</p>
              </div>
              <div className="txn-right">
                <span className={`amount ${txn.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                  {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                </span>
                {!txn.isVirtual && (
                  <div className="txn-actions">
                    <button
                      className="btn-ghost icon-btn btn-icon"
                      onClick={() => setModal({ mode: 'edit', txn })}
                      style={{ width: 28, height: 28 }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="btn-ghost icon-btn btn-icon"
                      onClick={() => handleDelete(txn.id)}
                      style={{ width: 28, height: 28, color: 'var(--rose)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setModal({ mode: 'add' })} aria-label="Add transaction">
        <Plus size={22} />
      </button>

      {modal && (
        <TransactionModal
          initial={modal.txn}
          onSave={handleSave}
          onClose={() => setModal(null)}
          categories={expCats}
          incomeCategories={incCats}
        />
      )}
    </div>
  )
}

