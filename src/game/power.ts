// ============================================================
// 战力计算与境界推进 (第三章)
// ============================================================
import type { PlayerCharacter } from './types'
import { getRealmStage, getRealmLayer, REALM_RATING, GONGFA_GRADE_INFO } from './data'

export function calcPower(player: PlayerCharacter): number {
  const primaryEq = player.equipments.find((e) => e.isPrimary) ?? player.equipments[0]
  const primaryGongfa = player.gongfas.find((g) => g.isPrimary) ?? player.gongfas[0]
  const eqLevel = primaryEq?.level ?? 0
  const gongfaLevel = primaryGongfa?.level ?? 1
  return Math.round(player.realmLevel + eqLevel * 3 + gongfaLevel * 0.8)
}

export function calcDisplayPower(player: PlayerCharacter, hideRatio = 0): number {
  const real = calcPower(player)
  return Math.round(real * (1 - hideRatio))
}

export function getRealmDescriptor(level: number) {
  const stage = getRealmStage(level)
  const layer = getRealmLayer(level)
  const rating = REALM_RATING[stage.name]
  return { stageName: stage.name, layer, rating, lifespan: stage.lifespan }
}

export function expNeededForLevel(level: number): number {
  return getRealmStage(level).expPerLevel
}

/** 增加修为经验，处理自动升级(小境界内, 不含渡劫大关) */
export function addCultivationExp(
  player: PlayerCharacter,
  amount: number
): { leveledUp: boolean; newLevel: number; hitBreakthroughGate: boolean } {
  player.currentExp += amount
  let leveledUp = false
  let hitBreakthroughGate = false

  while (true) {
    const stage = getRealmStage(player.realmLevel)
    const needed = stage.expPerLevel
    if (player.currentExp < needed) break
    // 是否处于小境界顶层，需要跨大境界渡劫
    const isTopOfStage = player.realmLevel === stage.maxLevel
    if (isTopOfStage && player.realmLevel < 100) {
      hitBreakthroughGate = true
      break // 交由 breakthrough.ts 处理天劫
    }
    if (player.realmLevel >= 100) break
    player.currentExp -= needed
    player.realmLevel += 1
    leveledUp = true
  }

  return { leveledUp, newLevel: player.realmLevel, hitBreakthroughGate }
}

export function refreshPower(player: PlayerCharacter) {
  player.power = calcPower(player)
  // 简化：若外显被玩家标记隐藏，displayPower 由调用方另行设置，默认等于真实战力
  if (player.displayPower === 0 || player.displayPower > player.power) {
    player.displayPower = player.power
  }
}

export const GONGFA_GRADE_INFO_EXPORT = GONGFA_GRADE_INFO
