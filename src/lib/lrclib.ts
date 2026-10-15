import { type LrcLine, parseLrc } from './parseLrc'

const LRCLIB_API = 'https://lrclib.net/api'

// How far a search result's duration may drift from the Spotify track's
// and still count as the same recording.
const DURATION_TOLERANCE_SEC = 3

export interface Lyrics {
  syncedLines: LrcLine[] | null
  plainLyrics: string | null
  instrumental: boolean
}

export interface LyricsQuery {
  trackName: string
  artistName: string
  albumName: string
  durationSec: number
}

// LRCLIB's record shape — fields other than these are ignored.
interface LrclibRecord {
  id: number
  trackName: string
  artistName: string
  duration: number
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

function toLyrics(record: LrclibRecord): Lyrics {
  const syncedLines = record.syncedLyrics ? parseLrc(record.syncedLyrics) : []

  return {
    syncedLines: syncedLines.length > 0 ? syncedLines : null,
    plainLyrics: record.plainLyrics || null,
    instrumental: record.instrumental,
  }
}

// No custom headers anywhere in here — LRCLIB allows any origin, and a
// plain GET avoids a CORS preflight.
export async function getLyrics(query: LyricsQuery): Promise<Lyrics | null> {
  const params = new URLSearchParams({
    track_name: query.trackName,
    artist_name: query.artistName,
    album_name: query.albumName,
    duration: String(query.durationSec),
  })

  const response = await fetch(`${LRCLIB_API}/get?${params.toString()}`)

  if (response.status === 404) {
    return searchLyrics(query)
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch lyrics: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as LrclibRecord
  return toLyrics(data)
}

// The exact-match endpoint misses when Spotify's album name differs from
// LRCLIB's (deluxe editions, singles, compilations), so fall back to a
// track + artist search and pick the closest-length recording.
async function searchLyrics(query: LyricsQuery): Promise<Lyrics | null> {
  const params = new URLSearchParams({
    track_name: query.trackName,
    artist_name: query.artistName,
  })

  const response = await fetch(`${LRCLIB_API}/search?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Lyrics search failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as LrclibRecord[]

  let best: LrclibRecord | null = null
  let bestDiff = Infinity
  for (const record of data) {
    const diff = Math.abs(record.duration - query.durationSec)
    if (diff > DURATION_TOLERANCE_SEC) continue
    // On equal distance, prefer a record that actually has synced lyrics.
    const isBetter =
      diff < bestDiff || (diff === bestDiff && !best?.syncedLyrics && !!record.syncedLyrics)
    if (isBetter) {
      best = record
      bestDiff = diff
    }
  }

  return best ? toLyrics(best) : null
}
