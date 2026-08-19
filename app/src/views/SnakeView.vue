<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getHighScore, setHighScore } from '../store/data'

const GRID = 20        // 20 × 20 的棋盘
const CELL = 24        // 每格 24 像素
const SIZE = GRID * CELL

const canvasRef = ref(null)
const gameState = ref('ready') // ready | playing | paused | over
const score = ref(0)
const highScore = ref(0)
const beatRecord = ref(false)

let ctx = null
let snake = []       // 蛇身体，第一个元素是蛇头
let dir = { x: 1, y: 0 }      // 当前方向
let nextDir = { x: 1, y: 0 }  // 缓冲方向（避免一次按键内连续转弯）
let food = { x: 0, y: 0 }
let delay = 150      // 每步间隔（毫秒），越吃越快
let timer = null

function blurActive() {
  const el = document.activeElement
  if (el && typeof el.blur === 'function') el.blur()
}

function reset() {
  const cx = Math.floor(GRID / 2)
  const cy = Math.floor(GRID / 2)
  snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }]
  dir = { x: 1, y: 0 }
  nextDir = { x: 1, y: 0 }
  score.value = 0
  beatRecord.value = false
  delay = 150
  spawnFood()
}

function randomEmptyCell() {
  while (true) {
    const x = Math.floor(Math.random() * GRID)
    const y = Math.floor(Math.random() * GRID)
    if (!snake.some((s) => s.x === x && s.y === y)) return { x, y }
  }
}

function spawnFood() {
  food = randomEmptyCell()
}

function start() {
  blurActive()
  reset()
  gameState.value = 'playing'
  draw()
  schedule()
}

function pause() {
  blurActive()
  if (gameState.value === 'playing') {
    gameState.value = 'paused'
    clearTimeout(timer)
  }
}

function resume() {
  blurActive()
  if (gameState.value === 'paused') {
    gameState.value = 'playing'
    schedule()
  }
}

function togglePause() {
  if (gameState.value === 'playing') pause()
  else if (gameState.value === 'paused') resume()
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    if (gameState.value === 'playing') tick()
  }, delay)
}

function tick() {
  dir = nextDir
  const head = snake[0]
  const nx = head.x + dir.x
  const ny = head.y + dir.y

  // 撞墙
  if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) return gameOver()

  // 撞自己（不吃食物时尾巴会移开，那一格不算撞）
  const eating = nx === food.x && ny === food.y
  const body = eating ? snake : snake.slice(0, -1)
  if (body.some((s) => s.x === nx && s.y === ny)) return gameOver()

  snake.unshift({ x: nx, y: ny })
  if (eating) {
    score.value += 1
    if (score.value > highScore.value) {
      highScore.value = score.value
      beatRecord.value = true
      setHighScore(score.value)
    }
    // 占满整张棋盘（理论上的通关），结束游戏避免死循环
    if (snake.length >= GRID * GRID) return gameOver()
    spawnFood()
    // 每吃 5 个提速一次，最快 60 毫秒一步
    delay = Math.max(60, 150 - Math.floor(score.value / 5) * 10)
  } else {
    snake.pop()
  }
  draw()
  schedule()
}

function gameOver() {
  gameState.value = 'over'
  clearTimeout(timer)
  draw()
}

function setDirection(nx, ny) {
  if (gameState.value !== 'playing') return
  // 不能直接掉头（例如正往右时不能立刻向左）
  if (dir.x === -nx && dir.y === -ny) return
  nextDir = { x: nx, y: ny }
}

function draw() {
  if (!ctx) return
  ctx.clearRect(0, 0, SIZE, SIZE)

  // 背景
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, SIZE, SIZE)

  // 棋盘格线
  ctx.strokeStyle = '#eef2f7'
  ctx.lineWidth = 1
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL, 0)
    ctx.lineTo(i * CELL, SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * CELL)
    ctx.lineTo(SIZE, i * CELL)
    ctx.stroke()
  }

  // 食物（红色圆点）
  if (food) {
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // 蛇（蛇头深绿，身体蓝绿）
  snake.forEach((s, i) => {
    const x = s.x * CELL
    const y = s.y * CELL
    ctx.fillStyle = i === 0 ? '#059669' : '#10b981'
    ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
  })
}

