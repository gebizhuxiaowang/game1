import type { DaoJiExp, DecisionOption, MonthSettlement, NPC, PlayerCharacter } from './types'
import { BREAKTHROUGH_GATES, DWELLING_SPEED_BONUS, daoJiExpNeeded, getRealmStage } from './data'
import { addCultivationExp, expNeededForLevel, refreshPower } from './power'
import { freshRng, pick, randInt, type RngFn } from './rng'
import { resolveCombat } from './combat'

const emptySettlement = (): MonthSettlement => ({
  narrative: '',
  daoJiExpGain: {},
  daoYunExpGain: 0,
  currencyDelta: {},
  itemsGained: [],
  itemsLost: [],
  relationChanges: [],
})

const add = (target: Partial<DaoJiExp>, key: keyof DaoJiExp, amount: number) => {
  target[key] = (target[key] ?? 0) + amount
}

const cap = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const option = (id: string, category: DecisionOption['category'], text: string, meta: Record<string, unknown> = {}, risky = false): DecisionOption => ({
  id,
  category,
  text,
  risky,
  expireMonth: undefined,
  meta,
})

function closestNpcs(player: PlayerCharacter): NPC[] {
  return [...player.npcs].filter((npc) => npc.alive).sort((a, b) => b.intimacy - a.intimacy)
}

/** Build the fifteen-option monthly compass according to the annual rhythm. */
export function generateDecisionOptions(player: PlayerCharacter, rng: RngFn = freshRng()): DecisionOption[] {
  const npcs = closestNpcs(player)
  const ally = npcs[0]
  const stranger = npcs[1] ?? ally
  const destinyName = player.destinyLine.stages[player.destinyLine.currentStageIndex] ?? '大道终章'
  const scheduledDestiny = player.gameMonthOfYear <= 3 && player.destinyLine.status !== '已完成'
  const worldEvent = player.gameMonthOfYear === 6 || player.gameMonthOfYear === 7

  const options: DecisionOption[] = []
  if (scheduledDestiny) {
    options.push(
      option('destiny_advance', '天命之召', `【天命·${player.destinyLine.title}】追索「${destinyName}」的线索`, { action: 'destiny' }, true),
      option('destiny_prepare', '天命之召', `为「${destinyName}」整备行囊，稳固道基`, { action: 'prepare' }),
      option('destiny_inquire', '天命之召', `向当地前辈打听「${destinyName}」的旧闻`, { action: 'inquire' }),
    )
  } else {
    options.push(
      option('fate_read', '因缘际会', worldEvent ? '【天下因缘】远方秘境的天象已映入云层' : '坊市传来一则尚未证实的机缘传闻', { action: 'fortune' }, worldEvent),
      option('fate_give', '因缘际会', '路遇受伤散修，是否出手相助', { action: 'kindness' }),
      option('fate_market', '因缘际会', '坊市夜拍将开，有件灵物引人注目', { action: 'market' }),
    )
  }

  options.push(
    option('explore_ridge', '历练探索', `前往${player.region}边缘寻觅灵材`, { action: 'explore' }),
    option('explore_ruin', '历练探索', '循着残图探索一处无名遗址', { action: 'ruin' }, { action: 'ruin' }.action === 'ruin'),
    option('explore_hunt', '历练探索', '接下坊市的低阶妖兽清剿委托', { action: 'hunt' }, true),
  )

  if (ally) options.push(option(`social_${ally.id}`, '道缘经营', `拜访 ${ally.name}，共论近来的仙途见闻`, { action: 'social', npcId: ally.id }, false))
  if (stranger) options.push(option(`social_${stranger.id}`, '道缘经营', `与 ${stranger.name} 结伴游历半日，试探其心意`, { action: 'social', npcId: stranger.id }, false))
  options.push(
    option('craft_refine', '修仙百艺', '在坊市替人鉴定灵材，赚取灵石并积累见闻', { action: 'craft' }),
    option('craft_study', '修仙百艺', '研读玉简，尝试推演一门修仙技艺', { action: 'study' }),
    option('cultivate', '闭关修持', '闭关吐纳，打磨体内灵力', { action: 'cultivate' }),
    option('gongfa', '闭关修持', '参悟主修功法的一处晦涩篇章', { action: 'gongfa' }),
    option('temper', '闭关修持', '以苦修淬炼根骨与道心', { action: 'temper' }),
  )

  return options.slice(0, 15).map((item, index) => ({ ...item, id: `${player.gameMonth}-${index + 1}-${item.id}`, expireMonth: player.gameMonth + randInt(1, 4, rng) }))
}

