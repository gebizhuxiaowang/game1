import type { PlayerCharacter } from './types'
import { DWELLING_SPEED_BONUS } from './data'
import { addCultivationExp, refreshPower } from './power'
import { createRng, type RngFn } from './rng'

export type TimeSpeed = 0 | 1 | 2 | 4
export type DayActivity = 'cultivate' | 'work' | 'forage' | 'travel' | 'recover'
export type InjuryLevel = '无恙' | '轻伤' | '重伤' | '濒死'
export type EventTier = '日志' | '机会' | '风险' | '命运'
export type EventApproach = 'force' | 'scout' | 'negotiate' | 'leave'
export type FateStatus = 'available' | 'entered' | 'resolved' | 'expired' | 'abandoned'
export type ExpeditionMode = 'ordinary' | 'fate'

export interface ScheduleEntry { id: string; activity: DayActivity; days: number }
export interface V2Resources { pills: number; injury: InjuryLevel; injuryDays: number }
export interface AutoPolicy { pauseOpportunity: boolean; avoidRisk: boolean }

export interface LiveEventChoice {
  id: EventApproach
  label: string
  description: string
  stat: 'power' | 'wuxing' | 'daoxin' | 'qiyun'
  risky?: boolean
}

export interface LiveEvent {
  id: string
  tier: EventTier
  title: string
  description: string
  threat: number
  reward: number
  major?: boolean
  choices: LiveEventChoice[]
}

export interface UnfinishedFate {
  id: string
  mode: ExpeditionMode
  title: string
  description: string
  createdDay: number
  expiresOnDay: number
  threat: number
  reward: number
  status: FateStatus
  outcome?: string
}

export interface ExpeditionNode {
  id: string
  title: string
  description: string
  threat: number
  reward: number
  final: boolean
  choices: LiveEventChoice[]
}

export interface ExpeditionState {
  id: string
  fateId: string
  title: string
  mode: ExpeditionMode
  sealed: boolean
  currentNodeIndex: number
  nodes: ExpeditionNode[]
  spoils: number
  enteredDay: number
}

export interface DeathState { kind: 'rollback' | 'reincarnation'; cause: string }
export interface OfflineReport { days: number; cultivation: number; stones: number; healing: number }

export interface SessionSnapshot {
  player: PlayerCharacter
  day: number
  schedule: ScheduleEntry[]
  resources: V2Resources
  logs: string[]
  eventHistory: string[]
  unfinishedFates: UnfinishedFate[]
  activeExpedition: ExpeditionState | null
}

export interface V2Checkpoint { day: number; label: string; snapshot: SessionSnapshot }

export interface GameSessionV2 {
  version: 2
  player: PlayerCharacter
  worldSeed: number
  day: number
  dayProgress: number
  speed: TimeSpeed
  paused: boolean
  lastSyncedAt: number
  schedule: ScheduleEntry[]
  resources: V2Resources
  autoPolicy: AutoPolicy
  pendingEvent: LiveEvent | null
  death: DeathState | null
  checkpoints: V2Checkpoint[]
  eventHistory: string[]
  unfinishedFates: UnfinishedFate[]
  activeExpedition: ExpeditionState | null
  logs: string[]
  offlineReport: OfflineReport | null
}

const DAY_MS = 1000
const MAX_OFFLINE_DAYS = 30
const injuryRank: Record<InjuryLevel, number> = { 无恙: 0, 轻伤: 1, 重伤: 2, 濒死: 3 }
const injuryNames: InjuryLevel[] = ['无恙', '轻伤', '重伤', '濒死']

