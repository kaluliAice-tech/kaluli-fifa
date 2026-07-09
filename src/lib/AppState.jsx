import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { DUMMY_MATCHES, DUMMY_ACTIVE_ROUND, DUMMY_LEADERBOARD, DUMMY_USER_PREDICTIONS } from './dummyData'
import { ROUNDS, calculatePoints, summarizeUserPredictions, winnerFromScore } from './points'

const AppContext = createContext(null)

const LS_USER_KEY = 'kaluli_user'
const LS_MATCHES_KEY = 'kaluli_demo_matches'
const LS_PREDICTIONS_KEY = 'kaluli_demo_predictions'
const LS_ACTIVE_ROUND_KEY = 'kaluli_demo_active_round'
const LS_DEMO_USERS_KEY = 'kaluli_demo_users' // demo-mode "database" of registered accounts

// Hash a password with SHA-256 (via the browser's built-in Web Crypto API,
// no extra dependency needed) before it's ever sent to Supabase. This is
// NOT the same level of security as a proper backend using bcrypt/argon2
// with per-user salt, but it's a meaningful step up from storing the raw
// password, and needs no server component.
async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / private-mode errors
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => readLocal(LS_USER_KEY, null))
  const [matches, setMatches] = useState([])
  const [predictions, setPredictions] = useState([]) // this user's predictions
  const [leaderboard, setLeaderboard] = useState([])
  const [activeRound, setActiveRound] = useState(DUMMY_ACTIVE_ROUND)
  const [loading, setLoading] = useState(true)

  const demoMode = !isSupabaseConfigured

  const loadMatches = useCallback(async () => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('matches').select('*').order('kickoff_time', { ascending: true })
      if (!error && data) setMatches(data)
      const { data: settings } = await supabase.from('settings').select('*').eq('key', 'active_round').maybeSingle()
      if (settings?.value) setActiveRound(settings.value)
      return
    }
    setMatches(readLocal(LS_MATCHES_KEY, DUMMY_MATCHES))
    setActiveRound(readLocal(LS_ACTIVE_ROUND_KEY, DUMMY_ACTIVE_ROUND))
  }, [])

  const loadLeaderboard = useCallback(async () => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*, users(name)')
        .order('total_points', { ascending: false })
      if (!error && data) setLeaderboard(data)
      return
    }
    setLeaderboard(DUMMY_LEADERBOARD)
  }, [])

  const loadPredictions = useCallback(async (currentUser) => {
    if (!currentUser) {
      setPredictions([])
      return
    }
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', currentUser.id)
      if (!error && data) setPredictions(data)
      return
    }
    const all = readLocal(LS_PREDICTIONS_KEY, DUMMY_USER_PREDICTIONS)
    setPredictions(all.filter((p) => p.user_id === currentUser.id || !p.user_id))
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await Promise.all([loadMatches(), loadLeaderboard()])
      if (user) await loadPredictions(user)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const register = useCallback(async ({ name, username, password, phone, email, instagram }) => {
    const passwordHash = await hashPassword(password)

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          username,
          password_hash: passwordHash,
          phone: phone || null,
          email: email || null,
          instagram: instagram || null,
        })
        .select()
        .single()
      if (error) {
        if (error.code === '23505') throw new Error('Username sudah dipakai. Coba username lain atau login kalau ini akun kamu.')
        throw error
      }
      const { password_hash, ...safeUser } = data
      setUser(safeUser)
      writeLocal(LS_USER_KEY, safeUser)
      await loadPredictions(safeUser)
      return safeUser
    }

    // Demo mode: keep a small "users database" in localStorage so login
    // can look accounts up by username later.
    const demoUsers = readLocal(LS_DEMO_USERS_KEY, [])
    if (demoUsers.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      throw new Error('Username sudah dipakai. Coba username lain atau login kalau ini akun kamu.')
    }
    const newUser = {
      id: `demo-${username}`,
      name,
      username,
      password_hash: passwordHash,
      phone: phone || null,
      email: email || null,
      instagram: instagram || null,
    }
    writeLocal(LS_DEMO_USERS_KEY, [...demoUsers, newUser])
    const { password_hash, ...safeUser } = newUser
    setUser(safeUser)
    writeLocal(LS_USER_KEY, safeUser)
    await loadPredictions(safeUser)
    return safeUser
  }, [loadPredictions])

  const login = useCallback(async ({ username, password }) => {
    const passwordHash = await hashPassword(password)

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('username', username)
        .maybeSingle()
      if (error) throw error
      if (!data || data.password_hash !== passwordHash) {
        throw new Error('Username atau password salah.')
      }
      const { password_hash, ...safeUser } = data
      setUser(safeUser)
      writeLocal(LS_USER_KEY, safeUser)
      await loadPredictions(safeUser)
      return safeUser
    }

    const demoUsers = readLocal(LS_DEMO_USERS_KEY, [])
    const found = demoUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!found || found.password_hash !== passwordHash) {
      throw new Error('Username atau password salah.')
    }
    const { password_hash, ...safeUser } = found
    setUser(safeUser)
    writeLocal(LS_USER_KEY, safeUser)
    await loadPredictions(safeUser)
    return safeUser
  }, [loadPredictions])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(LS_USER_KEY)
    setPredictions([])
  }, [])

  // A user can now predict MULTIPLE matches within the same active round.
  // Look up an existing prediction by match, not by round.
  const myPredictionForMatch = useCallback(
    (matchId) => predictions.find((p) => p.match_id === matchId),
    [predictions]
  )

  const myPredictionsForRound = useCallback(
    (round) => predictions.filter((p) => p.round === round),
    [predictions]
  )

  const getMatchById = useCallback((id) => matches.find((m) => m.id === id), [matches])

  const submitPrediction = useCallback(
    async (matchId, scoreA, scoreB) => {
      if (!user) throw new Error('Kamu harus register/login dulu.')
      const match = getMatchById(matchId)
      if (!match) throw new Error('Match tidak ditemukan.')
      if (match.round !== activeRound) throw new Error('Ronde ini belum aktif.')
      if (myPredictionForMatch(matchId)) {
        throw new Error('Kamu sudah submit prediksi untuk match ini.')
      }
      if (new Date() >= new Date(match.kickoff_time) || match.status !== 'upcoming') {
        throw new Error('Prediction locked. Match sudah kick-off.')
      }
      const a = Number(scoreA)
      const b = Number(scoreB)
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
        throw new Error('Skor harus berupa angka bulat 0 atau lebih.')
      }
      const predictedWinner = winnerFromScore(match.team_a, match.team_b, a, b)
      if (!predictedWinner) {
        throw new Error('Skor tidak boleh seri — ini babak gugur, harus ada pemenang.')
      }

      const basePrediction = {
        user_id: user.id,
        match_id: matchId,
        round: match.round,
        predicted_winner: predictedWinner,
        predicted_score_a: a,
        predicted_score_b: b,
        is_correct: null,
        is_exact_score: null,
        points_earned: null,
        multiplier: 1,
        submitted_at: new Date().toISOString(),
      }

      if (isSupabaseConfigured) {
        // Let Supabase generate the id (predictions.id is a uuid column with
        // default gen_random_uuid()) — do NOT set a custom id here.
        const { data, error } = await supabase.from('predictions').insert(basePrediction).select().single()
        if (error) throw error
        setPredictions((prev) => [...prev, data])
        return data
      }

      // Demo/local mode: predictions live in a plain JSON array in
      // localStorage, so any unique string works fine as an id here.
      const newPrediction = { id: `${user.id}-${matchId}`, ...basePrediction }
      const all = readLocal(LS_PREDICTIONS_KEY, DUMMY_USER_PREDICTIONS)
      const updated = [...all, newPrediction]
      writeLocal(LS_PREDICTIONS_KEY, updated)
      setPredictions((prev) => [...prev, newPrediction])
      return newPrediction
    },
    [user, activeRound, getMatchById, myPredictionForMatch]
  )

  // ---- Admin actions (demo mode only persists to localStorage) ----

  const adminUpsertMatch = useCallback(
    async (match) => {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('matches').upsert(match).select().single()
        if (error) throw error
        setMatches((prev) => {
          const exists = prev.some((m) => m.id === data.id)
          return exists ? prev.map((m) => (m.id === data.id ? data : m)) : [...prev, data]
        })
        return data
      }
      setMatches((prev) => {
        const exists = prev.some((m) => m.id === match.id)
        const next = exists ? prev.map((m) => (m.id === match.id ? { ...m, ...match } : m)) : [...prev, match]
        writeLocal(LS_MATCHES_KEY, next)
        return next
      })
      return match
    },
    []
  )

  const adminSetActiveRound = useCallback(async (round) => {
    if (isSupabaseConfigured) {
      await supabase.from('settings').upsert({ key: 'active_round', value: round })
    } else {
      writeLocal(LS_ACTIVE_ROUND_KEY, round)
    }
    setActiveRound(round)
  }, [])

  // Was this user's round "perfect" (every prediction in that round had the
  // correct winner)? Used to decide whether the NEXT round's correct picks
  // get the streak multiplier. Returns false if the user made no
  // predictions in that round, or if any pick in it was wrong / undecided.
  function isPerfectRound(allUserPredictions, round) {
    const picks = allUserPredictions.filter((p) => p.round === round)
    if (picks.length === 0) return false
    return picks.every((p) => p.is_correct === true)
  }

  // Recalculates is_correct / is_exact_score / points_earned for all
  // predictions tied to a finished match. In demo mode this only affects
  // predictions stored locally in this browser.
  const adminCalculatePoints = useCallback(
    async (matchId) => {
      // Always fetch the match FRESH from the database right before
      // calculating — never trust the local React state here, since it can
      // go stale if the match was edited moments earlier (e.g. multiple
      // admin tabs open, or state not yet re-synced) and using an old
      // winner_team would silently mark every correct pick as wrong.
      let match
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('matches').select('*').eq('id', matchId).single()
        if (error) throw error
        match = data
      } else {
        match = getMatchById(matchId)
      }

      if (!match || match.status !== 'finished' || !match.winner_team) {
        throw new Error('Match belum finished / winner belum di-set.')
      }

      if (isSupabaseConfigured) {
        // In production, prefer doing this recompute inside a Postgres
        // function/RPC for atomicity. This client-side version fetches
        // predictions for the match, recalculates using each user's full
        // prediction history (to check for a "perfect" previous round),
        // and writes points_earned/is_correct/is_exact_score back.
        const { data: preds, error } = await supabase.from('predictions').select('*').eq('match_id', matchId)
        if (error) throw error
        for (const p of preds) {
          const roundIdx = ROUNDS.indexOf(p.round)
          let perfectPreviousRound = false
          if (roundIdx > 0) {
            const previousRound = ROUNDS[roundIdx - 1]
            const { data: userPreds } = await supabase
              .from('predictions')
              .select('round, is_correct')
              .eq('user_id', p.user_id)
            perfectPreviousRound = isPerfectRound(userPreds || [], previousRound)
          }
          const isCorrectWinner = String(p.predicted_winner).trim() === String(match.winner_team).trim()
          const isExactScore =
            isCorrectWinner &&
            p.predicted_score_a === match.team_a_score &&
            p.predicted_score_b === match.team_b_score
          const { points, multiplier } = calculatePoints(p.round, isCorrectWinner, isExactScore, perfectPreviousRound)
          await supabase
            .from('predictions')
            .update({ is_correct: isCorrectWinner, is_exact_score: isExactScore, points_earned: points, multiplier })
            .eq('id', p.id)
        }
        await loadLeaderboard()
        if (user) await loadPredictions(user)
        return
      }

      const all = readLocal(LS_PREDICTIONS_KEY, DUMMY_USER_PREDICTIONS)
      const byUser = {}
      for (const p of all) {
        byUser[p.user_id] = byUser[p.user_id] || []
        byUser[p.user_id].push(p)
      }

      const updated = []
      for (const uid of Object.keys(byUser)) {
        const userPreds = byUser[uid]
        for (const p of userPreds) {
          if (p.match_id === matchId) {
            const roundIdx = ROUNDS.indexOf(p.round)
            const perfectPreviousRound = roundIdx > 0 ? isPerfectRound(userPreds, ROUNDS[roundIdx - 1]) : false
            const isCorrectWinner = String(p.predicted_winner).trim() === String(match.winner_team).trim()
            const isExactScore =
              isCorrectWinner &&
              p.predicted_score_a === match.team_a_score &&
              p.predicted_score_b === match.team_b_score
            const { points, multiplier } = calculatePoints(p.round, isCorrectWinner, isExactScore, perfectPreviousRound)
            p.is_correct = isCorrectWinner
            p.is_exact_score = isExactScore
            p.points_earned = points
            p.multiplier = multiplier
          }
          updated.push(p)
        }
      }
      writeLocal(LS_PREDICTIONS_KEY, updated)
      if (user) setPredictions(updated.filter((p) => p.user_id === user.id))

      // Rebuild leaderboard from all predictions
      const nameByUserId = {}
      DUMMY_LEADERBOARD.forEach((l) => (nameByUserId[l.user_id] = l.name))
      if (user) nameByUserId[user.id] = user.name
      const newLeaderboard = Object.keys(byUser).map((uid) => {
        const stats = summarizeUserPredictions(byUser[uid])
        return {
          user_id: uid,
          name: nameByUserId[uid] || 'Kaluli Fan',
          total_points: stats.totalPoints,
          correct_predictions: stats.correctCount,
          current_streak: stats.currentStreak,
        }
      })
      const merged = [...DUMMY_LEADERBOARD.filter((l) => !newLeaderboard.some((n) => n.user_id === l.user_id)), ...newLeaderboard]
      merged.sort((a, b) => b.total_points - a.total_points)
      setLeaderboard(merged)
    },
    [getMatchById, user, loadLeaderboard, loadPredictions]
  )

  const value = useMemo(
    () => ({
      demoMode,
      loading,
      user,
      matches,
      predictions,
      leaderboard,
      activeRound,
      register,
      login,
      logout,
      myPredictionForMatch,
      myPredictionsForRound,
      getMatchById,
      submitPrediction,
      adminUpsertMatch,
      adminSetActiveRound,
      adminCalculatePoints,
      reloadAll: async () => {
        await Promise.all([loadMatches(), loadLeaderboard()])
        if (user) await loadPredictions(user)
      },
    }),
    [
      demoMode,
      loading,
      user,
      matches,
      predictions,
      leaderboard,
      activeRound,
      register,
      login,
      logout,
      myPredictionForMatch,
      myPredictionsForRound,
      getMatchById,
      submitPrediction,
      adminUpsertMatch,
      adminSetActiveRound,
      adminCalculatePoints,
      loadMatches,
      loadLeaderboard,
      loadPredictions,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
