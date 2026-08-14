interface Props {
  hasLiveSession: boolean
  hasRestartRun: boolean
  onOpenLive: () => void
  onOpenRestart: () => void
}

export function ModeHub({ hasLiveSession, hasRestartRun, onOpenLive, onOpenRestart }: Props) {
  return <main className="mode-hub-shell">
    <section className="mode-hub-hero"><p className="eyebrow">天玄大陆 · 双生道途</p><h1>修仙模拟器</h1><p>一条路在真实光阴中延展；另一条路，让你在一生里重写命数。</p></section>
    <section className="mode-grid">
      <article className="mode-card live-mode"><p className="eyebrow">实时修仙 · V2.1</p><h2>天玄因果录</h2><p>安排日程、追逐未竟因果、踏入多节点秘境。时间持续流转，你的仙途没有标准答案。</p><ul><li>实时日程与 1× / 2× / 4× 光阴</li><li>倒计时机缘、普通撤离与封闭天命秘境</li><li>独立 DAO2 道果与检查点</li></ul><button className="primary-button" onClick={onOpenLive}>{hasLiveSession ? '继续实时仙途 →' : '创建实时角色 →'}</button></article>
      <article className="mode-card restart-mode"><p className="eyebrow">快速人生 · RESTART1</p><h2>修仙人生重启</h2><p>从九个命格中选三条，以十五点道基开局。在一生的纪要中面对关键抉择，收集属于你的结局。</p><ul><li>分层随机天赋与轻度取舍</li><li>年龄快速推进，仅关键事件暂停</li><li>独立人生统计、结局图鉴与档案</li></ul><button className="primary-button" onClick={onOpenRestart}>{hasRestartRun ? '继续此世人生 →' : '开启新的一世 →'}</button></article>
    </section>
    <p className="mode-hub-note">两个模式使用完全独立的角色和存档。切换玩法不会暂停、删除或覆盖另一条仙途。</p>
  </main>
}
