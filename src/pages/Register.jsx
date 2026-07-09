import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useApp } from '../lib/AppState.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { register, login } = useApp()
  const [mode, setMode] = useState('register') // 'register' | 'login'
  const [form, setForm] = useState({ name: '', username: '', password: '', phone: '', email: '', instagram: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setError('Nama, Username, dan Password wajib diisi.')
      return
    }
    if (form.password.length < 4) {
      setError('Password minimal 4 karakter.')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Gagal daftar, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username.trim() || !form.password.trim()) {
      setError('Username dan Password wajib diisi.')
      return
    }
    setSubmitting(true)
    try {
      await login({ username: form.username, password: form.password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Gagal login, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-10">
      <Header
        title={mode === 'register' ? 'Join the Prediction' : 'Masuk ke Akun'}
        subtitle={mode === 'register' ? 'Buat akun baru untuk mulai prediksi' : 'Masukkan username & password kamu'}
        back
      />

      {/* Tab switcher */}
      <div className="px-6 pt-4">
        <div className="flex bg-kaluli-mist rounded-xl2 p-1 gap-1">
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              mode === 'register' ? 'bg-white text-kaluli-red shadow-sm' : 'text-kaluli-navy/50'
            }`}
          >
            Daftar Baru
          </button>
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              mode === 'login' ? 'bg-white text-kaluli-red shadow-sm' : 'text-kaluli-navy/50'
            }`}
          >
            Sudah Punya Akun
          </button>
        </div>
      </div>

      {mode === 'register' ? (
        <form onSubmit={handleRegister} className="px-6 pt-5 flex flex-col gap-4">
          <Field label="Nama" required>
            <input value={form.name} onChange={update('name')} placeholder="Nama lengkap kamu" className="input" />
          </Field>

          <Field label="Username / ID" required>
            <input
              value={form.username}
              onChange={update('username')}
              placeholder="Bebas, tanpa spasi (misal: budi_2026)"
              className="input"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Password" required>
            <input
              value={form.password}
              onChange={update('password')}
              placeholder="Minimal 4 karakter"
              type="password"
              className="input"
            />
          </Field>

          <Field label="Nomor WhatsApp" hint="opsional">
            <input value={form.phone} onChange={update('phone')} placeholder="08xxxxxxxxxx" inputMode="tel" className="input" />
          </Field>

          <Field label="Email" hint="opsional">
            <input value={form.email} onChange={update('email')} placeholder="nama@email.com" type="email" className="input" />
          </Field>

          <Field label="Instagram" hint="opsional">
            <input value={form.instagram} onChange={update('instagram')} placeholder="@username" className="input" />
          </Field>

          {error && <p className="text-xs font-bold text-kaluli-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full py-3.5 rounded-xl2 bg-kaluli-red text-white font-display font-bold text-base shadow-pop active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Daftar & Mulai Prediksi'}
          </button>

          <p className="text-[11px] text-center text-kaluli-navy/40 font-semibold px-4">
            Tidak ada sistem taruhan, undian, atau pembelian wajib. Data kamu hanya dipakai untuk game ini.
          </p>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="px-6 pt-5 flex flex-col gap-4">
          <Field label="Username / ID" required>
            <input value={form.username} onChange={update('username')} placeholder="Username kamu" className="input" autoCapitalize="none" />
          </Field>

          <Field label="Password" required>
            <input value={form.password} onChange={update('password')} placeholder="Password kamu" type="password" className="input" />
          </Field>

          {error && <p className="text-xs font-bold text-kaluli-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full py-3.5 rounded-xl2 bg-kaluli-red text-white font-display font-bold text-base shadow-pop active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      )}

      <style>{`.input { width:100%; padding: 0.85rem 1rem; border-radius: 0.9rem; border: 1px solid rgba(11,17,48,0.12); background:#fff; font-weight:600; font-size:0.9rem; color:#161A2E; } .input:focus { outline:none; border-color:#ED1651; box-shadow: 0 0 0 3px rgba(237,22,81,0.12); }`}</style>
    </div>
  )
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-kaluli-navy/70 mb-1.5 flex items-center gap-1.5">
        {label}
        {required && <span className="text-kaluli-red">*</span>}
        {hint && <span className="text-kaluli-navy/30 font-semibold">({hint})</span>}
      </span>
      {children}
    </label>
  )
}
