<template>
  <div id="app">
    <router-view />
    <nav class="tab-bar">
      <router-link to="/" class="tab-item">
        <span class="tab-icon">🏠</span>
        <span class="tab-text">主页</span>
      </router-link>
      <router-link to="/challenge" class="tab-item">
        <span class="tab-icon">🎯</span>
        <span class="tab-text">挑战</span>
      </router-link>
      <router-link to="/statistics" class="tab-item">
        <span class="tab-icon">📊</span>
        <span class="tab-text">统计</span>
      </router-link>
      <router-link to="/profile" class="tab-item">
        <span class="tab-icon">👤</span>
        <span class="tab-text">我的</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUserData } from './composables/useUserData'

const { initUserData, checkWeeklyRegression } = useUserData()

onMounted(() => {
  // 初始化用户数据
  initUserData()
  // 检查每周回归
  checkWeeklyRegression()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  padding-bottom: 60px; /* 为底部导航栏留出空间 */
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #FFFFFF;
  border-top: 1px solid #E9ECEF;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  text-decoration: none;
  color: #7A7E83;
  transition: all 0.3s;
}

.tab-item.router-link-active {
  color: #6C5CE7;
}

.tab-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.tab-text {
  font-size: 12px;
}
</style>

