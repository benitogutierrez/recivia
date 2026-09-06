import { useState } from 'react'
import { ChevronDown, Zap, Save, Mail, MessageCircle, CheckCircle2, ArrowRight, Webhook, Sheet, Users2, Slack, Bell, MessageSquareText } from 'lucide-react'
import Shell from '../components/Shell'
import PageHeader from '../components/ui/PageHeader'
import StatusPill from '../components/ui/StatusPill'
import { automations, landings as landingsService, notifications, useDb } from '../services'
import { useToast } from '../lib/toast'
import { fmt, resolveVariables } from '../lib/utils'
import type { WhatsAppProvider } from '../types'

const FUTURE_ICONS: Record<string, any> = {
  Webhook,
  API: Webhook,
  'Google Sheets': Sheet,
  CRM: Users2,
  Slack,
  'Microsoft Teams': Users2,
  SMS: MessageSquareText,
}

const VARIABLES = ['{{empresa.nombre}}', '{{empresa.email}}', '{{empresa.telefono}}', '{{landing.nombre}}', '{{landing.url}}', '{{form.nombre_completo}}', '{{form.correo_electronico}}', '{{fecha}}']

export default function Automations() {
  const db = useDb()
  const showToast = useToast((s) => s.show)
  const [landingId, setLandingId] = useState(db.landings[0]?.id)
  const l = db.landings.find((x) => x.id === landingId) ?? db.landings[0]
  const logs = notifications.logsOf(l.id)
  const sample = { nombre_completo: 'Camila Fernández', correo_electronico: 'camila@empresa.cl' }

  return (
    <Shell title="Automatizaciones">
      <section className="w-full px-6 py-9 md:px-10">
        <PageHeader
          title="Automatizaciones"
          subtitle="Define qué sucede en el momento en que llega un registro."
          action={
            <div className="relative">
              <select
                value={landingId}
                onChange={(e) => setLandingId(e.target.value)}
                className="appearance-none rounded-xl border border-line bg-white py-2.5 pl-4 pr-9 text-[13px] font-bold text-ink outline-none"
              >
                {db.landings.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            </div>
          }
        />

        <article className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-soft">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-plum-50 px-3 py-1.5 text-[11px] font-bold text-plum-600">
              <Zap size={12} /> Trigger: Formulario enviado
            </span>
            <ArrowRight size={14} className="text-ink-faint" />
            <span className="text-[12px] text-ink-faint">Se ejecuta cada vez que alguien envía el formulario de "{l.name}"</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard icon={Save} label="Guardar registro" desc="Siempre activo" checked always />
            <ActionCard
              icon={Mail}
              label="Enviar Email"
              desc={l.email.enabled ? l.email.to : 'Sin configurar'}
              checked={l.automation.actions.sendEmail}
              onChange={(v) => automations.update(l.id, { sendEmail: v })}
            />
            <ActionCard
              icon={MessageCircle}
              label="Enviar WhatsApp"
              desc={l.whatsapp.number || 'Sin configurar'}
              checked={l.automation.actions.sendWhatsapp}
              onChange={(v) => automations.update(l.id, { sendWhatsapp: v })}
            />
            <ActionCard
              icon={CheckCircle2}
              label="Mostrar confirmación"
              desc="Mensaje al enviar"
              checked={l.automation.actions.showConfirmation}
              onChange={(v) => automations.update(l.id, { showConfirmation: v })}
            />
          </div>
          {l.automation.actions.showConfirmation && (
            <textarea
              value={l.automation.actions.confirmationMessage}
              onChange={(e) => automations.update(l.id, { confirmationMessage: e.target.value })}
              className="mt-3 w-full rounded-xl border border-line-soft bg-surface-sunk/50 px-3.5 py-2.5 text-[12.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              rows={2}
            />
          )}
        </article>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
                <Mail size={15} className="text-brand-600" /> Configuración de Email
              </h2>
              <Toggle checked={l.email.enabled} onChange={(v) => notifications.updateEmailConfig(l.id, { enabled: v })} />
            </div>
            <div className="space-y-3">
              <Row label="Destinatarios" value={l.email.to} onChange={(v) => notifications.updateEmailConfig(l.id, { to: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Row label="CC" value={l.email.cc} onChange={(v) => notifications.updateEmailConfig(l.id, { cc: v })} />
                <Row label="BCC" value={l.email.bcc} onChange={(v) => notifications.updateEmailConfig(l.id, { bcc: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Remitente" value={l.email.from} onChange={(v) => notifications.updateEmailConfig(l.id, { from: v })} />
                <Row label="Reply-To" value={l.email.replyTo} onChange={(v) => notifications.updateEmailConfig(l.id, { replyTo: v })} />
              </div>
              <Row label="Asunto" value={l.email.subject} onChange={(v) => notifications.updateEmailConfig(l.id, { subject: v })} />
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">Plantilla</label>
                <textarea
                  value={l.email.body}
                  onChange={(e) => notifications.updateEmailConfig(l.id, { body: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-line px-3 py-2.5 font-mono text-[11.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="rounded-xl bg-surface-sunk/70 p-3.5">
                <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Vista previa</p>
                <p className="whitespace-pre-line text-[12px] text-ink-soft">{resolveVariables(l.email.body, notifications.ctxFor(l.id, sample))}</p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-[14px] font-bold text-ink">
                <MessageCircle size={15} className="text-mint-600" /> Configuración de WhatsApp
              </h2>
              <Toggle checked={l.whatsapp.enabled} onChange={(v) => notifications.updateWhatsAppConfig(l.id, { enabled: v })} />
            </div>
            <div className="space-y-3">
              <Row label="Número" value={l.whatsapp.number} onChange={(v) => notifications.updateWhatsAppConfig(l.id, { number: v })} placeholder="+56 9 1234 5678" />
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">Proveedor</label>
                <select
                  value={l.whatsapp.provider}
                  onChange={(e) => notifications.updateWhatsAppConfig(l.id, { provider: e.target.value as WhatsAppProvider })}
                  className="w-full rounded-lg border border-line px-3 py-2.5 text-[12.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="meta_cloud">Meta Cloud API</option>
                  <option value="twilio">Twilio</option>
                  <option value="360dialog">360dialog</option>
                </select>
                <p className="mt-1 text-[10.5px] text-ink-faint">Abstraído vía WhatsAppService — cambiar de proveedor no requiere tocar el resto de Recivia.</p>
              </div>
              <Row label="Credenciales / API Key" value={l.whatsapp.apiKey} onChange={(v) => notifications.updateWhatsAppConfig(l.id, { apiKey: v })} type="password" />
              <div>
                <label className="mb-1.5 block text-[11px] font-bold text-ink-soft">Mensaje</label>
                <textarea
                  value={l.whatsapp.message}
                  onChange={(e) => notifications.updateWhatsAppConfig(l.id, { message: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-line px-3 py-2.5 font-mono text-[11.5px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
              <div className="rounded-xl bg-surface-sunk/70 p-3.5">
                <p className="mb-1 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Vista previa</p>
                <p className="whitespace-pre-line text-[12px] text-ink-soft">{resolveVariables(l.whatsapp.message, notifications.ctxFor(l.id, sample))}</p>
              </div>
            </div>
          </article>
        </div>

        <article className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-soft">
          <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Variables disponibles</p>
          <div className="flex flex-wrap gap-2">
            {VARIABLES.map((v) => (
              <button
                key={v}
                onClick={() => {
                  navigator.clipboard?.writeText(v)
                  showToast(`${v} copiada`)
                }}
                className="rounded-full bg-surface-sunk px-3 py-1.5 font-mono text-[11px] font-semibold text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
              >
                {v}
              </button>
            ))}
          </div>
        </article>

        <article className="mt-5 rounded-2xl border border-line bg-white p-6 shadow-soft">
          <p className="mb-3 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">Próximas integraciones</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {l.automation.future.map((name) => {
              const Icon = FUTURE_ICONS[name] ?? Bell
              return (
                <div key={name} className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5 text-[11.5px] font-semibold text-ink-faint">
                  <Icon size={13} /> {name}
                </div>
              )
            })}
          </div>
        </article>

        <article className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
          <div className="border-b border-line-soft px-6 py-4">
            <h2 className="text-[14px] font-bold text-ink">Registro de notificaciones</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-sunk">
                {['Canal', 'Destinatario', 'Fecha', 'Estado'].map((h) => (
                  <th key={h} className="px-5 py-3 font-mono text-[10.5px] font-bold uppercase tracking-wide text-ink-faint">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[12.5px] text-ink-faint">
                    Sin notificaciones aún.
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-line-soft">
                  <td className="px-5 py-3.5 text-[12.5px] font-semibold text-ink">{log.channel === 'email' ? 'Email' : 'WhatsApp'}</td>
                  <td className="px-5 py-3.5 text-[12px] text-ink-soft">{log.recipient}</td>
                  <td className="px-5 py-3.5 text-[12px] text-ink-faint">{fmt(log.at)}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill value={log.status === 'Enviado' ? 'Publicada' : log.status === 'Error' ? 'Borrador' : log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </Shell>
  )
}

function ActionCard({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
  always,
}: {
  icon: any
  label: string
  desc: string
  checked: boolean
  onChange?: (v: boolean) => void
  always?: boolean
}) {
  return (
    <div className={`rounded-xl border p-3.5 ${checked ? 'border-brand-200 bg-brand-50/40' : 'border-line-soft'}`}>
      <div className="mb-2 flex items-center justify-between">
        <Icon size={15} className={checked ? 'text-brand-600' : 'text-ink-faint'} />
        {always ? (
          <span className="text-[10px] font-bold text-ink-faint">Fijo</span>
        ) : (
          <Toggle checked={checked} onChange={onChange} />
        )}
      </div>
      <p className="text-[12px] font-bold text-ink">{label}</p>
      <p className="mt-0.5 truncate text-[10.5px] text-ink-faint">{desc}</p>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-line'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

function Row({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block text-[11px] font-bold text-ink-soft">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[12.5px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      />
    </label>
  )
}
