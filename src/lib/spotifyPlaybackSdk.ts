// The Connect device name — also used to find our device in the devices list.
export const PLAYER_NAME = 'Nines九 Records'

let loadPromise: Promise<void> | null = null

export function loadSpotifyPlaybackSdk(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve()
      return
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve()

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  })

  return loadPromise
}
