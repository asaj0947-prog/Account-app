<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { categories, addCategory, addSubcategory, removeCategory, removeSubcategory, exportCsv, importCsv, clearData, downloadTemplate } from '../store/data'

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

async function onExport() {
  try {
    const res = await exportCsv()
    if (res && res.canceled) return
    ElMessage.success(`已导出 ${res.count} 条账单`)
  } catch (e) {
    ElMessage.error((e && e.message) || '导出失败')
  }
}

async function onDownloadTemplate() {
  try {
    const res = await downloadTemplate()
    if (res && res.canceled) return
    ElMessage.success('模板已保存')
  } catch (e) {
    ElMessage.error((e && e.message) || '保存模板失败')
  }
}

async function onImport() {
  try {
    const res = await importCsv()
    if (res && res.canceled) return
    if (res.totalErrors > 0) {
      const detail = res.errors.slice(0, 5).join('\n') + (res.errors.length > 5 ? '\n……' : '')
      ElMessageBox.alert(`成功导入 ${res.imported} 条，跳过 ${res.skipped} 条。\n\n${detail}`, '导入完成', { type: 'warning' })
    } else {
      ElMessage.success(`成功导入 ${res.imported} 条账单`)
    }
  } catch (e) {
    ElMessage.error((e && e.message) || '导入失败')
  }
}

function onClear() {
  ElMessageBox.confirm('确定要清空所有账单吗？分类会保留，此操作无法撤销。', '清空确认', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await clearData('records')
        ElMessage.success(`已清空 ${res.cleared} 条账单`)
      } catch (e) {
        ElMessage.error((e && e.message) || '清空失败')
      }
    })
    .catch(() => {})
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
      <div class="sub">数据保存在本机。可以把账单导出成 CSV（Excel、WPS 都能打开），也可以把整理好的 CSV 导入进来。</div>

      <div class="data-btns">
        <el-button type="primary" @click="onExport">导出 CSV</el-button>
        <el-button @click="onDownloadTemplate">下载导入模板</el-button>
        <el-button @click="onImport">导入 CSV</el-button>
        <el-button type="danger" plain @click="onClear">清空账单</el-button>
      </div>

      <div class="import-format">
        <div class="format-title">导入文件的格式（每行一条账单，共 6 列）</div>
        <div class="format-line">类型 · 金额 · 一级分类 · 二级分类 · 日期 · 备注</div>
        <ul class="format-list">
          <li>类型：只能填「支出」或「收入」</li>
          <li>金额：数字，例如 25.50</li>
          <li>一级分类、二级分类：必须和软件里已有的分类完全一致</li>
          <li>日期：年-月-日，例如 2026-08-17</li>
          <li>备注：可留空</li>
        </ul>
        <div class="format-tip">建议先点「下载导入模板」，照着模板填；模板里的两行示例导入前请删掉。</div>
      </div>
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
.data-btns { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.import-format {
  margin-top: 16px;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: 8px;
  font-size: 13px;
}
.format-title { font-weight: 600; }
.format-line { color: var(--text-2); margin: 4px 0 8px; }
.format-list { margin: 0; padding-left: 18px; color: var(--text-2); line-height: 1.9; }
.format-tip { margin-top: 8px; color: var(--text-2); }
</style>
