import { useState } from 'react'
import Modal from '../ui/Modal'
import { companies } from '../../services'
import { useToast } from '../../lib/toast'
import type { Company } from '../../types'

export default function CompanyModal({ company, onClose }: { company?: Company; onClose: () => void }) {
  const showToast = useToast((s) => s.show)
  const [form, setForm] = useState({
    name: company?.name ?? '',
    legal: company?.legal ?? '',
    rut: company?.rut ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    wa: company?.wa ?? '',
    address: company?.address ?? '',
    logo: company?.logo ?? '🏢',
  })

  const save = () => {
    if (company) {
      companies.update(company.id, form)
      showToast('Empresa actualizada')
    } else {
      companies.create({ ...form, name: form.name || 'Empresa sin nombre' })
      showToast('Empresa creada')
    }
    onClose()
  }

  const field = (label: string, key: keyof typeof form, span = 1) => (
    <label className={`block text-[11px] font-bold text-ink-soft ${span === 2 ? 'col-span-2' : ''}`}>
      {label}
      <input
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  )

  return (
    <Modal title={`${company ? 'Editar' : 'Crear'} empresa`} subtitle="Los datos se usarán como variables dinámicas en toda la plataforma." onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3.5">
        <label className="block text-[11px] font-bold text-ink-soft">
          Logo (emoji)
          <input
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-center text-[18px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            value={form.logo}
            maxLength={2}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
          />
        </label>
        {field('Nombre', 'name')}
        {field('Razón social', 'legal')}
        {field('RUT', 'rut')}
        {field('Email', 'email')}
        {field('Teléfono', 'phone')}
        {field('WhatsApp', 'wa')}
        {field('Dirección', 'address', 2)}
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-surface-muted">
          Cancelar
        </button>
        <button onClick={save} className="rounded-lg bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700">
          Guardar
        </button>
      </div>
    </Modal>
  )
}
