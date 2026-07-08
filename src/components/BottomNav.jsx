import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Predict', icon: '⚽' },
  { to: '/bracket', label: 'Bracket', icon: '🏆' },
  { to: '/leaderboard', label: 'Ranking', icon: '📊' },
  { to: '/rules', label: 'Rules', icon: '📋' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-kaluli-navy/10 z-30 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-between px-2">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-bold transition-colors ${
                  isActive ? 'text-kaluli-red' : 'text-kaluli-navy/40'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
