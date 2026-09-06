import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import Modal from '../ui/Modal'
import { landings, useDb } from '../../services'
import { useToast } from '../../lib/toast'
import { slugify } from '../../lib/utils'

export default function NewLandingModal({ templateId, onClose }: { templateId?: string; onClose: () => void }) {
  const db = useDb()
  const navigate = useNavigate()
  const showToast = useToast((s) => s.show)
  const [name, setName] = useState('')
  const [companyId, setCompanyId] = useState(db.companies[0]?.id ?? '')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(templateId ?? db.templates[1]?.id ?? db.templates[0]?.id)

  useEffect(() => {
    if (!slugTouched) setSlug(name ? landings.suggestSlug(name) : '')
  }, [name, slugTouched])

  const taken = slug ? landings.isSlugTaken(slug) : false

  const create = () => {
    if (!name.trim() || !companyId || !slug.trim() || taken) return
    const l = landings.create({ companyId, name: name.trim(), slug: slug.trim(), templateId: selectedTemplate ?? db.templates[0].id })
    showToast('Landing creada')
    onClose()
    navigate(`/builder/${l.id}`)
  }

  return (
    <Modal title="Nueva landing" subtitle="Define el nombre, la empresa y la URL. Podrás cambiar todo después." onClose={onClose} wide>
      <div className="space-y-4">
        <label className="block text-[11px] font-bold text-ink-soft">
          Nombre interno
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Recepción Convenio ABC"
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </label>
        <label className="block text-[11px] font-bold text-ink-soft">
          Empresa
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          >
            {db.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-ink-soft">
          URL pública
          <div className="mt-1.5 flex items-center overflow-hidden rounded-lg border border-line focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
            <span className="whitespace-nowrap bg-surface-sunk px-3 py-2.5 text-[12px] text-ink-faint">recivia.cl/</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
              className="w-full px-2 py-2.5 text-[13px] outline-none"
            />
          </div>
          {taken && (
            <span className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
              <AlertCircle size={12} /> Esa URL ya está en uso, elige otra.
            </span>
          )}
        </label>
        {!templateId && (
          <div>
            <p className="mb-2 text-[11px] font-bold text-ink-soft">Template</p>
            <div className="grid grid-cols-2 gap-2">
              {db.templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`rounded-lg border px-3 py-2.5 text-left text-[12px] font-semibold transition ${
                    selectedTemplate === t.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line text-ink-soft hover:bg-surface-sunk'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <button onClick={onClose} className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition hover:bg-surface-muted">
          Cancelar
        </button>
        <button
          onClick={create}
          disabled={!name.trim() || !slug.trim() || taken}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Crear y diseñar
        </button>
      </div>
    </Modal>
  )
}
