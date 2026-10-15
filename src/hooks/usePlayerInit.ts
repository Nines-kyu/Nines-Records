import { useEffect } from 'react'
import { loadSpotifyPlaybackSdk, PLAYER_NAME } from '../lib/spotifyPlaybackSdk'
import { useAuthStore } from '../store/authStore'
import { usePlayerStore } from '../store/playerStore'

// Creates and connects the single Spotify.Player instance for the app.
// Mount this exactly once (in App) — components get playback actions from
// usePlayer(), which never creates players itself.
export function usePlayerInit(enabled = true) {
  const status = useAuthStore((s) => s.status)
  const getValidAccessToken = useAuthStore((s) => s.getValidAccessToken)
  const setPlayer = usePlayerStore((s) => s.setPlayer)
  const setDeviceId = usePlayerStore((s) => s.setDeviceId)
  const setReady = usePlayerStore((s) => s.setReady)
  const applyState = usePlayerStore((s) => s.applyState)
  const reset = usePlayerStore((s) => s.reset)

  useEffect(() => {
    if (!enabled || status !== 'authenticated') return

    // StrictMode runs this effect, cleans it up, and runs it again in dev.
    // The SDK load always resolves asynchronously, so the first run is
    // cancelled before it creates a player; `cancelled` also stops a
    // torn-down player's late events from writing to the shared store.
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
        volume: usePlayerStore.getState().volume,
      })

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        if (cancelled) return
        setDeviceId(device_id)
        setReady(true)
      })
      spotifyPlayer.addListener('not_ready', () => {
        if (cancelled) return
        setReady(false)
      })
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (cancelled) return
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
  }, [enabled, status, getValidAccessToken, setPlayer, setDeviceId, setReady, applyState, reset])
}
