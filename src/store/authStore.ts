import { create } from 'zustand'
import {
  clearToken,
  exchangeCodeForToken,
  isTokenExpired,
  loadStoredToken,
  redirectToSpotifyAuthorize,
  refreshAccessToken,
  saveToken,
  type StoredToken,
} from '../lib/spotifyAuth'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

interface AuthState {
  token: StoredToken | null
  status: AuthStatus
  error: string | null
  login: () => Promise<void>
  handleRedirectCallback: (code: string) => Promise<void>
  getValidAccessToken: () => Promise<string | null>
  logout: () => void
}

const initialToken = loadStoredToken()

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: initialToken,
  status: initialToken ? 'authenticated' : 'idle',
  error: null,

  login: async () => {
    await redirectToSpotifyAuthorize()
  },

  handleRedirectCallback: async (code: string) => {
    set({ status: 'loading', error: null })
    try {
      const token = await exchangeCodeForToken(code)
      saveToken(token)
      set({ token, status: 'authenticated' })
    } catch (err) {
      set({ status: 'error', error: err instanceof Error ? err.message : 'Login failed' })
    }
  },

  getValidAccessToken: async () => {
    const current = get().token
    if (!current) return null
    if (!isTokenExpired(current)) return current.accessToken

    try {
      const refreshed = await refreshAccessToken(current.refreshToken)
      saveToken(refreshed)
      set({ token: refreshed, status: 'authenticated' })
      return refreshed.accessToken
    } catch {
      clearToken()
      set({ token: null, status: 'idle' })
      return null
    }
  },

  logout: () => {
    clearToken()
    set({ token: null, status: 'idle', error: null })
  },
}))
