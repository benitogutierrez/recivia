import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ArrowLeft,
  Eye,
  Rocket,
  Undo2,
  Redo2,
  Monitor,
  Tablet,
  Smartphone,
  Palette,
  History,
  Plus,
  GripVertical,
  Copy,
  Trash2,
  EyeOff,
  X,
  FileText,
  Mic,
} from 'lucide-react'
import { companies as companiesService, landings as landingsService, pageBuilder, useDb } from '../services'
import { useToast } from '../lib/toast'
import { fmt } from '../lib/utils'
import BlockRenderer from '../components/BlockRenderer'
import FormRenderer from '../components/FormRenderer'
import { BLOCK_LIBRARY } from '../services/pageBuilder'
import type { BlockType, PageBlock } from '../types'

const BREAKPOINTS = { desktop: '100%', tablet: '760px', mobile: '390px' }

function SortableBlock({ block, selected, onSelect, children }: { block: PageBlock; selected: boolean; onSelect: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : block.visible ? 1 : 0.4 }}
      className="group relative"
    >
      <div className="absolute -left-9 top-1/2 flex -translate-y-1/2 flex-col items-center gap-1 opacity-0 transition group-hover:opacity-100">
        <span {...attributes} {...listeners} className="cursor-grab rounded bg-white p-1 text-ink-faint shadow-soft active:cursor-grabbing">
          <GripVertical size={13} />
        </span>
      </div>
      <div onClick={onSelect}>{children}</div>
    </div>
  )
}

