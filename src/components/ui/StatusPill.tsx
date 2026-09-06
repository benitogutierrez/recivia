import clsx from 'clsx'

const MAP: Record<string, string> = {
  Publicada: 'bg-mint-100 text-mint-800',
  Activo: 'bg-mint-100 text-mint-800',
  Contactado: 'bg-mint-100 text-mint-800',
  Borrador: 'bg-amber-100 text-amber-600',
  Nuevo: 'bg-brand-100 text-brand-700',
  Invitado: 'bg-brand-100 text-brand-700',
  Inactivo: 'bg-line-soft text-ink-faint',
}

export default function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold',
        MAP[value] ?? 'bg-line-soft text-ink-faint',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {value}
    </span>
  )
}
