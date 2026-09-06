import { useState } from 'react'
import { ChevronDown, PlugZap } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import { analytics, submissions as submissionsService, useDb } from '../services'

const SOURCES = [
  { label: 'Directo', pct: 44 },
  { label: 'Redes sociales', pct: 28 },
  { label: 'Email', pct: 18 },
  { label: 'Referidos', pct: 10 },
]

export default function Analytics() {
  const db = useDb()
  const [landingId, setLandingId] = useState(db.landings[0]?.id)
  const l = db.landings.find((x) => x.id === landingId) ?? db.landings[0]
  const n = submissionsService.of(l.id).length
  const perDay = analytics.submissionsPerDay(db, 14)
  const maxDay = Math.max(1, ...perDay.map((d) => d.count))

  return (
    <Shell title="Analytics">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Analytics"
          subtitle="Mide la performance de cada experiencia de recepción."
          action={
            <div className="relative">
              <select
                value={landingId}
                onChange={(e) => setLandingId(e.target.value)}
                className="appearance-none rounded-xl border border-line bg-white py-2.5 pl-4 pr-9 text-[13px] font-bold text-ink outline-none"
              >
                {db.landings.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            </div>
          }
        />

        <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ['Visitas', l.metrics.views],
            ['Formularios iniciados', l.metrics.starts],
            ['Registros enviados', n],
            ['Conversión', `${l.metrics.views ? ((n / l.metrics.views) * 100).toFixed(1) : 0}%`],
          ].map(([label, value]) => (
            <article key={label as string} className="animate-slide-up rounded-2xl border border-line bg-white p-5 shadow-soft">
              <span className="text-[12px] font-medium text-ink-faint">{label}</span>
              <div className="mt-3 font-display text-[24px] font-bold tracking-tight text-ink">{value}</div>
              <span className="text-[11px] text-ink-faint">Últimos 30 días</span>
            </article>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-5 text-[15px] font-bold text-ink">Registros — últimos 14 días</h2>
            <div className="flex h-[190px] items-end gap-2 border-b border-line-soft">
              {perDay.map((d, i) => (
                <div key={i} className="flex h-full flex-1 items-end" title={`${d.label}: ${d.count}`}>
                  <div className="mx-auto w-full max-w-[20px] rounded-t-md bg-brand-200 transition-all duration-700 hover:bg-brand-400" style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }} />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-5 text-[15px] font-bold text-ink">Embudo de conversión</h2>
            {[
              { label: 'Visitas', value: l.metrics.views, pct: 100 },
              { label: 'Formulario iniciado', value: l.metrics.starts, pct: l.metrics.views ? (l.metrics.starts / l.metrics.views) * 100 : 0 },
              { label: 'Formulario enviado', value: n, pct: l.metrics.views ? (n / l.metrics.views) * 100 : 0 },
            ].map((f) => (
              <div key={f.label} className="mb-3 rounded-xl bg-brand-50 px-4 py-3 text-brand-700" style={{ width: `${Math.max(30, f.pct)}%`, opacity: 0.55 + f.pct / 250 }}>
                <div className="flex items-center justify-between text-[12px] font-bold">
                  <span>{f.label}</span>
                  <span>{f.value}</span>
                </div>
              </div>
            ))}
          </article>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-[15px] font-bold text-ink">Origen de tráfico</h2>
            {SOURCES.map((s) => (
              <div key={s.label} className="mb-3">
                <div className="mb-1 flex justify-between text-[12px] font-semibold text-ink-soft">
                  <span>{s.label}</span>
                  <span>{s.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </article>

          <article className="flex flex-col justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface-sunk/60 p-6 text-center">
            <PlugZap size={22} className="mx-auto text-ink-faint" />
            <p className="text-[13px] font-bold text-ink">Google Analytics · Meta Pixel</p>
            <p className="mx-auto max-w-xs text-[12px] text-ink-faint">
              La arquitectura de Recivia está lista para incorporar estas integraciones sin cambios estructurales. Próximamente.
            </p>
          </article>
        </div>
      </section>
    </Shell>
  )
}
