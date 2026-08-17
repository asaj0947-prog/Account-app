<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { records, categories, formatMoney, openRecord, removeRecord } from '../store/data'

const typeFilter = ref('all')
const catFilter = ref('')
const keyword = ref('')

const l1Options = computed(() => {
  return categories.filter((c) => typeFilter.value === 'all' || c.type === typeFilter.value)
})

const filtered = computed(() => {
  return records.filter((r) => {
    if (typeFilter.value !== 'all' && r.type !== typeFilter.value) return false
    if (catFilter.value && r.categoryL1 !== catFilter.value) return false
    if (keyword.value) {
      const k = keyword.value.trim()
      const hit = (r.categoryL1 + r.categoryL2 + (r.note || '')).includes(k)
      if (!hit) return false
    }
    return true
  })
})

const totalIncome = computed(() => filtered.value.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0))
const totalExpense = computed(() => filtered.value.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0))

function catIcon(rec) {
  const c = categories.find((x) => x.type === rec.type && x.name === rec.categoryL1)
  return c ? c.icon : 'MoreFilled'
}

function onEdit(r) {
  openRecord(r.type, r)
}

function onDelete(r) {
  ElMessageBox.confirm(`确定删除这笔「${r.categoryL2} ¥${formatMoney(r.amount)}」吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      removeRecord(r.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<template>
  <div>
    <h2 class="page-title">账单</h2>

    <div class="filters card">
      <el-radio-group v-model="typeFilter" @change="catFilter = ''">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="expense">支出</el-radio-button>
        <el-radio-button value="income">收入</el-radio-button>
      </el-radio-group>

      <el-select v-model="catFilter" placeholder="按一级分类筛选" clearable style="width: 180px">
        <el-option v-for="c in l1Options" :key="c.name" :label="c.name" :value="c.name" />
      </el-select>

      <el-input v-model="keyword" placeholder="搜索分类或备注" clearable style="width: 220px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <div class="filter-summary">
      共 {{ filtered.length }} 笔 · 收入 ¥{{ formatMoney(totalIncome) }} · 支出 ¥{{ formatMoney(totalExpense) }}
    </div>

    <div class="card list">
      <div v-if="filtered.length === 0" class="empty">没有符合条件的记录</div>

      <div v-for="r in filtered" :key="r.id" class="row">
        <div class="row-icon">
          <el-icon><component :is="catIcon(r)" /></el-icon>
        </div>
        <div class="row-main">
          <div class="row-cat">{{ r.categoryL1 }} · {{ r.categoryL2 }}</div>
          <div class="row-note">{{ r.note || '无备注' }}</div>
        </div>
        <div class="row-date">{{ r.date }}</div>
        <div class="row-amount" :class="r.type === 'income' ? 'money-income' : 'money-expense'">
          {{ r.type === 'income' ? '+' : '-' }}¥{{ formatMoney(r.amount) }}
        </div>
        <div class="row-actions">
          <el-button link type="primary" @click="onEdit(r)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(r)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.filter-summary {
  color: var(--text-2);
  font-size: 13px;
  margin-bottom: 12px;
}
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--border);
}
.row:last-child { border-bottom: none; }
.row-icon {
  width: 40px;
  height: 40px;
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
.row-date { color: var(--text-2); font-size: 13px; }
.row-amount { font-size: 16px; width: 110px; text-align: right; }
.row-actions { width: 110px; text-align: right; }
.empty { color: var(--text-2); text-align: center; padding: 40px 0; }
</style>
