import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'
import { DUMMY_MATCHES, DUMMY_ACTIVE_ROUND, DUMMY_LEADERBOARD, DUMMY_USER_PREDICTIONS } from './dummyData'
import { ROUNDS, calculatePoints, summarizeUserPredictions } from './points'

const AppContext = createContext(null)

const LS_USER_KEY = 'kaluli_user'
const LS_MATCHES_KEY = 'kaluli_demo_matches'
const LS_PREDICTIONS_KEY = 'kaluli_demo_predictions'
const LS_ACTIVE_ROUND_KEY = 'kaluli_demo_active_round'

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

  const register = useCallback(async ({ name, phone, email, instagram }) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('users')
        .insert({ name, phone, email: email || null, instagram: instagram || null })
        .select()
        .single()
      if (error) throw error
      setUser(data)
      writeLocal(LS_USER_KEY, data)
      await loadPredictions(data)
      return data
    }
    const newUser = { id: `demo-${phone}`, name, phone, email: email || null, instagram: instagram || null }
    setUser(newUser)
    writeLocal(LS_USER_KEY, newUser)
    await loadPredictions(newUser)
    return newUser
  }, [loadPredictions])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(LS_USER_KEY)
    setPredictions([])
  }, [])

  const myPredictionForRound = useCallback(
    (round) => predictions.find((p) => p.round === round),
    [predictions]
  )

  const getMatchById = useCallback((id) => matches.find((m) => m.id === id), [matches])

  const submitPrediction = useCallback(
    async (matchId, predictedWinner) => {
      if (!user) throw new Error('Kamu harus register/login dulu.')
      const match = getMatchById(matchId)
      if (!match) throw new Error('Match tidak ditemukan.')
      if (match.round !== activeRound) throw new Error('Ronde ini belum aktif.')
      if (myPredictionForRound(match.round)) {
        throw new Error('Kamu sudah submit prediksi untuk ronde ini.')
      }
      if (new Date() >= new Date(match.kickoff_time) || match.status !== 'upcoming') {
        throw new Error('Prediction locked. Match sudah kick-off.')
      }

      const newPrediction = {
        id: `${user.id}-${matchId}`,
        user_id: user.id,
        match_id: matchId,
        round: match.round,
        predicted_winner: predictedWinner,
        is_correct: null,
        points_earned: null,
        multiplier: 1,
        submitted_at: new Date().toISOString(),
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('predictions').insert(newPrediction).select().single()
        if (error) throw error
        setPredictions((prev) => [...prev, data])
        return data
      }

      const all = readLocal(LS_PREDICTIONS_KEY, DUMMY_USER_PREDICTIONS)
      const updated = [...all, newPrediction]
      writeLocal(LS_PREDICTIONS_KEY, updated)
      setPredictions((prev) => [...prev, newPrediction])
      return newPrediction
    },
    [user, activeRound, getMatchById, myPredictionForRound]
  )

  // ---- Admin actions (demo mode only persists to localStorage) ----

  const persistMatches = useCallback((next) => {
    setMatches(next)
    if (!isSupabaseConfigured) writeLocal(LS_MATCHES_KEY, next)
  }, [])

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

  // Recalculates is_correct / points_earned for all predictions tied to a finished match.
  // In demo mode this only affects predictions stored locally in this browser.
  const adminCalculatePoints = useCallback(
    async (matchId) => {
      const match = getMatchById(matchId)
      if (!match || match.status !== 'finished' || !match.winner_team) {
        throw new Error('Match belum finished / winner belum di-set.')
      }

      if (isSupabaseConfigured) {
        // In production, prefer doing this recompute inside a Postgres
        // function/RPC (see supabase/schema.sql) for atomicity. This client-side
        // version fetches predictions for the match, recalculates using each
        // user's prior-round result, and writes points_earned/is_correct back.
        const { data: preds, error } = await supabase.from('predictions').select('*').eq('match_id', matchId)
        if (error) throw error
        for (const p of preds) {
          const { data: priorPreds } = await supabase
            .from('predictions')
            .select('round, is_correct')
            .eq('user_id', p.user_id)
            .neq('id', p.id)
          const roundIdx = ROUNDS.indexOf(p.round)
          const previousCorrect = (priorPreds || []).some(
            (pp) => ROUNDS.indexOf(pp.round) === roundIdx - 1 && pp.is_correct === true
          )
          const isCorrect = p.predicted_winner === match.winner_team
          const { points, multiplier } = calculatePoints(p.round, isCorrect, previousCorrect)
          await supabase
            .from('predictions')
            .update({ is_correct: isCorrect, points_earned: points, multiplier })
            .eq('id', p.id)
        }
        await loadLeaderboard()
        if (user) await loadPredictions(user)
        return
      }

      const all = readLocal(LS_PREDICTIONS_KEY, DUMMY_USER_PREDICTIONS)
      // group by user, sort by round order, recompute sequentially
      const byUser = {}
      for (const p of all) {
        byUser[p.user_id] = byUser[p.user_id] || []
        byUser[p.user_id].push(p)
      }
      const roundIndex = (r) => ROUNDS.indexOf(r)
      const updated = []
      for (const uid of Object.keys(byUser)) {
        const userPreds = byUser[uid].slice().sort((a, b) => roundIndex(a.round) - roundIndex(b.round))
        let previousCorrect = false
        for (const p of userPreds) {
          if (p.match_id === matchId) {
            const isCorrect = p.predicted_winner === match.winner_team
            const { points, multiplier } = calculatePoints(p.round, isCorrect, previousCorrect)
            p.is_correct = isCorrect
            p.points_earned = points
            p.multiplier = multiplier
          }
          if (p.is_correct === true) previousCorrect = true
          else if (p.is_correct === false) previousCorrect = false
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
        const stats = summarizeUserPredictions(
          byUser[uid].slice().sort((a, b) => roundIndex(a.round) - roundIndex(b.round))
        )
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
      logout,
      myPredictionForRound,
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
      logout,
      myPredictionForRound,
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
