// Point system rules for Kaluli FIFA World Cup 2026 Prediction Game
// Game covers Quarter Final (8 besar) through Final only.
//
// NEW FORMAT: a user can predict MORE THAN ONE match per active round (up
// to all matches shown in that round), and each prediction now includes a
// predicted SCORE for both teams (not just "who wins").
//
// Scoring per match prediction:
//   - Correct winner (derived from predicted score vs actual score):
//       earns the round's base points (Quarter Final +15, Semi Final +20,
//       Final +30).
//   - Exact score bonus: +10 extra if the predicted score matches the
//     final score exactly (on top of the base points above).
//   - Round multiplier ("streak" bonus): if the user got EVERY one of
//     their predictions correct (winner-wise) in the previous active
//     round — a "perfect round" — their correct picks in the current
//     round are multiplied (Semi Final x2, Final x3). A single wrong pick
//     in the previous round resets this bonus back to normal (x1) for the
//     next round; the user can still keep predicting every round.
//   - Wrong winner prediction: 0 points for that match, no bonus.

export const ROUNDS = ['quarter_final', 'semi_final', 'final']

export const ROUND_LABELS = {
  quarter_final: 'Quarter Final',
  semi_final: 'Semi Final',
  final: 'Final',
}

const BASE_POINTS = {
  quarter_final: 15,
  semi_final: 20,
  final: 30,
}

const MULTIPLIER = {
  quarter_final: 1,
  semi_final: 2,
  final: 3,
}

export const EXACT_SCORE_BONUS = 10

/**
 * Derive the winner name from a score line. Returns null on a draw (should
 * not normally happen in knockout play, but guarded just in case).
 */
export function winnerFromScore(teamA, teamB, scoreA, scoreB) {
  if (scoreA == null || scoreB == null) return null
  if (scoreA > scoreB) return teamA
  if (scoreB > scoreA) return teamB
  return null
}

/**
 * Calculate points for a single match prediction.
 * @param {string} round - one of ROUNDS
 * @param {boolean} isCorrectWinner - predicted winner matches actual winner
 * @param {boolean} isExactScore - predicted score matches actual score exactly
 * @param {boolean} perfectPreviousRound - user got every pick right (winner-wise) in the previous round
 * @returns {{points: number, multiplier: number}}
 */
export function calculatePoints(round, isCorrectWinner, isExactScore, perfectPreviousRound) {
  if (!isCorrectWinner) {
    return { points: 0, multiplier: 1 }
  }
  const base = BASE_POINTS[round] ?? 0
  const bonus = isExactScore ? EXACT_SCORE_BONUS : 0
  const multiplier = perfectPreviousRound ? MULTIPLIER[round] : 1
  return { points: (base + bonus) * multiplier, multiplier }
}

/**
 * Recompute a user's full stat line (total points, streak, correct count)
 * from their full list of predictions (any order, any number per round).
 * Each prediction: { round, is_correct, is_exact_score, points_earned }
 */
export function summarizeUserPredictions(allPredictions) {
  let totalPoints = 0
  let correctCount = 0
  let currentStreak = 0
  let longestStreak = 0

  const byRound = {}
  for (const p of allPredictions) {
    byRound[p.round] = byRound[p.round] || []
    byRound[p.round].push(p)
  }

  let perfectPreviousRound = false

  for (const round of ROUNDS) {
    const picks = byRound[round] || []
    const decided = picks.filter((p) => p.is_correct !== null && p.is_correct !== undefined)
    if (decided.length === 0) continue

    let roundAllCorrect = decided.length > 0
    for (const p of decided) {
      const { points } = calculatePoints(round, p.is_correct, Boolean(p.is_exact_score), perfectPreviousRound)
      totalPoints += points
      if (p.is_correct) {
        correctCount += 1
        currentStreak += 1
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
        roundAllCorrect = false
      }
    }
    perfectPreviousRound = roundAllCorrect
  }

  return { totalPoints, correctCount, currentStreak, longestStreak }
}
