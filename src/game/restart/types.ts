export type RestartAttributeKey = 'wuxing' | 'daoxin' | 'gengu' | 'qiyun'
export type RestartTalentTier = '普通' | '稀有' | '传说'
export type RestartRunStatus = 'active' | 'finished'
export type RestartLogKind = 'ordinary' | 'key' | 'result'
export type RestartSpiritRoot = '废灵根' | '凡品灵根' | '中品灵根' | '上品灵根' | '极品灵根' | '异灵根'

export interface RestartAttributes {
  wuxing: number
  daoxin: number
  gengu: number
  qiyun: number
}

export interface RestartTalentEffects {
  attributes?: Partial<RestartAttributes>
  cultivationBonus?: number
  wealthBonus?: number
  healthBonus?: number
  lifespanBonus?: number
  spiritRoot?: RestartSpiritRoot
  tags?: string[]
}

export interface RestartTalent {
  id: string
  tier: RestartTalentTier
  name: string
  description: string
  tradeoff: string
  mutexTag?: string
  effects: RestartTalentEffects
}

export interface RestartDraft {
  seed: number
  candidateTalentIds: string[]
  selectedTalentIds: string[]
  attributes: RestartAttributes
}

export interface RestartOutcome {
  log: string
  cultivation?: number
  wealth?: number
  health?: number
  lifespan?: number
  tags?: string[]
}

export interface RestartEventChoice {
  id: string
  label: string
  description: string
  stat: RestartAttributeKey | 'none'
  difficulty: number
  safe?: boolean
  success: RestartOutcome
  failure: RestartOutcome
}

export interface RestartEventTemplate {
  id: string
  age: number
  title: string
  description: string
  phase: string
  final?: boolean
  choices: RestartEventChoice[]
}

export interface RestartPendingEvent extends RestartEventTemplate {}

export interface RestartLog {
  id: string
  age: number
  range?: string
  kind: RestartLogKind
  text: string
}

export interface RestartEnding {
  id: string
  title: string
  description: string
  rarity: RestartTalentTier
}

export interface RestartStats {
  highestRealmLevel: number
  wealthEarned: number
  keyDecisions: number
  ordinaryYears: number
  successChoices: number
}

export interface RestartRun {
  version: 1
  id: string
  seed: number
  name: string
  status: RestartRunStatus
  age: number
  lifespan: number
  health: number
  attributes: RestartAttributes
  talents: RestartTalent[]
  spiritRoot: RestartSpiritRoot
  realmLevel: number
  cultivation: number
  wealth: number
  tags: string[]
  logs: RestartLog[]
  eventIndex: number
  pendingEvent: RestartPendingEvent | null
  stats: RestartStats
  ending: RestartEnding | null
}

export interface RestartProfile {
  version: 1
  totalRuns: number
  longestLife: number
  highestRealmLevel: number
  unlockedEndingIds: string[]
}
