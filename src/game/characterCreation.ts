// ============================================================
// 角色创建逻辑 (第二章)
// ============================================================
import type {
  PlayerCharacter,
  Gender,
  Race,
  AgeBand,
  RegionId,
  SpiritRoot,
  SpiritRootGrade,
  NPC,
} from './types'
import {
  ORIGIN_PACKAGES,
  INNATE_DAOYUN_LIST,
  SPIRIT_ROOT_MODIFIER,
  DWELLING_NAMES,
  DESTINY_STAGES,
  NPC_SURNAMES,
  NPC_GIVEN_NAMES,
  NPC_TRAITS,
  NPC_GOALS,
  REGION_LIST,
} from './data'
import { freshRng, pick, pickN, randInt, weightedPick, type RngFn } from './rng'
import { refreshPower } from './power'

export const RACE_BONUS: Record<Race, string> = {
  人族: '悟性+5%，适应性最强，各大势力均有分布',
  妖族: '根骨+10%，修炼到一定境界可化形，妖域有天然优势',
  灵族: '气运+5%，草木金石精粹化形，寿元绵长，族人稀少',
}

export const AGE_BAND_INFO: Record<AgeBand, string> = {
  '少年/青年': 'NPC倾向宽容教导，拜师入宗等事件更易触发',
  壮年: '初始修为略高，但"宗门新秀"类事件不可用',
  中老年: '道心初始加成，根骨相关判定有衰减',
  老年: '需搭配特定开局包，初始道心与气运较高，寿元紧迫',
}

const SPIRIT_ROOT_GRADE_WEIGHTS: { grade: SpiritRootGrade; weight: number }[] = [
  { grade: '凡品', weight: 35 },
  { grade: '中品', weight: 35 },
  { grade: '上品', weight: 18 },
  { grade: '极品', weight: 6 },
  { grade: '异灵根', weight: 4 },
  { grade: '废灵根', weight: 2 },
]

const EXOTIC_ELEMENTS = ['雷', '冰', '风', '暗', '光']

export function rollSpiritRoot(rng: RngFn): SpiritRoot {
  const rolled = weightedPick(SPIRIT_ROOT_GRADE_WEIGHTS, rng)
  const grade = rolled.grade
  const baseElements = ['金', '木', '水', '火', '土']
  let elements: string[] = []
  let note: string | undefined

  switch (grade) {
    case '凡品':
      elements = pickN(baseElements, randInt(1, 2, rng), rng)
      note = '纯度低'
      break
    case '中品':
      elements = pickN(baseElements, randInt(2, 3, rng), rng)
      note = '纯度中'
      break
    case '上品':
      elements = pickN(baseElements, randInt(1, 2, rng), rng)
      note = '纯度高'
      break
    case '极品':
      elements = pickN(baseElements, 1, rng)
      note = '单系天灵根'
      break
    case '异灵根':
      elements = pickN(EXOTIC_ELEMENTS, 1, rng)
      note = '附带特殊效果'
      break
    case '废灵根':
      elements = [...baseElements]
      note = '五系俱全且纯度极低，但天劫威力减半'
      break
  }

  return {
    grade,
    elements,
    speedModifier: SPIRIT_ROOT_MODIFIER[grade],
    note,
  }
}

export function rollInnateDaoYun(rng: RngFn, chosenId?: number) {
  const base = chosenId
    ? INNATE_DAOYUN_LIST.find((d) => d.id === chosenId) ?? pick(INNATE_DAOYUN_LIST, rng)
    : pick(INNATE_DAOYUN_LIST, rng)
  return { ...base, level: 1, exp: 0 }
}

export interface CharacterCreationInput {
  name: string
  gender: Gender
  race: Race
  ageBand: AgeBand
  region: RegionId
  originPackageId: number
  daoYunId: number
}

function initialDaoJiBase(ageBand: AgeBand, race: Race) {
  const base = { wuxing: 10, daoxin: 10, gengu: 10, qiyun: 10, xuemai: 5 }
  if (ageBand === '中老年') {
    base.daoxin += 4
    base.gengu -= 2
  }
  if (ageBand === '老年') {
    base.daoxin += 6
    base.qiyun += 4
    base.gengu -= 4
  }
  if (ageBand === '壮年') {
    base.wuxing += 2
  }
  if (race === '妖族') base.gengu += 3
  if (race === '灵族') base.qiyun += 3
  if (race === '人族') base.wuxing += 2
  return base
}

