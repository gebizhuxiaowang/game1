// ============================================================
// 静态数据表 (依据设定文档第二、三、九章)
// ============================================================
import type {
  RegionDef,
  RegionId,
  OriginPackage,
  InnateDaoYun,
  RealmStage,
  SpiritRootGrade,
} from './types'

export const REGIONS: RegionDef[] = [
  { id: '中州圣城', bonus: '气运+1', feature: '宗门林立，信息最密集，竞争最激烈' },
  { id: '东荒妖域', bonus: '根骨+10%', feature: '妖族祖地，炼体功法众多' },
  { id: '南明离火域', bonus: '魅力+1', feature: '炼器圣地，火系天堂，地下黑市发达' },
  { id: '西极玄冰域', bonus: '悟性+5%', feature: '剑修圣地，阵法符箓传承悠久' },
  { id: '北冥瀚海', bonus: '商贾嗅觉+5%', feature: '散修天堂，坊市密布，海外仙岛众多' },
  { id: '岭南百越', bonus: '根骨+5%', feature: '奇虫异兽遍布，毒功驱兽发源地' },
  { id: '海外仙岛', bonus: '气运+5%', feature: '散修联盟总部，上古遗府常现' },
]

export const ORIGIN_PACKAGES: OriginPackage[] = [
  { id: 1, name: '天生道体', assets: '下品储物袋+凡器长剑+灵石十枚', startRealmLevel: 1, startSocial: '恩师1人(好感40~60)', destinyTitle: '圣体之路', destinyId: 'body' },
  { id: 2, name: '坊市学徒', assets: '小型储物袋+中品凡器+灵石五十枚', startRealmLevel: 1, startSocial: '坊市商贩数人(20~40)', destinyTitle: '财可通神', destinyId: 'wealth' },
  { id: 3, name: '没落血脉', assets: '家族偏院+下品法器+灵石三十枚', startRealmLevel: 1, startSocial: '族人若干(好感10~30)', destinyTitle: '血脉复兴', destinyId: 'bloodline' },
  { id: 4, name: '遗孤散修', assets: '残破洞府(临时)+下品法器+灵石十五枚', startRealmLevel: 11, startSocial: '散修旧识三五位(好感5~20)', destinyTitle: '逆境求生', destinyId: 'survivor' },
  { id: 5, name: '转世大能', assets: '凡人小屋+凡器短剑+灵石五枚', startRealmLevel: 1, startSocial: '无任何故交', destinyTitle: '再证大道', destinyId: 'reincarnation' },
  { id: 6, name: '佛道童子', assets: '随身经卷数册+青布僧袍/道袍+灵石八枚', startRealmLevel: 1, startSocial: '师门旧识数人(好感30~50)', destinyTitle: '红尘问道', destinyId: 'monk' },
  { id: 7, name: '炼丹世家', assets: '丹炉一尊+下品丹药十瓶+灵石八十两', startRealmLevel: 1, startSocial: '丹道同行数家(好感20~35)', destinyTitle: '丹道至尊', destinyId: 'alchemy' },
  { id: 8, name: '宗门杂役', assets: '宗门杂役房一间+旧法器+灵石十枚', startRealmLevel: 11, startSocial: '父亲旧识二三人(好感20~40)', destinyTitle: '宗门逆袭', destinyId: 'sect' },
  { id: 9, name: '铸剑山庄', assets: '铸造工坊一间+炼器炉一尊+灵石五十枚', startRealmLevel: 1, startSocial: '炼器同行三五家(好感10~25)', destinyTitle: '百兵之祖', destinyId: 'weapon' },
  { id: 10, name: '大器晚成', assets: '凡人小屋+基础功法残卷+灵石三枚', startRealmLevel: 1, startSocial: '同病相怜散修数人(好感15~30)', destinyTitle: '我命由我不由天', destinyId: 'selfmade' },
]

