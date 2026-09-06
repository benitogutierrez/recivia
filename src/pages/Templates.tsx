import { useState } from 'react'
import { Plus, LayoutTemplate, ArrowRight, Trash2 } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import { useDb } from '../services'
import { templates as templatesService } from '../services'
import { useToast } from '../lib/toast'
import NewLandingModal from '../components/modals/NewLandingModal'

export default function Templates() {
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const [pickTemplate, setPickTemplate] = useState<string | null>(null)

  return (
    <Shell title="Templates">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Templates"
          subtitle="Empieza con una estructura probada y personalízala para cada empresa. Puedes guardar cualquier landing como template."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {db.templates.map((t, i) => (
            <article
              key={t.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group animate-slide-up overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div
                className="relative h-[130px] p-5"
                style={{ background: `linear-gradient(145deg, ${t.color}, #ffffff)` }}
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/70 text-sm font-bold backdrop-blur" style={{ color: t.color }}>
                  <LayoutTemplate size={15} />
                </div>
                <div className="mt-3.5 h-2.5 w-2/3 rounded-full bg-white/60" />
                <div className="mt-2 h-9 w-2/5 rounded-lg bg-white/60" />
                {!t.builtin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      templatesService.remove(t.id)
                      showToast('Template eliminado')
                    }}
                    className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-white/70 text-red-600 opacity-0 backdrop-blur transition group-hover:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="p-5">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10.5px] font-bold text-brand-700">{t.cat}</span>
                <h2 className="mt-3 text-[16px] font-bold text-ink">{t.name}</h2>
                <p className="mt-1.5 min-h-[38px] text-[12.5px] leading-relaxed text-ink-faint">{t.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-ink-faint">{t.fields.length} campos incluidos</span>
                  <button
                    onClick={() => setPickTemplate(t.id)}
                    className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-[11.5px] font-bold text-white transition group-hover:bg-brand-600"
                  >
                    Usar template <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </article>
          ))}

          <button
            onClick={() => setPickTemplate('blank')}
            className="flex min-h-[290px] animate-slide-up flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-sunk/50 p-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink-faint shadow-soft">
              <Plus size={18} />
            </div>
            <div>
              <p className="text-[13.5px] font-bold text-ink">Partir desde cero</p>
              <p className="mt-1 text-[12px] text-ink-faint">Crea una landing vacía y construye tu propia experiencia.</p>
            </div>
          </button>
        </div>
      </section>
      {pickTemplate && <NewLandingModal templateId={pickTemplate === 'blank' ? undefined : pickTemplate} onClose={() => setPickTemplate(null)} />}
    </Shell>
  )
}
