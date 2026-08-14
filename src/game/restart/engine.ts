import { getRealmDescriptor } from '../power'
import { createRng, pickN } from '../rng'
import { RESTART_ENDINGS, RESTART_EVENT_TEMPLATES, RESTART_TALENTS } from './data'
import type { RestartAttributeKey, RestartAttributes, RestartDraft, RestartEnding, RestartEventChoice, RestartLog, RestartOutcome, RestartProfile, RestartRun, RestartSpiritRoot, RestartTalent, RestartTalentTier } from './types'

const ATTRIBUTE_KEYS: RestartAttributeKey[] = ['wuxing', 'daoxin', 'gengu', 'qiyun']
const TOTAL_ATTRIBUTE_POINTS = 15
const START_AGE = 12
const MAX_BASE_ATTRIBUTE = 10

const clone = <T,>(value: T): T => structuredClone(value)
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function rngFor(seed: number, salt: string) {
  return createRng((seed ^ hash(salt)) >>> 0)
}

function freshSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}

function addLog(run: RestartRun, log: Omit<RestartLog, 'id'>): void {
  run.logs = [{ ...log, id: `${run.eventIndex}-${log.age}-${run.logs.length}` }, ...run.logs].slice(0, 120)
}

function talentsForTier(tier: RestartTalentTier): RestartTalent[] {
  return RESTART_TALENTS.filter((talent) => talent.tier === tier)
}

export function drawRestartCandidates(seed: number): string[] {
  const rng = rngFor(seed, 'talent-candidates')
  const candidates = [
    ...pickN(talentsForTier('普通'), 6, rng),
    ...pickN(talentsForTier('稀有'), 2, rng),
    ...pickN(talentsForTier('传说'), 1, rng),
  ]
  return candidates.sort(() => rng() - 0.5).map((talent) => talent.id)
}

export function createRestartDraft(seed = freshSeed()): RestartDraft {
  return { seed, candidateTalentIds: drawRestartCandidates(seed), selectedTalentIds: [], attributes: { wuxing: 0, daoxin: 0, gengu: 0, qiyun: 0 } }
}

export function remainingRestartPoints(attributes: RestartAttributes): number {
  return TOTAL_ATTRIBUTE_POINTS - ATTRIBUTE_KEYS.reduce((total, key) => total + attributes[key], 0)
}

export function getRestartTalent(id: string): RestartTalent | undefined {
  return RESTART_TALENTS.find((talent) => talent.id === id)
}

export function selectedRestartTalents(draft: RestartDraft): RestartTalent[] {
  return draft.selectedTalentIds.map(getRestartTalent).filter((talent): talent is RestartTalent => Boolean(talent))
}

export function canSelectRestartTalent(draft: RestartDraft, talentId: string): boolean {
  const candidate = getRestartTalent(talentId)
  if (!candidate || !draft.candidateTalentIds.includes(talentId) || draft.selectedTalentIds.includes(talentId)) return false
  if (draft.selectedTalentIds.length >= 3) return false
  return !candidate.mutexTag || !selectedRestartTalents(draft).some((talent) => talent.mutexTag === candidate.mutexTag)
}

export function isValidRestartDraft(draft: RestartDraft): boolean {
  const valuesValid = ATTRIBUTE_KEYS.every((key) => Number.isInteger(draft.attributes[key]) && draft.attributes[key] >= 0 && draft.attributes[key] <= MAX_BASE_ATTRIBUTE)
  return valuesValid && remainingRestartPoints(draft.attributes) === 0 && draft.selectedTalentIds.length === 3 && new Set(draft.selectedTalentIds).size === 3 && draft.selectedTalentIds.every((id) => draft.candidateTalentIds.includes(id)) && draft.selectedTalentIds.every((id) => canSelectRestartTalent({ ...draft, selectedTalentIds: draft.selectedTalentIds.filter((item) => item !== id) }, id))
}

function totalEffect(talents: RestartTalent[], key: keyof RestartTalent['effects']): number {
  return talents.reduce((total, talent) => total + (typeof talent.effects[key] === 'number' ? talent.effects[key] as number : 0), 0)
}

function applyTalentAttributes(attributes: RestartAttributes, talents: RestartTalent[]): RestartAttributes {
  const result = { ...attributes }
  for (const talent of talents) {
    for (const key of ATTRIBUTE_KEYS) result[key] += talent.effects.attributes?.[key] ?? 0
  }
  for (const key of ATTRIBUTE_KEYS) result[key] = clamp(result[key], 0, 12)
  return result
}

function spiritRootFor(attributes: RestartAttributes, talents: RestartTalent[]): RestartSpiritRoot {
  const explicit = talents.map((talent) => talent.effects.spiritRoot).find((root): root is RestartSpiritRoot => Boolean(root))
  if (explicit) return explicit
  if (attributes.gengu + attributes.wuxing >= 16) return '上品灵根'
  if (attributes.gengu >= 7) return '中品灵根'
  if (attributes.gengu <= 2) return '废灵根'
  return '凡品灵根'
}

