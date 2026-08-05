import { type FormEvent, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { searchTracks, type SpotifyTrackResult } from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'

type SearchStatus = 'idle' | 'loading' | 'error'

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
    <div className="flex w-full max-w-md flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for a song…"
          className="flex-1 rounded-full border border-neutral-700 bg-transparent px-4 py-2 text-sm outline-none transition focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-black transition hover:bg-accent-hover"
        >
          Search
        </button>
      </form>

      {status === 'error' && <p className="text-xs text-red-400">Search failed. Try again.</p>}

      {results.length > 0 && (
        <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto text-left">
          {results.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                onClick={() => playUri(track.uri)}
                disabled={!deviceId}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {track.albumImageUrl && (
                  <img src={track.albumImageUrl} alt="" className="h-10 w-10 shrink-0 rounded" />
                )}
                <span className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm">{track.name}</span>
                  <span className="truncate text-xs text-neutral-400">{track.artists}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
