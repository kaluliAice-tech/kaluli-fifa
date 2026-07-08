// Dummy preview data. This is ONLY used when Supabase env vars are not
// configured (see supabaseClient.js), so the app is runnable immediately
// with `npm run dev`. Flags use unicode emoji flags to avoid needing image
// assets; swap for real flag icon URLs if desired.
//
// Game scope: Quarter Final (8 besar) through Final only.
// Kickoff times below are converted to WIB (UTC+7) from the official
// ET schedule as confirmed once Round of 16 concluded on July 7, 2026.

export const DUMMY_MATCHES = [
  // Quarter Final (4 matches) - q1..q4
  { id: 'q1', round: 'quarter_final', team_a: 'France', team_b: 'Morocco', team_a_flag: '🇫🇷', team_b_flag: '🇲🇦', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-10T03:00:00+07:00', status: 'upcoming', next_match_id: 's1' },
  { id: 'q2', round: 'quarter_final', team_a: 'Spain', team_b: 'Belgium', team_a_flag: '🇪🇸', team_b_flag: '🇧🇪', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-11T02:00:00+07:00', status: 'upcoming', next_match_id: 's1' },
  { id: 'q3', round: 'quarter_final', team_a: 'Norway', team_b: 'England', team_a_flag: '🇳🇴', team_b_flag: '🏴', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-12T04:00:00+07:00', status: 'upcoming', next_match_id: 's2' },
  { id: 'q4', round: 'quarter_final', team_a: 'Argentina', team_b: 'Switzerland', team_a_flag: '🇦🇷', team_b_flag: '🇨🇭', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-12T08:00:00+07:00', status: 'upcoming', next_match_id: 's2' },

  // Semi Final (2 matches) - s1, s2 (teams TBD until Quarter Final finishes)
  { id: 's1', round: 'semi_final', team_a: 'Winner Q1', team_b: 'Winner Q2', team_a_flag: '🏳️', team_b_flag: '🏳️', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-15T02:00:00+07:00', status: 'upcoming', next_match_id: 'f1' },
  { id: 's2', round: 'semi_final', team_a: 'Winner Q3', team_b: 'Winner Q4', team_a_flag: '🏳️', team_b_flag: '🏳️', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-16T02:00:00+07:00', status: 'upcoming', next_match_id: 'f1' },

  // Final - f1 (teams TBD until Semi Final finishes)
  { id: 'f1', round: 'final', team_a: 'Winner S1', team_b: 'Winner S2', team_a_flag: '🏳️', team_b_flag: '🏳️', team_a_score: null, team_b_score: null, winner_team: null, kickoff_time: '2026-07-20T02:00:00+07:00', status: 'upcoming', next_match_id: null },
]

export const DUMMY_ACTIVE_ROUND = 'quarter_final'

export const DUMMY_LEADERBOARD = [
  { user_id: 'u1', name: 'Dinda Pratiwi', total_points: 60, correct_predictions: 3, current_streak: 2 },
  { user_id: 'u2', name: 'Bagas Nugroho', total_points: 40, correct_predictions: 2, current_streak: 1 },
  { user_id: 'u3', name: 'Salma Aulia', total_points: 30, correct_predictions: 2, current_streak: 0 },
  { user_id: 'u4', name: 'Rangga Saputra', total_points: 15, correct_predictions: 1, current_streak: 1 },
  { user_id: 'u5', name: 'Kirana Wijaya', total_points: 0, correct_predictions: 0, current_streak: 0 },
]

export const DUMMY_USER_PREDICTIONS = []
