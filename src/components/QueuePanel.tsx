import { useEffect, useState } from 'react'
import { usePlayer } from '../hooks/usePlayer'
import { getShowEpisodes, type SpotifyEpisode } from '../lib/spotifyApi'
import { useAuthStore } from '../store/authStore'
import { CollapsibleHeader } from './CollapsibleHeader'

const POLL_INTERVAL_MS = 15_000

interface QueuePanelProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

function getShowIdFromUri(uri: string | null): string | null {
  if (!uri?.startsWith('spotify:show:')) return null
  return uri.split(':')[2] ?? null
}

export function QueuePanel({ collapsed, onToggleCollapsed }: QueuePanelProps) {
  const { currentTrack, isPlaying, upNextQueue, refreshQueue, skipToQueueIndex, playUri, deviceId } =
    usePlayer()
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const [showEpisodes, setShowEpisodes] = useState<SpotifyEpisode[]>([])

  useEffect(() => {
    refreshQueue()
    const interval = isPlaying ? setInterval(refreshQueue, POLL_INTERVAL_MS) : undefined

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [refreshQueue, currentTrack?.id, isPlaying])

  const showId = currentTrack?.type === 'episode' ? getShowIdFromUri(currentTrack.albumUri) : null

  useEffect(() => {
    if (!showId) {
      setShowEpisodes([])
      return
    }

    let cancelled = false
    getValidAccessToken().then(async (token) => {
      if (!token) return
      try {
        const episodes = await getShowEpisodes(showId, token)
        if (!cancelled) setShowEpisodes(episodes)
      } catch (err) {
        console.error('Failed to fetch show episodes:', err)
        if (!cancelled) setShowEpisodes([])
      }
    })

    return () => {
      cancelled = true
    }
  }, [showId, getValidAccessToken])

  // Spotify's real queue is empty after playing a single episode (same
  // quirk as a single non-playlist song) — fall back to the show's own
  // episode list, numbered, for everything after the one playing now.
  const upcomingEpisodes = (() => {
    if (!showId || !currentTrack) return []
    const currentIndex = showEpisodes.findIndex((episode) => episode.id === currentTrack.id)
    if (currentIndex === -1) return []
    return showEpisodes.slice(currentIndex + 1)
  })()

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <CollapsibleHeader label="Up next" collapsed={collapsed} onToggle={onToggleCollapsed} />

      {!collapsed && (
        <>
          {currentTrack && (
            <div className="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-2 py-2">
              {currentTrack.albumImageUrl && (
                <img
                  src={currentTrack.albumImageUrl}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded"
                />
              )}
              <span className="flex flex-col overflow-hidden">
                <span className="truncate text-sm text-accent">{currentTrack.name}</span>
                <span className="truncate text-xs text-neutral-400">{currentTrack.artists}</span>
              </span>
            </div>
          )}

          {showId ? (
            upcomingEpisodes.length === 0 ? (
              <p className="text-xs text-neutral-500">No more episodes.</p>
            ) : (
              <ul className="flex max-h-[70vh] flex-1 flex-col divide-y divide-neutral-800/60 overflow-y-auto">
                {upcomingEpisodes.map((episode, index) => (
                  <li key={episode.id}>
                    <button
                      type="button"
                      onClick={() => playUri(episode.uri)}
                      disabled={!deviceId}
                      className="flex w-full items-center gap-3 px-1 py-2 text-left transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="w-4 shrink-0 text-xs text-neutral-500">{index + 1}</span>
                      {episode.imageUrl && (
                        <img
                          src={episode.imageUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded"
                        />
                      )}
                      <span className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm">{episode.name}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : upNextQueue.length === 0 ? (
            <p className="text-xs text-neutral-500">Queue is empty.</p>
          ) : (
            <ul className="flex max-h-[70vh] flex-1 flex-col divide-y divide-neutral-800/60 overflow-y-auto">
              {upNextQueue.map(({ track, index }) => (
                <li key={`${track.id}-${index}`}>
                  <button
                    type="button"
                    onClick={() => skipToQueueIndex(index)}
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
                    <span className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm">{track.name}</span>
                      <span className="truncate text-xs text-neutral-400">{track.artists}</span>
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
