import { useMemo } from 'react'
import Header from '../components/Header.jsx'
import BottomNav from '../components/BottomNav.jsx'
import FlagIcon from '../components/FlagIcon.jsx'
import { useApp } from '../lib/AppState.jsx'
import { ROUNDS, ROUND_LABELS } from '../lib/points.js'

export default function Bracket() {
  const { matches, predictions, activeRound } = useApp()

  const grouped = useMemo(() => {
    const map = {}
    for (const round of ROUNDS) {
      map[round] = matches
        .filter((m) => m.round === round)
        .sort((a, b) => new Date(a.kickoff_time) - new Date(b.kickoff_time))
    }
    return map
  }, [matches])

  const predictionByMatchId = useMemo(() => {
    const map = {}
    for (const p of predictions) map[p.match_id] = p
    return map
  }, [predictions])

  return (
    <div className="pb-24">
      <Header title="Elimination Bracket" subtitle="Round of 16 → Final" />

      <div className="px-6 pt-4 flex flex-col gap-8">
        {ROUNDS.map((round, roundIdx) => (
          <section key={round}>
            <div className="flex items-center gap-2 mb-4">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  round === activeRound ? 'bg-kaluli-red animate-pop' : 'bg-kaluli-navy/20'
                }`}
              />
              <h2 className="font-display font-bold text-kaluli-navy text-base">{ROUND_LABELS[round]}</h2>
              {round === activeRound && (
                <span className="text-[10px] font-extrabold text-kaluli-red bg-kaluli-red/10 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              )}
            </div>

            <ol className="relative border-l-2 border-dashed border-kaluli-gold/50 pl-5 flex flex-col gap-4">
              {grouped[round].length === 0 && (
                <li className="text-xs text-kaluli-navy/40 font-semibold">Belum ada match di ronde ini.</li>
              )}
              {grouped[round].map((match) => {
                const pick = predictionByMatchId[match.id]
                const hasResult = match.status === 'finished' && match.winner_team
                return (
                  <li key={match.id} className="relative">
                    <span className="absolute -left-[26px] top-4 w-3 h-3 rounded-full bg-kaluli-gold border-2 border-white shadow" />

                    <div className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-kaluli-navy/40 mb-2">
                        <span>{match.status === 'finished' ? 'Finished' : match.status === 'locked' ? 'Locked' : 'Upcoming'}</span>
                        {pick && (
                          <span className="text-[10px] font-extrabold text-kaluli-red bg-kaluli-red/10 px-2 py-0.5 rounded-full">
                            Your Pick
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <TeamRow
                          flag={match.team_a_flag}
                          name={match.team_a}
                          score={match.team_a_score}
                          isWinner={match.winner_team === match.team_a}
                          finished={match.status === 'finished'}
                        />
                        <span className="text-[10px] font-extrabold text-kaluli-navy/25">vs</span>
                        <TeamRow
                          flag={match.team_b_flag}
                          name={match.team_b}
                          score={match.team_b_score}
                          isWinner={match.winner_team === match.team_b}
                          finished={match.status === 'finished'}
                          alignRight
                        />
                      </div>

                      {!hasResult && (
                        <p className="text-[11px] text-kaluli-navy/35 font-semibold mt-2 text-center">
                          Waiting for official result.
                        </p>
                      )}

                      {pick && (
                        <div className="mt-2 flex justify-center">
                          {pick.is_correct === true && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              ✓ Correct
                            </span>
                          )}
                          {pick.is_correct === false && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                              ✕ Wrong
                            </span>
                          )}
                          {pick.is_correct === null && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-kaluli-goldSoft text-kaluli-navy">
                              Waiting for Match Result
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>

            {roundIdx < ROUNDS.length - 1 && (
              <div className="flex justify-center mt-3 text-kaluli-navy/25 text-lg">↓</div>
            )}
          </section>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}

function TeamRow({ flag, name, score, isWinner, finished, alignRight }) {
  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${alignRight ? 'flex-row-reverse text-right' : ''}`}>
      <FlagIcon flag={flag} size="sm" />
      <span className={`text-xs font-bold truncate ${isWinner && finished ? 'text-kaluli-navy' : 'text-kaluli-navy/60'}`}>
        {name}
      </span>
      {finished && (
        <span className={`text-sm font-display font-extrabold ${isWinner ? 'text-kaluli-red' : 'text-kaluli-navy/30'}`}>
          {score ?? '-'}
        </span>
      )}
    </div>
  )
}
