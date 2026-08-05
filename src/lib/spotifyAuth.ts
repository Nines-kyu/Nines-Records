import { generateCodeChallenge, generateCodeVerifier } from './pkce'

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
export const SPOTIFY_REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? `${window.location.origin}/callback`

export const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
]

const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const VERIFIER_STORAGE_KEY = 'nines_records_code_verifier'
const TOKEN_STORAGE_KEY = 'nines_records_token'

export interface StoredToken {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export async function redirectToSpotifyAuthorize(): Promise<void> {
  const verifier = generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  localStorage.setItem(VERIFIER_STORAGE_KEY, verifier)

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES.join(' '),
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.assign(`${AUTHORIZE_ENDPOINT}?${params.toString()}`)
}

export async function exchangeCodeForToken(code: string): Promise<StoredToken> {
  const verifier = localStorage.getItem(VERIFIER_STORAGE_KEY)
  if (!verifier) {
    throw new Error('Missing PKCE code verifier. Please log in again.')
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_verifier: verifier,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  localStorage.removeItem(VERIFIER_STORAGE_KEY)

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as TokenResponse
  if (!data.refresh_token) {
    throw new Error('Spotify did not return a refresh token.')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<StoredToken> {
  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${await response.text()}`)
  }

  const data = (await response.json()) as TokenResponse
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
}

export function loadStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredToken
  } catch {
    return null
  }
}

export function saveToken(token: StoredToken): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token))
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function isTokenExpired(token: StoredToken): boolean {
  return Date.now() >= token.expiresAt - 60_000
}
