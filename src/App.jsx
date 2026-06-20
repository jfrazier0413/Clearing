import { useState } from 'react'
import { Settings as SettingsIcon } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Activity from './components/Activity'
import Debts from './components/Debts'
import Budget from './components/Budget'
import FixedExpenses from './components/FixedExpenses'
import Settings from './components/Settings'

const PAGE_TITLES = {
  dashboard: 'Clearing',
  activity:  'Activity',
  debts:     'Debts',
  budget:    'Budget',
  fixed:     'Fixed Expenses',
}

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>{PAGE_TITLES[tab]}</h1>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsIcon size={20} />
          </button>
        </div>
      </header>

      <main className="page-content">
        {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
        {tab === 'activity'  && <Activity />}
        {tab === 'debts'     && <Debts />}
        {tab === 'budget'    && <Budget />}
        {tab === 'fixed'     && <FixedExpenses />}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
