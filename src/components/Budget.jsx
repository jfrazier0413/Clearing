import { useState } from 'react'
import { Plus, Pencil, Trash2, PieChart, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, getCurrentYearMonth, formatMonthLabel, CATEGORY_COLORS } from '../utils/helpers'
import Modal from './Modal'

function CategoryModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    name: '', color: CATEGORY_COLORS[0],
    ...initial,
    monthlyLimit: initial?.monthlyLimit != null ? String(initial.monthlyLimit) : '',
  }))
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <Modal title={initial ? 'Edit Category' : 'Add Budget Category'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave({ ...form, monthlyLimit: Number(form.monthlyLimit) }) }} className="form-grid">
        <div className="form-group">
          <label className="form-label">Category Name</label>
          <input className="form-input" type="text" placeholder="e.g. Groceries" value={form.name} required onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Monthly Limit ($)</label>
          <input
            className="form-input" type="number" min="0" step="1" placeholder="0"
            value={form.monthlyLimit} onChange={e => set('monthlyLimit', e.target.value)}
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <div className="color-picker">
            {CATEGORY_COLORS.map(c => (
              <button type="button" key={c} className={`color-swatch${form.color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => set('color', c)} />
            ))}
          </div>
        </div>
        <div className="form-actions" style={{ position: 'sticky', bottom: 0, background: 'var(--white)', paddingTop: 12, marginTop: 4, borderTop: '1px solid var(--border-light)' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{initial ? 'Save Changes' : 'Add Category'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Budget() {
  const { year, month } = getCurrentYearMonth()
  const { getBudgetProgress, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory } = useApp()
  const [modal, setModal] = useState(null)

  const progress = getBudgetProgress(year, month)
  const totalBudget = progress.reduce((s, c) => s + (c.monthlyLimit || 0), 0)
  const totalSpent = progress.reduce((s, c) => s + c.spent, 0)
  const fixedSpent = progress.reduce((s, c) => s + c.spent, 0) // same — fixed expenses roll into categories
  const overBudget = progress.filter(c => c.monthlyLimit > 0 && c.spent > c.monthlyLimit)

  function handleSave(data) {
    if (modal.mode === 'add') addBudgetCategory(data)
    else updateBudgetCategory(modal.cat.id, data)
    setModal(null)
  }

  function handleDelete(id) {
    if (confirm('Delete this budget category?')) deleteBudgetCategory(id)
  }

  // Always show ALL categories — those with limits show progress bars,
  // those without show a "Set limit" tap target
  const withLimit = progress.filter(c => c.monthlyLimit > 0)
  const noLimit = progress.filter(c => !c.monthlyLimit)

  return (
    <div>
      {/* Summary */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginBottom: 4 }}>{formatMonthLabel(year, month).toUpperCase()}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>Spent this month</p>
            <p className="amount amount-expense" style={{ fontSize: '1.4rem' }}>{formatCurrency(totalSpent)}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>Total budget</p>
            <p className="amount amount-neutral" style={{ fontSize: '1.4rem' }}>{formatCurrency(totalBudget)}</p>
          </div>
        </div>
        {totalBudget > 0 && (
          <div className="progress-bar">
            <div
              className={`progress-fill ${totalSpent > totalBudget ? 'progress-over' : totalSpent / totalBudget > 0.75 ? 'progress-warn' : 'progress-ok'}`}
              style={{ width: `${Math.min(100, (totalSpent / totalBudget) * 100)}%` }}
            />
          </div>
        )}
        {overBudget.length > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--rose-dark)', marginTop: 8 }}>
            ⚠ Over budget: {overBudget.map(c => c.name).join(', ')}
          </p>
        )}
        {totalBudget === 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>
            Tap any category below to set a monthly limit.
          </p>
        )}
      </div>

      {/* Categories with limits — progress bars */}
      {withLimit.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-header card-pad" style={{ paddingBottom: 0, marginBottom: 0 }}>
            <p className="section-title" style={{ marginBottom: 0 }}>Budgeted</p>
            <button className="btn btn-ghost btn-sm" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={14} /> Add
            </button>
          </div>
          {withLimit.map(cat => {
            const pct = Math.min(150, cat.percentage)
            const barClass = cat.percentage > 100 ? 'progress-over' : cat.percentage > 75 ? 'progress-warn' : 'progress-ok'
            const remaining = cat.monthlyLimit - cat.spent
            return (
              <div key={cat.id} className="budget-row">
                <div className="budget-row-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span className="budget-cat-name">{cat.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="budget-amounts">
                      <span className="amount">{formatCurrency(cat.spent)}</span>
                      <span style={{ color: 'var(--text-light)' }}> / {formatCurrency(cat.monthlyLimit)}</span>
                    </span>
                    <button className="btn-ghost icon-btn btn-icon" style={{ width: 28, height: 28 }} onClick={() => setModal({ mode: 'edit', cat })}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn-ghost icon-btn btn-icon" style={{ width: 28, height: 28, color: 'var(--rose)' }} onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${barClass}`} style={{ width: `${pct}%`, background: cat.percentage > 100 ? undefined : cat.color + 'cc' }} />
                </div>
                <p style={{ fontSize: '0.72rem', color: remaining >= 0 ? 'var(--text-light)' : 'var(--rose-dark)', marginTop: 5 }}>
                  {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* All categories without limits — always visible, tap to set limit */}
      <div className="card" style={{ marginBottom: 80 }}>
        <div className="section-header card-pad" style={{ paddingBottom: 0, marginBottom: 0 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>
            {withLimit.length === 0 ? 'Categories' : 'No Limit Set'}
          </p>
          {withLimit.length === 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        {noLimit.length === 0 ? (
          <div className="empty-state">
            <PieChart size={32} />
            <p>All categories have limits set!</p>
          </div>
        ) : (
          noLimit.map(cat => (
            <button
              key={cat.id}
              style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', background: 'none', borderTop: '1px solid var(--border-light)', textAlign: 'left', gap: 10, cursor: 'pointer' }}
              onClick={() => setModal({ mode: 'edit', cat })}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color ?? '#A89080', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)' }}>{cat.name}</span>
              {cat.spent > 0 && (
                <span className="amount amount-expense" style={{ fontSize: '0.8rem' }}>{formatCurrency(cat.spent)}</span>
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--terracotta)', fontWeight: 500 }}>Set limit</span>
              <ChevronRight size={14} color="var(--text-light)" />
            </button>
          ))
        )}
      </div>

      {modal && (
        <CategoryModal
          initial={modal.cat}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
