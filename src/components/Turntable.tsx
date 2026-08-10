import { animate, motion, useMotionValue, useSpring } from 'framer-motion'
import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import './Turntable.css'
import { usePlayer } from '../hooks/usePlayer'
import { useVinylCrackle } from '../hooks/useVinylCrackle'

const RECORD_ROTATION_SECONDS = 3.6
const PROGRESS_RING_RADIUS = 147
const TONEARM_LIFT_Y = -14
const TONEARM_REST_DEG = 0
const TONEARM_START_DEG = 32
const TONEARM_END_DEG = 50
const TONEARM_PIVOT_OFFSET = 29
// Movement below this, in degrees, is treated as a click rather than a
// deliberate seek drag.
const DRAG_THRESHOLD_DEG = 1.5

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function Turntable() {
  const { isPlaying, currentTrack, positionMs, togglePlay, seek } = usePlayer()
  const { enabled: crackleEnabled, toggle: toggleCrackle } = useVinylCrackle(isPlaying)
  const rotate = useMotionValue(0)
  const activeAnimation = useRef<ReturnType<typeof animate> | null>(null)
  const progress = useMotionValue(0)
  const previousTrackId = useRef<string | undefined>(undefined)

  const tonearmRef = useRef<HTMLDivElement>(null)
  const armRotateTarget = useMotionValue(TONEARM_REST_DEG)
  const armRotateSpring = useSpring(armRotateTarget, { stiffness: 140, damping: 18 })
  const liftY = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const wasDraggedRef = useRef(false)
  const dragStartRef = useRef({ pointerAngleDeg: 0, armRotateDeg: TONEARM_START_DEG })

  useEffect(() => {
    if (isPlaying) {
      // Continue spinning from wherever the label currently sits rather
      // than resetting to 0 — 360° keyframes loop seamlessly since the
      // start/end angles look identical.
      const current = rotate.get()
      activeAnimation.current = animate(rotate, [current, current + 360], {
        repeat: Infinity,
        repeatType: 'loop',
        ease: 'linear',
        duration: RECORD_ROTATION_SECONDS,
      })
    } else {
      // Freeze in place instead of animating back to the original
      // orientation.
      activeAnimation.current?.stop()
    }

    return () => activeAnimation.current?.stop()
  }, [isPlaying, rotate])

  useEffect(() => {
    const durationMs = currentTrack?.durationMs

    if (!durationMs) {
      progress.set(0)
      if (!isDraggingRef.current) armRotateTarget.set(TONEARM_REST_DEG)
      return
    }

    if (!isPlaying) {
      progress.set(Math.min(positionMs / durationMs, 1))
      if (!isDraggingRef.current) armRotateTarget.set(TONEARM_REST_DEG)
      return
    }

    // Spotify only pushes a fresh position on discrete events (play,
    // pause, seek, track change), not continuously — interpolate locally
    // from the last known position/timestamp so the ring and tonearm
    // sweep smoothly, and let it re-anchor whenever a real update lands.
    const base = { position: positionMs, timestamp: performance.now() }
    let frame: number
    const tick = () => {
      const elapsed = performance.now() - base.timestamp
      const ratio = Math.min((base.position + elapsed) / durationMs, 1)
      progress.set(ratio)
      if (!isDraggingRef.current) {
        armRotateTarget.set(TONEARM_START_DEG + ratio * (TONEARM_END_DEG - TONEARM_START_DEG))
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frame)
  }, [isPlaying, positionMs, currentTrack?.durationMs, progress, armRotateTarget])

  useEffect(() => {
    const trackId = currentTrack?.id
    const changed =
      previousTrackId.current !== undefined && previousTrackId.current !== trackId
    previousTrackId.current = trackId

    if (!changed || !trackId) return

    // Briefly lift the tonearm off the record on a track change, then let
    // it settle back down — distinct from the plain play/pause rotation.
    animate(liftY, [0, TONEARM_LIFT_Y, 0], { duration: 0.6, ease: 'easeOut' })
  }, [currentTrack?.id, liftY])

  const getPivot = (): { x: number; y: number } | null => {
    const el = tonearmRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return { x: rect.left + TONEARM_PIVOT_OFFSET, y: rect.top + TONEARM_PIVOT_OFFSET }
  }

  const pointerAngleDeg = (
    event: ReactPointerEvent | PointerEvent,
    pivot: { x: number; y: number },
  ): number => (Math.atan2(event.clientY - pivot.y, event.clientX - pivot.x) * 180) / Math.PI

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!currentTrack?.durationMs) return
    const pivot = getPivot()
    if (!pivot) return

    event.currentTarget.setPointerCapture(event.pointerId)
    isDraggingRef.current = true
    wasDraggedRef.current = false
    setIsDragging(true)
    dragStartRef.current = {
      pointerAngleDeg: pointerAngleDeg(event, pivot),
      armRotateDeg: armRotateTarget.get(),
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    const pivot = getPivot()
    if (!pivot) return

    const angle = pointerAngleDeg(event, pivot)
    const delta = angle - dragStartRef.current.pointerAngleDeg
    if (Math.abs(delta) > DRAG_THRESHOLD_DEG) wasDraggedRef.current = true

    armRotateTarget.set(
      clamp(dragStartRef.current.armRotateDeg + delta, TONEARM_START_DEG, TONEARM_END_DEG),
    )
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const durationMs = currentTrack?.durationMs
    if (!durationMs || !wasDraggedRef.current) return

    const ratio = clamp(
      (armRotateTarget.get() - TONEARM_START_DEG) / (TONEARM_END_DEG - TONEARM_START_DEG),
      0,
      1,
    )
    seek(Math.round(ratio * durationMs))
  }

  const handleClick = () => {
    if (wasDraggedRef.current) {
      wasDraggedRef.current = false
      return
    }
    togglePlay()
  }

  return (
    <div className="relative w-full rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
      <button
        type="button"
        onClick={toggleCrackle}
        aria-label="Toggle vinyl crackle"
        aria-pressed={crackleEnabled}
        className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border transition active:scale-95 ${
          crackleEnabled
            ? 'border-accent text-accent'
            : 'border-neutral-700 text-neutral-500 hover:border-accent hover:text-accent'
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M3 10v4h4l5 5V5L7 10H3z" />
          <path
            d="M16.5 8.5a5 5 0 0 1 0 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="nr-turntable-container">
        <div className="nr-turntable">
          <div className="nr-table-shadow" />
          <div className="nr-table-feet" />
          <div className="nr-black-base" />
          <div className="nr-black-side" />
          <div className="nr-table" />

          <div className="nr-record">
            {currentTrack && (
              <svg className="nr-progress-ring" viewBox="0 0 300 300">
                <circle
                  className="nr-progress-ring-track"
                  cx="150"
                  cy="150"
                  r={PROGRESS_RING_RADIUS}
                />
                <motion.circle
                  className="nr-progress-ring-fill"
                  cx="150"
                  cy="150"
                  r={PROGRESS_RING_RADIUS}
                  style={{ pathLength: progress }}
                />
              </svg>
            )}

            <motion.div className="nr-label" style={{ rotate }}>
              {currentTrack?.albumImageUrl && (
                <img src={currentTrack.albumImageUrl} alt="" className="nr-logo-center" />
              )}
            </motion.div>
          </div>

          <div className="nr-axis-shadow" />
          <div className="nr-axis" />

          <div className="nr-base" onClick={togglePlay} />
          <div className="nr-lever" />

          <motion.div
            ref={tonearmRef}
            className="nr-tonearm-assembly"
            style={{ rotate: isDragging ? armRotateTarget : armRotateSpring, y: liftY }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={handleClick}
            role="button"
            aria-label={
              isPlaying ? 'Pause, or drag to seek' : 'Play, or drag to seek'
            }
          >
            <div className="nr-axle-shadow" />
            <div className="nr-axle" />
            <div className="nr-arm">
              <div className="nr-needle" />
            </div>
          </motion.div>
        </div>

        {currentTrack && (
          <div className="nr-track-info mt-3 w-full text-center">
            <p className="text-sm font-medium">{currentTrack.name}</p>
            <p className="text-xs text-neutral-400">{currentTrack.artists}</p>
          </div>
        )}
      </div>
    </div>
  )
}
