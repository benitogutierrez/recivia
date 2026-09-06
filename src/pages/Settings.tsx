import { useState } from 'react'
import { Building2, Mail, MessageCircle, Globe, ShieldCheck } from 'lucide-react'
import Shell from '../components/Shell'
import { companies, useDb } from '../services'
import { useToast } from '../lib/toast'

const TABS = [
  { id: 'org', label: 'Organización', icon: Building2 },
  { id: 'email', label: 'Correo electrónico', icon: Mail },
  { id: 'wa', label: 'WhatsApp', icon: MessageCircle },
  { id: 'domains', label: 'Dominios', icon: Globe },
  { id: 'security', label: 'Seguridad', icon: ShieldCheck },
]

export default function Settings() {
  const db = useDb()
  const c = db.companies[0]
  const showToast = useToast((s) => s.show)
  const [tab, setTab] = useState('org')
  const [form, setForm] = useState({ name: c.name, legal: c.legal, email: c.email, wa: c.wa })

  return (
    <Shell title="Configuración">
      <section className="w-full px-6 py-9 md:px-10">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Configuración</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-faint">Gestiona la organización, proveedores y seguridad de tu cuenta.</p>

        <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-[190px_1fr]">
          <aside className="flex gap-1 overflow-x-auto md:block md:space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-[12.5px] font-semibold transition ${
                  tab === t.id ? 'bg-brand-50 text-brand-700' : 'text-ink-faint hover:bg-surface-sunk hover:text-ink'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </aside>

          <article className="rounded-2xl border border-line bg-white p-7 shadow-soft">
            {tab === 'org' && (
              <>
                <h2 className="text-[17px] font-bold text-ink">Datos de la organización</h2>
                <p className="mt-1 text-[12.5px] text-ink-faint">
                  Disponibles como variables dinámicas: <code className="rounded bg-surface-sunk px-1 py-0.5 font-mono text-[11px]">{'{{empresa.nombre}}'}</code>
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    ['Nombre visible', 'name'],
                    ['Razón social', 'legal'],
                    ['Correo de contacto', 'email'],
                    ['WhatsApp', 'wa'],
                  ].map(([label, key]) => (
                    <label key={key} className="block text-[11px] font-bold text-ink-soft">
                      {label}
                      <input
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-[13px] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                      />
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => {
                    companies.update(c.id, form)
                    showToast('Configuración guardada')
                  }}
                  className="mt-6 rounded-lg bg-brand-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-glow hover:bg-brand-700"
                >
                  Guardar cambios
                </button>
              </>
            )}
            {tab === 'email' && (
              <div className="text-[13px] text-ink-faint">
                La configuración de email se define por landing en <b className="text-ink">Landings → Automatizaciones</b>, ya que cada
                formulario puede notificar a destinatarios distintos.
              </div>
            )}
            {tab === 'wa' && (
              <div className="text-[13px] text-ink-faint">
                La configuración de WhatsApp también vive por landing, en <b className="text-ink">Automatizaciones</b>. Recivia abstrae el
                envío mediante un sistema de proveedores (Meta Cloud API, Twilio, 360dialog) intercambiable sin cambiar el resto del producto.
              </div>
            )}
            {tab === 'domains' && (
              <div className="text-[13px] text-ink-faint">
                Por defecto tus landings se publican en <code className="rounded bg-surface-sunk px-1 py-0.5">recivia.cl/slug</code>. La
                conexión de dominios propios está prevista en la arquitectura para una siguiente etapa.
              </div>
            )}
            {tab === 'security' && (
              <div className="space-y-3 text-[13px] text-ink-faint">
                <p>Consideraciones de seguridad relevantes para este prototipo frontend:</p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>Todo el contenido dinámico se escapa automáticamente por React (protección XSS por defecto).</li>
                  <li>El formulario público incluye un campo honeypot y una verificación anti-spam simple.</li>
                  <li>Autenticación, CSRF, rate limiting y validación server-side requieren un backend real — quedan fuera de este alcance.</li>
                </ul>
              </div>
            )}
          </article>
        </div>
      </section>
    </Shell>
  )
}
