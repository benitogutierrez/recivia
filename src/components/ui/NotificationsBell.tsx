import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Mail, MessageCircle, AlertTriangle } from 'lucide-react'
import { useDb, landings as landingsService } from '../../services'
import { fmt } from '../../lib/utils'

export default function NotificationsBell() {
  const db = useDb()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const recent = db.notificationLogs.slice(0, 6)
  const hasErrors = db.notificationLogs.some((l) => l.status === 'Error')

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect()
    if (!r) return
    const width = 320
    let left = r.right - width
    if (left < 8) left = 8
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
    setPos({ top: r.bottom + 8, left })
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
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-sunk text-ink-soft transition hover:bg-line-soft hover:text-ink"
        title="Notificaciones"
      >
        <Bell size={16} />
        {recent.length > 0 && (
          <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${hasErrors ? 'bg-red-500' : 'bg-mint-500'}`} />
        )}
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: 320 }}
            className="z-[100] animate-scale-in rounded-xl border border-line bg-white p-2 shadow-pop"
          >
            <p className="px-2.5 py-2 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Notificaciones recientes</p>
            {recent.length === 0 && <p className="px-2.5 py-4 text-center text-[12px] text-ink-faint">Sin actividad todavía.</p>}
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {recent.map((n) => {
                const landing = landingsService.get(n.landingId)
                return (
                  <div key={n.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-surface-sunk">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${n.status === 'Error' ? 'bg-red-50 text-red-600' : 'bg-mint-50 text-mint-700'}`}>
                      {n.status === 'Error' ? <AlertTriangle size={13} /> : n.channel === 'email' ? <Mail size={13} /> : <MessageCircle size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-ink">
                        {n.channel === 'email' ? 'Email' : 'WhatsApp'} · {landing?.name ?? 'Landing'}
                      </p>
                      <p className="truncate text-[11px] text-ink-faint">{n.recipient}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono text-ink-faint">{fmt(n.at)}</span>
                  </div>
                )
              })}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
