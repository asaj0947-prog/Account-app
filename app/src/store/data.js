import { reactive } from 'vue'

// Electron 下通过 preload 暴露的 window.api 访问 SQLite；浏览器预览时用模拟数据兜底
const api = (typeof window !== 'undefined' && window.api) ? window.api : null

export const categories = reactive([])
export const records = reactive([])

// ---------- 工具函数 ----------
function dstr(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today() {
  return dstr(0)
}

export function formatMoney(n) {
  return Number(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ---------- 默认分类（浏览器演示用；Electron 下由主进程数据库提供并初始化） ----------
const DEFAULT_CATEGORIES = [
  { type: 'expense', name: '餐饮饮食', icon: 'Food', children: ['早餐', '午餐', '晚餐', '夜宵', '外卖', '零食饮料', '水果', '聚餐'] },
  { type: 'expense', name: '交通出行', icon: 'Van', children: ['公交地铁', '打车网约车', '加油充电', '停车费', '火车高铁', '飞机', '共享单车', '汽车保养维修'] },
  { type: 'expense', name: '购物消费', icon: 'ShoppingBag', children: ['服饰鞋包', '日用百货', '数码家电', '美妆护肤', '母婴用品', '其他购物'] },
  { type: 'expense', name: '居住住房', icon: 'House', children: ['房租', '水电燃气', '物业费', '家居用品', '维修装修'] },
  { type: 'expense', name: '娱乐休闲', icon: 'Film', children: ['电影演出', '游戏', '旅游度假', '运动健身', '宠物', '其他娱乐'] },
  { type: 'expense', name: '医疗健康', icon: 'FirstAidKit', children: ['看病买药', '体检', '保健养生', '医疗器材'] },
  { type: 'expense', name: '学习教育', icon: 'Reading', children: ['书籍', '课程培训', '学费', '文具', '考试报名'] },
  { type: 'expense', name: '人情往来', icon: 'Present', children: ['礼物红包', '请客送礼', '孝敬父母', '捐赠'] },
  { type: 'expense', name: '通讯网络', icon: 'Iphone', children: ['话费', '宽带', '会员订阅'] },
  { type: 'expense', name: '金融保险', icon: 'CreditCard', children: ['保险', '手续费利息', '还款', '投资亏损'] },
  { type: 'expense', name: '其他支出', icon: 'MoreFilled', children: ['其他支出'] },
  { type: 'income', name: '工资薪酬', icon: 'Suitcase', children: ['工资', '奖金', '补贴报销'] },
  { type: 'income', name: '理财收益', icon: 'TrendCharts', children: ['利息', '股票基金', '房租收入', '分红'] },
  { type: 'income', name: '红包礼金', icon: 'Gift', children: ['红包', '礼物礼金'] },
  { type: 'income', name: '兼职副业', icon: 'Laptop', children: ['兼职', '稿费', '其他副业'] },
  { type: 'income', name: '其他收入', icon: 'Wallet', children: ['退款', '其他收入'] }
]

// ---------- 模拟数据（浏览器演示用） ----------
function seedMock() {
  const cats = DEFAULT_CATEGORIES.map((c) => ({ type: c.type, name: c.name, icon: c.icon, children: [...c.children] }))
  const list = [
    ['expense', 8.5, '餐饮饮食', '早餐', 0, '豆浆油条'],
    ['expense', 25, '餐饮饮食', '午餐', 0, ''],
    ['expense', 16, '餐饮饮食', '零食饮料', 1, '奶茶'],
    ['expense', 5, '交通出行', '公交地铁', 1, ''],
    ['expense', 32, '交通出行', '打车网约车', 2, '下班打车'],
    ['expense', 89.9, '购物消费', '日用百货', 3, '超市采购'],
    ['expense', 45, '娱乐休闲', '电影演出', 4, '看电影'],
    ['expense', 100, '通讯网络', '话费', 5, ''],
    ['expense', 38, '餐饮饮食', '水果', 6, ''],
    ['income', 30, '理财收益', '利息', 10, ''],
    ['expense', 156, '居住住房', '水电燃气', 12, ''],
    ['income', 200, '红包礼金', '红包', 15, '生日红包'],
    ['expense', 200, '娱乐休闲', '运动健身', 15, '健身房月卡'],
    ['income', 500, '兼职副业', '兼职', 20, ''],
    ['expense', 68, '学习教育', '书籍', 20, ''],
    ['expense', 199, '人情往来', '礼物红包', 25, '朋友生日'],
    ['expense', 85, '医疗健康', '看病买药', 30, ''],
    ['expense', 20, '交通出行', '停车费', 35, ''],
    ['income', 8000, '工资薪酬', '工资', 40, ''],
    ['expense', 2500, '居住住房', '房租', 45, '上月房租'],
    ['expense', 260, '餐饮饮食', '聚餐', 50, ''],
    ['expense', 68, '娱乐休闲', '游戏', 60, ''],
    ['expense', 800, '金融保险', '保险', 75, ''],
    ['income', 3000, '工资薪酬', '奖金', 80, '年终奖'],
    ['expense', 1299, '学习教育', '课程培训', 90, ''],
    ['expense', 268, '交通出行', '火车高铁', 100, ''],
    ['expense', 599, '购物消费', '数码家电', 120, '耳机']
  ]
  const recs = list.map((r, i) => ({ id: i + 1, type: r[0], amount: r[1], categoryL1: r[2], categoryL2: r[3], date: dstr(r[4]), note: r[5] }))
  return { cats, recs }
}

// ---------- 初始化 ----------
function sortRecords() {
  records.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id - a.id))
}

export async function init() {
  if (api) {
    console.log('[data] 使用 SQLite 数据库（Electron）')
    const [cats, recs] = await Promise.all([api.getCategories(), api.getRecords()])
    categories.splice(0, categories.length, ...cats)
    records.splice(0, records.length, ...recs)
  } else {
    console.log('[data] 使用模拟数据（浏览器预览）')
    const { cats, recs } = seedMock()
    categories.splice(0, categories.length, ...cats)
    records.splice(0, records.length, ...recs)
  }
  sortRecords()
}

let mockId = 1000

// ---------- 记录操作 ----------
export async function addRecord(payload) {
  if (api) {
    const rec = await api.addRecord(payload)
    records.push(rec)
  } else {
    records.push({ id: mockId++, ...payload })
  }
  sortRecords()
}

export async function updateRecord(id, payload) {
  if (api) await api.updateRecord(id, payload)
  const r = records.find((x) => x.id === id)
  if (r) Object.assign(r, payload)
  sortRecords()
}

export async function removeRecord(id) {
  if (api) await api.removeRecord(id)
  const i = records.findIndex((x) => x.id === id)
  if (i >= 0) records.splice(i, 1)
}

// ---------- 分类操作 ----------
export async function addCategory(type, name) {
  const icon = 'MoreFilled'
  if (api) {
    const cat = await api.addCategory({ type, name, icon })
    categories.push(cat)
  } else {
    categories.push({ type, name, icon, children: [] })
  }
}

export async function addSubcategory(l1Name, name) {
  if (api) await api.addSubcategory({ l1Name, name })
  const c = categories.find((x) => x.name === l1Name)
  if (c && !c.children.includes(name)) c.children.push(name)
}

export async function removeCategory(l1Name) {
  if (api) await api.removeCategory(l1Name)
  const i = categories.findIndex((x) => x.name === l1Name)
  if (i >= 0) categories.splice(i, 1)
}

export async function removeSubcategory(l1Name, name) {
  if (api) await api.removeSubcategory({ l1Name, name })
  const c = categories.find((x) => x.name === l1Name)
  if (c) {
    const i = c.children.indexOf(name)
    if (i >= 0) c.children.splice(i, 1)
  }
}

// ---------- 数据导入导出 / 清空 ----------
export async function exportCsv() {
  if (!api) throw new Error('请在桌面软件中使用此功能')
  return api.exportCsv()
}

export async function downloadTemplate() {
  if (!api) throw new Error('请在桌面软件中使用此功能')
  return api.downloadTemplate()
}

export async function importCsv() {
  if (!api) throw new Error('请在桌面软件中使用此功能')
  const summary = await api.importCsv()
  if (summary && !summary.canceled && summary.imported > 0) {
    const recs = await api.getRecords()
    records.splice(0, records.length, ...recs)
    sortRecords()
  }
  return summary
}

export async function clearData(scope) {
  if (!api) throw new Error('请在桌面软件中使用此功能')
  const summary = await api.clearData(scope)
  records.splice(0, records.length)
  return summary
}

// ---------- 记账弹窗状态 ----------
export const ui = reactive({
  recordDialogVisible: false,
  recordDialogType: 'expense',
  editingRecord: null
})

export function openRecord(type = 'expense', record = null) {
  ui.recordDialogType = type
  ui.editingRecord = record
  ui.recordDialogVisible = true
}