export default function Builder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const l = landingsService.get(id)
  const company = l ? companiesService.get(l.companyId) : undefined
  const [selected, setSelected] = useState<string | null>(null)
  const [breakpoint, setBreakpoint] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showThemes, setShowThemes] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const past = useRef<PageBlock[][]>([])
  const future = useRef<PageBlock[][]>([])
  const lastBlocks = useRef<string>('')

  useEffect(() => {
    if (l) lastBlocks.current = JSON.stringify(l.blocks)
  }, [l?.id])

  if (!l) return null
  const block = l.blocks.find((b) => b.id === selected)

  const snapshot = () => {
    past.current = [...past.current.slice(-24), JSON.parse(lastBlocks.current || '[]')]
    future.current = []
  }
  const afterChange = () => {
    lastBlocks.current = JSON.stringify(landingsService.get(l.id)?.blocks ?? [])
  }

  const undo = () => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(JSON.parse(lastBlocks.current))
    pageBuilder.setBlocks(l.id, prev)
    afterChange()
  }
  const redo = () => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(JSON.parse(lastBlocks.current))
    pageBuilder.setBlocks(l.id, next)
    afterChange()
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    snapshot()
    const ids = l.blocks.map((b) => b.id)
    pageBuilder.reorderBlocks(l.id, arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
    afterChange()
  }

  const grouped = BLOCK_LIBRARY.reduce<Record<string, typeof BLOCK_LIBRARY>>((acc, b) => {
    ;(acc[b.group] ??= []).push(b)
    return acc
  }, {})

  return (
    <div className="flex h-screen flex-col bg-surface-sunk">
      <header className="flex h-16 items-center gap-4 border-b border-line bg-white px-5">
        <button onClick={() => navigate('/landings')} className="text-ink-faint transition hover:text-ink">
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-[13px] font-bold text-ink">{l.name}</h1>
          <p className="text-[10.5px] text-ink-faint">{company?.name} · /{l.slug}</p>
        </div>
        <span className="rounded-full bg-mint-50 px-2.5 py-1 text-[10px] font-bold text-mint-700">● Guardado</span>

        <div className="mx-auto flex items-center gap-1 rounded-lg border border-line bg-surface-sunk p-1">
          {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
            const Icon = bp === 'desktop' ? Monitor : bp === 'tablet' ? Tablet : Smartphone
            return (
              <button
                key={bp}
                onClick={() => setBreakpoint(bp)}
                className={`grid h-7 w-8 place-items-center rounded-md transition ${breakpoint === bp ? 'bg-white text-brand-600 shadow-soft' : 'text-ink-faint hover:text-ink'}`}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={undo} disabled={!past.current.length} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition hover:bg-surface-muted disabled:opacity-30">
            <Undo2 size={15} />
          </button>
          <button onClick={redo} disabled={!future.current.length} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition hover:bg-surface-muted disabled:opacity-30">
            <Redo2 size={15} />
          </button>
          <button onClick={() => setShowThemes(true)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition hover:bg-surface-muted" title="Tema">
            <Palette size={15} />
          </button>
          <button onClick={() => setShowVersions(true)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition hover:bg-surface-muted" title="Versiones">
            <History size={15} />
          </button>
          <button
            onClick={() => {
              landingsService.setMode(l.id, l.mode === 'voice' ? 'form' : 'voice')
              showToast(l.mode === 'voice' ? 'Modo formulario activado' : 'Modo asistente de voz activado')
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-bold transition ${
              l.mode === 'voice' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-soft hover:bg-surface-muted'
            }`}
            title="Alternar entre formulario clásico y asistente de voz"
          >
            <Mic size={13} /> {l.mode === 'voice' ? 'Asistente de voz' : 'Activar asistente de voz'}
          </button>
          <button
            onClick={() => navigate(`/formulario/${l.id}`)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12px] font-bold text-ink-soft transition hover:bg-surface-muted"
          >
            <FileText size={13} /> Editar formulario
          </button>
          <button
            onClick={() => navigate(`/p/${l.id}`)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[12px] font-bold text-ink-soft transition hover:bg-surface-muted"
          >
            <Eye size={13} /> Vista previa
          </button>
          <button
            onClick={() => {
              landingsService.publish(l.id)
              showToast('Landing publicada correctamente')
            }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-[12px] font-bold text-white shadow-glow transition hover:bg-brand-700"
          >
            <Rocket size={13} /> {l.status === 'Publicada' ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[220px_1fr_280px]">
        <aside className="overflow-y-auto border-r border-line bg-white p-4 scrollbar-thin">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-ink-faint">{group}</p>
              <div className="space-y-1.5">
                {items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => {
                      snapshot()
                      const b = pageBuilder.addBlock(l.id, item.type as BlockType)
                      afterChange()
                      setSelected(b.id)
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-line px-2.5 py-2 text-left text-[11.5px] font-semibold text-ink-soft transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
                  >
                    {item.label} <Plus size={12} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div className="overflow-y-auto p-10 scrollbar-thin" style={{ backgroundImage: 'radial-gradient(#d7dfe8 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
          <div
            className="mx-auto min-h-[600px] rounded-2xl bg-white p-8 shadow-card transition-all duration-300"
            style={{ maxWidth: BREAKPOINTS[breakpoint] }}
            onClick={() => setSelected(null)}
          >
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={l.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-5">
                  {l.blocks.map((b) => (
                    <SortableBlock key={b.id} block={b} selected={selected === b.id} onSelect={() => setSelected(b.id)}>
                      <BlockRenderer
                        block={b}
                        landing={l}
                        company={company}
                        editable
                        selected={selected === b.id}
                        onSelect={() => setSelected(b.id)}
                        formNode={<FormRenderer fields={l.fields} submitLabel={l.submitLabel} primary={l.theme.primary} disabled />}
                      />
                    </SortableBlock>
                  ))}
                  {l.blocks.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-line py-16 text-center text-[13px] text-ink-faint">
                      Agrega componentes desde el panel izquierdo.
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <aside className="overflow-y-auto border-l border-line bg-white p-4 scrollbar-thin">
          {block ? (
            <BlockProperties
              key={block.id}
              landingId={l.id}
              block={block}
              onChange={(props) => {
                snapshot()
                pageBuilder.updateBlock(l.id, block.id, props)
                afterChange()
              }}
              onDuplicate={() => {
                snapshot()
                pageBuilder.duplicateBlock(l.id, block.id)
                afterChange()
              }}
              onRemove={() => {
                snapshot()
                pageBuilder.removeBlock(l.id, block.id)
                afterChange()
                setSelected(null)
              }}
              onToggle={(v) => {
                pageBuilder.toggleBlock(l.id, block.id, v)
              }}
            />
          ) : (
            <p className="mt-10 text-center text-[12px] text-ink-faint">Selecciona un bloque en el lienzo para editar sus propiedades.</p>
          )}
        </aside>
      </div>

      {showThemes && (
        <ThemeDrawer
          landingId={l.id}
          onClose={() => setShowThemes(false)}
          onApply={(themeId) => {
            landingsService.applyThemePreset(l.id, themeId)
            showToast('Tema aplicado')
          }}
        />
      )}
      {showVersions && <VersionsDrawer landingId={l.id} onClose={() => setShowVersions(false)} />}
    </div>
  )
}

function BlockProperties({
  block,
  onChange,
  onDuplicate,
  onRemove,
  onToggle,
}: {
  landingId: string
  block: PageBlock
  onChange: (props: Record<string, any>) => void
  onDuplicate: () => void
  onRemove: () => void
  onToggle: (v: boolean) => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Propiedades · {block.type}</p>
        <div className="flex gap-1">
          <button onClick={() => onToggle(!block.visible)} className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-surface-muted" title="Mostrar/ocultar">
            <EyeOff size={13} />
          </button>
          <button onClick={onDuplicate} className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint hover:bg-surface-muted" title="Duplicar">
            <Copy size={13} />
          </button>
          <button onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-lg text-red-500 hover:bg-red-50" title="Eliminar">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="space-y-3.5">
        {(block.type === 'heading' || block.type === 'text' || block.type === 'banner') && (
          <>
            <TextArea label="Texto" value={block.props.text ?? ''} onChange={(v) => onChange({ text: v })} />
            {block.type !== 'banner' && (
              <div>
                <p className="mb-1.5 text-[11px] font-bold text-ink-soft">Alineación</p>
                <div className="flex gap-1.5">
                  {['left', 'center', 'right'].map((a) => (
                    <button
                      key={a}
                      onClick={() => onChange({ align: a })}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold capitalize ${block.props.align === a ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line text-ink-faint'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {block.type === 'banner' && (
              <div className="flex gap-1.5">
                {['brand', 'mint', 'amber'].map((t) => (
                  <button key={t} onClick={() => onChange({ tone: t })} className={`h-7 flex-1 rounded-lg border capitalize text-[11px] font-semibold ${block.props.tone === t ? 'border-brand-400 bg-brand-50' : 'border-line'}`}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {block.type === 'image' && (
          <>
            <Input label="URL de imagen" value={block.props.src ?? ''} onChange={(v) => onChange({ src: v })} placeholder="https://…" />
            <Input label="Texto alternativo" value={block.props.alt ?? ''} onChange={(v) => onChange({ alt: v })} />
          </>
        )}
        {block.type === 'video' && <Input label="URL del video" value={block.props.url ?? ''} onChange={(v) => onChange({ url: v })} placeholder="https://…" />}
        {block.type === 'button' && (
          <>
            <Input label="Etiqueta" value={block.props.label ?? ''} onChange={(v) => onChange({ label: v })} />
            <Input label="Enlace" value={block.props.href ?? ''} onChange={(v) => onChange({ href: v })} />
          </>
        )}
        {block.type === 'icon' && <Input label="Emoji / símbolo" value={block.props.symbol ?? ''} onChange={(v) => onChange({ symbol: v })} />}
        {block.type === 'spacer' && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold text-ink-soft">Altura ({block.props.size ?? 24}px)</p>
            <input type="range" min={8} max={120} value={block.props.size ?? 24} onChange={(e) => onChange({ size: +e.target.value })} className="w-full" />
          </div>
        )}
        {block.type === 'section' && <Input label="Color de fondo" value={block.props.bg ?? '#ffffff'} onChange={(v) => onChange({ bg: v })} type="color" />}
        {block.type === 'columns' && (
          <div className="flex gap-1.5">
            {[2, 3].map((c) => (
              <button key={c} onClick={() => onChange({ count: c })} className={`h-8 flex-1 rounded-lg border text-[12px] font-bold ${block.props.count === c ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-line text-ink-faint'}`}>
                {c} columnas
              </button>
            ))}
          </div>
        )}
        {block.type === 'form' && <p className="text-[12px] leading-relaxed text-ink-faint">Los campos de este formulario se editan desde "Editar formulario" en la barra superior.</p>}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block text-[11px] font-bold text-ink-soft">
      {label}
      <input value={value} placeholder={placeholder} type={type} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
    </label>
  )
}
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-[11px] font-bold text-ink-soft">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-[12.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100" />
    </label>
  )
}

