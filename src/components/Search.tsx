import { type FormEvent, useEffect, useRef, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { formatDuration } from '../lib/formatDuration'
import { search, type SpotifyArtistResult, type SpotifySearchResults } from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'
import { ArtistView } from './ArtistView'

type SearchStatus = 'idle' | 'loading' | 'error'

const EMPTY_RESULTS: SpotifySearchResults = { tracks: [], albums: [], artists: [] }

export function Search() {
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const { playUri, playContextUri, deviceId } = usePlayer()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SpotifySearchResults>(EMPTY_RESULTS)
  const [status, setStatus] = useState<SearchStatus>('idle')
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtistResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setResults(EMPTY_RESULTS)
        setStatus('idle')
        setSelectedArtist(null)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    setStatus('loading')
    setSelectedArtist(null)
    try {
      const token = await getValidAccessToken()
      if (!token) throw new Error('Not authenticated')
      const searchResults = await search(trimmed, token)
      setResults(searchResults)
      setStatus('idle')
    } catch (err) {
      console.error('Spotify search failed:', err)
      setStatus('error')
    }
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (!value.trim()) {
      setResults(EMPTY_RESULTS)
      setStatus('idle')
      setSelectedArtist(null)
    }
  }

  const closeResults = () => {
    setResults(EMPTY_RESULTS)
    setSelectedArtist(null)
    inputRef.current?.blur()
  }

  const handleSelectTrack = (uri: string) => {
    playUri(uri)
    closeResults()
  }

  const handleSelectAlbum = (uri: string) => {
    playContextUri(uri)
    closeResults()
  }

  const handleSelectArtist = (artist: SpotifyArtistResult) => {
    setSelectedArtist(artist)
  }

  const handlePlayArtist = () => {
    if (!selectedArtist) return
    // Get Artist's Top Tracks is restricted for apps without Extended Quota
    // Mode, so play the artist as a context instead — the same trick
    // Spotify's own artist-page Play button uses under the hood.
    playContextUri(selectedArtist.uri)
    closeResults()
  }

  const hasResults =
    results.tracks.length > 0 || results.albums.length > 0 || results.artists.length > 0
  const isResultsOpen = status === 'error' || hasResults || selectedArtist !== null

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-md">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950/60 py-1.5 pl-4 pr-1.5 transition focus-within:border-accent"
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Search for a song, album, or artist…"
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

      {isResultsOpen && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 flex max-h-96 flex-col gap-3 overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-900/95 p-3 shadow-xl backdrop-blur">
          {selectedArtist ? (
            <ArtistView
              artist={selectedArtist}
              disabled={!deviceId}
              onBack={() => setSelectedArtist(null)}
              onPlay={handlePlayArtist}
            />
          ) : (
            <>
              {status === 'error' && (
                <p className="px-1 text-xs text-red-400">Search failed. Try again.</p>
              )}

              {results.artists.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Artists
                  </h3>
                  <ul className="flex flex-col divide-y divide-neutral-800/60 text-left">
                    {results.artists.map((artist) => (
                      <li key={artist.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectArtist(artist)}
                          className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800"
                        >
                          {artist.imageUrl ? (
                            <img
                              src={artist.imageUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-800" />
                          )}
                          <span className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm">{artist.name}</span>
                            <span className="truncate text-xs text-neutral-400">Artist</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.tracks.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Songs
                  </h3>
                  <ul className="flex flex-col divide-y divide-neutral-800/60 text-left">
                    {results.tracks.map((track) => (
                      <li key={track.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(track.uri)}
                          disabled={!deviceId}
                          className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {track.albumImageUrl && (
                            <img
                              src={track.albumImageUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded"
                            />
                          )}
                          <span className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm">{track.name}</span>
                            <span className="truncate text-xs text-neutral-400">
                              {track.artists}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-neutral-500">
                            {formatDuration(track.durationMs)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.albums.length > 0 && (
                <div className="flex flex-col gap-1">
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Albums
                  </h3>
                  <ul className="flex flex-col divide-y divide-neutral-800/60 text-left">
                    {results.albums.map((album) => (
                      <li key={album.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectAlbum(album.uri)}
                          disabled={!deviceId}
                          className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {album.imageUrl && (
                            <img
                              src={album.imageUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded"
                            />
                          )}
                          <span className="flex flex-1 flex-col overflow-hidden">
                            <span className="truncate text-sm">{album.name}</span>
                            <span className="truncate text-xs text-neutral-400">
                              {album.artists}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-neutral-500">
                            {album.releaseYear ?? `${album.trackCount} tracks`}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