export const ACTIVITIES: Record<DayActivity, { name: string; description: string; icon: string }> = {
  cultivate: { name: '闭关吐纳', description: '稳定提升修为，受洞府和灵根加成。', icon: '◌' },
  work: { name: '坊市营生', description: '稳定赚取灵石，风险最低。', icon: '◈' },
  forage: { name: '采集狩猎', description: '寻找灵材与妖兽材料，常有风险。', icon: '⌁' },
  travel: { name: '游历寻机', description: '更容易遇到机缘、传闻与变故。', icon: '✦' },
  recover: { name: '洞府养伤', description: '恢复伤势，避免高危日程。', icon: '☯' },
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const clone = <T,>(value: T): T => structuredClone(value)

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function eventRng(session: GameSessionV2, salt: string): RngFn {
  return createRng((session.worldSeed ^ hash(`${session.day}:${salt}`)) >>> 0)
}

function stableRng(session: GameSessionV2, salt: string): RngFn {
  return createRng((session.worldSeed ^ hash(salt)) >>> 0)
}

function dayLabel(day: number): string {
  const year = Math.floor((day - 1) / 360) + 1
  const month = Math.floor(((day - 1) % 360) / 30) + 1
  const date = ((day - 1) % 30) + 1
  return `天玄历 ${year} 年 ${month} 月 ${date} 日`
}

function addLog(session: GameSessionV2, message: string): void {
  session.logs = [`${dayLabel(session.day)}：${message}`, ...session.logs].slice(0, 100)
  session.player.log = [message, ...session.player.log].slice(0, 100)
}

export function maxUnfinishedFates(player: PlayerCharacter): number {
  return clamp(2 + Math.floor((player.realmLevel - 1) / 20), 2, 5)
}

function activeFateCount(session: GameSessionV2): number {
  return session.unfinishedFates.filter((fate) => fate.status === 'available' || fate.status === 'entered').length
}

function snapshot(session: GameSessionV2): SessionSnapshot {
  return {
    player: clone(session.player),
    day: session.day,
    schedule: clone(session.schedule),
    resources: clone(session.resources),
    logs: clone(session.logs),
    eventHistory: clone(session.eventHistory),
    unfinishedFates: clone(session.unfinishedFates),
    activeExpedition: clone(session.activeExpedition),
  }
}

function pushCheckpoint(session: GameSessionV2, label: string): void {
  const latest = session.checkpoints.at(-1)
  if (latest?.day === session.day && latest.label === label) return
  session.checkpoints = [...session.checkpoints, { day: session.day, label, snapshot: snapshot(session) }].slice(-6)
}

function syncCalendar(session: GameSessionV2): void {
  const year = Math.floor((session.day - 1) / 360) + 1
  const month = Math.floor(((session.day - 1) % 360) / 30) + 1
  session.player.gameYear = year
  session.player.gameMonthOfYear = month
  session.player.gameMonth = Math.ceil(session.day / 30)
  if (session.day > 1 && (session.day - 1) % 360 === 0) session.player.age += 1
}

export function createGameSessionV2(player: PlayerCharacter, now = Date.now()): GameSessionV2 {
  const clonedPlayer = clone(player)
  refreshPower(clonedPlayer)
  const day = Math.max(1, (clonedPlayer.gameYear - 1) * 360 + (clonedPlayer.gameMonthOfYear - 1) * 30 + 1)
  const session: GameSessionV2 = {
    version: 2,
    player: clonedPlayer,
    worldSeed: (hash(`${clonedPlayer.name}:${clonedPlayer.originPackage.id}:${now}`) ^ now) >>> 0,
    day,
    dayProgress: 0,
    speed: 1,
    paused: false,
    lastSyncedAt: now,
    schedule: [{ id: 'initial-cultivate', activity: 'cultivate', days: 7 }],
    resources: { pills: 2, injury: '无恙', injuryDays: 0 },
    autoPolicy: { pauseOpportunity: true, avoidRisk: true },
    pendingEvent: null,
    death: null,
    checkpoints: [],
    eventHistory: [],
    unfinishedFates: [],
    activeExpedition: null,
    logs: [`${dayLabel(day)}：你踏入实时流转的天玄大陆，七日闭关日程已开始。`],
    offlineReport: null,
  }
  pushCheckpoint(session, '初入天玄')
  return session
}

/** Repairs old DAO2/local sessions that predate V2.1 without changing the DAO2 protocol. */
export function normalizeGameSessionV2(raw: GameSessionV2): GameSessionV2 {
  const session = clone(raw)
  session.speed = [0, 1, 2, 4].includes(session.speed) ? session.speed : 1
  session.schedule = Array.isArray(session.schedule) ? session.schedule : []
  session.eventHistory = Array.isArray(session.eventHistory) ? session.eventHistory : []
  session.logs = Array.isArray(session.logs) ? session.logs : []
  session.unfinishedFates = Array.isArray(session.unfinishedFates) ? session.unfinishedFates : []
  session.activeExpedition ??= null
  session.autoPolicy ??= { pauseOpportunity: true, avoidRisk: true }
  session.resources ??= { pills: 0, injury: '无恙', injuryDays: 0 }
  session.checkpoints = Array.isArray(session.checkpoints) ? session.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    snapshot: {
      ...checkpoint.snapshot,
      unfinishedFates: Array.isArray(checkpoint.snapshot?.unfinishedFates) ? checkpoint.snapshot.unfinishedFates : [],
      activeExpedition: checkpoint.snapshot?.activeExpedition ?? null,
    },
  })) : []
  return session
}

