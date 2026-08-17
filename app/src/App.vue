<script setup>
import RecordDialog from './components/RecordDialog.vue'
import { openRecord } from './store/data'

const menu = [
  { path: '/', label: '首页', icon: 'HomeFilled' },
  { path: '/bills', label: '账单', icon: 'Document' },
  { path: '/stats', label: '统计', icon: 'DataAnalysis' },
  { path: '/settings', label: '设置', icon: 'Setting' }
]
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">一</span>
        <span class="logo-text">一新记账</span>
      </div>

      <nav class="menu">
        <router-link
          v-for="item in menu"
          :key="item.path"
          :to="item.path"
          class="menu-item"
          active-class="active"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <el-button type="primary" size="large" class="record-btn" @click="openRecord('expense')">
          <el-icon><Plus /></el-icon>&nbsp;记一笔
        </el-button>
      </div>
    </aside>

    <main class="main">
      <router-view />
    </main>

    <RecordDialog />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
}

.logo-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #10b981, #14b8a6);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 17px;
  font-weight: 700;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border-radius: 9px;
  color: var(--text-2);
  text-decoration: none;
  font-size: 15px;
  transition: all 0.15s;
}

.menu-item:hover {
  background: var(--bg);
  color: var(--text);
}

.menu-item.active {
  background: var(--brand-light);
  color: var(--brand-dark);
  font-weight: 600;
}

.sidebar-footer {
  padding-top: 12px;
}

.record-btn {
  width: 100%;
  border-radius: 9px;
}

.main {
  flex: 1;
  overflow: auto;
  padding: 24px 28px;
}
</style>
