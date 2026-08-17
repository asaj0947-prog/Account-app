<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { categories, addCategory, addSubcategory, removeCategory, removeSubcategory } from '../store/data'

const activeType = ref('expense')
const newL1 = ref('')
const l2Inputs = reactive({})

const list = computed(() => categories.filter((c) => c.type === activeType.value))

async function addL1() {
  const name = newL1.value.trim()
  if (!name) return ElMessage.warning('请输入分类名')
  if (list.value.some((c) => c.name === name)) return ElMessage.warning('分类已存在')
  try {
    await addCategory(activeType.value, name)
    newL1.value = ''
    ElMessage.success('已添加')
  } catch (e) {
    ElMessage.error((e && e.message) || '添加失败')
  }
}

function removeL1(name) {
  ElMessageBox.confirm(`删除一级分类「${name}」会连同它的二级分类一起删除，确定吗？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        await removeCategory(name)
        ElMessage.success('已删除')
      } catch (e) {
        ElMessage.error((e && e.message) || '删除失败')
      }
    })
    .catch(() => {})
}

async function addL2(l1Name) {
  const name = (l2Inputs[l1Name] || '').trim()
  if (!name) return ElMessage.warning('请输入分类名')
  const c = list.value.find((x) => x.name === l1Name)
  if (c && c.children.includes(name)) return ElMessage.warning('分类已存在')
  try {
    await addSubcategory(l1Name, name)
    l2Inputs[l1Name] = ''
    ElMessage.success('已添加')
  } catch (e) {
    ElMessage.error((e && e.message) || '添加失败')
  }
}

async function removeL2(l1Name, name) {
  try {
    await removeSubcategory(l1Name, name)
  } catch (e) {
    ElMessage.error((e && e.message) || '删除失败')
  }
}
</script>

<template>
  <div>
    <h2 class="page-title">设置</h2>

    <div class="card">
      <div class="block-title">分类管理</div>
      <div class="sub">收入、支出各有一套分类，可随时新增、删除。改动的分类会应用到「记一笔」的选择里。</div>

      <el-radio-group v-model="activeType" style="margin: 14px 0">
        <el-radio-button value="expense">支出分类</el-radio-button>
        <el-radio-button value="income">收入分类</el-radio-button>
      </el-radio-group>

      <div class="add-l1">
        <el-input v-model="newL1" placeholder="新增一级分类，如「旅行」" style="width: 280px" @keyup.enter="addL1">
          <template #append><el-button @click="addL1">添加</el-button></template>
        </el-input>
      </div>

      <div v-for="c in list" :key="c.name" class="l1-group">
        <div class="l1-head">
          <span class="l1-name">{{ c.name }}</span>
          <span class="l1-count">{{ c.children.length }} 个小类</span>
          <el-button link type="danger" @click="removeL1(c.name)">删除</el-button>
        </div>
        <div class="l2-wrap">
          <el-tag
            v-for="name in c.children"
            :key="name"
            closable
            class="l2-tag"
            @close="removeL2(c.name, name)"
          >{{ name }}</el-tag>
          <el-input
            v-model="l2Inputs[c.name]"
            size="small"
            placeholder="新增小类"
            style="width: 140px"
            @keyup.enter="addL2(c.name)"
          >
            <template #append><el-button size="small" @click="addL2(c.name)">+</el-button></template>
          </el-input>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <div class="block-title">数据管理</div>
      <div class="sub">数据保存在本机。数据备份、导出 Excel 等功能将在后续版本提供。</div>
    </div>
  </div>
</template>

<style scoped>
.block-title { font-size: 17px; font-weight: 600; }
.sub { color: var(--text-2); font-size: 13px; margin-top: 6px; }
.add-l1 { margin-bottom: 16px; }
.l1-group {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.l1-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.l1-name { font-weight: 600; font-size: 15px; }
.l1-count { color: var(--text-2); font-size: 12px; }
.l2-wrap { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.l2-tag { border-radius: 6px; }
</style>