export function migratePlayerToV2(player: PlayerCharacter, now = Date.now()): GameSessionV2 {
  const session = createGameSessionV2(player, now)
  session.logs.unshift(`${dayLabel(session.day)}：旧版道果已化入 V2 天游会话。`)
  return session
}

export function addSchedule(session: GameSessionV2, activity: DayActivity, days: number): GameSessionV2 {
  const next = clone(session)
  const safeDays = clamp(Math.floor(days), 1, 30)
  next.schedule.push({ id: `${next.day}-${activity}-${next.schedule.length}`, activity, days: safeDays })
  addLog(next, `已安排 ${safeDays} 日「${ACTIVITIES[activity].name}」。`)
  return next
}

export function removeSchedule(session: GameSessionV2, id: string): GameSessionV2 {
  const next = clone(session)
  next.schedule = next.schedule.filter((entry) => entry.id !== id)
  return next
}

export function setTimeSpeed(session: GameSessionV2, speed: TimeSpeed): GameSessionV2 {
  const next = clone(session)
  next.speed = speed
  next.paused = speed === 0
  next.lastSyncedAt = Date.now()
  return next
}

export function resumeSession(session: GameSessionV2): GameSessionV2 {
  const next = clone(session)
  if (!next.pendingEvent && !next.death && !next.activeExpedition) {
    next.paused = false
    if (next.speed === 0) next.speed = 1
  }
  next.lastSyncedAt = Date.now()
  return next
}

export function setAutoPolicy(session: GameSessionV2, patch: Partial<AutoPolicy>): GameSessionV2 {
  return { ...clone(session), autoPolicy: { ...session.autoPolicy, ...patch } }
}

function activeActivity(session: GameSessionV2): DayActivity {
  if (session.resources.injury === '濒死' || session.resources.injury === '重伤') return 'recover'
  return session.schedule[0]?.activity ?? 'cultivate'
}

function lowerInjury(session: GameSessionV2, amount: number): number {
  if (session.resources.injury === '无恙') return 0
  session.resources.injuryDays = Math.max(0, session.resources.injuryDays - amount)
  if (session.resources.injuryDays === 0) {
    const nextRank = Math.max(0, injuryRank[session.resources.injury] - 1)
    session.resources.injury = injuryNames[nextRank]
    session.resources.injuryDays = nextRank === 0 ? 0 : nextRank * 3
  }
  return amount
}

function worsenInjury(session: GameSessionV2, amount: number): void {
  const nextRank = clamp(injuryRank[session.resources.injury] + amount, 0, 3)
  session.resources.injury = injuryNames[nextRank]
  session.resources.injuryDays = Math.max(session.resources.injuryDays, nextRank * 4)
}

function advanceSchedule(session: GameSessionV2): void {
  const current = session.schedule[0]
  if (!current) return
  current.days -= 1
  if (current.days <= 0) session.schedule.shift()
}

function executeDailyActivity(session: GameSessionV2, activity: DayActivity): { cultivation: number; stones: number; healing: number } {
  const injuryPenalty = injuryRank[session.resources.injury] * 0.2
  const dwellingBonus = DWELLING_SPEED_BONUS[session.player.dwelling.level] ?? 0
  let cultivation = 0
  let stones = 0
  let healing = 0
  if (activity === 'cultivate') {
    cultivation = Math.max(1, Math.round(2 * (1 + session.player.spiritRoot.speedModifier + dwellingBonus - injuryPenalty)))
    addCultivationExp(session.player, cultivation)
  } else if (activity === 'work') {
    stones = Math.max(1, Math.round(2 + session.player.daoJi.wuxing / 25 - injuryPenalty * 2))
    session.player.currency.low += stones
  } else if (activity === 'forage') {
    cultivation = Math.max(1, Math.round(1 + session.player.daoJi.gengu / 35 - injuryPenalty))
    stones = Math.max(0, Math.round(1 + session.player.daoJi.qiyun / 45 - injuryPenalty))
    session.player.currency.low += stones
    addCultivationExp(session.player, cultivation)
  } else if (activity === 'travel') {
    cultivation = Math.max(0, Math.round(1 - injuryPenalty))
    addCultivationExp(session.player, cultivation)
  } else {
    healing = lowerInjury(session, 1 + Math.floor(session.player.dwelling.level / 2))
  }
  refreshPower(session.player)
  advanceSchedule(session)
  return { cultivation, stones, healing }
}

