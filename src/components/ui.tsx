import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { User, WorkMode } from '../types'
import { useStore } from '../store'

export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'in-person', label: 'In person' },
]

export function workModeMeta(mode: WorkMode) {
  return WORK_MODES.find((m) => m.value === mode) ?? WORK_MODES[0]
}

export function WorkModeBadge({ mode, location }: { mode: WorkMode; location?: string }) {
  const meta = workModeMeta(mode)
  const showLocation = location && mode !== 'remote'
  return (
    <span className={`workmode workmode-${mode}`} title={meta.label}>
      {meta.label}
      {showLocation ? ` · ${location}` : ''}
    </span>
  )
}

export function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <span
      className="avatar"
      title={user.name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, hsl(${user.hue} 62% 52%), hsl(${(user.hue + 40) % 360} 62% 42%))`,
      }}
    >
      {initials}
    </span>
  )
}

export function PersonLink({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <Link
      to={`/people/${user.id}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 13.5 }}
    >
      <Avatar user={user} size={size} />
      {user.name}
    </Link>
  )
}

export function Modal({
  title,
  subtitle,
  onClose,
  wide = false,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  wide?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Portal to <body>: pages animate with a transform, which would otherwise
  // trap this fixed overlay in their stacking context, under the navbar.
  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${wide ? ' modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {subtitle && <p className="modal-sub">{subtitle}</p>}
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  if (toasts.length === 0) return null
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
          <span className="toast-dot" />
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

export function SearchIcon() {
  return (
    <svg
      className="search-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function cover(hue: number): React.CSSProperties {
  return {
    background: `linear-gradient(125deg, hsl(${hue} 64% 58%), hsl(${(hue + 50) % 360} 58% 46%))`,
  }
}
