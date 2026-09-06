import type { BlockType, PageBlock } from '../types'
import { stamp, uuid } from '../lib/utils'
import { getDb, updateDb } from './store'

const DEFAULT_PROPS: Record<BlockType, Record<string, any>> = {
  heading: { text: 'Nuevo título', align: 'center' },
  text: { text: 'Escribe un texto de apoyo aquí.', align: 'center' },
  image: { src: '', alt: 'Imagen' },
  logo: {},
  video: { url: '' },
  button: { label: 'Botón', href: '#' },
  icon: { symbol: '★' },
  banner: { text: 'Aviso destacado', tone: 'brand' },
  divider: {},
  spacer: { size: 24 },
  section: { bg: '#ffffff' },
  columns: { count: 2 },
  form: {},
}

export const BLOCK_LIBRARY: { type: BlockType; label: string; group: 'Contenido' | 'Layout' | 'Formulario' }[] = [
  { type: 'heading', label: 'Heading', group: 'Contenido' },
  { type: 'text', label: 'Texto enriquecido', group: 'Contenido' },
  { type: 'image', label: 'Imagen', group: 'Contenido' },
  { type: 'logo', label: 'Logo', group: 'Contenido' },
  { type: 'video', label: 'Video', group: 'Contenido' },
  { type: 'button', label: 'Botón', group: 'Contenido' },
  { type: 'icon', label: 'Icono', group: 'Contenido' },
  { type: 'banner', label: 'Banner', group: 'Contenido' },
  { type: 'divider', label: 'Separador', group: 'Contenido' },
  { type: 'spacer', label: 'Espaciador', group: 'Contenido' },
  { type: 'section', label: 'Sección', group: 'Layout' },
  { type: 'columns', label: 'Columnas', group: 'Layout' },
  { type: 'form', label: 'Formulario', group: 'Formulario' },
]

export function blocksOf(landingId: string) {
  return getDb().landings.find((l) => l.id === landingId)?.blocks ?? []
}

export function addBlock(landingId: string, type: BlockType) {
  const block: PageBlock = { id: uuid(), type, visible: true, props: { ...DEFAULT_PROPS[type] } }
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, blocks: [...l.blocks, block], updatedAt: stamp() } : l)),
  }))
  return block
}

export function updateBlock(landingId: string, blockId: string, props: Record<string, any>) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) =>
      l.id !== landingId
        ? l
        : { ...l, updatedAt: stamp(), blocks: l.blocks.map((b) => (b.id === blockId ? { ...b, props: { ...b.props, ...props } } : b)) },
    ),
  }))
}

export function toggleBlock(landingId: string, blockId: string, visible: boolean) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) =>
      l.id !== landingId ? l : { ...l, blocks: l.blocks.map((b) => (b.id === blockId ? { ...b, visible } : b)) },
    ),
  }))
}

export function duplicateBlock(landingId: string, blockId: string) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => {
      if (l.id !== landingId) return l
      const idx = l.blocks.findIndex((b) => b.id === blockId)
      if (idx === -1) return l
      const copy = { ...l.blocks[idx], id: uuid() }
      const blocks = [...l.blocks]
      blocks.splice(idx + 1, 0, copy)
      return { ...l, blocks, updatedAt: stamp() }
    }),
  }))
}

export function removeBlock(landingId: string, blockId: string) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, blocks: l.blocks.filter((b) => b.id !== blockId), updatedAt: stamp() } : l)),
  }))
}

export function reorderBlocks(landingId: string, orderedIds: string[]) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => {
      if (l.id !== landingId) return l
      const byId = Object.fromEntries(l.blocks.map((b) => [b.id, b]))
      return { ...l, blocks: orderedIds.map((id) => byId[id]).filter(Boolean), updatedAt: stamp() }
    }),
  }))
}

export function setBlocks(landingId: string, blocks: PageBlock[]) {
  updateDb((db) => ({
    ...db,
    landings: db.landings.map((l) => (l.id === landingId ? { ...l, blocks, updatedAt: stamp() } : l)),
  }))
}
