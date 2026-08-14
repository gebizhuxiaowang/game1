import { useMemo, useState } from 'react'
import { expNeededForLevel, getRealmDescriptor } from '../game/power'
import { ACTIVITIES, maxUnfinishedFates, type DayActivity, type EventApproach, type GameSessionV2, type TimeSpeed } from '../game/v2'

interface Props {
  session: GameSessionV2
  onOpenModeHub: () => void
  onSpeed: (speed: TimeSpeed) => void
  onResume: () => void
  onAddSchedule: (activity: DayActivity, days: number) => void
  onRemoveSchedule: (id: string) => void
  onEventChoice: (choice: EventApproach) => void
  onEnterExpedition: (fateId: string) => void
  onAbandonFate: (fateId: string) => void
  onExpeditionChoice: (choice: EventApproach) => void
  onWithdrawExpedition: () => void
  onUsePill: () => void
  onRollback: () => void
  onReincarnate: () => void
  onDismissOffline: () => void
  onToggleOpportunity: () => void
  onReset: () => void
  onExport: () => string
  onImport: (code: string) => boolean
}

const speedOptions: TimeSpeed[] = [0, 1, 2, 4]
const scheduleDays = [3, 7, 14, 30]

function dateFor(session: GameSessionV2) {
  const year = Math.floor((session.day - 1) / 360) + 1
  const month = Math.floor(((session.day - 1) % 360) / 30) + 1
  const day = ((session.day - 1) % 30) + 1
  return `天玄历 ${year} 年 ${month} 月 ${day} 日`
}

