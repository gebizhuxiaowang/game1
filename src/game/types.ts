// ============================================================
// 修仙模拟器 · 核心数据类型定义 (基于 Ref V8.1.3 设定)
// ============================================================

export type Gender = '男' | '女'

export type Race = '人族' | '妖族' | '灵族'

export type AgeBand = '少年/青年' | '壮年' | '中老年' | '老年'

export type SpiritElement = '金' | '木' | '水' | '火' | '土'

export type SpiritRootGrade =
  | '凡品'
  | '中品'
  | '上品'
  | '极品'
  | '异灵根'
  | '废灵根'

export interface SpiritRoot {
  grade: SpiritRootGrade
  elements: SpiritElement[] | string[] // 异灵根可能是 雷/冰/风/暗/光 等
  speedModifier: number // 修炼速度百分比修正，如 -0.2 / 0 / 0.2 / 0.5 / 0.4 / -0.5
  note?: string
}

export type RegionId =
  | '中州圣城'
  | '东荒妖域'
  | '南明离火域'
  | '西极玄冰域'
  | '北冥瀚海'
  | '岭南百越'
  | '海外仙岛'

export interface RegionDef {
  id: RegionId
  bonus: string
  feature: string
}

export interface OriginPackage {
  id: number
  name: string
  assets: string
  startRealmLevel: number // 起始等级 (1~100)
  startSocial: string
  destinyTitle: string
  destinyId: string
}

export interface InnateDaoYun {
  id: number
  name: string
  effect: string
  levelUpWay: string
  level: number
  exp: number
}

// ---------------- 道基 (五维) ----------------
export interface DaoJi {
  wuxing: number // 悟性
  daoxin: number // 道心
  gengu: number // 根骨
  qiyun: number // 气运
  xuemai: number // 血脉
}

export interface DaoJiExp {
  wuxing: number
  daoxin: number
  gengu: number
  qiyun: number
  xuemai: number
}

// ---------------- 境界体系 ----------------
export interface RealmStage {
  name: string
  minLevel: number
  maxLevel: number
  expPerLevel: number
  lifespan: number
}

// ---------------- 功法 ----------------
export type GongfaGrade = '凡品' | '灵品' | '地品' | '天品' | '仙品'

export interface Gongfa {
  id: string
  name: string
  grade: GongfaGrade
  level: number
  maxLevel: number
  isPrimary: boolean
  exp: number
  protected?: boolean // 天命专属功法不可遗忘
}

// ---------------- 装备/法宝 ----------------
export interface Equipment {
  id: string
  name: string
  level: number // 0~10
  isPrimary: boolean
}

// ---------------- 洞府 ----------------
export interface Dwelling {
  level: number // 0~8
  name: string
}

// ---------------- 灵石资产 ----------------
export interface Currency {
  low: number // 下品灵石
  mid: number // 中品灵石
  high: number // 上品灵石
  top: number // 极品灵石
  crystal: number // 灵晶
}

// ---------------- 修仙百艺 ----------------
export interface Craft {
  id: string
  name: string
  level: number
  isPrimary: boolean
  exp: number
}

// ---------------- NPC ----------------
export type RelationTier =
  | '陌路'
  | '一面之缘'
  | '熟识'
  | '道友'
  | '心腹/道侣'

export type RelationAttitude = {
  intimacy: number // 亲疏 -100~100
  respect: number // 敬重/轻慢 -100~100
}

export interface NPC {
  id: string
  name: string
  gender: Gender
  race: Race
  realmLevel: number
  equipmentLevel: number
  gongfaLevel: number
  power: number
  traits: string[]
  faction?: string
  region: RegionId
  tier: RelationTier
  intimacy: number // 0-100 好感度
  interactionCount: number
  eventsShared: number
  lastContactMonth: number // 游戏总月数
  ability?: string // 道友之能
  goal?: string
  alive: boolean
  hostility?: '底层阻力' | '中层威胁' | '上层敌手' | '宿命大敌' | null
}

// ---------------- 天命主线 ----------------
export interface DestinyStage {
  stageIndex: number
  name: string
  status: '待抉择' | '进行中' | '已完成'
  waitingSinceMonth?: number
}

export interface DestinyLine {
  id: string
  title: string
  stages: string[]
  currentStageIndex: number
  status: '待抉择' | '进行中' | '已完成'
  waitingSinceMonth: number
  rewardsGained: string[]
}

// ---------------- 决策罗盘选项 ----------------
export type OptionCategory =
  | '天命之召'
  | '因缘际会'
  | '历练探索'
  | '道缘经营'
  | '修仙百艺'
  | '闭关修持'

export interface DecisionOption {
  id: string
  category: OptionCategory
  text: string
  risky?: boolean
  expireMonth?: number // 保鲜期结束的月份
  npcId?: string
  meta?: Record<string, unknown>
}

// ---------------- 战斗 ----------------
export type CombatNature = '切磋较技' | '生死仇杀' | '妖兽战斗' | '自卫反击'

export interface CombatResult {
  nature: CombatNature
  opponentName: string
  opponentPower: number
  playerPower: number
  levelDiff: number
  baseWinRate: number
  fateRoll: { label: string; desc: string; modifier: number }
  finalWinRate: number
  win: boolean
  narrative: string
  isDestinyBattle?: boolean
  rewards?: string[]
  penalty?: string[]
}

// ---------------- 存档 / 玩家状态 ----------------
export interface PlayerCharacter {
  name: string
  gender: Gender
  race: Race
  ageBand: AgeBand
  age: number
  lifespanMax: number
  spiritRoot: SpiritRoot
  region: RegionId
  originPackage: OriginPackage
  daoYun: InnateDaoYun

  realmLevel: number // 1-100
  currentExp: number // 当前等级下已获得修为

  daoJi: DaoJi
  daoJiExp: DaoJiExp

  gongfas: Gongfa[]
  equipments: Equipment[]
  dwelling: Dwelling
  currency: Currency
  crafts: Craft[]

  power: number
  displayPower: number // 外显战力
  hiddenChargeCurrent: number
  hiddenChargeMax: number

  npcs: NPC[]
  destinyLine: DestinyLine

  gameMonth: number // 总月数(从1开始)
  gameYear: number
  gameMonthOfYear: number

  titles: string[] // 天命封号等
  behaviorTags: Record<string, number> // 行为标签统计
  noChoiceStreak: number // 连续未选择天命/因缘标签的回合数

  activeOptions: DecisionOption[]
  log: string[] // 历史仙途纪要(简略)

  version: string
}

export interface MonthSettlement {
  narrative: string
  combat?: CombatResult
  daoJiExpGain: Partial<DaoJiExp>
  daoYunExpGain: number
  gongfaExpGain?: { id: string; gain: number }
  craftExpGain?: { id: string; gain: number }
  currencyDelta: Partial<Currency>
  itemsGained: string[]
  itemsLost: string[]
  relationChanges: { npcId: string; name: string; delta: number; note: string }[]
  destinyUpdate?: string
  breakthrough?: { success: boolean; from: number; to: number; note: string }
}
