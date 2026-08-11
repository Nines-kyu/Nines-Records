import { create } from 'zustand'
import type { SpotifyQueueTrack } from '../lib/spotifyApi'

export interface PlayerTrack {
  id: string
  uri: string
  name: string
  artists: string
  albumName: string
  albumImageUrl: string | null
  albumUri: string | null
  durationMs: number
  type: 'track' | 'episode' | 'ad'
}

function toPlayerTrack(state: Spotify.PlaybackState): PlayerTrack {
  const track = state.track_window.current_track
  return {
    id: track.id ?? track.uri,
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(', '),
    albumName: track.album.name,
    albumImageUrl: track.album.images[0]?.url ?? null,
    albumUri: track.album.uri ?? null,
    durationMs: track.duration_ms,
    type: track.type,
  }
}

interface PlayerState {
  player: Spotify.Player | null
  deviceId: string | null
  isReady: boolean
  isPlaying: boolean
  currentTrack: PlayerTrack | null
  positionMs: number
  queue: SpotifyQueueTrack[]
  shuffle: boolean
  repeatMode: 0 | 1 | 2
  setPlayer: (player: Spotify.Player | null) => void
  setDeviceId: (deviceId: string | null) => void
  setReady: (ready: boolean) => void
  applyState: (state: Spotify.PlaybackState | null) => void
  setQueue: (queue: SpotifyQueueTrack[]) => void
  setShuffle: (shuffle: boolean) => void
  setRepeatMode: (repeatMode: 0 | 1 | 2) => void
  reset: () => void
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  player: null,
  deviceId: null,
  isReady: false,
  isPlaying: false,
  currentTrack: null,
  positionMs: 0,
  queue: [],
  shuffle: false,
  repeatMode: 0,

  setPlayer: (player) => set({ player }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setReady: (isReady) => set({ isReady }),
  setQueue: (queue) => set({ queue }),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeatMode: (repeatMode) => set({ repeatMode }),

  applyState: (state) =>
    set(
      state
        ? {
            isPlaying: !state.paused,
            positionMs: state.position,
            currentTrack: toPlayerTrack(state),
            shuffle: state.shuffle,
            repeatMode: state.repeat_mode,
          }
        : { isPlaying: false, currentTrack: null, positionMs: 0 },
    ),

  reset: () =>
    set({
      player: null,
      deviceId: null,
      isReady: false,
      isPlaying: false,
      currentTrack: null,
      positionMs: 0,
      queue: [],
      shuffle: false,
      repeatMode: 0,
    }),
}))
