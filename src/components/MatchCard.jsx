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
 * mode="pick"    -> dashboard flow: user can select this match then choose a winner
 * mode="display" -> read-only, used in bracket view
 */
export default function MatchCard({
  match,
  mode = 'display',
  selected = false,
  onSelectMatch,
  onSubmitPrediction,
  userPrediction,
  disabled = false,
  submitting = false,
}) {
  const [choosingWinner, setChoosingWinner] = useState(false)

  const isFinished = match.status === 'finished'
  const isLocked = match.status === 'locked' || new Date() >= new Date(match.kickoff_time)
  const hasResult = isFinished && match.winner_team

  const showPredictedBadge = userPrediction
  const predictedCorrect = userPrediction?.is_correct === true
  const predictedWrong = userPrediction?.is_correct === false

  const handlePickClick = () => {
    if (disabled || isLocked) return
    onSelectMatch?.(match.id)
    setChoosingWinner(true)
  }

  const handleChooseWinner = (team) => {
    onSubmitPrediction?.(match.id, team)
    setChoosingWinner(false)
  }

  return (
    <div
      className={`rounded-xl2 bg-white border ${
        selected ? 'border-kaluli-red shadow-card' : 'border-kaluli-navy/10 shadow-sm'
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
        <div className="mt-3 flex items-center justify-center">
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
              ? '✓ Correct Prediction'
              : predictedWrong
              ? '✕ Wrong Prediction'
              : `Your Pick: ${userPrediction.predicted_winner} · Waiting for Match Result`}
          </span>
        </div>
      )}

      {mode === 'pick' && !userPrediction && (
        <div className="mt-3">
          {!choosingWinner ? (
            <button
              onClick={handlePickClick}
              disabled={disabled || isLocked}
              className="w-full py-2.5 rounded-xl bg-kaluli-navy text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
            >
              {isLocked ? 'Locked' : 'Pick This Match'}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 animate-pop">
              <button
                onClick={() => handleChooseWinner(match.team_a)}
                disabled={submitting}
                className="py-2.5 rounded-xl bg-kaluli-red text-white text-xs font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Predict {match.team_a} Win
              </button>
              <button
                onClick={() => handleChooseWinner(match.team_b)}
                disabled={submitting}
                className="py-2.5 rounded-xl bg-kaluli-red text-white text-xs font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                Predict {match.team_b} Win
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
