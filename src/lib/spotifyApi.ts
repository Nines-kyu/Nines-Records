export interface SpotifyDevice {
  id: string | null
  name: string
  is_active: boolean
}

interface SpotifyDevicesResponse {
  devices: SpotifyDevice[]
}

export async function getAvailableDevices(accessToken: string): Promise<SpotifyDevice[]> {
  const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Failed to list devices: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as SpotifyDevicesResponse
  return data.devices
}

export interface SpotifyQueueTrack {
  id: string
  uri: string
  name: string
  artists: string
  albumImageUrl: string | null
}

interface SpotifyQueueResponseItem {
  id: string
  uri: string
  name: string
  artists?: { name: string }[]
  album?: { images: { url: string }[] }
}

interface SpotifyQueueResponse {
  queue: SpotifyQueueResponseItem[]
}

function toQueueTrack(item: SpotifyQueueResponseItem): SpotifyQueueTrack {
  return {
    id: item.id,
    uri: item.uri,
    name: item.name,
    artists: item.artists?.map((artist) => artist.name).join(', ') ?? '',
    albumImageUrl: item.album?.images[0]?.url ?? null,
  }
}

export async function getPlaybackQueue(accessToken: string): Promise<SpotifyQueueTrack[]> {
  const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch queue: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as SpotifyQueueResponse
  return data.queue.map(toQueueTrack)
}

export async function setPlaybackShuffle(
  accessToken: string,
  deviceId: string,
  state: boolean,
): Promise<void> {
  const params = new URLSearchParams({ state: String(state), device_id: deviceId })
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/shuffle?${params.toString()}`,
    { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!response.ok) {
    throw new Error(`Failed to set shuffle: ${response.status} ${await response.text()}`)
  }
}

export type SpotifyRepeatMode = 'off' | 'context' | 'track'

export async function setPlaybackRepeatMode(
  accessToken: string,
  deviceId: string,
  mode: SpotifyRepeatMode,
): Promise<void> {
  const params = new URLSearchParams({ state: mode, device_id: deviceId })
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/repeat?${params.toString()}`,
    { method: 'PUT', headers: { Authorization: `Bearer ${accessToken}` } },
  )

  if (!response.ok) {
    throw new Error(`Failed to set repeat mode: ${response.status} ${await response.text()}`)
  }
}

export interface SpotifyPlaylist {
  id: string
  uri: string
  name: string
  imageUrl: string | null
  trackCount: number
}

interface SpotifyPlaylistsResponse {
  items: Array<{
    id: string
    uri: string
    name: string
    images?: { url: string }[]
    items?: { total: number }
  } | null>
  next: string | null
}

export async function getUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = []
  let url: string | null = 'https://api.spotify.com/v1/me/playlists'

  while (url) {
    const response: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch playlists: ${response.status} ${await response.text()}`)
    }

    const data = (await response.json()) as SpotifyPlaylistsResponse

    for (const playlist of data.items) {
      if (!playlist) continue
      playlists.push({
        id: playlist.id,
        uri: playlist.uri,
        name: playlist.name,
        imageUrl: playlist.images?.[0]?.url ?? null,
        trackCount: playlist.items?.total ?? 0,
      })
    }

    url = data.next
  }

  return playlists
}

export interface SpotifyTrackResult {
  id: string
  uri: string
  name: string
  artists: string
  albumName: string
  albumImageUrl: string | null
  durationMs: number
}

export interface SpotifyAlbumResult {
  id: string
  uri: string
  name: string
  artists: string
  imageUrl: string | null
  releaseYear: string | null
  trackCount: number
}

export interface SpotifySearchResults {
  tracks: SpotifyTrackResult[]
  albums: SpotifyAlbumResult[]
}

interface SpotifySearchResponse {
  tracks?: {
    items: Array<{
      id: string
      uri: string
      name: string
      artists: { name: string }[]
      album: { name: string; images: { url: string }[] }
      duration_ms: number
    }>
  }
  albums?: {
    items: Array<{
      id: string
      uri: string
      name: string
      artists: { name: string }[]
      images: { url: string }[]
      release_date?: string
      total_tracks: number
    }>
  }
}

export async function search(query: string, accessToken: string): Promise<SpotifySearchResults> {
  const params = new URLSearchParams({ q: query, type: 'track,album' })

  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as SpotifySearchResponse

  const tracks = (data.tracks?.items ?? []).map((track) => ({
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(', '),
    albumName: track.album.name,
    albumImageUrl: track.album.images[0]?.url ?? null,
    durationMs: track.duration_ms,
  }))

  const albums = (data.albums?.items ?? []).map((album) => ({
    id: album.id,
    uri: album.uri,
    name: album.name,
    artists: album.artists.map((artist) => artist.name).join(', '),
    imageUrl: album.images[0]?.url ?? null,
    releaseYear: album.release_date?.slice(0, 4) ?? null,
    trackCount: album.total_tracks,
  }))

  return { tracks, albums }
}