function onKeydown(e) {
  const k = e.key
  const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
  const wasd = { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] }

  if (arrows[k]) {
    e.preventDefault()
    setDirection(...arrows[k])
  } else if (wasd[k]) {
    e.preventDefault()
    setDirection(...wasd[k])
  } else if (k === ' ') {
    e.preventDefault()
    if (gameState.value === 'ready' || gameState.value === 'over') start()
    else togglePause()
  } else if (k === 'Enter') {
    if (gameState.value === 'ready' || gameState.value === 'over') start()
  }
}

onMounted(async () => {
  ctx = canvasRef.value.getContext('2d')
  highScore.value = await getHighScore()
  reset()
  draw()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="snake-page">
    <div class="snake-card">
      <div class="snake-header">
        <div>
          <h2 class="title">贪吃蛇</h2>
          <p class="hint">方向键 / WASD 控制方向 · 空格暂停 · Enter 开始</p>
        </div>
        <div class="scores">
          <div class="score-box">
            <span class="label">本局得分</span>
            <span class="num">{{ score }}</span>
          </div>
          <div class="score-box">
            <span class="label">最高分</span>
            <span class="num gold">{{ highScore }}</span>
          </div>
        </div>
      </div>

      <div class="canvas-wrap">
        <canvas ref="canvasRef" :width="SIZE" :height="SIZE" class="canvas"></canvas>

        <div v-if="gameState !== 'playing'" class="overlay">
          <template v-if="gameState === 'ready'">
            <div class="overlay-title">准备好了吗？</div>
            <el-button type="primary" size="large" @click="start">开始游戏</el-button>
          </template>

          <template v-else-if="gameState === 'paused'">
            <div class="overlay-title">已暂停</div>
            <el-button type="primary" size="large" @click="resume">继续</el-button>
          </template>

          <template v-else-if="gameState === 'over'">
            <div class="overlay-title">游戏结束</div>
            <div class="overlay-score">本局得分：{{ score }}</div>
            <div v-if="beatRecord" class="overlay-new">🎉 新纪录！</div>
            <el-button type="primary" size="large" @click="start">再来一局</el-button>
          </template>
        </div>
      </div>

      <div class="controls">
        <span class="ctrl-cell"></span>
        <el-button circle class="ctrl-btn" @click="setDirection(0, -1)">↑</el-button>
        <span class="ctrl-cell"></span>
        <el-button circle class="ctrl-btn" @click="setDirection(-1, 0)">←</el-button>
        <el-button circle class="ctrl-btn" @click="setDirection(0, 1)">↓</el-button>
        <el-button circle class="ctrl-btn" @click="setDirection(1, 0)">→</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.snake-page {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

.snake-card {
  background: var(--card);
  border-radius: 16px;
  padding: 24px 28px 28px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.snake-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
}

.hint {
  font-size: 13px;
  color: var(--text-2);
  margin: 0;
}

.scores {
  display: flex;
  gap: 12px;
}

.score-box {
  background: var(--bg);
  border-radius: 10px;
  padding: 8px 16px;
  text-align: center;
  min-width: 88px;
}

.score-box .label {
  display: block;
  font-size: 12px;
  color: var(--text-2);
}

.score-box .num {
  display: block;
  font-size: 22px;
  font-weight: 700;
}

.score-box .num.gold {
  color: var(--brand-dark);
}

.canvas-wrap {
  position: relative;
  line-height: 0;
}

.canvas {
  border-radius: 10px;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.82);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.overlay-title {
  font-size: 18px;
  font-weight: 600;
}

.overlay-score {
  font-size: 15px;
  color: var(--text-2);
}

.overlay-new {
  font-size: 15px;
  color: var(--brand-dark);
  font-weight: 600;
}

.controls {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  grid-template-rows: repeat(2, 44px);
  gap: 8px;
  margin-top: 20px;
}

.ctrl-cell {
  visibility: hidden;
}

.ctrl-btn {
  font-size: 18px;
}
</style>
