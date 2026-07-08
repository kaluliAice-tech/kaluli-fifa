export default function FlagIcon({ flag, size = 'md' }) {
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-11 h-11 text-2xl',
    lg: 'w-14 h-14 text-3xl',
  }
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-kaluli-mist border border-kaluli-navy/10 shadow-sm ${sizes[size]}`}
      aria-hidden="true"
    >
      {flag || '🏳️'}
    </span>
  )
}
