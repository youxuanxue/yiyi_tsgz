<template>
  <div class="container">
    <!-- 用户形象和当前MBTI类型 -->
    <div class="main-card">
      <div class="avatar-section">
        <div class="avatar-placeholder">{{ avatar }}</div>
      </div>
      
      <div class="mbti-display" :class="{ 'type-switch': typeSwitchClass }">
        <div class="mbti-type" :style="{ color: mbtiColor }">
          {{ currentMBTI }}
        </div>
        <div class="mbti-description">{{ mbtiDescription }}</div>
      </div>
      
      <!-- 四维度展示 -->
      <div class="dimensions">
        <div class="dimension-item" v-for="dim in dimensions" :key="dim.key">
          <div class="dimension-header">
            <span class="dimension-icon">{{ dim.icon }}</span>
            <span class="dimension-name">{{ dim.name }}</span>
          </div>
          <div class="dimension-bar">
            <div 
              class="dimension-fill" 
              :style="{ width: dim.percentage + '%', background: dim.color }"
            ></div>
          </div>
          <div class="dimension-value">{{ dim.value > 0 ? '+' : '' }}{{ dim.value }}</div>
        </div>
      </div>
    </div>
    
    <!-- 快速入口 -->
    <div class="quick-actions">
      <router-link to="/challenge" class="action-card">
        <span class="action-icon">🎯</span>
        <span class="action-text">今日挑战</span>
      </router-link>
      <router-link to="/statistics" class="action-card">
        <span class="action-icon">📊</span>
        <span class="action-text">性格趋势</span>
      </router-link>
    </div>
    
    <!-- 本周概览 -->
    <div class="card weekly-preview" v-if="weeklyStats.mainType">
      <div class="subtitle">本周主要类型</div>
      <div class="weekly-main-type" :style="{ color: weeklyStats.mainTypeColor }">
        {{ weeklyStats.mainType }}
      </div>
      <div class="weekly-description">{{ weeklyStats.mainTypeDesc }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserData } from '../composables/useUserData'
import { 
  getMBTIDescription, 
  getMBTIColor, 
  getDimensionIcon, 
  getDimensionName 
} from '../utils/mbtiEngine'

const router = useRouter()
const { getUserData, calculateWeeklyStats } = useUserData()

const avatar = ref('👤')
const currentMBTI = ref('INFP')
const mbtiDescription = ref('')
const mbtiColor = ref('#6C5CE7')
const dimensions = ref([])
const typeSwitchClass = ref(false)
const weeklyStats = ref({})

const loadUserData = () => {
  const userData = getUserData()
  if (!userData) {
    router.push('/profile')
    return
  }

  const oldMBTI = currentMBTI.value
  currentMBTI.value = userData.currentMBTI || userData.initialMBTI
  mbtiDescription.value = getMBTIDescription(currentMBTI.value)
  mbtiColor.value = getMBTIColor(currentMBTI.value)
  avatar.value = userData.avatar || '👤'

  // 处理维度数据
  const dimensionKeys = ['EI', 'SN', 'TF', 'JP']
  dimensions.value = dimensionKeys.map(key => {
    const value = userData.dimensions[key] || 0
    const percentage = Math.abs(value)
    const color = value >= 0 ? '#6C5CE7' : '#FF6B6B'
    
    return {
      key,
      name: getDimensionName(key),
      icon: getDimensionIcon(key),
      value: Math.round(value),
      percentage,
      color
    }
  })

  // 计算每周统计
  const stats = calculateWeeklyStats(userData)
  const mainTypeColor = getMBTIColor(stats.mainType)
  const mainTypeDesc = getMBTIDescription(stats.mainType)

  weeklyStats.value = {
    ...stats,
    mainTypeColor,
    mainTypeDesc
  }

  // 检查类型是否变化
  if (oldMBTI && oldMBTI !== currentMBTI.value) {
    typeSwitchClass.value = true
    setTimeout(() => {
      typeSwitchClass.value = false
    }, 600)
  }
}

onMounted(() => {
  loadUserData()
})

// 监听路由变化，返回时刷新数据
watch(() => router.currentRoute.value.path, (newPath) => {
  if (newPath === '/') {
    loadUserData()
  }
})
</script>

<style scoped>
.main-card {
  background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
  border-radius: 30px;
  padding: 60px 40px;
  margin-bottom: 30px;
  color: #FFFFFF;
  text-align: center;
}

.avatar-section {
  margin-bottom: 40px;
}

.avatar-placeholder {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 100px;
  margin: 0 auto;
  border: 6px solid rgba(255, 255, 255, 0.3);
}

.mbti-display {
  margin-bottom: 50px;
}

.mbti-type {
  font-size: 120px;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: 8px;
}

.mbti-description {
  font-size: 18px;
  opacity: 0.9;
  line-height: 1.6;
}

.dimensions {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 30px;
  margin-top: 40px;
}

.dimension-item {
  margin-bottom: 30px;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dimension-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 18px;
}

.dimension-icon {
  font-size: 24px;
  margin-right: 12px;
}

.dimension-name {
  font-size: 16px;
  opacity: 0.9;
}

.dimension-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.dimension-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.dimension-value {
  font-size: 14px;
  opacity: 0.8;
  text-align: right;
}

.quick-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.action-card {
  flex: 1;
  background: #FFFFFF;
  border-radius: 20px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.action-text {
  font-size: 18px;
  color: #2D3436;
  font-weight: 500;
}

.weekly-preview {
  text-align: center;
}

.weekly-main-type {
  font-size: 64px;
  font-weight: 700;
  margin: 20px 0;
  letter-spacing: 6px;
}

.weekly-description {
  font-size: 16px;
  color: #636E72;
  line-height: 1.6;
}

@media (max-width: 480px) {
  .main-card {
    padding: 40px 20px;
  }
  
  .mbti-type {
    font-size: 80px;
  }
  
  .avatar-placeholder {
    width: 150px;
    height: 150px;
    font-size: 80px;
  }
}
</style>

