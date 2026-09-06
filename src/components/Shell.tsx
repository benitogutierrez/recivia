import { FormEvent, ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Building2,
  PanelsTopLeft,
  Inbox,
  Zap,
  LayoutTemplate,
  Users,
  BarChart3,
  Settings,
  ScrollText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  LogOut,
  Plus,
  X,
  Search,
} from 'lucide-react'
import clsx from 'clsx'
import { auth, useDb } from '../services'
import { useToast } from '../lib/toast'
import Avatar from './ui/Avatar'
import Toast from './ui/Toast'
import NotificationsBell from './ui/NotificationsBell'

const NAV = [
  { to: '/', icon: LayoutGrid, label: 'Resumen', exact: true },
  { to: '/empresas', icon: Building2, label: 'Empresas' },
  { to: '/landings', icon: PanelsTopLeft, label: 'Landings' },
  { to: '/registros', icon: Inbox, label: 'Registros', countKey: 'submissions' as const },
  { to: '/automatizaciones', icon: Zap, label: 'Automatizaciones' },
  { to: '/templates', icon: LayoutTemplate, label: 'Templates' },
]

const NAV_ADMIN = [
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
  { to: '/audit', icon: ScrollText, label: 'Auditoría' },
]

const MOBILE_TABS = [
  { to: '/', icon: LayoutGrid, label: 'Resumen', exact: true },
  { to: '/registros', icon: Inbox, label: 'Registros' },
  { to: '/automatizaciones', icon: Zap, label: 'Flujos' },
  { to: '/templates', icon: LayoutTemplate, label: 'Plantillas' },
]

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow" style={{ width: size, height: size }}>
      <span className="rounded-full border-[2.5px] border-white" style={{ width: size * 0.42, height: size * 0.42 }} />
    </span>
  )
}

