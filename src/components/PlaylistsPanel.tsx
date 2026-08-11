import { useEffect, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import {
  getShowLatestEpisodeUri,
  getUserPlaylists,
  getUserShows,
  type SpotifyPlaylist,
  type SpotifyShow,
} from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'
import { CollapsibleHeader } from './CollapsibleHeader'

type ContentMode = 'songs' | 'podcasts'
type LoadStatus = 'loading' | 'loaded' | 'error'

interface PlaylistsPanelProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function PlaylistsPanel({ collapsed, onToggleCollapsed }: PlaylistsPanelProps) {
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const { playUri, playContextUri, deviceId } = usePlayer()
  const [mode, setMode] = useState<ContentMode>('songs')
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [shows, setShows] = useState<SpotifyShow[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setStatus('loading')

    getValidAccessToken().then(async (token) => {
      if (!token) return
      try {
        if (mode === 'songs') {
          const items = await getUserPlaylists(token)
          if (!cancelled) setPlaylists(items)
        } else {
          const items = await getUserShows(token)
          if (!cancelled) setShows(items)
        }
        if (!cancelled) setStatus('loaded')
      } catch (err) {
        console.error(`Failed to fetch ${mode}:`, err)
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : `Failed to load ${mode}.`)
          setStatus('error')
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [getValidAccessToken, mode])

  const handlePlayShow = async (show: SpotifyShow) => {
    const token = await getValidAccessToken()
    if (!token) return
    try {
      const episodeUri = await getShowLatestEpisodeUri(show.id, token)
      if (episodeUri) playUri(episodeUri)
    } catch (err) {
      console.error('Failed to resolve latest episode:', err)
    }
  }

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <CollapsibleHeader
        label={mode === 'songs' ? 'Your playlists' : 'Your podcasts'}
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
      />

      {!collapsed && (
        <>
          <div className="flex gap-1 rounded-full bg-neutral-950/60 p-1 text-xs">
            {(['songs', 'podcasts'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                className={`flex-1 rounded-full py-1 capitalize transition ${
                  mode === option
                    ? 'bg-accent text-black'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {status === 'loading' && (
            <p className="text-xs text-neutral-500">Loading {mode}…</p>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-400">{errorMessage ?? `Failed to load ${mode}.`}</p>
          )}

          {status === 'loaded' && mode === 'songs' && playlists.length === 0 && (
            <p className="text-xs text-neutral-500">No playlists found.</p>
          )}

          {status === 'loaded' && mode === 'songs' && playlists.length > 0 && (
            <ul className="flex max-h-[80vh] flex-1 flex-col divide-y divide-neutral-800/60 overflow-y-auto">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button
                    type="button"
                    onClick={() => playContextUri(playlist.uri)}
                    disabled={!deviceId}
                    className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {playlist.imageUrl ? (
                      <img
                        src={playlist.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded bg-neutral-800" />
                    )}
                    <span className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm">{playlist.name}</span>
                      <span className="truncate text-xs text-neutral-400">
                        {playlist.trackCount} tracks
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status === 'loaded' && mode === 'podcasts' && shows.length === 0 && (
            <p className="text-xs text-neutral-500">No saved podcasts found.</p>
          )}

          {status === 'loaded' && mode === 'podcasts' && shows.length > 0 && (
            <ul className="flex max-h-[80vh] flex-1 flex-col divide-y divide-neutral-800/60 overflow-y-auto">
              {shows.map((show) => (
                <li key={show.id}>
                  <button
                    type="button"
                    onClick={() => handlePlayShow(show)}
                    disabled={!deviceId}
                    className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {show.imageUrl ? (
                      <img
                        src={show.imageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded bg-neutral-800" />
                    )}
                    <span className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm">{show.name}</span>
                      <span className="truncate text-xs text-neutral-400">{show.publisher}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