function applyDaoJi(player: PlayerCharacter, gains: Partial<DaoJiExp>) {
  for (const [key, amount] of Object.entries(gains) as [keyof DaoJiExp, number][]) {
    player.daoJiExp[key] += amount
    while (player.daoJiExp[key] >= daoJiExpNeeded(player.daoJi[key])) {
      player.daoJiExp[key] -= daoJiExpNeeded(player.daoJi[key])
      player.daoJi[key] = Math.min(100, player.daoJi[key] + 1)
    }
  }
}

function applyDaoYun(player: PlayerCharacter, gain: number) {
  const bottleneck = player.daoYun.level > player.daoJi.wuxing * 2
  player.daoYun.exp += bottleneck ? Math.floor(gain / 2) : gain
  const needed = player.daoYun.level * 60
  if (player.daoYun.exp >= needed && player.daoYun.level < 100) {
    player.daoYun.exp -= needed
    player.daoYun.level += 1
  }
}

function setRelationTier(npc: NPC) {
  if (npc.interactionCount >= 20 && npc.intimacy >= 80 && npc.eventsShared >= 3) npc.tier = '心腹/道侣'
  else if (npc.interactionCount >= 8 && npc.intimacy >= 60 && npc.eventsShared >= 1) npc.tier = '道友'
  else if (npc.interactionCount >= 3 || npc.intimacy >= 40) npc.tier = '熟识'
  else if (npc.interactionCount >= 1) npc.tier = '一面之缘'
}

function attemptBreakthrough(player: PlayerCharacter, settlement: MonthSettlement, rng: RngFn) {
  const gate = BREAKTHROUGH_GATES.find((item) => item.from === player.realmLevel)
  if (!gate || player.currentExp < expNeededForLevel(player.realmLevel)) return
  const chance = cap(0.52 + player.daoJi.daoxin / 400 + player.daoJi.gengu / 500 + (player.spiritRoot.grade === '废灵根' ? 0.08 : 0), 0.35, 0.9)
  const success = rng() < chance
  if (success) {
    player.currentExp -= expNeededForLevel(player.realmLevel)
    player.realmLevel = gate.to
    player.lifespanMax = getRealmStage(gate.to).lifespan
    settlement.breakthrough = { success: true, from: gate.from, to: gate.to, note: `突破成功：${gate.successReward}` }
  } else {
    player.currentExp = 0
    const fallback = gate.from >= 60 ? Math.max(21, gate.from - 20) : Math.max(1, gate.from - (gate.from >= 40 ? 5 : 3))
    player.realmLevel = fallback
    settlement.breakthrough = { success: false, from: gate.from, to: fallback, note: `突破受阻：${gate.failPenalty}` }
  }
}

function advanceDate(player: PlayerCharacter) {
  player.gameMonth += 1
  player.gameMonthOfYear += 1
  if (player.gameMonthOfYear > 12) {
    player.gameMonthOfYear = 1
    player.gameYear += 1
    player.age += 1
  }
}

