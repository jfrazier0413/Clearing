import { LayoutDashboard, ListOrdered, CreditCard, PieChart, CalendarDays } from 'lucide-react'

const TABS = [
  { id: 'dashboard',  label: 'Home',    Icon: LayoutDashboard },
  { id: 'activity',   label: 'Activity', Icon: ListOrdered },
  { id: 'debts',      label: 'Debts',   Icon: CreditCard },
  { id: 'budget',     label: 'Budget',  Icon: PieChart },
  { id: 'fixed',      label: 'Fixed',   Icon: CalendarDays },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" role="navigation">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav-item${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
          aria-label={label}
        >
          <Icon size={20} strokeWidth={active === id ? 2 : 1.6} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
