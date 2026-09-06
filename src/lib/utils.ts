export const uuid = () => crypto.randomUUID()
export const stamp = () => new Date().toISOString()

const DIACRITICS = new RegExp(String.fromCharCode(0x5b, 0x5c, 0x75, 0x30, 0x33, 0x30, 0x30, 0x2d, 0x5c, 0x75, 0x30, 0x33, 0x36, 0x66, 0x5d), 'g')
const stripDiacritics = (s: string) => s.normalize('NFD').replace(DIACRITICS, '')

export const fmt = (d: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(d),
  )

export function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const hr = Math.round(min / 60)
  if (hr < 24) return `hace ${hr} h`
  const day = Math.round(hr / 24)
  if (day < 30) return `hace ${day} d`
  return fmt(d)
}

export const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(d))

export const slugify = (s: string) =>
  stripDiacritics(s.toLowerCase())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

export function guessFieldType(label: string): import('../types').FieldType {
  if (label.includes('Correo')) return 'email'
  if (label.includes('Teléfono')) return 'tel'
  if (label.includes('RUT')) return 'text'
  if (label.includes('Tipo')) return 'select'
  return 'text'
}

export function makeField(label: string, i = 0): import('../types').FieldDef {
  const type = guessFieldType(label)
  return {
    id: uuid(),
    label,
    key: stripDiacritics(label.toLowerCase()).replaceAll(' ', '_'),
    type,
    description: '',
    required: i < 3,
    placeholder: '',
    defaultValue: '',
    options: type === 'select' ? 'Corporativo|Empleados|Clientes|Otro' : '',
    order: i,
    width: i === 4 ? 'full' : 'half',
    visible: true,
    validation: {},
  }
}

type VarBucket = Record<string, string | undefined>

export function resolveVariables(
  template: string,
  ctx: { empresa?: VarBucket; landing?: VarBucket; form?: VarBucket },
) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, path: string) => {
    if (path === 'fecha') return fmtDate(stamp())
    const [scope, key] = path.split('.')
    const bucket = (ctx as any)[scope]
    if (bucket && key in bucket) return String(bucket[key] ?? '')
    return `{{${path}}}`
  })
}

export function downloadBlob(filename: string, content: string, type: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type }))
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function toCSV(rows: Record<string, string>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const esc = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.map(esc).join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n')
}

export function toExcelXml(rows: Record<string, string>[], sheetName = 'Registros') {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const cell = (v: string) => `<Cell><Data ss:Type="String">${String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Data></Cell>`
  const headerRow = `<Row>${headers.map((h) => cell(h)).join('')}</Row>`
  const dataRows = rows.map((r) => `<Row>${headers.map((h) => cell(r[h])).join('')}</Row>`).join('')
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="${sheetName}"><Table>${headerRow}${dataRows}</Table></Worksheet>
</Workbook>`
}