function buildEvent(session: GameSessionV2, activity: DayActivity): LiveEvent | null {
  const rng = eventRng(session, `event:${activity}`)
  const chance = { cultivate: 0.1, work: 0.14, forage: 0.32, travel: 0.28, recover: 0.05 }[activity]
  if (rng() > chance) return null
  const roll = rng()
  const leave: LiveEventChoice = { id: 'leave', label: '谨慎离去', description: '不争机缘，保全当前状态。', stat: 'daoxin' }
  if (activity === 'forage' && roll < 0.48) return { id: `herb-${session.day}`, tier: '机会', title: '山涧灵草', description: '雾气深处有一株灵草散发微光，周围似乎有兽类活动的痕迹。', threat: 18, reward: 12, choices: [{ id: 'scout', label: '先行辨识', description: '以悟性与气运确认药性及周围危险。', stat: 'wuxing' }, { id: 'force', label: '强取灵草', description: '直接采摘，可能惊动暗处妖兽。', stat: 'power', risky: true }, leave] }
  if ((activity === 'forage' || activity === 'travel') && roll < 0.76) return { id: `beast-${session.day}`, tier: '风险', title: '妖兽拦路', description: '一头赤鬃妖狼自林间现身，灵压远胜寻常野兽。', threat: 25 + Math.floor(rng() * 12), reward: 18, choices: [{ id: 'force', label: '正面迎战', description: '以战力强行开路，战败可能留下重伤。', stat: 'power', risky: true }, { id: 'scout', label: '观察弱点', description: '寻找妖兽的行动空隙，再决定去留。', stat: 'wuxing' }, leave] }
  if (activity === 'work') return { id: `market-${session.day}`, tier: '机会', title: '坊市压价', description: '一位商人看中了你的货品，却试图以远低于市价的灵石成交。', threat: 16, reward: 14, choices: [{ id: 'negotiate', label: '据理交涉', description: '以道心和见闻争取合理价码。', stat: 'daoxin' }, { id: 'scout', label: '洞察行情', description: '用气运与判断寻找更好的买主。', stat: 'qiyun' }, leave] }
  return { id: `insight-${session.day}`, tier: '机会', title: '灵机一闪', description: '吐纳间天地灵气微微共鸣，似有一缕感悟即将消散。', threat: 14, reward: 10, choices: [{ id: 'scout', label: '凝神参悟', description: '以悟性捕捉那一瞬灵机。', stat: 'wuxing' }, { id: 'force', label: '强行冲关', description: '压榨经脉争取更大收获，可能加重伤势。', stat: 'power', risky: true }, leave] }
}

function tryCreateFate(session: GameSessionV2, activity: DayActivity): boolean {
  if (activity !== 'travel' && activity !== 'forage') return false
  if (activeFateCount(session) >= maxUnfinishedFates(session.player)) return false
  const rng = eventRng(session, `fate:${activity}`)
  const chance = activity === 'travel' ? 0.2 : 0.1
  if (rng() > chance) return false
  const mode: ExpeditionMode = rng() > 0.78 ? 'fate' : 'ordinary'
  const id = `${mode}-fate-${session.day}-${activity}`
  const fate: UnfinishedFate = {
    id,
    mode,
    title: mode === 'fate' ? '星陨古碑秘境' : '雾隐残墟',
    description: mode === 'fate' ? '天地异象引动你体内的天命印记。碑后禁制只开数日，踏入后恐难回首。' : '游历时发现一处将要消散的遗址入口，或许藏有灵材与旧修士遗泽。',
    createdDay: session.day,
    expiresOnDay: session.day + (mode === 'fate' ? 5 : 3),
    threat: mode === 'fate' ? 34 + Math.floor(rng() * 8) : 20 + Math.floor(rng() * 8),
    reward: mode === 'fate' ? 52 + Math.floor(rng() * 20) : 26 + Math.floor(rng() * 14),
    status: 'available',
  }
  session.unfinishedFates.push(fate)
  addLog(session, `你发现【未竟因果·${fate.title}】。入口将在 ${fate.expiresOnDay - session.day} 日后消散，世间不会为任何人停步。`)
  return true
}

