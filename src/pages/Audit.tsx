import { History } from 'lucide-react'
import Shell from '../components/Shell'
import Avatar from '../components/ui/Avatar'
import { useDb } from '../services'
import { fmt } from '../lib/utils'

export default function Audit() {
  const db = useDb()
  return (
    <Shell title="Auditoría">
      <section className="w-full px-6 py-9 md:px-10">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Auditoría</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-faint">Historial de cambios y acciones realizadas en Recivia.</p>

        <div className="mt-7 rounded-2xl border border-line bg-white p-2 shadow-soft">
          {db.audit.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-14 text-ink-faint">
              <History size={22} />
              <p className="text-[13px]">Aún no hay actividad registrada.</p>
            </div>
          )}
          {db.audit.map((a) => (
            <div key={a.id} className="flex items-center gap-3.5 border-b border-line-soft px-4 py-4 last:border-0">
              <Avatar name={a.user} size={34} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink">
                  {a.user} <span className="font-medium text-ink-soft">{a.action}</span>
                </p>
                <p className="truncate text-[11.5px] text-ink-faint">{a.entity}</p>
              </div>
              <span className="whitespace-nowrap text-[11px] text-ink-faint">{fmt(a.at)}</span>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  )
}
