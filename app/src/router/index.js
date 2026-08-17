import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BillsView from '../views/BillsView.vue'
import StatsView from '../views/StatsView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView, meta: { title: '首页' } },
  { path: '/bills', name: 'bills', component: BillsView, meta: { title: '账单' } },
  { path: '/stats', name: 'stats', component: StatsView, meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: SettingsView, meta: { title: '设置' } }
]

// 使用 hash 路由，未来打包进 Electron（file:// 协议）也能正常跳转
export default createRouter({
  history: createWebHashHistory(),
  routes
})
