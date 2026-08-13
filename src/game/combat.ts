import type { CombatNature, CombatResult, NPC, PlayerCharacter } from './types'
import { FATE_ROLL_TABLE, WINRATE_FEEDBACK } from './data'
import { weightedPick, type RngFn } from './rng'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function feedbackFor(rate: number): string {
  return WINRATE_FEEDBACK.find((item) => rate >= item.min && rate <= item.max)?.text ?? WINRATE_FEEDBACK[0].text
}

function fateTableFor(player: PlayerCharacter) {
  return FATE_ROLL_TABLE.map((item) => {
    let weight = item.weight
    if (player.daoYun.name === '天人感应' && (item.label.includes('天赐') || item.label.includes('鸿运'))) weight += 2
    if (player.daoYun.name === '天人感应' && item.label.includes('天意')) weight -= 2
    if (player.daoYun.name === '未卜先知' && (item.label.includes('天意') || item.label.includes('时运'))) weight -= 2
    if (player.daoJi.qiyun >= 60 && item.label.includes('天赐')) weight += 1
    if (player.daoJi.qiyun >= 80 && item.label.includes('天赐')) weight += 1
    return { ...item, weight: Math.max(1, weight) }
  })
}

export interface CombatInput {
  opponent: Pick<NPC, 'name' | 'power' | 'realmLevel'>
  nature: CombatNature
  isDestinyBattle?: boolean
}

/** Resolve a battle using the setting's power comparison, fate die, and safety bounds. */
export function resolveCombat(player: PlayerCharacter, input: CombatInput, rng: RngFn): CombatResult {
  const levelDiff = player.realmLevel - input.opponent.realmLevel
  const powerDiff = player.power - input.opponent.power
  const sameCultivation = Math.abs(levelDiff) <= 5
  const fateRoll = weightedPick(fateTableFor(player), rng)
  let baseWinRate: number

  if (sameCultivation && powerDiff !== 0) {
    // 同境战力压制仍保留 5% 天道变量，避免绝对结果。
    baseWinRate = powerDiff > 0 ? 0.9 : 0.1
  } else if (levelDiff < -5) {
    baseWinRate = 0.2 + powerDiff * 0.01
  } else {
    baseWinRate = 0.5 + powerDiff * 0.012 + levelDiff * 0.01
  }

  const finalWinRate = clamp(baseWinRate + fateRoll.modifier, 0.05, 0.95)
  const win = rng() < finalWinRate
  const percent = Math.round(finalWinRate * 100)
  const result: CombatResult = {
    nature: input.nature,
    opponentName: input.opponent.name,
    opponentPower: input.opponent.power,
    playerPower: player.power,
    levelDiff,
    baseWinRate: Math.round(baseWinRate * 100),
    fateRoll,
    finalWinRate: percent,
    win,
    isDestinyBattle: input.isDestinyBattle,
    narrative: `${feedbackFor(percent)} 命运骰子落在「${fateRoll.label}」：${fateRoll.desc}`,
    rewards: [],
    penalty: [],
  }

  if (win) {
    if (input.nature === '切磋较技') result.rewards = ['声望提升', '道韵经验 +8']
    else if (input.nature === '妖兽战斗') result.rewards = ['妖兽材料一份', '修为经验 +20']
    else result.rewards = ['缴获灵石与战利品', '道韵经验 +10']
  } else if (input.nature === '切磋较技') {
    result.penalty = ['切磋落败，无实质损失']
  } else if (input.nature === '妖兽战斗') {
    result.penalty = ['受伤休养，修为经验减少']
  } else {
    const reduction = input.isDestinyBattle ? 0.5 : 1
    const retreat = Math.max(0, Math.ceil((Math.abs(powerDiff) > 20 ? 3 : 1) * reduction))
    result.penalty = input.isDestinyBattle
      ? [`天命庇护生效：修为倒退 ${retreat} 级，未伤及根本`]
      : [`重伤遁走：修为倒退 ${retreat} 级，遗失部分灵石`]
  }

  return result
}