function advanceUnfinishedFates(session: GameSessionV2): void {
  for (const fate of session.unfinishedFates) {
    if (fate.status !== 'available' || session.day <= fate.expiresOnDay) continue
    fate.status = 'expired'
    fate.outcome = fate.mode === 'fate' ? '异象被玄阴殿修士先一步引动，古碑已落入他人之手。' : '遗址入口在雾中消散，坊间传闻有散修带着残缺玉简归来。'
    session.eventHistory.push(`expired:${fate.id}`)
    addLog(session, `【因果错过】${fate.outcome}「${fate.title}」不再属于你，却可能在日后化为新的竞争或线索。`)
  }
}

function eventChance(session: GameSessionV2, target: { threat: number }, choice: LiveEventChoice): number {
  const stat = choice.stat === 'power' ? session.player.power : session.player.daoJi[choice.stat]
  const injuryPenalty = injuryRank[session.resources.injury] * 8
  const daoYunBonus = (choice.stat === 'wuxing' && session.player.daoYun.name === '明察秋毫') || (choice.stat === 'qiyun' && session.player.daoYun.name === '天人感应') || (choice.stat === 'daoxin' && session.player.daoYun.name === '磐石之志') ? 12 : 0
  const pillBonus = choice.id === 'force' && session.resources.pills > 0 ? 4 : 0
  return clamp(0.25 + (stat + daoYunBonus + pillBonus - target.threat - injuryPenalty) / 70, 0.08, 0.92)
}

function prepareDeath(session: GameSessionV2, cause: string, major: boolean): void {
  session.death = { kind: major || session.player.age >= session.player.lifespanMax ? 'reincarnation' : 'rollback', cause }
  session.paused = true
  session.speed = 0
  addLog(session, `身死道消：${cause}`)
}

function resolveAutomatically(session: GameSessionV2, event: LiveEvent): void {
  const choice = event.choices.find((item) => item.id === 'scout') ?? event.choices.at(-1)
  if (choice) resolveEventMutable(session, event, choice.id, true)
}

function resolveEventMutable(session: GameSessionV2, event: LiveEvent, choiceId: EventApproach, automatic = false): void {
  const choice = event.choices.find((item) => item.id === choiceId)
  if (!choice) return
  if (choice.id === 'leave') {
    addLog(session, `你在「${event.title}」前选择谨慎离去。`)
    session.eventHistory.push(event.id)
    session.pendingEvent = null
    return
  }
  const success = eventRng(session, `${event.id}:${choice.id}`)() < eventChance(session, event, choice)
  if (success) {
    const reward = Math.round(event.reward * (choice.id === 'force' ? 1.25 : 1))
    session.player.currency.low += reward
    if (event.tier === '命运') session.player.destinyLine.rewardsGained.push(`${event.title}的线索`)
    if (choice.id === 'scout' || choice.id === 'negotiate') session.player.daoJi[choice.stat === 'power' ? 'wuxing' : choice.stat] = Math.min(100, session.player.daoJi[choice.stat === 'power' ? 'wuxing' : choice.stat] + 1)
    if (eventRng(session, `${event.id}:pill`)() > 0.72) session.resources.pills += 1
    addLog(session, `${automatic ? '自动应对' : '你的选择'}使「${event.title}」有惊无险，获得 ${reward} 枚下品灵石。`)
  } else if (event.tier === '风险' || event.tier === '命运' || choice.risky) {
    worsenInjury(session, event.major ? 2 : 1)
    const loss = Math.min(session.player.currency.low, Math.max(2, Math.floor(event.reward / 3)))
    session.player.currency.low -= loss
    addLog(session, `「${event.title}」应对失手，你损失 ${loss} 枚灵石，伤势加重至${session.resources.injury}。`)
    if (session.resources.injury === '濒死' && (choice.risky || event.major)) prepareDeath(session, `${event.title}中伤及根本`, Boolean(event.major))
  } else addLog(session, `「${event.title}」未能如愿，但并无实质损失。`)
  session.eventHistory.push(event.id)
  session.pendingEvent = null
  refreshPower(session.player)
}

