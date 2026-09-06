import { ReactNode } from 'react'

export default function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-in">
      <div>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 max-w-xl text-[13.5px] text-ink-faint">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}
