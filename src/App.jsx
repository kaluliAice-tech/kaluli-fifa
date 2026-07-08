import { Navigate, Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Bracket from './pages/Bracket.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Rules from './pages/Rules.jsx'
import Admin from './pages/Admin.jsx'
import { useApp } from './lib/AppState.jsx'

function RequireUser({ children }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/register" replace />
  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <RequireUser>
              <Dashboard />
            </RequireUser>
          }
        />
        <Route path="/bracket" element={<Bracket />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
