import { Mic, Loader2 } from 'lucide-react'

interface Props {
  mode: 'idle' | 'speaking' | 'listening' | 'processing'
  level: number // 0-1
  primary: string
}

export default function AssistantAvatar({ mode, level, primary }: Props) {
  const scale = 1 + (mode === 'speaking' || mode === 'listening' ? level * 0.35 : 0)
  const ringOpacity = 0.15 + level * 0.5

  return (
    <div className="relative grid h-40 w-40 place-items-center">
      {(mode === 'speaking' || mode === 'listening') && (
        <span
          className="absolute inset-0 rounded-full transition-transform duration-75"
          style={{ background: primary, opacity: ringOpacity, transform: `scale(${1 + level * 0.6})` }}
        />
      )}
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full text-white shadow-pop transition-transform duration-75"
        style={{ background: primary, transform: `scale(${scale})` }}
      >
        {mode === 'processing' ? (
          <Loader2 size={34} className="animate-spin" />
        ) : mode === 'listening' ? (
          <Mic size={34} />
        ) : (
          <div className="flex items-end gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-white"
                style={{
                  height: mode === 'speaking' ? `${10 + Math.abs(Math.sin((level + i) * 3)) * 22}px` : '8px',
                  transition: 'height 90ms ease',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
