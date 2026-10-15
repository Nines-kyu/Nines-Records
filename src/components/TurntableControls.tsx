import { useRef } from 'react'
import { usePlayer } from '../hooks/usePlayer'

export function TurntableControls() {
  const {
    isReady,
    isPlaying,
    togglePlay,
    next,
    previous,
    shuffle,
    repeatMode,
    volume,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer()
  const previousVolumeRef = useRef(volume || 0.5)

  const toggleMute = () => {
    if (volume > 0) {
      previousVolumeRef.current = volume
      setVolume(0)
    } else {
      setVolume(previousVolumeRef.current)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-6">
        <span
          className={`h-2 w-2 rounded-full transition ${
            isReady ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-neutral-700'
          }`}
          aria-hidden="true"
        />

        <button
          type="button"
          onClick={toggleShuffle}
          aria-label="Toggle shuffle"
          aria-pressed={shuffle}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
            shuffle
              ? 'border-accent text-accent'
              : 'border-neutral-700 text-neutral-300 hover:border-accent hover:text-accent'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M17 3l4 4-4 4V8.5h-3.6l-2-2H17V3zM3 6h5.4l9.2 9.2c.5.5 1.2.8 1.9.8H23v2h-3.5a4 4 0 0 1-2.83-1.17L7.4 7.5H3V6zm14 15v-3.5h-3.6l-2 2H3v-2h7.4l2-2H17v-3.5l4 4-4 4z" />
          </svg>
        </button>

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

        <button
          type="button"
          onClick={cycleRepeatMode}
          aria-label={
            repeatMode === 2 ? 'Repeat: track' : repeatMode === 1 ? 'Repeat: all' : 'Repeat: off'
          }
          aria-pressed={repeatMode !== 0}
          className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
            repeatMode !== 0
              ? 'border-accent text-accent'
              : 'border-neutral-700 text-neutral-300 hover:border-accent hover:text-accent'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
          {repeatMode === 2 && (
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold leading-none text-black">
              1
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition hover:text-neutral-200"
        >
          {volume === 0 ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M9 8v8h4l5 5V3l-5 5H9z" opacity="0.4" />
              <path
                d="M17 9l5 5m0-5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M9 8v8h4l5 5V3l-5 5H9z" />
              <path
                d="M18 9a5 5 0 0 1 0 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-800 accent-accent"
        />
      </div>
    </div>
  )
}