function NavButton({ to, icon: Icon, label, exact, badge, onNavigate }: any) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={clsx(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors',
        active ? 'bg-surface-sunk text-ink' : 'text-ink-faint hover:bg-surface-sunk/70 hover:text-ink',
      )}
    >
      <span className={clsx('grid h-7 w-7 place-items-center rounded-lg transition-colors', active ? 'bg-brand-600 text-white' : 'text-ink-faint group-hover:text-brand-600')}>
        <Icon size={15} strokeWidth={2.25} />
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && (
        <span className={clsx('rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold', active ? 'bg-brand-100 text-brand-700' : 'bg-surface-muted text-ink-faint')}>
          {badge}
        </span>
      )}
    </Link>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const db = useDb()
  const navigate = useNavigate()
  const me = auth.currentUser()

  return (
    <>
      <div className="mb-6 flex items-center justify-between px-1">
        <Link to="/" className="flex items-center gap-2.5" onClick={onNavigate}>
          <Logo />
          <span className="font-display text-xl font-bold tracking-tight text-ink">recivia</span>
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="text-ink-faint md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <button
        onClick={() => {
          navigate('/empresas')
          onNavigate?.()
        }}
        className="mb-5 flex items-center gap-2 rounded-xl border border-line bg-surface-sunk/60 px-3 py-2.5 text-left text-[13px] font-semibold text-ink transition hover:bg-surface-sunk"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
        <span className="flex-1 truncate">{db.companies[0]?.name ?? 'Empresa'}</span>
        <ChevronDown size={14} className="text-ink-faint" />
      </button>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map((n) => (
          <NavButton key={n.to} {...n} badge={n.countKey ? db.submissions.length : undefined} onNavigate={onNavigate} />
        ))}
        <div className="mb-1.5 mt-6 px-3 text-[10px] font-bold uppercase tracking-wider text-ink-faint/70">Administración</div>
        {NAV_ADMIN.map((n) => (
          <NavButton key={n.to} {...n} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-3 flex items-center gap-2.5 border-t border-line-soft px-1 pt-4">
        <Avatar name={me?.name ?? '?'} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-bold leading-tight text-ink">{me?.name ?? 'Invitado'}</p>
          <p className="truncate font-mono text-[10.5px] text-ink-faint">{me?.role ?? ''}</p>
        </div>
        <button
          onClick={() => {
            auth.logout()
            navigate('/login')
          }}
          className="text-ink-faint transition hover:text-ink"
          title="Cerrar sesión"
        >
          <LogOut size={15} />
        </button>
      </div>
    </>
  )
}

export default function Shell({ title, crumb = 'Recivia', children }: { title: string; crumb?: string; children: ReactNode }) {
  const db = useDb()
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToast((s) => s.show)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [q, setQ] = useState('')

  const runSearch = (e: FormEvent) => {
    e.preventDefault()
    const needle = q.trim().toLowerCase()
    if (!needle) return
    const landing = db.landings.find((l) => l.name.toLowerCase().includes(needle))
    if (landing) return navigate(`/builder/${landing.id}`)
    const company = db.companies.find((c) => c.name.toLowerCase().includes(needle))
    if (company) return navigate('/empresas')
    showToast('Sin resultados para tu búsqueda')
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen w-full bg-white">
        {mobileOpen && <div className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

        <aside
          className={clsx(
            'fixed z-50 h-screen w-[248px] flex-col bg-white px-3 py-5 transition-transform duration-200 md:sticky md:top-0 md:z-auto md:flex md:h-screen md:w-[248px] md:shrink-0 md:translate-x-0 md:overflow-y-auto md:border-r md:border-line-soft md:px-3.5 md:py-6',
            mobileOpen ? 'flex translate-x-0' : 'hidden -translate-x-full',
          )}
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </aside>

        <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden pb-20 md:bg-[#f7f8fa] md:pb-0">
          {/* Desktop header */}
          <header className="sticky top-0 z-10 hidden h-20 shrink-0 items-center gap-3 border-b border-line-soft bg-[#f7f8fa]/90 px-8 backdrop-blur md:flex">
            <span className="flex items-center gap-1.5 truncate text-[13px] text-ink-faint">
              {crumb} <ChevronRight size={13} className="text-line" /> <b className="font-bold text-ink">{title}</b>
            </span>
            <form onSubmit={runSearch} className="relative mx-auto w-full max-w-[340px]">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar landings, empresas..."
                className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </form>
            <div className="flex items-center gap-2.5">
              <Link
                to={`/p/${db.landings[0]?.id ?? ''}`}
                className="grid h-10 w-10 place-items-center rounded-xl bg-surface-sunk text-ink-soft transition hover:bg-line-soft hover:text-ink"
                title="Ver landing pública"
              >
                <ExternalLink size={16} />
              </Link>
              <NotificationsBell />
            </div>
          </header>

          {/* Mobile top bar */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-line-soft bg-white px-4 md:hidden">
            <button onClick={() => setMobileOpen(true)}>
              <Avatar name={auth.currentUser()?.name ?? '?'} size={32} />
            </button>
            <span className="font-display text-[17px] font-bold tracking-tight text-brand-600">Recivia</span>
            <NotificationsBell />
          </header>

          {children}
        </main>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate('/templates')}
        className="fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-pop transition active:scale-95 md:hidden"
        title="Crear landing"
      >
        <Plus size={22} />
      </button>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-line bg-white/95 backdrop-blur md:hidden">
        {MOBILE_TABS.map((t) => {
          const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to)
          return (
            <Link key={t.to} to={t.to} className="flex flex-1 flex-col items-center justify-center gap-1">
              <span className={clsx('flex items-center gap-1 rounded-full px-3 py-1 transition-colors', active ? 'bg-brand-50 text-brand-600' : 'text-ink-faint')}>
                <t.icon size={17} />
              </span>
              <span className={clsx('text-[10px] font-mono font-semibold', active ? 'text-brand-600' : 'text-ink-faint')}>{t.label}</span>
            </Link>
          )
        })}
      </nav>

      <Toast />
    </div>
  )
}
