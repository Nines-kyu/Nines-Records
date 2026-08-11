import type { SpotifyArtistResult } from '../lib/spotifyApi'

interface ArtistViewProps {
  artist: SpotifyArtistResult
  disabled: boolean
  onBack: () => void
  onPlay: () => void
}

export function ArtistView({ artist, disabled, onBack, onPlay }: ArtistViewProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1 text-xs text-neutral-400 transition hover:text-neutral-200"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
          <path d="M15.5 5 8 12l7.5 7 1.5-1.5L11 12l6-5.5z" />
        </svg>
        Back to results
      </button>

      <div className="flex items-center gap-3 px-1">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-full bg-neutral-800" />
        )}
        <span className="flex flex-1 flex-col overflow-hidden">
          <span className="truncate text-sm font-semibold">{artist.name}</span>
          <span className="truncate text-xs text-neutral-400">Artist</span>
        </span>
        <button
          type="button"
          onClick={onPlay}
          disabled={disabled}
          aria-label={`Play ${artist.name}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-black transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
