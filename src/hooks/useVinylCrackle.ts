import { useEffect, useRef, useState } from 'react'

const CRACKLE_BUFFER_SECONDS = 4
const CRACKLE_VOLUME = 0.05

function createCrackleBuffer(context: AudioContext): AudioBuffer {
  const { sampleRate } = context
  const length = sampleRate * CRACKLE_BUFFER_SECONDS
  const buffer = context.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i += 1) {
    let sample = (Math.random() * 2 - 1) * 0.15
    // Occasional sharp pops, like dust and scratches on a real record.
    if (Math.random() < 0.0006) {
      sample += (Math.random() * 2 - 1) * 0.8
    }
    data[i] = sample
  }

  return buffer
}

// Loops a synthesized hiss-and-pop texture while `enabled && active` — no
// external audio asset needed, and it automatically stops when playback
// pauses even if the toggle is left on.
export function useVinylCrackle(active: boolean) {
  const [enabled, setEnabled] = useState(false)
  const contextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!enabled || !active) return

    const context = contextRef.current ?? new AudioContext()
    contextRef.current = context

    const source = context.createBufferSource()
    source.buffer = createCrackleBuffer(context)
    source.loop = true

    const filter = context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1200

    const gain = context.createGain()
    gain.gain.value = CRACKLE_VOLUME

    source.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    source.start()

    return () => {
      source.stop()
      source.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
  }, [enabled, active])

  useEffect(() => {
    return () => {
      contextRef.current?.close()
    }
  }, [])

  return { enabled, toggle: () => setEnabled((value) => !value) }
}
