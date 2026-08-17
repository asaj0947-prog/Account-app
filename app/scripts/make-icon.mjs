import { PNG } from 'pngjs'
import fs from 'node:fs'
import path from 'node:path'

const size = 512
const png = new PNG({ width: size, height: size })

// 圆角矩形覆盖率（带约 1px 抗锯齿）
function roundedRectCoverage(x, y, cx, cy, hw, hh, r) {
  const dx = Math.abs(x - cx) - (hw - r)
  const dy = Math.abs(y - cy) - (hh - r)
  const ox = Math.max(dx, 0)
  const oy = Math.max(dy, 0)
  const dist = Math.sqrt(ox * ox + oy * oy) - r
  if (dist <= 0) return 1
  if (dist < 1) return 1 - dist
  return 0
}

function blend(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ]
}

const topColor = [18, 184, 134]    // #12b886
const bottomColor = [10, 152, 105] // #0a9869
const white = [255, 255, 255]

for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const px = x + 0.5
    const py = y + 0.5
    const bgCov = roundedRectCoverage(px, py, 256, 256, 256, 256, 112)
    const barCov = roundedRectCoverage(px, py, 256, 256, 110, 22, 22)

    let r = 0
    let g = 0
    let b = 0
    let a = 0
    if (bgCov > 0) {
      const c = blend(topColor, bottomColor, y / size)
      r = c[0]
      g = c[1]
      b = c[2]
      a = Math.round(bgCov * 255)
      if (barCov > 0) {
        r = Math.round(r + (white[0] - r) * barCov)
        g = Math.round(g + (white[1] - g) * barCov)
        b = Math.round(b + (white[2] - b) * barCov)
      }
    }

    const idx = (size * y + x) << 2
    png.data[idx] = r
    png.data[idx + 1] = g
    png.data[idx + 2] = b
    png.data[idx + 3] = a
  }
}

const outDir = path.join(process.cwd(), 'build')
fs.mkdirSync(outDir, { recursive: true })
const out = path.join(outDir, 'icon.png')
fs.writeFileSync(out, PNG.sync.write(png))
console.log('icon written to', out)
