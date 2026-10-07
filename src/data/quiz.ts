import type { Question, ResultProfile } from '../types'

const score = (money: number, safety: number, face: number, tradition: number) => ({ money, safety, face, tradition })

export const stages = {
  1: { title: '日常情勒與生活習慣', clear: '第一關完成！', detail: '', action: '進入第一關', transitionLead: '', transitionCopy: '' },
  2: { title: '消費觀念與財務安全感', clear: '第一關完成！', detail: '看看談到錢的時候，家長防禦力會不會突然暴增。', action: '進入第二關', transitionLead: '日常生存測試通過 ✓', transitionCopy: '下一關' },
  3: { title: '安全感與未來決策', clear: '第二關完成！', detail: '看看真正要做重大決定時，家長最在意的是什麼。', action: '進入最後一關', transitionLead: '真正的大魔王要出現了。', transitionCopy: '最後一關' }
} as const

// Display copy and scoring are data, never component logic. Text is retained verbatim from v1.
export const questions: Question[] = [
  { id: 'q01', stage: 1, text: '剛領到第一個月薪水，爸媽第一句問你的話通常是？', options: [
    { key: 'A', text: '「工作辛苦了，拿去買自己想買的東西吧！」', scores: score(0, 0, 0, 0) },
    { key: 'B', text: '「薪水多少？要開始給家裡家用（孝親費）了吧？」', scores: score(2, 0, 1, 2) },
    { key: 'C', text: '「隔壁陳阿姨的小孩第一年就給家裡兩萬，你呢？」', scores: score(2, 0, 3, 1) }
  ] },
  { id: 'q02', stage: 1, text: '假日想在家睡個懶覺或追劇，爸媽最常用的「起床號」是？', options: [
    { key: 'A', text: '「太陽都晒屁股了還睡！我們年輕時這個時間早就出門幹活了！」', scores: score(0, 0, 0, 3) },
    { key: 'B', text: '「整天抱著手機打 Game/追劇，眼睛不會壞掉嗎？」', scores: score(0, 2, 0, 1) },
    { key: 'C', text: '溫柔叫醒你：「要不要起來吃早餐？」', scores: score(0, 0, 0, 0) }
  ] },
  { id: 'q03', stage: 1, text: '當你買了一個質感較好的單品（如好一點的後背包、耳機）帶回家：', options: [
    { key: 'A', text: '「這很貴吧？年輕人剛工作要懂得省錢，不要亂花！」', scores: score(3, 0, 0, 1) },
    { key: 'B', text: '「不錯喔，蠻好看的！」', scores: score(0, 0, 1, 0) },
    { key: 'C', text: '「這舊的明明還能用，幹嘛又買新的？浪費錢！」', scores: score(3, 0, 0, 2) }
  ] },
  { id: 'q04', stage: 1, text: '面對親戚聚會，爸媽最喜歡在餐桌上進行什麼「儀式」？', options: [
    { key: 'A', text: '默默幫你夾菜，讓你好好吃飯。', scores: score(0, 0, 0, 0) },
    { key: 'B', text: '開啟「比較模式」：\n「我們家這個還在打雜啦，哪像你們家孩子在大公司……」', scores: score(0, 0, 3, 1) },
    { key: 'C', text: '「發表大會」：\n把你最近的小成就拿出來放大膨脹一番。', scores: score(0, 0, 3, 0) }
  ] },
  { id: 'q05', stage: 1, text: '當你試圖跟爸媽解釋新的科技或生活觀念時，最常得到的回答是：', options: [
    { key: 'A', text: '「我們吃的鹽比你吃的米多！聽爸媽的準沒錯。」', scores: score(0, 0, 0, 3) },
    { key: 'B', text: '「很有趣耶，你教我怎麼用！」', scores: score(0, 0, 0, 0) },
    { key: 'C', text: '「那是你們年輕人的東西啦，我們用習慣舊的就好了。」', scores: score(0, 1, 0, 3) }
  ] },
  { id: 'q06', stage: 2, text: '提到「理財與存錢」，爸媽最常掛在嘴邊的黃金金句是？', options: [
    { key: 'A', text: '「錢放在銀行最安全，不要想些有的沒的風險投資！」', scores: score(2, 3, 0, 2) },
    { key: 'B', text: '「能省則省，搭公車捷運最划算，沒事買什麼大件物品？」', scores: score(3, 0, 0, 1) },
    { key: 'C', text: '「懂得投資自己才是最重要的。」', scores: score(0, 0, 0, 0) }
  ] },
  { id: 'q07', stage: 2, text: '當你跟爸媽提到「想要換一件大價錢的物品（如家電/移動工具）」：', options: [
    { key: 'A', text: '「你養得起嗎？不要到時候繳不起又來找我們伸援助！」', scores: score(3, 2, 0, 1) },
    { key: 'B', text: '「買那幹嘛？現在這個明明還能繼續用！」', scores: score(3, 0, 0, 2) },
    { key: 'C', text: '「好啊，需要贊助跟我們說。」', scores: score(0, 0, 0, 0) }
  ] },
  { id: 'q08', stage: 2, text: '爸媽對於「新科技產品/新技術（如電動車、智慧家居）」的防禦心態是：', options: [
    { key: 'A', text: '「新東西容易壞，維修起來都是天文數字，傳統的才耐用！」', scores: score(2, 3, 0, 3) },
    { key: 'B', text: '「那種東西不安全啦，萬一壞掉怎麼辦？」', scores: score(0, 3, 0, 1) },
    { key: 'C', text: '「科技進步真快，感覺蠻方便的。」', scores: score(0, 0, 0, 0) }
  ] },
  { id: 'q09', stage: 2, text: '如果爸媽發現你有需要花大錢的打算，他們最害怕的是？', options: [
    { key: 'A', text: '害怕你被外面的業者當「冤大頭」宰。', scores: score(3, 2, 0, 0) },
    { key: 'B', text: '害怕你只是一時衝動、缺乏長期規劃。', scores: score(2, 3, 0, 1) },
    { key: 'C', text: '害怕你負擔太重，日子過得太辛苦。', scores: score(3, 1, 0, 0) }
  ] },
  { id: 'q10', stage: 2, text: '當你跟爸媽發生意見分歧時，最讓你心累的「情緒大招」是：', options: [
    { key: 'A', text: '「我們這都是為你好，你長大了翅膀硬了是不是？」', scores: score(0, 0, 1, 3) },
    { key: 'B', text: '「隨便你啦，以後出問題不要回來哭！」', scores: score(0, 3, 0, 2) },
    { key: 'C', text: '長期冷戰，默默在旁邊發出沉重的嘆氣聲。', scores: score(0, 0, 2, 2) }
  ] },
  { id: 'q11', stage: 3, text: '爸媽在評價「一個產品好不好」時，最看重的核心條件是？', options: [
    { key: 'A', text: '大品牌與售後保障：\n出了問題找不到人處理就完蛋了。', scores: score(0, 3, 1, 1) },
    { key: 'B', text: '極致 CP 值：\n花這筆錢能不能幫未來省更多錢？', scores: score(3, 1, 0, 0) },
    { key: 'C', text: '外觀與酷炫功能：\n長得好看最重要。', scores: score(0, 0, 3, 0) }
  ] },
  { id: 'q12', stage: 3, text: '你覺得爸媽對你剛出社會的「終極期待」其實是什麼？', options: [
    { key: 'A', text: '財務獨立，能把自己照顧好，甚至有能力做長遠的資產規劃。', scores: score(3, 2, 0, 0) },
    { key: 'B', text: '聽話順從，照著他們安排的穩定道路走。', scores: score(0, 2, 0, 3) },
    { key: 'C', text: '趕快成家立業，讓他們在親戚面前有面子。', scores: score(0, 0, 3, 2) }
  ] },
  { id: 'q13', stage: 3, text: '當你試圖向爸媽提案一個計畫時，哪種方式最容易讓他們買單？', options: [
    { key: 'A', text: '空口說白話，憑感覺跟他們撒嬌。', scores: score(0, 0, 0, 0) },
    { key: 'B', text: '拿出一張清晰的「財務試算表」與客觀數據，\n證明這筆開銷長期反而划算。', scores: score(3, 2, 0, 0) },
    { key: 'C', text: '找親戚幫忙在旁邊敲邊鼓。', scores: score(0, 0, 3, 1) }
  ] },
  { id: 'q14', stage: 3, text: '如果家長願意在財務上給予新鮮人支持（如贊助頭期款），他們的底線通常是：', options: [
    { key: 'A', text: '這筆投資必須是安全的、保值的、且孩子後續負擔得起的。', scores: score(2, 3, 0, 1) },
    { key: 'B', text: '完全沒有底線，只要孩子開口就給。', scores: score(0, 0, 0, 0) },
    { key: 'C', text: '必須掌握這件物品的最終掌控權。', scores: score(0, 1, 1, 3) }
  ] },
  { id: 'q15', stage: 3, text: '面對亞洲父母的「愛與壓力並存」，你最渴望的解法是？', options: [
    { key: 'A', text: '有一個「智囊工具」幫我整理好所有客觀數據，\n讓我不再需要跟爸媽硬碰硬吵架。', scores: score(3, 2, 0, 0) },
    { key: 'B', text: '徹底放棄溝通，靠自己默默存錢。', scores: score(3, 0, 0, 1) },
    { key: 'C', text: '希望爸媽能突然想通，主動支持我的選擇。', scores: score(0, 0, 1, 1) }
  ] }
]

