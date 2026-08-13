import { useEffect, useState } from 'react'
import { CharacterCreation } from './components/CharacterCreation'
import { V2Dashboard } from './components/V2Dashboard'
import { createCharacter, type CharacterCreationInput } from './game/characterCreation'
import { clearGame, importDaoGuo, loadGame } from './game/persistence'
import { clearV2Game, exportV2DaoGuo, importV2DaoGuo, loadV2Game, saveV2Game } from './game/persistenceV2'
import { addSchedule, advanceByWallClock, advanceGameDays, applyHealingPill, createGameSessionV2, dismissOfflineReport, migratePlayerToV2, reincarnateSession, removeSchedule, resolveLiveEvent, resumeSession, rollbackAfterDeath, setAutoPolicy, setTimeSpeed, type DayActivity, type EventApproach, type GameSessionV2, type TimeSpeed } from './game/v2'
import './App.css'

function loadInitialSession(): GameSessionV2 | null {
  const v2 = loadV2Game()
  if (v2) {
    if (v2.paused || v2.pendingEvent || v2.death) return v2
    const elapsedDays = Math.floor((Date.now() - v2.lastSyncedAt) / 1000)
    return elapsedDays > 0 ? advanceGameDays(v2, elapsedDays, true) : v2
  }
  const v1 = loadGame()
  return v1 ? migratePlayerToV2(v1) : null
}

function App() {
  const [session, setSession] = useState<GameSessionV2 | null>(loadInitialSession)

  useEffect(() => {
    if (session) saveV2Game(session)
  }, [session])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSession((current) => current ? advanceByWallClock(current) : current)
    }, 250)
    const syncVisibility = () => {
      if (document.visibilityState === 'visible') setSession((current) => current ? advanceByWallClock(current) : current)
    }
    document.addEventListener('visibilitychange', syncVisibility)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', syncVisibility) }
  }, [])

  const create = (input: CharacterCreationInput) => setSession(createGameSessionV2(createCharacter(input)))
  const reset = () => {
    if (window.confirm('确定要放下当前仙途，清除 V2 道果后重开吗？')) {
      clearV2Game()
      clearGame()
      setSession(null)
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

  if (!session) return <CharacterCreation onCreate={create} />
  return <V2Dashboard
    session={session}
    onSpeed={(speed: TimeSpeed) => setSession((current) => current ? setTimeSpeed(current, speed) : current)}
    onResume={() => setSession((current) => current ? resumeSession(current) : current)}
    onAddSchedule={(activity: DayActivity, days: number) => setSession((current) => current ? addSchedule(current, activity, days) : current)}
    onRemoveSchedule={(id: string) => setSession((current) => current ? removeSchedule(current, id) : current)}
    onEventChoice={(choice: EventApproach) => setSession((current) => current ? resolveLiveEvent(current, choice) : current)}
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
