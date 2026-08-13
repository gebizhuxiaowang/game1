import { useMemo, useState } from 'react'
import { expNeededForLevel, getRealmDescriptor } from '../game/power'
import type { DecisionOption, MonthSettlement, PlayerCharacter } from '../game/types'

interface Props {
  player: PlayerCharacter
  settlement: MonthSettlement | null
  onAction: (option: DecisionOption) => void
  onDismissSettlement: () => void
  onReset: () => void
  onExport: () => string
  onImport: (code: string) => boolean
}

const categoryIcons: Record<DecisionOption['category'], string> = {
  天命之召: '☯', 因缘际会: '✦', 历练探索: '⌁', 道缘经营: '❋', 修仙百艺: '⚒', 闭关修持: '◌',
}

const daoJiLabels = { wuxing: '悟性', daoxin: '道心', gengu: '根骨', qiyun: '气运', xuemai: '血脉' } as const

function Delta({ value }: { value?: number }) {
  if (!value) return null
  return <span className={value > 0 ? 'delta positive' : 'delta negative'}>{value > 0 ? '+' : ''}{value}</span>
}

export function GameDashboard({ player, settlement, onAction, onDismissSettlement, onReset, onExport, onImport }: Props) {
  const [tab, setTab] = useState<'compass' | 'relations' | 'records'>('compass')
  const [saveOpen, setSaveOpen] = useState(false)
  const [saveCode, setSaveCode] = useState('')
  const [customAction, setCustomAction] = useState('')
  const realm = getRealmDescriptor(player.realmLevel)
  const expNeeded = expNeededForLevel(player.realmLevel)
  const expProgress = Math.min(100, Math.round((player.currentExp / expNeeded) * 100))
  const grouped = useMemo(() => player.activeOptions.reduce<Record<string, DecisionOption[]>>((groups, item) => {
    groups[item.category] ??= []
    groups[item.category].push(item)
    return groups
  }, {}), [player.activeOptions])
  const currentDestiny = player.destinyLine.stages[player.destinyLine.currentStageIndex] ?? '大道已成'

  const submitCustom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customAction.trim()) return
    onAction({ id: `custom-${player.gameMonth}`, category: '闭关修持', text: customAction.trim(), meta: { action: 'cultivate' } })
    setCustomAction('')
  }

  const doExport = async () => {
    const code = onExport()
    setSaveCode(code)
    try { await navigator.clipboard.writeText(code) } catch { /* keep visible for manual copy */ }
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <div><p className="eyebrow">天玄大陆 · 第 {player.gameYear} 年 {player.gameMonthOfYear} 月</p><h1>{player.name}<span> · {realm.stageName}{realm.layer}层</span></h1></div>
        <div className="header-actions"><button className="text-button" onClick={() => setSaveOpen(true)}>存档</button><button className="text-button danger" onClick={onReset}>重开</button></div>
      </header>

      <section className="status-strip" aria-label="本月状态">
        <div><small>骨龄 / 寿元</small><strong>{player.age} <i>/</i> {player.lifespanMax}</strong></div>
        <div><small>所在地域</small><strong>{player.region}</strong></div>
        <div><small>灵根</small><strong>{player.spiritRoot.grade} · {player.spiritRoot.elements.join('')}</strong></div>
        <div><small>洞府</small><strong>{player.dwelling.name}</strong></div>
        <div><small>下品灵石</small><strong className="jade">◈ {player.currency.low}</strong></div>
      </section>

      <section className="cultivation-card">
        <div className="cultivation-head"><div><span className="eyebrow">修为 · {realm.rating}</span><h2>{realm.stageName} <b>Lv.{player.realmLevel}</b></h2></div><strong className="power">战力 {player.power}</strong></div>
        <div className="progress-track"><i style={{ width: `${expProgress}%` }} /></div>
        <div className="progress-label"><span>修为 {player.currentExp} / {expNeeded}</span><span>主修 {player.gongfas[0]?.name} Lv.{player.gongfas[0]?.level}</span></div>
        <div className="attribute-row">
          {(Object.keys(daoJiLabels) as (keyof typeof daoJiLabels)[]).map((key) => <div key={key}><small>{daoJiLabels[key]}</small><strong>{player.daoJi[key]}</strong></div>)}
          <div className="daoyun"><small>道韵</small><strong>{player.daoYun.name} <em>Lv.{player.daoYun.level}</em></strong></div>
        </div>
      </section>

      <section className="briefing-grid">
        <article className="oracle-card"><p className="eyebrow">天机简报</p><h3>{player.gameMonthOfYear <= 3 ? '命星微明，旧日因果在年初重现。' : player.gameMonthOfYear <= 7 ? '天地灵机起伏，远方传闻纷至沓来。' : '云气归于平缓，正是沉淀修行的时日。'}</h3><p>你的灵根与洞府会自动参与日常吐纳；本月仍可用一次主要行动改变仙途。</p></article>
        <article className="destiny-card"><p className="eyebrow">未竟仙途</p><h3>【{player.destinyLine.title}】</h3><p>当前阶段：<strong>{currentDestiny}</strong></p><small>{player.destinyLine.status === '已完成' ? '天命篇章已尽，前路由你书写。' : `${player.destinyLine.status} · 已等待 ${Math.max(0, player.gameMonth - player.destinyLine.waitingSinceMonth)} 月`}</small></article>
      </section>

      <nav className="game-tabs" aria-label="游戏面板"><button className={tab === 'compass' ? 'active' : ''} onClick={() => setTab('compass')}>决策罗盘</button><button className={tab === 'relations' ? 'active' : ''} onClick={() => setTab('relations')}>道缘关系</button><button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>仙途纪要</button></nav>

      {tab === 'compass' && <section className="compass-panel">
        <div className="panel-intro"><div><p className="eyebrow">本月一决</p><h2>决策罗盘</h2></div><span>每月只能选择一项主要行动</span></div>
        {Object.entries(grouped).map(([category, options]) => <section className="option-group" key={category}><h3><span>{categoryIcons[category as DecisionOption['category']]}</span>{category}</h3><div className="option-list">{options.map((item) => <button className={item.risky ? 'option-card risky' : 'option-card'} key={item.id} onClick={() => onAction(item)}><span className="option-number">{item.id.split('-')[1].padStart(2, '0')}</span><span>{item.text}</span>{item.risky && <em>风险</em>}<b>→</b></button>)}</div></section>)}
        <form className="custom-action" onSubmit={submitCustom}><input value={customAction} maxLength={60} onChange={(event) => setCustomAction(event.target.value)} placeholder="或写下你本月想做的一件事（将按闭关修持结算）"/><button className="text-button" type="submit">随心而行 →</button></form>
      </section>}

      {tab === 'relations' && <section className="side-panel"><div className="panel-intro"><div><p className="eyebrow">同行者</p><h2>道缘关系</h2></div><span>往来会改变彼此的仙途</span></div><div className="npc-list">{[...player.npcs].sort((a, b) => b.intimacy - a.intimacy).slice(0, 8).map((npc) => <article className="npc-card" key={npc.id}><div className="npc-avatar">{npc.name.slice(-1)}</div><div><h3>{npc.name} <small>{npc.tier}</small></h3><p>{npc.faction ?? '散修'} · {npc.traits.join(' / ')}</p></div><div className="intimacy"><span>亲近</span><strong>{npc.intimacy}</strong></div></article>)}</div></section>}

      {tab === 'records' && <section className="side-panel"><div className="panel-intro"><div><p className="eyebrow">过往因果</p><h2>仙途纪要</h2></div><span>最近四十条记录</span></div><ol className="log-list">{player.log.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ol></section>}

      {settlement && <div className="modal-backdrop" role="presentation"><section className="settlement-modal" role="dialog" aria-modal="true" aria-label="月末结算"><p className="eyebrow">月末结算</p><h2>一月因果，已然落定</h2><p className="settlement-narrative">{settlement.narrative}</p>{settlement.combat && <article className={settlement.combat.win ? 'combat-result victory' : 'combat-result defeat'}><strong>{settlement.combat.win ? '斗法获胜' : '斗法失利'}</strong><p>对阵 {settlement.combat.opponentName} · 胜机 {settlement.combat.finalWinRate}%</p><small>{settlement.combat.fateRoll.label}：{settlement.combat.fateRoll.desc}</small></article>}<div className="settlement-grid"><div><small>道韵经验</small><strong>+{settlement.daoYunExpGain}</strong></div>{Object.entries(settlement.daoJiExpGain).map(([key, value]) => <div key={key}><small>{daoJiLabels[key as keyof typeof daoJiLabels]}经验</small><strong>+{value}</strong></div>)}{Object.entries(settlement.currencyDelta).map(([key, value]) => <div key={key}><small>{key === 'low' ? '下品灵石' : key}</small><strong><Delta value={value} /></strong></div>)}</div>{settlement.breakthrough && <p className={settlement.breakthrough.success ? 'breakthrough success' : 'breakthrough failure'}>{settlement.breakthrough.note}</p>}{settlement.destinyUpdate && <p className="destiny-update">{settlement.destinyUpdate}</p>}{settlement.itemsGained.length > 0 && <p className="gain-line">获得：{settlement.itemsGained.join('、')}</p>}{settlement.itemsLost.length > 0 && <p className="loss-line">失去：{settlement.itemsLost.join('、')}</p>}<button className="primary-button" onClick={onDismissSettlement}>进入下一月 →</button></section></div>}

      {saveOpen && <div className="modal-backdrop" role="presentation"><section className="save-modal" role="dialog" aria-modal="true" aria-label="存档管理"><button className="modal-close" onClick={() => setSaveOpen(false)} aria-label="关闭">×</button><p className="eyebrow">存档管理</p><h2>道果留痕</h2><p>游戏会自动保存在当前浏览器；也可复制道果码，在其他设备恢复仙途。</p><button className="primary-button" onClick={doExport}>生成并复制道果码</button><textarea value={saveCode} onChange={(event) => setSaveCode(event.target.value)} placeholder="道果码将显示在此，或在此粘贴以导入" rows={5}/><button className="text-button import-button" onClick={() => { if (onImport(saveCode.trim())) { setSaveOpen(false); setSaveCode('') } }}>导入道果码 →</button></section></div>}
    </main>
  )
}
