import type { RestartEnding, RestartEventTemplate, RestartTalent } from './types'

export const RESTART_TALENTS: RestartTalent[] = [
  { id: 'bookish-heart', tier: '普通', name: '过目成诵', description: '典籍与功法在你眼中更容易化为所得。', tradeoff: '闭关之外的收获较为平淡。', effects: { attributes: { wuxing: 2 }, cultivationBonus: 1, tags: ['scholar'] } },
  { id: 'stone-will', tier: '普通', name: '磐石心', description: '面对漫长困顿时，你很少先一步动摇。', tradeoff: '初见机缘时不够锋芒毕露。', effects: { attributes: { daoxin: 2 }, healthBonus: 4, tags: ['steadfast'] } },
  { id: 'mountain-bone', tier: '普通', name: '山岳骨', description: '经脉坚韧，能承受常人难以忍受的苦修。', tradeoff: '灵活取巧的机缘较少眷顾你。', effects: { attributes: { gengu: 2 }, lifespanBonus: 4, tags: ['body'] } },
  { id: 'lucky-coin', tier: '普通', name: '拾遗运', description: '总能在被遗忘的角落找到一点余财。', tradeoff: '你更容易被人当作可利用的目标。', effects: { attributes: { qiyun: 2 }, wealthBonus: 2, tags: ['fortunate'] } },
  { id: 'market-sense', tier: '普通', name: '坊市嗅觉', description: '你知道何时该买入，何时该止损。', tradeoff: '一心悟道时杂念更多。', effects: { attributes: { qiyun: 1 }, wealthBonus: 4, tags: ['merchant'] } },
  { id: 'kindred-face', tier: '普通', name: '善缘面', description: '初见之人往往愿意多给你一句提醒。', tradeoff: '难以彻底置身事外。', effects: { attributes: { daoxin: 1, qiyun: 1 }, tags: ['kindred'] } },
  { id: 'late-bloomer', tier: '普通', name: '大器晚成', description: '早年蹉跎不会轻易磨灭你的根基。', tradeoff: '少年期的修为积累较慢。', effects: { attributes: { gengu: 1, daoxin: 1 }, cultivationBonus: 1, tags: ['late-bloomer'] } },
  { id: 'wild-instinct', tier: '普通', name: '荒野直觉', description: '在游历、危局与残墟前，你总能嗅到不对劲。', tradeoff: '安稳宗门生活让你感到束缚。', effects: { attributes: { qiyun: 1, gengu: 1 }, healthBonus: 3, tags: ['wanderer'] } },
  { id: 'quiet-breath', tier: '普通', name: '静息法', description: '吐纳时心绪澄澈，适合长久修持。', tradeoff: '争先夺宝时不愿孤注一掷。', effects: { attributes: { wuxing: 1, daoxin: 1 }, cultivationBonus: 1, tags: ['quiet'] } },
  { id: 'clear-spirit', tier: '稀有', name: '明净灵台', description: '心魔、幻象与流言较难动摇你。', tradeoff: '与「血煞体」的路数相斥。', mutexTag: 'temperament', effects: { attributes: { wuxing: 2, daoxin: 2 }, spiritRoot: '上品灵根', tags: ['clear-mind'] } },
  { id: 'blood-fiend', tier: '稀有', name: '血煞体', description: '濒临绝境时，肉身会爆发出超常的生机。', tradeoff: '与「明净灵台」相斥，行事更易招惹非议。', mutexTag: 'temperament', effects: { attributes: { gengu: 3 }, healthBonus: 12, tags: ['blood-fiend'] } },
  { id: 'five-elements', tier: '稀有', name: '五行亲和', description: '五行灵气在经脉中流转得格外顺畅。', tradeoff: '没有单一极致属性的爆发。', effects: { attributes: { wuxing: 1, gengu: 1 }, cultivationBonus: 3, spiritRoot: '异灵根', tags: ['five-elements'] } },
  { id: 'fate-sight', tier: '稀有', name: '天机微感', description: '大事临头前，常有一缕难言的预感。', tradeoff: '知道得越多，越难轻松度日。', effects: { attributes: { qiyun: 3 }, lifespanBonus: -2, tags: ['fate-sight'] } },
  { id: 'old-soul', tier: '稀有', name: '宿慧未泯', description: '前尘碎片让你更快理解陌生的修行道理。', tradeoff: '夜深时偶有不属于今生的梦魇。', effects: { attributes: { wuxing: 3, daoxin: 1 }, cultivationBonus: 2, tags: ['old-soul'] } },
  { id: 'spirit-vein', tier: '稀有', name: '灵脉后裔', description: '血脉深处藏着一缕尚未断绝的灵脉余荫。', tradeoff: '旧族因果迟早会找上门。', effects: { attributes: { gengu: 2, qiyun: 1 }, wealthBonus: 5, spiritRoot: '极品灵根', tags: ['spirit-vein'] } },
  { id: 'void-pulse', tier: '传说', name: '虚空灵窍', description: '空间裂隙与遗府禁制对你格外亲近。', tradeoff: '与「纯阳道胎」相斥，寿元略有折损。', mutexTag: 'legend-root', effects: { attributes: { wuxing: 3, qiyun: 2 }, cultivationBonus: 4, lifespanBonus: -4, spiritRoot: '异灵根', tags: ['void'] } },
  { id: 'pure-yang', tier: '传说', name: '纯阳道胎', description: '气血与真元天生相合，破境时更容易守住本心。', tradeoff: '与「虚空灵窍」相斥，求道之路少有迂回。', mutexTag: 'legend-root', effects: { attributes: { daoxin: 3, gengu: 2 }, healthBonus: 10, spiritRoot: '极品灵根', tags: ['pure-yang'] } },
  { id: 'heaven-favored', tier: '传说', name: '天命垂青', description: '看似无关的选择常会在未来结出机缘。', tradeoff: '每次失手都更容易成为众人议论的中心。', effects: { attributes: { qiyun: 4 }, wealthBonus: 6, tags: ['heaven-favored'] } },
]

