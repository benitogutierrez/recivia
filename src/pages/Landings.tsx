import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Rocket, EyeOff, Copy, Trash2, Pencil, PanelsTopLeft, FileText } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import ActionMenu from '../components/ui/ActionMenu'
import IconButton from '../components/ui/IconButton'
import NewLandingModal from '../components/modals/NewLandingModal'
import { companies as companiesService, landings, useDb } from '../services'
import { useToast } from '../lib/toast'
import { timeAgo } from '../lib/utils'

export default function Landings() {
  const db = useDb()
  const navigate = useNavigate()
  const showToast = useToast((s) => s.show)
  const [openNew, setOpenNew] = useState(false)

  return (
    <Shell title="Landings">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Landings"
          subtitle="Crea, publica y administra tus páginas de recepción."
          action={
            <button
              onClick={() => setOpenNew(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700"
            >
              <Plus size={15} /> Crear landing
            </button>
          }
        />

        {db.landings.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-white/60 py-16 text-center">
            <FileText size={22} className="text-ink-faint" />
            <p className="text-[13px] font-semibold text-ink">Aún no tienes landings</p>
            <button onClick={() => setOpenNew(true)} className="text-[12.5px] font-bold text-brand-600 hover:text-brand-700">
              Crear la primera →
            </button>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {db.landings.map((l, i) => {
              const company = companiesService.get(l.companyId)
              const subs = db.submissions.filter((s) => s.landingId === l.id)
              const conv = l.metrics.views ? ((subs.length / l.metrics.views) * 100).toFixed(1) : '0.0'
              const last = subs[0]

              return (
                <article
                  key={l.id}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-slide-up rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <PanelsTopLeft size={17} />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <IconButton icon={Eye} title="Preview" onClick={() => navigate(`/p/${l.id}`)} />
                      <IconButton icon={Pencil} title="Editar" onClick={() => navigate(`/builder/${l.id}`)} />
                      <IconButton
                        icon={Copy}
                        title="Duplicar"
                        onClick={() => {
                          const copy = landings.duplicate(l.id)
                          showToast('Landing duplicada')
                          if (copy) navigate(`/builder/${copy.id}`)
                        }}
                      />
                      <StatusPill value={l.status} />
                      <ActionMenu
                        items={[
                          { label: 'Editar', icon: Pencil, onClick: () => navigate(`/builder/${l.id}`) },
                          { label: 'Preview', icon: Eye, onClick: () => navigate(`/p/${l.id}`) },
                          l.status !== 'Publicada'
                            ? {
                                label: 'Publicar',
                                icon: Rocket,
                                tone: 'success',
                                onClick: () => {
                                  landings.publish(l.id)
                                  showToast('Landing publicada')
                                },
                              }
                            : {
                                label: 'Despublicar',
                                icon: EyeOff,
                                tone: 'warning',
                                onClick: () => {
                                  landings.setStatus(l.id, 'Despublicada')
                                  showToast('Landing despublicada')
                                },
                              },
                          {
                            label: 'Eliminar',
                            icon: Trash2,
                            tone: 'danger',
                            onClick: () => {
                              if (confirm(`¿Eliminar "${l.name}"? Esta acción no se puede deshacer.`)) {
                                landings.remove(l.id)
                                showToast('Landing eliminada')
                              }
                            },
                          },
                        ]}
                      />
                    </div>
                  </div>

                  <h3 className="mt-4 text-[15.5px] font-bold text-ink">{l.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="truncate font-mono text-[12px] text-ink-faint">
                      {company?.name} · /{l.slug}
                    </p>
                    <p className="shrink-0 text-[11.5px] text-ink-faint">{last ? `Último registro ${timeAgo(last.at)}` : 'Sin registros aún'}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-sunk px-4 py-3">
                      <p className="text-[11px] font-semibold text-ink-faint">Registros</p>
                      <p className="mt-1 text-[19px] font-bold text-ink">{subs.length}</p>
                    </div>
                    <div className="rounded-xl bg-surface-sunk px-4 py-3">
                      <p className="text-[11px] font-semibold text-ink-faint">Conversión</p>
                      <p className="mt-1 text-[19px] font-bold text-ink">{conv}%</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      {openNew && <NewLandingModal onClose={() => setOpenNew(false)} />}
    </Shell>
  )
}
