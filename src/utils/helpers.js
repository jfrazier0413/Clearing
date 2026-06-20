export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function getDaysInMonth(year, month) {
  // month is 1-indexed (1=Jan, 12=Dec)
  return new Date(year, month, 0).getDate()
}

export function getFirstDayOfMonth(year, month) {
  // returns 0=Sun, 1=Mon, ..., 6=Sat
  return new Date(year, month - 1, 1).getDay()
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount ?? 0)
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function formatMonthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })
}

export function getCurrentYearMonth() {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function toMonthStr(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export function todayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function prevMonth(year, month) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

export function nextMonth(year, month) {
  if (month === 12) return { year: year + 1, month: 1 }
  return { year, month: month + 1 }
}

export const CATEGORY_COLORS = [
  '#C1623D', '#A8576B', '#6F8163', '#8B7A6E',
  '#D4956A', '#7A9E7E', '#C4849A', '#9B8EA0',
  '#5C7A5C', '#8B3A3A', '#B8866E', '#4A7A8A',
  '#A89080', '#7A6A9E', '#6B8F6B',
]

export const DEFAULT_BUDGET_CATEGORIES = [
  { name: 'Housing',        color: '#C1623D', monthlyLimit: 0 },
  { name: 'Food & Dining',  color: '#A8576B', monthlyLimit: 0 },
  { name: 'Transportation', color: '#6F8163', monthlyLimit: 0 },
  { name: 'Utilities',      color: '#7A9E7E', monthlyLimit: 0 },
  { name: 'Healthcare',     color: '#8B7A6E', monthlyLimit: 0 },
  { name: 'Entertainment',  color: '#D4956A', monthlyLimit: 0 },
  { name: 'Shopping',       color: '#B8866E', monthlyLimit: 0 },
  { name: 'Personal Care',  color: '#C4849A', monthlyLimit: 0 },
  { name: 'Education',      color: '#9B8EA0', monthlyLimit: 0 },
  { name: 'Savings',        color: '#5C7A5C', monthlyLimit: 0 },
  { name: 'Debt Payments',  color: '#8B3A3A', monthlyLimit: 0 },
  { name: 'Other',          color: '#A89080', monthlyLimit: 0 },
]

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Rental Income', 'Gift', 'Other Income',
]
