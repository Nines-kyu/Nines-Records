import { useCallback, useEffect } from 'react'
import { getAvailableDevices, getPlaybackQueue } from '../lib/spotifyApi'
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
  const queue = usePlayerStore((s) => s.queue)
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const setReady = usePlayerStore((s) => s.setReady)
  const applyState = usePlayerStore((s) => s.applyState)
  const setQueue = usePlayerStore((s) => s.setQueue)
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
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Spotify Web Playback SDK playback error:', message)
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

  const resolveDeviceId = useCallback(
    async (token: string): Promise<string | null> => {
      // The locally cached device ID can go stale (network hiccups, tab
      // backgrounding) without a `not_ready` event firing, so resolve the
      // server's current device ID right before starting playback.
      let targetDeviceId = deviceId
      try {
        const devices = await getAvailableDevices(token)
        const match = devices.find((device) => device.name === PLAYER_NAME)
        if (match?.id) {
          targetDeviceId = match.id
          if (match.id !== deviceId) setDeviceId(match.id)
        }
      } catch (err) {
        console.error('Failed to list Spotify Connect devices:', err)
      }
      return targetDeviceId
    },
    [deviceId, setDeviceId],
  )

  const refreshQueue = useCallback(async () => {
    const token = await getValidAccessToken()
    if (!token) return

    try {
      const tracks = await getPlaybackQueue(token)
      setQueue(tracks)
    } catch (err) {
      console.error('Failed to fetch playback queue:', err)
    }
  }, [getValidAccessToken, setQueue])

  const startPlayback = useCallback(
    async (body: { uris: string[] } | { context_uri: string }) => {
      const token = await getValidAccessToken()
      if (!token) return

      const targetDeviceId = await resolveDeviceId(token)
      if (!targetDeviceId) {
        console.error(
          `No "${PLAYER_NAME}" Connect device found. Reselect it in the Spotify app.`,
        )
        return
      }

      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${targetDeviceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      )

      if (!response.ok) {
        console.error(
          `Failed to start playback: ${response.status} ${await response.text()}`,
        )
        return
      }

      // Spotify needs a moment to register the new context before the
      // queue endpoint reflects it.
      setTimeout(refreshQueue, 800)
    },
    [getValidAccessToken, resolveDeviceId, refreshQueue],
  )

  const playUri = useCallback((uri: string) => startPlayback({ uris: [uri] }), [startPlayback])
  const playContextUri = useCallback(
    (contextUri: string) => startPlayback({ context_uri: contextUri }),
    [startPlayback],
  )

  const resume = useCallback(() => player?.resume(), [player])
  const pause = useCallback(() => player?.pause(), [player])
  const togglePlay = useCallback(() => player?.togglePlay(), [player])
  const seek = useCallback((positionMs: number) => player?.seek(positionMs), [player])
  const next = useCallback(async () => {
    await player?.nextTrack()
    setTimeout(refreshQueue, 800)
  }, [player, refreshQueue])
  const previous = useCallback(async () => {
    await player?.previousTrack()
    setTimeout(refreshQueue, 800)
  }, [player, refreshQueue])

  // Spotify has no "jump to queue position" endpoint — skipping forward
  // `index + 1` times is what actually moves through the real queue/context,
  // as opposed to playUri() which would replace it with a single track.
  // Each nextTrack() call needs a moment to actually register server-side
  // before the next one is sent, or rapid-fire calls get collapsed into one.
  const skipToQueueIndex = useCallback(
    async (index: number) => {
      if (!player) return
      for (let i = 0; i <= index; i += 1) {
        await player.nextTrack()
        await new Promise((resolve) => setTimeout(resolve, 400))
      }
      refreshQueue()
    },
    [player, refreshQueue],
  )

  return {
    isReady,
    isPlaying,
    currentTrack,
    positionMs,
    deviceId,
    queue,
    refreshQueue,
    playUri,
    playContextUri,
    skipToQueueIndex,
    resume,
    pause,
    togglePlay,
    seek,
    next,
    previous,
  }
}
