import { useEffect, useState } from 'react'
import { CharacterCreation } from './components/CharacterCreation'
import { ModeHub } from './components/ModeHub'
import { RestartCreation } from './components/RestartCreation'
import { RestartDashboard } from './components/RestartDashboard'
import { V2Dashboard } from './components/V2Dashboard'
import { createCharacter, type CharacterCreationInput } from './game/characterCreation'
import { clearGame, importDaoGuo, loadGame } from './game/persistence'
import { clearRestartRun, exportRestartArchive, importRestartArchive, loadRestartProfile, loadRestartRun, saveRestartProfile, saveRestartRun } from './game/persistenceRestart'
import { clearV2Game, exportV2DaoGuo, importV2DaoGuo, loadV2Game, saveV2Game } from './game/persistenceV2'
import { advanceRestartRun, recordRestartResult, resolveRestartChoice } from './game/restart/engine'
import type { RestartProfile, RestartRun } from './game/restart/types'
import { abandonFate, addSchedule, advanceByWallClock, advanceGameDays, applyHealingPill, createGameSessionV2, dismissOfflineReport, enterExpedition, migratePlayerToV2, reincarnateSession, removeSchedule, resolveExpeditionNode, resolveLiveEvent, resumeSession, rollbackAfterDeath, setAutoPolicy, setTimeSpeed, withdrawFromExpedition, type DayActivity, type EventApproach, type GameSessionV2, type TimeSpeed } from './game/v2'
import './App.css'

type AppMode = 'hub' | 'live' | 'restart'

function loadInitialSession(): GameSessionV2 | null {
  const v2 = loadV2Game()
  if (v2) {
    if (v2.paused || v2.pendingEvent || v2.death || v2.activeExpedition) return v2
    const elapsedDays = Math.floor((Date.now() - v2.lastSyncedAt) / 1000)
    return elapsedDays > 0 ? advanceGameDays(v2, elapsedDays, true) : v2
  }
  const v1 = loadGame()
  return v1 ? migratePlayerToV2(v1) : null
}

function App() {
  const [session, setSession] = useState<GameSessionV2 | null>(loadInitialSession)
  const [restartRun, setRestartRun] = useState<RestartRun | null>(loadRestartRun)
  const [restartProfile, setRestartProfile] = useState<RestartProfile>(loadRestartProfile)
  const [mode, setMode] = useState<AppMode>(() => session ? 'live' : 'hub')

  useEffect(() => {
    if (mode === 'live' && session) saveV2Game(session)
  }, [mode, session])

  useEffect(() => {
    if (mode !== 'live') return undefined
    const timer = window.setInterval(() => setSession((current) => current ? advanceByWallClock(current) : current), 250)
    const syncVisibility = () => {
      if (document.visibilityState === 'visible') setSession((current) => current ? advanceByWallClock(current) : current)
    }
    document.addEventListener('visibilitychange', syncVisibility)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', syncVisibility) }
  }, [mode])

  useEffect(() => { saveRestartRun(restartRun) }, [restartRun])
  useEffect(() => { saveRestartProfile(restartProfile) }, [restartProfile])

  const create = (input: CharacterCreationInput) => setSession(createGameSessionV2(createCharacter(input)))
  const reset = () => {
    if (window.confirm('确定要放下当前仙途，清除 V2 道果后重开吗？人生重启的档案不会受影响。')) {
      clearV2Game()
      clearGame()
      setSession(null)
      setMode('hub')
    }
  }

  const importSession = (code: string) => {
    const v2 = importV2DaoGuo(code)
    if (v2) { setSession(v2); return true }
    const v1 = importDaoGuo(code)
    if (v1) { setSession(migratePlayerToV2(v1)); return true }
    window.alert('这不是有效的 V1 或 V2 道果码。')
    return false
  }

  const resolveRestart = (choiceId: string) => {
    if (!restartRun) return
    const next = resolveRestartChoice(restartRun, choiceId)
    setRestartRun(next)
    if (restartRun.status === 'active' && next.status === 'finished') setRestartProfile((current) => recordRestartResult(current, next))
  }

  const importRestart = (code: string) => {
    const archive = importRestartArchive(code)
    if (!archive) {
      window.alert('这不是有效的 RESTART1 人生档案。')
      return false
    }
    setRestartRun(archive.run)
    setRestartProfile(archive.profile)
    setMode('restart')
    return true
  }

  if (mode === 'hub') return <ModeHub hasLiveSession={Boolean(session)} hasRestartRun={Boolean(restartRun)} onOpenLive={() => setMode('live')} onOpenRestart={() => setMode('restart')} />

  if (mode === 'restart') {
    if (!restartRun) return <RestartCreation onBack={() => setMode('hub')} onStart={(run) => setRestartRun(run)} />
    return <RestartDashboard
      run={restartRun}
      profile={restartProfile}
      onAdvance={() => setRestartRun((current) => current ? advanceRestartRun(current) : current)}
      onChoice={resolveRestart}
      onNewLife={() => { clearRestartRun(); setRestartRun(null) }}
      onBack={() => setMode('hub')}
      onExport={() => exportRestartArchive(restartRun, restartProfile)}
      onImport={importRestart}
    />
  }

  if (!session) return <div className="live-creation-wrap"><button className="text-button mode-return" onClick={() => setMode('hub')}>← 返回模式入口</button><CharacterCreation onCreate={create} /></div>
  return <V2Dashboard
    session={session}
    onOpenModeHub={() => setMode('hub')}
    onSpeed={(speed: TimeSpeed) => setSession((current) => current ? setTimeSpeed(current, speed) : current)}
    onResume={() => setSession((current) => current ? resumeSession(current) : current)}
    onAddSchedule={(activity: DayActivity, days: number) => setSession((current) => current ? addSchedule(current, activity, days) : current)}
    onRemoveSchedule={(id: string) => setSession((current) => current ? removeSchedule(current, id) : current)}
    onEventChoice={(choice: EventApproach) => setSession((current) => current ? resolveLiveEvent(current, choice) : current)}
    onEnterExpedition={(fateId) => setSession((current) => current ? enterExpedition(current, fateId) : current)}
    onAbandonFate={(fateId) => setSession((current) => current ? abandonFate(current, fateId) : current)}
    onExpeditionChoice={(choice) => setSession((current) => current ? resolveExpeditionNode(current, choice) : current)}
    onWithdrawExpedition={() => setSession((current) => current ? withdrawFromExpedition(current) : current)}
    onUsePill={() => setSession((current) => current ? applyHealingPill(current) : current)}
    onRollback={() => setSession((current) => current ? rollbackAfterDeath(current) : current)}
    onReincarnate={() => setSession((current) => current ? reincarnateSession(current) : current)}
    onDismissOffline={() => setSession((current) => current ? dismissOfflineReport(current) : current)}
    onToggleOpportunity={() => setSession((current) => current ? setAutoPolicy(current, { pauseOpportunity: !current.autoPolicy.pauseOpportunity }) : current)}
    onReset={reset}
    onExport={() => exportV2DaoGuo(session)}
    onImport={importSession}
  />
}

export default App
