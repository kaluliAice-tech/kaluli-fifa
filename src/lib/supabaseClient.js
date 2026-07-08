import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If env vars are not set, the app runs in "preview mode" using dummy data
// instead of talking to Supabase. This lets `npm run dev` work immediately
// without any backend configured.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Kaluli] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum di-set. ' +
      'Aplikasi berjalan dalam PREVIEW MODE memakai dummy data. ' +
      'Lihat README.md untuk cara setting environment variable.'
  )
}
