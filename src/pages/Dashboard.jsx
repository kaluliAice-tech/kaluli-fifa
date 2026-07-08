import { useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import MatchCard from '../components/MatchCard.jsx'
import { useApp } from '../lib/AppState.jsx'
import { ROUND_LABELS } from '../lib/points.js'

export default function Dashboard() {
  const { user, matches, activeRound, myPredictionForRound, submitPrediction, logout } = useApp()
  const [selectedMatchId, setSelectedMatchId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')

  const roundMatches = useMemo(
    () => matches.filter((m) => m.round === activeRound).sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time)),
    [matches, activeRound]
  )

  const existingPrediction = myPredictionForRound(activeRound)

  const handleSubmit = async (matchId, winner) => {
    setError('')
    setSubmitting(true)
    try {
      await submitPrediction(matchId, winner)
      setToast('Prediction Submitted! Pick wisely, you can\u2019t change it later.')
      setTimeout(() => setToast(null), 3200)
    } catch (err) {
      setError(err.message || 'Gagal submit prediksi.')
    } finally {
      setSubmitting(false)
      setSelectedMatchId(null)
    }
  }

  return (
    <div className="pb-24">
      <Header title={`Hi, ${user?.name?.split(' ')[0] || 'Kaluli Fan'} 👋`} subtitle="Pilih 1 match untuk ronde ini" />

      <div className="px-6 pt-4">
        <div className="bg-kaluli-navy text-white rounded-xl2 p-4 flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold text-kaluli-gold uppercase tracking-wide">Active Round</p>
            <p className="font-display font-bold text-lg">{ROUND_LABELS[activeRound] || activeRound}</p>
          </div>
          <span className="text-3xl">⚽</span>
        </div>

        {existingPrediction && (
          <div className="mb-5 rounded-xl2 border-2 border-kaluli-gold bg-kaluli-goldSoft/50 p-3.5 text-center">
            <p className="text-xs font-bold text-kaluli-navy">Choose 1 match only ✓</p>
            <p className="text-[11px] text-kaluli-navy/60 font-semibold mt-0.5">
              Kamu sudah submit prediksi untuk {ROUND_LABELS[activeRound]}. Tunggu hasil match ya.
            </p>
          </div>
        )}

        {!existingPrediction && (
          <p className="text-xs font-bold text-kaluli-navy/50 mb-4 text-center">
            Choose 1 match only. Pick wisely, you can’t change it later.
          </p>
        )}

        {error && <p className="text-xs font-bold text-kaluli-red mb-3 text-center">{error}</p>}

        <div className="flex flex-col gap-3.5">
          {roundMatches.length === 0 && (
            <p className="text-center text-sm text-kaluli-navy/40 font-semibold py-10">
              Belum ada match untuk ronde ini.
            </p>
          )}
          {roundMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              mode="pick"
              selected={selectedMatchId === match.id}
              onSelectMatch={setSelectedMatchId}
              onSubmitPrediction={handleSubmit}
              userPrediction={
                existingPrediction?.match_id === match.id ? existingPrediction : undefined
              }
              disabled={Boolean(existingPrediction) && existingPrediction.match_id !== match.id}
              submitting={submitting}
            />
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full mt-8 py-2.5 text-xs font-bold text-kaluli-navy/40 underline"
        >
          Keluar / Ganti Akun
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[420px] bg-kaluli-navy text-white text-sm font-bold text-center py-3 rounded-xl2 shadow-card z-40 animate-slideUp">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
