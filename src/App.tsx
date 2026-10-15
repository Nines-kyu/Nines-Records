import { useEffect, useState } from 'react'
import { AuthCallback } from './components/AuthCallback'
import { LoginButton } from './components/LoginButton'
import { LyricsPanel } from './components/LyricsPanel'
import { PlaylistsPanel } from './components/PlaylistsPanel'
import { QueuePanel } from './components/QueuePanel'
import { Search } from './components/Search'
import { Turntable } from './components/Turntable'
import { TurntableControls } from './components/TurntableControls'
import { useElementHeight } from './hooks/useElementHeight'
import { usePlayerInit } from './hooks/usePlayerInit'
import { useAuthStore } from './store/authStore'
import { usePlayerStore } from './store/playerStore'

interface SpotifyProfile {
  display_name: string | null
}

function App() {
  const isCallbackRoute = window.location.pathname === '/callback'
  const status = useAuthStore((s) => s.status)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)
  const [playlistsCollapsed, setPlaylistsCollapsed] = useState(false)
  const [queueCollapsed, setQueueCollapsed] = useState(false)
  const [lyricsCollapsed, setLyricsCollapsed] = useState(false)
  const queue = usePlayerStore((s) => s.queue)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const { ref: queueRef, height: queueHeight } = useElementHeight<HTMLDivElement>()
  const hasQueueTracks = queue.some((track) => track.id !== currentTrack?.id)
  const matchQueueHeight = hasQueueTracks && !queueCollapsed ? queueHeight : null

  usePlayerInit(!isCallbackRoute)

  useEffect(() => {
    if (status !== 'authenticated' || !token) {
      setProfile(null)
      return
    }

    let cancelled = false
    fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token.accessToken}` },
    })
      .then((res) => (res.ok ? (res.json() as Promise<SpotifyProfile>) : null))
      .then((data) => {
        if (!cancelled) setProfile(data)
      })
      .catch(() => {
        if (!cancelled) setProfile(null)
      })

    return () => {
      cancelled = true
    }
  }, [status, token])

  if (isCallbackRoute) {
    return <AuthCallback />
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Nines<span className="text-accent">九</span> Records
      </h1>
      <p className="max-w-md text-sm text-neutral-400">
        A virtual turntable that plays full songs through your Spotify Premium account.
      </p>

      {status === 'authenticated' ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-neutral-300">
            Signed in{profile?.display_name ? ` as ${profile.display_name}` : ''}.
          </p>
          <div className="w-full max-w-360 rounded-2xl border border-neutral-800 bg-neutral-900/20 p-6">
            <div className="flex w-full flex-col items-center gap-8">
              <Search />
              <div className="flex w-full flex-col items-start gap-8 lg:flex-row lg:justify-between">
                <div className="flex w-full flex-col gap-6 lg:w-2xl lg:shrink-0 lg:flex-row lg:items-stretch">
                  <div
                    className="flex min-w-0 flex-1 self-start"
                    style={
                      !playlistsCollapsed && matchQueueHeight
                        ? { height: matchQueueHeight, maxHeight: matchQueueHeight }
                        : undefined
                    }
                  >
                    <PlaylistsPanel
                      collapsed={playlistsCollapsed}
                      onToggleCollapsed={() => setPlaylistsCollapsed((collapsed) => !collapsed)}
                    />
                  </div>
                  <div ref={queueRef} className="flex min-w-0 flex-1 self-start">
                    <QueuePanel
                      collapsed={queueCollapsed}
                      onToggleCollapsed={() => setQueueCollapsed((collapsed) => !collapsed)}
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center gap-6">
                  <Turntable />
                  <TurntableControls />
                  <LyricsPanel
                    collapsed={lyricsCollapsed}
                    onToggleCollapsed={() => setLyricsCollapsed((collapsed) => !collapsed)}
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-neutral-700 px-4 py-2 text-sm transition hover:border-accent hover:text-accent"
          >
            Log out
          </button>
        </div>
      ) : (
        <LoginButton />
      )}
    </main>
  )
}

export default App