export const RESTART_EVENT_TEMPLATES: RestartEventTemplate[] = [
  { id: 'awakening', age: 15, phase: '少年启灵', title: '灵息初现', description: '十五岁那年，夜雨落在瓦檐上。你第一次清晰感到天地灵气正穿过指间。', choices: [
    { id: 'meditate', label: '守住灵台，缓缓引气', description: '以悟性梳理第一次灵息。', stat: 'wuxing', difficulty: 8, success: { log: '你守住了第一缕灵息，识海如雨后初晴。', cultivation: 36, tags: ['awakened'] }, failure: { log: '灵息散去，但你记住了那一瞬的方向。', cultivation: 12 } },
    { id: 'seek-teacher', label: '寻访山中老修', description: '以气运与善缘，赌一次入门机会。', stat: 'qiyun', difficulty: 9, success: { log: '老修收下你一枚传讯符，允你旁听三月。', cultivation: 28, wealth: 6, tags: ['mentor'] }, failure: { log: '山门未开，你带着疑惑回到人间。', cultivation: 10 } },
  ] },
  { id: 'sect-road', age: 20, phase: '去留之择', title: '山门与尘途', description: '一座宗门招收外门，另一边坊市商队邀你同行。两条路都不会白白等人。', choices: [
    { id: 'sect', label: '叩门入宗', description: '以根骨换取系统传承。', stat: 'gengu', difficulty: 10, success: { log: '你通过外门试炼，得了一间狭小却安静的石室。', cultivation: 44, tags: ['sect'] }, failure: { log: '你止步山门外，却从失败里看清了自己的短板。', cultivation: 16, health: -4 } },
    { id: 'market', label: '随商队游历', description: '以气运为代价换取见闻与资源。', stat: 'qiyun', difficulty: 10, success: { log: '商队穿过险地，你在乱石滩拾得一枚旧玉简。', cultivation: 24, wealth: 22, tags: ['wanderer'] }, failure: { log: '商队被劫，你保住性命，却丢了积蓄。', wealth: -8, health: -8 } },
  ] },
  { id: 'ruin', age: 28, phase: '初入江湖', title: '残墟传闻', description: '坊间传来古修洞府将开的消息。有人说里面有筑基遗泽，也有人说里面只剩白骨。', choices: [
    { id: 'explore', label: '循迹探墟', description: '以悟性破解残阵，赌一次机缘。', stat: 'wuxing', difficulty: 13, success: { log: '残阵在你面前露出缝隙，一卷残篇让你的修为突飞猛进。', cultivation: 72, wealth: 16, tags: ['ruin-walker'] }, failure: { log: '阵纹反噬，你带伤逃离，却也带回了教训。', health: -18, cultivation: 16 } },
    { id: 'prepare', label: '留在洞府苦修', description: '以道心抵住外界诱惑。', stat: 'daoxin', difficulty: 11, success: { log: '你没有追逐传闻，反而在安静中补全了吐纳法。', cultivation: 48, health: 5, tags: ['patient'] }, failure: { log: '心绪难宁，数年苦修收效甚微。', cultivation: 18 } },
  ] },
  { id: 'foundation', age: 37, phase: '破境关隘', title: '道基将成', description: '经年积累后，经脉中的灵力开始满溢。跨出这一步，往后便是另一种天地。', choices: [
    { id: 'breakthrough', label: '闭关冲击道基', description: '以根骨承受破境的压力。', stat: 'gengu', difficulty: 15, success: { log: '灵气回旋成台，你终于越过了那道看似不可逾越的门槛。', cultivation: 96, lifespan: 18, tags: ['foundation'] }, failure: { log: '冲关未果，经脉留下暗伤。', health: -20, cultivation: 26 } },
    { id: 'wait', label: '先稳住道心', description: '以道心将躁进化作更扎实的积累。', stat: 'daoxin', difficulty: 14, success: { log: '你将满溢灵力重新压回丹田，根基反而更加圆融。', cultivation: 58, health: 8, tags: ['steady-foundation'] }, failure: { log: '机缘稍纵即逝，你只能从头再来。', cultivation: 24 } },
  ] },
  { id: 'human-world', age: 48, phase: '红尘因果', title: '故人求援', description: '一位旧识为救族人而来，求你卷入一场可能得罪强敌的纷争。', choices: [
    { id: 'help', label: '应下此诺', description: '以道心守住曾经的善缘。', stat: 'daoxin', difficulty: 16, success: { log: '你守住了承诺，也在生死一线间明白了何为担当。', cultivation: 58, wealth: 20, tags: ['righteous'] }, failure: { log: '你救下了人，却付出了重伤的代价。', health: -24, tags: ['righteous'] } },
    { id: 'refuse', label: '斩断牵连', description: '以悟性判断局势，保全自己的道途。', stat: 'wuxing', difficulty: 15, success: { log: '你看穿了陷阱，避开一场本不属于你的劫。', cultivation: 42, health: 6, tags: ['clear-cut'] }, failure: { log: '你虽抽身，却失去了一位曾经信任你的人。', wealth: -10 } },
  ] },
  { id: 'heart-demon', age: 60, phase: '心关如狱', title: '旧梦心魔', description: '静室中，往昔所有遗憾化作真实幻境。你必须回答：此生修行究竟为何？', choices: [
    { id: 'face', label: '直面旧梦', description: '以道心照见并接纳过去。', stat: 'daoxin', difficulty: 18, success: { log: '幻境碎裂，你不再逃避曾经的自己。', cultivation: 84, lifespan: 16, tags: ['heart-clear'] }, failure: { log: '心魔留下裂痕，往后每次吐纳都需更加谨慎。', health: -22, cultivation: 18 } },
    { id: 'study', label: '以理法拆解幻象', description: '以悟性寻找心魔运行的破绽。', stat: 'wuxing', difficulty: 18, success: { log: '你把心魔当成一道难题，最终从中悟出新的法门。', cultivation: 76, tags: ['mind-method'] }, failure: { log: '理法不敌执念，你被迫中断闭关。', health: -15 } },
  ] },
  { id: 'late-fate', age: 74, phase: '暮年大机缘', title: '天外遗音', description: '天际传来一声不属于此界的钟鸣。你知道，这可能是最后一次改变命数的机会。', choices: [
    { id: 'follow', label: '循钟声而去', description: '以气运赌上最后的远行。', stat: 'qiyun', difficulty: 19, success: { log: '你在云海尽头看见前人留下的阶梯，寿元与修为一同被点亮。', cultivation: 110, lifespan: 24, tags: ['sky-road'] }, failure: { log: '云海崩散，你带着伤势回到故土。', health: -28, wealth: -12 } },
    { id: 'teach', label: '留下传承', description: '将未竟的道途交给后来者。', stat: 'daoxin', difficulty: 17, success: { log: '门下弟子替你补齐了最后一段传承，你的道心因此通明。', cultivation: 62, lifespan: 18, tags: ['teacher'] }, failure: { log: '传承未能延续，你只得亲自整理残卷。', cultivation: 22 } },
  ] },
  { id: 'heaven-gate', age: 88, phase: '终局问天', title: '天门叩问', description: '此生最后的大门缓缓开启。门后是飞升、留世，或一场无人知晓的长眠。', final: true, choices: [
    { id: 'ascend', label: '以此身叩天门', description: '以气运承受最后的天意。', stat: 'qiyun', difficulty: 20, success: { log: '天门为你留下一线清光。', cultivation: 150, tags: ['heaven-gate'] }, failure: { log: '天门闭合，雷意在经脉中留下最后的印记。', health: -45 } },
    { id: 'leave-legacy', label: '回首留传承', description: '以道心决定让此界记住什么。', stat: 'daoxin', difficulty: 18, success: { log: '你没有踏入天门，却让自己的道统在后世延续。', cultivation: 50, lifespan: 8, tags: ['legacy'] }, failure: { log: '你整理残卷到最后一夜，仍未能写完所有话。', health: -16 } },
  ] },
]

export const RESTART_ENDINGS: RestartEnding[] = [
  { id: 'ascended', title: '一线飞升', description: '你穿过天门，身后是已被岁月写满的一生。', rarity: '传说' },
  { id: 'sect-elder', title: '一宗之师', description: '你未必抵达天外，却成为许多人抬头可见的高峰。', rarity: '稀有' },
  { id: 'wanderer-legend', title: '云游遗名', description: '你把足迹留给山河，把名字留给后人的传闻。', rarity: '稀有' },
  { id: 'legacy', title: '薪火不绝', description: '你离开时，门下仍有人继续走你选择的路。', rarity: '普通' },
  { id: 'mortal-peace', title: '人间清欢', description: '你没有走到最高处，却在自己的路上安然落幕。', rarity: '普通' },
  { id: 'heart-demon', title: '心魔蚀道', description: '执念最终压过了灵台，留下无人知晓的遗憾。', rarity: '普通' },
  { id: 'fallen', title: '道途断绝', description: '你在一次抉择中耗尽了此生的余火。', rarity: '普通' },
]
