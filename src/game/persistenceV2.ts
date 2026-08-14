import { normalizeGameSessionV2, type GameSessionV2 } from './v2'

const STORAGE_KEY = 'xiuxian-simulator-save-v2'
type SaveEnvelope = { version: 2; savedAt: string; session: GameSessionV2 }

function encodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function decodeUtf8(value: string): string {
  const binary = atob(value)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function parseSession(value: Partial<SaveEnvelope>): GameSessionV2 | null {
  if (value.version !== 2 || !value.session || value.session.version !== 2 || typeof value.session.day !== 'number') return null
  return normalizeGameSessionV2(value.session)
}

export function saveV2Game(session: GameSessionV2): void {
  const envelope: SaveEnvelope = { version: 2, savedAt: new Date().toISOString(), session }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
}

export function loadV2Game(): GameSessionV2 | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseSession(JSON.parse(raw) as Partial<SaveEnvelope>) : null
  } catch {
    return null
  }
}

export function clearV2Game(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportV2DaoGuo(session: GameSessionV2): string {
  return `DAO2.${encodeUtf8(JSON.stringify({ version: 2, session }))}`
}

export function importV2DaoGuo(code: string): GameSessionV2 | null {
  try {
    if (!code.startsWith('DAO2.')) return null
    return parseSession(JSON.parse(decodeUtf8(code.slice(5))) as Partial<SaveEnvelope>)
  } catch {
    return null
  }
}