export function V2Dashboard({ session, onOpenModeHub, onSpeed, onResume, onAddSchedule, onRemoveSchedule, onEventChoice, onEnterExpedition, onAbandonFate, onExpeditionChoice, onWithdrawExpedition, onUsePill, onRollback, onReincarnate, onDismissOffline, onToggleOpportunity, onReset, onExport, onImport }: Props) {
  const [tab, setTab] = useState<'schedule' | 'records' | 'settings'>('records')
  const [activity, setActivity] = useState<DayActivity>('cultivate')
  const [days, setDays] = useState(7)
  const [saveOpen, setSaveOpen] = useState(false)
  const [code, setCode] = useState('')
  const player = session.player
  const realm = getRealmDescriptor(player.realmLevel)
  const expNeed = expNeededForLevel(player.realmLevel)
  const expProgress = Math.min(100, Math.round((player.currentExp / expNeed) * 100))
  const currentSchedule = session.schedule[0]
  const availableFates = session.unfinishedFates.filter((fate) => fate.status === 'available')
  const eventRisk = useMemo(() => session.pendingEvent ? (session.pendingEvent.tier === '命运' ? '九死一生' : session.pendingEvent.tier === '风险' ? '凶险' : '可一试') : null, [session.pendingEvent])
  const expedition = session.activeExpedition
  const expeditionNode = expedition?.nodes[expedition.currentNodeIndex]

  const exportCode = async () => {
    const nextCode = onExport()
    setCode(nextCode)
    try { await navigator.clipboard.writeText(nextCode) } catch { /* allow manual copy */ }
  }

  return <main className="v2-shell">
    <header className="v2-header">
      <div><p className="eyebrow">实时修仙 · V2.1 因果流转</p><h1>{player.name}<span> · {dateFor(session)}</span></h1></div>
      <div className="header-actions"><button className="text-button" onClick={onOpenModeHub}>玩法入口</button><button className="text-button" onClick={() => setSaveOpen(true)}>道果</button><button className="text-button danger" onClick={onReset}>重开</button></div>
    </header>

    <section className="time-console" aria-label="时间控制">
      <div className="time-state"><span className={session.paused ? 'time-orb paused' : 'time-orb'}>{session.paused ? 'Ⅱ' : '◉'}</span><div><small>天玄时间</small><strong>{session.activeExpedition ? '秘境探行' : session.paused ? session.pendingEvent ? '因果待决' : session.death ? '生死临界' : '时光静止' : '光阴流转'}</strong></div></div>
      <div className="speed-controls">{speedOptions.map((speed) => <button key={speed} className={session.speed === speed ? 'active' : ''} onClick={() => onSpeed(speed)}>{speed === 0 ? '暂停' : `${speed}×`}</button>)}</div>
      {session.paused && !session.pendingEvent && !session.death && !session.activeExpedition && <button className="resume-button" onClick={onResume}>继续流转 →</button>}
    </section>

    <section className="v2-overview">
      <article className="live-cultivation"><div className="live-cultivation-head"><div><p className="eyebrow">修为 · {realm.rating}</p><h2>{realm.stageName}<b> Lv.{player.realmLevel}</b></h2></div><strong>战力 {player.power}</strong></div><div className="progress-track"><i style={{ width: `${expProgress}%` }} /></div><div className="progress-label"><span>修为 {player.currentExp} / {expNeed}</span><span>{player.gongfas[0]?.name}</span></div></article>
      <article className="resource-card"><small>洞府</small><strong>{player.dwelling.name}</strong><small>灵石</small><strong className="jade">◈ {player.currency.low}</strong><small>疗伤丹</small><strong>{session.resources.pills} 枚</strong></article>
      <article className={`injury-card injury-${session.resources.injury}`}><small>当前伤势</small><strong>{session.resources.injury}</strong><span>{session.resources.injury === '无恙' ? '气机平稳' : `尚需调养约 ${session.resources.injuryDays} 日`}</span>{session.resources.injury !== '无恙' && <button onClick={onUsePill} disabled={session.resources.pills === 0}>服丹疗伤</button>}</article>
    </section>

    <section className="attribute-rail">{([['悟', player.daoJi.wuxing], ['心', player.daoJi.daoxin], ['根', player.daoJi.gengu], ['运', player.daoJi.qiyun], ['血', player.daoJi.xuemai]] as const).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}<div className="dao-yun"><small>道韵</small><strong>{player.daoYun.name} Lv.{player.daoYun.level}</strong></div><div className="lifespan"><small>骨龄 / 寿元</small><strong>{player.age} / {player.lifespanMax}</strong></div></section>

    <nav className="game-tabs v2-tabs"><button className={tab === 'records' ? 'active' : ''} onClick={() => setTab('records')}>仙途纪要</button><button className={tab === 'schedule' ? 'active' : ''} onClick={() => setTab('schedule')}>日程天机</button><button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>自动策略</button></nav>

    {tab === 'records' && <section className="v2-panel records-panel">
      <div className="panel-intro"><div><p className="eyebrow">世界流转</p><h2>仙途纪要</h2></div><span>最近一百条因果</span></div>
      <section className="fate-board"><div className="fate-board-head"><div><p className="eyebrow">未竟因果</p><h3>{availableFates.length} / {maxUnfinishedFates(player)} 条可追逐机缘</h3></div><span>错过后，世界仍会继续</span></div>{availableFates.length > 0 ? <div className="fate-list">{availableFates.map((fate) => <article className={fate.mode === 'fate' ? 'fate-card fateful' : 'fate-card'} key={fate.id}><div><p>{fate.mode === 'fate' ? '天命 / 封闭秘境' : '机缘 / 可撤离遗址'}</p><h3>{fate.title}</h3><small>{fate.description}</small></div><div className="fate-meta"><strong>余 {Math.max(0, fate.expiresOnDay - session.day)} 日</strong><span>威胁 {fate.threat} · 收益 ◈ {fate.reward}</span></div><div className="fate-actions"><button className="primary-button" onClick={() => onEnterExpedition(fate.id)}>踏入秘境</button><button className="text-button" onClick={() => onAbandonFate(fate.id)}>放任发展</button></div></article>)}</div> : <p className="empty-note">尚无未竟因果。安排游历或采集，留意纪要中出现的遗址、异象与传闻。</p>}</section>
      <ol className="log-list">{session.logs.map((log, index) => <li key={`${log}-${index}`}>{log}</li>)}</ol>
    </section>}

    {tab === 'schedule' && <section className="v2-panel schedule-panel"><div className="panel-intro"><div><p className="eyebrow">未来日程</p><h2>{currentSchedule ? `${ACTIVITIES[currentSchedule.activity].icon} 正在${ACTIVITIES[currentSchedule.activity].name}` : '暂无安排，默认闭关吐纳'}</h2></div><span>{currentSchedule ? `剩余 ${currentSchedule.days} 日` : '可添加新的行动块'}</span></div><div className="schedule-queue">{session.schedule.length > 0 ? session.schedule.map((entry, index) => <article key={entry.id} className={index === 0 ? 'schedule-entry current' : 'schedule-entry'}><span>{ACTIVITIES[entry.activity].icon}</span><div><strong>{ACTIVITIES[entry.activity].name}</strong><small>{ACTIVITIES[entry.activity].description}</small></div><em>{entry.days} 日</em><button onClick={() => onRemoveSchedule(entry.id)} aria-label="移除日程">×</button></article>) : <p className="empty-note">日程已执行完毕，将自动回归闭关吐纳。</p>}</div><div className="schedule-builder"><div className="activity-picker">{(Object.keys(ACTIVITIES) as DayActivity[]).map((id) => <button key={id} className={activity === id ? 'selected' : ''} onClick={() => setActivity(id)}><span>{ACTIVITIES[id].icon}</span>{ACTIVITIES[id].name}</button>)}</div><div className="duration-picker">{scheduleDays.map((value) => <button key={value} className={days === value ? 'selected' : ''} onClick={() => setDays(value)}>{value} 日</button>)}<button className="primary-button" onClick={() => onAddSchedule(activity, days)}>加入日程</button></div></div><p className="schedule-tip">重伤或濒死时，危险日程会自动改为洞府养伤；但倒计时因果与世界机缘不会为你停步。</p></section>}

    {tab === 'settings' && <section className="v2-panel"><div className="panel-intro"><div><p className="eyebrow">自动策略</p><h2>事件暂停规则</h2></div><span>风险与命运事件始终暂停</span></div><label className="policy-row"><div><strong>机会事件暂停</strong><small>关闭后，机会事件会优先采取谨慎侦察并自动写入纪要。</small></div><input type="checkbox" checked={session.autoPolicy.pauseOpportunity} onChange={onToggleOpportunity} /></label><article className="policy-info"><strong>当前保护规则</strong><p>重伤与濒死会强制养伤；离线最多结算 30 个安全游戏日。已有的倒计时因果仍会在离线期间发生世界后果，但不会替你进入秘境。</p></article></section>}

    {session.pendingEvent && <div className="modal-backdrop"><section className="event-modal" role="dialog" aria-modal="true" aria-label="遭遇事件"><p className="eyebrow">{session.pendingEvent.tier}事件 · 时间已暂停</p><div className="event-title"><h2>{session.pendingEvent.title}</h2><span>{eventRisk}</span></div><p>{session.pendingEvent.description}</p><div className="event-stats"><span>威胁 {session.pendingEvent.threat}</span><span>可能收益 ◈ {session.pendingEvent.reward}</span><span>伤势：{session.resources.injury}</span></div><div className="event-choices">{session.pendingEvent.choices.map((choice) => <button key={choice.id} className={choice.risky ? 'risky' : ''} onClick={() => { onEventChoice(choice.id); setTab('records') }}><strong>{choice.label}</strong><span>{choice.description}</span>{choice.risky && <em>高风险</em>}<b>→</b></button>)}</div></section></div>}

    {expedition && expeditionNode && <div className="modal-backdrop"><section className="event-modal expedition-modal" role="dialog" aria-modal="true" aria-label="秘境探索"><p className="eyebrow">{expedition.sealed ? '天命秘境 · 禁制已封' : '普通秘境 · 可随时撤离'} · 节点 {expedition.currentNodeIndex + 1}/{expedition.nodes.length}</p><div className="event-title"><h2>{expeditionNode.title}</h2><span>{expedition.sealed ? '不可回头' : '见好可收'}</span></div><p>{expeditionNode.description}</p><div className="expedition-path">{expedition.nodes.map((node, index) => <span key={node.id} className={index < expedition.currentNodeIndex ? 'done' : index === expedition.currentNodeIndex ? 'active' : ''}>{index + 1}</span>)}</div><div className="event-stats"><span>节点威胁 {expeditionNode.threat}</span><span>当前战利品 ◈ {expedition.spoils}</span><span>伤势：{session.resources.injury}</span></div><div className="event-choices">{expeditionNode.choices.map((choice) => <button key={choice.id} className={choice.risky ? 'risky' : ''} onClick={() => { onExpeditionChoice(choice.id); setTab('records') }}><strong>{choice.label}</strong><span>{choice.description}</span>{choice.risky && <em>高风险</em>}<b>→</b></button>)}</div>{!expedition.sealed && <button className="withdraw-button" onClick={() => { onWithdrawExpedition(); setTab('records') }}>带走七成战利品，撤离秘境</button>}</section></div>}

    {session.death && <div className="modal-backdrop"><section className="event-modal death-modal" role="dialog" aria-modal="true" aria-label="生死抉择"><p className="eyebrow">生死临界 · 时间已静止</p><h2>{session.death.kind === 'rollback' ? '道果尚可回溯' : '此世寿尽，轮回将启'}</h2><p>{session.death.cause}</p>{session.death.kind === 'rollback' ? <><p className="death-note">回溯至最近道果检查点，损失 20% 下品灵石，并留下一道伤势。已发生的因果不会被无偿改写。</p><button className="primary-button" onClick={onRollback}>付出代价，回溯道果</button></> : <><p className="death-note">轮回会保留部分灵石、道基、核心功法和道韵残忆；此世日程与伤势将消散。</p><button className="primary-button" onClick={onReincarnate}>携一缕残忆，轮回重修</button></>}</section></div>}

    {session.offlineReport && <div className="modal-backdrop"><section className="event-modal offline-modal" role="dialog" aria-modal="true" aria-label="归来结算"><p className="eyebrow">归来结算</p><h2>闭关不知岁月</h2><p>离线期间仅执行安全日程，未替你处理任何危险因果。</p><div className="offline-summary"><div><small>安稳推进</small><strong>{session.offlineReport.days} 日</strong></div><div><small>修为所得</small><strong>+{session.offlineReport.cultivation}</strong></div><div><small>灵石所得</small><strong>+{session.offlineReport.stones}</strong></div></div><button className="primary-button" onClick={onDismissOffline}>重返天玄大陆</button></section></div>}

    {saveOpen && <div className="modal-backdrop"><section className="save-modal" role="dialog" aria-modal="true" aria-label="V2 道果管理"><button className="modal-close" onClick={() => setSaveOpen(false)} aria-label="关闭">×</button><p className="eyebrow">V2 道果管理</p><h2>留存此世因果</h2><p>会话会自动保存在当前浏览器；复制道果码可跨浏览器恢复日程、伤势、秘境布局和道果检查点。</p><button className="primary-button" onClick={exportCode}>生成并复制道果码</button><textarea value={code} onChange={(event) => setCode(event.target.value)} placeholder="道果码将显示在此，或在此粘贴以导入" rows={5}/><button className="text-button import-button" onClick={() => { if (onImport(code.trim())) { setCode(''); setSaveOpen(false) } }}>导入 V2 道果码 →</button></section></div>}
  </main>
}
