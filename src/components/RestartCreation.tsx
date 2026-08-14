import { useMemo, useState } from 'react'
import { RESTART_ATTRIBUTE_KEYS, canSelectRestartTalent, createRestartDraft, createRestartRun, getRestartTalent, isValidRestartDraft, remainingRestartPoints, restartAttributeLabel, selectedRestartTalents } from '../game/restart/engine'
import type { RestartAttributeKey, RestartDraft, RestartRun } from '../game/restart/types'

interface Props { onStart: (run: RestartRun) => void; onBack: () => void }

const tierRank = { 普通: 0, 稀有: 1, 传说: 2 }

export function RestartCreation({ onStart, onBack }: Props) {
  const [name, setName] = useState('')
  const [draft, setDraft] = useState<RestartDraft>(() => createRestartDraft())
  const [error, setError] = useState('')
  const candidates = useMemo(() => draft.candidateTalentIds.map(getRestartTalent).filter((talent) => Boolean(talent)).sort((left, right) => tierRank[right!.tier] - tierRank[left!.tier]), [draft.candidateTalentIds])
  const remaining = remainingRestartPoints(draft.attributes)
  const selected = selectedRestartTalents(draft)

  const toggleTalent = (talentId: string) => {
    setError('')
    setDraft((current) => {
      if (current.selectedTalentIds.includes(talentId)) return { ...current, selectedTalentIds: current.selectedTalentIds.filter((id) => id !== talentId) }
      if (!canSelectRestartTalent(current, talentId)) return current
      return { ...current, selectedTalentIds: [...current.selectedTalentIds, talentId] }
    })
  }

  const adjustAttribute = (key: RestartAttributeKey, delta: number) => {
    setDraft((current) => {
      const value = current.attributes[key]
      const canIncrease = delta > 0 && remainingRestartPoints(current.attributes) > 0 && value < 10
      const canDecrease = delta < 0 && value > 0
      if (!canIncrease && !canDecrease) return current
      return { ...current, attributes: { ...current.attributes, [key]: value + delta } }
    })
  }

  const start = () => {
    if (!isValidRestartDraft(draft)) {
      setError('请选择恰好三项天赋，并将十五点道基全部分配完毕。')
      return
    }
    try { onStart(createRestartRun(draft, name)) } catch (reason) { setError(reason instanceof Error ? reason.message : '命格生成失败。') }
  }

  return <main className="restart-shell">
    <header className="restart-header"><div><p className="eyebrow">修仙人生重启 · 第一世</p><h1>书写你的命格</h1></div><button className="text-button" onClick={onBack}>← 返回模式入口</button></header>
    <section className="restart-intro"><p>这一世不会继承实时仙途的角色或道果。九个命格随机落下，请选三项；再将十五点道基分给悟、心、根、运。灵根会在天赋与命数中自然显现。</p></section>
    <section className="restart-section"><div className="restart-section-head"><div><p className="eyebrow">壹 · 命格九选三</p><h2>已选择 {selected.length} / 3</h2></div><span>固定种子 · 稀有与传说天赋带有轻度取舍</span></div><div className="talent-grid">{candidates.map((talent) => talent && <button key={talent.id} className={`restart-talent tier-${talent.tier} ${draft.selectedTalentIds.includes(talent.id) ? 'selected' : ''}`} onClick={() => toggleTalent(talent.id)}><span>{talent.tier}</span><strong>{talent.name}</strong><small>{talent.description}</small><em>取舍：{talent.tradeoff}</em>{talent.mutexTag && <b>存在互斥命格</b>}</button>)}</div></section>
    <section className="restart-section"><div className="restart-section-head"><div><p className="eyebrow">贰 · 十五点道基</p><h2>剩余 {remaining} 点</h2></div><span>单项基础值最高 10，天赋效果会在开局后叠加</span></div><div className="attribute-allocation">{RESTART_ATTRIBUTE_KEYS.map((key) => <article key={key}><div><strong>{restartAttributeLabel(key)}</strong><small>{{ wuxing: '理解功法、阵法与秘境', daoxin: '抵御心魔、守住承诺', gengu: '承受苦修与破境压力', qiyun: '捕捉机缘、化险为夷' }[key]}</small></div><div className="attribute-stepper"><button onClick={() => adjustAttribute(key, -1)} aria-label={`降低${restartAttributeLabel(key)}`}>−</button><b>{draft.attributes[key]}</b><button onClick={() => adjustAttribute(key, 1)} aria-label={`提高${restartAttributeLabel(key)}`}>+</button></div></article>)}</div></section>
    <section className="restart-confirm"><label className="name-field">此世姓名<input value={name} maxLength={12} onChange={(event) => setName(event.target.value)} placeholder="无名修士" /></label><div><p>命格：{selected.length ? selected.map((talent) => talent.name).join(' · ') : '尚未选择'}</p><small>基础道基：悟 {draft.attributes.wuxing} · 心 {draft.attributes.daoxin} · 根 {draft.attributes.gengu} · 运 {draft.attributes.qiyun}</small></div><button className="primary-button" onClick={start} disabled={!isValidRestartDraft(draft)}>落子，开启此生 →</button></section>
    {error && <p className="restart-error">{error}</p>}
  </main>
}
