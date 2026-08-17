<script setup>
import { reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { categories, ui, addRecord, updateRecord, today } from '../store/data'

const form = reactive({
  type: 'expense',
  amount: null,
  categoryL1: '',
  categoryL2: '',
  date: today(),
  note: ''
})

const l1List = computed(() => categories.filter((c) => c.type === form.type))
const l2List = computed(() => {
  const c = l1List.value.find((x) => x.name === form.categoryL1)
  return c ? c.children : []
})

function setType(t) {
  form.type = t
  const l1 = categories.filter((c) => c.type === t)
  form.categoryL1 = l1[0]?.name || ''
  form.categoryL2 = l1[0]?.children[0] || ''
}

function pickL1(c) {
  form.categoryL1 = c.name
  form.categoryL2 = c.children[0] || ''
}

function initForm() {
  const src = ui.editingRecord
  form.type = src ? src.type : ui.recordDialogType
  const l1 = categories.filter((c) => c.type === form.type)
  form.categoryL1 = src ? src.categoryL1 : (l1[0]?.name || '')
  const l2 = l1.find((c) => c.name === form.categoryL1)?.children || []
  form.categoryL2 = src ? src.categoryL2 : (l2[0] || '')
  form.amount = src ? src.amount : null
  form.date = src ? src.date : today()
  form.note = src ? src.note : ''
}

watch(
  () => ui.recordDialogVisible,
  (v) => { if (v) initForm() }
)

function save() {
  if (!form.amount || Number(form.amount) <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }
  if (!form.categoryL2) {
    ElMessage.warning('请选择分类')
    return
  }
  const payload = {
    type: form.type,
    amount: Number(form.amount),
    categoryL1: form.categoryL1,
    categoryL2: form.categoryL2,
    date: form.date,
    note: form.note || ''
  }
  if (ui.editingRecord) {
    updateRecord(ui.editingRecord.id, payload)
    ElMessage.success('已更新')
  } else {
    addRecord(payload)
    ElMessage.success('已记录')
  }
  ui.recordDialogVisible = false
}
</script>

<template>
  <el-dialog
    v-model="ui.recordDialogVisible"
    :title="ui.editingRecord ? '编辑账单' : '记一笔'"
    width="440px"
    align-center
    destroy-on-close
  >
    <div class="type-toggle">
      <div class="type-btn expense" :class="{ on: form.type === 'expense' }" @click="setType('expense')">支出</div>
      <div class="type-btn income" :class="{ on: form.type === 'income' }" @click="setType('income')">收入</div>
    </div>

    <div class="amount-row">
      <span class="amount-symbol">¥</span>
      <el-input-number
        v-model="form.amount"
        :min="0.01"
        :max="99999999.99"
        :precision="2"
        :controls="false"
        placeholder="0.00"
        class="amount-input"
      />
    </div>

    <div class="cat-block">
      <div class="cat-label">一级分类</div>
      <div class="chips">
        <div
          v-for="c in l1List"
          :key="c.name"
          class="chip"
          :class="{ on: form.categoryL1 === c.name }"
          @click="pickL1(c)"
        >{{ c.name }}</div>
      </div>
    </div>

    <div class="cat-block">
      <div class="cat-label">二级分类</div>
      <div class="chips">
        <div
          v-for="name in l2List"
          :key="name"
          class="chip"
          :class="{ on: form.categoryL2 === name }"
          @click="form.categoryL2 = name"
        >{{ name }}</div>
      </div>
    </div>

    <div class="field-row">
      <div class="cat-label">日期</div>
      <el-date-picker
        v-model="form.date"
        type="date"
        value-format="YYYY-MM-DD"
        format="YYYY年MM月DD日"
        style="width: 100%"
      />
    </div>

    <div class="field-row">
      <div class="cat-label">备注</div>
      <el-input v-model="form.note" maxlength="50" placeholder="备注（可选）" clearable />
    </div>

    <template #footer>
      <el-button @click="ui.recordDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.type-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.type-btn {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 9px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid var(--border);
  color: var(--text-2);
  transition: all 0.15s;
}

.type-btn.expense.on {
  background: #fef2f2;
  border-color: var(--expense);
  color: var(--expense);
}

.type-btn.income.on {
  background: #f0fdf4;
  border-color: var(--income);
  color: var(--income);
}

.amount-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.amount-symbol {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
}

.amount-input {
  flex: 1;
}

.amount-input :deep(.el-input__inner) {
  font-size: 26px;
  font-weight: 700;
  height: 48px;
}

.cat-block {
  margin-bottom: 16px;
}

.cat-label {
  font-size: 13px;
  color: var(--text-2);
  margin-bottom: 8px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--brand);
  color: var(--brand-dark);
}

.chip.on {
  background: var(--brand-light);
  border-color: var(--brand);
  color: var(--brand-dark);
  font-weight: 600;
}

.field-row {
  margin-bottom: 16px;
}
</style>
