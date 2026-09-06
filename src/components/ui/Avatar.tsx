import clsx from 'clsx'
import { initials } from '../../lib/utils'

export default function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <div
      className={clsx(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-brand-200 font-bold text-brand-800',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials(name)}
    </div>
  )
}
