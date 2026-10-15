import { useEffect, useRef } from 'react'
import { usePlaybackPosition } from '../hooks/usePlaybackPosition'
import { usePlayer } from '../hooks/usePlayer'
import { findActiveLineIndex, useLyrics } from '../hooks/useLyrics'
import type { LrcLine } from '../lib/parseLrc'
import { usePlayerStore } from '../store/playerStore'
import { CollapsibleHeader } from './CollapsibleHeader'

// How long auto-scroll stays paused after the user scrolls the lyrics.
const MANUAL_SCROLL_PAUSE_MS = 3000

interface LyricsPanelProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function LyricsPanel({ collapsed, onToggleCollapsed }: LyricsPanelProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const queue = usePlayerStore((s) => s.queue)
  const { status, lyrics } = useLyrics()

  // Spotify pads the queue with the current track when there's no real
  // next track — skip those, same as QueuePanel's "up next".
  const upNext = queue.find((track) => track.id !== currentTrack?.id) ?? null

  const renderLyrics = () => {
    if (!currentTrack) {
      return <p className="text-xs text-neutral-500">Nothing playing</p>
    }
    if (currentTrack.type === 'episode') {
      return <p className="text-xs text-neutral-500">Lyrics aren't available for podcasts</p>
    }
    if (status === 'loading') {
      return <p className="text-xs text-neutral-500">Loading lyrics…</p>
    }
    if (status === 'error') {
      return <p className="text-xs text-red-400">Couldn't load lyrics. Try again later.</p>
    }
    if (status !== 'loaded' || !lyrics) {
      return status === 'not-found' ? (
        <p className="text-xs text-neutral-500">No lyrics found</p>
      ) : null
    }
    if (lyrics.instrumental) {
      return <p className="text-xs text-neutral-500">Instrumental</p>
    }
    if (lyrics.syncedLines) {
      // Keyed by track so scroll position and pause state reset per song.
      return <SyncedLyrics key={currentTrack.id} lines={lyrics.syncedLines} />
    }
    if (lyrics.plainLyrics) {
      return (
        <p className="max-h-[70vh] overflow-y-auto whitespace-pre-line text-left text-sm text-neutral-300">
          {lyrics.plainLyrics}
        </p>
      )
    }
    return <p className="text-xs text-neutral-500">No lyrics found</p>
  }

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <CollapsibleHeader label="Now playing" collapsed={collapsed} onToggle={onToggleCollapsed} />

      {!collapsed && (
        <>
          {currentTrack && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {currentTrack.albumImageUrl ? (
                  <img
                    src={currentTrack.albumImageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded bg-neutral-800" />
                )}
                <span className="flex flex-col overflow-hidden text-left">
                  <span className="truncate text-sm">{currentTrack.name}</span>
                  <span className="truncate text-xs text-neutral-400">{currentTrack.artists}</span>
                </span>
              </div>
              {upNext && (
                <p className="truncate text-left text-xs text-neutral-500">
                  Up next: <span className="text-neutral-400">{upNext.name}</span>
                  {upNext.artists && ` · ${upNext.artists}`}
                </p>
              )}
            </div>
          )}

          {renderLyrics()}

          <p className="text-left text-xs text-neutral-600">
            Lyrics from{' '}
            <a
              href="https://lrclib.net"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-500 transition hover:text-accent"
            >
              LRCLIB
            </a>
          </p>
        </>
      )}
    </div>
  )
}

interface SyncedLyricsProps {
  lines: LrcLine[]
}

// Split out so the 150ms position updates only re-render while synced
// lyrics are actually on screen.
function SyncedLyrics({ lines }: SyncedLyricsProps) {
  const { seek } = usePlayer()
  const positionMs = usePlaybackPosition({ intervalMs: 150 })
  const activeIndex = findActiveLineIndex(lines, positionMs)

  const containerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([])
  const activeIndexRef = useRef(activeIndex)
  const scrollPausedRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Scrolls only the lyrics container — scrollIntoView would also scroll
  // the page.
  const scrollToActive = () => {
    const container = containerRef.current
    if (!container) return
    const line = lineRefs.current[activeIndexRef.current]
    const top = line
      ? line.offsetTop - container.clientHeight / 2 + line.offsetHeight / 2
      : 0
    container.scrollTo({ top, behavior: 'smooth' })
  }

  useEffect(() => {
    activeIndexRef.current = activeIndex
    if (!scrollPausedRef.current) scrollToActive()
  }, [activeIndex])

  useEffect(() => () => clearTimeout(resumeTimerRef.current), [])

  // Only real user input pauses auto-scroll — the scroll event alone can't
  // tell a user scroll from our own smooth scrollTo().
  const pauseAutoScroll = () => {
    scrollPausedRef.current = true
    clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      scrollPausedRef.current = false
      scrollToActive()
    }, MANUAL_SCROLL_PAUSE_MS)
  }

  const handleSeek = (timeMs: number) => {
    clearTimeout(resumeTimerRef.current)
    scrollPausedRef.current = false
    seek(timeMs)
  }

  return (
    <div
      ref={containerRef}
      onWheel={pauseAutoScroll}
      onTouchMove={pauseAutoScroll}
      onPointerDown={(event) => {
        // A pointerdown on the container itself (not a line) is a
        // scrollbar drag.
        if (event.target === event.currentTarget) pauseAutoScroll()
      }}
      className="relative flex max-h-[70vh] flex-col gap-1 overflow-y-auto text-left"
    >
      {lines.map((line, index) => (
        <button
          key={`${line.timeMs}-${index}`}
          ref={(el) => {
            lineRefs.current[index] = el
          }}
          type="button"
          onClick={() => handleSeek(line.timeMs)}
          className={`w-full rounded px-1 py-1 text-left transition hover:bg-neutral-800 ${
            line.text ? 'text-sm' : 'text-xs'
          } ${
            index === activeIndex
              ? 'text-accent'
              : index < activeIndex
                ? 'text-neutral-400'
                : 'text-neutral-500'
          }`}
        >
          {line.text || '♪'}
        </button>
      ))}
    </div>
  )
}
