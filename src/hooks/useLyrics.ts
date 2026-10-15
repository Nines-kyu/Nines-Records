import { useEffect, useState } from 'react'
import { getLyrics, type Lyrics } from '../lib/lrclib'
import type { LrcLine } from '../lib/parseLrc'
import { usePlayerStore } from '../store/playerStore'

export type LyricsStatus = 'idle' | 'loading' | 'loaded' | 'not-found' | 'error'

export interface LyricsResult {
  status: LyricsStatus
  lyrics: Lyrics | null
  error: string | null
}

// Keyed by track id. `null` means LRCLIB has nothing for that track, so a
// replay doesn't refetch. Errors aren't cached — the next play retries.
const lyricsCache = new Map<string, Lyrics | null>()

const IDLE: LyricsResult = { status: 'idle', lyrics: null, error: null }
const LOADING: LyricsResult = { status: 'loading', lyrics: null, error: null }

export function useLyrics(): LyricsResult {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const [failure, setFailure] = useState<{ trackId: string; error: string } | null>(null)
  // Bumped when a fetch lands, so the render re-reads lyricsCache.
  const [, setFetchedTrackId] = useState<string | null>(null)

  // Episodes and ads have no lyrics on LRCLIB.
  const track = currentTrack?.type === 'track' ? currentTrack : null
  const trackId = track?.id
  const trackName = track?.name
  const artistName = track?.artists.split(', ')[0]
  const albumName = track?.albumName
  const durationSec = track ? Math.round(track.durationMs / 1000) : undefined

  // currentTrack is a new object on every SDK event, so depend on its
  // primitive fields — for a given track id these never change.
  useEffect(() => {
    if (
      !trackId ||
      trackName === undefined ||
      artistName === undefined ||
      albumName === undefined ||
      durationSec === undefined ||
      lyricsCache.has(trackId)
    ) {
      return
    }

    let cancelled = false
    getLyrics({ trackName, artistName, albumName, durationSec })
      .then((lyrics) => {
        lyricsCache.set(trackId, lyrics)
        if (!cancelled) setFetchedTrackId(trackId)
      })
      .catch((err) => {
        console.error('Failed to fetch lyrics:', err)
        if (!cancelled) {
          setFailure({
            trackId,
            error: err instanceof Error ? err.message : 'Failed to load lyrics.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [trackId, trackName, artistName, albumName, durationSec])

  if (!trackId) return IDLE

  if (lyricsCache.has(trackId)) {
    const lyrics = lyricsCache.get(trackId) ?? null
    return lyrics
      ? { status: 'loaded', lyrics, error: null }
      : { status: 'not-found', lyrics: null, error: null }
  }

  if (failure?.trackId === trackId) {
    return { status: 'error', lyrics: null, error: failure.error }
  }

  return LOADING
}

// Index of the line that should be highlighted at `positionMs`: the last
// line whose timestamp has been reached, or -1 before the first line.
export function findActiveLineIndex(lines: LrcLine[], positionMs: number): number {
  let low = 0
  let high = lines.length - 1
  let active = -1

  while (low <= high) {
    const mid = (low + high) >>> 1
    if (lines[mid].timeMs <= positionMs) {
      active = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return active
}
