import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { auth } from '../services'
import { Logo } from '../components/Shell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('benito@recivia.cl')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const res = auth.login(email)
    if (res.ok) navigate('/')
    else setError(res.error)
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center gap-2.5">
            <Logo size={36} />
            <span className="font-display text-xl font-bold tracking-tight text-ink">recivia</span>
          </div>
          <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Bienvenido de vuelta</h1>
          <p className="mt-2 text-[13.5px] text-ink-faint">Ingresa para administrar tus empresas, landings y registros.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-[11px] font-bold text-ink-soft">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                required
              />
            </label>
            <label className="block text-[11px] font-bold text-ink-soft">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Cualquier valor sirve en esta demo"
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-3 text-[13.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-[13.5px] font-bold text-white shadow-glow transition hover:bg-brand-700"
            >
              Iniciar sesión <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-line-soft bg-surface-sunk p-3.5 text-[11.5px] leading-relaxed text-ink-faint">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-500" />
            <span>
              Demo: usa <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-ink">benito@recivia.cl</code> (Super Admin) o{' '}
              <code className="rounded bg-white px-1 py-0.5 font-mono text-[10.5px] text-ink">maria@bata.cl</code> (Admin).
            </span>
          </div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-brand-950 lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-grain opacity-40" />
        <div className="relative z-10 max-w-md px-10 text-white">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-mint-400">Recepción de datos, sin fricción</p>
          <h2 className="mt-4 font-display text-[32px] font-bold leading-[1.15] tracking-tight">
            Crea landings de recepción tan fácil como armar un formulario.
          </h2>
          <p className="mt-4 text-[14px] leading-relaxed text-navy-200">
            Empresas, landings, formularios, automatizaciones y registros — todo desde un mismo lugar, sin depender de desarrolladores.
          </p>
          <div className="mt-10 flex -space-x-2">
            {['👞', '🏢', '📄', '⚡'].map((e, i) => (
              <div key={i} className="grid h-11 w-11 place-items-center rounded-full border-2 border-navy-900 bg-white/10 text-lg backdrop-blur">
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