function maybePauseForEvent(session: GameSessionV2, event: LiveEvent, offline: boolean): boolean {
  if (offline || event.tier === '日志') return false
  if (event.tier === '风险' || event.tier === '命运') return true
  return session.autoPolicy.pauseOpportunity
}

function advanceOneDay(session: GameSessionV2, offline: boolean, report: OfflineReport): boolean {
  if (session.pendingEvent || session.death || session.activeExpedition) return false
  const activity = activeActivity(session)
  const result = executeDailyActivity(session, activity)
  report.cultivation += result.cultivation
  report.stones += result.stones
  report.healing += result.healing
  session.day += 1
  syncCalendar(session)
  if (session.player.age >= session.player.lifespanMax) {
    prepareDeath(session, '寿元耗尽，天命将尽', true)
    return false
  }
  if (session.day % 7 === 0) pushCheckpoint(session, '七日道果')
  advanceUnfinishedFates(session)
  if (tryCreateFate(session, activity)) return true
  const event = buildEvent(session, activity)
  if (!event) return true
  if (offline && (event.tier === '风险' || event.tier === '命运')) {
    addLog(session, `离线期间感知到「${event.title}」的凶兆，你未贸然涉入。`)
    return true
  }
  if (event.tier === '风险' || event.tier === '命运') pushCheckpoint(session, `遭遇「${event.title}」前`)
  if (maybePauseForEvent(session, event, offline)) {
    session.pendingEvent = event
    session.paused = true
    addLog(session, `遭遇「${event.title}」，时间流转已暂停。`)
    return false
  }
  resolveAutomatically(session, event)
  return true
}

export function advanceGameDays(session: GameSessionV2, days: number, offline = false): GameSessionV2 {
  const next = normalizeGameSessionV2(session)
  const report: OfflineReport = { days: 0, cultivation: 0, stones: 0, healing: 0 }
  const limit = offline ? Math.min(Math.floor(days), MAX_OFFLINE_DAYS) : Math.floor(days)
  for (let index = 0; index < limit; index += 1) {
    if (!advanceOneDay(next, offline, report)) break
    report.days += 1
  }
  if (offline && report.days > 0) {
    next.offlineReport = report
    addLog(next, `归来结算：安稳度过 ${report.days} 日，修为 +${report.cultivation}，灵石 +${report.stones}。`)
  }
  next.lastSyncedAt = Date.now()
  return next
}

export function advanceByWallClock(session: GameSessionV2, now = Date.now()): GameSessionV2 {
  if (session.paused || session.speed === 0 || session.pendingEvent || session.death || session.activeExpedition) return { ...session, lastSyncedAt: now }
  const elapsed = Math.max(0, now - session.lastSyncedAt)
  const totalDays = session.dayProgress + (elapsed / DAY_MS) * session.speed
  const wholeDays = Math.floor(totalDays)
  const next = wholeDays > 0 ? advanceGameDays(session, wholeDays) : clone(session)
  next.dayProgress = totalDays - wholeDays
  next.lastSyncedAt = now
  return next
}

export function resolveLiveEvent(session: GameSessionV2, choice: EventApproach): GameSessionV2 {
  const event = session.pendingEvent
  if (!event) return session
  const next = clone(session)
  resolveEventMutable(next, event, choice)
  if (!next.death) {
    next.paused = false
    if (next.speed === 0) next.speed = 1
    next.lastSyncedAt = Date.now()
    addLog(next, `「${event.title}」的因果暂告一段落，时光继续流转。`)
  }
  return next
}

