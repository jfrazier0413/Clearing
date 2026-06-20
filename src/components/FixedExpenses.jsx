import { useState } from 'react'
import { Plus, Pencil, Trash2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  formatCurrency, toMonthStr, getCurrentYearMonth, formatMonthLabel,
  prevMonth, nextMonth, getDaysInMonth, getFirstDayOfMonth,
} from '../utils/helpers'
import Modal from './Modal'

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function FixedModal({ initial, onSave, onClose, categories }) {
  const { year, month } = getCurrentYearMonth()
  const [form, setForm] = useState(() => {
    const base = { name: '', category: categories[0] ?? 'Other', startMonth: toMonthStr(year, month), ...initial }
    return { ...base, amount: base.amount != null ? String(base.amount) : '', dueDay: base.dueDay != null ? String(base.dueDay) : '1' }
  })
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  return (
    <Modal title={initial ? 'Edit Fixed Expense' : 'Add Fixed Expense'} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="form-grid">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" type="text" placeholder="e.g. Rent" value={form.name} required onChange={e => set('name', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input className="form-input" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} required onChange={e => set('amount', e.target.value)} style={{ fontFamily: 'IBM Plex Mono, monospace' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Day</label>
            <input className="form-input" type="number" min="1" max="31" placeholder="1" value={form.dueDay} required onChange={e => set('dueDay', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Starting Month</label>
          <input className="form-input" type="month" value={form.startMonth} required onChange={e => set('startMonth', e.target.value)} />
        </div>
        <div className="form-actions" style={{ position: 'sticky', bottom: 0, background: 'var(--white)', paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{initial ? 'Save Changes' : 'Add Fixed Expense'}</button>
        </div>
      </form>
    </Modal>
  )
}

function DayPopover({ day, items, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(44,36,23,.3)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, padding: '20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
        <div className="modal-handle" />
        <p className="modal-title" style={{ marginBottom: 12 }}>Due on the {day}{ordinal(day)}</p>
        {items.map(fe => (
          <div key={fe.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--border-light)' }}>
            <div>
              <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{fe.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{fe.category}</p>
            </div>
            <span className="amount amount-expense">{formatCurrency(fe.amount)}</span>
          </div>
        ))}
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

export default function FixedExpenses() {
  const { year: cy, month: cm } = getCurrentYearMonth()
  const [calYear, setCalYear] = useState(cy)
  const [calMonth, setCalMonth] = useState(cm)
  const [modal, setModal] = useState(null)
  const [popover, setPopover] = useState(null) // { day, items }

  const { state, addFixedExpense, updateFixedExpense, deleteFixedExpense, toggleFixedExpense, getAllCategories } = useApp()
  const categories = getAllCategories()

  const monthStr = toMonthStr(calYear, calMonth)
  const today = new Date()
  const isCurrentMonth = calYear === cy && calMonth === cm

  // Fixed expenses active this calendar month
  const activeThisMonth = state.fixedExpenses.filter(fe => fe.active && fe.startMonth <= monthStr)

  // Build day → [fixedExpense] map
  const dayMap = {}
  activeThisMonth.forEach(fe => {
    const day = Math.min(Number(fe.dueDay), getDaysInMonth(calYear, calMonth))
    if (!dayMap[day]) dayMap[day] = []
    dayMap[day].push(fe)
  })

  // Calendar grid
  const firstDow = getFirstDayOfMonth(calYear, calMonth)
  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function handleSave(data) {
    if (modal.mode === 'add') addFixedExpense(data)
    else updateFixedExpense(modal.fe.id, data)
    setModal(null)
  }

  const totalMonthly = state.fixedExpenses
    .filter(fe => fe.active)
    .reduce((s, fe) => s + Number(fe.amount), 0)

  return (
    <div>
      {/* Summary */}
      {state.fixedExpenses.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-light)' }}>MONTHLY FIXED COSTS</p>
          <p className="amount amount-expense" style={{ fontSize: '1.6rem', marginTop: 2 }}>{formatCurrency(totalMonthly)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>
            {state.fixedExpenses.filter(f => f.active).length} active · {state.fixedExpenses.filter(f => !f.active).length} paused
          </p>
        </div>
      )}

      {/* Calendar */}
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button className="icon-btn" onClick={() => { const p = prevMonth(calYear, calMonth); setCalYear(p.year); setCalMonth(p.month) }}>
            <ChevronLeft size={18} />
          </button>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{formatMonthLabel(calYear, calMonth)}</p>
          <button className="icon-btn" onClick={() => { const n = nextMonth(calYear, calMonth); setCalYear(n.year); setCalMonth(n.month) }}>
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="cal-grid">
          {DAY_NAMES.map(d => <div key={d} className="cal-day-name">{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />
            const items = dayMap[day] ?? []
            const isToday = isCurrentMonth && day === today.getDate()
            return (
              <div
                key={day}
                className={`cal-day${isToday ? ' today' : ''}${items.length ? ' has-items' : ''}`}
                onClick={() => items.length && setPopover({ day, items })}
              >
                <span>{day}</span>
                {items.length > 0 && (
                  <div className="cal-dot-row">
                    {items.slice(0, 3).map((fe, j) => (
                      <div key={j} className={`cal-dot${isToday ? ' today-dot' : ''}`} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {activeThisMonth.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 12 }}>
            No fixed expenses due this month
          </p>
        ) : (
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
              This month's schedule
            </p>
            {Object.entries(dayMap)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, items]) => (
                <div key={day} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--cream-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-medium)' }}>
                    {day}
                  </div>
                  <div style={{ flex: 1 }}>
                    {items.map(fe => (
                      <div key={fe.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{fe.name}</span>
                        <span className="amount amount-expense" style={{ fontSize: '0.85rem' }}>{formatCurrency(fe.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-medium)' }}>Monthly total</span>
              <span className="amount amount-expense" style={{ fontSize: '1rem' }}>
                {formatCurrency(activeThisMonth.reduce((s, fe) => s + Number(fe.amount), 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed expense list */}
      <div className="card" style={{ marginBottom: 80 }}>
        <div className="section-header card-pad" style={{ marginBottom: 0, paddingBottom: 0 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>Fixed Expenses</p>
          <button className="btn btn-ghost btn-sm" onClick={() => setModal({ mode: 'add' })}>
            <Plus size={14} /> Add
          </button>
        </div>

        {state.fixedExpenses.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <p>No fixed expenses yet</p>
            <p>Add recurring costs like rent, subscriptions, and insurance.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setModal({ mode: 'add' })}>
              <Plus size={14} /> Add Fixed Expense
            </button>
          </div>
        ) : (
          state.fixedExpenses.map(fe => (
            <div key={fe.id} className="txn-item" style={{ flexWrap: 'wrap' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: fe.active ? 'var(--cream-dark)' : '#f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: fe.active ? 'var(--sage-dark)' : 'var(--text-light)',
                flexShrink: 0,
              }}>
                <CalendarDays size={16} />
              </div>
              <div className="txn-body">
                <p className="txn-desc" style={{ opacity: fe.active ? 1 : 0.5 }}>{fe.name}</p>
                <p className="txn-meta">
                  {fe.category} · due {fe.dueDay}{ordinal(Number(fe.dueDay))} · since {fe.startMonth}
                </p>
              </div>
              <div className="txn-right">
                <span className="amount amount-expense" style={{ opacity: fe.active ? 1 : 0.5 }}>
                  {formatCurrency(fe.amount)}
                </span>
                <div className="txn-actions">
                  <div
                    className={`toggle${fe.active ? ' on' : ''}`}
                    onClick={() => toggleFixedExpense(fe.id)}
                    title={fe.active ? 'Pause' : 'Resume'}
                    role="switch"
                    aria-checked={fe.active}
                    style={{ cursor: 'pointer' }}
                  />
                  <button className="btn-ghost icon-btn btn-icon" style={{ width: 28, height: 28 }} onClick={() => setModal({ mode: 'edit', fe })}>
                    <Pencil size={12} />
                  </button>
                  <button className="btn-ghost icon-btn btn-icon" style={{ width: 28, height: 28, color: 'var(--rose)' }} onClick={() => { if (confirm('Delete this fixed expense?')) deleteFixedExpense(fe.id) }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => setModal({ mode: 'add' })} aria-label="Add fixed expense">
        <Plus size={22} />
      </button>

      {modal && (
        <FixedModal
          initial={modal.fe}
          onSave={handleSave}
          onClose={() => setModal(null)}
          categories={categories}
        />
      )}
      {popover && <DayPopover day={popover.day} items={popover.items} onClose={() => setPopover(null)} />}
    </div>
  )
}
