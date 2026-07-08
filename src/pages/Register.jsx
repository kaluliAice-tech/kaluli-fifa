import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import { useApp } from '../lib/AppState.jsx'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', email: '', instagram: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Nama dan Nomor WhatsApp wajib diisi.')
      return
    }
    setSubmitting(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Gagal register, coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="pb-10">
      <Header title="Join the Prediction" subtitle="Isi data singkat untuk mulai" back />

      <form onSubmit={handleSubmit} className="px-6 pt-5 flex flex-col gap-4">
        <Field label="Nama" required>
          <input
            value={form.name}
            onChange={update('name')}
            placeholder="Nama lengkap kamu"
            className="input"
          />
        </Field>

        <Field label="Nomor WhatsApp" required>
          <input
            value={form.phone}
            onChange={update('phone')}
            placeholder="08xxxxxxxxxx"
            inputMode="tel"
            className="input"
          />
        </Field>

        <Field label="Email" hint="opsional">
          <input
            value={form.email}
            onChange={update('email')}
            placeholder="nama@email.com"
            type="email"
            className="input"
          />
        </Field>

        <Field label="Instagram" hint="opsional">
          <input
            value={form.instagram}
            onChange={update('instagram')}
            placeholder="@username"
            className="input"
          />
        </Field>

        {error && <p className="text-xs font-bold text-kaluli-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full py-3.5 rounded-xl2 bg-kaluli-red text-white font-display font-bold text-base shadow-pop active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
        >
          {submitting ? 'Memproses...' : 'Masuk ke Dashboard'}
        </button>

        <p className="text-[11px] text-center text-kaluli-navy/40 font-semibold px-4">
          Tidak ada sistem taruhan, undian, atau pembelian wajib. Data kamu hanya dipakai untuk game ini.
        </p>
      </form>

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
