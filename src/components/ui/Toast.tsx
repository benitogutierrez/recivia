import { CheckCircle2 } from 'lucide-react'
import { useToast } from '../../lib/toast'

export default function Toast() {
  const msg = useToast((s) => s.message)
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-navy-950 px-4 py-3.5 text-[13px] font-medium text-white shadow-pop transition-all duration-300 ${
        msg ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <CheckCircle2 size={16} className="text-mint-400" />
      {msg}
    </div>
  )
}
