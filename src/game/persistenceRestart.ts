import { createRestartProfile } from './restart/engine'
import type { RestartProfile, RestartRun } from './restart/types'

const RUN_STORAGE_KEY = 'xiuxian-restart-run-v1'
const PROFILE_STORAGE_KEY = 'xiuxian-restart-profile-v1'
type RestartEnvelope = { version: 1; mode: 'restart'; run: RestartRun | null; profile: RestartProfile }

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

function validRun(value: unknown): value is RestartRun {
  if (!value || typeof value !== 'object') return false
  const run = value as Partial<RestartRun>
  return run.version === 1 && typeof run.id === 'string' && typeof run.age === 'number' && Array.isArray(run.logs) && Array.isArray(run.talents) && (run.status === 'active' || run.status === 'finished')
}

function normalizeProfile(value: unknown): RestartProfile {
  if (!value || typeof value !== 'object') return createRestartProfile()
  const profile = value as Partial<RestartProfile>
  return {
    version: 1,
    totalRuns: typeof profile.totalRuns === 'number' ? Math.max(0, profile.totalRuns) : 0,
    longestLife: typeof profile.longestLife === 'number' ? Math.max(0, profile.longestLife) : 0,
    highestRealmLevel: typeof profile.highestRealmLevel === 'number' ? Math.max(1, profile.highestRealmLevel) : 1,
    unlockedEndingIds: Array.isArray(profile.unlockedEndingIds) ? profile.unlockedEndingIds.filter((id): id is string => typeof id === 'string') : [],
  }
}

export function saveRestartRun(run: RestartRun | null): void {
  if (run) localStorage.setItem(RUN_STORAGE_KEY, JSON.stringify(run))
  else localStorage.removeItem(RUN_STORAGE_KEY)
}

export function loadRestartRun(): RestartRun | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RUN_STORAGE_KEY) ?? 'null')
    return validRun(parsed) ? parsed : null
  } catch { return null }
}

export function clearRestartRun(): void {
  localStorage.removeItem(RUN_STORAGE_KEY)
}

export function saveRestartProfile(profile: RestartProfile): void {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}

export function loadRestartProfile(): RestartProfile {
  try { return normalizeProfile(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? 'null')) } catch { return createRestartProfile() }
}

export function clearRestartProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY)
}

export function exportRestartArchive(run: RestartRun | null, profile: RestartProfile): string {
  const envelope: RestartEnvelope = { version: 1, mode: 'restart', run, profile }
  return `RESTART1.${encodeUtf8(JSON.stringify(envelope))}`
}

export function importRestartArchive(code: string): { run: RestartRun | null; profile: RestartProfile } | null {
  try {
    if (!code.startsWith('RESTART1.')) return null
    const parsed = JSON.parse(decodeUtf8(code.slice(9))) as Partial<RestartEnvelope>
    if (parsed.version !== 1 || parsed.mode !== 'restart') return null
    return { run: validRun(parsed.run) ? parsed.run : null, profile: normalizeProfile(parsed.profile) }
  } catch { return null }
}
