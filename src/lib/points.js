// Point system rules for Kaluli FIFA World Cup 2026 Prediction Game
// Game now covers Quarter Final (8 besar) through Final only.
//
// Quarter Final correct:    +15 (first active round, no incoming multiplier)
// Semi Final correct:       +20, x2 (=40) if previous round (QF) was correct
// Final correct:            +30, x3 (=90) if previous round (SF) was correct
//
// Wrong prediction -> 0 points for that round, streak resets to 0.
// User can still play the next round; next correct pick is scored at base
// value (no multiplier) since the streak was broken.

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

/**
 * Calculate points for a single prediction result.
 * @param {string} round - one of ROUNDS
 * @param {boolean} isCorrect
 * @param {boolean} previousRoundCorrect - whether the user's prior round pick was correct
 * @returns {{points: number, multiplier: number}}
 */
export function calculatePoints(round, isCorrect, previousRoundCorrect) {
  if (!isCorrect) {
    return { points: 0, multiplier: 1 }
  }
  const base = BASE_POINTS[round] ?? 0
  const multiplier = previousRoundCorrect ? MULTIPLIER[round] : 1
  return { points: base * multiplier, multiplier }
}

/**
 * Recompute a user's full stat line (total points, streak, correct count)
 * from an ordered list of predictions (oldest round first).
 * Each prediction: { round, is_correct, submitted_at }
 */
export function summarizeUserPredictions(predictionsOrderedByRound) {
  let totalPoints = 0
  let correctCount = 0
  let currentStreak = 0
  let longestStreak = 0
  let previousCorrect = false

  for (const p of predictionsOrderedByRound) {
    if (p.is_correct === null || p.is_correct === undefined) {
      // Result not decided yet, doesn't affect totals
      continue
    }
    const { points } = calculatePoints(p.round, p.is_correct, previousCorrect)
    totalPoints += points
    if (p.is_correct) {
      correctCount += 1
      currentStreak += 1
      longestStreak = Math.max(longestStreak, currentStreak)
      previousCorrect = true
    } else {
      currentStreak = 0
      previousCorrect = false
    }
  }

  return { totalPoints, correctCount, currentStreak, longestStreak }
}
