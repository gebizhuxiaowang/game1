import type { PlayerCharacter } from './types'

const STORAGE_KEY = 'xiuxian-simulator-save-v1'

type SaveEnvelope = { version: 1; savedAt: string; player: PlayerCharacter }

export function saveGame(player: PlayerCharacter) {
  const envelope: SaveEnvelope = { version: 1, savedAt: new Date().toISOString(), player }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
}

export function loadGame(): PlayerCharacter | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope>
    if (parsed.version !== 1 || !parsed.player || typeof parsed.player.name !== 'string') return null
    return parsed.player
  } catch {
    return null
  }
}

export function clearGame() {
  localStorage.removeItem(STORAGE_KEY)
}

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

/** A portable, human-exported save string. It can be copied between browsers. */
export function exportDaoGuo(player: PlayerCharacter): string {
  return `DAO1.${encodeUtf8(JSON.stringify({ version: 1, player }))}`
}

export function importDaoGuo(code: string): PlayerCharacter | null {
  try {
    if (!code.startsWith('DAO1.')) return null
    const parsed = JSON.parse(decodeUtf8(code.slice(5))) as { version?: number; player?: PlayerCharacter }
    if (parsed.version !== 1 || !parsed.player || typeof parsed.player.name !== 'string') return null
    return parsed.player
  } catch {
    return null
  }
}
