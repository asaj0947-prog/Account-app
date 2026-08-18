// 纯 CSV 读写工具，不依赖 Electron，便于单独测试
function csvField(v) {
  const s = String(v == null ? '' : v)
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

function toCsv(rows) {
  return rows.map((r) => r.map(csvField).join(',')).join('\r\n')
}

// 把文件内容按 UTF-8（优先）或 GBK（兜底）解码成文本；自动去掉 UTF-8 BOM
function decodeCsvBuffer(buf) {
  let b = buf
  if (b.length >= 3 && b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.subarray(3)
  const utf8 = b.toString('utf8')
  if (!utf8.includes('\uFFFD')) return utf8
  try {
    return new TextDecoder('gbk').decode(b)
  } catch (e) {
    return utf8
  }
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let i = 0
  const n = text.length
  while (i < n) {
    const ch = text[i]
    if (ch === '"') {
      i++
      while (i < n) {
        const c = text[i]
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue }
          i++; break
        } else {
          field += c; i++
        }
      }
      if (i < n && text[i] === ',') { i++; row.push(field); field = '' }
    } else if (ch === ',') {
      row.push(field); field = ''; i++
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i += 2; else i++
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += ch; i++
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  while (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop()
  return rows
}

const CSV_HEADER = ['类型', '金额', '一级分类', '二级分类', '日期', '备注']

module.exports = { csvField, toCsv, parseCsv, decodeCsvBuffer, CSV_HEADER }
