import { ReactNode } from 'react'
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import type { Company, Landing, PageBlock } from '../types'
import { resolveVariables } from '../lib/utils'

const TONE: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  mint: 'bg-mint-50 text-mint-700 border-mint-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
}

export default function BlockRenderer({
  block,
  landing,
  company,
  formNode,
  editable,
  selected,
  onSelect,
}: {
  block: PageBlock
  landing: Landing
  company?: Company
  formNode?: ReactNode
  editable?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const ctx = { empresa: company ? { nombre: company.name, logo: company.logo } : {}, landing: { title: landing.hero.title, text: landing.hero.text } }
  const text = (v: string) => resolveVariables(v, ctx)
  const alignClass = (a: string) => (a === 'left' ? 'text-left' : a === 'right' ? 'text-right' : 'text-center')

  const wrap = (node: ReactNode) => (
    <div
      onClick={(e) => {
        if (editable) {
          e.stopPropagation()
          onSelect?.()
        }
      }}
      className={editable ? `cursor-pointer rounded-lg outline-2 outline-offset-2 transition ${selected ? 'outline-brand-400' : 'outline-transparent hover:outline-brand-200'}` : ''}
    >
      {node}
    </div>
  )

  switch (block.type) {
    case 'heading':
      return wrap(
        <h2 className={`font-display text-[28px] font-bold leading-tight tracking-tight text-ink ${alignClass(block.props.align)}`}>
          {text(block.props.text)}
        </h2>,
      )
    case 'text':
      return wrap(<p className={`text-[14px] leading-relaxed text-ink-soft ${alignClass(block.props.align)}`}>{text(block.props.text)}</p>)
    case 'image':
      return wrap(
        block.props.src ? (
          <img src={block.props.src} alt={block.props.alt} className="w-full rounded-xl object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-line bg-surface-sunk text-ink-faint">
            <ImageIcon size={22} />
          </div>
        ),
      )
    case 'logo':
      return wrap(<div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-surface-sunk text-3xl">{company?.logo ?? '🏢'}</div>)
    case 'video':
      return wrap(
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-line bg-surface-sunk text-ink-faint">
          <VideoIcon size={22} />
        </div>,
      )
    case 'button':
      return wrap(
        <div className="text-center">
          <span className="inline-block rounded-lg px-5 py-2.5 text-[13px] font-bold text-white" style={{ background: landing.theme.primary }}>
            {block.props.label}
          </span>
        </div>,
      )
    case 'icon':
      return wrap(<div className="text-center text-3xl">{block.props.symbol}</div>)
    case 'banner':
      return wrap(<div className={`rounded-xl border px-4 py-3 text-center text-[12.5px] font-bold ${TONE[block.props.tone] ?? TONE.brand}`}>{text(block.props.text)}</div>)
    case 'divider':
      return wrap(<hr className="border-line-soft" />)
    case 'spacer':
      return wrap(<div style={{ height: block.props.size ?? 24 }} />)
    case 'section':
      return wrap(
        <div className="rounded-xl p-6" style={{ background: block.props.bg || '#fff' }}>
          <p className="text-[11px] font-semibold text-ink-faint">Sección contenedora</p>
        </div>,
      )
    case 'columns':
      return wrap(
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.props.count ?? 2}, minmax(0,1fr))` }}>
          {Array.from({ length: block.props.count ?? 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-dashed border-line bg-surface-sunk/60 p-6 text-center text-[11px] text-ink-faint">
              Columna {i + 1}
            </div>
          ))}
        </div>,
      )
    case 'form':
      return wrap(<div>{formNode}</div>)
    default:
      return null
  }
}
