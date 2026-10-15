export interface LrcLine {
  timeMs: number
  text: string
}

// Matches one leading timestamp tag: [mm:ss], [mm:ss.xx] or [mm:ss.xxx].
// Metadata tags like [ar:Artist] or [offset:+100] don't match since their
// value after the colon isn't numeric seconds.
const TIMESTAMP_TAG = /^\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/

export function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = []

  for (const rawLine of lrc.split(/\r?\n/)) {
    let rest = rawLine.trim()
    const times: number[] = []

    // A line can carry several timestamps when the same lyric repeats,
    // e.g. "[00:12.00][01:30.50]Chorus line".
    let match = TIMESTAMP_TAG.exec(rest)
    while (match) {
      const [tag, minutes, seconds, fraction = '0'] = match
      // Pad so ".5" → 500ms, ".12" → 120ms, ".123" → 123ms.
      const ms = Number(fraction.padEnd(3, '0'))
      times.push(Number(minutes) * 60_000 + Number(seconds) * 1000 + ms)
      rest = rest.slice(tag.length)
      match = TIMESTAMP_TAG.exec(rest)
    }

    // Lines without a timestamp are metadata or junk. An empty text after
    // a timestamp is kept — it marks an instrumental gap.
    const text = rest.trim()
    for (const timeMs of times) lines.push({ timeMs, text })
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs)
}
