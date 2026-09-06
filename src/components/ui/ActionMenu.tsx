import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import clsx from 'clsx'

export interface ActionMenuItem {
  label: string
  icon: any
  onClick: () => void
  tone?: 'default' | 'danger' | 'success' | 'warning'
}

const TONE_CLASS: Record<string, string> = {
  default: 'text-ink-soft hover:bg-surface-sunk',
  danger: 'text-red-600 hover:bg-red-50',
  success: 'text-mint-700 hover:bg-mint-50',
  warning: 'text-amber-600 hover:bg-amber-50',
}

export default function ActionMenu({ items, trigger }: { items: ActionMenuItem[]; trigger?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const menuWidth = 208
    const menuHeight = items.length * 38 + 12
    let left = r.right - menuWidth
    let top = r.bottom + 6
    if (top + menuHeight > window.innerHeight - 8) top = r.top - menuHeight - 6
    if (left < 8) left = 8
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8
    setPos({ top, left })
  }

  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScroll = () => place()
    const onClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={trigger ? '' : 'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-sunk text-ink-faint transition hover:bg-line-soft hover:text-ink'}
      >
        {trigger ?? <MoreHorizontal size={16} />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 208 }}
            className="z-[100] animate-scale-in rounded-xl border border-line bg-white p-1.5 text-left shadow-pop"
          >
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={clsx('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-semibold', TONE_CLASS[item.tone ?? 'default'])}
              >
                <item.icon size={13.5} /> {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
