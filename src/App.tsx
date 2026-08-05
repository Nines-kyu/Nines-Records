import { useEffect, useState } from 'react'
import { AuthCallback } from './components/AuthCallback'
import { LoginButton } from './components/LoginButton'
import { Search } from './components/Search'
import { Turntable } from './components/Turntable'
import { TurntableControls } from './components/TurntableControls'
import { useAuthStore } from './store/authStore'

interface SpotifyProfile {
  display_name: string | null
}

function App() {
  const isCallbackRoute = window.location.pathname === '/callback'
  const status = useAuthStore((s) => s.status)
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const [profile, setProfile] = useState<SpotifyProfile | null>(null)

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
          <Turntable />
          <TurntableControls />
          <Search />
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
