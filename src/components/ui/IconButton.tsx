import clsx from 'clsx'
import { MouseEvent, ReactNode } from 'react'

export default function IconButton({
  icon: Icon,
  onClick,
  title,
  tone = 'default',
  size = 32,
}: {
  icon: any
  onClick?: (e: MouseEvent) => void
  title?: string
  tone?: 'default' | 'brand' | 'danger'
  size?: number
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: size, height: size }}
      className={clsx(
        'grid shrink-0 place-items-center rounded-lg transition',
        tone === 'default' && 'bg-surface-sunk text-ink-faint hover:bg-line-soft hover:text-ink',
        tone === 'brand' && 'bg-brand-50 text-brand-600 hover:bg-brand-100',
        tone === 'danger' && 'bg-red-50 text-red-500 hover:bg-red-100',
      )}
    >
      <Icon size={Math.round(size * 0.45)} />
    </button>
  )
}

export function IconButtonGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1.5">{children}</div>
}