function ageFromBand(ageBand: AgeBand, rng: RngFn): number {
  switch (ageBand) {
    case '少年/青年':
      return randInt(16, 25, rng)
    case '壮年':
      return randInt(26, 45, rng)
    case '中老年':
      return randInt(46, 60, rng)
    case '老年':
      return randInt(61, 99, rng)
  }
}

function generateNpcName(rng: RngFn): string {
  return pick(NPC_SURNAMES, rng) + pick(NPC_GIVEN_NAMES, rng)
}

export function generateRegionNpcs(region: RegionId, count: number, rng: RngFn): NPC[] {
  const npcs: NPC[] = []
  for (let i = 0; i < count; i++) {
    const realmLevel = randInt(1, 45, rng)
    const equipmentLevel = randInt(0, 5, rng)
    const gongfaLevel = randInt(1, 30, rng)
    const power = Math.round(realmLevel + equipmentLevel * 3 + gongfaLevel * 0.8)
    npcs.push({
      id: `npc_${Date.now()}_${i}_${Math.floor(rng() * 100000)}`,
      name: generateNpcName(rng),
      gender: rng() > 0.5 ? '男' : '女',
      race: pick(['人族', '妖族', '灵族'] as const, rng),
      realmLevel,
      equipmentLevel,
      gongfaLevel,
      power,
      traits: pickN(NPC_TRAITS, 2, rng),
      faction: rng() > 0.4 ? pick(['青云宗', '玄阴殿', '丹盟', '铁血堂', '散修联盟', '天剑门'], rng) : undefined,
      region,
      tier: randInt(0, 1, rng) === 0 ? '陌路' : '一面之缘',
      intimacy: randInt(5, 40, rng),
      interactionCount: 0,
      eventsShared: 0,
      lastContactMonth: 0,
      ability: undefined,
      goal: pick(NPC_GOALS, rng),
      alive: true,
      hostility: null,
    })
  }
  return npcs
}

export function createCharacter(input: CharacterCreationInput): PlayerCharacter {
  const rng = freshRng()
  const originPackage = ORIGIN_PACKAGES.find((p) => p.id === input.originPackageId) ?? ORIGIN_PACKAGES[0]
  const spiritRoot = rollSpiritRoot(rng)
  const daoYun = rollInnateDaoYun(rng, input.daoYunId)
  const age = ageFromBand(input.ageBand, rng)
  const daoJiBase = initialDaoJiBase(input.ageBand, input.race)

  const startingGongfaName = originPackage.destinyId === 'selfmade' ? '《基础功法残卷》' : '《基础吐纳术》'

  const npcs = generateRegionNpcs(input.region, randInt(10, 15, rng), rng)

  const player: PlayerCharacter = {
    name: input.name || '无名道人',
    gender: input.gender,
    race: input.race,
    ageBand: input.ageBand,
    age,
    lifespanMax: 100,
    spiritRoot,
    region: input.region,
    originPackage,
    daoYun,

    realmLevel: originPackage.startRealmLevel,
    currentExp: 0,

    daoJi: daoJiBase,
    daoJiExp: { wuxing: 0, daoxin: 0, gengu: 0, qiyun: 0, xuemai: 0 },

    gongfas: [
      {
        id: 'gongfa_start',
        name: startingGongfaName,
        grade: '凡品',
        level: 1,
        maxLevel: 30,
        isPrimary: true,
        exp: 0,
      },
    ],
    equipments: [
      { id: 'eq_start', name: originPackage.assets.split('+')[1] ?? '凡器长剑', level: 0, isPrimary: true },
    ],
    dwelling: { level: 0, name: DWELLING_NAMES[0] },
    currency: { low: randInt(3, 90, rng), mid: 0, high: 0, top: 0, crystal: 0 },
    crafts: [],

    power: 0,
    displayPower: 0,
    hiddenChargeCurrent: 0,
    hiddenChargeMax: 0,

    npcs,
    destinyLine: {
      id: originPackage.destinyId,
      title: originPackage.destinyTitle,
      stages: DESTINY_STAGES[originPackage.destinyId],
      currentStageIndex: 0,
      status: '待抉择',
      waitingSinceMonth: 1,
      rewardsGained: [],
    },

    gameMonth: 1,
    gameYear: 1,
    gameMonthOfYear: 1,

    titles: [],
    behaviorTags: {},
    noChoiceStreak: 0,

    activeOptions: [],
    log: [`你以「${originPackage.name}」之身，降临于${input.region}，天命主线【${originPackage.destinyTitle}】已悄然开启。`],

    version: 'V8.1.3',
  }

  refreshPower(player)
  return player
}

export { REGION_LIST }