function createExpeditionNodes(session: GameSessionV2, fate: UnfinishedFate): ExpeditionNode[] {
  const rng = stableRng(session, `${fate.id}:layout`)
  const prefix = fate.mode === 'fate' ? '星陨古碑' : '雾隐残墟'
  const base = fate.threat
  const node = (index: number, title: string, description: string, reward: number, final = false): ExpeditionNode => ({
    id: `${fate.id}:node:${index}`,
    title,
    description,
    threat: base + index * 4 + Math.floor(rng() * 5),
    reward,
    final,
    choices: [
      { id: 'scout', label: '谨慎探查', description: '以悟性与气运辨明虚实，收获较稳。', stat: 'wuxing' },
      { id: 'force', label: '强闯夺宝', description: '以战力撕开阻碍，收获更高，失手会受伤。', stat: 'power', risky: true },
    ],
  })
  return [
    node(0, `${prefix}·入口`, '残破禁制尚未完全闭合，灵雾中隐约传来异兽低吼。', Math.round(fate.reward * 0.22)),
    node(1, `${prefix}·药园`, '半毁药园中尚存几株灵草，石径却布满未散的阵纹。', Math.round(fate.reward * 0.28)),
    node(2, `${prefix}·岔道`, '两侧皆是幽暗甬道，远处闪过不属于此世的微光。', Math.round(fate.reward * 0.33)),
    node(3, `${prefix}·核心`, fate.mode === 'fate' ? '古碑深处与你的命格共鸣，最后一步或将改变往后因果。' : '残墟核心的禁制即将崩解，能带走多少全凭一念。', Math.round(fate.reward * 0.5), true),
  ]
}

export function enterExpedition(session: GameSessionV2, fateId: string): GameSessionV2 {
  const next = normalizeGameSessionV2(session)
  const fate = next.unfinishedFates.find((item) => item.id === fateId)
  if (!fate || fate.status !== 'available' || next.day > fate.expiresOnDay || next.activeExpedition) return next
  pushCheckpoint(next, `踏入「${fate.title}」前`)
  fate.status = 'entered'
  next.activeExpedition = { id: `${fate.id}:expedition`, fateId: fate.id, title: fate.title, mode: fate.mode, sealed: fate.mode === 'fate', currentNodeIndex: 0, nodes: createExpeditionNodes(next, fate), spoils: 0, enteredDay: next.day }
  next.paused = true
  addLog(next, `你踏入「${fate.title}」。${fate.mode === 'fate' ? '禁制在身后合拢，此行不至终点不可回首。' : '秘境尚可撤离，但带走的收获未必完整。'}`)
  return next
}

function finishExpedition(session: GameSessionV2, expedition: ExpeditionState, message: string, factor: number): void {
  const fate = session.unfinishedFates.find((item) => item.id === expedition.fateId)
  const reward = Math.floor(expedition.spoils * factor)
  session.player.currency.low += reward
  if (fate) {
    fate.status = 'resolved'
    fate.outcome = message
  }
  session.eventHistory.push(`expedition:${expedition.id}`)
  session.activeExpedition = null
  session.paused = false
  if (session.speed === 0) session.speed = 1
  session.lastSyncedAt = Date.now()
  addLog(session, `${message}${reward > 0 ? ` 你带回 ${reward} 枚下品灵石。` : ''}时光继续流转。`)
}

export function resolveExpeditionNode(session: GameSessionV2, choiceId: EventApproach): GameSessionV2 {
  const next = normalizeGameSessionV2(session)
  const expedition = next.activeExpedition
  if (!expedition) return next
  const node = expedition.nodes[expedition.currentNodeIndex]
  const choice = node?.choices.find((item) => item.id === choiceId)
  if (!node || !choice) return next
  const success = stableRng(next, `${expedition.id}:${node.id}:${choice.id}`)() < eventChance(next, node, choice)
  if (success) {
    const gain = Math.round(node.reward * (choice.id === 'force' ? 1.3 : 1))
    expedition.spoils += gain
    if (choice.id === 'scout') next.player.daoJi.wuxing = Math.min(100, next.player.daoJi.wuxing + 1)
    addLog(next, `秘境节点「${node.title}」探寻成功，暂获 ${gain} 枚灵石价值的战利品。`)
  } else {
    worsenInjury(next, choice.risky || node.final ? 2 : 1)
    addLog(next, `秘境节点「${node.title}」失手，伤势加重至${next.resources.injury}。`)
    if (next.resources.injury === '濒死' && (choice.risky || node.final)) {
      prepareDeath(next, `在「${expedition.title}」中伤及根本`, expedition.mode === 'fate')
      next.activeExpedition = null
      return next
    }
  }
  if (node.final) finishExpedition(next, expedition, `你穿过「${expedition.title}」的核心，带着一段新的因果归来。`, 1)
  else expedition.currentNodeIndex += 1
  refreshPower(next.player)
  return next
}

