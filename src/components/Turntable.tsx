import { motion } from 'framer-motion'
import './Turntable.css'
import { usePlayer } from '../hooks/usePlayer'

const RECORD_ROTATION_SECONDS = 3.6

export function Turntable() {
  const { isPlaying, currentTrack, togglePlay } = usePlayer()

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
            <motion.div
              className="nr-label"
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={
                isPlaying
                  ? { repeat: Infinity, ease: 'linear', duration: RECORD_ROTATION_SECONDS }
                  : { duration: 0.6, ease: 'easeOut' }
              }
            >
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
          <div className="mt-3 w-full text-center">
            <p className="text-sm font-medium">{currentTrack.name}</p>
            <p className="text-xs text-neutral-400">{currentTrack.artists}</p>
          </div>
        )}
      </div>
    </div>
  )
}