export const DESTINY_STAGES: Record<string, string[]> = {
  body: ['圣体觉醒', '圣体初劫', '不灭战体', '因果清算', '星空试炼', '飞升/留世'],
  wealth: ['第一桶金', '商会雏形', '垄断之路', '金钱与道义', '富可敌国', '散尽家财/永恒财神'],
  bloodline: ['族比扬名', '诅咒溯源', '苍梧古血觉醒', '复仇/和解', '重建苍梧圣地', '飞升寻祖/永世守护'],
  survivor: ['师父遗泽', '散修尊严', '逍遥体觉醒', '散修逆袭', '天下无派', '独自飞升/散修之祖'],
  reincarnation: ['魔功诱惑', '前世遗产', '轮回体觉醒', '斩断因果', '超越前世', '飞升了结/守护轮回'],
  monk: ['入世第一课', '身份抉择', '功德金身/道心通明', '立教传法', '大道之争', '飞升极乐/普度众生'],
  alchemy: ['父亲试炼', '丹盟挑战', '丹灵体觉醒', '丹道至尊', '九转金丹', '服丹飞升/留丹后人'],
  sect: ['黑玉之谜', '外门大比', '铁面判官/万世师表', '宗门政变', '道统之争', '飞升追秩序/万古宗师'],
  weapon: ['神火之秘', '家族存亡', '兵主之体觉醒', '神兵出世', '神兵择主', '带神兵飞升/镇族之宝'],
  selfmade: ['筑基丹骗局', '自创功法', '混沌体/五行体觉醒', '废材联盟', '大道至简', '废灵根飞升/废材圣地'],
}

export const INNATE_DAOYUN_LIST: Omit<InnateDaoYun, 'level' | 'exp'>[] = [
  { id: 1, name: '明察秋毫', effect: '识破幻术、探索秘境类判定+20%', levelUpWay: '主动探索、破解阵法、鉴定灵物' },
  { id: 2, name: '未卜先知', effect: '危机预警、机缘感应类判定+20%', levelUpWay: '经历险境、验证直觉' },
  { id: 3, name: '七窍玲珑', effect: '社交破冰、辨识谎言类判定+20%', levelUpWay: '深度交谈、化解心结' },
  { id: 4, name: '道音灌耳', effect: '论道说服、谈判交涉类判定+20%', levelUpWay: '公开讲道、收徒传法' },
  { id: 5, name: '过目不忘', effect: '快速学习、典籍引用类判定+20%', levelUpWay: '阅读典籍、抄录丹方' },
  { id: 6, name: '五行亲和', effect: '环境适应、抵抗属性压制类判定+20%', levelUpWay: '极端环境修炼' },
  { id: 7, name: '磐石之志', effect: '抗压修炼、抵抗心魔类判定+20%', levelUpWay: '闭关苦修、拒绝诱惑' },
  { id: 8, name: '天人感应', effect: '顿悟突破、机缘降临类判定+20%', levelUpWay: '静坐冥思、观察天地' },
  { id: 9, name: '雷厉风行', effect: '行动速度、任务执行类判定+20%', levelUpWay: '制定计划并执行、追踪目标' },
  { id: 10, name: '奇货可居', effect: '交易谈判、价值判断类判定+20%', levelUpWay: '实际交易、鉴定灵物' },
]

export const REALM_STAGES: RealmStage[] = [
  { name: '凡人境', minLevel: 1, maxLevel: 10, expPerLevel: 50, lifespan: 100 },
  { name: '炼气期', minLevel: 11, maxLevel: 20, expPerLevel: 150, lifespan: 150 },
  { name: '筑基期', minLevel: 21, maxLevel: 40, expPerLevel: 350, lifespan: 250 },
  { name: '金丹期', minLevel: 41, maxLevel: 60, expPerLevel: 650, lifespan: 500 },
  { name: '元婴期', minLevel: 61, maxLevel: 80, expPerLevel: 1000, lifespan: 1000 },
  { name: '化神期', minLevel: 81, maxLevel: 95, expPerLevel: 1800, lifespan: 3000 },
  { name: '渡劫/大乘', minLevel: 96, maxLevel: 100, expPerLevel: 3000, lifespan: 999999 },
]

