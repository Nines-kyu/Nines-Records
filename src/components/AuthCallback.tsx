import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function AuthCallback() {
  const handleRedirectCallback = useAuthStore((s) => s.handleRedirectCallback)
  const error = useAuthStore((s) => s.error)
  const [message, setMessage] = useState('Signing in to Spotify…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const authError = params.get('error')

    if (authError) {
      setMessage(`Spotify login failed: ${authError}`)
      return
    }

    if (!code) {
      setMessage('Missing authorization code.')
      return
    }

    handleRedirectCallback(code).then(() => {
      window.location.replace('/')
    })
  }, [handleRedirectCallback])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-neutral-400">{error ?? message}</p>
    </main>
  )
}
