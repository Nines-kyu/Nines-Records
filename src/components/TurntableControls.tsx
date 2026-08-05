import { usePlayer } from '../hooks/usePlayer'

export function TurntableControls() {
  const { isReady, isPlaying, togglePlay, next, previous } = usePlayer()

  return (
    <div className="flex items-center gap-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-4">
      <span
        className={`h-2 w-2 rounded-full transition ${
          isReady ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-neutral-700'
        }`}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={previous}
        aria-label="Previous track"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition hover:border-accent hover:text-accent active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg transition hover:bg-accent-hover active:scale-95"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <rect x="6" y="5" width="4" height="14" />
            <rect x="14" y="5" width="4" height="14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={next}
        aria-label="Next track"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 transition hover:border-accent hover:text-accent active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
        </svg>
      </button>
    </div>
  )
}
