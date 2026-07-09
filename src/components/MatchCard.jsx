import { useState } from 'react'
import FlagIcon from './FlagIcon'
import { ROUND_LABELS } from '../lib/points'

function formatKickoff(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const STATUS_STYLES = {
  upcoming: 'bg-kaluli-goldSoft text-kaluli-navy',
  locked: 'bg-kaluli-navy text-white',
  finished: 'bg-emerald-100 text-emerald-700',
}

const STATUS_LABELS = {
  upcoming: 'Upcoming',
  locked: 'Locked',
  finished: 'Finished',
}

/**
 * MatchCard
 * mode="pick"    -> dashboard flow: user can predict the SCORE of this
 *                   match (winner is derived from the score). Multiple
 *                   matches in the same round can each be picked.
 * mode="display" -> read-only, used in bracket view
 */
export default function MatchCard({
  match,
  mode = 'display',
  onSubmitPrediction,
  userPrediction,
  disabled = false,
  submitting = false,
}) {
  const [predicting, setPredicting] = useState(false)
  const [scoreA, setScoreA] = useState('')
  const [scoreB, setScoreB] = useState('')
  const [localError, setLocalError] = useState('')

  const isFinished = match.status === 'finished'
  const isLocked = match.status === 'locked' || new Date() >= new Date(match.kickoff_time)
  const hasResult = isFinished && match.winner_team

  const showPredictedBadge = userPrediction
  const predictedCorrect = userPrediction?.is_correct === true
  const predictedWrong = userPrediction?.is_correct === false
  const predictedExact = userPrediction?.is_exact_score === true

  const handleStartPredict = () => {
    if (disabled || isLocked) return
    setPredicting(true)
    setLocalError('')
  }

  const handleSubmit = () => {
    setLocalError('')
    if (scoreA === '' || scoreB === '') {
      setLocalError('Isi skor kedua tim dulu ya.')
      return
    }
    if (Number(scoreA) === Number(scoreB)) {
      setLocalError('Skor tidak boleh seri — babak gugur harus ada pemenang.')
      return
    }
    onSubmitPrediction?.(match.id, scoreA, scoreB)
    setPredicting(false)
  }

  return (
    <div
      className={`rounded-xl2 bg-white border ${
        predicting ? 'border-kaluli-red shadow-card' : 'border-kaluli-navy/10 shadow-sm'
      } p-4 animate-slideUp`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-kaluli-red">
          {ROUND_LABELS[match.round]}
        </span>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_STYLES[match.status] || STATUS_STYLES.upcoming}`}>
          {STATUS_LABELS[match.status] || match.status}
        </span>
      </div>

      <p className="text-xs text-kaluli-navy/50 font-semibold mb-3">{formatKickoff(match.kickoff_time)}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <FlagIcon flag={match.team_a_flag} />
          <span className="text-xs font-bold text-kaluli-navy text-center truncate w-full">{match.team_a}</span>
          {isFinished && <span className="text-lg font-display font-extrabold text-kaluli-navy">{match.team_a_score ?? '-'}</span>}
        </div>

        <span className="text-sm font-extrabold text-kaluli-navy/30 px-1">VS</span>

        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <FlagIcon flag={match.team_b_flag} />
          <span className="text-xs font-bold text-kaluli-navy text-center truncate w-full">{match.team_b}</span>
          {isFinished && <span className="text-lg font-display font-extrabold text-kaluli-navy">{match.team_b_score ?? '-'}</span>}
        </div>
      </div>

      {hasResult && (
        <p className="text-center text-[11px] font-bold text-kaluli-navy/50 mt-2">
          Winner: <span className="text-kaluli-navy">{match.winner_team}</span>
        </p>
      )}

      {showPredictedBadge && (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-bold text-kaluli-navy/60">
            Skor Prediksi Kamu: {userPrediction.predicted_score_a} - {userPrediction.predicted_score_b}
          </span>
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full ${
              predictedCorrect
                ? 'bg-emerald-100 text-emerald-700'
                : predictedWrong
                ? 'bg-red-100 text-red-600'
                : 'bg-kaluli-goldSoft text-kaluli-navy'
            }`}
          >
            {predictedCorrect
              ? predictedExact
                ? '✓ Correct Prediction · Exact Score! 🎯'
                : '✓ Correct Prediction'
              : predictedWrong
              ? '✕ Wrong Prediction'
              : 'Waiting for Match Result'}
          </span>
        </div>
      )}

      {mode === 'pick' && !userPrediction && (
        <div className="mt-3">
          {!predicting ? (
            <button
              onClick={handleStartPredict}
              disabled={disabled || isLocked}
              className="w-full py-2.5 rounded-xl bg-kaluli-navy text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            >
              {isLocked ? 'Locked' : 'Pick This Match'}
            </button>
          ) : (
            <div className="animate-pop">
              <p className="text-[11px] font-bold text-kaluli-navy/60 text-center mb-2">Prediksi skor akhir:</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-kaluli-navy/50 truncate max-w-[80px]">{match.team_a}</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                    className="w-14 h-12 text-center text-lg font-display font-extrabold rounded-xl border-2 border-kaluli-navy/15 focus:border-kaluli-red outline-none"
                  />
                </div>
                <span className="text-kaluli-navy/30 font-extrabold pt-5">:</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-kaluli-navy/50 truncate max-w-[80px]">{match.team_b}</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                    className="w-14 h-12 text-center text-lg font-display font-extrabold rounded-xl border-2 border-kaluli-navy/15 focus:border-kaluli-red outline-none"
                  />
                </div>
              </div>

              {localError && <p className="text-[11px] font-bold text-kaluli-red text-center mb-2">{localError}</p>}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPredicting(false)}
                  className="py-2.5 rounded-xl bg-kaluli-mist text-kaluli-navy/60 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="py-2.5 rounded-xl bg-kaluli-red text-white text-xs font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  Submit Prediksi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
