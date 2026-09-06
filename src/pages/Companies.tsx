import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Power, Trash2, Pencil, PanelsTopLeft, Inbox } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import ActionMenu from '../components/ui/ActionMenu'
import CompanyModal from '../components/modals/CompanyModal'
import { companies, useDb } from '../services'
import { useToast } from '../lib/toast'
import type { Company } from '../types'

export default function Companies() {
  const db = useDb()
  const navigate = useNavigate()
  const showToast = useToast((s) => s.show)
  const [modal, setModal] = useState<{ company?: Company } | null>(null)

  return (
    <Shell title="Empresas">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Empresas"
          subtitle="Gestiona la información, canales y landings de cada empresa."
          action={
            <button
              onClick={() => setModal({})}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700"
            >
              <Plus size={15} /> Crear empresa
            </button>
          }
        />

        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-sunk">
                {['Empresa', 'Razón social', 'Canales', 'Landings', 'Registros', 'Estado', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {db.companies.map((c) => {
                const landingsCount = db.landings.filter((l) => l.companyId === c.id).length
                const submissionsCount = db.submissions.filter((s) => s.companyId === c.id).length
                return (
                  <tr key={c.id} className="relative border-t border-line-soft transition hover:bg-surface-sunk/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-lg">{c.logo || c.name[0]}</div>
                        <div>
                          <p className="text-[13px] font-bold text-ink">{c.name}</p>
                          <p className="text-[11px] text-ink-faint">{c.rut}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[12.5px] text-ink-soft">{c.legal}</td>
                    <td className="px-5 py-4">
                      <p className="text-[12px] text-ink-soft">{c.email}</p>
                      <p className="text-[11px] text-ink-faint">{c.phone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => navigate('/landings')} className="flex items-center gap-1.5 text-[12.5px] font-bold text-brand-600 hover:text-brand-700">
                        <PanelsTopLeft size={13} /> {landingsCount}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => navigate('/registros')} className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink-soft hover:text-ink">
                        <Inbox size={13} /> {submissionsCount}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={c.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ActionMenu
                        items={[
                          { label: 'Editar', icon: Pencil, onClick: () => setModal({ company: c }) },
                          {
                            label: c.status === 'Activo' ? 'Desactivar' : 'Activar',
                            icon: Power,
                            onClick: () => {
                              companies.setStatus(c.id, c.status === 'Activo' ? 'Inactivo' : 'Activo')
                              showToast(c.status === 'Activo' ? 'Empresa desactivada' : 'Empresa activada')
                            },
                          },
                          {
                            label: 'Eliminar',
                            icon: Trash2,
                            tone: 'danger',
                            onClick: () => {
                              if (confirm(`¿Eliminar ${c.name}? También se eliminarán sus landings.`)) {
                                companies.remove(c.id)
                                showToast('Empresa eliminada')
                              }
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      {modal && <CompanyModal company={modal.company} onClose={() => setModal(null)} />}
    </Shell>
  )
}