export const REALM_RATING: Record<string, string> = {
  凡人境: '凡尘',
  炼气期: '初窥',
  筑基期: '登堂',
  金丹期: '入室',
  元婴期: '宗师',
  化神期: '尊者',
  '渡劫/大乘': '飞升',
}

export function getRealmStage(level: number): RealmStage {
  return REALM_STAGES.find((r) => level >= r.minLevel && level <= r.maxLevel) ?? REALM_STAGES[0]
}

export function getRealmLayer(level: number): number {
  const stage = getRealmStage(level)
  return level - stage.minLevel + 1
}

export const SPIRIT_ROOT_MODIFIER: Record<SpiritRootGrade, number> = {
  凡品: -0.2,
  中品: 0,
  上品: 0.2,
  极品: 0.5,
  异灵根: 0.4,
  废灵根: -0.5,
}

export const DAOJI_EXP_CURVE = [
  { min: 1, max: 20, perLevel: 80, name: '初窥门径' },
  { min: 21, max: 40, perLevel: 200, name: '登堂入室' },
  { min: 41, max: 60, perLevel: 400, name: '融会贯通' },
  { min: 61, max: 80, perLevel: 700, name: '开宗立派' },
  { min: 81, max: 95, perLevel: 1200, name: '超凡入圣' },
  { min: 96, max: 100, perLevel: 2000, name: '天人合一' },
]

export function daoJiExpNeeded(level: number): number {
  const band = DAOJI_EXP_CURVE.find((b) => level >= b.min && level <= b.max) ?? DAOJI_EXP_CURVE[0]
  return band.perLevel
}

export const GONGFA_GRADE_INFO: Record<string, { maxLevel: number; powerPerLevel: number }> = {
  凡品: { maxLevel: 30, powerPerLevel: 0.8 },
  灵品: { maxLevel: 50, powerPerLevel: 1.0 },
  地品: { maxLevel: 70, powerPerLevel: 1.2 },
  天品: { maxLevel: 90, powerPerLevel: 1.5 },
  仙品: { maxLevel: 100, powerPerLevel: 2.0 },
}

export const DWELLING_NAMES: Record<number, string> = {
  0: '凡人客栈',
  1: '散修洞府',
  2: '小型洞府',
  3: '中型洞府',
  4: '大型洞府',
  5: '福地',
  6: '洞天',
  7: '圣地道场',
  8: '小世界',
}

export const DWELLING_SPEED_BONUS: Record<number, number> = {
  0: 0, 1: 0.05, 2: 0.1, 3: 0.15, 4: 0.2, 5: 0.3, 6: 0.4, 7: 0.5, 8: 0.8,
}

export const EQUIPMENT_LEVEL_NAMES: Record<number, string> = {
  0: '凡器', 1: '下品法器', 2: '中品法器', 3: '上品法器', 4: '极品法器',
  5: '下品法宝', 6: '中品法宝', 7: '上品法宝', 8: '极品法宝', 9: '通天灵宝', 10: '先天至宝',
}

export const REGION_LIST: RegionId[] = REGIONS.map((r) => r.id)

export const FATE_ROLL_TABLE = [
  { label: '⚡天赐良机', weight: 8, modifier: 0.25, desc: '对手关键时刻真气逆行，露出致命破绽' },
  { label: '🌟鸿运当头', weight: 12, modifier: 0.15, desc: '脑海中闪过精妙破解之法，运势在你这边' },
  { label: '🍀小有机缘', weight: 20, modifier: 0.08, desc: '一阵风沙迷了对方眼睛，抢得先手' },
  { label: '⚖️中规中矩', weight: 20, modifier: 0, desc: '一切如常，胜败全凭真本事' },
  { label: '🌫️小有波折', weight: 20, modifier: -0.08, desc: '脚下踏空，身形微滞，节奏被打乱' },
  { label: '💨时运不济', weight: 12, modifier: -0.15, desc: '对方突然祭出秘宝，打乱全盘计划' },
  { label: '💀天意弄人', weight: 8, modifier: -0.25, desc: '最强一击被天然克制，灵力反噬' },
]

