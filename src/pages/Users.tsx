import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import { users as usersService, useDb } from '../services'
import { useToast } from '../lib/toast'
import { ROLE_LABELS } from '../lib/permissions'
import type { Role } from '../types'

const ROLES: Role[] = ['Super Admin', 'Admin', 'Editor', 'Viewer']

export default function Users() {
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const [invite, setInvite] = useState(false)
  const [form, setForm] = useState<{ name: string; email: string; role: Role }>({ name: '', email: '', role: 'Editor' })

  return (
    <Shell title="Usuarios">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Usuarios y permisos"
          subtitle="Controla quién puede crear, publicar o consultar información."
          action={
            <button
              onClick={() => setInvite(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700"
            >
              <Plus size={15} /> Invitar usuario
            </button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-sunk">
                  {['Usuario', 'Rol', 'Estado', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {db.users.map((u) => (
                  <tr key={u.id} className="border-t border-line-soft transition hover:bg-surface-sunk/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size={32} />
                        <div>
                          <p className="text-[13px] font-bold text-ink">{u.name}</p>
                          <p className="text-[11px] text-ink-faint">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={u.role}
                        onChange={(e) => usersService.updateRole(u.id, e.target.value as Role)}
                        className="rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-semibold text-ink-soft outline-none"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill value={u.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          usersService.remove(u.id)
                          showToast('Usuario eliminado')
                        }}
                        className="text-ink-faint transition hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-soft">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-faint">Roles disponibles</p>
            <div className="space-y-3">
              {ROLES.map((r) => (
                <div key={r} className="rounded-xl border border-line-soft p-3">
                  <p className="text-[12.5px] font-bold text-ink">{r}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink-faint">{ROLE_LABELS[r]}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {invite && (
        <Modal title="Invitar usuario" subtitle="El acceso se asignará según el rol elegido." onClose={() => setInvite(false)}>
          <div className="space-y-3.5">
            <label className="block text-[11px] font-bold text-ink-soft">
              Nombre
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <label className="block text-[11px] font-bold text-ink-soft">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <label className="block text-[11px] font-bold text-ink-soft">
              Rol
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button onClick={() => setInvite(false)} className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink hover:bg-surface-muted">
              Cancelar
            </button>
            <button
              onClick={() => {
                usersService.invite(form)
                showToast('Invitación enviada')
                setInvite(false)
                setForm({ name: '', email: '', role: 'Editor' })
              }}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow hover:bg-brand-700"
            >
              Enviar invitación
            </button>
          </div>
        </Modal>
      )}
    </Shell>
  )
}
