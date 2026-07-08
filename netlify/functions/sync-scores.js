// Netlify Function: sync-scores
//
// Pulls FIFA World Cup 2026 knockout fixtures (Round of 16 -> Final) from
// API-Football (api-sports.io) and upserts them into the Supabase `matches`
// table. Runs server-side only, so the sports API key and the Supabase
// service role key never reach the browser.
//
// Trigger it either:
//   - manually, from the /admin page ("Sync dari API" button), or
//   - on a schedule, via an external cron pinger (e.g. cron-job.org) hitting
//     this function's URL every few minutes during match days, since
//     Netlify's built-in Scheduled Functions require a paid plan.
//
// Required environment variables (set in Netlify dashboard, NOT prefixed
// with VITE_ so they stay server-side only):
//   SPORTS_API_KEY            -> your API-Football key
//   SPORTS_API_PROVIDER       -> "api-football" (only provider implemented so far)
//   SUPABASE_URL              -> same value as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY -> Supabase service role key (Project Settings > API)
//                                 NEVER expose this key to the frontend.

const { createClient } = require('@supabase/supabase-js')

// Game scope is Quarter Final (8 besar) through Final only. Round of 16 and
// earlier rounds are intentionally NOT in this map, so fixtures from those
// rounds are automatically skipped by the filter below.
const ROUND_MAP = {
  'Quarterfinals': 'quarter_final',
  'Quarter-finals': 'quarter_final',
  'Semifinals': 'semi_final',
  'Semi-finals': 'semi_final',
  'Final': 'final',
}

const STATUS_MAP = {
  NS: 'upcoming', // Not Started
  TBD: 'upcoming',
  '1H': 'locked',
  HT: 'locked',
  '2H': 'locked',
  ET: 'locked',
  BT: 'locked',
  P: 'locked',
  SUSP: 'locked',
  INT: 'locked',
  LIVE: 'locked',
  FT: 'finished',
  AET: 'finished',
  PEN: 'finished',
  PST: 'upcoming',
  CANC: 'upcoming',
  ABD: 'upcoming',
  AWD: 'finished',
  WO: 'finished',
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  const apiKey = process.env.SPORTS_API_KEY
  const provider = process.env.SPORTS_API_PROVIDER || 'api-football'
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!apiKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'SPORTS_API_KEY belum di-set di Netlify env vars.' }) }
  }
  if (!supabaseUrl || !serviceRoleKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di Netlify env vars.' }),
    }
  }
  if (provider !== 'api-football') {
    return { statusCode: 400, body: JSON.stringify({ error: `Provider "${provider}" belum didukung di function ini.` }) }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    const fixtures = await fetchApiFootballFixtures(apiKey)
    const knockoutFixtures = fixtures.filter((f) => ROUND_MAP[f.league.round])

    const rows = knockoutFixtures.map(mapFixtureToMatchRow)

    if (rows.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Tidak ada fixture knockout ditemukan (mungkin belum masuk Round of 16).', synced: 0 }),
      }
    }

    const { error } = await supabase.from('matches').upsert(rows, { onConflict: 'id' })
    if (error) throw error

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Berhasil sync ${rows.length} match.`, synced: rows.length }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Sync gagal.' }) }
  }
}

async function fetchApiFootballFixtures(apiKey) {
  const url = 'https://v3.football.api-sports.io/fixtures?league=1&season=2026'
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey },
  })
  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`)
  }
  const json = await res.json()
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(json.errors)}`)
  }
  return json.response || []
}

function mapFixtureToMatchRow(fixture) {
  const round = ROUND_MAP[fixture.league.round]
  const statusShort = fixture.fixture.status?.short
  const status = STATUS_MAP[statusShort] || 'upcoming'

  const homeName = fixture.teams?.home?.name || 'TBD'
  const awayName = fixture.teams?.away?.name || 'TBD'
  const homeScore = fixture.goals?.home ?? null
  const awayScore = fixture.goals?.away ?? null

  let winnerTeam = null
  if (fixture.teams?.home?.winner === true) winnerTeam = homeName
  else if (fixture.teams?.away?.winner === true) winnerTeam = awayName

  return {
    id: `af-${fixture.fixture.id}`,
    round,
    team_a: homeName,
    team_b: awayName,
    team_a_flag: countryCodeToFlagEmoji(fixture.teams?.home?.name),
    team_b_flag: countryCodeToFlagEmoji(fixture.teams?.away?.name),
    team_a_score: homeScore,
    team_b_score: awayScore,
    winner_team: winnerTeam,
    kickoff_time: fixture.fixture.date,
    status,
    source_updated_at: new Date().toISOString(),
    official_source_url: 'https://www.api-football.com/',
  }
}

// Best-effort country name -> flag emoji. Falls back to a white flag if the
// name isn't in the map (e.g. still-TBD placeholder names). Extend this map
// as needed for teams not listed here.
const COUNTRY_FLAGS = {
  Argentina: '🇦🇷', Australia: '🇦🇺', Belgium: '🇧🇪', Brazil: '🇧🇷', Canada: '🇨🇦',
  Colombia: '🇨🇴', Croatia: '🇭🇷', Egypt: '🇪🇬', England: '🏴', France: '🇫🇷',
  Germany: '🇩🇪', Ghana: '🇬🇭', Japan: '🇯🇵', Mexico: '🇲🇽', Morocco: '🇲🇦',
  Netherlands: '🇳🇱', Norway: '🇳🇴', Paraguay: '🇵🇾', Portugal: '🇵🇹', Senegal: '🇸🇳',
  'South Korea': '🇰🇷', Spain: '🇪🇸', Switzerland: '🇨🇭', USA: '🇺🇸', 'United States': '🇺🇸',
  Algeria: '🇩🇿', Austria: '🇦🇹', 'Cape Verde': '🇨🇻', 'Cabo Verde': '🇨🇻',
}

function countryCodeToFlagEmoji(name) {
  return COUNTRY_FLAGS[name] || '🏳️'
}
