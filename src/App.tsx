import { useEffect, useState } from 'react'
import { CharacterCreation } from './components/CharacterCreation'
import { GameDashboard } from './components/GameDashboard'
import { createCharacter, type CharacterCreationInput } from './game/characterCreation'
import { clearGame, exportDaoGuo, importDaoGuo, loadGame, saveGame } from './game/persistence'
import { initializePlayer, resolveMonth } from './game/turn'
import type { DecisionOption, MonthSettlement, PlayerCharacter } from './game/types'
import './App.css'

function App() {
  const [player, setPlayer] = useState<PlayerCharacter | null>(() => loadGame())
  const [settlement, setSettlement] = useState<MonthSettlement | null>(null)

  useEffect(() => {
    if (player) saveGame(player)
  }, [player])

  const create = (input: CharacterCreationInput) => {
    const next = initializePlayer(createCharacter(input))
    setSettlement(null)
    setPlayer(next)
  }

  const act = (option: DecisionOption) => {
    if (!player) return
    const next = resolveMonth(player, option)
    setPlayer(next.player)
    setSettlement(next.settlement)
  }

  const reset = () => {
    if (window.confirm('确定要放下当前仙途，重新开始吗？本地存档将被清除。')) {
      clearGame()
      setSettlement(null)
      setPlayer(null)
    }
  }

  const restore = (code: string) => {
    const imported = importDaoGuo(code)
    if (!imported) {
      window.alert('这不是有效的道果码。')
      return false
    }
    setSettlement(null)
    setPlayer(initializePlayer(imported))
    return true
  }

  if (!player) return <CharacterCreation onCreate={create} />
  return <GameDashboard player={player} settlement={settlement} onAction={act} onDismissSettlement={() => setSettlement(null)} onReset={reset} onExport={() => exportDaoGuo(player)} onImport={restore} />
}

export default App
