import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, getCurrentYearMonth, formatMonthLabel } from '../utils/helpers'

function ProgressRing({ percentage, size = 140, stroke = 12 }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(percentage, 100) / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2D8CE" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="#6F8163" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)' }}
      />
      <text
        x={size/2} y={size/2}
        textAnchor="middle" dominantBaseline="central"
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: `${size/2}px ${size/2}px`,
          fontFamily: 'IBM Plex Mono, monospace',
          fontWeight: 500,
          fontSize: '1.25rem',
          fill: '#2C2417',
        }}
      >
        {Math.round(percentage)}%
      </text>
    </svg>
  )
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #E2D8CE', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 600, color: '#2C2417', marginBottom: 2 }}>{payload[0].name}</p>
      <p style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#A8576B' }}>{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const { year, month } = getCurrentYearMonth()
  const { getMonthData, getDebtProgress, getCategoryBreakdown } = useApp()
  const { income, expenses, net, transactions } = getMonthData(year, month)
  const debtProgress = getDebtProgress()
  const breakdown = getCategoryBreakdown(year, month)
  const recent = transactions.slice(0, 6)

  return (
    <div>
      {/* Debt freedom ring */}
      <div className="card dash-ring-card" style={{ marginBottom: 12 }}>
        <ProgressRing percentage={debtProgress.percentage} />
        <p className="dash-ring-label">debt freedom</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
          {formatCurrency(debtProgress.paidOff)} paid of {formatCurrency(debtProgress.totalOriginal)}
        </p>
      </div>

      {/* Monthly summary */}
      <div style={{ marginBottom: 12 }}>
        <p className="section-title" style={{ marginBottom: 8 }}>{formatMonthLabel(year, month)}</p>
        <div className="dash-grid">
          <div className="dash-stat">
            <span className="dash-stat-label">Income</span>
            <span className="amount amount-income amount-lg">{formatCurrency(income)}</span>
            <TrendingUp size={14} color="var(--sage)" />
          </div>
          <div className="dash-stat">
            <span className="dash-stat-label">Expenses</span>
            <span className="amount amount-expense amount-lg">{formatCurrency(expenses)}</span>
            <TrendingDown size={14} color="var(--rose)" />
          </div>
          <div className="dash-stat" style={{ gridColumn: '1 / -1' }}>
            <span className="dash-stat-label">Net</span>
            <span className={`amount amount-lg ${net >= 0 ? 'amount-income' : 'amount-expense'}`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      {breakdown.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 12 }}>
          <p className="section-title">Spending by Category</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={breakdown}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {breakdown.map((entry, i) => (
                  <Cell key={i} fill={entry.color ?? '#A89080'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>{v}</span>}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-header card-pad" style={{ marginBottom: 0, paddingBottom: 0 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>Recent Activity</p>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onNavigate('activity')}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            All <ArrowRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <RefreshCw size={32} />
            <p>No transactions this month</p>
          </div>
        ) : (
          recent.map(txn => (
            <div key={txn.id} className="txn-item">
              <div className={`txn-icon ${txn.isFixed ? 'txn-icon-fixed' : txn.type === 'income' ? 'txn-icon-income' : 'txn-icon-expense'}`}>
                {txn.isFixed ? <RefreshCw size={14} /> : txn.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </div>
              <div className="txn-body">
                <p className="txn-desc">{txn.description}</p>
                <p className="txn-meta">{txn.category}</p>
              </div>
              <span className={`amount ${txn.type === 'income' ? 'amount-income' : 'amount-expense'}`}>
                {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
