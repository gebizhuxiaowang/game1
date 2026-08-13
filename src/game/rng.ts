// 简单可复现的伪随机数生成器（Mulberry32），便于未来做"种子存档"
export function createRng(seed: number) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type RngFn = () => number

export function pick<T>(arr: readonly T[], rng: RngFn): T {
  return arr[Math.floor(rng() * arr.length)]
}

export function pickN<T>(arr: readonly T[], n: number, rng: RngFn): T[] {
  const pool = [...arr]
  const result: T[] = []
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

export function randInt(min: number, max: number, rng: RngFn): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function weightedPick<T extends { weight: number }>(items: T[], rng: RngFn): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = rng() * total
  for (const item of items) {
    if (r < item.weight) return item
    r -= item.weight
  }
  return items[items.length - 1]
}

let globalSeedCounter = Date.now()
export function freshRng(): RngFn {
  globalSeedCounter = (globalSeedCounter + 2654435761) >>> 0
  return createRng(globalSeedCounter ^ Math.floor(Math.random() * 0xffffffff))
}
