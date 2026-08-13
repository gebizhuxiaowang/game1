import { useState } from 'react'
import { AGE_BAND_INFO, RACE_BONUS, type CharacterCreationInput } from '../game/characterCreation'
import { INNATE_DAOYUN_LIST, ORIGIN_PACKAGES, REGIONS } from '../game/data'
import type { AgeBand, Gender, Race, RegionId } from '../game/types'

interface Props {
  onCreate: (input: CharacterCreationInput) => void
}

const races: Race[] = ['人族', '妖族', '灵族']
const ages: AgeBand[] = ['少年/青年', '壮年', '中老年', '老年']

export function CharacterCreation({ onCreate }: Props) {
  const [name, setName] = useState('')
  const [gender, setGender] = useState<Gender>('男')
  const [race, setRace] = useState<Race>('人族')
  const [ageBand, setAgeBand] = useState<AgeBand>('少年/青年')
  const [region, setRegion] = useState<RegionId>('中州圣城')
  const [originPackageId, setOriginPackageId] = useState(1)
  const [daoYunId, setDaoYunId] = useState(1)

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate({ name: name.trim() || '无名道人', gender, race, ageBand, region, originPackageId, daoYunId })
  }

  return (
    <main className="creation-shell">
      <section className="creation-hero">
        <p className="eyebrow">天玄大陆 · 月令修行录</p>
        <h1>修仙模拟器</h1>
        <p>万族并立，天机流转。请落下你的第一笔因果。</p>
      </section>
      <form className="creation-form" onSubmit={submit}>
        <section className="creation-section">
          <div className="section-heading"><span>壹</span><div><h2>名姓与来处</h2><p>道号可待仙途有成后再定。</p></div></div>
          <div className="field-row">
            <label className="name-field">姓名<input value={name} maxLength={12} onChange={(event) => setName(event.target.value)} placeholder="无名道人" /></label>
            <div className="choice-inline" role="group" aria-label="性别">
              {(['男', '女'] as Gender[]).map((item) => <button type="button" key={item} className={gender === item ? 'selected' : ''} onClick={() => setGender(item)}>{item}</button>)}
            </div>
          </div>
        </section>

        <section className="creation-section">
          <div className="section-heading"><span>贰</span><div><h2>种族与骨龄</h2><p>每一种生灵，都有不同的问道路途。</p></div></div>
          <div className="choice-grid three">
            {races.map((item) => <button type="button" key={item} className={race === item ? 'selected choice-card' : 'choice-card'} onClick={() => setRace(item)}><strong>{item}</strong><small>{RACE_BONUS[item]}</small></button>)}
          </div>
          <div className="choice-grid two age-grid">
            {ages.map((item) => <button type="button" key={item} className={ageBand === item ? 'selected choice-card' : 'choice-card'} onClick={() => setAgeBand(item)}><strong>{item}</strong><small>{AGE_BAND_INFO[item]}</small></button>)}
          </div>
        </section>

        <section className="creation-section">
          <div className="section-heading"><span>叁</span><div><h2>出生修真域</h2><p>地域会影响你最初听见的风声。</p></div></div>
          <div className="choice-grid two">
            {REGIONS.map((item) => <button type="button" key={item.id} className={region === item.id ? 'selected choice-card region-card' : 'choice-card region-card'} onClick={() => setRegion(item.id)}><strong>{item.id}</strong><em>{item.bonus}</em><small>{item.feature}</small></button>)}
          </div>
        </section>

        <section className="creation-section">
          <div className="section-heading"><span>肆</span><div><h2>开局因果</h2><p>资产包同时决定你第一条天命主线。</p></div></div>
          <div className="package-list">
            {ORIGIN_PACKAGES.map((item) => <button type="button" key={item.id} className={originPackageId === item.id ? 'selected package-card' : 'package-card'} onClick={() => setOriginPackageId(item.id)}><span className="package-index">{String(item.id).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.assets}</small></span><em>天命：{item.destinyTitle}</em></button>)}
          </div>
        </section>

        <section className="creation-section">
          <div className="section-heading"><span>伍</span><div><h2>先天道韵</h2><p>选择一份与生俱来的感应。</p></div></div>
          <div className="choice-grid two">
            {INNATE_DAOYUN_LIST.map((item) => <button type="button" key={item.id} className={daoYunId === item.id ? 'selected choice-card dao-card' : 'choice-card dao-card'} onClick={() => setDaoYunId(item.id)}><strong>{item.name}</strong><small>{item.effect}</small></button>)}
          </div>
        </section>
        <button className="primary-button start-button" type="submit">踏入天玄大陆 <span>→</span></button>
      </form>
    </main>
  )
}
