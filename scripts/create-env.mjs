#!/usr/bin/env node
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const examplePath = path.join(root, '.env.example')
const targetPath = path.join(root, '.env')

if (existsSync(targetPath)) {
  console.log('.env already exists — leaving it untouched.')
  process.exit(0)
}

copyFileSync(examplePath, targetPath)

console.log('Created .env from .env.example. Fill in:\n')
console.log('  VITE_SPOTIFY_CLIENT_ID')
console.log('    Your Spotify app client ID.')
console.log('    Get one at https://developer.spotify.com/dashboard\n')
console.log('  VITE_SPOTIFY_REDIRECT_URI')
console.log('    Must exactly match a Redirect URI registered on that Spotify app.')
console.log('    Defaults to http://127.0.0.1:9799/callback for local dev.\n')
