export default function SoundWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 200" preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="wave-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id="wave-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="50%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
      </defs>
      <path
        d="M0,100 C80,20 160,20 240,100 C320,180 400,180 480,100 C560,20 640,20 720,100 C760,140 780,140 800,100"
        fill="none"
        stroke="url(#wave-a)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d="M0,100 C90,160 170,160 250,100 C330,40 410,40 490,100 C570,160 650,160 730,100 C765,70 785,70 800,100"
        fill="none"
        stroke="url(#wave-b)"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}