/** Applies one selected action and returns the fully prepared state for the next month. */
export function resolveMonth(original: PlayerCharacter, selected: DecisionOption, rng: RngFn = freshRng()) {
  const player = structuredClone(original) as PlayerCharacter
  const settlement = emptySettlement()
  const action = String(selected.meta?.action ?? 'cultivate')
  const daoJiGain: Partial<DaoJiExp> = {}
  let cultivationExp = 8
  let daoYunGain = 3

  if (action === 'cultivate' || action === 'gongfa' || action === 'temper' || action === 'prepare') {
    const rate = 1 + player.spiritRoot.speedModifier + (DWELLING_SPEED_BONUS[player.dwelling.level] ?? 0)
    cultivationExp = Math.round((action === 'cultivate' ? 45 : action === 'gongfa' ? 25 : 30) * rate)
    add(daoJiGain, action === 'temper' ? 'gengu' : 'wuxing', action === 'cultivate' ? 10 : 7)
    if (action === 'temper') add(daoJiGain, 'daoxin', 8)
    if (action === 'gongfa') settlement.gongfaExpGain = { id: player.gongfas[0].id, gain: 15 }
    settlement.narrative = action === 'cultivate' ? '灵息周天流转，吐纳之间心神渐宁。' : '你在寂静中反复推演，所得虽微，却也扎实。'
  } else if (action === 'social') {
    const npc = player.npcs.find((item) => item.id === selected.meta?.npcId)
    const change = randInt(5, 14, rng)
    if (npc) {
      npc.intimacy = cap(npc.intimacy + change, 0, 100)
      npc.interactionCount += 1
      npc.lastContactMonth = player.gameMonth
      setRelationTier(npc)
      settlement.relationChanges.push({ npcId: npc.id, name: npc.name, delta: change, note: `共话仙途，好感 +${change}` })
      settlement.narrative = `你与${npc.name}品茗论道，对方透露了些许不愿示人的心事。`
    }
    add(daoJiGain, 'daoxin', 8)
    daoYunGain = 10
  } else if (action === 'craft' || action === 'study' || action === 'market') {
    const stones = randInt(6, 18, rng)
    player.currency.low += stones
    settlement.currencyDelta.low = stones
    settlement.itemsGained.push(`${stones} 枚下品灵石`)
    settlement.narrative = action === 'study' ? '玉简中的符文彼此映照，你对百艺之道生出新领悟。' : '你在坊市周旋半日，小有所得。'
    add(daoJiGain, 'wuxing', 9)
    daoYunGain = 8
  } else if (action === 'destiny') {
    const name = player.destinyLine.stages[player.destinyLine.currentStageIndex]
    player.destinyLine.status = '已完成'
    player.destinyLine.rewardsGained.push(`${name}的感悟`)
    settlement.destinyUpdate = `【${player.destinyLine.title}】阶段「${name}」已完成。`
    settlement.itemsGained.push('天命感悟一缕')
    cultivationExp = 35
    daoYunGain = 18
    add(daoJiGain, 'daoxin', 14)
    settlement.narrative = `冥冥之中，${name}的线索在你掌中汇聚。你作出自己的选择，命途随之偏转。`
  } else if (action === 'inquire' || action === 'fortune' || action === 'kindness') {
    settlement.narrative = action === 'kindness' ? '善意未必立刻化作回报，但一缕清气已悄然留在你的气运中。' : '纷杂讯息逐渐拼合成形，你看到前路多出一条分岔。'
    add(daoJiGain, 'qiyun', 10)
    daoYunGain = 12
  } else {
    const target = pick(player.npcs.filter((npc) => npc.alive), rng)
    const nature = action === 'hunt' ? '妖兽战斗' : action === 'ruin' ? '生死仇杀' : '切磋较技'
    const combat = resolveCombat(player, { opponent: { name: action === 'hunt' ? '赤鬃妖狼' : target.name, power: action === 'hunt' ? Math.max(8, player.power + randInt(-5, 12, rng)) : target.power, realmLevel: action === 'hunt' ? Math.max(1, player.realmLevel + randInt(-2, 3, rng)) : target.realmLevel }, nature, isDestinyBattle: false }, rng)
    settlement.combat = combat
    settlement.narrative = combat.narrative
    if (combat.win) {
      cultivationExp = nature === '妖兽战斗' ? 32 : 22
      daoYunGain = 10
      add(daoJiGain, 'gengu', 10)
      const stones = randInt(8, 24, rng)
      player.currency.low += stones
      settlement.currencyDelta.low = stones
      settlement.itemsGained.push(...(combat.rewards ?? []), `${stones} 枚下品灵石`)
    } else {
      cultivationExp = 0
      player.currency.low = Math.max(0, player.currency.low - 5)
      settlement.currencyDelta.low = -5
      settlement.itemsLost.push('5 枚下品灵石')
      if (nature !== '切磋较技') player.realmLevel = Math.max(1, player.realmLevel - 1)
      add(daoJiGain, 'daoxin', 4)
    }
  }

  const cultivation = addCultivationExp(player, cultivationExp)
  applyDaoJi(player, daoJiGain)
  applyDaoYun(player, daoYunGain)
  settlement.daoJiExpGain = daoJiGain
  settlement.daoYunExpGain = daoYunGain
  if (settlement.gongfaExpGain) {
    const gongfa = player.gongfas.find((item) => item.id === settlement.gongfaExpGain?.id)
    if (gongfa) gongfa.exp += settlement.gongfaExpGain.gain
  }
  if (cultivation.hitBreakthroughGate) attemptBreakthrough(player, settlement, rng)
  if (cultivation.leveledUp) settlement.itemsGained.push(`修为提升至 ${player.realmLevel} 级`)

  if (action === 'destiny') {
    player.destinyLine.currentStageIndex += 1
    player.destinyLine.status = player.destinyLine.currentStageIndex >= player.destinyLine.stages.length ? '已完成' : '待抉择'
    player.destinyLine.waitingSinceMonth = player.gameMonth + 1
  }
  player.behaviorTags[action] = (player.behaviorTags[action] ?? 0) + 1
  player.noChoiceStreak = ['destiny', 'fortune', 'kindness', 'inquire'].includes(action) ? 0 : player.noChoiceStreak + 1
  player.log = [`第${player.gameYear}年${player.gameMonthOfYear}月：${settlement.narrative}`, ...player.log].slice(0, 40)
  advanceDate(player)
  refreshPower(player)
  player.activeOptions = generateDecisionOptions(player, rng)
  return { player, settlement }
}

export function initializePlayer(player: PlayerCharacter, rng: RngFn = freshRng()): PlayerCharacter {
  const next = structuredClone(player) as PlayerCharacter
  refreshPower(next)
  next.lifespanMax = getRealmStage(next.realmLevel).lifespan
  next.activeOptions = generateDecisionOptions(next, rng)
  return next
}
