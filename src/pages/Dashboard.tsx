import { useNavigate } from 'react-router-dom'
import { Inbox, PanelsTopLeft, TrendingUp, ArrowUpRight, Plus, Building2, FileEdit, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Shell from '../components/Shell'
import ActionMenu from '../components/ui/ActionMenu'
import { analytics, auth, useDb } from '../services'

export default function Dashboard() {
  const db = useDb()
  const navigate = useNavigate()
  const ov = analytics.overview(db)
  const perDay = analytics.submissionsPerDay(db, 7)
  const perLanding = analytics.byLanding(db)
  const perCompany = analytics.byCompany(db)
  const health = analytics.notificationHealth(db)
  const me = auth.currentUser()
  const maxDay = Math.max(1, ...perDay.map((d) => d.count))

  const kpis = [
    { label: 'Empresas', value: ov.totalCompanies, icon: Building2, trend: '+2%', to: '/empresas' },
    { label: 'Landings (publicadas / borrador)', value: `${ov.published} / ${ov.drafts}`, icon: PanelsTopLeft, trend: '+8%', to: '/landings' },
    { label: 'Registros totales', value: ov.totalSubmissions, icon: Inbox, trend: '+12%', to: '/registros' },
    { label: 'Registros hoy · 7 días', value: `${ov.today} · ${ov.last7Days}`, icon: TrendingUp, trend: '+3.2%', to: '/analytics' },
  ]

  return (
    <Shell title="Resumen">
      <section className="w-full px-6 py-9 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">
              Buenos días, {me?.name.split(' ')[0] ?? ''}
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-faint">Una vista clara de tus formularios, landings y flujos de recepción.</p>
          </div>
          <button
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700"
          >
            <Plus size={15} /> Crear landing
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <article
              key={k.label}
              style={{ animationDelay: `${i * 60}ms` }}
              className="animate-slide-up rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-brand-100 bg-brand-50 text-brand-600">
                  <k.icon size={16} />
                </span>
                <ActionMenu items={[{ label: 'Ver detalle', icon: ArrowUpRight, onClick: () => navigate(k.to) }]} />
              </div>
              <p className="mt-4 text-[12px] font-medium text-ink-faint">{k.label}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-display text-[26px] font-bold tracking-tight text-ink">{k.value}</span>
                <span className="flex items-center gap-0.5 rounded-md bg-mint-50 px-1.5 py-0.5 text-[11px] font-bold text-mint-700">
                  <ArrowUpRight size={11} /> {k.trend}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
          <article className="animate-slide-up rounded-2xl border border-line bg-white p-6 shadow-soft" style={{ animationDelay: '240ms' }}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Registros de los últimos 7 días</h2>
              <button onClick={() => navigate('/analytics')} className="text-[12px] font-bold text-brand-600 hover:text-brand-700">
                Ver informe
              </button>
            </div>
            <div className="flex h-[200px] items-end gap-3 border-b border-line-soft px-2 [background:repeating-linear-gradient(to_bottom,transparent_0,transparent_48px,theme(colors.line.soft)_49px)]">
              {perDay.map((b, i) => (
                <div key={b.label + i} className="flex h-full flex-1 items-end">
                  <div
                    className={`mx-auto w-full max-w-[30px] rounded-t-md transition-all duration-700 ${i === perDay.length - 1 ? 'bg-gradient-to-t from-brand-600 to-brand-400' : 'bg-brand-100'}`}
                    style={{ height: `${Math.max(6, (b.count / maxDay) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-around pt-2.5 text-[10.5px] capitalize text-ink-faint">
              {perDay.map((b, i) => (
                <span key={i}>{b.label}</span>
              ))}
            </div>
          </article>

          <article className="animate-slide-up rounded-2xl border border-line bg-white p-6 shadow-soft" style={{ animationDelay: '300ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Estado de notificaciones</h2>
              <Mail size={15} className="text-ink-faint" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-mint-50 p-3.5">
                <div className="flex items-center gap-1.5 text-mint-700">
                  <CheckCircle2 size={14} />
                  <span className="text-[11px] font-bold">Enviadas</span>
                </div>
                <p className="mt-1.5 font-display text-xl font-bold text-mint-800">{health.sent}</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3.5">
                <div className="flex items-center gap-1.5 text-red-600">
                  <AlertTriangle size={14} />
                  <span className="text-[11px] font-bold">Errores</span>
                </div>
                <p className="mt-1.5 font-display text-xl font-bold text-red-700">{health.errors}</p>
              </div>
            </div>
            <div className="mt-4 border-t border-line-soft pt-3.5">
              <p className="mb-2 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Errores recientes</p>
              {health.recentErrors.length === 0 ? (
                <p className="text-[12px] text-ink-faint">Sin errores registrados.</p>
              ) : (
                health.recentErrors.map((e) => (
                  <div key={e.id} className="mb-1.5 rounded-lg bg-red-50/60 px-2.5 py-2 text-[11px] text-red-700">
                    {e.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} · {e.error}
                  </div>
                ))
              )}
            </div>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="animate-slide-up rounded-2xl border border-line bg-white p-6 shadow-soft" style={{ animationDelay: '340ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Registros por landing</h2>
              <FileEdit size={15} className="text-ink-faint" />
            </div>
            {perLanding.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-line-soft py-3.5 last:border-0">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                  <PanelsTopLeft size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-ink">{l.name}</p>
                  <p className="text-[10.5px] text-ink-faint">{l.submissions} registros</p>
                </div>
                <div className="text-right">
                  <p className="text-[12.5px] font-bold text-ink">{l.conversion.toFixed(1)}%</p>
                  <p className="text-[10.5px] text-ink-faint">conversión</p>
                </div>
              </div>
            ))}
          </article>

          <article className="animate-slide-up rounded-2xl border border-line bg-white p-6 shadow-soft" style={{ animationDelay: '380ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-ink">Registros por empresa</h2>
              <Building2 size={15} className="text-ink-faint" />
            </div>
            {perCompany.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border-b border-line-soft py-3.5 last:border-0">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-mint-50 font-bold text-mint-700">{c.name[0]}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-bold text-ink">{c.name}</p>
                  <p className="text-[10.5px] text-ink-faint">{c.landings} landings</p>
                </div>
                <div className="text-right">
                  <p className="text-[12.5px] font-bold text-ink">{c.submissions}</p>
                  <p className="text-[10.5px] text-ink-faint">registros</p>
                </div>
              </div>
            ))}
          </article>
        </div>
      </section>
    </Shell>
  )
}
