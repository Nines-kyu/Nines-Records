import { useEffect, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { getUserPlaylists, type SpotifyPlaylist } from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'
import { CollapsibleHeader } from './CollapsibleHeader'

type PlaylistsStatus = 'loading' | 'loaded' | 'error'

interface PlaylistsPanelProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function PlaylistsPanel({ collapsed, onToggleCollapsed }: PlaylistsPanelProps) {
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const { playContextUri, deviceId } = usePlayer()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [status, setStatus] = useState<PlaylistsStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getValidAccessToken().then(async (token) => {
      if (!token) return
      try {
        const items = await getUserPlaylists(token)
        if (!cancelled) {
          setPlaylists(items)
          setStatus('loaded')
        }
      } catch (err) {
        console.error('Failed to fetch playlists:', err)
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load playlists.')
          setStatus('error')
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [getValidAccessToken])

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <CollapsibleHeader
        label="Your playlists"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
      />

      {!collapsed && (
        <>
          {status === 'loading' && <p className="text-xs text-neutral-500">Loading playlists…</p>}

          {status === 'error' && (
            <p className="text-xs text-red-400">{errorMessage ?? 'Failed to load playlists.'}</p>
          )}

          {status === 'loaded' && playlists.length === 0 && (
            <p className="text-xs text-neutral-500">No playlists found.</p>
          )}

          {status === 'loaded' && playlists.length > 0 && (
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
        </>
      )}
    </div>
  )
}
