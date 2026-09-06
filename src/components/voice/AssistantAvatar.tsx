interface Props {
  mode: 'idle' | 'speaking' | 'listening' | 'processing'
  level: number // 0-1
  primary: string
}

/** Orbe orgánico inspirado en el modo de voz de ChatGPT: sin íconos, solo un
 * blob de gradiente que respira suavemente en reposo y reacciona al nivel de
 * audio cuando habla o escucha. */
export default function AssistantAvatar({ mode, level, primary }: Props) {
  const active = mode === 'speaking' || mode === 'listening'
  const coreScale = 1 + (active ? level * 0.22 : 0)
  const glowOpacity = mode === 'idle' ? 0.35 : 0.55 + level * 0.35

  return (
    <div className="relative grid h-56 w-56 place-items-center sm:h-64 sm:w-64">
      <div
        className="absolute inset-0 rounded-full blur-3xl transition-opacity duration-700"
        style={{ background: `radial-gradient(circle, ${primary}66, transparent 70%)`, opacity: glowOpacity }}
      />
      <div
        className={`absolute h-[88%] w-[88%] blur-xl transition-opacity duration-500 ${mode === 'processing' ? 'animate-spin' : 'animate-blob-slow'}`}
        style={{ background: `linear-gradient(135deg, ${primary}, #f0abfc)`, opacity: active ? 0.75 : 0.55 }}
      />
      <div
        className="absolute h-[72%] w-[72%] animate-blob-slower blur-lg"
        style={{ background: `linear-gradient(135deg, #93c5fd, ${primary})`, opacity: active ? 0.65 : 0.45 }}
      />
      <div
        className="relative h-[52%] w-[52%] rounded-full shadow-pop transition-transform duration-150 ease-out"
        style={{
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.95), ${primary} 65%)`,
          transform: `scale(${coreScale})`,
        }}
      />
    </div>
  )
}
