import { X } from 'lucide-react'
import { ReactNode } from 'react'

export default function Modal({
  onClose,
  title,
  subtitle,
  children,
  wide,
}: {
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-40 grid animate-fade-in place-items-center bg-navy-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'} animate-scale-in rounded-2xl border border-line bg-white p-7 shadow-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-ink-faint">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-surface-muted hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
