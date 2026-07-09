import { useState } from 'react'
import Header from '../components/Header.jsx'
import { useApp } from '../lib/AppState.jsx'
import { ROUNDS, ROUND_LABELS } from '../lib/points.js'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'kaluli-admin'

const emptyDraft = {
  id: '',
  round: 'quarter_final',
  team_a: '',
  team_b: '',
  team_a_flag: '🏳️',
  team_b_flag: '🏳️',
  kickoff_time: '',
  status: 'upcoming',
  next_match_id: '',
}

export default function Admin() {
  const { matches, activeRound, adminUpsertMatch, adminSetActiveRound, adminCalculatePoints, reloadAll } = useApp()
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [message, setMessage] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)

  if (!unlocked) {
    return (
      <div className="pb-16">
        <Header title="Admin Login" subtitle="Akses terbatas" back />
        <form
          className="px-6 pt-8 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (passwordInput === ADMIN_PASSWORD) setUnlocked(true)
            else setMessage('Password salah.')
          }}
        >
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 rounded-xl border border-kaluli-navy/15 font-semibold"
          />
          {message && <p className="text-xs font-bold text-kaluli-red">{message}</p>}
          <button className="py-3 rounded-xl2 bg-kaluli-navy text-white font-bold text-sm">Masuk</button>
        </form>
      </div>
    )
  }

  const updateDraft = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }))

  const handleSaveMatch = async (e) => {
    e.preventDefault()
    try {
      const id = draft.id || `m-${Date.now()}`
      await adminUpsertMatch({
        ...draft,
        id,
        team_a_score: draft.team_a_score !== undefined && draft.team_a_score !== '' ? Number(draft.team_a_score) : null,
        team_b_score: draft.team_b_score !== undefined && draft.team_b_score !== '' ? Number(draft.team_b_score) : null,
        winner_team: draft.winner_team || null,
        next_match_id: draft.next_match_id || null,
      })
      setMessage(`Match ${id} tersimpan.`)
      setDraft(emptyDraft)
    } catch (err) {
      setMessage(err.message || 'Gagal menyimpan match.')
    }
  }

  const loadForEdit = (m) => setDraft({ ...emptyDraft, ...m, team_a_score: m.team_a_score ?? '', team_b_score: m.team_b_score ?? '', next_match_id: m.next_match_id || '' })

  const handleUpdateField = async (match, field, value) => {
    try {
      await adminUpsertMatch({ ...match, [field]: value })
      setMessage(`${match.id} diupdate: ${field} = ${value}`)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleCalculate = async (matchId) => {
    try {
      await adminCalculatePoints(matchId)
      setMessage(`Poin untuk match ${matchId} berhasil dihitung ulang.`)
    } catch (err) {
      setMessage(err.message)
    }
  }

  const handleExportCSV = async () => {
    if (!isSupabaseConfigured) {
      setMessage('Export CSV butuh Supabase aktif (tidak tersedia di preview/demo mode).')
      return
    }
    setExporting(true)
    setMessage('Menyiapkan file CSV...')
    try {
      const [{ data: users, error: usersError }, { data: leaderboard, error: lbError }] = await Promise.all([
        supabase.from('users').select('id, name, username, phone, email, instagram, created_at'),
        supabase.from('leaderboard').select('*'),
      ])
      if (usersError) throw usersError
      if (lbError) throw lbError

      const lbByUserId = {}
      for (const row of leaderboard || []) lbByUserId[row.user_id] = row

      const headers = [
        'Nama', 'Username', 'No. WhatsApp', 'Email', 'Instagram',
        'Total Poin', 'Prediksi Benar', 'Streak Terpanjang', 'Streak Sekarang', 'Tanggal Daftar',
      ]
      const csvEscape = (val) => {
        const s = val === null || val === undefined ? '' : String(val)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const rows = (users || []).map((u) => {
        const lb = lbByUserId[u.id] || {}
        return [
          u.name, u.username, u.phone || '', u.email || '', u.instagram || '',
          lb.total_points ?? 0, lb.correct_predictions ?? 0, lb.longest_streak ?? 0, lb.current_streak ?? 0,
          u.created_at ? new Date(u.created_at).toLocaleString('id-ID') : '',
        ]
      })
      const csvContent = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `kaluli-peserta-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      setMessage(`Berhasil export ${rows.length} peserta ke CSV.`)
    } catch (err) {
      setMessage(err.message || 'Gagal export CSV.')
    } finally {
      setExporting(false)
    }
  }

  const handleSyncFromApi = async () => {
    setSyncing(true)
    setMessage('Sinkronisasi data dari API sedang berjalan...')
    try {
      const res = await fetch('/api/sync-scores')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sync gagal.')
      setMessage(json.message || 'Sync selesai.')
      await reloadAll()
    } catch (err) {
      setMessage(
        err.message?.includes('Failed to fetch') || err.message?.includes('JSON')
          ? 'Sync gagal. Fitur ini hanya jalan setelah di-deploy ke Netlify (butuh Netlify Function), tidak bisa di npm run dev lokal.'
          : err.message
      )
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="pb-16">
      <Header title="Admin Panel" subtitle="Kelola match, score, dan ronde aktif" back />

      <div className="px-6 pt-4">
        {message && (
          <p className="text-xs font-bold text-kaluli-navy bg-kaluli-goldSoft rounded-xl p-3 mb-4">{message}</p>
        )}

        {/* Sync from sports API */}
        <section className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 mb-5">
          <h2 className="font-display font-bold text-kaluli-navy text-sm mb-1">Sync Data Resmi</h2>
          <p className="text-[11px] text-kaluli-navy/50 font-semibold mb-3">
            Tarik jadwal & score Round of 16 s/d Final terbaru dari API-Football.
          </p>
          <button
            onClick={handleSyncFromApi}
            disabled={syncing}
            className="w-full py-2.5 rounded-xl bg-kaluli-navy text-white font-bold text-sm disabled:opacity-50"
          >
            {syncing ? 'Sinkronisasi...' : '🔄 Sync dari API'}
          </button>
        </section>

        {/* Export participant data */}
        <section className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 mb-5">
          <h2 className="font-display font-bold text-kaluli-navy text-sm mb-1">Export Data Peserta</h2>
          <p className="text-[11px] text-kaluli-navy/50 font-semibold mb-3">
            Download semua peserta (nama, kontak, poin) sebagai file CSV — bisa langsung dibuka di Excel atau di-import ke Google Sheets.
          </p>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="w-full py-2.5 rounded-xl bg-kaluli-gold text-kaluli-navy font-bold text-sm disabled:opacity-50"
          >
            {exporting ? 'Menyiapkan...' : '📥 Export ke CSV'}
          </button>
        </section>

        {/* Active round control */}
        <section className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 mb-5">
          <h2 className="font-display font-bold text-kaluli-navy text-sm mb-2">Ronde Aktif</h2>
          <select
            value={activeRound}
            onChange={(e) => adminSetActiveRound(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-kaluli-navy/15 font-semibold text-sm"
          >
            {ROUNDS.map((r) => (
              <option key={r} value={r}>
                {ROUND_LABELS[r]}
              </option>
            ))}
          </select>
        </section>

        {/* Add / edit match */}
        <section className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-4 mb-5">
          <h2 className="font-display font-bold text-kaluli-navy text-sm mb-3">Tambah / Edit Match</h2>
          <form onSubmit={handleSaveMatch} className="grid grid-cols-2 gap-2.5 text-sm">
            <input placeholder="Match ID (kosongkan utk baru)" value={draft.id} onChange={updateDraft('id')} className="col-span-2 field" />
            <select value={draft.round} onChange={updateDraft('round')} className="field">
              {ROUNDS.map((r) => (
                <option key={r} value={r}>{ROUND_LABELS[r]}</option>
              ))}
            </select>
            <select value={draft.status} onChange={updateDraft('status')} className="field">
              <option value="upcoming">Upcoming</option>
              <option value="locked">Locked</option>
              <option value="finished">Finished</option>
            </select>
            <input placeholder="Team A" value={draft.team_a} onChange={updateDraft('team_a')} className="field" />
            <input placeholder="Team B" value={draft.team_b} onChange={updateDraft('team_b')} className="field" />
            <input placeholder="Flag A (emoji)" value={draft.team_a_flag} onChange={updateDraft('team_a_flag')} className="field" />
            <input placeholder="Flag B (emoji)" value={draft.team_b_flag} onChange={updateDraft('team_b_flag')} className="field" />
            <input placeholder="Score A" value={draft.team_a_score ?? ''} onChange={updateDraft('team_a_score')} className="field" />
            <input placeholder="Score B" value={draft.team_b_score ?? ''} onChange={updateDraft('team_b_score')} className="field" />
            <input placeholder="Winner (nama tim persis)" value={draft.winner_team ?? ''} onChange={updateDraft('winner_team')} className="col-span-2 field" />
            <input type="datetime-local" value={draft.kickoff_time} onChange={updateDraft('kickoff_time')} className="col-span-2 field" />
            <input placeholder="Next match ID" value={draft.next_match_id} onChange={updateDraft('next_match_id')} className="col-span-2 field" />
            <button className="col-span-2 py-2.5 rounded-xl bg-kaluli-red text-white font-bold mt-1">Simpan Match</button>
          </form>
        </section>

        {/* Match list */}
        <section>
          <h2 className="font-display font-bold text-kaluli-navy text-sm mb-3">Semua Match</h2>
          <div className="flex flex-col gap-2.5">
            {matches.map((m) => (
              <div key={m.id} className="bg-white rounded-xl2 border border-kaluli-navy/10 shadow-sm p-3.5 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-kaluli-navy">{m.id} · {ROUND_LABELS[m.round]}</span>
                  <span className="text-kaluli-navy/40 font-semibold">{m.status}</span>
                </div>
                <p className="font-semibold text-kaluli-navy/70 mb-2">
                  {m.team_a} {m.team_a_score ?? '-'} vs {m.team_b_score ?? '-'} {m.team_b}
                  {m.winner_team ? ` · Winner: ${m.winner_team}` : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => loadForEdit(m)} className="px-3 py-1.5 rounded-lg bg-kaluli-navy text-white font-bold">
                    Edit
                  </button>
                  <button
                    onClick={() => handleUpdateField(m, 'status', m.status === 'upcoming' ? 'locked' : m.status === 'locked' ? 'finished' : 'upcoming')}
                    className="px-3 py-1.5 rounded-lg bg-kaluli-goldSoft text-kaluli-navy font-bold"
                  >
                    Ubah Status
                  </button>
                  {m.status === 'finished' && m.winner_team && (
                    <button onClick={() => handleCalculate(m.id)} className="px-3 py-1.5 rounded-lg bg-kaluli-red text-white font-bold">
                      Calculate Points
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`.field { padding: 0.6rem 0.75rem; border-radius: 0.75rem; border: 1px solid rgba(11,17,48,0.15); font-weight: 600; }`}</style>
    </div>
  )
}
