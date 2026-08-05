import { usePlayer } from '../hooks/usePlayer'

export function PlayerDebugPanel() {
  const { isReady, isPlaying, currentTrack, togglePlay, next, previous } = usePlayer()

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 p-4">
      <p className="text-xs text-neutral-500">
        {isReady
          ? 'Connect device ready — pick "Nines九 Records" in the Spotify app to hand it playback.'
          : 'Connecting to Spotify…'}
      </p>

      {currentTrack && (
        <div className="flex items-center gap-3">
          {currentTrack.albumImageUrl && (
            <img src={currentTrack.albumImageUrl} alt="" className="h-12 w-12 rounded" />
          )}
          <div className="text-left">
            <p className="text-sm font-medium">{currentTrack.name}</p>
            <p className="text-xs text-neutral-400">{currentTrack.artists}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={previous}
          className="rounded-full border border-neutral-700 px-3 py-2 text-xs transition hover:border-accent hover:text-accent"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-black transition hover:bg-accent-hover"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full border border-neutral-700 px-3 py-2 text-xs transition hover:border-accent hover:text-accent"
        >
          Next
        </button>
      </div>
    </div>
  )
}