export function withdrawFromExpedition(session: GameSessionV2): GameSessionV2 {
  const next = normalizeGameSessionV2(session)
  const expedition = next.activeExpedition
  if (!expedition || expedition.sealed) return next
  finishExpedition(next, expedition, `你从「${expedition.title}」见好就收，放弃了更深处的未知。`, 0.7)
  return next
}

export function abandonFate(session: GameSessionV2, fateId: string): GameSessionV2 {
  const next = normalizeGameSessionV2(session)
  const fate = next.unfinishedFates.find((item) => item.id === fateId)
  if (!fate || fate.status !== 'available') return next
  fate.status = 'abandoned'
  fate.outcome = '你主动放弃了这段机缘，入口逐渐被旁人注意。'
  addLog(next, `你放任「${fate.title}」随世事发展。它不会消失，只是将以别人的故事回到你眼前。`)
  return next
}

export function applyHealingPill(session: GameSessionV2): GameSessionV2 {
  if (session.resources.pills <= 0 || session.resources.injury === '无恙') return session
  const next = clone(session)
  next.resources.pills -= 1
  lowerInjury(next, 5)
  addLog(next, '服下疗伤丹一枚，伤势渐缓。')
  return next
}

export function rollbackAfterDeath(session: GameSessionV2): GameSessionV2 {
  if (session.death?.kind !== 'rollback') return session
  const checkpoint = session.checkpoints.at(-1)
  if (!checkpoint) return session
  const restored: GameSessionV2 = { ...clone(session), ...clone(checkpoint.snapshot), checkpoints: clone(session.checkpoints), death: null, pendingEvent: null, paused: true, speed: 0, lastSyncedAt: Date.now(), offlineReport: null }
  const loss = Math.floor(restored.player.currency.low * 0.2)
  restored.player.currency.low = Math.max(0, restored.player.currency.low - loss)
  worsenInjury(restored, 1)
  addLog(restored, `道果回溯至第 ${checkpoint.day} 日，付出 ${loss} 枚灵石与一道伤势的代价。`)
  return restored
}

export function reincarnateSession(session: GameSessionV2): GameSessionV2 {
  if (session.death?.kind !== 'reincarnation') return session
  const next = normalizeGameSessionV2(session)
  next.player.age = 16
  next.player.realmLevel = 1
  next.player.currentExp = 0
  next.player.currency.low = Math.floor(next.player.currency.low * 0.5)
  next.player.daoJi.wuxing = Math.max(1, Math.floor(next.player.daoJi.wuxing * 0.3))
  next.player.daoJi.daoxin = Math.max(1, Math.floor(next.player.daoJi.daoxin * 0.3))
  next.player.daoJi.gengu = Math.max(1, Math.floor(next.player.daoJi.gengu * 0.3))
  next.player.daoJi.qiyun = Math.max(1, Math.floor(next.player.daoJi.qiyun * 0.3))
  next.player.daoYun.level = Math.max(1, Math.floor(next.player.daoYun.level * 0.2))
  next.player.lifespanMax = 100
  next.resources = { pills: 1, injury: '无恙', injuryDays: 0 }
  next.schedule = [{ id: `reincarnate-${next.day}`, activity: 'cultivate', days: 7 }]
  next.unfinishedFates = []
  next.activeExpedition = null
  next.death = null
  next.pendingEvent = null
  next.paused = true
  next.speed = 0
  refreshPower(next.player)
  addLog(next, '轮回重修已启：前世残忆护住一缕道途。')
  pushCheckpoint(next, '轮回新生')
  return next
}

export function dismissOfflineReport(session: GameSessionV2): GameSessionV2 { return { ...session, offlineReport: null } }

export function gameDate(session: GameSessionV2): { year: number; month: number; day: number } {
  return { year: Math.floor((session.day - 1) / 360) + 1, month: Math.floor(((session.day - 1) % 360) / 30) + 1, day: ((session.day - 1) % 30) + 1 }
}
