import { useMemo, useState } from 'react'
import { Search, Download, FileSpreadsheet, X, ArrowUpDown } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import { landings as landingsService, submissions as submissionsService, useDb } from '../services'
import { useToast } from '../lib/toast'
import { fmt } from '../lib/utils'
import type { Submission } from '../types'

export default function Submissions() {
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const [q, setQ] = useState('')
  const [landingFilter, setLandingFilter] = useState('all')
  const [sortDesc, setSortDesc] = useState(true)
  const [detail, setDetail] = useState<Submission | null>(null)

  const rows = useMemo(() => {
    let list = db.submissions.filter((s) => (landingFilter === 'all' ? true : s.landingId === landingFilter))
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter((s) => JSON.stringify(s.values).toLowerCase().includes(needle))
    }
    return [...list].sort((a, b) => (sortDesc ? +new Date(b.at) - +new Date(a.at) : +new Date(a.at) - +new Date(b.at)))
  }, [db.submissions, q, landingFilter, sortDesc])

  return (
    <Shell title="Registros">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Registros"
          subtitle="Centraliza los datos recibidos desde tus landings."
          action={
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  submissionsService.exportCSV(rows)
                  showToast('CSV descargado')
                }}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] font-bold text-ink transition hover:bg-surface-muted"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => {
                  submissionsService.exportExcel(rows)
                  showToast('Excel descargado')
                }}
                className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-[13px] font-bold text-ink transition hover:bg-surface-muted"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
            </div>
          }
        />

        <div className="mt-6 rounded-2xl border border-line bg-white shadow-soft">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-line-soft p-4">
            <div className="relative min-w-[240px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar registros..."
                className="w-full rounded-lg border border-line py-2.5 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <select
              value={landingFilter}
              onChange={(e) => setLandingFilter(e.target.value)}
              className="rounded-lg border border-line px-3 py-2.5 text-[12.5px] font-semibold text-ink-soft outline-none"
            >
              <option value="all">Todas las landings</option>
              {db.landings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSortDesc((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2.5 text-[12.5px] font-bold text-ink-soft transition hover:bg-surface-muted"
            >
              <ArrowUpDown size={13} /> {sortDesc ? 'Más recientes' : 'Más antiguos'}
            </button>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-sunk">
                {['Persona', 'Landing', 'Recibido', 'Estado', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[13px] text-ink-faint">
                    No hay resultados.
                  </td>
                </tr>
              )}
              {rows.map((s) => {
                const l = landingsService.get(s.landingId)
                const name = s.values.nombre_completo || Object.values(s.values)[0] || 'Sin nombre'
                const email = s.values.correo_electronico || s.values.email || '—'
                return (
                  <tr key={s.id} className="cursor-pointer border-t border-line-soft transition hover:bg-surface-sunk/60" onClick={() => setDetail(s)}>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-bold text-ink">{name}</p>
                      <p className="text-[11px] text-ink-faint">{email}</p>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">{l?.name ?? '—'}</td>
                    <td className="px-5 py-4 font-mono text-[12px] text-ink-faint">{fmt(s.at)}</td>
                    <td className="px-5 py-4">
                      <StatusPill value={s.status} />
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-[11.5px] font-bold text-brand-600">Ver detalle →</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="fixed inset-0 z-40 flex justify-end bg-navy-950/40 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-md animate-fade-in overflow-y-auto bg-white p-7 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Registro</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{fmt(detail.at)}</h2>
              </div>
              <button onClick={() => setDetail(null)} className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-surface-muted hover:text-ink">
                <X size={16} />
              </button>
            </div>
            <div className="mb-5 flex items-center gap-2">
              {(['Nuevo', 'Contactado', 'Descartado'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    submissionsService.setStatus(detail.id, st)
                    setDetail({ ...detail, status: st })
                  }}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                    detail.status === st ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink-soft hover:bg-line-soft'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="space-y-3.5">
              {Object.entries(detail.values).map(([k, v]) => (
                <div key={k} className="rounded-xl border border-line-soft bg-surface-sunk/60 p-3.5">
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">{k.replaceAll('_', ' ')}</p>
                  <p className="mt-1 text-[13px] font-semibold text-ink">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Shell>
  )
}
