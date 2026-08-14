import { useMemo, useState } from 'react'
import { RESTART_ENDING_LIST, restartAttributeLabel, restartRealmLabel } from '../game/restart/engine'
import type { RestartProfile, RestartRun } from '../game/restart/types'

interface Props {
  run: RestartRun
  profile: RestartProfile
  onAdvance: () => void
  onChoice: (choiceId: string) => void
  onNewLife: () => void
  onBack: () => void
  onExport: () => string
  onImport: (code: string) => boolean
}

export function RestartDashboard({ run, profile, onAdvance, onChoice, onNewLife, onBack, onExport, onImport }: Props) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [code, setCode] = useState('')
  const realm = restartRealmLabel(run.realmLevel)
  const unlocked = useMemo(() => new Set(profile.unlockedEndingIds), [profile.unlockedEndingIds])
  const exportArchive = async () => {
    const nextCode = onExport()
    setCode(nextCode)
    try { await navigator.clipboard.writeText(nextCode) } catch { /* manual copy remains available */ }
  }

  return <main className="restart-shell restart-life-shell">
    <header className="restart-header"><div><p className="eyebrow">修仙人生重启 · {run.status === 'finished' ? '此世已结' : '岁月流转'}</p><h1>{run.name}<span> · {run.age} 岁</span></h1></div><div className="header-actions"><button className="text-button" onClick={() => setArchiveOpen(true)}>人生档案</button><button className="text-button" onClick={onBack}>模式入口</button></div></header>
    <section className="restart-status"><article><small>当前境界</small><strong>{realm}</strong><span>修为 {run.cultivation}</span></article><article><small>寿元 / 健康</small><strong>{run.age} / {run.lifespan}</strong><span className={run.health < 30 ? 'danger-text' : ''}>气血 {run.health}/100</span></article><article><small>灵根 / 灵石</small><strong>{run.spiritRoot}</strong><span className="jade">◈ {run.wealth}</span></article><article><small>人生进度</small><strong>{run.eventIndex} / 8 抉择</strong><span>关键抉择 {run.stats.keyDecisions} 次</span></article></section>
    <section className="restart-attributes">{(['wuxing', 'daoxin', 'gengu', 'qiyun'] as const).map((key) => <div key={key}><small>{restartAttributeLabel(key)}</small><strong>{run.attributes[key]}</strong></div>)}<div className="restart-talent-summary"><small>此生命格</small><strong>{run.talents.map((talent) => talent.name).join(' · ')}</strong></div></section>
    <section className="restart-timeline"><div className="restart-section-head"><div><p className="eyebrow">人生纪要</p><h2>{run.status === 'finished' ? '这一世的答案' : run.pendingEvent ? '命数停在此刻' : '岁月正在等待下一笔'}</h2></div><span>{run.status === 'finished' ? `最高 ${restartRealmLabel(run.stats.highestRealmLevel)}` : '普通经历自动结算，关键事件暂停'}</span></div>{run.status === 'active' && !run.pendingEvent && <button className="restart-advance" onClick={onAdvance}>流转岁月，前往下一关键命数 <b>→</b></button>}<ol className="restart-log-list">{run.logs.map((log) => <li key={log.id} className={`log-${log.kind}`}><span>{log.range ?? `${log.age} 岁`}</span><p>{log.text}</p></li>)}</ol></section>
    {run.status === 'finished' && run.ending && <section className="restart-result"><p className="eyebrow">此世结局 · {run.ending.rarity}</p><h2>{run.ending.title}</h2><p>{run.ending.description}</p><div className="restart-result-stats"><div><small>享年</small><strong>{run.age}</strong></div><div><small>最高境界</small><strong>{restartRealmLabel(run.stats.highestRealmLevel)}</strong></div><div><small>所得灵石</small><strong>◈ {run.stats.wealthEarned}</strong></div><div><small>抉择成功</small><strong>{run.stats.successChoices} / {run.stats.keyDecisions}</strong></div></div><button className="primary-button" onClick={onNewLife}>再启一世 →</button></section>}
    <section className="restart-codex"><div className="restart-section-head"><div><p className="eyebrow">结局图鉴</p><h2>已收录 {unlocked.size} / {RESTART_ENDING_LIST.length}</h2></div><span>累计 {profile.totalRuns} 世 · 最长寿元 {profile.longestLife}</span></div><div className="ending-grid">{RESTART_ENDING_LIST.map((ending) => <article key={ending.id} className={unlocked.has(ending.id) ? 'unlocked' : ''}><small>{ending.rarity}</small><strong>{unlocked.has(ending.id) ? ending.title : '未窥天机'}</strong><p>{unlocked.has(ending.id) ? ending.description : '在另一种命数与抉择中解锁。'}</p></article>)}</div></section>
    {run.pendingEvent && <div className="modal-backdrop"><section className="event-modal restart-event-modal" role="dialog" aria-modal="true" aria-label="人生关键事件"><p className="eyebrow">{run.pendingEvent.phase} · {run.age} 岁</p><h2>{run.pendingEvent.title}</h2><p>{run.pendingEvent.description}</p><div className="event-stats"><span>主判定：道基与命格</span><span>当前 {run.pendingEvent.choices.map((choice) => choice.stat === 'none' ? '稳妥' : `${restartAttributeLabel(choice.stat)} ${run.attributes[choice.stat]}`).join(' · ')}</span></div><div className="event-choices">{run.pendingEvent.choices.map((choice) => <button key={choice.id} onClick={() => onChoice(choice.id)}><strong>{choice.label}</strong><span>{choice.description}</span><em>{choice.stat === 'none' ? '稳妥' : `偏向${restartAttributeLabel(choice.stat)}`}</em><b>→</b></button>)}</div></section></div>}
    {archiveOpen && <div className="modal-backdrop"><section className="save-modal" role="dialog" aria-modal="true" aria-label="人生档案"><button className="modal-close" onClick={() => setArchiveOpen(false)} aria-label="关闭">×</button><p className="eyebrow">RESTART1 人生档案</p><h2>留存此生命数</h2><p>人生运行态与结局图鉴使用独立档案，不会影响 DAO1 或 DAO2 道果。</p><button className="primary-button" onClick={exportArchive}>生成并复制人生档案</button><textarea value={code} rows={5} onChange={(event) => setCode(event.target.value)} placeholder="人生档案将显示在此，或粘贴 RESTART1. 档案以恢复"/><button className="text-button import-button" onClick={() => { if (onImport(code.trim())) { setCode(''); setArchiveOpen(false) } }}>导入人生档案 →</button></section></div>}
  </main>
}
