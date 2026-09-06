import { FormEvent } from 'react'
import type { FieldDef } from '../types'

function Control({ f, disabled }: { f: FieldDef; disabled?: boolean }) {
  const base = 'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[13px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-surface-sunk'
  if (f.type === 'select')
    return (
      <select name={f.key} required={f.required} disabled={disabled} defaultValue={f.defaultValue} className={base}>
        <option value="">{f.placeholder || 'Selecciona una opción'}</option>
        {f.options.split('|').filter(Boolean).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    )
  if (f.type === 'radio')
    return (
      <div className="flex flex-wrap gap-3 pt-1">
        {f.options.split('|').filter(Boolean).map((o) => (
          <label key={o} className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <input type="radio" name={f.key} value={o} disabled={disabled} defaultChecked={f.defaultValue === o} required={f.required} /> {o}
          </label>
        ))}
      </div>
    )
  if (f.type === 'checkbox')
    return (
      <label className="flex items-center gap-2 pt-1 text-[12.5px] text-ink-soft">
        <input type="checkbox" name={f.key} disabled={disabled} defaultChecked={f.defaultValue === 'true'} /> {f.placeholder || 'Sí'}
      </label>
    )
  if (f.type === 'textarea') return <textarea name={f.key} required={f.required} disabled={disabled} placeholder={f.placeholder} defaultValue={f.defaultValue} rows={3} className={base} />
  if (f.type === 'hidden') return <input type="hidden" name={f.key} defaultValue={f.defaultValue} />
  return (
    <input
      name={f.key}
      required={f.required}
      disabled={disabled}
      type={f.type === 'rut' ? 'text' : f.type}
      placeholder={f.placeholder || { email: 'nombre@empresa.cl', tel: '+56 9 1234 5678' }[f.type as string] || 'Escribe tu respuesta'}
      defaultValue={f.defaultValue}
      className={base}
    />
  )
}

export default function FormRenderer({
  fields,
  submitLabel,
  disabled,
  onSubmit,
  primary,
  honeypot,
}: {
  fields: FieldDef[]
  submitLabel: string
  disabled?: boolean
  primary: string
  honeypot?: boolean
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3.5">
      {honeypot && <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] opacity-0" aria-hidden />}
      {fields
        .filter((f) => f.visible && f.type !== 'hidden')
        .map((f) => (
          <div key={f.id} className={f.width === 'full' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
            <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.description && <p className="mb-1 text-[10.5px] text-ink-faint">{f.description}</p>}
            <Control f={f} disabled={disabled} />
          </div>
        ))}
      {fields.filter((f) => f.type === 'hidden').map((f) => (
        <Control key={f.id} f={f} disabled={disabled} />
      ))}
      <button
        type="submit"
        disabled={disabled}
        style={{ background: primary }}
        className="col-span-2 mt-1 rounded-lg py-3 text-[13px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {submitLabel}
      </button>
    </form>
  )
}
