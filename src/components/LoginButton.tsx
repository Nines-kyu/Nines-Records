import { useAuthStore } from '../store/authStore'

export function LoginButton() {
  const login = useAuthStore((s) => s.login)

  return (
    <button
      type="button"
      onClick={login}
      className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:bg-accent-hover"
    >
      Log in with Spotify
    </button>
  )
}
