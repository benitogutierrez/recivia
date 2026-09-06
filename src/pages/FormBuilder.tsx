import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Eye, EyeOff, X, ArrowLeft, Plus, Type, Mail, Phone, Hash, Calendar, ChevronDown, CircleDot, CheckSquare, AlignLeft, EyeOff as HiddenIcon } from 'lucide-react'
import Shell from '../components/Shell'
import { forms, landings as landingsService, useDb } from '../services'
import { useToast } from '../lib/toast'
import type { FieldDef, FieldType } from '../types'

const FIELD_TYPES: { type: FieldType; label: string; icon: any }[] = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'tel', label: 'Teléfono', icon: Phone },
  { type: 'rut', label: 'RUT', icon: Hash },
  { type: 'number', label: 'Número', icon: Hash },
  { type: 'date', label: 'Fecha', icon: Calendar },
  { type: 'select', label: 'Select', icon: ChevronDown },
  { type: 'radio', label: 'Radio', icon: CircleDot },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft },
  { type: 'hidden', label: 'Campo oculto', icon: HiddenIcon },
]

function SortableRow({ field, active, onClick }: { field: FieldDef; active: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3.5 transition ${
        active ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-200' : 'border-line-soft bg-white hover:bg-surface-sunk/60'
      }`}
    >
      <span {...attributes} {...listeners} className="cursor-grab text-ink-faint active:cursor-grabbing">
        <GripVertical size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-bold text-ink">{field.label}</p>
        <p className="text-[10.5px] text-ink-faint">
          {field.type} · {field.required ? 'Obligatorio' : 'Opcional'} · {field.width === 'full' ? 'Ancho completo' : 'Media columna'}
        </p>
      </div>
      <span className="text-ink-faint">{field.visible ? <Eye size={14} /> : <EyeOff size={14} />}</span>
    </div>
  )
}

export default function FormBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const l = landingsService.get(id)
  const [fieldId, setFieldId] = useState<string | null>(l?.fields[0]?.id ?? null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  if (!l) return null
  const f = l.fields.find((x) => x.id === fieldId) ?? l.fields[0]

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const ids = l.fields.map((x) => x.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    forms.reorderFields(l.id, arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <Shell title="Form Builder" crumb={`Landings / ${l.name}`}>
      <div className="grid w-full grid-cols-1 gap-5 px-6 py-8 md:px-10 lg:grid-cols-[220px_1fr_300px]">
        <aside className="h-fit rounded-2xl border border-line bg-white p-4 shadow-soft lg:sticky lg:top-24">
          <Link to={`/builder/${l.id}`} className="mb-4 flex items-center gap-1.5 text-[12px] font-bold text-ink-faint hover:text-ink">
            <ArrowLeft size={13} /> Volver al builder
          </Link>
          <p className="mb-2.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Campos disponibles</p>
          <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            {FIELD_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => {
                  const nf = forms.addField(l.id, t.type, t.label)
                  setFieldId(nf.id)
                }}
                className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2 text-left text-[11.5px] font-semibold text-ink-soft transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
              >
                <t.icon size={13} /> <span className="flex-1 truncate">{t.label}</span>
                <Plus size={12} />
              </button>
            ))}
          </div>
        </aside>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-[19px] font-bold text-ink">Formulario de recepción</h1>
              <p className="text-[12px] text-ink-faint">{l.fields.length} campos · respuestas guardadas en Registros</p>
            </div>
            <button
              onClick={() => showToast('Formulario guardado')}
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-[12.5px] font-bold text-white shadow-glow hover:bg-brand-700"
            >
              Guardar formulario
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-soft">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={l.fields.map((x) => x.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {l.fields.map((field) => (
                    <div key={field.id} className="group relative">
                      <SortableRow field={field} active={field.id === f?.id} onClick={() => setFieldId(field.id)} />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          forms.removeField(l.id, field.id) || showToast('El formulario requiere al menos un campo')
                          if (fieldId === field.id) setFieldId(l.fields[0]?.id ?? null)
                        }}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-ink-faint opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <button
              onClick={() => {
                const nf = forms.addField(l.id, 'text', 'Nuevo campo')
                setFieldId(nf.id)
              }}
              className="mt-3 w-full rounded-xl border border-dashed border-brand-300 bg-brand-50/40 py-3 text-[12.5px] font-bold text-brand-600 transition hover:bg-brand-50"
            >
              + Agregar campo
            </button>
          </div>
        </section>

        {f && (
          <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-soft lg:sticky lg:top-24">
            <p className="mb-3.5 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Configuración del campo</p>
            <div className="space-y-3.5">
              <PropInput label="Etiqueta" value={f.label} onChange={(v) => forms.updateField(l.id, f.id, { label: v })} />
              <PropInput label="Nombre interno" value={f.key} onChange={(v) => forms.updateField(l.id, f.id, { key: v })} mono />
              <PropInput label="Placeholder" value={f.placeholder} onChange={(v) => forms.updateField(l.id, f.id, { placeholder: v })} />
              <PropInput label="Descripción" value={f.description} onChange={(v) => forms.updateField(l.id, f.id, { description: v })} />
              <PropInput label="Valor por defecto" value={f.defaultValue} onChange={(v) => forms.updateField(l.id, f.id, { defaultValue: v })} />
              {['select', 'radio'].includes(f.type) && (
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">Opciones (separadas por |)</label>
                  <textarea
                    value={f.options}
                    onChange={(e) => forms.updateField(l.id, f.id, { options: e.target.value })}
                    className="h-20 w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                  />
                </div>
              )}
              <div className="border-t border-line-soft pt-3.5" />
              <Toggle label="Obligatorio" checked={f.required} onChange={(v) => forms.updateField(l.id, f.id, { required: v })} />
              <Toggle label="Visible" checked={f.visible} onChange={(v) => forms.updateField(l.id, f.id, { visible: v })} />
              <Toggle label="Ancho completo" checked={f.width === 'full'} onChange={(v) => forms.updateField(l.id, f.id, { width: v ? 'full' : 'half' })} />
            </div>
          </aside>
        )}
      </div>
    </Shell>
  )
}

function PropInput({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-ink-soft">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100 ${mono ? 'font-mono' : ''}`}
      />
    </label>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between text-[12.5px] font-semibold text-ink-soft">
      {label}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}
