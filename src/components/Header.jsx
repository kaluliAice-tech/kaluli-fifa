import { useNavigate } from 'react-router-dom'

export default function Header({ title, subtitle, back = false }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 bg-kaluli-cream/95 backdrop-blur border-b border-kaluli-navy/5 px-5 pt-5 pb-4">
      <div className="flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Kembali"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm text-kaluli-navy shrink-0"
          >
            ←
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-kaluli-navy leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-kaluli-navy/60 font-semibold mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </header>
  )
}