function updateRealm(run: RestartRun): void {
  const thresholds = [
    { cultivation: 0, level: 1 }, { cultivation: 58, level: 11 }, { cultivation: 170, level: 21 },
    { cultivation: 330, level: 41 }, { cultivation: 550, level: 61 }, { cultivation: 800, level: 81 }, { cultivation: 1080, level: 96 },
  ]
  const match = thresholds.filter((entry) => run.cultivation >= entry.cultivation).at(-1)
  run.realmLevel = match?.level ?? 1
  run.stats.highestRealmLevel = Math.max(run.stats.highestRealmLevel, run.realmLevel)
}

function applyOutcome(run: RestartRun, outcome: RestartOutcome): void {
  run.cultivation = Math.max(0, run.cultivation + (outcome.cultivation ?? 0))
  run.wealth = Math.max(0, run.wealth + (outcome.wealth ?? 0))
  run.health = clamp(run.health + (outcome.health ?? 0), 0, 100)
  run.lifespan = Math.max(run.age + 1, run.lifespan + (outcome.lifespan ?? 0))
  run.stats.wealthEarned += Math.max(0, outcome.wealth ?? 0)
  for (const tag of outcome.tags ?? []) if (!run.tags.includes(tag)) run.tags.push(tag)
  updateRealm(run)
}

function ordinaryNarrative(run: RestartRun, fromAge: number, toAge: number): string {
  const rng = rngFor(run.seed, `ordinary:${run.eventIndex}`)
  const lines = [
    `你在 ${fromAge} 至 ${toAge} 岁间反复吐纳，山风与晨钟逐渐成了最熟悉的声音。`,
    `这几年你在坊市与山道间往返，见过许多别人的得失，也悄悄补足了自己的短板。`,
    `世事向前，你把大多数孤独的夜晚都留给了功法与灵石灯。`,
    `你没有等来惊天异象，却在一点一滴的积累里让根基更加稳固。`,
  ]
  return lines[Math.floor(rng() * lines.length)]
}

function passiveAdvance(run: RestartRun, years: number): void {
  const talents = run.talents
  const cultivationGain = years * (3 + Math.floor((run.attributes.wuxing + run.attributes.gengu) / 7) + totalEffect(talents, 'cultivationBonus'))
  const wealthGain = years * Math.max(0, 1 + Math.floor(run.attributes.qiyun / 5) + totalEffect(talents, 'wealthBonus'))
  run.cultivation += cultivationGain
  run.wealth += wealthGain
  run.stats.wealthEarned += wealthGain
  run.stats.ordinaryYears += years
  updateRealm(run)
}

function endingBy(run: RestartRun, cause: 'final' | 'death' | 'age'): RestartEnding {
  if (cause === 'death') return RESTART_ENDINGS.find((ending) => ending.id === 'fallen')!
  if (run.realmLevel >= 96 && run.tags.includes('heaven-gate')) return RESTART_ENDINGS.find((ending) => ending.id === 'ascended')!
  if (run.tags.includes('legacy') || run.tags.includes('teacher')) return RESTART_ENDINGS.find((ending) => ending.id === 'legacy')!
  if (run.realmLevel >= 61 || run.tags.includes('sect')) return RESTART_ENDINGS.find((ending) => ending.id === 'sect-elder')!
  if (run.tags.includes('wanderer') || run.tags.includes('ruin-walker')) return RESTART_ENDINGS.find((ending) => ending.id === 'wanderer-legend')!
  if (run.health < 25 || run.tags.includes('heart-clear') === false && run.eventIndex >= 6) return RESTART_ENDINGS.find((ending) => ending.id === 'heart-demon')!
  return RESTART_ENDINGS.find((ending) => ending.id === 'mortal-peace')!
}

function finishRun(run: RestartRun, cause: 'final' | 'death' | 'age'): void {
  if (run.status === 'finished') return
  run.status = 'finished'
  run.pendingEvent = null
  run.ending = endingBy(run, cause)
  addLog(run, { age: run.age, kind: 'result', text: `【${run.ending.title}】${run.ending.description}` })
}

