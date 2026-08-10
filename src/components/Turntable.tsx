import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import './Turntable.css'
import { usePlayer } from '../hooks/usePlayer'

const RECORD_ROTATION_SECONDS = 3.6

export function Turntable() {
  const { isPlaying, currentTrack, togglePlay } = usePlayer()
  const rotate = useMotionValue(0)
  const activeAnimation = useRef<ReturnType<typeof animate> | null>(null)

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

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
      <div className="nr-turntable-container">
        <div className="nr-turntable">
          <div className="nr-table-shadow" />
          <div className="nr-table-feet" />
          <div className="nr-black-base" />
          <div className="nr-black-side" />
          <div className="nr-table" />

          <div className="nr-record">
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

          <div
            className={`nr-tonearm-assembly ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlay}
            role="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="nr-axle-shadow" />
            <div className="nr-axle" />
            <div className="nr-arm">
              <div className="nr-needle" />
            </div>
          </div>
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
