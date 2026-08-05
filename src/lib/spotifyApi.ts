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

export interface SpotifyTrackResult {
  id: string
  uri: string
  name: string
  artists: string
  albumName: string
  albumImageUrl: string | null
  durationMs: number
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
}

export async function searchTracks(
  query: string,
  accessToken: string,
): Promise<SpotifyTrackResult[]> {
  const params = new URLSearchParams({ q: query, type: 'track' })

  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as SpotifySearchResponse
  const items = data.tracks?.items ?? []

  return items.map((track) => ({
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(', '),
    albumName: track.album.name,
    albumImageUrl: track.album.images[0]?.url ?? null,
    durationMs: track.duration_ms,
  }))
}
