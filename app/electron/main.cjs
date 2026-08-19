const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { DatabaseSync } = require('node:sqlite')

let db = null

// 默认分类（与 deep.md 第 4 节一致）
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

function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'yixin.db')
  db = new DatabaseSync(dbPath)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT 'MoreFilled',
      ord INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_name TEXT NOT NULL,
      name TEXT NOT NULL,
      ord INTEGER DEFAULT 0,
      UNIQUE(category_name, name)
    );
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryL1 TEXT NOT NULL,
      categoryL2 TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
  seedCategories()
}

function seedCategories() {
  const { c } = db.prepare('SELECT COUNT(*) AS c FROM categories').get()
  if (c > 0) return
  const insCat = db.prepare('INSERT INTO categories (type, name, icon, ord) VALUES (?, ?, ?, ?)')
  const insSub = db.prepare('INSERT INTO subcategories (category_name, name, ord) VALUES (?, ?, ?)')
  db.exec('BEGIN')
  try {
    DEFAULT_CATEGORIES.forEach((cat, i) => {
      insCat.run(cat.type, cat.name, cat.icon, i)
      cat.children.forEach((s, j) => insSub.run(cat.name, s, j))
    })
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

function getCategories() {
  const cats = db.prepare('SELECT * FROM categories ORDER BY ord, id').all()
  const subs = db.prepare('SELECT * FROM subcategories ORDER BY ord, id').all()
  return cats.map((c) => ({
    type: c.type,
    name: c.name,
    icon: c.icon,
    children: subs.filter((s) => s.category_name === c.name).map((s) => s.name)
  }))
}

function addCategory(arg) {
  const name = String(arg.name).trim()
  if (!name) throw new Error('分类名不能为空')
  const exists = db.prepare('SELECT id FROM categories WHERE type = ? AND name = ?').get(arg.type, name)
  if (exists) throw new Error('分类已存在')
  db.prepare('INSERT INTO categories (type, name, icon, ord) VALUES (?, ?, ?, (SELECT IFNULL(MAX(ord),0)+1 FROM categories))')
    .run(arg.type, name, arg.icon || 'MoreFilled')
  return { type: arg.type, name, icon: arg.icon || 'MoreFilled', children: [] }
}

function addSubcategory(arg) {
  const name = String(arg.name).trim()
  if (!name) throw new Error('分类名不能为空')
  const exists = db.prepare('SELECT id FROM subcategories WHERE category_name = ? AND name = ?').get(arg.l1Name, name)
  if (exists) throw new Error('分类已存在')
  db.prepare('INSERT INTO subcategories (category_name, name, ord) VALUES (?, ?, (SELECT IFNULL(MAX(ord),0)+1 FROM subcategories WHERE category_name = ?))')
    .run(arg.l1Name, name, arg.l1Name)
}

function removeCategory(l1Name) {
  db.prepare('DELETE FROM categories WHERE name = ?').run(l1Name)
  db.prepare('DELETE FROM subcategories WHERE category_name = ?').run(l1Name)
}

function removeSubcategory(arg) {
  db.prepare('DELETE FROM subcategories WHERE category_name = ? AND name = ?').run(arg.l1Name, arg.name)
}

function getAllRecords() {
  return db.prepare('SELECT * FROM records ORDER BY date DESC, id DESC').all()
}

function addRecord(payload) {
  const info = db.prepare('INSERT INTO records (type, amount, categoryL1, categoryL2, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(payload.type, payload.amount, payload.categoryL1, payload.categoryL2, payload.date, payload.note || '', new Date().toISOString())
  return db.prepare('SELECT * FROM records WHERE id = ?').get(Number(info.lastInsertRowid))
}

function updateRecord(arg) {
  db.prepare('UPDATE records SET type = ?, amount = ?, categoryL1 = ?, categoryL2 = ?, date = ?, note = ? WHERE id = ?')
    .run(arg.payload.type, arg.payload.amount, arg.payload.categoryL1, arg.payload.categoryL2, arg.payload.date, arg.payload.note || '', arg.id)
  return db.prepare('SELECT * FROM records WHERE id = ?').get(arg.id)
}

function removeRecord(id) {
  db.prepare('DELETE FROM records WHERE id = ?').run(id)
}

// ---------- 贪吃蛇最高分 ----------
function getHighScore() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('snake_high_score')
  return row ? (Number(row.value) || 0) : 0
}

function setHighScore(score) {
  const n = Math.max(0, Math.floor(Number(score) || 0))
  if (n <= getHighScore()) return getHighScore()
  const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get('snake_high_score')
  if (exists) db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(String(n), 'snake_high_score')
  else db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('snake_high_score', String(n))
  return n
}

const { toCsv, parseCsv, decodeCsvBuffer, CSV_HEADER } = require('./csv.cjs')

function recordsToCsvRows() {
  return getAllRecords().map((r) => [
    r.type === 'income' ? '收入' : '支出',
    r.amount,
    r.categoryL1,
    r.categoryL2,
    r.date,
    r.note || ''
  ])
}

function csvTimestamp() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function templateRows() {
  return [
    ['支出', 25.0, '餐饮饮食', '午餐', '2026-08-17', '（示例，导入前请删除）'],
    ['收入', 8000.0, '工资薪酬', '工资', '2026-08-15', '（示例，导入前请删除）']
  ]
}

async function exportCsv() {
  const res = await dialog.showSaveDialog({
    title: '导出账单',
    defaultPath: `一新记账-账单-${csvTimestamp()}.csv`,
    filters: [{ name: 'CSV 表格', extensions: ['csv'] }]
  })
  if (res.canceled || !res.filePath) return { canceled: true }
  const rows = recordsToCsvRows()
  const csv = '\uFEFF' + toCsv([CSV_HEADER, ...rows])
  fs.writeFileSync(res.filePath, csv, 'utf8')
  return { canceled: false, count: rows.length, filePath: res.filePath }
}

async function downloadTemplate() {
  const res = await dialog.showSaveDialog({
    title: '保存导入模板',
    defaultPath: '一新记账-导入模板.csv',
    filters: [{ name: 'CSV 表格', extensions: ['csv'] }]
  })
  if (res.canceled || !res.filePath) return { canceled: true }
  const csv = '\uFEFF' + toCsv([CSV_HEADER, ...templateRows()])
  fs.writeFileSync(res.filePath, csv, 'utf8')
  return { canceled: false, filePath: res.filePath }
}

async function importCsv() {
  const res = await dialog.showOpenDialog({
    title: '导入账单',
    filters: [{ name: 'CSV 表格', extensions: ['csv'] }],
    properties: ['openFile']
  })
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) return { canceled: true }
  const filePath = res.filePaths[0]
  const buf = fs.readFileSync(filePath)
  const text = decodeCsvBuffer(buf)
  const rows = parseCsv(text)
  if (rows.length === 0) return { canceled: false, imported: 0, skipped: 0, errors: ['文件是空的，没有可导入的内容'], totalErrors: 1 }

  let start = 0
  const first = rows[0].map((x) => String(x).trim())
  if (first[0] === '类型' || first[0].toLowerCase() === 'type') start = 1

  const cats = getCategories()
  const catIndex = {}
  const subIndex = {}
  for (const c of cats) {
    catIndex[c.type + '|' + c.name] = true
    for (const l2 of c.children) subIndex[c.type + '|' + c.name + '|' + l2] = true
  }

  let imported = 0
  const errors = []
  const insRec = db.prepare('INSERT INTO records (type, amount, categoryL1, categoryL2, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')

  rows.slice(start).forEach((r, idx) => {
    const line = idx + start + 1
    const typeRaw = String(r[0] == null ? '' : r[0]).trim()
    const amountRaw = String(r[1] == null ? '' : r[1]).trim()
    const l1 = String(r[2] == null ? '' : r[2]).trim()
    const l2 = String(r[3] == null ? '' : r[3]).trim()
    const date = String(r[4] == null ? '' : r[4]).trim()
    const note = String(r[5] == null ? '' : r[5]).trim()

    if (!typeRaw && !amountRaw && !l1 && !l2 && !date && !note) return

    let type
    if (typeRaw === '支出' || typeRaw.toLowerCase() === 'expense') type = 'expense'
    else if (typeRaw === '收入' || typeRaw.toLowerCase() === 'income') type = 'income'
    else { errors.push(`第 ${line} 行：类型必须是「支出」或「收入」`); return }

    const amount = Number(amountRaw)
    if (!Number.isFinite(amount) || amount <= 0) { errors.push(`第 ${line} 行：金额无效，需为正数`); return }

    if (!catIndex[type + '|' + l1]) { errors.push(`第 ${line} 行：一级分类「${l1}」不存在（${type === 'expense' ? '支出' : '收入'}）`); return }
    if (!subIndex[type + '|' + l1 + '|' + l2]) { errors.push(`第 ${line} 行：二级分类「${l2}」不属于「${l1}」`); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push(`第 ${line} 行：日期格式应为 年-月-日，例如 2026-08-17`); return }

    insRec.run(type, amount, l1, l2, date, note, new Date().toISOString())
    imported++
  })

  return { canceled: false, imported, skipped: errors.length, errors: errors.slice(0, 50), totalErrors: errors.length }
}

function clearData(scope) {
  if (scope !== 'records') throw new Error('暂不支持该清空范围')
  const info = db.prepare('DELETE FROM records').run()
  return { cleared: Number(info.changes) }
}

function registerIpc() {
  ipcMain.handle('categories:get', () => getCategories())
  ipcMain.handle('categories:add', (e, arg) => addCategory(arg))
  ipcMain.handle('categories:addSub', (e, arg) => addSubcategory(arg))
  ipcMain.handle('categories:remove', (e, l1Name) => removeCategory(l1Name))
  ipcMain.handle('categories:removeSub', (e, arg) => removeSubcategory(arg))
  ipcMain.handle('records:get', () => getAllRecords())
  ipcMain.handle('records:add', (e, payload) => addRecord(payload))
  ipcMain.handle('records:update', (e, arg) => updateRecord(arg))
  ipcMain.handle('records:remove', (e, id) => removeRecord(id))
  ipcMain.handle('data:exportCsv', () => exportCsv())
  ipcMain.handle('data:importCsv', () => importCsv())
  ipcMain.handle('data:clearData', (e, scope) => clearData(scope))
  ipcMain.handle('data:downloadTemplate', () => downloadTemplate())
  ipcMain.handle('snake:getHighScore', () => getHighScore())
  ipcMain.handle('snake:setHighScore', (e, score) => setHighScore(score))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    title: '一新记账',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 开发模式下把界面控制台日志转发到终端，方便排查问题
  if (!app.isPackaged) {
    win.webContents.on('console-message', function (event, levelOrDetails, message) {
      if (levelOrDetails && typeof levelOrDetails === 'object') {
        console.log(`[renderer:${levelOrDetails.level}] ${levelOrDetails.message}`)
      } else {
        console.log(`[renderer:${levelOrDetails}] ${message}`)
      }
    })
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  initDb()
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
