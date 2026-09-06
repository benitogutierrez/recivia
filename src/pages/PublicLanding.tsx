import { FormEvent, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, Sparkles, Settings } from 'lucide-react'
import { companies as companiesService, landings as landingsService, submissions as submissionsService, useDb } from '../services'
import BlockRenderer from '../components/BlockRenderer'
import FormRenderer from '../components/FormRenderer'
import VoiceAssistant from '../components/voice/VoiceAssistant'
import { resolveVariables } from '../lib/utils'

export default function PublicLanding() {
  const { id } = useParams()
  const db = useDb()
  const l = landingsService.get(id)
  const company = l ? companiesService.get(l.companyId) : undefined
  const [sent, setSent] = useState(false)
  const [captcha, setCaptcha] = useState({ a: 2, b: 3, answer: '' })

  useEffect(() => {
    if (l) landingsService.registerView(l.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!l || !company) return null

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (fd.get('_gotcha')) return // honeypot: bot detectado, ignorar silenciosamente
    if (+captcha.answer !== captcha.a + captcha.b) {
      alert('Verificación anti-spam incorrecta, intenta nuevamente.')
      return
    }
    const values: Record<string, string> = {}
    fd.forEach((v, k) => {
      if (k !== '_gotcha') values[k] = String(v)
    })
    submissionsService.submitPublic(l.id, values)
    setSent(true)
  }

  const ctx = { empresa: { nombre: company.name }, landing: { title: l.hero.title } }
  const formIndex = l.blocks.findIndex((b) => b.type === 'form')
  const beforeForm = (formIndex === -1 ? l.blocks : l.blocks.slice(0, formIndex)).filter((b) => b.visible)
  const afterForm = (formIndex === -1 ? [] : l.blocks.slice(formIndex + 1)).filter((b) => b.visible)

  return (
    <div className="min-h-screen bg-white" style={{ ['--primary' as any]: l.theme.primary }}>
      {l.status !== 'Publicada' && (
        <div className="bg-amber-400 py-2 text-center text-[12px] font-bold text-amber-950">
          Vista previa · esta landing aún no está publicada
        </div>
      )}
      <nav className="flex items-center justify-between px-[6%] py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg text-lg" style={{ background: l.theme.bg }}>
            {company.logo}
          </span>
          <span className="font-display text-lg font-bold text-ink">{company.name}</span>
        </div>
        <Link to="/" className="flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-[12px] font-bold text-white">
          <Settings size={13} /> Administrar en Recivia
        </Link>
      </nav>

      <section className="grid grid-cols-1 items-center gap-14 px-[6%] py-16 lg:grid-cols-2" style={{ background: l.theme.bg }}>
        <div className="space-y-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: l.theme.primary }}>
            {l.hero.eyebrow}
          </span>
          {beforeForm.length > 0 ? (
            <div className="space-y-5 [&_h2]:text-[clamp(32px,4.5vw,52px)] [&_h2]:leading-[1.05]">
              {beforeForm.map((b) => (
                <BlockRenderer key={b.id} block={b} landing={l} company={company} />
              ))}
            </div>
          ) : (
            <div>
              <h1 className="font-display text-[clamp(32px,4.5vw,52px)] font-bold leading-[1.05] tracking-tight text-ink">{l.hero.title}</h1>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-soft">{l.hero.text}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-pop">
          {!sent && l.mode === 'voice' ? (
            <VoiceAssistant landing={l} company={company} onComplete={(values) => submissionsService.submitPublic(l.id, values)} />
          ) : !sent ? (
            <>
              <h2 className="text-[19px] font-bold text-ink">Solicita información</h2>
              <p className="mt-1 text-[12.5px] text-ink-faint">Completa tus datos y nuestro equipo se pondrá en contacto.</p>
              <div className="mt-5">
                <FormRenderer fields={l.fields} submitLabel={l.submitLabel || l.hero.button} primary={l.theme.primary} onSubmit={onSubmit} honeypot />
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface-sunk px-3 py-2 text-[11.5px] text-ink-faint">
                Verificación: {captcha.a} + {captcha.b} =
                <input
                  value={captcha.answer}
                  onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value })}
                  className="w-14 rounded border border-line px-1.5 py-0.5 text-center"
                />
              </div>
              <label className="mt-3 flex items-start gap-2 text-[10.5px] text-ink-faint">
                <input required type="checkbox" className="mt-0.5" /> Acepto el tratamiento de mis datos personales.
              </label>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-mint-50 text-mint-600">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="mt-4 text-[19px] font-bold text-ink">¡Solicitud recibida!</h2>
              <p className="mt-2 text-[13px] text-ink-faint">{resolveVariables(l.automation.actions.confirmationMessage, ctx)}</p>
            </div>
          )}
        </div>
      </section>

      {afterForm.length > 0 && (
        <div className="mx-auto max-w-3xl space-y-8 px-[6%] py-14">
          {afterForm.map((b) => (
            <BlockRenderer key={b.id} block={b} landing={l} company={company} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-8 border-t border-line px-[6%] py-6 text-[12px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-mint-600" /> Información protegida
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 size={13} className="text-mint-600" /> Sin compromiso
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-brand-500" /> Creado con Recivia
        </span>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 px-[6%] py-8 text-[12px] text-ink-faint">
        <b className="text-ink">{company.name}</b>
        <span>Una experiencia creada con Recivia</span>
      </footer>
    </div>
  )
}