export const profiles: Record<string, ResultProfile> = {
  money: { key: 'money', name: '算盤系・極致省錢大魔王', skill: '「舊的明明還能用！」', concern: '嘴上一直問花多少，其實更擔心你剛出社會就做出超出負擔的決定。', strategy: '拿出客觀數字、長期成本與可負擔的規劃，會比硬碰硬更有用。', quote: '拿數據跟他算長期成本', personality: '不是想跟你算到小數點，是怕你一時開心，接下來三十六期都不開心。', communicationTip: '先拆出每月支出，再比較長期總成本與緊急預備金，讓「買不買」變成「怎麼負擔」。', doList: ['拆解每月支出與長期總成本', '準備可負擔範圍與緊急預備金', '用同一把尺比較不同選項'], avoidList: ['只說「很划算」', '一次丟太多數字，卻沒說結論'] },
  safety: { key: 'safety', name: '錦衣衛系・絕對安全控魔王', skill: '「萬一壞掉怎麼辦？」', concern: '他們在意的不是掃興，而是安全、可靠、售後與未知風險。', strategy: '先從官方安全資料、保固與大廠售後系統說起，再談新選擇。', quote: '用保障與實例卸下防備', personality: '嘴上問十次安不安全，心裡其實只想確認：真的出狀況時，你有沒有退路。', communicationTip: '先講保固、售後與安全資訊，再補上遇到意外時的備案，讓未知變得可預期。', doList: ['整理保固與售後服務內容', '用可信資料回答安全疑問', '準備一個實際可行的備案'], avoidList: ['用「你不懂啦」開場', '只強調新科技很方便'] },
  face: { key: 'face', name: '隔壁小明系・愛比較面子魔王', skill: '「哪像你們家孩子在大公司……」', concern: '比較背後，往往是希望你做出一個讓人安心、也能被理解的成熟選擇。', strategy: '別只炫科技；強調品質、長期規劃與成熟決策，會更容易被聽見。', quote: '把選擇說成成熟規劃', personality: '親戚比較雷達常駐，但最在意的，可能還是你有沒有認真想過這個選擇。', communicationTip: '把需求、取捨與長期安排講清楚；不需要贏過誰，只要讓人看見你做過功課。', doList: ['先說自己的需求與考量', '呈現完整、成熟的規劃', '把比較轉成適不適合自己'], avoidList: ['直接拿別人家的孩子比較', '把討論變成輸贏'] },
  tradition: { key: 'tradition', name: '傳統派・古板不信邪魔王', skill: '「我們吃的鹽比你吃的米多！」', concern: '熟悉的做法帶來安全感，對新科技的保留不代表他們不關心你。', strategy: '用生活化資訊和實際情境，一步一步解釋；先建立熟悉感，不急著丟技術名詞。', quote: '從日常使用開始慢慢說', personality: '熟悉的做法不一定永遠最好；只是每次要更新說明書，他們都會先嘆一口氣。', communicationTip: '從熟悉的生活情境開始，一次說明一件改變；先讓新選項變熟悉，不急著要求認同。', doList: ['從每天會遇到的情境開始', '用操作示範代替一串術語', '一次只討論一個新選項'], avoidList: ['否定他們過去的經驗', '一口氣搬出太多新名詞'] }
}