function ThemeDrawer({ landingId, onClose, onApply }: { landingId: string; onClose: () => void; onApply: (themeId: string) => void }) {
  const db = useDb()
  const l = landingsService.get(landingId)
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-navy-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-sm animate-fade-in overflow-y-auto bg-white p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Tema</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-surface-muted"><X size={16} /></button>
        </div>
        <div className="space-y-3">
          {db.themes.map((t) => (
            <button
              key={t.id}
              onClick={() => onApply(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition ${l?.theme.themeId === t.id ? 'border-brand-400 bg-brand-50/50' : 'border-line hover:bg-surface-sunk'}`}
            >
              <div className="h-10 w-10 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.bg})` }} />
              <div>
                <p className="text-[13px] font-bold text-ink">{t.name}</p>
                <p className="text-[11px] text-ink-faint capitalize">{t.font} · {t.spacing}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 border-t border-line-soft pt-5">
          <p className="mb-2 text-[11px] font-bold text-ink-soft">Color principal personalizado</p>
          <input
            type="color"
            value={l?.theme.primary}
            onChange={(e) => landingsService.updateTheme(landingId, { primary: e.target.value })}
            className="h-10 w-full rounded-lg border border-line"
          />
        </div>
      </div>
    </div>
  )
}

function VersionsDrawer({ landingId, onClose }: { landingId: string; onClose: () => void }) {
  const showToast = useToast((s) => s.show)
  const l = landingsService.get(landingId)
  if (!l) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-navy-950/40 backdrop-blur-sm" onClick={onClose}>
      <div className="h-full w-full max-w-sm animate-fade-in overflow-y-auto bg-white p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Versiones</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink-faint hover:bg-surface-muted"><X size={16} /></button>
        </div>
        {l.versions.length === 0 && <p className="text-[12.5px] text-ink-faint">Aún no hay versiones publicadas.</p>}
        <div className="space-y-2.5">
          {[...l.versions].reverse().map((v) => (
            <div key={v.version} className="rounded-xl border border-line-soft p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-ink">
                  v{v.version} {v.version === l.currentVersion && <span className="ml-1 rounded-full bg-mint-100 px-2 py-0.5 text-[10px] font-bold text-mint-700">Publicada</span>}
                </p>
                <span className="text-[11px] text-ink-faint">{fmt(v.at)}</span>
              </div>
              <button
                onClick={() => {
                  landingsService.restoreVersion(landingId, v.version)
                  showToast(`Versión v${v.version} restaurada`)
                }}
                className="mt-2.5 rounded-lg border border-line px-3 py-1.5 text-[11.5px] font-bold text-ink-soft transition hover:bg-surface-sunk"
              >
                Restaurar esta versión
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
