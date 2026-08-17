<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { records, formatMoney } from '../store/data'

const periodMode = ref('month') // month | year
const nowForPeriod = new Date()
const periodValue = ref(`${nowForPeriod.getFullYear()}-${String(nowForPeriod.getMonth() + 1).padStart(2, '0')}`)

const periodRecords = computed(() => {
  return records.filter((r) => {
    if (periodMode.value === 'month') return r.date.startsWith(periodValue.value)
    return r.date.startsWith(periodValue.value)
  })
})

const income = computed(() => periodRecords.value.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0))
const expense = computed(() => periodRecords.value.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0))
const balance = computed(() => income.value - expense.value)

const pieData = computed(() => {
  const map = {}
  periodRecords.value.filter((r) => r.type === 'expense').forEach((r) => {
    map[r.categoryL1] = (map[r.categoryL1] || 0) + r.amount
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
})

const barData = computed(() => {
  const d = new Date()
  const keys = []
  for (let i = 5; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth() - i, 1)
    keys.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`)
  }
  const incomeArr = keys.map((m) => records.filter((r) => r.type === 'income' && r.date.startsWith(m)).reduce((s, r) => s + r.amount, 0))
  const expenseArr = keys.map((m) => records.filter((r) => r.type === 'expense' && r.date.startsWith(m)).reduce((s, r) => s + r.amount, 0))
  return {
    months: keys.map((m) => m.slice(5) + '月'),
    income: incomeArr,
    expense: expenseArr
  }
})

const pieRef = ref(null)
const barRef = ref(null)
let pieChart = null
let barChart = null

function renderCharts() {
  if (pieRef.value) {
    if (!pieChart) pieChart = echarts.init(pieRef.value)
    pieChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}<br/>¥{c}（{d}%）' },
      legend: { bottom: 0, type: 'scroll' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { formatter: '{b} {d}%' },
          data: pieData.value.length ? pieData.value : [{ name: '暂无支出', value: 1 }]
        }
      ]
    })
  }
  if (barRef.value) {
    if (!barChart) barChart = echarts.init(barRef.value)
    barChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['收入', '支出'], top: 0 },
      grid: { left: 55, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: barData.value.months },
      yAxis: { type: 'value' },
      series: [
        { name: '收入', type: 'bar', data: barData.value.income, itemStyle: { color: '#16a34a', borderRadius: [4, 4, 0, 0] } },
        { name: '支出', type: 'bar', data: barData.value.expense, itemStyle: { color: '#ef4444', borderRadius: [4, 4, 0, 0] } }
      ]
    })
  }
}

function onResize() {
  pieChart && pieChart.resize()
  barChart && barChart.resize()
}

watch(periodMode, (m) => {
  const d = new Date()
  periodValue.value = m === 'month'
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    : `${d.getFullYear()}`
})

watch([periodMode, periodValue, () => records.length], () => {
  renderCharts()
})

onMounted(() => {
  renderCharts()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  pieChart && pieChart.dispose()
  barChart && barChart.dispose()
})
</script>

<template>
  <div>
    <h2 class="page-title">统计</h2>

    <div class="controls card">
      <el-radio-group v-model="periodMode">
        <el-radio-button value="month">月度</el-radio-button>
        <el-radio-button value="year">年度</el-radio-button>
      </el-radio-group>
      <el-date-picker
        v-if="periodMode === 'month'"
        v-model="periodValue"
        type="month"
        value-format="YYYY-MM"
        format="YYYY年MM月"
        :clearable="false"
        style="width: 160px"
      />
      <el-date-picker
        v-else
        v-model="periodValue"
        type="year"
        value-format="YYYY"
        format="YYYY年"
        :clearable="false"
        style="width: 160px"
      />
    </div>

    <div class="summary">
      <div class="stat card">
        <div class="stat-label">收入</div>
        <div class="stat-value money-income">¥ {{ formatMoney(income) }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">支出</div>
        <div class="stat-value money-expense">¥ {{ formatMoney(expense) }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">结余</div>
        <div class="stat-value" :class="balance >= 0 ? 'money-income' : 'money-expense'">¥ {{ formatMoney(balance) }}</div>
      </div>
    </div>

    <div class="charts">
      <div class="card chart-card">
        <div class="chart-title">支出分类占比</div>
        <div ref="pieRef" class="chart"></div>
      </div>
      <div class="card chart-card">
        <div class="chart-title">近 6 个月收支趋势</div>
        <div ref="barRef" class="chart"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-label { color: var(--text-2); font-size: 14px; margin-bottom: 10px; }
.stat-value { font-size: 24px; font-weight: 700; }
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-title { font-weight: 600; margin-bottom: 8px; }
.chart { height: 340px; }
</style>
