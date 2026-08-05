import { type FormEvent, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { searchTracks, type SpotifyTrackResult } from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'

type SearchStatus = 'idle' | 'loading' | 'error'

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function Search() {
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const { playUri, deviceId } = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifyTrackResult[]>([])
  const [status, setStatus] = useState<SearchStatus>('idle')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setStatus('loading')
    try {
      const token = await getValidAccessToken()
      if (!token) throw new Error('Not authenticated')
      const tracks = await searchTracks(trimmed, token)
      setResults(tracks)
      setStatus('idle')
    } catch (err) {
      console.error('Spotify search failed:', err)
      setStatus('error')
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950/60 py-1.5 pl-4 pr-1.5 transition focus-within:border-accent"
      >
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a song…"
          className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-neutral-600"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-black transition hover:bg-accent-hover"
        >
          {status === 'loading' ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M10 4a6 6 0 104.472 10.06l4.234 4.233a1 1 0 001.415-1.414l-4.234-4.234A6 6 0 0010 4zm-4 6a4 4 0 118 0 4 4 0 01-8 0z" />
            </svg>
          )}
        </button>
      </form>

      {status === 'error' && <p className="text-xs text-red-400">Search failed. Try again.</p>}

      {results.length > 0 && (
        <ul className="flex max-h-80 flex-col divide-y divide-neutral-800/60 overflow-y-auto text-left">
          {results.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => playUri(track.uri)}
                disabled={!deviceId}
                className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {track.albumImageUrl && (
                  <img src={track.albumImageUrl} alt="" className="h-10 w-10 shrink-0 rounded" />
                )}
                <span className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-sm">{track.name}</span>
                  <span className="truncate text-xs text-neutral-400">{track.artists}</span>
                </span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {formatDuration(track.durationMs)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
