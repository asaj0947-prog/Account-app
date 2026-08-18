// 自测脚本：验证 CSV 读写 + 导入/清空用到的 SQL（可随时删除）
const assert = require('node:assert')
const { toCsv, parseCsv, decodeCsvBuffer, CSV_HEADER } = require('../electron/csv.cjs')
const { DatabaseSync } = require('node:sqlite')

// ---- 1. CSV 往返（写 → 解析 → 一致）----
const rows = [
  ['支出', 25.5, '餐饮饮食', '午餐', '2026-08-17', ''],
  ['支出', 89.9, '购物消费', '日用百货', '2026-08-16', '含,逗号'],
  ['收入', 8000, '工资薪酬', '工资', '2026-08-15', '带"引号"的备注'],
  ['支出', 100, '餐饮饮食', '聚餐', '2026-08-14', '第一行\n第二行']
]
const csv = toCsv(rows)
const parsed = parseCsv(csv)
assert.deepStrictEqual(parsed, rows.map((r) => r.map(String)), '往返结果应一致')
console.log('1. CSV 往返 OK')

// ---- 2. BOM + GBK 解码 ----
const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('类型,金额', 'utf8')])
assert.strictEqual(decodeCsvBuffer(withBom), '类型,金额')
// GBK 编码的「类型,金额」字节：类=C0E0 型=D0CD 金=BDF0 额=B6EE
const gbk = Buffer.from([0xc0, 0xe0, 0xd0, 0xcd, 0x2c, 0xbd, 0xf0, 0xb6, 0xee])
const decoded = decodeCsvBuffer(gbk)
assert.strictEqual(decoded, '类型,金额')
console.log('2. BOM/GBK 解码 OK')

// ---- 3. SQL：建表 + 插入 + 删除（对应导入/清空逻辑）----
const db = new DatabaseSync(':memory:')
db.exec('CREATE TABLE records (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, amount REAL NOT NULL, categoryL1 TEXT NOT NULL, categoryL2 TEXT NOT NULL, date TEXT NOT NULL, note TEXT DEFAULT \'\', createdAt TEXT NOT NULL)')
const ins = db.prepare('INSERT INTO records (type, amount, categoryL1, categoryL2, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
ins.run('expense', 25.5, '餐饮饮食', '午餐', '2026-08-17', '', new Date().toISOString())
ins.run('income', 8000, '工资薪酬', '工资', '2026-08-15', '', new Date().toISOString())
assert.strictEqual(db.prepare('SELECT COUNT(*) AS c FROM records').get().c, 2)
const info = db.prepare('DELETE FROM records').run()
assert.strictEqual(Number(info.changes), 2)
assert.strictEqual(db.prepare('SELECT COUNT(*) AS c FROM records').get().c, 0)
console.log('3. 导入插入 / 清空删除 SQL OK')

// ---- 4. 表头识别 ----
const headerCsv = '\uFEFF' + toCsv([CSV_HEADER, ...rows])
const withHeader = parseCsv(decodeCsvBuffer(Buffer.from(headerCsv, 'utf8')))
assert.strictEqual(withHeader[0][0], '类型')
console.log('4. 表头识别 OK')

console.log('\n全部自测通过 ✓')
