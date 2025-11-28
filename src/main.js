import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 导入页面组件
import Index from './pages/Index.vue'
import Challenge from './pages/Challenge.vue'
import Statistics from './pages/Statistics.vue'
import Profile from './pages/Profile.vue'

// 路由配置
const routes = [
  { path: '/', component: Index },
  { path: '/challenge', component: Challenge },
  { path: '/statistics', component: Statistics },
  { path: '/profile', component: Profile }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 创建应用
const app = createApp(App)
app.use(router)
app.mount('#app')

