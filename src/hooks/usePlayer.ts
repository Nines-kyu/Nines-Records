import { useCallback, useEffect } from 'react'
import { loadSpotifyPlaybackSdk } from '../lib/spotifyPlaybackSdk'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'

const PLAYER_NAME = 'Nines九 Records'

export function usePlayer() {
  const status = useAuthStore((s) => s.status)
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)

  const player = usePlayerStore((s) => s.player)
  const deviceId = usePlayerStore((s) => s.deviceId)
  const isReady = usePlayerStore((s) => s.isReady)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const positionMs = usePlayerStore((s) => s.positionMs)
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const setReady = usePlayerStore((s) => s.setReady)
  const applyState = usePlayerStore((s) => s.applyState)
  const reset = usePlayerStore((s) => s.reset)

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false
    let spotifyPlayer: Spotify.Player | null = null

    loadSpotifyPlaybackSdk().then(() => {
      if (cancelled) return

      spotifyPlayer = new window.Spotify.Player({
        name: PLAYER_NAME,
        getOAuthToken: (cb) => {
          getValidAccessToken().then((token) => {
            if (token) cb(token)
          })
        },
        volume: 0.5,
      })

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setReady(true)
      })
      spotifyPlayer.addListener('not_ready', () => {
        setReady(false)
      })
      spotifyPlayer.addListener('player_state_changed', (state) => {
        applyState(state)
      })
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Web Playback SDK failed to initialize:', message)
      })
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Web Playback SDK authentication error:', message)
      })
      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Spotify Web Playback SDK account error (Premium required):', message)
      })

      spotifyPlayer.connect()
      setPlayer(spotifyPlayer)
    })

    return () => {
      cancelled = true
      spotifyPlayer?.disconnect()
      reset()
    }
  }, [status, getValidAccessToken, setPlayer, setDeviceId, setReady, applyState, reset])

  const playUri = useCallback(
    async (uri: string) => {
      if (!deviceId) return
      const token = await getValidAccessToken()
      if (!token) return

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uris: [uri] }),
      })
    },
    [deviceId, getValidAccessToken],
  )

  const resume = useCallback(() => player?.resume(), [player])
  const pause = useCallback(() => player?.pause(), [player])
  const togglePlay = useCallback(() => player?.togglePlay(), [player])
  const seek = useCallback((positionMs: number) => player?.seek(positionMs), [player])
  const next = useCallback(() => player?.nextTrack(), [player])
  const previous = useCallback(() => player?.previousTrack(), [player])

  return {
    isReady,
    isPlaying,
    currentTrack,
    positionMs,
    deviceId,
    playUri,
    resume,
    pause,
    togglePlay,
    seek,
    next,
    previous,
  }
}
