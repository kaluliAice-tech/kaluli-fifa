import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/AppState.jsx'

const STEPS = [
  { icon: '🎯', text: 'Pilih 1 match dari ronde yang sedang aktif.' },
  { icon: '⏱️', text: 'Submit prediksi sebelum kick-off.' },
  { icon: '✅', text: 'Jika prediksi benar, dapat poin.' },
  { icon: '🔥', text: 'Lanjut benar di ronde berikutnya, poin naik dengan multiplier.' },
  { icon: '🏆', text: 'Leaderboard tertinggi menang exclusive merch Kaluli.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useApp()

  return (
    <div className="pb-10">
      {/* Hero */}
      <section className="relative bg-kaluli-hero text-white px-6 pt-12 pb-10 overflow-hidden">
        <div className="absolute -top-10 -right-16 w-56 h-56 rounded-full bg-kaluli-red/30 blur-2xl" aria-hidden="true" />
        <div className="absolute bottom-0 -left-10 w-40 h-40 rounded-full bg-kaluli-gold/20 blur-2xl" aria-hidden="true" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5">
            <span className="w-2 h-2 rounded-full bg-kaluli-gold" />
            <span className="text-[11px] font-bold tracking-wide">KALULI ICE CREAM × FIFA WORLD CUP 2026</span>
          </div>

          <h1 className="font-display text-[32px] leading-[1.15] font-extrabold mb-3">
            Predict the Match.
            <br />
            <span className="text-kaluli-gold">Choose Your Victory Moment.</span>
          </h1>

          <p className="text-white/75 text-sm leading-relaxed mb-7">
            Pilih 1 match, prediksi pemenangnya, kumpulkan poin, dan menangkan exclusive merch dari Kaluli.
          </p>

          <button
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            className="w-full py-3.5 rounded-xl2 bg-kaluli-red text-white font-display font-bold text-base shadow-pop active:translate-y-1 active:shadow-none transition-all"
          >
            Start Predicting
          </button>
        </div>
      </section>

      {/* How to play */}
      <section className="px-6 pt-8">
        <h2 className="font-display text-lg font-bold text-kaluli-navy mb-1">How to Play</h2>
        <p className="text-xs text-kaluli-navy/50 font-semibold mb-4">Simpel, cepat, dan seru dari babak 16 besar sampai final.</p>

        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 bg-white rounded-xl2 border border-kaluli-navy/5 shadow-sm p-3.5">
              <span className="w-9 h-9 shrink-0 rounded-full bg-kaluli-goldSoft flex items-center justify-center text-base">
                {step.icon}
              </span>
              <p className="text-sm text-kaluli-navy/80 font-semibold leading-snug pt-1.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-6 pt-8">
        <div className="rounded-xl2 bg-kaluli-navy text-white p-5 flex items-center gap-4">
          <span className="text-3xl">🍦</span>
          <p className="text-sm font-semibold leading-snug">
            Top scorer wins <span className="text-kaluli-gold font-bold">exclusive Kaluli merch</span>. Yuk mulai prediksi sekarang!
          </p>
        </div>
      </section>

      <section className="px-6 pt-6 flex flex-col gap-2.5">
        <button
          onClick={() => navigate('/bracket')}
          className="w-full py-3 rounded-xl2 bg-white border border-kaluli-navy/10 text-kaluli-navy font-bold text-sm shadow-sm"
        >
          Lihat Bracket 🏆
        </button>
        <button
          onClick={() => navigate('/rules')}
          className="w-full py-3 rounded-xl2 bg-white border border-kaluli-navy/10 text-kaluli-navy font-bold text-sm shadow-sm"
        >
          Baca Rules 📋
        </button>
      </section>
    </div>
  )
}
