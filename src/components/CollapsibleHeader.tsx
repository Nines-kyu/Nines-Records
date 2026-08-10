interface CollapsibleHeaderProps {
  label: string
  collapsed: boolean
  onToggle: () => void
}

export function CollapsibleHeader({ label, collapsed, onToggle }: CollapsibleHeaderProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      className="flex w-full items-center justify-between gap-2 text-left"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</h2>
      <svg
        viewBox="0 0 24 24"
        className={`h-3.5 w-3.5 shrink-0 fill-current text-neutral-500 transition-transform ${
          collapsed ? '' : 'rotate-180'
        }`}
      >
        <path d="M12 15.5 5 8.5l1.4-1.4L12 12.7l5.6-5.6L19 8.5z" />
      </svg>
    </button>
  )
}
