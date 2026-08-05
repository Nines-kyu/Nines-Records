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
