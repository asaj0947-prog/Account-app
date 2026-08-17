<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { records, categories, formatMoney, openRecord } from '../store/data'

const router = useRouter()

const now = new Date()
const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
const todayText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekday}`
const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

const monthRecords = computed(() => records.filter((r) => r.date.startsWith(ym)))
const income = computed(() => monthRecords.value.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0))
const expense = computed(() => monthRecords.value.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0))
const balance = computed(() => income.value - expense.value)

const recent = computed(() => records.slice(0, 8))

function catIcon(rec) {
  const c = categories.find((x) => x.type === rec.type && x.name === rec.categoryL1)
  return c ? c.icon : 'MoreFilled'
}
</script>

<template>
  <div>
    <div class="head">
      <div>
        <div class="hello">你好 👋</div>
        <div class="today">{{ todayText }}</div>
      </div>
    </div>

    <div class="summary">
      <div class="stat card">
        <div class="stat-label">本月收入</div>
        <div class="stat-value money-income">¥ {{ formatMoney(income) }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">本月支出</div>
        <div class="stat-value money-expense">¥ {{ formatMoney(expense) }}</div>
      </div>
      <div class="stat card">
        <div class="stat-label">本月结余</div>
        <div class="stat-value" :class="balance >= 0 ? 'money-income' : 'money-expense'">¥ {{ formatMoney(balance) }}</div>
      </div>
    </div>

    <div class="quick card">
      <span class="quick-tip">快速记一笔：</span>
      <el-button class="qbtn-expense" @click="openRecord('expense')">记支出</el-button>
      <el-button class="qbtn-income" @click="openRecord('income')">记收入</el-button>
    </div>

    <div class="card recent">
      <div class="recent-head">
        <span class="recent-title">最近记录</span>
        <el-link type="primary" @click="router.push('/bills')">查看全部 ›</el-link>
      </div>

      <div v-if="recent.length === 0" class="empty">还没有记录，点上方「记一笔」开始吧～</div>

      <div v-for="r in recent" :key="r.id" class="row">
        <div class="row-icon">
          <el-icon><component :is="catIcon(r)" /></el-icon>
        </div>
        <div class="row-main">
          <div class="row-cat">{{ r.categoryL1 }} · {{ r.categoryL2 }}</div>
          <div class="row-note">{{ r.note || r.date }}</div>
        </div>
        <div class="row-amount" :class="r.type === 'income' ? 'money-income' : 'money-expense'">
          {{ r.type === 'income' ? '+' : '-' }}¥{{ formatMoney(r.amount) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.head { margin-bottom: 18px; }
.hello { font-size: 24px; font-weight: 700; }
.today { color: var(--text-2); margin-top: 4px; }

.summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.stat-label { color: var(--text-2); font-size: 14px; margin-bottom: 10px; }
.stat-value { font-size: 24px; font-weight: 700; }

.quick {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.quick-tip { color: var(--text-2); }
.qbtn-expense { background: #fef2f2; color: var(--expense); border-color: #fecaca; }
.qbtn-income { background: #f0fdf4; color: var(--income); border-color: #bbf7d0; }

.recent-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.recent-title { font-weight: 600; }

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--border);
}
.row:last-child { border-bottom: none; }
.row-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--brand-light);
  color: var(--brand-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.row-main { flex: 1; }
.row-cat { font-size: 15px; font-weight: 500; }
.row-note { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.row-amount { font-size: 16px; }
.empty { color: var(--text-2); text-align: center; padding: 30px 0; }
</style>