export const WINRATE_FEEDBACK: { min: number; max: number; text: string }[] = [
  { min: 0, max: 20, text: '对方的气息碾压而来，你连呼吸都变得困难……若非天降奇迹，此战恐怕……' },
  { min: 21, max: 35, text: '对方气息浩瀚如海，巨大灵压几乎让你难以呼吸。这一战，凶多吉少。' },
  { min: 36, max: 50, text: '对手修为远胜于你，但你握紧法宝，心中升起不屈战意。或许，并非全无机会。' },
  { min: 51, max: 65, text: '境界有差，但法宝犀利、功法霸道，赢面似乎不小。' },
  { min: 66, max: 80, text: '对方灵力虚浮根基不稳。你眼中寒光一闪，此战十拿九稳。' },
  { min: 81, max: 100, text: '几乎感觉不到压力。对手所有破绽在你眼中一览无余。' },
]

export const BREAKTHROUGH_GATES: {
  from: number
  to: number
  condition: string
  content: string
  successReward: string
  failPenalty: string
}[] = [
  { from: 10, to: 11, condition: '引气入体成功', content: '无天劫，需在灵地修炼1月', successReward: '神识初开', failPenalty: '灵根损伤(暂时)' },
  { from: 20, to: 21, condition: '修为满溢+筑基丹', content: '小天劫（三道天雷或心魔劫）', successReward: '寿元翻倍、御器飞行', failPenalty: '修为倒退3级' },
  { from: 40, to: 41, condition: '修为满溢+结丹契机', content: '四九小天劫', successReward: '寿元五百、炼制本命法宝', failPenalty: '修为倒退5级、可能丹碎' },
  { from: 60, to: 61, condition: '丹破婴生', content: '六九大天劫+域外天魔', successReward: '寿元千年、可夺舍', failPenalty: '元婴溃散、跌回筑基' },
  { from: 80, to: 81, condition: '法则初悟', content: '九九重劫+法则拷问', successReward: '寿元三千、法则领域', failPenalty: '肉身毁灭、元婴重伤' },
  { from: 95, to: 96, condition: '法则大成', content: '飞升之劫（天道亲自降劫）', successReward: '随时可飞升', failPenalty: '魂飞魄散(触发轮回)' },
]

export const CURRENCY_NAMES = ['下品灵石', '中品灵石', '上品灵石', '极品灵石', '灵晶']

export const NPC_SURNAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '林', '苏', '沈', '萧', '云', '慕容', '上官', '姬']
export const NPC_GIVEN_NAMES = ['云', '天', '玄', '沉', '若水', '子墨', '青莲', '寒霜', '长风', '惊鸿', '不凡', '无涯', '离尘', '清歌', '踏雪', '逍遥', '烈', '知微', '衡', '玦']
export const NPC_TRAITS = ['豪爽仗义', '心思缜密', '孤傲清冷', '贪财好利', '正气凛然', '阴狠毒辣', '滑稽爱笑', '沉默寡言', '重情重义', '睚眦必报', '谦逊温和', '狂傲不羁']
export const NPC_JOBS = ['炼丹师', '炼器师', '剑修', '体修', '符师', '阵师', '商会中人', '账房', '包打听', '散修', '宗门长老', '门派执事']
export const NPC_GOALS = ['渴望突破至下一境界', '寻找一件失落的传承', '想要报灭门之仇', '一心求道，别无所求', '想开一家坊市铺子', '想要收几个好徒弟', '在寻找传说中的洞天福地']
