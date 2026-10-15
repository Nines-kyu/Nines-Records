import { useEffect, useState } from 'react'
import { usePlayerStore, type PlayerTrack } from '../store/playerStore'

interface PlaybackPositionOptions {
  // Minimum time between updates while playing. 0 (the default) updates
  // every animation frame.
  intervalMs?: number
}

interface LivePosition {
  positionMs: number
  currentTrack: PlayerTrack
  value: number
}

// Spotify only pushes a fresh position on discrete events (play, pause,
// seek, track change), not continuously — interpolate locally from the
// last known position/timestamp, and re-anchor whenever a real update
// lands in the store.
export function usePlaybackPosition({ intervalMs = 0 }: PlaybackPositionOptions = {}): number {
  const positionMs = usePlayerStore((s) => s.positionMs)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const [live, setLive] = useState<LivePosition | null>(null)

  const durationMs = currentTrack?.durationMs
  const clampToTrack = (ms: number) =>
    durationMs ? Math.min(Math.max(ms, 0), durationMs) : Math.max(ms, 0)

  useEffect(() => {
    if (!isPlaying || !currentTrack) return

    const base = { position: positionMs, timestamp: performance.now() }
    let lastEmitAt = -Infinity
    let lastValue: number | null = null
    let frame: number
    const tick = () => {
      const now = performance.now()
      if (now - lastEmitAt >= intervalMs) {
        const elapsed = now - base.timestamp
        const value = durationMs
          ? Math.min(base.position + elapsed, durationMs)
          : base.position + elapsed
        // Once clamped at the end of the track the value stops changing —
        // skip the redundant re-render.
        if (value !== lastValue) {
          lastEmitAt = now
          lastValue = value
          setLive({ positionMs, currentTrack, value })
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [isPlaying, positionMs, currentTrack, durationMs, intervalMs])

  // `live` may still hold a value from a previous anchor until the new
  // loop's first tick — only trust it if it was computed from the current
  // store state. applyState creates a new currentTrack object on every SDK
  // event, so this identity check catches each re-anchor.
  if (isPlaying && live && live.currentTrack === currentTrack && live.positionMs === positionMs) {
    return live.value
  }
  return clampToTrack(positionMs)
}