export function createRestartRun(draft: RestartDraft, name: string): RestartRun {
  if (!isValidRestartDraft(draft)) throw new Error('命格尚未完成：请选择三项天赋，并分配完十五点道基。')
  const talents = selectedRestartTalents(draft)
  const attributes = applyTalentAttributes(draft.attributes, talents)
  const lifespan = 70 + attributes.gengu * 2 + totalEffect(talents, 'lifespanBonus')
  const health = clamp(62 + attributes.gengu * 3 + totalEffect(talents, 'healthBonus'), 1, 100)
  const run: RestartRun = {
    version: 1,
    id: `restart-${draft.seed.toString(36)}`,
    seed: draft.seed,
    name: name.trim() || '无名修士',
    status: 'active',
    age: START_AGE,
    lifespan,
    health,
    attributes,
    talents,
    spiritRoot: spiritRootFor(attributes, talents),
    realmLevel: 1,
    cultivation: 0,
    wealth: Math.max(0, 6 + totalEffect(talents, 'wealthBonus')),
    tags: talents.flatMap((talent) => talent.effects.tags ?? []),
    logs: [],
    eventIndex: 0,
    pendingEvent: null,
    stats: { highestRealmLevel: 1, wealthEarned: 0, keyDecisions: 0, ordinaryYears: 0, successChoices: 0 },
    ending: null,
  }
  addLog(run, { age: START_AGE, kind: 'key', text: `你以「${talents.map((talent) => talent.name).join('、】【')}」之姿出生。灵根初定为${run.spiritRoot}，此生由你亲手书写。` })
  return run
}

export function advanceRestartRun(run: RestartRun): RestartRun {
  if (run.status !== 'active' || run.pendingEvent) return run
  const next = clone(run)
  const template = RESTART_EVENT_TEMPLATES[next.eventIndex]
  if (!template) {
    finishRun(next, 'age')
    return next
  }
  const fromAge = next.age + 1
  const years = Math.max(0, template.age - next.age - 1)
  if (years > 0) {
    passiveAdvance(next, years)
    addLog(next, { age: template.age - 1, range: `${fromAge}–${template.age - 1} 岁`, kind: 'ordinary', text: ordinaryNarrative(next, fromAge, template.age - 1) })
  }
  next.age = template.age
  if (next.health <= 0) {
    finishRun(next, 'death')
    return next
  }
  if (next.age >= next.lifespan && !template.final) {
    finishRun(next, 'age')
    return next
  }
  next.pendingEvent = clone(template)
  addLog(next, { age: next.age, kind: 'key', text: `【${template.phase}】${template.title}：${template.description}` })
  return next
}

function choiceChance(run: RestartRun, choice: RestartEventChoice): number {
  if (choice.stat === 'none' || choice.safe) return 1
  const talentBonus = run.tags.includes('heaven-favored') && choice.stat === 'qiyun' ? 0.08 : 0
  const rootBonus = ['上品灵根', '极品灵根', '异灵根'].includes(run.spiritRoot) ? 0.05 : 0
  return clamp(0.36 + (run.attributes[choice.stat] - choice.difficulty) / 24 + talentBonus + rootBonus, 0.14, 0.9)
}

export function resolveRestartChoice(run: RestartRun, choiceId: string): RestartRun {
  if (run.status !== 'active' || !run.pendingEvent) return run
  const next = clone(run)
  const event = next.pendingEvent
  if (!event) return next
  const choice = event.choices.find((item) => item.id === choiceId)
  if (!choice) return next
  const success = rngFor(next.seed, `choice:${next.eventIndex}:${choice.id}`)() < choiceChance(next, choice)
  applyOutcome(next, success ? choice.success : choice.failure)
  next.stats.keyDecisions += 1
  if (success) next.stats.successChoices += 1
  addLog(next, { age: next.age, kind: 'key', text: `${success ? '【成】' : '【败】'}${success ? choice.success.log : choice.failure.log}` })
  next.pendingEvent = null
  next.eventIndex += 1
  if (next.health <= 0) finishRun(next, 'death')
  else if (event.final) finishRun(next, 'final')
  return next
}

export function createRestartProfile(): RestartProfile {
  return { version: 1, totalRuns: 0, longestLife: 0, highestRealmLevel: 1, unlockedEndingIds: [] }
}

export function recordRestartResult(profile: RestartProfile, run: RestartRun): RestartProfile {
  if (run.status !== 'finished' || !run.ending) return profile
  return {
    ...profile,
    totalRuns: profile.totalRuns + 1,
    longestLife: Math.max(profile.longestLife, run.age),
    highestRealmLevel: Math.max(profile.highestRealmLevel, run.stats.highestRealmLevel),
    unlockedEndingIds: profile.unlockedEndingIds.includes(run.ending.id) ? profile.unlockedEndingIds : [...profile.unlockedEndingIds, run.ending.id],
  }
}

export function restartRealmLabel(level: number): string {
  const descriptor = getRealmDescriptor(level)
  return `${descriptor.stageName} · ${descriptor.rating}`
}

export function restartAttributeLabel(key: RestartAttributeKey): string {
  return { wuxing: '悟性', daoxin: '道心', gengu: '根骨', qiyun: '气运' }[key]
}

export const RESTART_ATTRIBUTE_KEYS = ATTRIBUTE_KEYS
export const RESTART_TOTAL_ATTRIBUTE_POINTS = TOTAL_ATTRIBUTE_POINTS
export const RESTART_ENDING_LIST = RESTART_ENDINGS
