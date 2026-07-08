import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import { useApp } from '../lib/AppState.jsx'

const MEDAL = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const { leaderboard, user } = useApp()

  const sorted = [...leaderboard].sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="pb-24">
      <Header title="Leaderboard" subtitle="Top scorer wins exclusive Kaluli merch" />

      <div className="px-6 pt-4">
        <div className="rounded-xl2 bg-kaluli-red text-white p-4 flex items-center gap-3 mb-5">
          <span className="text-2xl">🍦</span>
          <p className="text-xs font-bold leading-snug">Top scorer wins exclusive Kaluli merch.</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {sorted.length === 0 && (
            <p className="text-center text-sm text-kaluli-navy/40 font-semibold py-10">Belum ada peserta.</p>
          )}
          {sorted.map((entry, idx) => {
            const isMe = user && (entry.user_id === user.id)
            return (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 rounded-xl2 p-3.5 border shadow-sm ${
                  isMe ? 'bg-kaluli-goldSoft border-kaluli-gold' : 'bg-white border-kaluli-navy/10'
                }`}
              >
                <div className="w-9 h-9 shrink-0 rounded-full bg-kaluli-navy text-white flex items-center justify-center font-display font-bold text-sm">
                  {idx < 3 ? MEDAL[idx] : `#${idx + 1}`}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-kaluli-navy truncate">
                    {entry.name || entry.users?.name || 'Kaluli Fan'} {isMe && <span className="text-kaluli-red">(Kamu)</span>}
                  </p>
                  <p className="text-[11px] text-kaluli-navy/50 font-semibold">
                    {entry.correct_predictions ?? 0} correct pick · streak {entry.current_streak ?? 0}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-extrabold text-kaluli-navy text-lg leading-none">{entry.total_points ?? 0}</p>
                  <p className="text-[10px] text-kaluli-navy/40 font-bold uppercase">pts</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
