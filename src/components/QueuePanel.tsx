import { useEffect } from 'react'
import { usePlayer } from '../hooks/usePlayer'

const POLL_INTERVAL_MS = 15_000

export function QueuePanel() {
  const { currentTrack, isPlaying, queue, refreshQueue, skipToQueueIndex, deviceId } =
    usePlayer()

  useEffect(() => {
    refreshQueue()
    const interval = isPlaying ? setInterval(refreshQueue, POLL_INTERVAL_MS) : undefined

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [refreshQueue, currentTrack?.id, isPlaying])

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Up next</h2>

      {currentTrack && (
        <div className="flex items-center gap-3 rounded-lg border border-accent/40 bg-accent/10 px-2 py-2">
          {currentTrack.albumImageUrl && (
            <img src={currentTrack.albumImageUrl} alt="" className="h-10 w-10 shrink-0 rounded" />
          )}
          <span className="flex flex-col overflow-hidden">
            <span className="truncate text-sm text-accent">{currentTrack.name}</span>
            <span className="truncate text-xs text-neutral-400">{currentTrack.artists}</span>
          </span>
        </div>
      )}

      {queue.length === 0 ? (
        <p className="text-xs text-neutral-500">Queue is empty.</p>
      ) : (
        <ul className="flex max-h-[70vh] flex-col divide-y divide-neutral-800/60 overflow-y-auto">
          {queue.map((track, index) => (
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
    </div>
  )
}
