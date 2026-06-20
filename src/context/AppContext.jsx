import { createContext, useContext, useReducer, useEffect } from 'react'
import {
  generateId, getDaysInMonth, toMonthStr, DEFAULT_BUDGET_CATEGORIES,
} from '../utils/helpers'

const AppContext = createContext(null)
const STORAGE_KEY = 'clearing_v1'

function buildDefaultState() {
  return {
    transactions: [],
    debts: [],
    budgetCategories: DEFAULT_BUDGET_CATEGORIES.map(c => ({ ...c, id: generateId() })),
    fixedExpenses: [],
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD': return action.payload

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] }
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.id ? { ...t, ...action.payload } : t) }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.id) }

    case 'ADD_DEBT':
      return { ...state, debts: [...state.debts, action.payload] }
    case 'UPDATE_DEBT':
      return { ...state, debts: state.debts.map(d => d.id === action.id ? { ...d, ...action.payload } : d) }
    case 'DELETE_DEBT':
      return { ...state, debts: state.debts.filter(d => d.id !== action.id) }

    case 'ADD_BUDGET_CAT':
      return { ...state, budgetCategories: [...state.budgetCategories, action.payload] }
    case 'UPDATE_BUDGET_CAT':
      return { ...state, budgetCategories: state.budgetCategories.map(c => c.id === action.id ? { ...c, ...action.payload } : c) }
    case 'DELETE_BUDGET_CAT':
      return { ...state, budgetCategories: state.budgetCategories.filter(c => c.id !== action.id) }

    case 'ADD_FIXED':
      return { ...state, fixedExpenses: [...state.fixedExpenses, action.payload] }
    case 'UPDATE_FIXED':
      return { ...state, fixedExpenses: state.fixedExpenses.map(f => f.id === action.id ? { ...f, ...action.payload } : f) }
    case 'DELETE_FIXED':
      return { ...state, fixedExpenses: state.fixedExpenses.filter(f => f.id !== action.id) }

    case 'IMPORT': return action.payload
    default: return state
  }
}

function buildVirtualFixedTxns(fixedExpenses, year, month) {
  const monthStr = toMonthStr(year, month)
  const daysInMonth = getDaysInMonth(year, month)
  return fixedExpenses
    .filter(fe => fe.active && fe.startMonth <= monthStr)
    .map(fe => ({
      id: `v-${fe.id}-${monthStr}`,
      type: 'expense',
      category: fe.category,
      amount: Number(fe.amount),
      date: `${monthStr}-${String(Math.min(Number(fe.dueDay), daysInMonth)).padStart(2, '0')}`,
      description: fe.name,
      isFixed: true,
      fixedExpenseId: fe.id,
      isVirtual: true,
    }))
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (_) {}
    return buildDefaultState()
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (_) {}
  }, [state])

  function getMonthData(year, month) {
    const monthStr = toMonthStr(year, month)
    const real = state.transactions.filter(t => t.date.startsWith(monthStr))
    const virtual = buildVirtualFixedTxns(state.fixedExpenses, year, month)
    const all = [...real, ...virtual].sort((a, b) => b.date.localeCompare(a.date))
    const income = all.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const expenses = all.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
    return { transactions: all, income, expenses, net: income - expenses }
  }

  function getDebtProgress() {
    const totalOriginal = state.debts.reduce((s, d) => s + Number(d.originalBalance), 0)
    const totalCurrent = state.debts.reduce((s, d) => s + Number(d.currentBalance), 0)
    const paidOff = totalOriginal - totalCurrent
    return {
      totalOriginal, totalCurrent, paidOff,
      percentage: totalOriginal > 0 ? Math.min(100, (paidOff / totalOriginal) * 100) : (state.debts.length === 0 ? 0 : 100),
    }
  }

  function getBudgetProgress(year, month) {
    const { transactions } = getMonthData(year, month)
    const expenses = transactions.filter(t => t.type === 'expense')
    return state.budgetCategories.map(cat => {
      const spent = expenses.filter(t => t.category === cat.name).reduce((s, t) => s + Number(t.amount), 0)
      return { ...cat, spent, percentage: cat.monthlyLimit > 0 ? (spent / cat.monthlyLimit) * 100 : 0 }
    })
  }

  function getCategoryBreakdown(year, month) {
    const { transactions } = getMonthData(year, month)
    const map = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + Number(t.amount)
    })
    const colors = Object.fromEntries(state.budgetCategories.map(c => [c.name, c.color]))
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: colors[name] ?? '#A89080' }))
      .sort((a, b) => b.value - a.value)
  }

  function getAllCategories() {
    const expCats = state.budgetCategories.map(c => c.name)
    return expCats
  }

  const actions = {
    addTransaction: data =>
      dispatch({ type: 'ADD_TRANSACTION', payload: { id: generateId(), isFixed: false, isVirtual: false, ...data } }),
    updateTransaction: (id, data) => dispatch({ type: 'UPDATE_TRANSACTION', id, payload: data }),
    deleteTransaction: id => dispatch({ type: 'DELETE_TRANSACTION', id }),

    addDebt: data =>
      dispatch({ type: 'ADD_DEBT', payload: { id: generateId(), ...data, originalBalance: Number(data.originalBalance), currentBalance: Number(data.currentBalance ?? data.originalBalance) } }),
    updateDebt: (id, data) => dispatch({ type: 'UPDATE_DEBT', id, payload: data }),
    deleteDebt: id => dispatch({ type: 'DELETE_DEBT', id }),
    logDebtPayment: (debtId, amount, date) => {
      const debt = state.debts.find(d => d.id === debtId)
      if (!debt) return
      const newBalance = Math.max(0, Number(debt.currentBalance) - Number(amount))
      dispatch({ type: 'UPDATE_DEBT', id: debtId, payload: { currentBalance: newBalance } })
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          id: generateId(), type: 'expense', category: 'Debt Payments',
          amount: Number(amount), date, description: `Payment — ${debt.name}`,
          isFixed: false, isVirtual: false, debtId,
        },
      })
    },

    addBudgetCategory: data =>
      dispatch({ type: 'ADD_BUDGET_CAT', payload: { id: generateId(), ...data, monthlyLimit: Number(data.monthlyLimit) } }),
    updateBudgetCategory: (id, data) => dispatch({ type: 'UPDATE_BUDGET_CAT', id, payload: { ...data, monthlyLimit: Number(data.monthlyLimit) } }),
    deleteBudgetCategory: id => dispatch({ type: 'DELETE_BUDGET_CAT', id }),

    addFixedExpense: data =>
      dispatch({ type: 'ADD_FIXED', payload: { id: generateId(), active: true, ...data, amount: Number(data.amount), dueDay: Number(data.dueDay) } }),
    updateFixedExpense: (id, data) =>
      dispatch({ type: 'UPDATE_FIXED', id, payload: { ...data, amount: Number(data.amount), dueDay: Number(data.dueDay) } }),
    deleteFixedExpense: id => dispatch({ type: 'DELETE_FIXED', id }),
    toggleFixedExpense: id => {
      const fe = state.fixedExpenses.find(f => f.id === id)
      if (fe) dispatch({ type: 'UPDATE_FIXED', id, payload: { active: !fe.active } })
    },

    exportData: () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clearing-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    },
    importData: json => {
      dispatch({ type: 'IMPORT', payload: json })
    },
  }

  return (
    <AppContext.Provider value={{ state, ...actions, getMonthData, getDebtProgress, getBudgetProgress, getCategoryBreakdown, getAllCategories }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
