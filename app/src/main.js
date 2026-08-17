import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { init } from './store/data'
import './styles.css'

const app = createApp(App)

// 注册全部 Element Plus 图标，方便在页面里直接按名字使用
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(ElementPlus)
app.use(router)

// 先加载数据（Electron 从 SQLite 读，浏览器用模拟数据），再渲染界面
init()
  .then(() => app.mount('#app'))
  .catch((e) => {
    console.error('数据加载失败：', e)
    app.mount('#app')
  })
