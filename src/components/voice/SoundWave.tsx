export default function SoundWave({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="ribbon-1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="45%" stopColor="#f0abfc" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id="ribbon-2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#f9a8d4" />
        </linearGradient>
        <linearGradient id="ribbon-3" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#ddd6fe" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <filter id="wave-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <path
        d="M -20,170 C 90,80 180,240 280,150 C 380,60 470,230 570,140 C 660,60 760,210 920,120
           L 920,190 C 760,280 660,130 570,210 C 470,300 380,130 280,220 C 180,310 90,150 -20,240 Z"
        fill="url(#ribbon-1)"
        opacity="0.55"
        filter="url(#wave-blur)"
      />
      <path
        d="M -20,150 C 100,220 200,60 300,130 C 400,200 500,40 600,110 C 700,180 800,50 920,140
           L 920,190 C 800,100 700,230 600,160 C 500,90 400,250 300,180 C 200,110 100,270 -20,200 Z"
        fill="url(#ribbon-2)"
        opacity="0.5"
        filter="url(#wave-blur)"
      />
      <path
        d="M -20,160 C 120,110 240,210 360,155 C 480,100 600,200 720,150 C 800,120 860,150 920,155
           L 920,175 C 860,170 800,140 720,170 C 600,220 480,120 360,175 C 240,230 120,130 -20,180 Z"
        fill="url(#ribbon-3)"
        opacity="0.85"
      />
    </svg>
  )
}
